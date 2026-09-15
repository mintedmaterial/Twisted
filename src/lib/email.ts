export interface EmailOptions {
	env: CloudflareEnv;
	db?: D1Database;
	to: string;
	fromAddress?: string;
	replyTo?: string;
	subject: string;
	html: string;
	text: string;
}

export interface EmailResult {
	success: boolean;
	method: 'binding' | 'rest_api' | 'none';
	error?: string;
}

export async function sendNotificationEmail(opts: EmailOptions): Promise<EmailResult> {
	const { env, db, to, subject, html, text, replyTo } = opts;
	const fromAddress = opts.fromAddress || env.CAMPAIGN_FROM_ADDRESS || 'campaigns@twistedcustomleather.com';
	let result: EmailResult = { success: false, method: 'none' };

	// 1. Try native Worker send_email binding if available
	if (env.EMAIL && typeof env.EMAIL.send === 'function') {
		try {
			await env.EMAIL.send({
				to,
				from: fromAddress,
				subject,
				html,
				text,
			});
			console.log('Email dispatched via env.EMAIL binding to:', to);
			result = { success: true, method: 'binding' };
		} catch (bindingError) {
			console.warn('env.EMAIL binding send failed, trying REST API fallback:', bindingError);
			result.error = String(bindingError);
		}
	}

	// 2. Try REST API with token if binding didn't succeed
	if (!result.success) {
		const accountId =
			(typeof env.CLOUDFLARE_ACCOUNT_ID === 'string' ? env.CLOUDFLARE_ACCOUNT_ID : undefined) ||
			(typeof process !== 'undefined' ? process.env.CLOUDFLARE_ACCOUNT_ID : undefined);
		const apiToken =
			(typeof env.CLOUDFLARE_EMAIL_API_TOKEN === 'string' ? env.CLOUDFLARE_EMAIL_API_TOKEN : undefined) ||
			(typeof process !== 'undefined' ? process.env.CLOUDFLARE_EMAIL_API_TOKEN : undefined);

		if (accountId && apiToken) {
			try {
				const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${apiToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						to,
						from: { address: fromAddress, name: 'Twisted Custom Leather' },
						reply_to: replyTo || 'colt@twistedcustomleather.com',
						subject,
						html,
						text,
					}),
				});

				if (res.ok) {
					console.log('Email dispatched via REST API to:', to);
					result = { success: true, method: 'rest_api' };
				} else {
					const errText = await res.text();
					console.error(`Email REST API failed (${res.status}):`, errText);
					result = { success: false, method: 'rest_api', error: `${res.status}: ${errText}` };
				}
			} catch (restError) {
				console.error('Email REST API fetch exception:', restError);
				result = { success: false, method: 'rest_api', error: String(restError) };
			}
		}
	}

	// 3. Log to D1 database if DB is available
	if (db) {
		try {
			await db
				.prepare(
					`INSERT INTO email_logs (recipient, sender, subject, method, status, error)
					 VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(
					to,
					fromAddress,
					subject,
					result.method,
					result.success ? 'sent' : 'failed',
					result.error ?? null
				)
				.run();
		} catch (logErr) {
			console.error('Failed to write to email_logs table:', logErr);
		}
	}

	return result;
}
