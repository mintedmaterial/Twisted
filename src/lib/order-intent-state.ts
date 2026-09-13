import { type OrderIntentClaims } from './order-security';

export const ORDER_INTENT_PREFIX = 'order-intents/';
export const ORDER_UPLOAD_PREFIX = 'order-uploads/';
export const MAX_INTENT_UPLOADS = 3;
const MAX_CAS_ATTEMPTS = 5;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/u;

export interface OrderIntentState extends OrderIntentClaims {
	version: 2;
	uploadKeys: string[];
	checkoutState: 'available' | 'pending' | 'completed';
	checkoutAttemptId: string | null;
	checkoutFingerprint: string | null;
	checkoutOwnerId: string | null;
	checkoutLeaseExpiresAt: number | null;
}

export interface CheckoutIntentBinding {
	checkoutAttemptId: string;
	fingerprint: string;
	ownerId: string;
	leaseExpiresAt: number;
}

export interface CheckoutIntentOwner {
	checkoutAttemptId: string;
	ownerId: string;
}

export class OrderIntentStateError extends Error {
	constructor(message: string, readonly status: 400 | 409 | 503 = 400) {
		super(message);
		this.name = 'OrderIntentStateError';
	}
}

interface StoredIntentState { etag: string; state: OrderIntentState }

export function createOrderIntentState(now = Date.now()): OrderIntentState {
	return {
		version: 2,
		intentId: crypto.randomUUID(),
		issuedAt: now,
		expiresAt: now + 5 * 60 * 1000,
		uploadKeys: [],
		checkoutState: 'available',
		checkoutAttemptId: null,
		checkoutFingerprint: null,
		checkoutOwnerId: null,
		checkoutLeaseExpiresAt: null,
	};
}

export function createOrderIntentKey(intentId: string): string { return `${ORDER_INTENT_PREFIX}${intentId}.json`; }

export function isOwnedTemporaryKey(key: string, intentId: string): boolean {
	return key.startsWith(`${ORDER_UPLOAD_PREFIX}${intentId}/`)
		&& /^order-uploads\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/u.test(key);
}

function isOrderIntentState(value: unknown): value is OrderIntentState {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	const state = value as Record<string, unknown>;
	const exactKeys = 'checkoutAttemptId,checkoutFingerprint,checkoutLeaseExpiresAt,checkoutOwnerId,checkoutState,expiresAt,intentId,issuedAt,uploadKeys,version';
	if (Object.keys(state).sort().join(',') !== exactKeys || state.version !== 2 || !UUID_PATTERN.test(String(state.intentId))) return false;
	if (!Number.isSafeInteger(state.issuedAt) || !Number.isSafeInteger(state.expiresAt) || !Array.isArray(state.uploadKeys)) return false;
	if (!state.uploadKeys.every((key) => typeof key === 'string' && isOwnedTemporaryKey(key, state.intentId as string))) return false;
	if (new Set(state.uploadKeys).size !== state.uploadKeys.length || state.uploadKeys.length > MAX_INTENT_UPLOADS) return false;
	if (state.checkoutState === 'available') {
		return state.checkoutAttemptId === null && state.checkoutFingerprint === null && state.checkoutOwnerId === null && state.checkoutLeaseExpiresAt === null;
	}
	if (!UUID_PATTERN.test(String(state.checkoutAttemptId)) || !FINGERPRINT_PATTERN.test(String(state.checkoutFingerprint))) return false;
	if (state.checkoutState === 'completed') return state.checkoutOwnerId === null && state.checkoutLeaseExpiresAt === null;
	return state.checkoutState === 'pending'
		&& UUID_PATTERN.test(String(state.checkoutOwnerId))
		&& Number.isSafeInteger(state.checkoutLeaseExpiresAt);
}

async function readStored(bucket: R2Bucket, claims: OrderIntentClaims): Promise<StoredIntentState> {
	const object = await bucket.get(createOrderIntentKey(claims.intentId));
	if (!object?.etag) throw new OrderIntentStateError('This order session is unavailable. Start again.');
	let state: unknown;
	try { state = await object.json<unknown>(); } catch { throw new OrderIntentStateError('This order session is unavailable. Start again.'); }
	if (!isOrderIntentState(state) || state.intentId !== claims.intentId || state.issuedAt !== claims.issuedAt || state.expiresAt !== claims.expiresAt) {
		throw new OrderIntentStateError('This order session is unavailable. Start again.');
	}
	return { etag: object.etag, state };
}

export async function readOrderIntentState(bucket: R2Bucket, claims: OrderIntentClaims, now = Date.now()): Promise<StoredIntentState> {
	const stored = await readStored(bucket, claims);
	if (now >= stored.state.expiresAt) throw new OrderIntentStateError('This order session expired. Complete verification again.');
	return stored;
}

async function replace(bucket: R2Bucket, stored: StoredIntentState, state: OrderIntentState): Promise<boolean> {
	const result = await bucket.put(createOrderIntentKey(state.intentId), JSON.stringify(state), {
		httpMetadata: { contentType: 'application/json' },
		customMetadata: { recordType: 'order-intent', expiresAt: String(state.expiresAt) },
		onlyIf: { etagMatches: stored.etag },
	});
	return Boolean(result);
}

