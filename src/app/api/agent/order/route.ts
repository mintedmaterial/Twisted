import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Save order/inquiry information
export async function POST(request: NextRequest) {
	try {
		const body = await request.json() as {
			email?: string;
			phone?: string;
			conversation_id?: string;
			product_type: string;
			customization?: Record<string, unknown>;
			estimated_price?: number;
			notes?: string;
		};

		const {
			email,
			phone,
			conversation_id,
			product_type,
			customization,
			estimated_price,
			notes
		} = body;

		if (!product_type) {
			return NextResponse.json(
				{ error: 'Product type is required' },
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
			} else {
				// Create customer
				const result = await db
					.prepare('INSERT INTO customers (email, phone) VALUES (?, ?)')
					.bind(email || null, phone || null)
					.run();
				customerId = result.meta.last_row_id as number;
			}
		}

		// Save order inquiry
		const result = await db
			.prepare(`
				INSERT INTO conversation_orders
				(customer_id, conversation_id, product_type, customization, estimated_price, notes)
				VALUES (?, ?, ?, ?, ?, ?)
			`)
			.bind(
				customerId,
				conversation_id || null,
				product_type,
				customization ? JSON.stringify(customization) : null,
				estimated_price || null,
				notes || null
			)
			.run();

		return NextResponse.json({
			success: true,
			order_id: result.meta.last_row_id,
			message: 'Order inquiry saved successfully'
		}, { status: 201 });
	} catch (error) {
		console.error('Order save error:', error);
		return NextResponse.json(
			{ error: 'Failed to save order inquiry' },
			{ status: 500 }
		);
	}
}

// Get customer's order history
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

		// Find customer
		const customer = await db
			.prepare('SELECT id FROM customers WHERE email = ? OR phone = ? LIMIT 1')
			.bind(email || null, phone || null)
			.first();

		if (!customer) {
			return NextResponse.json({
				success: true,
				orders: []
			});
		}

		// Get orders
		const orders = await db
			.prepare('SELECT * FROM conversation_orders WHERE customer_id = ? ORDER BY created_at DESC')
			.bind(customer.id)
			.all();

		// Parse customization JSON
		const ordersData = orders.results.map((order: Record<string, unknown>) => ({
			...order,
			customization: order.customization ? JSON.parse(order.customization as string) : null
		}));

		return NextResponse.json({
			success: true,
			orders: ordersData
		});
	} catch (error) {
		console.error('Order lookup error:', error);
		return NextResponse.json(
			{ error: 'Failed to look up orders' },
			{ status: 500 }
		);
	}
}
