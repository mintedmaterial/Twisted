import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
	OrderIntentStateError,
	readOrderIntentState,
	releaseOrderIntentUploads,
	reserveOrderIntentUploads,
} from '../../../lib/order-intent-state';
import { verifyOrderIntentToken } from '../../../lib/order-security';
import {
	canonicalReferenceFilename,
	createAssetToken,
	createTemporaryReferenceKey,
	isCanonicalTemporaryReferenceKey,
	MAX_REFERENCE_BYTES,
	MAX_REFERENCE_FILES,
	validateReferenceFile,
	verifyAssetToken,
} from '../../../lib/order-assets';

const MAX_MULTIPART_OVERHEAD_BYTES = 256 * 1024;
const MAX_REFERENCE_MULTIPART_BYTES = MAX_REFERENCE_FILES * MAX_REFERENCE_BYTES + MAX_MULTIPART_OVERHEAD_BYTES;
const MAX_SOURCE_DIMENSION = 12_000;
const MAX_SOURCE_PIXELS = 40_000_000;

export interface UploadedReference {
	name: string;
	url: string;
	contentType: 'image/jpeg';
}

class ImageValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ImageValidationError';
	}
}

function errorResponse(error: string, status: number): Response {
	return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function readContentLength(request: Request): number | null {
	const raw = request.headers.get('Content-Length');
	if (!raw || !/^\d+$/u.test(raw)) return null;
	const value = Number(raw);
	return Number.isSafeInteger(value) ? value : null;
}

function bearerToken(request: Request): string | null {
	const authorization = request.headers.get('Authorization');
	const match = authorization?.match(/^Bearer ([A-Za-z0-9_.-]+)$/u);
	return match?.[1] ?? null;
}

function validateImageInfo(info: ImageInfoResponse, file: File): void {
	if (
		!('fileSize' in info)
		|| info.format !== file.type
		|| info.fileSize !== file.size
		|| !Number.isSafeInteger(info.width)
		|| !Number.isSafeInteger(info.height)
		|| info.width < 1
		|| info.height < 1
		|| info.width > MAX_SOURCE_DIMENSION
		|| info.height > MAX_SOURCE_DIMENSION
		|| info.width * info.height > MAX_SOURCE_PIXELS
	) throw new ImageValidationError('Reference image dimensions or contents are not supported.');
}

export async function POST(request: Request): Promise<Response> {
	const contentType = request.headers.get('Content-Type')?.toLowerCase() ?? '';
	if (!contentType.startsWith('multipart/form-data; boundary=')) {
		return errorResponse('Upload reference images using multipart form data.', 415);
	}
	const contentLength = readContentLength(request);
	if (contentLength === null) return errorResponse('Reference image uploads require a content length.', 411);
	if (contentLength < 1 || contentLength > MAX_REFERENCE_MULTIPART_BYTES) {
		return errorResponse('The reference image upload is too large.', 413);
	}

	const { env } = getCloudflareContext();
	const intentSecret = env.ORDER_INTENT_TOKEN_SECRET?.trim();
	const assetSecret = env.ORDER_ASSET_TOKEN_SECRET?.trim();
	if (!env.ORDER_ASSETS || !env.IMAGES || !env.ORDER_UPLOAD_RATE_LIMITER || !intentSecret || !assetSecret) {
		return errorResponse('Reference image uploads are not configured yet.', 503);
	}
	const claims = await verifyOrderIntentToken(bearerToken(request), intentSecret);
	if (!claims) return errorResponse('Complete verification before uploading reference images.', 401);
	try {
		await readOrderIntentState(env.ORDER_ASSETS, claims);
	} catch (error) {
		if (error instanceof OrderIntentStateError) return errorResponse(error.message, error.status);
		return errorResponse('This order session is unavailable. Start again.', 400);
	}
	const visitorIp = request.headers.get('CF-Connecting-IP')?.trim();
	if (!visitorIp || visitorIp.length > 64) return errorResponse('Unable to verify this request.', 403);
	const rate = await env.ORDER_UPLOAD_RATE_LIMITER.limit({
		key: `order-upload:${visitorIp}:${claims.intentId}`,
	});
	if (!rate.success) return errorResponse('Please wait before uploading again.', 429);

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return errorResponse('Upload reference images using multipart form data.', 400);
	}
	const entries = Array.from(formData.entries());
	if (
		entries.length < 1
		|| entries.length > MAX_REFERENCE_FILES
		|| entries.some(([key, value]) => key !== 'files' || !(value instanceof File))
	) return errorResponse(`Attach between 1 and ${MAX_REFERENCE_FILES} reference-image files only.`, 400);
	const files = entries.map(([, value]) => value as File);
	for (const file of files) {
		const validation = validateReferenceFile(file);
		if (!validation.ok) return errorResponse(validation.error, 400);
	}

	const keys = files.map(() => createTemporaryReferenceKey(claims.intentId));
	try {
		await reserveOrderIntentUploads(env.ORDER_ASSETS, claims, keys);
	} catch (error) {
		if (error instanceof OrderIntentStateError) return errorResponse(error.message, error.status);
		return errorResponse('Unable to reserve reference image space right now.', 503);
	}

	try {
		const uploaded: UploadedReference[] = [];
		for (let index = 0; index < files.length; index += 1) {
			const file = files[index];
			const key = keys[index];
			const info = await env.IMAGES.info(file.stream());
			validateImageInfo(info, file);
			const transformed = await env.IMAGES
				.input(file.stream())
				.transform({ width: 6000, height: 6000, fit: 'scale-down' })
				.output({ format: 'image/jpeg', quality: 85, anim: false });
			const response = transformed.response();
			const outputLengthRaw = response.headers.get('Content-Length');
			const outputLength = outputLengthRaw && /^\d+$/u.test(outputLengthRaw) ? Number(outputLengthRaw) : 0;
			if (
				response.headers.get('Content-Type') !== 'image/jpeg'
				|| !response.body
				|| !Number.isSafeInteger(outputLength)
				|| outputLength < 1
				|| outputLength > MAX_REFERENCE_BYTES
			) throw new ImageValidationError('The processed reference image is not supported.');
			const name = canonicalReferenceFilename(file.name, 'image/jpeg');
			await env.ORDER_ASSETS.put(key, response.body, {
				httpMetadata: { contentType: 'image/jpeg' },
				customMetadata: {
					recordType: 'temporary-order-upload',
					intentId: claims.intentId,
					originalName: name,
				},
			});
			uploaded.push({
				name,
				contentType: 'image/jpeg',
				url: `/api/order-assets/${await createAssetToken(key, assetSecret)}`,
			});
		}
		return Response.json({ files: uploaded }, { headers: { 'Cache-Control': 'no-store' } });
	} catch (error) {
		let released = false;
		let releaseOutcome: 'released' | 'cas_miss' | 'exception' = 'cas_miss';
		try {
			released = await releaseOrderIntentUploads(env.ORDER_ASSETS, claims, keys);
			releaseOutcome = released ? 'released' : 'cas_miss';
		} catch {
			releaseOutcome = 'exception';
		}
		let cleanup: PromiseSettledResult<void>[] = [];
		if (released) {
			cleanup = await Promise.allSettled(keys.map(async (key) => env.ORDER_ASSETS.delete(key)));
		}
		const cleanupFailures = cleanup.filter((result) => result.status === 'rejected').length;
		console.warn(JSON.stringify({
			event: 'order_upload_rolled_back',
			intentId: claims.intentId,
			fileCount: keys.length,
			releaseOutcome,
			deleteAttempted: cleanup.length,
			deleteSucceeded: cleanup.length - cleanupFailures,
			deleteFailed: cleanupFailures,
			deleteSkipped: released ? 0 : keys.length,
			reason: error instanceof ImageValidationError ? 'image_validation' : 'storage_or_images_failure',
		}));
		if (error instanceof ImageValidationError) return errorResponse(error.message, 400);
		return errorResponse('Unable to upload reference images right now.', 500);
	}
}

