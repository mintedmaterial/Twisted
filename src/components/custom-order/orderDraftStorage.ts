import { customizationFieldDefinitions, getCheckoutProduct, getDefaultCustomization, type CustomizationValues, type PaidUpgrade } from './orderAssistantModel';
import { isValidGalleryOrderReference } from '../../data/gallery-order-references';
import { parseOrderReference } from '../../lib/order-security';

export const ORDER_DRAFT_STORAGE_KEY = 'twisted-custom-order-draft-v1';
export const PENDING_ORDER_REFERENCE_KEY = 'twisted-custom-order-pending-reference-v1';

const DRAFT_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export interface StoredOrderDraft {
	expiresAt: string;
	productId: string;
	customization: CustomizationValues;
	upgradeIds: PaidUpgrade['id'][];
	referenceId?: string;
}

export type OrderDraftToPersist = Pick<StoredOrderDraft, 'productId' | 'customization' | 'upgradeIds' | 'referenceId'>;

export function shouldPersistOrderDraft(isHydrated: boolean, isDirty: boolean): boolean {
	return isHydrated && isDirty;
}

export function resolveInitialOrderDraft(
	savedDraft: OrderDraftToPersist | null,
	queryProductId: string | null,
	queryReferenceId: string | null,
): { draft: OrderDraftToPersist; consumedPreselection: boolean } {
	const queryProduct = queryProductId ? getCheckoutProduct(queryProductId) : undefined;
	if (
		queryProduct
		&& queryReferenceId
		&& isValidGalleryOrderReference(queryProduct.id, queryReferenceId)
	) {
		return {
			draft: {
				productId: queryProduct.id,
				customization: getDefaultCustomization(queryProduct.id),
				upgradeIds: [],
				referenceId: queryReferenceId,
			},
			consumedPreselection: true,
		};
	}
	if (queryProductId === 'bible-cover' && queryReferenceId === null) {
		return {
			draft: {
				productId: 'bible-cover',
				customization: getDefaultCustomization('bible-cover'),
				upgradeIds: [],
			},
			consumedPreselection: true,
		};
	}

	return {
		draft: savedDraft ?? {
			productId: 'custom-wallet',
			customization: getDefaultCustomization('custom-wallet'),
			upgradeIds: [],
		},
		consumedPreselection: false,
	};
}

export function stripOrderPreselectionFromUrl(input: string): string {
	const url = new URL(input);
	url.searchParams.delete('product');
	url.searchParams.delete('reference');
	return `${url.pathname}${url.search}${url.hash}`;
}

export function resolveReactiveOrderNavigation(
	currentDraft: OrderDraftToPersist,
	inputUrl: string,
): ({ draft: OrderDraftToPersist; consumedPreselection: true; replacementUrl: string }) | null {
	const url = new URL(inputUrl);
	const resolved = resolveInitialOrderDraft(
		currentDraft,
		url.searchParams.get('product'),
		url.searchParams.get('reference'),
	);
	if (!resolved.consumedPreselection) return null;
	return {
		draft: resolved.draft,
		consumedPreselection: true,
		replacementUrl: stripOrderPreselectionFromUrl(inputUrl),
	};
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
	return Object.keys(value).every((key) => keys.includes(key));
}

export function serializeOrderDraft(draft: OrderDraftToPersist, now = new Date()): string {
	const stored: StoredOrderDraft = {
		expiresAt: new Date(now.getTime() + DRAFT_LIFETIME_MS).toISOString(),
		productId: draft.productId,
		customization: draft.customization,
		upgradeIds: draft.upgradeIds,
	};

	if (draft.referenceId && isValidGalleryOrderReference(draft.productId, draft.referenceId)) stored.referenceId = draft.referenceId;

	return JSON.stringify(stored);
}

