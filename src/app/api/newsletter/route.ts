import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json() as { email?: string; source?: string };
		const { email, source = 'website' } = body;

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return NextResponse.json(
				{ error: 'Invalid email address' },
				{ status: 400 }
			);
		}

		// Get D1 database binding from Cloudflare context
		let db: D1Database;
		try {
			const { env } = await getCloudflareContext({ async: true });
			console.log('Available env keys:', Object.keys(env));
			db = env.DB as D1Database;

			if (!db) {
				console.error('D1 database binding not found in env:', Object.keys(env));
				return NextResponse.json(
					{ error: 'Database not configured' },
					{ status: 500 }
				);
			}
		} catch (contextError) {
			console.error('Failed to get Cloudflare context:', contextError);
			return NextResponse.json(
				{ error: 'Failed to access database context' },
				{ status: 500 }
			);
		}

		// Insert email into database
		try {
			await db
				.prepare('INSERT INTO newsletter_subscribers (email, source) VALUES (?, ?)')
				.bind(email.toLowerCase(), source)
				.run();

			return NextResponse.json(
				{ success: true, message: 'Successfully subscribed to newsletter' },
				{ status: 201 }
			);
		} catch (dbError) {
			// Check if it's a duplicate email error
			if (dbError instanceof Error && dbError.message?.includes('UNIQUE constraint failed')) {
				return NextResponse.json(
					{ error: 'Email already subscribed' },
					{ status: 409 }
				);
			}
			console.error('Database error:', dbError);
			throw dbError;
		}
	} catch (error) {
		console.error('Newsletter subscription error:', error);
		return NextResponse.json(
			{ error: 'Failed to subscribe to newsletter' },
			{ status: 500 }
		);
	}
}
