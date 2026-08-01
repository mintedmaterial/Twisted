import type { WalletCategory, WalletGalleryImage } from '@/data/galleries';

export const walletFilters = [
	{ value: 'all', label: 'All' },
	{ value: 'bifold', label: 'Bifold' },
	{ value: 'trifold', label: 'Tri-fold' },
	{ value: 'roper', label: 'Roper' },
	{ value: 'biker', label: 'Biker' },
	{ value: 'checkbook-long', label: 'Checkbook / Long' },
] as const;

export type ActiveWalletCategory = 'all' | WalletCategory;

export const initialWalletCategory: ActiveWalletCategory = 'all';

export function selectWalletCategory(current: ActiveWalletCategory, next: string): ActiveWalletCategory {
	return walletFilters.some((filter) => filter.value === next)
		? next as ActiveWalletCategory
		: current;
}

export function getWalletView(images: WalletGalleryImage[], activeCategory: ActiveWalletCategory) {
	const visibleImages = activeCategory === 'all'
		? images
		: images.filter((image) => image.category === activeCategory);
	const activeFilter = walletFilters.find((filter) => filter.value === activeCategory) ?? walletFilters[0];
	const noun = visibleImages.length === 1 ? 'wallet' : 'wallets';

	return {
		visibleImages,
		status: `${visibleImages.length} ${noun} shown for ${activeFilter.label}.`,
	};
}
