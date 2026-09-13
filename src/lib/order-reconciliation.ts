const MANIFEST_PREFIX = 'order-manifests/';
const INTENT_PREFIX = 'order-intents/';
const MAX_RECORDS_PER_PREFIX = 50;
export const RECONCILIATION_ABANDONMENT_GRACE_MS = 10 * 60 * 1000;
const ATTACHED_KEY = /^order-assets\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/u;
const TEMPORARY_KEY = /^order-uploads\/([0-9a-f-]{36})\/[0-9a-f-]{36}\.jpg$/u;

export interface ReconciliationResult {
	manifestsTombstoned: number;
	intentsRedacted: number;
	assetsDeleted: number;
	failures: number;
	manifestCursor?: string;
	intentCursor?: string;
}

export interface ReconciliationCursors { manifestCursor?: string; intentCursor?: string }

function record(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function deleteAssets(bucket: R2Bucket, keys: string[], result: ReconciliationResult, kind: string): Promise<void> {
	for (const key of keys) {
		try {
			await bucket.delete(key);
			result.assetsDeleted += 1;
		} catch {
			result.failures += 1;
			console.warn(JSON.stringify({ event: 'order_reconciliation_cleanup_failed', kind }));
		}
	}
}

async function reconcileManifests(bucket: R2Bucket, now: number, result: ReconciliationResult, cursor?: string): Promise<void> {
	const listing = await bucket.list({ prefix: MANIFEST_PREFIX, limit: MAX_RECORDS_PER_PREFIX, ...(cursor ? { cursor } : {}) });
	if (listing.truncated && listing.cursor) result.manifestCursor = listing.cursor;
	for (const item of listing.objects) {
		try {
			const object = await bucket.get(item.key);
			if (!object?.etag) continue;
			const manifest: unknown = await object.json();
			if (!record(manifest) || manifest.checkoutState !== 'pending' || typeof manifest.leaseExpiresAt !== 'number' || manifest.leaseExpiresAt + RECONCILIATION_ABANDONMENT_GRACE_MS > now) continue;
			if (manifest.version !== 3 || typeof manifest.payloadFingerprint !== 'string' || typeof manifest.checkoutAttemptId !== 'string' || !record(manifest.providerContext)) continue;
			const images = Array.isArray(manifest.referenceImages) ? manifest.referenceImages : [];
			const attachedKeys = images.flatMap((image) => record(image) && typeof image.key === 'string' && ATTACHED_KEY.test(image.key) ? [image.key] : []);
			const tombstone = {
				version: 3,
				checkoutState: 'failed',
				payloadFingerprint: manifest.payloadFingerprint,
				providerContext: manifest.providerContext,
				checkoutAttemptId: manifest.checkoutAttemptId,
			};
			const replaced = await bucket.put(item.key, JSON.stringify(tombstone), {
				httpMetadata: { contentType: 'application/json' },
				customMetadata: {
					recordType: 'custom-order-manifest',
					checkoutState: 'failed',
					payloadFingerprint: manifest.payloadFingerprint,
					providerEnvironment: String(manifest.providerContext.environment ?? ''),
					providerLocationId: String(manifest.providerContext.locationId ?? ''),
					requestOrigin: String(manifest.providerContext.requestOrigin ?? ''),
				},
				onlyIf: { etagMatches: object.etag },
			});
			if (!replaced) {
				result.failures += 1;
				console.warn(JSON.stringify({ event: 'order_reconciliation_cas_lost', recordType: 'manifest' }));
				continue;
			}
			result.manifestsTombstoned += 1;
			await deleteAssets(bucket, attachedKeys, result, 'attached');
		} catch {
			result.failures += 1;
			console.warn(JSON.stringify({ event: 'order_reconciliation_record_failed', recordType: 'manifest' }));
		}
	}
}

async function reconcileIntents(bucket: R2Bucket, now: number, result: ReconciliationResult, cursor?: string): Promise<void> {
	const listing = await bucket.list({ prefix: INTENT_PREFIX, limit: MAX_RECORDS_PER_PREFIX, ...(cursor ? { cursor } : {}) });
	if (listing.truncated && listing.cursor) result.intentCursor = listing.cursor;
	for (const item of listing.objects) {
		try {
			const object = await bucket.get(item.key);
			if (!object?.etag) continue;
			const intent: unknown = await object.json();
			if (!record(intent) || typeof intent.expiresAt !== 'number' || intent.expiresAt > now || !Array.isArray(intent.uploadKeys)) continue;
			if (intent.version !== 2 || typeof intent.intentId !== 'string') continue;
			const uploadKeys = intent.uploadKeys.flatMap((key) => typeof key === 'string' && TEMPORARY_KEY.test(key) && key.startsWith(`order-uploads/${intent.intentId}/`) ? [key] : []);
			const redacted = { ...intent, uploadKeys: [] };
			const replaced = await bucket.put(item.key, JSON.stringify(redacted), {
				httpMetadata: { contentType: 'application/json' },
				customMetadata: { recordType: 'order-intent', expiresAt: String(intent.expiresAt) },
				onlyIf: { etagMatches: object.etag },
			});
			if (!replaced) {
				result.failures += 1;
				console.warn(JSON.stringify({ event: 'order_reconciliation_cas_lost', recordType: 'intent' }));
				continue;
			}
			result.intentsRedacted += 1;
			await deleteAssets(bucket, uploadKeys, result, 'temporary');
		} catch {
			result.failures += 1;
			console.warn(JSON.stringify({ event: 'order_reconciliation_record_failed', recordType: 'intent' }));
		}
	}
}

export async function reconcileOrderRecords(bucket: R2Bucket, now = Date.now(), cursors: ReconciliationCursors = {}): Promise<ReconciliationResult> {
	const result: ReconciliationResult = { manifestsTombstoned: 0, intentsRedacted: 0, assetsDeleted: 0, failures: 0 };
	await reconcileManifests(bucket, now, result, cursors.manifestCursor);
	await reconcileIntents(bucket, now, result, cursors.intentCursor);
	return result;
}
