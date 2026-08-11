import { getCloudflareContext } from '@opennextjs/cloudflare';
import { reconcileOrderRecords } from '@/lib/order-reconciliation';

function bearerToken(request: Request): string | null {
	return request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_.-]+)$/u)?.[1] ?? null;
}

function tokensMatch(actual: string | null, expected: string): boolean {
	if (!actual || actual.length !== expected.length || expected.length < 32) return false;
	let difference = 0;
	for (let index = 0; index < expected.length; index += 1) difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
	return difference === 0;
}

export async function POST(request: Request): Promise<Response> {
	const { env } = getCloudflareContext();
	if (!tokensMatch(bearerToken(request), env.ORDER_MAINTENANCE_SECRET)) {
		return Response.json({ error: 'Not authorized.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
	}
	const url = new URL(request.url);
	const cursors = {
		manifestCursor: url.searchParams.get('manifestCursor') ?? undefined,
		intentCursor: url.searchParams.get('intentCursor') ?? undefined,
	};
	try {
		const result = await reconcileOrderRecords(env.ORDER_ASSETS, Date.now(), cursors);
		console.info(JSON.stringify({ event: 'order_reconciliation_completed', ...result }));
		return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
	} catch {
		console.warn(JSON.stringify({ event: 'order_reconciliation_failed' }));
		return Response.json({ error: 'Order maintenance is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
	}
}
