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
const moneyClipWalletPhoto = '/products/wallets/money-clip-wallet-clean.jpg';

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
