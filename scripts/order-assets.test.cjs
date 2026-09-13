const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const zlib = require('node:zlib');
const ts = require('typescript');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

const root = path.resolve(__dirname, '..');
const assets = loadTypeScriptModule('src/lib/order-assets.ts');

const imageBytes = {
	jpeg: Uint8Array.from(fs.readFileSync(path.join(root, 'public', 'featured-work', 'custom-leather-wallet-set.jpg'))),
	png: Uint8Array.from(fs.readFileSync(path.join(root, 'public', 'belt-icon.png'))),
};

function crc32(bytes) {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit += 1) {
			crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
	const typeBytes = Buffer.from(type, 'ascii');
	const payload = Buffer.from(data);
	const chunk = Buffer.alloc(12 + payload.length);
	chunk.writeUInt32BE(payload.length, 0);
	typeBytes.copy(chunk, 4);
	payload.copy(chunk, 8);
	chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, payload])), 8 + payload.length);
	return chunk;
}

function makePng({
	width = 1,
	height = 1,
	bitDepth = 8,
	colorType = 6,
	compressionMethod = 0,
	filterMethod = 0,
	interlaceMethod = 0,
	beforeData = [],
	rawImageData = Buffer.from([0, 0, 0, 0, 255]),
	afterData = [],
} = {}) {
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header[8] = bitDepth;
	header[9] = colorType;
	header[10] = compressionMethod;
	header[11] = filterMethod;
	header[12] = interlaceMethod;
	return Uint8Array.from(Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		pngChunk('IHDR', header),
		...beforeData,
		pngChunk('IDAT', zlib.deflateSync(rawImageData)),
		...afterData,
		pngChunk('IEND'),
	]));
}

function loadRouteModule(relativeFile, mocks, moduleCache = new Map()) {
	const absoluteFile = path.resolve(root, relativeFile);
	if (!fs.existsSync(absoluteFile)) {
		throw new Error(`Unable to resolve route module: ${relativeFile}`);
	}
	if (moduleCache.has(absoluteFile)) return moduleCache.get(absoluteFile).exports;

	const module = { exports: {} };
	moduleCache.set(absoluteFile, module);
	const javascript = ts.transpileModule(fs.readFileSync(absoluteFile, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
		fileName: absoluteFile,
	}).outputText;
	const localRequire = (request) => {
		if (Object.hasOwn(mocks, request)) return mocks[request];
		if (request.startsWith('.') || request.startsWith('@/')) {
			const basePath = request.startsWith('@/')
				? path.resolve(root, 'src', request.slice(2))
				: path.resolve(path.dirname(absoluteFile), request);
			const candidate = [basePath, `${basePath}.ts`, path.join(basePath, 'index.ts')]
				.find((file) => fs.existsSync(file));
			if (!candidate) throw new Error(`Unable to resolve route dependency: ${request}`);
			return loadRouteModule(path.relative(root, candidate), mocks, moduleCache);
		}
		return require(request);
	};
	const execute = new vm.Script(
		`(function (exports, module, require) {\n${javascript}\n})`,
		{ filename: absoluteFile },
	).runInThisContext();
	execute(module.exports, module, localRequire);
	return module.exports;
}

let runtimeEnv;
const routeMocks = {
	'@opennextjs/cloudflare': {
		getCloudflareContext: () => ({ env: runtimeEnv }),
	},
};

test('accepts only structurally validated JPEG and PNG files up to 8 MB', () => {
	for (const type of ['image/jpeg', 'image/png']) {
		assert.equal(
			assets.validateReferenceFile({ name: 'idea.image', type, size: 8 * 1024 * 1024 }).ok,
			true,
		);
	}

	assert.equal(
		assets.validateReferenceFile({ name: 'idea.pdf', type: 'application/pdf', size: 20 }).ok,
		false,
	);
	for (const type of ['image/webp', 'image/heic']) {
		assert.equal(assets.validateReferenceFile({ name: 'idea.image', type, size: 20 }).ok, false);
	}
	assert.equal(
		assets.validateReferenceFile({ name: 'large.jpg', type: 'image/jpeg', size: 8 * 1024 * 1024 + 1 }).ok,
		false,
	);
});

