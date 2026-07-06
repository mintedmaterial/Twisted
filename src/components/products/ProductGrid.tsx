import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/data/products';

interface ProductGridProps {
	products: Product[];
	category?: string;
}

export default function ProductGrid({ products }: ProductGridProps) {
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
			{products.map((product) => (
				<Link
					key={product.id}
					href={`/products/wallets/${product.subcategory}`}
					className="glass card-glow rounded-lg overflow-hidden transition-transform hover:scale-[1.03] group"
				>
					{/* Product Image */}
					<div className="relative w-full aspect-[4/3] overflow-hidden bg-beige/10">
						<Image
							src={product.images[0]}
							alt={product.name}
							fill
							className="object-cover transition-transform group-hover:scale-110"
							sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
						/>
					</div>

					{/* Product Info */}
					<div className="p-3 md:p-4">
						{/* Product Name */}
						<h3 className="heading-western text-base md:text-lg text-copper mb-1 group-hover:text-copper-light transition-colors">
							{product.name}
						</h3>

						{/* Description */}
						{product.description && (
							<p className="body-western text-beige text-xs mb-2">
								{product.description}
							</p>
						)}

						{/* Price */}
						<div className="flex items-baseline justify-between mb-2">
							{product.priceRange ? (
								<p className="text-lg md:text-xl font-bold text-copper">
									${product.priceRange.min}—${product.priceRange.max}
								</p>
							) : (
								<p className="text-lg md:text-xl font-bold text-copper">
									${product.price}+
								</p>
							)}
						</div>

						{/* Color Variants Preview */}
						{product.variants && product.variants.find(v => v.type === 'color') && (
							<div className="flex gap-1.5 mb-3">
								{product.variants
									.find(v => v.type === 'color')
									?.options.slice(0, 4)
									.map((color) => (
										<div
											key={color}
											className="w-4 h-4 rounded-full border border-wood-light/30"
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
							className="w-full px-3 py-2 bg-copper/20 border border-copper rounded-md text-copper text-xs md:text-sm font-bold cursor-not-allowed opacity-70 transition-opacity"
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
