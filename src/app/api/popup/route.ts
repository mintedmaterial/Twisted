import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
	try {
		const { email, action, sessionId } = await request.json();

		if (!action || !['subscribed', 'dismissed', 'closed'].includes(action)) {
			return NextResponse.json(
				{ error: 'Invalid action' },
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

		// Insert popup interaction
		await db
			.prepare('INSERT INTO popup_interactions (email, action, session_id) VALUES (?, ?, ?)')
			.bind(email || null, action, sessionId || null)
			.run();

		return NextResponse.json(
			{ success: true },
			{ status: 201 }
		);
	} catch (error) {
		console.error('Popup interaction tracking error:', error);
		return NextResponse.json(
			{ error: 'Failed to track interaction' },
			{ status: 500 }
		);
	}
}
