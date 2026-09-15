import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { encodeMagicLinkPayload, signPayload } from '@/lib/hmac';
import { normalizeEmail } from '@/lib/ugc';

export async function POST(request: NextRequest) {
	try {
		const { env } = getCloudflareContext();
		const db = env.DB as D1Database | undefined;
		const secret = ((env.MAGIC_LINK_SECRET as string | undefined) ?? (process.env.MAGIC_LINK_SECRET as string | undefined) ?? '')?.trim();

		console.log('DEBUG magic-link:', {
			hasDb: !!db,
			envKeys: env ? Object.keys(env) : [],
			hasSecret: !!secret,
		});

		if (!db || !secret) {
			console.error('Missing DB or MAGIC_LINK_SECRET. DB:', !!db, 'Secret:', !!secret);
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

		const accountId =
			(typeof env.CLOUDFLARE_ACCOUNT_ID === 'string' ? env.CLOUDFLARE_ACCOUNT_ID : undefined) ||
			(typeof process !== 'undefined' && typeof process.env.CLOUDFLARE_ACCOUNT_ID === 'string'
				? process.env.CLOUDFLARE_ACCOUNT_ID
				: undefined);
		const apiToken =
			(typeof env.CLOUDFLARE_EMAIL_API_TOKEN === 'string' ? env.CLOUDFLARE_EMAIL_API_TOKEN : undefined) ||
			(typeof process !== 'undefined' && typeof process.env.CLOUDFLARE_EMAIL_API_TOKEN === 'string'
				? process.env.CLOUDFLARE_EMAIL_API_TOKEN
				: undefined);
		const fromAddress =
			(typeof env.CAMPAIGN_FROM_ADDRESS === 'string' ? env.CAMPAIGN_FROM_ADDRESS : undefined) ||
			(typeof process !== 'undefined' && typeof process.env.CAMPAIGN_FROM_ADDRESS === 'string'
				? process.env.CAMPAIGN_FROM_ADDRESS
				: 'campaigns@twistedcustomleather.com');

		if (accountId && apiToken) {
			try {
				await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${apiToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						to: email,
						from: { address: fromAddress, name: 'Twisted Custom Leather' },
						reply_to: 'colt@twistedcustomleather.com',
						subject: 'Your Twisted Gear submission status link',
						html: `<div style="font-family: Satoshi, sans-serif; color: #3a2f2f; max-width: 600px; margin: 0 auto;">
							<h2>Show Us Your Twisted Gear</h2>
							<p>Use the secure link below to check the status of your submissions and store credit:</p>
							<p><a href="${link}" style="display: inline-block; padding: 12px 24px; background: #b87333; color: #f5f1e8; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Submissions</a></p>
							<p style="font-size: 13px; color: #8b7355;">This link is valid for 60 minutes.</p>
						</div>`,
						text: `Use this link to check your submission status and store credit:\n\n${link}\n\nValid for 60 minutes.`,
					}),
				});
			} catch (emailErr) {
				console.error('Failed to send magic link email:', emailErr);
			}
		}

		return NextResponse.json({ success: true, link });
	} catch (error) {
		console.error('UGC magic link error:', error);
		return NextResponse.json({ error: 'Failed to generate status link.' }, { status: 500 });
	}
}
