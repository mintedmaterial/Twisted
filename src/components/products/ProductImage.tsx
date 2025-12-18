'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductImageProps {
	images: string[];
	alt: string;
	priority?: boolean;
}

/**
 * Product Image Component with hover zoom effect
 * Future: Will support image gallery with multiple images
 */
export default function ProductImage({ images, alt, priority = false }: ProductImageProps) {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	return (
		<div className="w-full">
			{/* Main Image */}
			<div className="relative w-full aspect-square overflow-hidden rounded-lg bg-beige/10 group">
				<Image
					src={images[currentImageIndex]}
					alt={alt}
					fill
					className="object-cover transition-transform group-hover:scale-110"
					priority={priority}
					sizes="(max-width: 1024px) 100vw, 50vw"
				/>
			</div>

			{/* Thumbnail Gallery (Future: when multiple images are available) */}
			{images.length > 1 && (
				<div className="grid grid-cols-4 gap-2 mt-4">
					{images.map((image, index) => (
						<button
							key={index}
							onClick={() => setCurrentImageIndex(index)}
							className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
								index === currentImageIndex
									? 'border-copper scale-105'
									: 'border-wood-light/30 hover:border-copper/50'
							}`}
						>
							<Image
								src={image}
								alt={`${alt} - View ${index + 1}`}
								fill
								className="object-cover"
								sizes="100px"
							/>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
