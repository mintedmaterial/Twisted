import Link from 'next/link';
import CheckoutSuccessReturn from '@/components/custom-order/CheckoutSuccessReturn';
import { parseOrderReference } from '@/lib/order-security';

export const metadata = {
	title: 'Custom Order Support | Twisted Custom Leather',
	description: 'Custom leather order checkout support and next steps.'
};

export default async function CheckoutSuccessPage({
	searchParams,
}: {
	searchParams: Promise<{ ref?: string }>;
}) {
	const { ref } = await searchParams;
	const orderReference = parseOrderReference(ref);

	return (
		<div className="relative min-h-screen">
			<CheckoutSuccessReturn orderReference={orderReference} />
			<div className="fixed inset-0 -z-10 overflow-hidden">
				<video
					autoPlay
					loop
					muted
					playsInline
					className="absolute inset-0 w-full h-full object-cover"
				>
					<source src="/background.mp4" type="video/mp4" />
				</video>
				<div className="absolute inset-0 bg-black/70" />
			</div>

			<main className="min-h-screen px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center">
				<div className="glass card-glow rounded-lg border border-copper/30 p-8 text-center md:p-10 max-w-2xl">
					{orderReference ? (
						<>
							<p className="text-copper text-sm uppercase tracking-[0.35em] mb-4">Custom order reference</p>
							<h1 className="heading-western text-glow text-4xl sm:text-5xl text-cream mb-5">Save your order reference</h1>
							<p className="text-beige text-lg leading-relaxed mb-6">You have returned from Square. Save this reference for your records. If your payment completed, Randy will review and confirm your design details and measurements.</p>
							<div className="mb-6 rounded-lg border border-copper/30 bg-charcoal/50 p-4">
								<p className="text-sm uppercase tracking-[0.2em] text-copper">Order reference</p>
								<p className="mt-1 text-2xl font-bold text-cream">{orderReference}</p>
							</div>
						</>
					) : (
						<>
							<p className="text-copper text-sm uppercase tracking-[0.35em] mb-4">Checkout support</p>
							<h1 className="heading-western text-glow text-4xl sm:text-5xl text-cream mb-5">Need help with checkout?</h1>
							<p className="text-beige text-lg leading-relaxed mb-6">We could not verify an order reference from this link. If you need help with checkout, please message Randy on Facebook.</p>
						</>
					)}
					<section aria-labelledby="next-steps-heading" className="mb-8 text-left">
						<h2 id="next-steps-heading" className="heading-western text-2xl text-cream">What happens next</h2>
						<ol className="mt-4 space-y-3">
							<li className="rounded-lg border border-copper/20 p-3"><p className="font-bold text-copper">1. Payment through Square</p><p className="mt-1 text-sm text-beige">Complete payment through Square.</p></li>
							<li className="rounded-lg border border-copper/20 p-3"><p className="font-bold text-copper">2. Review and confirm</p><p className="mt-1 text-sm text-beige">After payment, Randy reviews and confirms design details and measurements before work begins.</p></li>
							<li className="rounded-lg border border-copper/20 p-3"><p className="font-bold text-copper">3. Crafted by hand</p><p className="mt-1 text-sm text-beige">Your piece is handmade after the details are confirmed. Current estimates are 42-56 days.</p></li>
							<li className="rounded-lg border border-copper/20 p-3"><p className="font-bold text-copper">4. Shipping update</p><p className="mt-1 text-sm text-beige">You will receive an update when your order ships.</p></li>
						</ol>
					</section>
					<div className="flex flex-col sm:flex-row justify-center gap-4">
						<Link
							href="/"
							className="inline-flex justify-center px-8 py-4 bg-copper text-charcoal font-bold rounded-lg hover:bg-cream transition-colors"
						>
							Back Home
						</Link>
						<a
							href="https://www.facebook.com/twistedcustomleather"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex justify-center px-8 py-4 border border-copper text-cream font-bold rounded-lg hover:bg-copper/20 transition-colors"
						>
							Message On Facebook
						</a>
						<a href="mailto:randy@twistedcustomleather.com" className="inline-flex justify-center px-8 py-4 border border-copper text-cream font-bold rounded-lg hover:bg-copper/20 transition-colors">Email Randy</a>
					</div>
				</div>
			</main>
		</div>
	);
}
