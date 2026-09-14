import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { decodeMagicLinkPayload, verifyPayload } from '@/lib/hmac';
import { normalizeEmail } from '@/lib/ugc';

export async function GET(request: NextRequest) {
	try {
		const { env } = getCloudflareContext();
		const db = env.DB as D1Database | undefined;
		const secret =
			typeof process.env.MAGIC_LINK_SECRET === 'string' ? process.env.MAGIC_LINK_SECRET : undefined;

		if (!db || !secret) {
			console.error('Missing DB or MAGIC_LINK_SECRET');
			return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 });
		}

		const { searchParams } = new URL(request.url);
		const email = normalizeEmail(searchParams.get('email') ?? '');
		const payload = searchParams.get('payload');
		const signature = searchParams.get('signature');

		if (!email || !payload || !signature) {
			return NextResponse.json({ error: 'Missing magic-link parameters.' }, { status: 400 });
		}

		const decoded = decodeMagicLinkPayload(payload);
		if (!decoded || decoded.email !== email) {
			return NextResponse.json({ error: 'Invalid magic link.' }, { status: 400 });
		}
		if (decoded.expires < Math.floor(Date.now() / 1000)) {
			return NextResponse.json({ error: 'Magic link has expired.' }, { status: 410 });
		}

		const valid = await verifyPayload(secret, payload, signature);
		if (!valid) {
			return NextResponse.json({ error: 'Invalid magic link signature.' }, { status: 403 });
		}

		const { results } = await db
			.prepare(
				`
				SELECT public_id, product_category, file_name, file_type, status,
				       reward_amount, reward_code, reviewed_at, created_at
				FROM ugc_submissions
				WHERE email_normalized = ?
				ORDER BY created_at DESC
				`
			)
			.bind(email)
			.all();

		return NextResponse.json({
			success: true,
			submissions: (results ?? []).map((row: Record<string, unknown>) => ({
				publicId: row.public_id,
				productCategory: row.product_category,
				fileName: row.file_name,
				fileType: row.file_type,
				status: row.status,
				rewardAmount: row.reward_amount,
				rewardCode: row.reward_code,
				reviewedAt: row.reviewed_at,
				createdAt: row.created_at,
			})),
		});
	} catch (error) {
		console.error('UGC status error:', error);
		return NextResponse.json({ error: 'Failed to load submissions.' }, { status: 500 });
	}
}
