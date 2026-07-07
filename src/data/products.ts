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
