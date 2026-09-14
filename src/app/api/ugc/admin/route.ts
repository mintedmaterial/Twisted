import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { rewardAmountFor, UGC_STATUSES, type UgcStatus } from '@/lib/ugc';

const ADMIN_EMAILS = new Set([
	'colt@twistedcustomleather.com',
	'randy@twistedcustomleather.com',
	'connie@twistedcustomleather.com',
]);

function getAccessEmail(request: NextRequest): string | null {
	const header = request.headers.get('cf-access-authenticated-user-email');
	if (!header) return null;
	return header.toLowerCase();
}

function isAdmin(email: string | null): boolean {
	if (!email) return false;
	return ADMIN_EMAILS.has(email);
}

export async function GET(request: NextRequest) {
	try {
		const adminEmail = getAccessEmail(request);
		if (!isAdmin(adminEmail)) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const { env } = getCloudflareContext();
		const db = env.DB as D1Database | undefined;
		if (!db) {
			return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
		}

		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status') ?? 'pending';
		const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
		const offset = parseInt(searchParams.get('offset') ?? '0', 10);

		const safeStatus = UGC_STATUSES.includes(status as UgcStatus) ? (status as UgcStatus) : 'pending';

		const { results } = await db
			.prepare(
				`
				SELECT id, public_id, email, first_name, product_category, instagram_handle, tiktok_handle,
				       description, file_key, file_name, file_type, file_size, status, reward_amount,
				       reward_code, reviewed_at, review_notes, created_at
				FROM ugc_submissions
				WHERE status = ?
				ORDER BY created_at DESC
				LIMIT ? OFFSET ?
				`
			)
			.bind(safeStatus, limit, offset)
			.all();

		return NextResponse.json({ success: true, status: safeStatus, submissions: results ?? [] });
	} catch (error) {
		console.error('UGC admin list error:', error);
		return NextResponse.json({ error: 'Failed to load submissions.' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const adminEmail = getAccessEmail(request);
		if (!isAdmin(adminEmail)) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const { env } = getCloudflareContext();
		const db = env.DB as D1Database | undefined;
		const accountId =
			typeof process.env.CLOUDFLARE_ACCOUNT_ID === 'string' ? process.env.CLOUDFLARE_ACCOUNT_ID : undefined;
		const apiToken =
			typeof process.env.CLOUDFLARE_EMAIL_API_TOKEN === 'string' ? process.env.CLOUDFLARE_EMAIL_API_TOKEN : undefined;

		if (!db || !accountId || !apiToken) {
			console.error('Missing DB, CLOUDFLARE_ACCOUNT_ID, or CLOUDFLARE_EMAIL_API_TOKEN');
			return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 });
		}

		const body = (await request.json()) as {
			publicId: string;
			action: 'approve' | 'decline';
			reviewNotes?: string;
		};

		if (!body.publicId || !['approve', 'decline'].includes(body.action)) {
			return NextResponse.json({ error: 'publicId and valid action are required.' }, { status: 400 });
		}

		const row = await db
			.prepare(
				`
				SELECT id, email, first_name, file_type, file_name, status
				FROM ugc_submissions
				WHERE public_id = ?
				LIMIT 1
				`
			)
			.bind(body.publicId)
			.first<{ id: number; email: string; first_name: string; file_type: string; file_name: string; status: UgcStatus }>();

		if (!row) {
			return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
		}
		if (row.status !== 'pending') {
			return NextResponse.json({ error: 'Submission has already been reviewed.' }, { status: 409 });
		}

		const fromAddress = (typeof process !== 'undefined' && process.env?.CAMPAIGN_FROM_ADDRESS) || 'campaigns@twistedcustomleather.com';
		const now = new Date().toISOString();
		const category = row.file_type.startsWith('video/') ? 'video' : 'image';

		if (body.action === 'approve') {
			const rewardCode = generateRewardCode();
			const rewardAmount = rewardAmountFor(category);

			await db
				.prepare(
					`
					UPDATE ugc_submissions
					SET status = ?, reward_amount = ?, reward_code = ?, reviewed_at = ?, review_notes = ?, updated_at = ?
					WHERE id = ?
					`
				)
				.bind('approved', rewardAmount, rewardCode, now, body.reviewNotes ?? null, now, row.id)
				.run();

			await db
				.prepare('INSERT OR IGNORE INTO ugc_reward_codes (code, submission_id) VALUES (?, ?)')
				.bind(rewardCode, row.id)
				.run();

			await sendEmail({
				accountId,
				apiToken,
				to: row.email,
				from: { address: fromAddress, name: 'Twisted Custom Leather' },
				replyTo: 'colt@twistedcustomleather.com',
				subject: 'Your Twisted gear is going live',
				html: buildApprovalHtml(row.first_name, rewardAmount, rewardCode),
				text: buildApprovalText(row.first_name, rewardAmount, rewardCode),
			});

			return NextResponse.json({ success: true, status: 'approved', rewardAmount, rewardCode });
		}

		await db
			.prepare(
				`
				UPDATE ugc_submissions
				SET status = ?, reviewed_at = ?, review_notes = ?, updated_at = ?
				WHERE id = ?
				`
			)
			.bind('declined', now, body.reviewNotes ?? null, now, row.id)
			.run();

		await sendEmail({
			accountId,
			apiToken,
			to: row.email,
			from: { address: fromAddress, name: 'Twisted Custom Leather' },
			replyTo: 'colt@twistedcustomleather.com',
			subject: 'Thanks for sending us your Twisted gear',
			html: buildDeclineHtml(row.first_name),
			text: buildDeclineText(row.first_name),
		});

		return NextResponse.json({ success: true, status: 'declined' });
	} catch (error) {
		console.error('UGC admin review error:', error);
		return NextResponse.json({ error: 'Failed to process review.' }, { status: 500 });
	}
}