export async function reserveOrderIntentUploads(bucket: R2Bucket, claims: OrderIntentClaims, keys: string[], now = Date.now()): Promise<void> {
	if (keys.length < 1 || keys.some((key) => !isOwnedTemporaryKey(key, claims.intentId)) || new Set(keys).size !== keys.length) throw new OrderIntentStateError('Invalid reference-image reservation.');
	for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
		const stored = await readOrderIntentState(bucket, claims, now);
		if (stored.state.checkoutState !== 'available') throw new OrderIntentStateError('This order session is already checking out.', 409);
		if (stored.state.uploadKeys.length + keys.length > MAX_INTENT_UPLOADS) throw new OrderIntentStateError(`Attach up to ${MAX_INTENT_UPLOADS} reference images.`);
		if (stored.state.uploadKeys.some((key) => keys.includes(key))) throw new OrderIntentStateError('A reference-image reservation was repeated.', 409);
		if (await replace(bucket, stored, { ...stored.state, uploadKeys: [...stored.state.uploadKeys, ...keys] })) return;
	}
	throw new OrderIntentStateError('This order session changed. Try again.', 409);
}

export async function releaseOrderIntentUploads(bucket: R2Bucket, claims: OrderIntentClaims, keys: readonly string[], now = Date.now()): Promise<boolean> {
	for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
		const stored = await readOrderIntentState(bucket, claims, now);
		const uploadKeys = stored.state.uploadKeys.filter((key) => !keys.includes(key));
		if (uploadKeys.length === stored.state.uploadKeys.length) return true;
		if (await replace(bucket, stored, { ...stored.state, uploadKeys })) return true;
	}
	console.warn(JSON.stringify({ event: 'order_intent_upload_release_cas_exhausted', intentId: claims.intentId }));
	return false;
}

function matchesOrder(state: OrderIntentState, binding: Pick<CheckoutIntentBinding, 'checkoutAttemptId' | 'fingerprint'>): boolean {
	return state.checkoutAttemptId === binding.checkoutAttemptId && state.checkoutFingerprint === binding.fingerprint;
}

export async function claimOrderIntentCheckout(bucket: R2Bucket, claims: OrderIntentClaims, binding: CheckoutIntentBinding, now = Date.now()): Promise<'claimed' | 'pending' | 'completed'> {
	for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
		const stored = await readStored(bucket, claims);
		if (stored.state.checkoutState === 'available') {
			if (now >= stored.state.expiresAt) throw new OrderIntentStateError('This order session expired. Complete verification again.');
			if (await replace(bucket, stored, { ...stored.state, checkoutState: 'pending', checkoutAttemptId: binding.checkoutAttemptId, checkoutFingerprint: binding.fingerprint, checkoutOwnerId: binding.ownerId, checkoutLeaseExpiresAt: binding.leaseExpiresAt })) return 'claimed';
			continue;
		}
		if (!matchesOrder(stored.state, binding)) throw new OrderIntentStateError('This order session is already bound to a different order or checkout attempt.', 409);
		if (stored.state.checkoutState === 'completed') return 'completed';
		if ((stored.state.checkoutLeaseExpiresAt ?? 0) > now) return stored.state.checkoutOwnerId === binding.ownerId ? 'claimed' : 'pending';
		if (await replace(bucket, stored, { ...stored.state, checkoutOwnerId: binding.ownerId, checkoutLeaseExpiresAt: binding.leaseExpiresAt })) return 'claimed';
	}
	throw new OrderIntentStateError('This order session changed. Try again.', 409);
}

export async function renewOrderIntentCheckout(bucket: R2Bucket, claims: OrderIntentClaims, owner: CheckoutIntentOwner & { leaseExpiresAt: number }): Promise<boolean> {
	for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
		const stored = await readStored(bucket, claims);
		if (stored.state.checkoutState !== 'pending' || stored.state.checkoutAttemptId !== owner.checkoutAttemptId || stored.state.checkoutOwnerId !== owner.ownerId) return false;
		if (await replace(bucket, stored, { ...stored.state, checkoutLeaseExpiresAt: owner.leaseExpiresAt })) return true;
	}
	console.warn(JSON.stringify({ event: 'order_intent_renew_cas_exhausted', intentId: claims.intentId }));
	return false;
}

export async function releaseOrderIntentCheckout(bucket: R2Bucket, claims: OrderIntentClaims, owner: CheckoutIntentOwner): Promise<boolean> {
	for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
		const stored = await readStored(bucket, claims);
		if (stored.state.checkoutState !== 'pending' || stored.state.checkoutAttemptId !== owner.checkoutAttemptId || stored.state.checkoutOwnerId !== owner.ownerId) return false;
		if (await replace(bucket, stored, { ...stored.state, checkoutState: 'available', checkoutAttemptId: null, checkoutFingerprint: null, checkoutOwnerId: null, checkoutLeaseExpiresAt: null })) return true;
	}
	console.warn(JSON.stringify({ event: 'order_intent_release_cas_exhausted', intentId: claims.intentId }));
	return false;
}

export async function completeOrderIntentCheckout(bucket: R2Bucket, claims: OrderIntentClaims, owner: CheckoutIntentOwner, _now = Date.now()): Promise<boolean> {
	void _now;
	for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
		const stored = await readStored(bucket, claims);
		if (stored.state.checkoutState === 'completed') return stored.state.checkoutAttemptId === owner.checkoutAttemptId;
		if (stored.state.checkoutState !== 'pending' || stored.state.checkoutAttemptId !== owner.checkoutAttemptId || stored.state.checkoutOwnerId !== owner.ownerId) return false;
		if (await replace(bucket, stored, { ...stored.state, checkoutState: 'completed', checkoutOwnerId: null, checkoutLeaseExpiresAt: null })) return true;
	}
	console.warn(JSON.stringify({ event: 'order_intent_completion_cas_exhausted', intentId: claims.intentId }));
	return false;
}