test('signed tokens round-trip and reject changes', async () => {
	const token = await assets.createAssetToken('order-assets/abc/photo.jpg', 'secret');
	assert.match(token, /^[A-Za-z0-9_-]+$/);
	assert.equal(await assets.verifyAssetToken(token, 'secret'), 'order-assets/abc/photo.jpg');
	assert.equal(await assets.verifyAssetToken(`${token}x`, 'secret'), null);
	assert.equal(await assets.verifyAssetToken(token, 'different-secret'), null);

	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	const lastValue = alphabet.indexOf(token.at(-1));
	const nonCanonicalAlias = `${token.slice(0, -1)}${alphabet[lastValue | 1]}`;
	assert.notEqual(nonCanonicalAlias, token);
	assert.equal(await assets.verifyAssetToken(nonCanonicalAlias, 'secret'), null);
});

test('accepts genuine JPEG and PNG images but rejects signatures, truncation, corruption, and trailing payloads', async () => {
	assert.equal(await assets.detectReferenceContentType(imageBytes.jpeg), 'image/jpeg');
	assert.equal(await assets.detectReferenceContentType(imageBytes.png), 'image/png');
	assert.equal(await assets.detectReferenceContentType(new Uint8Array()), null);
	assert.equal(await assets.detectReferenceContentType(new TextEncoder().encode('<html>')), null);
	for (const fixture of [
		Uint8Array.from([0xff, 0xd8, 0xff]),
		Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		imageBytes.jpeg.slice(0, -1),
		imageBytes.png.slice(0, -1),
		Uint8Array.from([...imageBytes.jpeg, ...new TextEncoder().encode('<script>')]),
		Uint8Array.from([...imageBytes.png, ...new TextEncoder().encode('<script>')]),
	]) {
		assert.equal(await assets.detectReferenceContentType(fixture), null);
	}
	const corruptPng = imageBytes.png.slice();
	corruptPng[corruptPng.length - 5] ^= 0xff;
	assert.equal(await assets.detectReferenceContentType(corruptPng), null);
});

test('rejects CRC-correct PNGs with invalid IHDR, palette, chunk, or decompressed scanline semantics', async () => {
	const red = Buffer.from([255, 0, 0]);
	const green = Buffer.from([0, 255, 0]);
	const blue = Buffer.from([0, 0, 255]);
	const malformed = [
		makePng({ filterMethod: 1 }),
		makePng({ colorType: 3, bitDepth: 1, rawImageData: Buffer.from([0, 0]) }),
		makePng({ colorType: 0, bitDepth: 8, beforeData: [pngChunk('PLTE', red)], rawImageData: Buffer.from([0, 0]) }),
		makePng({ beforeData: [pngChunk('abca', Buffer.from([1]))] }),
		makePng({ rawImageData: Buffer.from([5, 0, 0, 0, 255]) }),
		makePng({ rawImageData: Buffer.from([0, 0, 0, 0]) }),
		makePng({ rawImageData: Buffer.from([0, 0, 0, 0, 255, 99]) }),
		makePng({
			colorType: 3,
			bitDepth: 1,
			beforeData: [pngChunk('PLTE', Buffer.concat([red, green, blue]))],
			rawImageData: Buffer.from([0, 0]),
		}),
		makePng({
			colorType: 3,
			bitDepth: 1,
			beforeData: [pngChunk('PLTE', red), pngChunk('PLTE', green)],
			rawImageData: Buffer.from([0, 0]),
		}),
	];

	for (const fixture of malformed) {
		assert.equal(await assets.detectReferenceContentType(fixture), null);
	}
});

test('rejects CRC-correct PNG tRNS ordering and transparent samples outside the bit-depth range', async () => {
	const grayscaleSampleBeyondFourBits = Buffer.alloc(2);
	grayscaleSampleBeyondFourBits.writeUInt16BE(16);
	const truecolorSampleBeyondEightBits = Buffer.alloc(6);
	truecolorSampleBeyondEightBits.writeUInt16BE(256);

	const malformed = [
		makePng({
			colorType: 2,
			bitDepth: 8,
			beforeData: [
				pngChunk('tRNS', Buffer.alloc(6)),
				pngChunk('PLTE', Buffer.from([255, 0, 0])),
			],
			rawImageData: Buffer.from([0, 0, 0, 0]),
		}),
		makePng({
			colorType: 0,
			bitDepth: 4,
			beforeData: [pngChunk('tRNS', grayscaleSampleBeyondFourBits)],
			rawImageData: Buffer.from([0, 0]),
		}),
		makePng({
			colorType: 2,
			bitDepth: 8,
			beforeData: [pngChunk('tRNS', truecolorSampleBeyondEightBits)],
			rawImageData: Buffer.from([0, 0, 0, 0]),
		}),
	];

	assert.deepEqual(
		await Promise.all(malformed.map((fixture) => assets.detectReferenceContentType(fixture))),
		[null, null, null],
	);
});

