/**
 * Product Data Structure for Twisted Custom Leather
 *
 * This file contains product interfaces and static data.
 * In future phases, this will be replaced with D1 database queries.
 */

export interface ProductVariant {
	type: 'color' | 'size' | 'material';
	options: string[];
}

export interface Product {
	id: string;
	slug: string;
	name: string;
	category: 'wallets' | 'belts' | 'purses' | 'welding-gear' | 'bible-covers';
	subcategory?: 'slim' | 'bifold' | 'trifold' | 'clutch' | 'roper';
	price: number;  // Starting price
	priceRange?: {
		min: number;
		max: number;
	};
	images: string[];  // Array of image paths
	description: string;
	longDescription?: string;
	features: string[];
	variants?: ProductVariant[];
	inStock: boolean;  // false for Phase 1 "Coming Soon"
	toolingIncluded?: boolean;  // true for minimal/slim wallets
	readyToShip?: boolean;  // Future: for inventory tracking
}

const walletPhoto = '/wallet.png';
const moneyClipWalletPhoto = 'data:image/jpeg;base64,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';

/**
 * Wallet Products
 * Start at $85, minimal wallets include tooling
 */
export const walletProducts: Product[] = [
	{
		id: 'slim-wallet-001',
		slug: 'hand-stitched-slim-wallet',
		name: 'Hand-Stitched Slim Wallet',
		category: 'wallets',
		subcategory: 'slim',
		price: 85,
		images: [walletPhoto],
		description: 'Coming Soon',
		longDescription: 'Premium hand-stitched leather slim wallet with minimal tooling. Handmade to order with 12-14 business days production time.',
		features: [
			'Minimal tooling included',
			'Handmade to order',
			'12-14 business days production',
			'Premium full-grain leather',
			'Hand-stitched construction'
		],
		variants: [
			{ type: 'color', options: ['Black', 'Brown', 'Tan', 'Natural'] }
		],
		inStock: false,
		toolingIncluded: true
	},
	{
		id: 'slim-wallet-002',
		slug: 'minimalist-card-holder',
		name: 'Minimalist Card Holder',
		category: 'wallets',
		subcategory: 'slim',
		price: 85,
		images: [walletPhoto],
		description: 'Coming Soon',
		longDescription: 'Ultra-slim card holder perfect for carrying essentials. Features minimal tooling and handcrafted quality.',
		features: [
			'Minimal tooling included',
			'Ultra-slim design',
			'Holds 4-6 cards',
			'Handmade to order',
			'Full-grain leather'
		],
		variants: [
			{ type: 'color', options: ['Black', 'Brown', 'Tan'] }
		],
		inStock: false,
		toolingIncluded: true
	},
	{
		id: 'slim-wallet-003',
		slug: 'money-clip-wallet',
		name: 'Money Clip Wallet',
		category: 'wallets',
		subcategory: 'slim',
		price: 95,
		priceRange: { min: 95, max: 110 },
		images: [moneyClipWalletPhoto],
		description: 'Coming Soon',
		longDescription: 'Slim leather money clip wallet with custom tooling and a compact everyday-carry layout.',
		features: [
			'Minimal tooling included',
			'Money clip layout',
			'Compact card storage',
			'Slim pocket profile',
			'Handmade to order'
		],
		variants: [
			{ type: 'color', options: ['Black', 'Brown', 'Tan', 'Natural'] }
		],
		inStock: false,
		toolingIncluded: true
	},
	{
		id: 'bifold-wallet-001',
		slug: 'classic-bifold-wallet',
		name: 'Classic Bifold Wallet',
		category: 'wallets',
		subcategory: 'bifold',
		price: 95,
		priceRange: { min: 95, max: 125 },
		images: [walletPhoto],
		description: 'Coming Soon',
		longDescription: 'Timeless bifold design with ample storage for cards and cash. Hand-stitched with premium leather.',
		features: [
			'Traditional bifold design',
			'Multiple card slots',
			'Bill compartment',
			'ID window option',
			'Handmade to order'
		],
		variants: [
			{ type: 'color', options: ['Black', 'Brown', 'Tan', 'Natural'] }
		],
		inStock: false
	},
	{
		id: 'trifold-wallet-001',
		slug: 'trifold-wallet',
		name: 'Trifold Wallet',
		category: 'wallets',
		subcategory: 'trifold',
		price: 110,
		priceRange: { min: 110, max: 140 },
		images: [walletPhoto],
		description: 'Coming Soon',
		longDescription: 'Maximum storage in a compact trifold design. Perfect for those who carry more cards and need organization.',
		features: [
			'Trifold design',
			'Extended card capacity',
			'Multiple compartments',
			'Secure closure',
			'Handmade to order'
		],
		variants: [
			{ type: 'color', options: ['Black', 'Brown', 'Tan'] }
		],
		inStock: false
	},
	{
		id: 'clutch-wallet-001',
		slug: 'lifetime-clutch-wallet',
		name: 'Lifetime Clutch Wallet',
		category: 'wallets',
		subcategory: 'clutch',
		price: 125,
		priceRange: { min: 125, max: 155 },
		images: [walletPhoto],
		description: 'Coming Soon',
		longDescription: 'Premium clutch wallet with room for cards, cash, and everyday essentials. Perfect for everyday carry or special occasions.',
		features: [
			'Interior storage compartment',
			'Multiple card slots',
			'Cash storage',
			'Wrist strap option',
			'Premium leather',
			'Handmade to order'
		],
		variants: [
			{ type: 'color', options: ['Black', 'Brown', 'Tan', 'Natural'] }
		],
		inStock: false
	},
	{
		id: 'roper-wallet-001',
		slug: 'field-notes-wallet',
		name: 'Field Notes Wallet',
		category: 'wallets',
		subcategory: 'roper',
		price: 95,
		priceRange: { min: 95, max: 115 },
		images: [walletPhoto],
		description: 'Coming Soon',
		longDescription: 'Functional roper-style wallet with integrated notebook pocket. Perfect for field work or everyday notes.',
		features: [
			'Field notes pocket',
			'Card slots',
			'Pen holder',
			'Durable construction',
			'Western styling',
			'Handmade to order'
		],
		variants: [
			{ type: 'color', options: ['Black', 'Brown', 'Tan'] }
		],
		inStock: false
	},
	{
		id: 'roper-wallet-002',
		slug: 'checkbook-roper-wallet',
		name: 'Checkbook Roper Wallet',
		category: 'wallets',
		subcategory: 'roper',
		price: 105,
		priceRange: { min: 105, max: 130 },
		images: [walletPhoto],
		description: 'Coming Soon',
		longDescription: 'Classic roper wallet with checkbook cover. Traditional western design meets modern functionality.',
		features: [
			'Checkbook cover',
			'Card storage',
			'Cash compartment',
			'Western tooling',
			'Handmade to order'
		],
		variants: [
			{ type: 'color', options: ['Black', 'Brown', 'Tan', 'Natural'] }
		],
		inStock: false
	}
];

export function getProductsBySubcategory(subcategory: string): Product[] {
	return walletProducts.filter(p => p.subcategory === subcategory);
}

export function getProductBySlug(slug: string): Product | undefined {
	return walletProducts.find(p => p.slug === slug);
}

export function getAllWalletProducts(): Product[] {
	return walletProducts;
}
