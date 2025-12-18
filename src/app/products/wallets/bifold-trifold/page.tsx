import { getProductsBySubcategory } from '@/data/products';
import ProductGrid from '@/components/products/ProductGrid';

export const metadata = {
	title: 'Bifold & Trifold Wallets | Twisted Custom Leather',
	description: 'Traditional bifold and trifold leather wallets. Handmade with premium materials. Starting at $95.',
	keywords: ['bifold wallet', 'trifold wallet', 'leather wallet', 'handmade wallet', 'traditional wallet']
};

export default function BifoldTrifoldWalletsPage() {
	const bifoldWallets = getProductsBySubcategory('bifold');
	const trifoldWallets = getProductsBySubcategory('trifold');
	const allWallets = [...bifoldWallets, ...trifoldWallets];

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
				{/* Page Header */}
				<div className="max-w-7xl mx-auto mb-12">
					<h1 className="heading-western text-glow text-5xl sm:text-6xl lg:text-7xl text-cream mb-4">
						Bifold & Trifold Wallets
					</h1>
					<p className="body-western text-xl text-beige max-w-3xl">
						Classic wallet designs with ample storage for cards and cash.
						Timeless craftsmanship meets modern functionality.
					</p>
					<div className="mt-6 flex flex-wrap gap-4 text-sm text-sage">
						<div className="flex items-center gap-2">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
							<span>Starting at $95</span>
						</div>
						<div className="flex items-center gap-2">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
							<span>Premium Full-Grain Leather</span>
						</div>
						<div className="flex items-center gap-2">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
							<span>Hand-Stitched</span>
						</div>
					</div>
				</div>

				{/* Product Grid */}
				<div className="max-w-7xl mx-auto">
					<ProductGrid products={allWallets} category="bifold-trifold" />
				</div>

				{/* Coming Soon Notice */}
				<div className="max-w-7xl mx-auto mt-12">
					<div className="glass card-glow rounded-lg p-8 text-center">
						<h2 className="heading-western text-copper text-2xl mb-3">
							Custom Orders Available Soon
						</h2>
						<p className="text-beige mb-4">
							We're preparing our online store for launch.
							Each piece is handmade to order with premium materials.
						</p>
						<p className="text-sm text-sage">
							Check back soon or contact us for custom inquiries
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}
