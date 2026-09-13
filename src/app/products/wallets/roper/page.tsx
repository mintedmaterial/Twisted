import { getProductBySlug } from '@/data/products';
import ProductDetailCard from '@/components/products/ProductDetailCard';
import Link from 'next/link';

export const metadata = {
	title: 'Custom Roper and Field Notes Leather Wallets',
	description: 'Handmade roper and Field Notes leather wallets with notebook pockets, card slots, pen holders, western tooling, and rugged everyday construction.',
	keywords: ['custom roper wallet', 'field notes wallet', 'western wallet', 'notebook wallet', 'handmade leather wallet'],
	alternates: {
		canonical: '/products/wallets/roper',
	},
	openGraph: {
		title: 'Custom Roper and Field Notes Leather Wallets',
		description: 'Field-ready handmade leather wallets with notebook storage, card slots, and western craftsmanship.',
		url: '/products/wallets/roper',
		images: [{ url: '/Fieldnote-cover.jpeg', width: 1200, height: 630, alt: 'Custom Field Notes leather wallet' }],
	},
};

export default function RoperWalletPage() {
	const roperWallet = getProductBySlug('field-notes-wallet');

	if (!roperWallet) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-cream text-xl">Product not found</p>
			</div>
		);
	}

	return (
		<div className="relative min-h-screen">
			{/* Video Background */}
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
				<div className="absolute inset-0 bg-black/60" />
			</div>

			{/* Page Content */}
			<main className="px-4 sm:px-6 lg:px-8 py-20">
				{/* Breadcrumb Navigation */}
				<div className="max-w-7xl mx-auto mb-8">
					<nav className="flex items-center gap-2 text-sm text-beige">
						<Link href="/" className="hover:text-copper transition-colors">
							Home
						</Link>
						<span>/</span>
						<Link href="/products/wallets/roper" className="hover:text-copper transition-colors">
							Wallets
						</Link>
						<span>/</span>
						<span className="text-copper">Roper</span>
					</nav>
				</div>

				{/* Product Detail Card */}
				<div className="max-w-7xl mx-auto">
					<ProductDetailCard product={roperWallet} />
				</div>

				{/* Additional Information */}
				<div className="max-w-7xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Western Heritage */}
					<div className="glass card-glow rounded-lg p-6">
						<div className="w-12 h-12 bg-copper/20 rounded-full flex items-center justify-center mb-4">
							<svg className="w-6 h-6 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
							</svg>
						</div>
						<h3 className="heading-western text-copper text-xl mb-2">Western Heritage</h3>
						<p className="text-beige text-sm">
							Traditional roper-style design with authentic western tooling and craftsmanship.
						</p>
					</div>

					{/* Functional Design */}
					<div className="glass card-glow rounded-lg p-6">
						<div className="w-12 h-12 bg-copper/20 rounded-full flex items-center justify-center mb-4">
							<svg className="w-6 h-6 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<h3 className="heading-western text-copper text-xl mb-2">Field Ready</h3>
						<p className="text-beige text-sm">
							Integrated pocket for field notes and pen holder for recording on the go.
						</p>
					</div>

					{/* Durable Construction */}
					<div className="glass card-glow rounded-lg p-6">
						<div className="w-12 h-12 bg-copper/20 rounded-full flex items-center justify-center mb-4">
							<svg className="w-6 h-6 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
						</div>
						<h3 className="heading-western text-copper text-xl mb-2">Built to Last</h3>
						<p className="text-beige text-sm">
							Heavy-duty construction designed for daily use in demanding conditions.
						</p>
					</div>
				</div>

				{/* Back to Collection */}
				<div className="max-w-7xl mx-auto mt-12 text-center">
					<Link
						href="/products/wallets/slim"
						className="inline-block px-8 py-3 glass card-glow rounded-lg text-copper hover:text-copper-light transition-colors"
					>
						← View All Wallets
					</Link>
				</div>
			</main>
		</div>
	);
}
