import Link from 'next/link';

export const metadata = {
	title: 'Order Received | Twisted Custom Leather',
	description: 'Your custom leather order payment was received.'
};

export default function CheckoutSuccessPage() {
	return (
		<div className="relative min-h-screen">
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
				<div className="glass card-glow rounded-lg p-8 md:p-10 border border-copper/30 max-w-2xl text-center">
					<p className="text-copper text-sm uppercase tracking-[0.35em] mb-4">
						Thank You
					</p>
					<h1 className="heading-western text-glow text-4xl sm:text-5xl text-cream mb-5">
						Your Order Was Received
					</h1>
					<p className="text-beige text-lg leading-relaxed mb-8">
						We will review your custom leather order details and follow up to confirm the final
						design and timeline.
					</p>
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
					</div>
				</div>
			</main>
		</div>
	);
}
