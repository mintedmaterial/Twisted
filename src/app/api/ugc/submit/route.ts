import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
	assertProductCategory,
	fileTypeCategory,
	generatePublicId,
	normalizeEmail,
	sanitizeR2Key,
} from '@/lib/ugc';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

export async function POST(request: NextRequest) {
	try {
		const { env } = getCloudflareContext();
		const db = env.DB as D1Database | undefined;
		const bucket = env.UGC_ASSETS as R2Bucket | undefined;

		if (!db || !bucket) {
			console.error('Missing bindings. Available env keys:', Object.keys(env));
			return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 });
		}

		const formData = await request.formData();
		const email = normalizeEmail(String(formData.get('email') ?? ''));
		const firstName = String(formData.get('firstName') ?? '').trim();
		const productCategoryRaw = String(formData.get('productCategory') ?? '');
		const instagramHandle = String(formData.get('instagramHandle') ?? '').trim() || undefined;
		const tiktokHandle = String(formData.get('tiktokHandle') ?? '').trim() || undefined;
		const description = String(formData.get('description') ?? '').trim() || undefined;
		const rightsReleaseAgreed = formData.get('rightsReleaseAgreed') === 'true';
		const creditContingencyAgreed = formData.get('creditContingencyAgreed') === 'true';
		const file = formData.get('file');

		// Validate required fields
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
		}
		if (!firstName) {
			return NextResponse.json({ error: 'First name is required.' }, { status: 400 });
		}
		if (!productCategoryRaw) {
			return NextResponse.json({ error: 'Product category is required.' }, { status: 400 });
		}
		if (!rightsReleaseAgreed || !creditContingencyAgreed) {
			return NextResponse.json(
				{ error: 'You must agree to the rights release and credit terms.' },
				{ status: 400 }
			);
		}

		let productCategory: ReturnType<typeof assertProductCategory>;
		try {
			productCategory = assertProductCategory(productCategoryRaw);
		} catch {
			return NextResponse.json({ error: 'Invalid product category.' }, { status: 400 });
		}

		if (!file || !(file instanceof File)) {
			return NextResponse.json({ error: 'A file is required.' }, { status: 400 });
		}

		const type = file.type || 'application/octet-stream';
		const category = fileTypeCategory(type);

		if (category === 'unknown' || (!ALLOWED_IMAGE_TYPES.has(type) && !ALLOWED_VIDEO_TYPES.has(type))) {
			return NextResponse.json(
				{ error: 'Only images (JPG, PNG, WebP, HEIC) or videos (MP4, MOV, WebM) are allowed.' },
				{ status: 400 }
			);
		}

		const maxBytes = category === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
		if (file.size > maxBytes) {
			return NextResponse.json(
				{ error: `${category === 'video' ? 'Video' : 'Image'} must be under ${maxBytes / (1024 * 1024)}MB.` },
				{ status: 400 }
			);
		}

		const publicId = generatePublicId();
		const timestamp = Date.now();
		const fileKey = sanitizeR2Key(email, timestamp, file.name);
		const buffer = new Uint8Array(await file.arrayBuffer());

		await bucket.put(fileKey, buffer, {
			httpMetadata: { contentType: type },
			customMetadata: {
				publicId,
				email,
				productCategory,
			},
		});

		await db
			.prepare(
				`
				INSERT INTO ugc_submissions (
					public_id, email, email_normalized, first_name, product_category,
					instagram_handle, tiktok_handle, description, file_key, file_name,
					file_type, file_size, rights_release_agreed, credit_contingency_agreed
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`
			)
			.bind(
				publicId,
				email,
				normalizeEmail(email),
				firstName,
				productCategory,
				instagramHandle ?? null,
				tiktokHandle ?? null,
				description ?? null,
				fileKey,
				file.name,
				type,
				file.size,
				rightsReleaseAgreed ? 1 : 0,
				creditContingencyAgreed ? 1 : 0
			)
			.run();

		// Notify team via Discord webhook (fire-and-forget; failures are logged not surfaced)
		const discordWebhook = typeof env.DISCORD_WEBHOOK_URL === 'string' ? env.DISCORD_WEBHOOK_URL : undefined;
		if (discordWebhook) {
			try {
				await fetch(discordWebhook, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						content: `New Twisted Gear submission from **${firstName}** (${email})\nCategory: ${productCategory}\nAdmin: https://twistedcustomleather.com/admin/ugc`,
					}),
				});
			} catch (notifyError) {
				console.error('Discord notification failed:', notifyError);
			}
		}

		return NextResponse.json(
			{
				success: true,
				publicId,
				message: 'Submission received. We will review it within 5 business days.',
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('UGC submit error:', error);
		return NextResponse.json({ error: 'Failed to process submission.' }, { status: 500 });
	}
}
