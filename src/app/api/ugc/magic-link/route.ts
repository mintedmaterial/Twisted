import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { encodeMagicLinkPayload, signPayload } from '@/lib/hmac';
import { normalizeEmail } from '@/lib/ugc';

export async function POST(request: NextRequest) {
	try {
		const { env } = getCloudflareContext();
		const db = env.DB as D1Database | undefined;
		const secret =
			typeof process.env.MAGIC_LINK_SECRET === 'string' ? process.env.MAGIC_LINK_SECRET : undefined;

		if (!db || !secret) {
			return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 });
		}

		const body = (await request.json()) as { email?: string };
		const email = normalizeEmail(body.email ?? '');

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
		}

		const { results } = await db
			.prepare('SELECT 1 as one FROM ugc_submissions WHERE email_normalized = ? LIMIT 1')
			.bind(email)
			.all<{ one: number }>();

		if (!results || results.length === 0) {
			return NextResponse.json({ error: 'No submissions found for that email.' }, { status: 404 });
		}

		const payload = encodeMagicLinkPayload(email, 60);
		const signature = await signPayload(secret, payload);

		const link = `https://twistedcustomleather.com/my-submissions?email=${encodeURIComponent(
			email
		)}&payload=${encodeURIComponent(payload)}&signature=${encodeURIComponent(signature)}`;

		return NextResponse.json({ success: true, link });
	} catch (error) {
		console.error('UGC magic link error:', error);
		return NextResponse.json({ error: 'Failed to generate status link.' }, { status: 500 });
	}
}
