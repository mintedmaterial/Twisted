import { getProductBySlug } from '@/data/products';
import ProductDetailCard from '@/components/products/ProductDetailCard';
import Link from 'next/link';

export const metadata = {
	title: 'Custom Biker Leather Wallets',
	description: 'Custom handmade biker wallets with snap closures, chain attachments, hand-tooled leather details, and western character.',
	keywords: ['custom biker wallet', 'leather biker wallet', 'chain wallet', 'handmade biker wallet', 'western leather wallet'],
	alternates: {
		canonical: '/products/wallets/biker',
	},
	openGraph: {
		title: 'Custom Biker Leather Wallets',
		description: 'Handmade biker wallets with chain attachments, snap closures, and custom leather tooling.',
		url: '/products/wallets/biker',
		images: [{ url: '/featured-work/custom-biker-wallet.png', width: 1200, height: 630, alt: 'Custom biker leather wallet' }],
	},
};

export default function BikerWalletPage() {
	const bikerWallet = getProductBySlug('custom-biker-wallet');

	if (!bikerWallet) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-cream text-xl">Product not found</p>
			</div>
		);
	}

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
				<div className="absolute inset-0 bg-black/60" />
			</div>

			<main className="px-4 sm:px-6 lg:px-8 py-20">
				<div className="max-w-7xl mx-auto mb-8">
					<nav className="flex items-center gap-2 text-sm text-beige">
						<Link href="/" className="hover:text-copper transition-colors">
							Home
						</Link>
						<span>/</span>
						<Link href="/products/wallets/biker" className="hover:text-copper transition-colors">
							Wallets
						</Link>
						<span>/</span>
						<span className="text-copper">Biker Wallet</span>
					</nav>
				</div>

				<div className="max-w-7xl mx-auto">
					<ProductDetailCard product={bikerWallet} />
				</div>

				<div className="max-w-7xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="glass card-glow rounded-lg p-6">
						<h3 className="heading-western text-copper text-xl mb-2">Secure Carry</h3>
						<p className="text-beige text-sm">
							Designed with snap closure and chain attachment for everyday use.
						</p>
					</div>
					<div className="glass card-glow rounded-lg p-6">
						<h3 className="heading-western text-copper text-xl mb-2">Custom Tooling</h3>
						<p className="text-beige text-sm">
							Add names, initials, brand marks, western tooling, or custom artwork.
						</p>
					</div>
					<div className="glass card-glow rounded-lg p-6">
						<h3 className="heading-western text-copper text-xl mb-2">Made by Hand</h3>
						<p className="text-beige text-sm">
							Cut, tooled, finished, and assembled one order at a time.
						</p>
					</div>
				</div>

				<div className="max-w-7xl mx-auto mt-12 text-center">
					<Link
						href="/products/wallets/bifold-trifold"
						className="inline-block px-8 py-3 glass card-glow rounded-lg text-copper hover:text-copper-light transition-colors"
					>
						View More Wallets
					</Link>
				</div>
			</main>
		</div>
	);
}
