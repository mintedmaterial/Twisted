import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createOrderIntentKey, createOrderIntentState } from '../../../lib/order-intent-state';
import { createOrderIntentToken, verifyTurnstile } from '../../../lib/order-security';

const MAX_ORDER_INTENT_BODY_BYTES = 4096;

function errorResponse(error: string, status: number): Response {
	return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function readContentLength(request: Request): number | null {
	const raw = request.headers.get('Content-Length');
	if (!raw || !/^\d+$/u.test(raw)) return null;
	const value = Number(raw);
	return Number.isSafeInteger(value) ? value : null;
}

export async function POST(request: Request): Promise<Response> {
	const contentType = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
	if (contentType !== 'application/json') return errorResponse('Order verification requires JSON.', 415);
	const contentLength = readContentLength(request);
	if (contentLength === null) return errorResponse('Order verification requires a content length.', 411);
	if (contentLength < 1 || contentLength > MAX_ORDER_INTENT_BODY_BYTES) {
		return errorResponse('Order verification request is too large.', 413);
	}

	const { env } = getCloudflareContext();
	const visitorIp = request.headers.get('CF-Connecting-IP')?.trim();
	if (!visitorIp || visitorIp.length > 64) return errorResponse('Unable to verify this request.', 403);
	if (!env.ORDER_INTENT_RATE_LIMITER) return errorResponse('Order verification is not configured.', 503);
	const rate = await env.ORDER_INTENT_RATE_LIMITER.limit({ key: `order-intent:${visitorIp}` });
	if (!rate.success) return errorResponse('Please wait before trying verification again.', 429);

	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return errorResponse('Order verification request must be valid JSON.', 400);
	}
	if (
		typeof input !== 'object'
		|| input === null
		|| Array.isArray(input)
		|| Object.keys(input).length !== 1
		|| typeof (input as { token?: unknown }).token !== 'string'
	) {
		return errorResponse('Complete the verification challenge and try again.', 400);
	}

	const turnstileSecret = env.TURNSTILE_SECRET_KEY?.trim();
	const intentSecret = env.ORDER_INTENT_TOKEN_SECRET?.trim();
	const allowedHostnames = env.TURNSTILE_ALLOWED_HOSTNAMES?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];
	if (!turnstileSecret || !intentSecret || !env.ORDER_ASSETS || allowedHostnames.length === 0) {
		return errorResponse('Order verification is not configured.', 503);
	}
	const verification = await verifyTurnstile({
		token: (input as { token: string }).token,
		secret: turnstileSecret,
		remoteIp: visitorIp,
		allowedHostnames,
	});
	if (!verification.ok) return errorResponse('Verification failed. Reset the challenge and try again.', 403);

	for (let attempt = 0; attempt < 3; attempt += 1) {
		const state = createOrderIntentState();
		const stored = await env.ORDER_ASSETS.put(
			createOrderIntentKey(state.intentId),
			JSON.stringify(state),
			{
				httpMetadata: { contentType: 'application/json' },
				customMetadata: { recordType: 'order-intent', expiresAt: String(state.expiresAt) },
				onlyIf: { etagDoesNotMatch: '*' },
			},
		);
		if (!stored) continue;
		const orderIntentToken = await createOrderIntentToken({
			intentId: state.intentId,
			issuedAt: state.issuedAt,
			expiresAt: state.expiresAt,
		}, intentSecret);
		return Response.json(
			{ orderIntentToken, expiresAt: new Date(state.expiresAt).toISOString() },
			{ headers: { 'Cache-Control': 'no-store' } },
		);
	}
	return errorResponse('Unable to begin an order right now.', 503);
}
