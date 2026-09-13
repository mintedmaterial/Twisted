import Image from 'next/image';
import type { Product } from '@/data/products';

interface ProductGridProps {
	products: Product[];
	category?: string;
}

const walletAlbumLinks: Record<string, string> = {
	'hand-stitched-slim-wallet': 'https://photos.google.com/share/AF1QipPJk4btpXPnH-McibDEZ4QTESKuRc68yOedEQInOubeEHHuGUK95jK44Ic49YL1sQ?key=MFc5eGZtemttWDhrSWF5OFFxTzRTbS13ODZVYnFR',
	'minimalist-card-holder': 'https://photos.google.com/share/AF1QipMEfOqFlmaDcTS513GOviHY4C24pBz8vrewQc7kGON2aQ6336dcmZkjowjhBYH1yw?key=UC1jXzB5aHk4eWFhRURpc2IwR3NrSUZVbTdxenJn',
	'classic-bifold-wallet': 'https://photos.google.com/share/AF1QipPJk4btpXPnH-McibDEZ4QTESKuRc68yOedEQInOubeEHHuGUK95jK44Ic49YL1sQ?key=MFc5eGZtemttWDhrSWF5OFFxTzRTbS13ODZVYnFR',
	'checkbook-roper-wallet': 'https://photos.google.com/share/AF1QipOM2VPGNu1ZYNHw9PLOQAfkdQwkkKvQzHSlrGcdWDesfJ_avXuYXnfj7m-okskLMg?key=bDNJVE81WEtjUnhSZ2U4QWxpeW9lZ0xrdmVtZUtB',
	'money-clip-wallet': 'https://photos.google.com/share/AF1QipNOTSGdDeCR25xI0s3icxjhEEgCDGlZSFGJZS9jnSnUtZ93FHG2xIM5QZPuzSK6OQ?key=c3VRZk9DdXpMb0h5YjVraXZEZ21BWVBabVhrblFn',
	'trifold-wallet': 'https://photos.google.com/share/AF1QipMEfOqFlmaDcTS513GOviHY4C24pBz8vrewQc7kGON2aQ6336dcmZkjowjhBYH1yw?key=UC1jXzB5aHk4eWFhRURpc2IwR3NrSUZVbTdxenJn',
};

const walletAlbumLabels: Record<string, string> = {
	'hand-stitched-slim-wallet': 'Bi-fold Wallets',
	'minimalist-card-holder': 'Tri-fold Wallets',
	'classic-bifold-wallet': 'Bi-fold Wallets',
	'checkbook-roper-wallet': 'Roper Checkbook Wallet',
	'money-clip-wallet': 'Money Clip Wallet',
	'trifold-wallet': 'Tri-fold Wallets',
};

export default function ProductGrid({ products }: ProductGridProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{products.map((product) => {
				const albumHref = walletAlbumLinks[product.slug];
				const displayName = walletAlbumLabels[product.slug] ?? product.name;
				const href = albumHref ?? `/products/wallets/${product.subcategory}`;

				return (
					<a
						key={product.id}
						href={href}
						target={albumHref ? '_blank' : undefined}
						rel={albumHref ? 'noopener noreferrer' : undefined}
						className="glass card-glow rounded-lg overflow-hidden transition-transform hover:scale-105 group"
					>
						{/* Product Image */}
						<div className="relative w-full aspect-square overflow-hidden bg-beige/10">
							<Image
								src={product.images[0]}
								alt={displayName}
								fill
								className="object-cover transition-transform group-hover:scale-110"
								sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
							/>
						</div>

						{/* Product Info */}
						<div className="p-6">
							{/* Product Name */}
							<h3 className="heading-western text-xl text-copper mb-2 group-hover:text-copper-light transition-colors">
								{displayName}
							</h3>

							{/* Description */}
							{product.description && (
								<p className="body-western text-beige text-sm mb-3">
									{product.description}
								</p>
							)}

							{/* Price */}
							<div className="flex items-baseline justify-between mb-4">
								{product.priceRange ? (
									<p className="text-2xl font-bold text-copper">
										${product.priceRange.min}—${product.priceRange.max}
									</p>
								) : (
									<p className="text-2xl font-bold text-copper">
										${product.price}+
									</p>
								)}
							</div>

							{/* Color Variants Preview */}
							{product.variants && product.variants.find(v => v.type === 'color') && (
								<div className="flex gap-2 mb-4">
									{product.variants
										.find(v => v.type === 'color')
										?.options.slice(0, 4)
										.map((color) => (
											<div
												key={color}
												className="w-6 h-6 rounded-full border-2 border-wood-light/30"
												style={{
													backgroundColor:
														color === 'Black' ? '#000000' :
														color === 'Brown' ? '#5c4a3a' :
														color === 'Tan' ? '#d4c5b0' :
														color === 'Natural' ? '#f5f1e8' :
														'#8b7355'
												}}
												title={color}
											/>
										))}
								</div>
							)}

							{/* Photo Album Button */}
							<div className="w-full px-6 py-3 bg-copper/20 border-2 border-copper rounded-lg text-copper font-bold text-center transition-colors group-hover:bg-copper/30 group-hover:text-copper-light">
								{albumHref ? 'View Photos' : 'Coming Soon'}
							</div>

							{/* Tooling Badge */}
							{product.toolingIncluded && (
								<div className="mt-3 text-xs text-sage text-center">
									✓ Minimal Tooling Included
								</div>
							)}
						</div>
					</a>
				);
			})}
		</div>
	);
}
