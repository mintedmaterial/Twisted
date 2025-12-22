import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Save a conversation note
export async function POST(request: NextRequest) {
	try {
		const body = await request.json() as {
			email?: string;
			phone?: string;
			conversation_id?: string;
			note: string;
		};

		const { email, phone, conversation_id, note } = body;

		if (!note) {
			return NextResponse.json(
				{ error: 'Note is required' },
				{ status: 400 }
			);
		}

		const { env } = getCloudflareContext();
		const db = env.DB as D1Database;

		if (!db) {
			return NextResponse.json(
				{ error: 'Database not configured' },
				{ status: 500 }
			);
		}

		// Find or create customer
		let customerId: number | null = null;

		if (email || phone) {
			const customer = await db
				.prepare('SELECT id FROM customers WHERE email = ? OR phone = ? LIMIT 1')
				.bind(email || null, phone || null)
				.first();

			if (customer) {
				customerId = customer.id as number;
			} else if (email || phone) {
				// Create customer if they provided contact info
				const result = await db
					.prepare('INSERT INTO customers (email, phone) VALUES (?, ?)')
					.bind(email || null, phone || null)
					.run();
				customerId = result.meta.last_row_id as number;
			}
		}

		// Save note
		await db
			.prepare(`
				INSERT INTO conversation_notes (customer_id, conversation_id, note)
				VALUES (?, ?, ?)
			`)
			.bind(customerId, conversation_id || null, note)
			.run();

		return NextResponse.json({
			success: true,
			message: 'Note saved successfully'
		}, { status: 201 });
	} catch (error) {
		console.error('Note save error:', error);
		return NextResponse.json(
			{ error: 'Failed to save note' },
			{ status: 500 }
		);
	}
}
