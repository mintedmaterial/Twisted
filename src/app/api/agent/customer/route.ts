import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Save or update customer information
export async function POST(request: NextRequest) {
	try {
		const body = await request.json() as {
			email?: string;
			phone?: string;
			name?: string;
			preferences?: Record<string, unknown>;
		};

		const { email, phone, name, preferences } = body;

		if (!email && !phone) {
			return NextResponse.json(
				{ error: 'Either email or phone is required' },
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

		// Check if customer exists
		const existing = await db
			.prepare('SELECT * FROM customers WHERE email = ? OR phone = ? LIMIT 1')
			.bind(email || null, phone || null)
			.first();

		if (existing) {
			// Update existing customer
			await db
				.prepare(`
					UPDATE customers
					SET email = COALESCE(?, email),
						phone = COALESCE(?, phone),
						name = COALESCE(?, name),
						preferences = COALESCE(?, preferences),
						updated_at = CURRENT_TIMESTAMP
					WHERE id = ?
				`)
				.bind(
					email || null,
					phone || null,
					name || null,
					preferences ? JSON.stringify(preferences) : null,
					existing.id
				)
				.run();

			return NextResponse.json({
				success: true,
				customer_id: existing.id,
				message: 'Customer updated successfully'
			});
		} else {
			// Create new customer
			const result = await db
				.prepare(`
					INSERT INTO customers (email, phone, name, preferences)
					VALUES (?, ?, ?, ?)
				`)
				.bind(
					email || null,
					phone || null,
					name || null,
					preferences ? JSON.stringify(preferences) : null
				)
				.run();

			return NextResponse.json({
				success: true,
				customer_id: result.meta.last_row_id,
				message: 'Customer created successfully'
			}, { status: 201 });
		}
	} catch (error) {
		console.error('Customer API error:', error);
		return NextResponse.json(
			{ error: 'Failed to save customer information' },
			{ status: 500 }
		);
	}
}

// Look up customer information
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const email = searchParams.get('email');
		const phone = searchParams.get('phone');

		if (!email && !phone) {
			return NextResponse.json(
				{ error: 'Either email or phone is required' },
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

		const customer = await db
			.prepare('SELECT * FROM customers WHERE email = ? OR phone = ? LIMIT 1')
			.bind(email || null, phone || null)
			.first();

		if (!customer) {
			return NextResponse.json(
				{ error: 'Customer not found' },
				{ status: 404 }
			);
		}

		// Parse preferences JSON
		const customerData = {
			...customer,
			preferences: customer.preferences ? JSON.parse(customer.preferences as string) : null
		};

		return NextResponse.json({
			success: true,
			customer: customerData
		});
	} catch (error) {
		console.error('Customer lookup error:', error);
		return NextResponse.json(
			{ error: 'Failed to look up customer' },
			{ status: 500 }
		);
	}
}
