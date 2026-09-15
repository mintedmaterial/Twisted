import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getAllFlagStates, getVisitorId, visitorCookie, type FlagKey } from '@/lib/flags';

/**
 * GET /api/flags — returns all flag states (for admin dashboard).
 * This endpoint is public (the flag states themselves are not sensitive),
 * but the admin page at /admin/flags is behind Cloudflare Access.
 */
export async function GET(request: NextRequest) {
	try {
		const { env } = getCloudflareContext();
		const visitorId = getVisitorId(request);

		const states = await getAllFlagStates(env, { visitorId });

		const response = NextResponse.json({ flags: states });
		// Set visitor cookie for consistent targeting
		response.headers.set('Set-Cookie', visitorCookie(visitorId));
		return response;
	} catch (error) {
		console.error('Flags API error:', error);
		return NextResponse.json(
			{ error: 'Failed to evaluate flags', flags: [] },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/flags — evaluate specific flags (for client-side gating).
 * Body: { keys: FlagKey[] }
 */
export async function POST(request: NextRequest) {
	try {
		const { env } = getCloudflareContext();
		const body = await request.json();
		const keys = body.keys as FlagKey[];

		if (!Array.isArray(keys)) {
			return NextResponse.json({ error: 'keys must be an array' }, { status: 400 });
		}

		const visitorId = getVisitorId(request);
		const states = await getAllFlagStates(env, { visitorId });
		const filtered = states.filter((s) => keys.includes(s.key as FlagKey));

		const response = NextResponse.json({ flags: filtered });
		response.headers.set('Set-Cookie', visitorCookie(visitorId));
		return response;
	} catch (error) {
		console.error('Flags API error:', error);
		return NextResponse.json(
			{ error: 'Failed to evaluate flags' },
			{ status: 500 }
		);
	}
}
