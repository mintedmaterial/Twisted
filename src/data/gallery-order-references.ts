export const galleryOrderReferences = [
	{ productId: 'bible-cover', referenceId: 'tooled-portfolio', title: 'Portfolios', thumbnail: '/featured-work/custom-leather-portfolio-black-bg.jpg' },
	{ productId: 'custom-wallet', referenceId: 'wallet-set', title: 'Wallet Set', thumbnail: '/featured-work/custom-leather-wallet-set.jpg' },
	{ productId: 'custom-purse', referenceId: 'floral-purse-set', title: 'Floral Purse Set', thumbnail: '/featured-work/tooled-leather-cross-purse-set.jpg' },
	{ productId: 'welding-armguard', referenceId: 'pipeline-armguard', title: 'Custom Pipeline Arm Guard', thumbnail: '/featured-work/custom-pipeline-leather-armguard.jpg' },
	{ productId: 'custom-belt', referenceId: 'turquoise-belt', title: 'Belts Album', thumbnail: '/featured-work/custom-tooled-belt-rs-tail.jpg' },
	{ productId: 'custom-purse', referenceId: 'fringe-purse', title: 'Leather Fringe Purse', thumbnail: '/purse.jpeg' },
	{ productId: 'custom-purse', referenceId: 'laptop-bag', title: 'Laptop Bag', thumbnail: '/featured-work/custom-leather-floral-purse-lgv.jpg' },
] as const;

export type GalleryOrderReference = (typeof galleryOrderReferences)[number];

export function getGalleryOrderReference(productId: string, referenceId: string): GalleryOrderReference | undefined {
	return galleryOrderReferences.find((reference) => (
		reference.productId === productId && reference.referenceId === referenceId
	));
}

export function isValidGalleryOrderReference(productId: string, referenceId: string): boolean {
	return getGalleryOrderReference(productId, referenceId) !== undefined;
}