async function sendEmail(opts: {
	accountId: string;
	apiToken: string;
	to: string;
	from: { address: string; name: string };
	replyTo: string;
	subject: string;
	html: string;
	text: string;
}) {
	const res = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/email/sending/send`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${opts.apiToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				to: opts.to,
				from: opts.from,
				reply_to: opts.replyTo,
				subject: opts.subject,
				html: opts.html,
				text: opts.text,
			}),
		}
	);

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Email send failed (${res.status}): ${text}`);
	}
}

function generateRewardCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code = 'TWISTED-';
	for (let i = 0; i < 10; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

function buildApprovalHtml(firstName: string, amount: number, code: string): string {
	return `
<div style="font-family: Satoshi, system-ui, sans-serif; color: #3a2f2f; max-width: 600px; margin: 0 auto;">
  <p>Hey ${escapeHtml(firstName)},</p>
  <p>We loved your submission — we are featuring it on our social channels and website.</p>
  <p>Here is your <strong>$${amount} store credit</strong>:</p>
  <p style="font-size: 24px; font-weight: bold; letter-spacing: 1px; margin: 24px 0;">${code}</p>
  <p>Share the post and tag us when you see it out in the wild. Thanks for helping show people what handmade gear looks like after real use.</p>
  <p>— Twisted Custom Leather</p>
</div>`;
}

function buildApprovalText(firstName: string, amount: number, code: string): string {
	return `Hey ${firstName},

We loved your submission — we are featuring it on our social channels and website.

Here is your $${amount} store credit: ${code}

Share the post and tag us when you see it out in the wild. Thanks for helping show people what handmade gear looks like after real use.

— Twisted Custom Leather`;
}

function buildDeclineHtml(firstName: string): string {
	return `
<div style="font-family: Satoshi, system-ui, sans-serif; color: #3a2f2f; max-width: 600px; margin: 0 auto;">
  <p>Hey ${escapeHtml(firstName)},</p>
  <p>Thanks so much for sending in your photo/video. Right now we are not able to use it in our marketing — but we really appreciate you taking the time.</p>
  <p>If you want to try again, here is what usually makes a clip usable:</p>
  <ul>
    <li>Vertical video, 10-15 seconds</li>
    <li>Product in focus and clearly visible</li>
    <li>Good lighting and steady shot</li>
    <li>Real use context (welding, working, pulling from a pocket, etc.)</li>
  </ul>
  <p>Keep wearing it hard. We may run this again soon.</p>
  <p>— Twisted Custom Leather</p>
</div>`;
}

function buildDeclineText(firstName: string): string {
	return `Hey ${firstName},

Thanks so much for sending in your photo/video. Right now we are not able to use it in our marketing — but we really appreciate you taking the time.

If you want to try again, here is what usually makes a clip usable:
- Vertical video, 10-15 seconds
- Product in focus and clearly visible
- Good lighting and steady shot
- Real use context (welding, working, pulling from a pocket, etc.)

Keep wearing it hard. We may run this again soon.

— Twisted Custom Leather`;
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
