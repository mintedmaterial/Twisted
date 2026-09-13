import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
	ALLOWED_REFERENCE_TYPES,
	canonicalReferenceFilename,
	contentTypeFromCanonicalKey,
	isCanonicalManifestKey,
	isCanonicalReferenceKey,
	isCanonicalTemporaryReferenceKey,
	verifyAssetToken,
} from '../../../../lib/order-assets';

interface RouteContext {
	params: Promise<{ token: string }>;
}

const PRIVATE_HEADERS = {
	'Cache-Control': 'private, no-store',
	'X-Robots-Tag': 'noindex, nofollow, noarchive',
	'X-Content-Type-Options': 'nosniff',
};

function notFoundResponse(): Response {
	return new Response('Private order record not found.', {
		status: 404,
		headers: PRIVATE_HEADERS,
	});
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
	const { token } = await context.params;
	const { env } = getCloudflareContext();
	const secret = env.ORDER_ASSET_TOKEN_SECRET?.trim();
	if (!env.ORDER_ASSETS || !secret) {
		return new Response('Private order record service is not configured.', { status: 500, headers: PRIVATE_HEADERS });
	}

	const key = await verifyAssetToken(token, secret);
	if (!key) return notFoundResponse();
	const isTemporaryReference = isCanonicalTemporaryReferenceKey(key);
	const isReferenceImage = isCanonicalReferenceKey(key) || isTemporaryReference;
	const isManifest = isCanonicalManifestKey(key);
	if (!isReferenceImage && !isManifest) return notFoundResponse();

	try {
		const object = await env.ORDER_ASSETS.get(key);
		if (!object) return notFoundResponse();
		const storedContentType = object.httpMetadata?.contentType;
		if (isManifest) {
			if (
				storedContentType !== 'application/json'
				|| object.customMetadata?.recordType !== 'custom-order-manifest'
			) return notFoundResponse();
			return new Response(object.body, {
				headers: {
					...PRIVATE_HEADERS,
					'Content-Type': 'application/json; charset=utf-8',
				},
			});
		}

		const expectedContentType = contentTypeFromCanonicalKey(key);
		if (
			!expectedContentType
			|| !storedContentType
			|| !ALLOWED_REFERENCE_TYPES.has(storedContentType)
			|| storedContentType !== expectedContentType
			|| (isTemporaryReference && object.customMetadata?.recordType !== 'temporary-order-upload')
		) {
			return notFoundResponse();
		}

		const safeFilename = canonicalReferenceFilename(
			object.customMetadata?.originalName,
			expectedContentType,
		);
		return new Response(object.body, {
			headers: {
				...PRIVATE_HEADERS,
				'Content-Type': expectedContentType,
				'Content-Disposition': `inline; filename="${safeFilename}"`,
			},
		});
	} catch {
		return new Response('Unable to retrieve private order record right now.', { status: 500, headers: PRIVATE_HEADERS });
	}
}
