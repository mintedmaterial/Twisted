'use client';

import { FormEvent, useMemo, useState } from 'react';
import { checkoutProducts } from '@/data/checkout-products';

type Cart = Record<string, number>;

type DetailKey =
	| 'address'
	| 'primaryColor'
	| 'secondaryColor'
	| 'beltSizing'
	| 'pantsSize'
	| 'foldHole'
	| 'purseSize'
	| 'leatherMaterial'
	| 'hardware'
	| 'toolingDesign'
	| 'laceStitching'
	| 'specialFinish';

type OrderDetails = Record<DetailKey, string>;

const blankOrderDetails: OrderDetails = {
	address: '',
	primaryColor: '',
	secondaryColor: '',
	beltSizing: '',
	pantsSize: '',
	foldHole: '',
	purseSize: '',
	leatherMaterial: '',
	hardware: '',
	toolingDesign: '',
	laceStitching: '',
	specialFinish: '',
};

const detailFields: Array<{ key: DetailKey; label: string; wide?: boolean }> = [
	{ key: 'address', label: 'Address', wide: true },
	{ key: 'primaryColor', label: 'Primary color' },
	{ key: 'secondaryColor', label: 'Secondary color' },
	{ key: 'beltSizing', label: 'Belt sizing' },
	{ key: 'pantsSize', label: 'Pants size' },
	{ key: 'foldHole', label: 'Fold-hole' },
	{ key: 'purseSize', label: 'Purse size' },
	{ key: 'leatherMaterial', label: 'Leather / material' },
	{ key: 'hardware', label: 'Hardware' },
	{ key: 'toolingDesign', label: 'Tooling / design', wide: true },
	{ key: 'laceStitching', label: 'Lace / stitching', wide: true },
	{ key: 'specialFinish', label: 'Pipeliner / special finish', wide: true },
];

