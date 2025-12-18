import { getProductBySlug } from '@/data/products';
import ProductDetailCard from '@/components/products/ProductDetailCard';
import Link from 'next/link';

export const metadata = {
	title: 'Lifetime Clutch Wallet | Twisted Custom Leather',
	description: 'Premium clutch wallet with phone compartment, card slots, and cash storage. Handmade to order. Starting at $125.',
	keywords: ['clutch wallet', 'phone wallet', 'leather clutch', 'handmade wallet', 'premium wallet']
};

export default function ClutchWalletPage() {
	const clutchWallet = getProductBySlug('lifetime-clutch-wallet');

	if (!clutchWallet) {
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
						<Link href="/products/wallets/clutch" className="hover:text-copper transition-colors">
							Wallets
						</Link>
						<span>/</span>
						<span className="text-copper">Clutch</span>
					</nav>
				</div>

				{/* Product Detail Card */}
				<div className="max-w-7xl mx-auto">
					<ProductDetailCard product={clutchWallet} />
				</div>

				{/* Additional Information */}
				<div className="max-w-7xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Craftsmanship */}
					<div className="glass card-glow rounded-lg p-6">
						<div className="w-12 h-12 bg-copper/20 rounded-full flex items-center justify-center mb-4">
							<svg className="w-6 h-6 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 className="heading-western text-copper text-xl mb-2">Handmade Quality</h3>
						<p className="text-beige text-sm">
							Each wallet is hand-stitched with premium full-grain leather and built to last a lifetime.
						</p>
					</div>

					{/* Customization */}
					<div className="glass card-glow rounded-lg p-6">
						<div className="w-12 h-12 bg-copper/20 rounded-full flex items-center justify-center mb-4">
							<svg className="w-6 h-6 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
							</svg>
						</div>
						<h3 className="heading-western text-copper text-xl mb-2">Custom Options</h3>
						<p className="text-beige text-sm">
							Choose from multiple leather colors and add personal tooling or initials.
						</p>
					</div>

					{/* Made to Order */}
					<div className="glass card-glow rounded-lg p-6">
						<div className="w-12 h-12 bg-copper/20 rounded-full flex items-center justify-center mb-4">
							<svg className="w-6 h-6 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 className="heading-western text-copper text-xl mb-2">Made to Order</h3>
						<p className="text-beige text-sm">
							Allow 12-14 business days for your custom wallet to be crafted with care.
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
