export const MAX_REFERENCE_FILES = 3;
export const MAX_REFERENCE_BYTES = 8 * 1024 * 1024;
export const ALLOWED_REFERENCE_TYPES = new Set([
	'image/jpeg',
	'image/png',
]);

const EXTENSION_BY_CONTENT_TYPE: Readonly<Record<string, string>> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
};
const CONTENT_TYPE_BY_EXTENSION: Readonly<Record<string, string>> = Object.fromEntries(
	Object.entries(EXTENSION_BY_CONTENT_TYPE).map(([contentType, extension]) => [extension, contentType]),
);
const HMAC_BYTES = 32;
const TOKEN_SEPARATOR = '.'.charCodeAt(0);
const UUID_V4_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const REFERENCE_KEY_PATTERN = new RegExp(`^order-assets/${UUID_V4_PATTERN}/${UUID_V4_PATTERN}\\.(?:jpg|png)$`, 'u');
const TEMPORARY_REFERENCE_KEY_PATTERN = new RegExp(`^order-uploads/${UUID_V4_PATTERN}/${UUID_V4_PATTERN}\\.jpg$`, 'u');
const MANIFEST_KEY_PATTERN = new RegExp(`^order-manifests/(?:sandbox|production)/${UUID_V4_PATTERN}\\.json$`, 'u');

export interface ReferenceFileDescription {
	name: string;
	type: string;
	size: number;
}

export type ReferenceFileValidation =
	| { ok: true }
	| { ok: false; error: string };

export function validateReferenceFile(file: ReferenceFileDescription): ReferenceFileValidation {
	if (!ALLOWED_REFERENCE_TYPES.has(file.type)) {
		return { ok: false, error: 'Reference images must be JPEG or PNG files.' };
	}

	if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_REFERENCE_BYTES) {
		return { ok: false, error: 'Each reference image must be non-empty and 8 MB or smaller.' };
	}

	return { ok: true };
}

function matchesBytes(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
	return expected.every((byte, index) => bytes[offset + index] === byte);
}

function readUint16(bytes: Uint8Array, offset: number): number {
	return bytes[offset] * 0x100 + bytes[offset + 1];
}

function readUint32(bytes: Uint8Array, offset: number): number {
	return (
		bytes[offset] * 0x1000000
		+ bytes[offset + 1] * 0x10000
		+ bytes[offset + 2] * 0x100
		+ bytes[offset + 3]
	) >>> 0;
}