export default function CustomOrderCheckout() {
	const [cart, setCart] = useState<Cart>({});
	const [customerName, setCustomerName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [notes, setNotes] = useState('');
	const [orderDetails, setOrderDetails] = useState<OrderDetails>(blankOrderDetails);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const cartItems = useMemo(() => checkoutProducts
		.map((product) => ({ ...product, quantity: cart[product.id] || 0 }))
		.filter((product) => product.quantity > 0), [cart]);

	const total = cartItems.reduce((sum, item) => sum + item.amount * item.quantity, 0);
	const deliveryWindow = useMemo(() => {
		const today = new Date();
		const start = new Date(today);
		const end = new Date(today);
		start.setDate(today.getDate() + 42);
		end.setDate(today.getDate() + 56);
		return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
	}, []);

	function updateQuantity(id: string, nextQuantity: number) {
		setCart((current) => {
			const updated = { ...current };
			if (nextQuantity <= 0) delete updated[id];
			else updated[id] = Math.min(nextQuantity, 10);
			return updated;
		});
	}

	function updateOrderDetail(key: DetailKey, value: string) {
		setOrderDetails((current) => ({ ...current, [key]: value }));
	}

	async function handleCheckout(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');

		if (!cartItems.length) {
			setError('Please add at least one custom order item to your cart.');
			return;
		}

		if (!customerName.trim() || !email.trim()) {
			setError('Please add your name and email before checkout.');
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
					customerName,
					email,
					phone,
					deliveryWindow,
					orderDetails,
					notes,
				}),
			});

			const data = await response.json() as { checkoutUrl?: string; error?: string };
			if (!response.ok || !data.checkoutUrl) throw new Error(data.error || 'Checkout could not be started.');
			window.location.href = data.checkoutUrl;
		} catch (checkoutError) {
			setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout could not be started.');
			setIsLoading(false);
		}
	}

	return (
		<section id="custom-order" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-12">
					<p className="text-copper text-sm uppercase tracking-[0.35em] mb-4">Secure Square Checkout</p>
					<h2 className="heading-western text-glow text-4xl sm:text-5xl md:text-6xl text-cream mb-4">Start A Custom Order</h2>
					<p className="body-western text-xl text-beige max-w-3xl mx-auto">
						Choose a starting-price item, tell us what you want made, and finish payment safely through Square.
					</p>
				</div>

				<form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
						{checkoutProducts.map((product) => {
							const quantity = cart[product.id] || 0;
							return (
								<div key={product.id} className="glass card-glow rounded-lg p-6 border border-copper/20">
									<div className="flex items-start justify-between gap-4 mb-3">
										<h3 className="heading-western text-2xl text-cream">{product.name}</h3>
										<p className="text-copper font-bold text-xl">${product.amount}</p>
									</div>
									<p className="text-beige text-sm leading-relaxed mb-5">{product.description}</p>
									<div className="flex items-center gap-3">
										<button type="button" onClick={() => updateQuantity(product.id, quantity - 1)} className="w-10 h-10 rounded-lg border border-copper/50 text-cream hover:bg-copper/20 transition-colors" aria-label={`Remove ${product.name}`}>-</button>
										<span className="w-10 text-center text-cream font-bold">{quantity}</span>
										<button type="button" onClick={() => updateQuantity(product.id, quantity + 1)} className="w-10 h-10 rounded-lg bg-copper text-charcoal font-bold hover:bg-cream transition-colors" aria-label={`Add ${product.name}`}>+</button>
									</div>
								</div>
							);
						})}
					</div>

					<div className="glass card-glow rounded-lg p-6 border border-copper/30 h-fit">
						<h3 className="heading-western text-3xl text-cream mb-5">Order Cart</h3>
						<div className="space-y-3 mb-6">
							{cartItems.length ? cartItems.map((item) => (
								<div key={item.id} className="flex items-center justify-between gap-4 text-beige">
									<span>{item.quantity} x {item.name}</span>
									<span className="text-copper font-bold">${item.amount * item.quantity}</span>
								</div>
							)) : <p className="text-beige">Choose an item to get started.</p>}
						</div>

						<div className="border-t border-copper/30 pt-4 mb-6 flex items-center justify-between">
							<span className="text-cream font-bold text-lg">Order total</span>
							<span className="text-copper font-bold text-2xl">${total}</span>
						</div>

						<div className="space-y-4">
							<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name" className="w-full rounded-lg border border-copper/30 bg-charcoal/70 px-4 py-3 text-cream placeholder:text-beige/70 focus:outline-none focus:border-copper" />
							<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="w-full rounded-lg border border-copper/30 bg-charcoal/70 px-4 py-3 text-cream placeholder:text-beige/70 focus:outline-none focus:border-copper" />
							<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" className="w-full rounded-lg border border-copper/30 bg-charcoal/70 px-4 py-3 text-cream placeholder:text-beige/70 focus:outline-none focus:border-copper" />

							<div className="rounded-lg border border-copper/20 bg-charcoal/40 p-4">
								<p className="text-cream font-bold mb-3">Custom order details</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{detailFields.map((field) => (
										<input key={field.key} value={orderDetails[field.key]} onChange={(event) => updateOrderDetail(field.key, event.target.value)} placeholder={field.label} className={`w-full rounded-lg border border-copper/30 bg-charcoal/70 px-4 py-3 text-cream placeholder:text-beige/70 focus:outline-none focus:border-copper ${field.wide ? 'sm:col-span-2' : ''}`} />
									))}
								</div>
							</div>

							<div className="rounded-lg border border-copper/20 bg-charcoal/40 px-4 py-3 text-sm text-beige">
								<span className="text-cream font-bold">Estimated delivery:</span> {deliveryWindow}
							</div>

							<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Extra notes" rows={5} className="w-full rounded-lg border border-copper/30 bg-charcoal/70 px-4 py-3 text-cream placeholder:text-beige/70 focus:outline-none focus:border-copper resize-none" />
						</div>

						{error && <p className="mt-4 text-sm text-red-300">{error}</p>}
						<button type="submit" disabled={isLoading} className="mt-6 w-full px-8 py-4 bg-copper text-charcoal font-bold rounded-lg hover:bg-cream transition-colors disabled:opacity-60 disabled:cursor-wait">
							{isLoading ? 'Opening Square...' : 'Checkout With Square'}
						</button>
						<p className="text-xs text-beige/80 mt-4 text-center">Prices are starting totals for standard custom work.</p>
					</div>
				</form>
			</div>
		</section>
	);
}
