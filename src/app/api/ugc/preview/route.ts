import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest) {
	try {
		const { env } = getCloudflareContext();
		const bucket = env.UGC_ASSETS as R2Bucket | undefined;
		if (!bucket) {
			return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
		}

		const { searchParams } = new URL(request.url);
		const key = searchParams.get('key');
		if (!key) {
			return NextResponse.json({ error: 'key is required' }, { status: 400 });
		}

		const object = await bucket.get(key);
		if (!object) {
			return new NextResponse('Not found', { status: 404 });
		}

		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set('etag', object.httpEtag);
		// Only admins and the dashboard component use this; add a short cache.
		headers.set('cache-control', 'private, max-age=300');
		return new NextResponse(object.body as ReadableStream, { headers });
	} catch (error) {
		console.error('UGC preview error:', error);
		return NextResponse.json({ error: 'Failed to load preview.' }, { status: 500 });
	}
}
