'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { WalletGalleryImage } from '@/data/galleries';
import {
	getWalletView,
	initialWalletCategory,
	selectWalletCategory,
	walletFilters,
	type ActiveWalletCategory,
} from '@/components/walletGalleryModel';

type WalletGalleryProps = { images: WalletGalleryImage[] };

export default function WalletGallery({ images }: WalletGalleryProps) {
	const [activeCategory, setActiveCategory] = useState<ActiveWalletCategory>(initialWalletCategory);
	const { visibleImages, status } = getWalletView(images, activeCategory);

	return (
		<div>
			<div className="flex flex-wrap gap-3 mb-8" role="group" aria-label="Filter custom wallets by style">
				{walletFilters.map((filter) => (
					<button
						key={filter.value}
						type="button"
						aria-pressed={activeCategory === filter.value}
						onClick={() => setActiveCategory(selectWalletCategory(activeCategory, filter.value))}
						className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper ${activeCategory === filter.value ? 'border-copper bg-copper text-charcoal' : 'border-copper/40 bg-wood-dark/70 text-cream hover:border-copper hover:text-copper-light'}`}
					>
						{filter.label}
					</button>
				))}
			</div>
			<p className="sr-only" role="status">
				{status}
			</p>

			{visibleImages.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
					{visibleImages.map((image) => (
						<article key={image.src} className="group overflow-hidden rounded-lg border border-copper/30 bg-wood-dark/70 card-glow">
							<div className="relative aspect-[4/3] bg-charcoal">
								<Image src={image.src} alt={image.alt} width={image.width} height={image.height} className="absolute inset-0 h-full w-full object-contain" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
							</div>
							<div className="p-5"><h2 className="heading-western text-2xl text-cream">{image.title}</h2></div>
						</article>
					))}
				</div>
			) : (
				<div className="glass rounded-lg border border-copper/30 p-8 text-center">
					<p className="text-beige mb-4">No examples are shown in this category yet.</p>
					<Link href="/#custom-order" className="text-copper-light font-bold hover:text-cream">Start a custom order</Link>
				</div>
			)}

			<div className="mt-10 text-center">
				<Link href="/#custom-order" className="inline-flex items-center justify-center rounded-lg bg-copper px-6 py-3 text-charcoal font-bold hover:bg-cream transition-colors">Start Your Custom Order</Link>
			</div>
		</div>
	);
}
