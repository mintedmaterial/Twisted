/**
 * UGC campaign shared helpers.
 * These run inside Cloudflare Workers (DO NOT import Node-only modules here).
 */

export const UGC_PRODUCT_CATEGORIES = [
	{ value: 'welder_armpad', label: 'Welder armpad' },
	{ value: 'wallet', label: 'Wallet' },
	{ value: 'belt', label: 'Belt' },
	{ value: 'other_custom', label: 'Bible cover / holster / other custom' },
] as const;

export type UgcProductCategory = (typeof UGC_PRODUCT_CATEGORIES)[number]['value'];

export interface UgcSubmissionInput {
	email: string;
	firstName: string;
	productCategory: UgcProductCategory;
	instagramHandle?: string;
	tiktokHandle?: string;
	description?: string;
	fileType: string;
	fileSize: number;
	fileName: string;
	rightsReleaseAgreed: boolean;
	creditContingencyAgreed: boolean;
}

export const UGC_STATUSES = ['pending', 'approved', 'declined'] as const;
export type UgcStatus = (typeof UGC_STATUSES)[number];

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function generatePublicId(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let id = '';
	for (let i = 0; i < 12; i++) {
		id += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return `ugc_${id}`;
}

export function generateRewardCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code = 'TWISTED-';
	for (let i = 0; i < 10; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

export function sanitizeR2Key(email: string, timestamp: number, filename: string): string {
	const safeEmail = normalizeEmail(email).replace(/[^a-z0-9_.-]/g, '_');
	const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 120);
	return `content/ugc-submissions/${safeEmail}/${timestamp}/${safeName}`;
}

export function assertProductCategory(value: string): UgcProductCategory {
	const found = UGC_PRODUCT_CATEGORIES.find((c) => c.value === value);
	if (!found) throw new Error(`Invalid product category: ${value}`);
	return found.value;
}

export function fileTypeCategory(mimeType: string): 'image' | 'video' | 'unknown' {
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	return 'unknown';
}

export function rewardAmountFor(type: 'image' | 'video'): number {
	return type === 'video' ? 25 : 10;
}
