import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { checkoutProducts } from '@/data/checkout-products';

interface CheckoutItem {
	id: string;
	quantity: number;
}

interface CheckoutRequest {
	items?: CheckoutItem[];
	customerName?: string;
	email?: string;
	phone?: string;
	deliveryWindow?: string;
	orderDetails?: Record<string, string | undefined>;
	exoticHide?: string;
	notes?: string;
}

const SQUARE_API_VERSION = '2026-05-20';
const MAX_PAYMENT_NOTE_LENGTH = 1000;

const exoticHideOptions = [
	{ id: 'none', label: 'No exotic hide', amount: 0 },
	{ id: 'stingray', label: 'Stingray', amount: 100 },
	{ id: 'gator', label: 'Gator', amount: 50 },
	{ id: 'ostrich', label: 'Ostrich', amount: 50 },
];

function getEnvValue(env: Record<string, unknown>, key: string): string | undefined {
	const value = env[key] || process.env[key];
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getExoticHide(id?: string) {
	return exoticHideOptions.find((option) => option.id === id) || exoticHideOptions[0];
}

function makePaymentNote(body: CheckoutRequest, itemSummary: string, total: number): string {
	const details = body.orderDetails || {};
	const exoticHide = getExoticHide(body.exoticHide);
	const parts = [
		`Twisted website order: ${itemSummary}`,
		exoticHide.amount ? `Exotic hide: ${exoticHide.label} +$${exoticHide.amount}` : '',
		body.customerName ? `Name: ${body.customerName}` : '',
		body.email ? `Email: ${body.email}` : '',
		body.phone ? `Phone: ${body.phone}` : '',
		details.address ? `Address: ${details.address}` : '',
		body.deliveryWindow ? `Delivery: ${body.deliveryWindow}` : '',
		details.primaryColor ? `Primary color: ${details.primaryColor}` : '',
		details.secondaryColor ? `Secondary color: ${details.secondaryColor}` : '',
		details.beltSizing ? `Belt sizing: ${details.beltSizing}` : '',
		details.pantsSize ? `Pants size: ${details.pantsSize}` : '',
		details.foldHole ? `Fold-hole: ${details.foldHole}` : '',
		details.purseSize ? `Purse size: ${details.purseSize}` : '',
		details.leatherMaterial ? `Leather/material: ${details.leatherMaterial}` : '',
		details.hardware ? `Hardware: ${details.hardware}` : '',
		details.toolingDesign ? `Tooling/design: ${details.toolingDesign}` : '',
		details.laceStitching ? `Lace/stitching: ${details.laceStitching}` : '',
		details.specialFinish ? `Special finish: ${details.specialFinish}` : '',
		body.notes ? `Notes: ${body.notes}` : '',
		`Order total: $${total}`
	].filter(Boolean);

	return parts.join(' | ').slice(0, MAX_PAYMENT_NOTE_LENGTH);
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json() as CheckoutRequest;
		const requestedItems = Array.isArray(body.items) ? body.items : [];

		if (!requestedItems.length) {
			return NextResponse.json(
				{ error: 'Please add at least one custom order item to your cart.' },
				{ status: 400 }
			);
		}

		const cartItems = requestedItems.map((item) => {
			const product = checkoutProducts.find((checkoutProduct) => checkoutProduct.id === item.id);
			const quantity = Number.isInteger(item.quantity) ? item.quantity : 0;

			if (!product || quantity < 1 || quantity > 10) {
				return null;
			}

			return { ...product, quantity };
		});

		if (cartItems.some((item) => item === null)) {
			return NextResponse.json(
				{ error: 'One of the cart items is not valid.' },
				{ status: 400 }
			);
		}

		const validItems = cartItems as Array<typeof checkoutProducts[number] & { quantity: number }>;
		const exoticHide = getExoticHide(body.exoticHide);
		const itemTotal = validItems.reduce((sum, item) => sum + item.amount * item.quantity, 0);
		const total = itemTotal + exoticHide.amount;
		const itemSummary = validItems
			.map((item) => `${item.quantity} ${item.name}`)
			.join(', ');

		const { env } = getCloudflareContext();
		const runtimeEnv = env as unknown as Record<string, unknown>;
		const squareAccessToken = getEnvValue(runtimeEnv, 'SQUARE_ACCESS_TOKEN');
		const squareLocationId = getEnvValue(runtimeEnv, 'SQUARE_LOCATION_ID');

		if (!squareAccessToken || !squareLocationId) {
			return NextResponse.json(
				{ error: 'Square checkout is not configured yet.' },
				{ status: 500 }
			);
		}

		const origin = new URL(request.url).origin;
		const squareResponse = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${squareAccessToken}`,
				'Square-Version': SQUARE_API_VERSION,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				idempotency_key: crypto.randomUUID(),
				description: 'Twisted Custom Leather website custom order',
				quick_pay: {
					name: 'Twisted Custom Leather Custom Order',
					price_money: {
						amount: total * 100,
						currency: 'USD'
					},
					location_id: squareLocationId
				},
				checkout_options: {
					redirect_url: `${origin}/checkout/success`
				},
				payment_note: makePaymentNote(body, itemSummary, total)
			})
		});

		const data = await squareResponse.json() as {
			payment_link?: { url?: string; long_url?: string };
			errors?: Array<{ detail?: string; code?: string }>;
		};

		if (!squareResponse.ok) {
			console.error('Square checkout error:', data.errors);
			return NextResponse.json(
				{ error: data.errors?.[0]?.detail || 'Square checkout could not be started.' },
				{ status: squareResponse.status }
			);
		}

		const checkoutUrl = data.payment_link?.long_url || data.payment_link?.url;

		if (!checkoutUrl) {
			return NextResponse.json(
				{ error: 'Square did not return a checkout link.' },
				{ status: 500 }
			);
		}

		return NextResponse.json({ checkoutUrl });
	} catch (error) {
		console.error('Checkout error:', error);
		return NextResponse.json(
			{ error: 'Unable to start checkout right now.' },
			{ status: 500 }
		);
	}
}
