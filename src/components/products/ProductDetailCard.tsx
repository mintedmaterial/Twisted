import Image from 'next/image';
import type { Product } from '@/data/products';
import VariantSelector from './VariantSelector';

interface ProductDetailCardProps {
	product: Product;
}

export default function ProductDetailCard({ product }: ProductDetailCardProps) {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
			{/* Product Image - Left Column */}
			<div className="glass card-glow rounded-lg overflow-hidden p-6">
				<div className="relative w-full aspect-square bg-beige/10 rounded-lg overflow-hidden">
					<Image
						src={product.images[0]}
						alt={product.name}
						fill
						className="object-cover"
						priority
						sizes="(max-width: 1024px) 100vw, 50vw"
					/>
				</div>
				{/* Additional images would go here in future */}
			</div>

			{/* Product Details - Right Column */}
			<div className="flex flex-col">
				{/* Product Name */}
				<h1 className="heading-western text-glow text-4xl sm:text-5xl lg:text-6xl text-cream mb-4">
					{product.name}
				</h1>

				{/* Price */}
				<div className="mb-6">
					{product.priceRange ? (
						<p className="text-3xl sm:text-4xl font-bold text-copper">
							${product.priceRange.min}—${product.priceRange.max}
						</p>
					) : (
						<p className="text-3xl sm:text-4xl font-bold text-copper">
							${product.price}+
						</p>
					)}
					<p className="text-sm text-beige italic mt-1">
						Pricing varies by customization
					</p>
				</div>

				{/* Short Description */}
				<p className="body-western text-lg text-beige mb-6">
					{product.longDescription || product.description}
				</p>

				{/* Color Variant Selector */}
				{product.variants && product.variants.find(v => v.type === 'color') && (
					<div className="mb-6">
						<h3 className="heading-western text-copper text-xl mb-3">
							Select Color
						</h3>
						<VariantSelector
							variant={product.variants.find(v => v.type === 'color')!}
						/>
					</div>
				)}

				{/* Coming Soon Button */}
				<button
					className="w-full px-8 py-4 bg-copper/20 border-2 border-copper rounded-lg text-copper text-xl font-bold cursor-not-allowed opacity-70 transition-opacity mb-6"
					disabled
				>
					Coming Soon
				</button>

				{/* Tooling Badge */}
				{product.toolingIncluded && (
					<div className="glass card-glow rounded-lg p-4 mb-6">
						<div className="flex items-center gap-2 text-sage">
							<svg
								className="w-5 h-5"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clipRule="evenodd"
								/>
							</svg>
							<span className="font-bold">Minimal Tooling Included</span>
						</div>
					</div>
				)}

				{/* Product Features */}
				<div className="glass card-glow rounded-lg p-6">
					<h3 className="heading-western text-copper text-2xl mb-4">
						Features
					</h3>
					<ul className="space-y-3">
						{product.features.map((feature, index) => (
							<li key={index} className="flex items-start gap-3 text-beige">
								<svg
									className="w-5 h-5 text-copper mt-1 flex-shrink-0"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
								<span>{feature}</span>
							</li>
						))}
					</ul>
				</div>

				{/* Production Time Notice */}
				<div className="mt-6 p-4 bg-wood-medium/20 border border-wood-light/30 rounded-lg">
					<p className="text-sm text-beige text-center">
						<span className="font-bold text-copper">Handmade to Order:</span>{' '}
						Please allow 12-14 business days for production
					</p>
				</div>
			</div>
		</div>
	);
}