function isStructurallyValidJpeg(bytes: Uint8Array): boolean {
	if (bytes.length < 4 || !matchesBytes(bytes, 0, [0xff, 0xd8])) return false;
	let offset = 2;
	let sawStartOfFrame = false;
	let sawStartOfScan = false;

	while (offset < bytes.length) {
		if (bytes[offset] !== 0xff) return false;
		const markerStart = offset;
		while (bytes[offset] === 0xff) offset += 1;
		if (offset >= bytes.length) return false;
		const marker = bytes[offset];
		offset += 1;

		if (marker === 0xd9) return sawStartOfFrame && sawStartOfScan && offset === bytes.length;
		if (marker === 0x00 || marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) return false;
		if (offset + 2 > bytes.length) return false;
		const segmentLength = readUint16(bytes, offset);
		if (segmentLength < 2 || offset + segmentLength > bytes.length) return false;
		const segmentEnd = offset + segmentLength;

		const isStartOfFrame = (
			marker >= 0xc0
			&& marker <= 0xcf
			&& ![0xc4, 0xc8, 0xcc].includes(marker)
		);
		if (isStartOfFrame) {
			if (segmentLength < 11) return false;
			const height = readUint16(bytes, offset + 3);
			const width = readUint16(bytes, offset + 5);
			const components = bytes[offset + 7];
			if (!width || !height || !components || segmentLength !== 8 + components * 3) return false;
			sawStartOfFrame = true;
		}

		if (marker !== 0xda) {
			offset = segmentEnd;
			continue;
		}

		const scanComponents = bytes[offset + 2];
		if (!sawStartOfFrame || !scanComponents || segmentLength !== 6 + scanComponents * 2) return false;
		sawStartOfScan = true;
		offset = segmentEnd;
		while (offset < bytes.length) {
			if (bytes[offset] !== 0xff) {
				offset += 1;
				continue;
			}
			let next = offset + 1;
			while (next < bytes.length && bytes[next] === 0xff) next += 1;
			if (next >= bytes.length) return false;
			if (bytes[next] === 0x00 || (bytes[next] >= 0xd0 && bytes[next] <= 0xd7)) {
				offset = next + 1;
				continue;
			}
			break;
		}
		if (offset === markerStart) return false;
	}

	return false;
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
	let crc = 0xffffffff;
	for (let index = start; index < end; index += 1) {
		crc ^= bytes[index];
		for (let bit = 0; bit < 8; bit += 1) {
			crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

const MAX_DECOMPRESSED_PNG_BYTES = 64 * 1024 * 1024;
const PNG_CHANNELS_BY_COLOR_TYPE: Readonly<Record<number, number>> = {
	0: 1,
	2: 3,
	3: 1,
	4: 2,
	6: 4,
};
const PNG_ALLOWED_DEPTHS: Readonly<Record<number, readonly number[]>> = {
	0: [1, 2, 4, 8, 16],
	2: [8, 16],
	3: [1, 2, 4, 8],
	4: [8, 16],
	6: [8, 16],
};
const ADAM7_PASSES = [
	{ xStart: 0, yStart: 0, xStep: 8, yStep: 8 },
	{ xStart: 4, yStart: 0, xStep: 8, yStep: 8 },
	{ xStart: 0, yStart: 4, xStep: 4, yStep: 8 },
	{ xStart: 2, yStart: 0, xStep: 4, yStep: 4 },
	{ xStart: 0, yStart: 2, xStep: 2, yStep: 4 },
	{ xStart: 1, yStart: 0, xStep: 2, yStep: 2 },
	{ xStart: 0, yStart: 1, xStep: 1, yStep: 2 },
] as const;

interface PngDescription {
	width: number;
	height: number;
	bitDepth: number;
	colorType: number;
	interlaceMethod: 0 | 1;
	paletteEntries: number;
	idatChunks: Uint8Array[];
}

function parsePng(bytes: Uint8Array): PngDescription | null {
	if (bytes.length < 45 || !matchesBytes(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return null;
	let offset = 8;
	let header: Omit<PngDescription, 'paletteEntries' | 'idatChunks'> | undefined;
	let paletteEntries = 0;
	let sawPalette = false;
	let sawTransparency = false;
	let sawData = false;
	let dataEnded = false;
	const idatChunks: Uint8Array[] = [];

	while (offset + 12 <= bytes.length) {
		const length = readUint32(bytes, offset);
		const typeOffset = offset + 4;
		const dataOffset = typeOffset + 4;
		const crcOffset = dataOffset + length;
		const chunkEnd = crcOffset + 4;
		if (chunkEnd > bytes.length) return null;
		const typeBytes = bytes.slice(typeOffset, dataOffset);
		const type = String.fromCharCode(...typeBytes);
		if (
			!/^[A-Za-z]{4}$/u.test(type)
			|| (typeBytes[2] & 0x20) !== 0
			|| readUint32(bytes, crcOffset) !== crc32(bytes, typeOffset, crcOffset)
		) return null;

		if (!header) {
			if (type !== 'IHDR' || length !== 13) return null;
			const width = readUint32(bytes, dataOffset);
			const height = readUint32(bytes, dataOffset + 4);
			const bitDepth = bytes[dataOffset + 8];
			const colorType = bytes[dataOffset + 9];
			const interlaceMethod = bytes[dataOffset + 12];
			if (
				!width || !height
				|| width > 0x7fffffff || height > 0x7fffffff
				|| !PNG_ALLOWED_DEPTHS[colorType]?.includes(bitDepth)
				|| bytes[dataOffset + 10] !== 0
				|| bytes[dataOffset + 11] !== 0
				|| (interlaceMethod !== 0 && interlaceMethod !== 1)
			) return null;
			header = { width, height, bitDepth, colorType, interlaceMethod };
			offset = chunkEnd;
			continue;
		}

		if (type === 'IHDR') return null;
		if (type === 'PLTE') {
			if (
				sawPalette || sawTransparency || sawData
				|| header.colorType === 0 || header.colorType === 4
				|| length === 0 || length > 768 || length % 3 !== 0
			) return null;
			paletteEntries = length / 3;
			if (header.colorType === 3 && paletteEntries > 2 ** header.bitDepth) return null;
			sawPalette = true;
		}

		if (type === 'tRNS') {
			if (sawTransparency || sawData) return null;
			const sampleLimit = 2 ** header.bitDepth;
			if (
				(header.colorType === 0 && (length !== 2 || readUint16(bytes, dataOffset) >= sampleLimit))
				|| (
					header.colorType === 2
					&& (
						length !== 6
						|| [0, 2, 4].some((channelOffset) => (
							readUint16(bytes, dataOffset + channelOffset) >= sampleLimit
						))
					)
				)
				|| (header.colorType === 3 && (!sawPalette || length === 0 || length > paletteEntries))
				|| header.colorType === 4
				|| header.colorType === 6
			) return null;
			sawTransparency = true;
		}

		if (type === 'IDAT') {
			if (dataEnded || (header.colorType === 3 && !sawPalette)) return null;
			sawData = true;
			idatChunks.push(bytes.slice(dataOffset, crcOffset));
		} else if (sawData && type !== 'IEND') {
			dataEnded = true;
		}

		if (type === 'IEND') {
			if (
				length !== 0 || !sawData || chunkEnd !== bytes.length
				|| (header.colorType === 3 && !sawPalette)
			) return null;
			return { ...header, paletteEntries, idatChunks };
		}
		if ((typeBytes[0] & 0x20) === 0 && !['PLTE', 'IDAT'].includes(type)) return null;
		offset = chunkEnd;
	}

	return null;
}

function passSize(fullSize: number, start: number, step: number): number {
	return fullSize <= start ? 0 : Math.ceil((fullSize - start) / step);
}

function pngPasses(description: PngDescription): Array<{ width: number; height: number }> {
	if (description.interlaceMethod === 0) {
		return [{ width: description.width, height: description.height }];
	}
	return ADAM7_PASSES.map(({ xStart, yStart, xStep, yStep }) => ({
		width: passSize(description.width, xStart, xStep),
		height: passSize(description.height, yStart, yStep),
	})).filter(({ width, height }) => width > 0 && height > 0);
}

function expectedPngDataLength(description: PngDescription): number | null {
	const channels = PNG_CHANNELS_BY_COLOR_TYPE[description.colorType];
	if (!channels) return null;
	const bitsPerPixel = channels * description.bitDepth;
	let total = 0;
	for (const pass of pngPasses(description)) {
		const rowBytes = Math.ceil(pass.width * bitsPerPixel / 8);
		total += pass.height * (rowBytes + 1);
		if (!Number.isSafeInteger(total) || total > MAX_DECOMPRESSED_PNG_BYTES) return null;
	}
	return total;
}

async function inflatePngData(compressed: Uint8Array, expectedLength: number): Promise<Uint8Array | null> {
	try {
		const compressedCopy = new Uint8Array(compressed.length);
		compressedCopy.set(compressed);
		const stream = new Blob([compressedCopy.buffer]).stream().pipeThrough(new DecompressionStream('deflate'));
		const reader = stream.getReader();
		const inflated = new Uint8Array(expectedLength);
		let total = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (total + value.length > expectedLength) {
				await reader.cancel();
				return null;
			}
			inflated.set(value, total);
			total += value.length;
		}
		if (total !== expectedLength) return null;
		return inflated;
	} catch {
		return null;
	}
}

function paethPredictor(left: number, above: number, upperLeft: number): number {
	const prediction = left + above - upperLeft;
	const leftDistance = Math.abs(prediction - left);
	const aboveDistance = Math.abs(prediction - above);
	const upperLeftDistance = Math.abs(prediction - upperLeft);
	if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
	return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function paletteSamplesAreValid(
	row: Uint8Array,
	pixelWidth: number,
	bitDepth: number,
	paletteEntries: number,
): boolean {
	const mask = (1 << bitDepth) - 1;
	for (let pixel = 0; pixel < pixelWidth; pixel += 1) {
		const bitOffset = pixel * bitDepth;
		const sample = (row[Math.floor(bitOffset / 8)] >> (8 - bitDepth - (bitOffset % 8))) & mask;
		if (sample >= paletteEntries) return false;
	}
	return true;
}

function validatePngScanlines(description: PngDescription, inflated: Uint8Array): boolean {
	const channels = PNG_CHANNELS_BY_COLOR_TYPE[description.colorType];
	const bitsPerPixel = channels * description.bitDepth;
	const filterBytesPerPixel = Math.max(1, Math.ceil(bitsPerPixel / 8));
	let offset = 0;

	for (const pass of pngPasses(description)) {
		const rowBytes = Math.ceil(pass.width * bitsPerPixel / 8);
		let previousRow = new Uint8Array(rowBytes);
		for (let rowIndex = 0; rowIndex < pass.height; rowIndex += 1) {
			const filter = inflated[offset];
			if (filter > 4) return false;
			offset += 1;
			const filtered = inflated.subarray(offset, offset + rowBytes);
			if (filtered.length !== rowBytes) return false;
			offset += rowBytes;
			const reconstructed = new Uint8Array(rowBytes);
			for (let index = 0; index < rowBytes; index += 1) {
				const left = index >= filterBytesPerPixel ? reconstructed[index - filterBytesPerPixel] : 0;
				const above = previousRow[index] ?? 0;
				const upperLeft = index >= filterBytesPerPixel ? previousRow[index - filterBytesPerPixel] : 0;
				let predictor = 0;
				if (filter === 1) predictor = left;
				if (filter === 2) predictor = above;
				if (filter === 3) predictor = Math.floor((left + above) / 2);
				if (filter === 4) predictor = paethPredictor(left, above, upperLeft);
				reconstructed[index] = (filtered[index] + predictor) & 0xff;
			}
			if (
				description.colorType === 3
				&& !paletteSamplesAreValid(reconstructed, pass.width, description.bitDepth, description.paletteEntries)
			) return false;
			previousRow = reconstructed;
		}
	}
	return offset === inflated.length;
}

async function isStructurallyValidPng(bytes: Uint8Array): Promise<boolean> {
	const description = parsePng(bytes);
	if (!description) return false;
	const expectedLength = expectedPngDataLength(description);
	if (expectedLength === null) return false;
	const compressedLength = description.idatChunks.reduce((total, chunk) => total + chunk.length, 0);
	const compressed = new Uint8Array(compressedLength);
	let offset = 0;
	for (const chunk of description.idatChunks) {
		compressed.set(chunk, offset);
		offset += chunk.length;
	}
	const inflated = await inflatePngData(compressed, expectedLength);
	return inflated !== null && validatePngScanlines(description, inflated);
}

export async function detectReferenceContentType(
	input: ArrayBuffer | Uint8Array,
): Promise<string | null> {
	const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
	if (isStructurallyValidJpeg(bytes)) return 'image/jpeg';
	if (await isStructurallyValidPng(bytes)) return 'image/png';
	return null;
}

export function createReferenceKey(contentType: string): string {
	const extension = EXTENSION_BY_CONTENT_TYPE[contentType];
	if (!extension) {
		throw new Error('Unsupported reference image type.');
	}

	return `order-assets/${crypto.randomUUID()}/${crypto.randomUUID()}.${extension}`;
}

export function createTemporaryReferenceKey(intentId: string): string {
	const key = `order-uploads/${intentId}/${crypto.randomUUID()}.jpg`;
	if (!TEMPORARY_REFERENCE_KEY_PATTERN.test(key)) throw new Error('Invalid order intent ID.');
	return key;
}

export function createAttachedReferenceKey(checkoutAttemptId: string, temporaryKey: string): string {
	const fileId = temporaryKey.match(/\/([0-9a-f-]{36})\.jpg$/u)?.[1];
	const key = fileId ? `order-assets/${checkoutAttemptId}/${fileId}.jpg` : '';
	if (!REFERENCE_KEY_PATTERN.test(key)) throw new Error('Invalid attached reference image identity.');
	return key;
}

export function createManifestKey(
	checkoutAttemptId: string,
	environment: 'sandbox' | 'production',
): string {
	const key = `order-manifests/${environment}/${checkoutAttemptId}.json`;
	if (!MANIFEST_KEY_PATTERN.test(key)) throw new Error('Invalid checkout attempt ID.');
	return key;
}

export function isCanonicalReferenceKey(key: string): boolean {
	return REFERENCE_KEY_PATTERN.test(key);
}

export function isCanonicalTemporaryReferenceKey(key: string): boolean {
	return TEMPORARY_REFERENCE_KEY_PATTERN.test(key);
}

export function isCanonicalManifestKey(key: string): boolean {
	return MANIFEST_KEY_PATTERN.test(key);
}

export function contentTypeFromCanonicalKey(key: string): string | null {
	if (!isCanonicalReferenceKey(key) && !isCanonicalTemporaryReferenceKey(key)) return null;
	const extension = key.match(/\.([a-z0-9]+)$/u)?.[1];
	return extension ? CONTENT_TYPE_BY_EXTENSION[extension] ?? null : null;
}

function encodeBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function decodeBase64Url(value: string): Uint8Array | null {
	if (!value || !/^[A-Za-z0-9_-]+$/u.test(value)) return null;

	try {
		const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
		const binary = atob(padded);
		return Uint8Array.from(binary, (character) => character.charCodeAt(0));
	} catch {
		return null;
	}
}

async function signKey(key: string, secret: string): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const signingKey = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	return new Uint8Array(await crypto.subtle.sign('HMAC', signingKey, encoder.encode(key)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
	let difference = left.length ^ right.length;
	const length = Math.max(left.length, right.length);
	for (let index = 0; index < length; index += 1) {
		difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
	}
	return difference === 0;
}

export async function createAssetToken(key: string, secret: string): Promise<string> {
	if (!key || !secret) throw new Error('Asset token key and secret are required.');

	const encodedKey = new TextEncoder().encode(key);
	const signature = await signKey(key, secret);
	const payload = new Uint8Array(encodedKey.length + 1 + signature.length);
	payload.set(encodedKey);
	payload[encodedKey.length] = TOKEN_SEPARATOR;
	payload.set(signature, encodedKey.length + 1);
	return encodeBase64Url(payload);
}

export async function verifyAssetToken(token: string, secret: string): Promise<string | null> {
	if (!secret) return null;

	const payload = decodeBase64Url(token);
	if (!payload || payload.length <= HMAC_BYTES + 1) return null;
	if (encodeBase64Url(payload) !== token) return null;

	const separatorIndex = payload.length - HMAC_BYTES - 1;
	if (payload[separatorIndex] !== TOKEN_SEPARATOR) return null;

	try {
		const key = new TextDecoder('utf-8', { fatal: true }).decode(payload.slice(0, separatorIndex));
		if (!key) return null;
		const suppliedSignature = payload.slice(separatorIndex + 1);
		const expectedSignature = await signKey(key, secret);
		return constantTimeEqual(suppliedSignature, expectedSignature) ? key : null;
	} catch {
		return null;
	}
}

export function safeResponseFilename(originalName: string | undefined): string {
	const basename = (originalName ?? '').split(/[\\/]/u).pop() ?? '';
	const safe = basename
		.replace(/[^\x20-\x7e]/gu, '')
		.replace(/["\\/:*?<>|;]/gu, '_')
		.replace(/^\.+|\.+$/gu, '')
		.trim()
		.slice(0, 180);
	return safe || 'reference-image';
}

export function canonicalReferenceFilename(originalName: string | undefined, contentType: string): string {
	const extension = EXTENSION_BY_CONTENT_TYPE[contentType];
	if (!extension) throw new Error('Unsupported reference image type.');
	const safeName = safeResponseFilename(originalName);
	const finalDot = safeName.lastIndexOf('.');
	const stem = (finalDot > 0 ? safeName.slice(0, finalDot) : safeName) || 'reference-image';
	return `${stem.slice(0, 179 - extension.length)}.${extension}`;
}