export async function DELETE(request: Request): Promise<Response> {
	const contentType = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
	if (contentType !== 'application/json') return errorResponse('Reference removal requires JSON.', 415);
	const contentLength = readContentLength(request);
	if (contentLength === null) return errorResponse('Reference removal requires a content length.', 411);
	if (contentLength < 1 || contentLength > 4096) return errorResponse('Reference removal request is too large.', 413);

	const { env } = getCloudflareContext();
	const intentSecret = env.ORDER_INTENT_TOKEN_SECRET?.trim();
	const assetSecret = env.ORDER_ASSET_TOKEN_SECRET?.trim();
	if (!env.ORDER_ASSETS || !env.ORDER_UPLOAD_RATE_LIMITER || !intentSecret || !assetSecret) {
		return errorResponse('Reference image removal is not configured yet.', 503);
	}
	const claims = await verifyOrderIntentToken(bearerToken(request), intentSecret);
	if (!claims) return errorResponse('Complete verification before changing reference images.', 401);
	let stored;
	try {
		stored = await readOrderIntentState(env.ORDER_ASSETS, claims);
	} catch (error) {
		if (error instanceof OrderIntentStateError) return errorResponse(error.message, error.status);
		return errorResponse('This order session is unavailable. Start again.', 400);
	}
	const visitorIp = request.headers.get('CF-Connecting-IP')?.trim();
	if (!visitorIp || visitorIp.length > 64) return errorResponse('Unable to verify this request.', 403);
	const rate = await env.ORDER_UPLOAD_RATE_LIMITER.limit({
		key: `order-upload:${visitorIp}:${claims.intentId}`,
	});
	if (!rate.success) return errorResponse('Please wait before changing uploads again.', 429);

	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return errorResponse('Reference removal request must be valid JSON.', 400);
	}
	if (
		typeof input !== 'object'
		|| input === null
		|| Array.isArray(input)
		|| Object.keys(input).length !== 1
		|| typeof (input as { url?: unknown }).url !== 'string'
	) return errorResponse('Choose one uploaded reference image to remove.', 400);
	const url = (input as { url: string }).url;
	const match = url.match(/^\/api\/order-assets\/([A-Za-z0-9_-]+)$/u);
	const key = match ? await verifyAssetToken(match[1], assetSecret) : null;
	if (
		!key
		|| !isCanonicalTemporaryReferenceKey(key)
		|| !key.startsWith(`order-uploads/${claims.intentId}/`)
		|| !stored.state.uploadKeys.includes(key)
	) return errorResponse('That reference image is not part of this order session.', 404);

	try {
		const released = await releaseOrderIntentUploads(env.ORDER_ASSETS, claims, [key]);
		if (!released) {
			console.warn(JSON.stringify({
				event: 'order_upload_remove_failed',
				intentId: claims.intentId,
				releaseOutcome: 'cas_miss',
				deleteAttempted: 0,
				deleteSucceeded: 0,
				deleteFailed: 0,
			}));
			return errorResponse('The reference-image reservation changed. Try again.', 409);
		}
		try {
			await env.ORDER_ASSETS.delete(key);
		} catch {
			console.warn(JSON.stringify({
				event: 'order_upload_remove_failed',
				intentId: claims.intentId,
				releaseOutcome: 'released',
				deleteAttempted: 1,
				deleteSucceeded: 0,
				deleteFailed: 1,
			}));
			return errorResponse('Unable to remove the reference image right now.', 500);
		}
		return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
	} catch {
		console.warn(JSON.stringify({
			event: 'order_upload_remove_failed',
			intentId: claims.intentId,
			releaseOutcome: 'exception',
			deleteAttempted: 0,
			deleteSucceeded: 0,
			deleteFailed: 0,
		}));
		return errorResponse('Unable to remove the reference image right now.', 500);
	}
}
