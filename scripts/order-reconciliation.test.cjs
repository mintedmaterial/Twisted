const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

function bucketWith(entries) {
  const values = new Map(Object.entries(entries));
  const deletes = [];
  return {
    deletes,
    values,
    async list({ prefix, limit, cursor }) { return { objects: [...values.keys()].filter((key) => key.startsWith(prefix)).slice(0, limit).map((key) => ({ key })), truncated: !cursor && prefix === 'order-manifests/' && values.has('cursor-marker'), ...(!cursor && values.has('cursor-marker') ? { cursor: 'next-page' } : {}) }; },
    async get(key) {
      const found = values.get(key);
      if (!found) return null;
      return { etag: found.etag, async json() { return structuredClone(found.value); } };
    },
    async put(key, body, options) {
      const found = values.get(key);
      if (!found || found.etag !== options.onlyIf.etagMatches) return null;
      values.set(key, { etag: `${found.etag}-next`, value: JSON.parse(body) });
      return { key };
    },
    async delete(key) { deletes.push(key); values.delete(key); },
  };
}

test('reconciler CAS-tombstones expired pending manifests then removes only attached assets', async () => {
  const reconciliation = loadTypeScriptModule('src/lib/order-reconciliation.ts');
  const key = 'order-manifests/production/123e4567-e89b-42d3-a456-426614174000.json';
  const bucket = bucketWith({
    [key]: { etag: 'one', value: {
      version: 3, checkoutState: 'pending', payloadFingerprint: 'fingerprint',
      providerContext: { environment: 'production', locationId: 'location', requestOrigin: 'https://example.com' },
      checkoutAttemptId: '123e4567-e89b-42d3-a456-426614174000', leaseExpiresAt: 99,
      referenceImages: [{ key: 'order-assets/123e4567-e89b-42d3-a456-426614174000/123e4567-e89b-42d3-a456-426614174001.jpg' }],
    } },
  });
  const result = await reconciliation.reconcileOrderRecords(bucket, 99 + reconciliation.RECONCILIATION_ABANDONMENT_GRACE_MS);
  assert.equal(result.manifestsTombstoned, 1);
  assert.equal(bucket.values.get(key).value.checkoutState, 'failed');
  assert.deepEqual(bucket.deletes, ['order-assets/123e4567-e89b-42d3-a456-426614174000/123e4567-e89b-42d3-a456-426614174001.jpg']);
});

test('reconciler redacts expired intent upload references and removes temporary uploads', async () => {
  const reconciliation = loadTypeScriptModule('src/lib/order-reconciliation.ts');
  const intentId = '123e4567-e89b-42d3-a456-426614174000';
  const key = `order-intents/${intentId}.json`;
  const upload = `order-uploads/${intentId}/123e4567-e89b-42d3-a456-426614174001.jpg`;
  const bucket = bucketWith({ [key]: { etag: 'one', value: { version: 2, intentId, issuedAt: 1, expiresAt: 99, uploadKeys: [upload], checkoutState: 'available', checkoutAttemptId: null, checkoutFingerprint: null, checkoutOwnerId: null, checkoutLeaseExpiresAt: null } } });
  const result = await reconciliation.reconcileOrderRecords(bucket, 100);
  assert.equal(result.intentsRedacted, 1);
  assert.deepEqual(bucket.values.get(key).value.uploadKeys, []);
  assert.deepEqual(bucket.deletes, [upload]);
});

test('reconciler does not tombstone an in-flight provider request during the abandonment grace', async () => {
  const reconciliation = loadTypeScriptModule('src/lib/order-reconciliation.ts');
  const key = 'order-manifests/production/123e4567-e89b-42d3-a456-426614174000.json';
  const bucket = bucketWith({ [key]: { etag: 'one', value: { version: 3, checkoutState: 'pending', payloadFingerprint: 'fingerprint', providerContext: { environment: 'production' }, checkoutAttemptId: '123e4567-e89b-42d3-a456-426614174000', leaseExpiresAt: 100, referenceImages: [] } } });
  const result = await reconciliation.reconcileOrderRecords(bucket, 100 + reconciliation.RECONCILIATION_ABANDONMENT_GRACE_MS - 1);
  assert.equal(result.manifestsTombstoned, 0);
  assert.equal(bucket.values.get(key).value.checkoutState, 'pending');
});

test('reconciler reports CAS loss, deletion failures, and continuation cursors without PII', async () => {
  const reconciliation = loadTypeScriptModule('src/lib/order-reconciliation.ts');
  const warnings = [];
  const previousWarn = console.warn;
  console.warn = (message) => warnings.push(message);
  try {
    const key = 'order-manifests/production/123e4567-e89b-42d3-a456-426614174000.json';
    const bucket = bucketWith({
      'cursor-marker': { etag: 'marker', value: {} },
      [key]: { etag: 'one', value: { version: 3, checkoutState: 'pending', payloadFingerprint: 'fingerprint', providerContext: { environment: 'production' }, checkoutAttemptId: '123e4567-e89b-42d3-a456-426614174000', leaseExpiresAt: 1, referenceImages: [{ key: 'order-assets/123e4567-e89b-42d3-a456-426614174000/123e4567-e89b-42d3-a456-426614174001.jpg' }] } },
    });
    bucket.delete = async () => { throw new Error('customer@example.com'); };
    const result = await reconciliation.reconcileOrderRecords(bucket, 1 + reconciliation.RECONCILIATION_ABANDONMENT_GRACE_MS);
    assert.equal(result.failures, 1);
    assert.equal(result.manifestCursor, 'next-page');
    assert.equal(warnings.some((line) => line.includes('customer@example.com')), false);
    assert.equal(warnings.some((line) => line.includes('order_reconciliation_cleanup_failed')), true);
  } finally { console.warn = previousWarn; }
});

test('reconciler does nothing when a lease or intent remains live', async () => {
  const reconciliation = loadTypeScriptModule('src/lib/order-reconciliation.ts');
  const bucket = bucketWith({
    'order-manifests/production/123e4567-e89b-42d3-a456-426614174000.json': { etag: 'one', value: { checkoutState: 'pending', leaseExpiresAt: 101 } },
    'order-intents/123e4567-e89b-42d3-a456-426614174000.json': { etag: 'two', value: { expiresAt: 101 } },
  });
  assert.deepEqual(await reconciliation.reconcileOrderRecords(bucket, 100), { manifestsTombstoned: 0, intentsRedacted: 0, assetsDeleted: 0, failures: 0 });
});
