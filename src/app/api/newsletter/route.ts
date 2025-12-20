import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
	try {
		const { email, source = 'website' } = await request.json();

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return NextResponse.json(
				{ error: 'Invalid email address' },
				{ status: 400 }
			);
		}

		// Get D1 database binding from env
		const env = process.env as any;
		const db = env.DB;

		if (!db) {
			console.error('D1 database binding not found');
			return NextResponse.json(
				{ error: 'Database not configured' },
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
		} catch (dbError: any) {
			// Check if it's a duplicate email error
			if (dbError.message?.includes('UNIQUE constraint failed')) {
				return NextResponse.json(
					{ error: 'Email already subscribed' },
					{ status: 409 }
				);
			}
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