test('creates opaque order keys with canonical extensions', () => {
	const key = assets.createReferenceKey('image/jpeg');
	assert.match(
		key,
		/^order-assets\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/,
	);
	assert.notEqual(assets.createReferenceKey('image/jpeg'), key);
	assert.throws(() => assets.createReferenceKey('application/pdf'));
});

test('sanitizes filenames used in response headers', () => {
	assert.equal(assets.safeResponseFilename('../../idea\r\nX-Evil: yes.jpg'), 'ideaX-Evil_ yes.jpg');
	assert.equal(assets.safeResponseFilename('my "idea".png'), 'my _idea_.png');
	assert.equal(assets.safeResponseFilename('..'), 'reference-image');
	assert.equal(assets.canonicalReferenceFilename('../../idea.exe', 'image/jpeg'), 'idea.jpg');
});

test('serves verified objects with private inline response headers', async () => {
	const { GET } = loadRouteModule('src/app/api/order-assets/[token]/route.ts', routeMocks);
	const key = 'order-assets/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg';
	const token = await assets.createAssetToken(key, 'route-secret');
	const gets = [];
	runtimeEnv = {
		ORDER_ASSET_TOKEN_SECRET: 'route-secret',
		ORDER_ASSETS: {
			get: async (requestedKey) => {
				gets.push(requestedKey);
				return {
					body: 'private-image',
					httpMetadata: { contentType: 'image/jpeg' },
					customMetadata: { originalName: '../../my\r\nphoto.png' },
				};
			},
		},
	};

	const response = await GET(new Request(`https://example.com/api/order-assets/${token}`), {
		params: Promise.resolve({ token }),
	});

	assert.equal(response.status, 200);
	assert.deepEqual(gets, [key]);
	assert.equal(await response.text(), 'private-image');
	assert.equal(response.headers.get('Content-Type'), 'image/jpeg');
	assert.equal(response.headers.get('Content-Disposition'), 'inline; filename="myphoto.jpg"');
	assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
	assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
	assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
});

test('serves signed private order manifests with no-store, noindex, and nosniff headers', async () => {
	const { GET } = loadRouteModule('src/app/api/order-assets/[token]/route.ts', routeMocks);
	const key = 'order-manifests/sandbox/123e4567-e89b-42d3-a456-426614174000.json';
	const token = await assets.createAssetToken(key, 'route-secret');
	runtimeEnv = {
		ORDER_ASSET_TOKEN_SECRET: 'route-secret',
		ORDER_ASSETS: {
			get: async () => ({
				body: JSON.stringify({ orderReference: 'TCL-123E4567-E89B42D3' }),
				httpMetadata: { contentType: 'application/json' },
				customMetadata: { recordType: 'custom-order-manifest' },
			}),
		},
	};

	const response = await GET(new Request(`https://example.com/api/order-assets/${token}`), {
		params: Promise.resolve({ token }),
	});

	assert.equal(response.status, 200);
	assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
	assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
	assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
	assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
	assert.deepEqual(await response.json(), { orderReference: 'TCL-123E4567-E89B42D3' });
});

test('hides objects whose metadata is absent, malicious, or mismatched with the signed key', async () => {
	const { GET } = loadRouteModule('src/app/api/order-assets/[token]/route.ts', routeMocks);
	const key = 'order-assets/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg';
	const token = await assets.createAssetToken(key, 'route-secret');
	const metadataValues = [undefined, 'text/html', 'image/png'];
	const bodies = [];

	for (const contentType of metadataValues) {
		runtimeEnv = {
			ORDER_ASSET_TOKEN_SECRET: 'route-secret',
			ORDER_ASSETS: {
				get: async () => ({
					body: 'untrusted-object',
					httpMetadata: contentType ? { contentType } : undefined,
					customMetadata: { originalName: 'photo.jpg' },
				}),
			},
		};
		const response = await GET(new Request(`https://example.com/api/order-assets/${token}`), {
			params: Promise.resolve({ token }),
		});
		assert.equal(response.status, 404);
		assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
		bodies.push(await response.text());
	}
	runtimeEnv = {
		ORDER_ASSET_TOKEN_SECRET: 'route-secret',
		ORDER_ASSETS: { get: async () => null },
	};
	const missingResponse = await GET(new Request(`https://example.com/api/order-assets/${token}`), {
		params: Promise.resolve({ token }),
	});
	assert.equal(missingResponse.status, 404);
	bodies.push(await missingResponse.text());
	assert.equal(new Set(bodies).size, 1);
});