export function parseOrderDraft(serialized: string, now = new Date()): OrderDraftToPersist | null {
	let stored: unknown;
	try {
		stored = JSON.parse(serialized);
	} catch {
		return null;
	}

	if (!isRecord(stored) || !hasOnlyKeys(stored, ['expiresAt', 'productId', 'customization', 'upgradeIds', 'referenceId'])) return null;
	if (typeof stored.expiresAt !== 'string' || Number.isNaN(Date.parse(stored.expiresAt)) || Date.parse(stored.expiresAt) <= now.getTime()) return null;
	if (typeof stored.productId !== 'string') return null;
	if (!isRecord(stored.customization) || !Object.values(stored.customization).every((value) => typeof value === 'string')) return null;
	if (!Array.isArray(stored.upgradeIds) || !stored.upgradeIds.every((upgradeId) => typeof upgradeId === 'string')) return null;
	if (stored.referenceId !== undefined && typeof stored.referenceId !== 'string') return null;

	const product = getCheckoutProduct(stored.productId);
	if (!product) return null;
	if (!Object.keys(stored.customization).every((key) => product.fieldKeys.includes(key as keyof CustomizationValues))) return null;
	if (Object.entries(stored.customization).some(([key, value]) => {
		if (typeof value !== 'string' || value.length > 2000) return true;
		const definition = customizationFieldDefinitions[key as keyof CustomizationValues];
		return definition.control === 'select' && Boolean(value) && !definition.options?.includes(value);
	})) return null;
	if (!stored.upgradeIds.every((upgradeId) => product.upgrades.some((upgrade) => upgrade.id === upgradeId))) return null;
	if (new Set(stored.upgradeIds).size !== stored.upgradeIds.length) return null;
	if (stored.upgradeIds.filter((upgradeId) => ['stingray', 'gator', 'ostrich'].includes(upgradeId)).length > 1) return null;
	if (stored.referenceId !== undefined && !isValidGalleryOrderReference(stored.productId, stored.referenceId)) return null;

	const referenceId = typeof stored.referenceId === 'string' && isValidGalleryOrderReference(stored.productId, stored.referenceId)
		? stored.referenceId
		: undefined;

	return {
		productId: stored.productId,
		customization: stored.customization as CustomizationValues,
		upgradeIds: stored.upgradeIds as PaidUpgrade['id'][],
		...(referenceId ? { referenceId } : {}),
	};
}

function getBrowserStorage(): Storage | null {
	try {
		return typeof window === 'undefined' ? null : window.localStorage;
	} catch {
		return null;
	}
}

export function saveOrderDraft(draft: OrderDraftToPersist): void {
	try {
		getBrowserStorage()?.setItem(ORDER_DRAFT_STORAGE_KEY, serializeOrderDraft(draft));
	} catch {
		// A blocked or full browser storage must not interrupt ordering.
	}
}

export function loadOrderDraft(): OrderDraftToPersist | null {
	const storage = getBrowserStorage();
	if (!storage) return null;

	try {
		const serialized = storage.getItem(ORDER_DRAFT_STORAGE_KEY);
		if (!serialized) return null;
		const draft = parseOrderDraft(serialized);
		if (!draft) storage.removeItem(ORDER_DRAFT_STORAGE_KEY);
		return draft;
	} catch {
		return null;
	}
}

export function clearOrderDraft(): void {
	try {
		getBrowserStorage()?.removeItem(ORDER_DRAFT_STORAGE_KEY);
	} catch {
		// A blocked browser storage must not interrupt checkout.
	}
}

export function shouldClearDraftForReturnedReference(
	returnedReference: string | null,
	pendingReference: string | null,
): boolean {
	const returned = parseOrderReference(returnedReference);
	const pending = parseOrderReference(pendingReference);
	return Boolean(returned && pending && returned === pending);
}

export function storePendingOrderReference(reference: string): void {
	const canonical = parseOrderReference(reference);
	if (!canonical) return;
	try {
		if (typeof window !== 'undefined') window.sessionStorage.setItem(PENDING_ORDER_REFERENCE_KEY, canonical);
	} catch {
		// A blocked session store leaves the local draft intact after return.
	}
}
