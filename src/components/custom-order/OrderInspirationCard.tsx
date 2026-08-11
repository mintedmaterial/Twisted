import type { GalleryOrderReference } from '@/data/gallery-order-references';
import Image from 'next/image';

interface OrderInspirationCardProps {
	reference: GalleryOrderReference;
	onRemove: () => void;
}

export default function OrderInspirationCard({ reference, onRemove }: OrderInspirationCardProps) {
	return (
		<aside className="mb-6 flex items-center gap-4 rounded-lg border border-copper/40 bg-charcoal/50 p-3" aria-label="Selected gallery inspiration">
			<Image
				src={reference.thumbnail}
				alt=""
				width={80}
				height={80}
				className="h-20 w-20 shrink-0 rounded-md border border-copper/30 object-cover"
			/>
			<div className="min-w-0 flex-1">
				<p className="text-xs font-bold uppercase tracking-[0.18em] text-copper-light">Gallery inspiration</p>
				<p className="mt-1 truncate font-bold text-cream">{reference.title}</p>
				<p className="mt-1 text-sm text-beige">We’ll use this as a visual direction, not copy it exactly.</p>
			</div>
			<button
				type="button"
				onClick={onRemove}
				className="min-h-11 shrink-0 rounded-md px-3 text-sm font-bold text-cream underline decoration-copper underline-offset-4 hover:text-copper-light"
				aria-label={`Remove ${reference.title} inspiration`}
			>
				Remove
			</button>
		</aside>
	);
}