test('returns indistinguishable 404 responses for invalid tokens and missing objects', async () => {
	const { GET } = loadRouteModule('src/app/api/order-assets/[token]/route.ts', routeMocks);
	const missingKey = 'order-assets/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg';
	const validToken = await assets.createAssetToken(missingKey, 'route-secret');
	const gets = [];
	runtimeEnv = {
		ORDER_ASSET_TOKEN_SECRET: 'route-secret',
		ORDER_ASSETS: {
			get: async (key) => {
				gets.push(key);
				return null;
			},
		},
	};

	const invalidResponse = await GET(new Request('https://example.com/api/order-assets/invalid'), {
		params: Promise.resolve({ token: 'invalid' }),
	});
	const missingResponse = await GET(new Request(`https://example.com/api/order-assets/${validToken}`), {
		params: Promise.resolve({ token: validToken }),
	});

	assert.equal(invalidResponse.status, 404);
	assert.equal(missingResponse.status, 404);
	assert.equal(await invalidResponse.text(), await missingResponse.text());
	assert.equal(invalidResponse.headers.get('X-Content-Type-Options'), 'nosniff');
	assert.deepEqual(gets, [missingKey]);
});

test('upload rollback reports a release exception and skips deletion to preserve the reservation', async (t) => {
	const security = loadTypeScriptModule('src/lib/order-security.ts');
	const { POST } = loadRouteModule('src/app/api/order-assets/route.ts', routeMocks);
	const now = Date.now();
	const claims = { intentId: '123e4567-e89b-42d3-a456-426614174111', issuedAt: now, expiresAt: now + 300_000 };
	const token = await security.createOrderIntentToken(claims, 'intent-secret');
	let state = {
		version: 2, ...claims, uploadKeys: [], checkoutState: 'available', checkoutAttemptId: null,
		checkoutFingerprint: null, checkoutOwnerId: null, checkoutLeaseExpiresAt: null,
	};
	let etag = 'intent-1';
	let putCount = 0;
	const deletes = [];
	const warnings = [];
	const previousWarn = console.warn;
	console.warn = (message) => { warnings.push(JSON.parse(String(message))); };
	t.after(() => { console.warn = previousWarn; });
	runtimeEnv = {
		ORDER_INTENT_TOKEN_SECRET: 'intent-secret',
		ORDER_ASSET_TOKEN_SECRET: 'asset-secret',
		ORDER_UPLOAD_RATE_LIMITER: { limit: async () => ({ success: true }) },
		IMAGES: { info: async () => { throw new Error('image service failed'); } },
		ORDER_ASSETS: {
			get: async () => ({ etag, json: async () => structuredClone(state) }),
			put: async (_key, body) => {
				putCount += 1;
				if (putCount > 1) throw new Error('release storage failed');
				state = JSON.parse(String(body));
				etag = 'intent-2';
				return { etag };
			},
			delete: async (key) => { deletes.push(key); },
		},
	};
	const form = new FormData();
	form.append('files', new File([imageBytes.jpeg], 'sketch.jpg', { type: 'image/jpeg' }));
	const upload = new Request('https://example.com/api/order-assets', {
		method: 'POST',
		headers: {
			'Content-Length': String(imageBytes.jpeg.length + 512),
			'CF-Connecting-IP': '203.0.113.12',
			Authorization: `Bearer ${token}`,
		},
		body: form,
	});

	const response = await POST(upload);
	const rollback = warnings.find(({ event }) => event === 'order_upload_rolled_back');
	assert.equal(response.status, 500);
	assert.equal(rollback.releaseOutcome, 'exception');
	assert.deepEqual({
		attempted: rollback.deleteAttempted,
		succeeded: rollback.deleteSucceeded,
		failed: rollback.deleteFailed,
		skipped: rollback.deleteSkipped,
	}, { attempted: 0, succeeded: 0, failed: 0, skipped: 1 });
	assert.deepEqual(deletes, []);
	assert.equal(state.uploadKeys.length, 1);
});
