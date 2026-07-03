import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/data/products';

interface ProductGridProps {
	products: Product[];
	category?: string;
}

export default function ProductGrid({ products }: ProductGridProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{products.map((product) => (
				<Link
					key={product.id}
					href={`/products/wallets/${product.subcategory}`}
					className="glass card-glow rounded-lg overflow-hidden transition-transform hover:scale-105 group"
				>
					{/* Product Image */}
					<div className="relative w-full aspect-square overflow-hidden bg-beige/10">
						<Image
							src={product.images[0]}
							alt={product.name}
							fill
							className="object-cover transition-transform group-hover:scale-110"
							sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
						/>
					</div>

					{/* Product Info */}
					<div className="p-6">
						{/* Product Name */}
						<h3 className="heading-western text-xl text-copper mb-2 group-hover:text-copper-light transition-colors">
							{product.name}
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

						{/* Coming Soon Button */}
						<button
							className="w-full px-6 py-3 bg-copper/20 border-2 border-copper rounded-lg text-copper font-bold cursor-not-allowed opacity-70 transition-opacity"
							disabled
						>
							Coming Soon
						</button>

						{/* Tooling Badge */}
						{product.toolingIncluded && (
							<div className="mt-3 text-xs text-sage text-center">
								✓ Minimal Tooling Included
							</div>
						)}
					</div>
				</Link>
			))}
		</div>
	);
}
