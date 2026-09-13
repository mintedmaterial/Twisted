const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScriptModule } = require('./test-helpers.cjs');
const state = loadTypeScriptModule('src/lib/order-intent-state.ts');

const INTENT_ID = '123e4567-e89b-42d3-a456-426614174111';
const ATTEMPT_A = '123e4567-e89b-42d3-a456-426614174000';
const ATTEMPT_B = '123e4567-e89b-42d3-a456-426614174001';
const OWNER_A = '33333333-3333-4333-8333-333333333333';
const OWNER_B = '44444444-4444-4444-8444-444444444444';
const claims = { intentId: INTENT_ID, issuedAt: 1_000, expiresAt: 301_000 };

function bucket() {
  let etag = 0;
  let stored = { etag: 'e0', value: { version: 2, ...claims, uploadKeys: [], checkoutState: 'available', checkoutAttemptId: null, checkoutFingerprint: null, checkoutOwnerId: null, checkoutLeaseExpiresAt: null } };
  return {
    read: () => structuredClone(stored.value),
    async get() { return { etag: stored.etag, async json() { return structuredClone(stored.value); } }; },
    async put(_key, body, options) {
      if (options.onlyIf.etagMatches !== stored.etag) return null;
      stored = { etag: `e${++etag}`, value: JSON.parse(body) };
      return { etag: stored.etag };
    },
  };
}

test('one intent binds to one exact attempt and rejects sequential or concurrent distinct attempts', async () => {
  const storage = bucket();
  assert.equal(await state.claimOrderIntentCheckout(storage, claims, { checkoutAttemptId: ATTEMPT_A, fingerprint: 'a'.repeat(64), ownerId: OWNER_A, leaseExpiresAt: 20_000 }, 2_000), 'claimed');
  await assert.rejects(() => state.claimOrderIntentCheckout(storage, claims, { checkoutAttemptId: ATTEMPT_B, fingerprint: 'b'.repeat(64), ownerId: OWNER_B, leaseExpiresAt: 21_000 }, 2_001), (error) => error.status === 409);
  assert.equal(storage.read().checkoutAttemptId, ATTEMPT_A);
  assert.equal(storage.read().checkoutOwnerId, OWNER_A);
});

test('release and completion require the bound attempt and owner', async () => {
  const storage = bucket();
  const binding = { checkoutAttemptId: ATTEMPT_A, fingerprint: 'a'.repeat(64), ownerId: OWNER_A, leaseExpiresAt: 20_000 };
  await state.claimOrderIntentCheckout(storage, claims, binding, 2_000);
  assert.equal(await state.releaseOrderIntentCheckout(storage, claims, { checkoutAttemptId: ATTEMPT_A, ownerId: OWNER_B }), false);
  assert.equal(await state.completeOrderIntentCheckout(storage, claims, { checkoutAttemptId: ATTEMPT_A, ownerId: OWNER_B }), false);
  assert.equal(storage.read().checkoutState, 'pending');
  assert.equal(await state.completeOrderIntentCheckout(storage, claims, { checkoutAttemptId: ATTEMPT_A, ownerId: OWNER_A }), true);
  assert.equal(storage.read().checkoutState, 'completed');
});

test('a claimed owner can complete after token expiry and completed state rejects another attempt', async () => {
  const storage = bucket();
  const binding = { checkoutAttemptId: ATTEMPT_A, fingerprint: 'a'.repeat(64), ownerId: OWNER_A, leaseExpiresAt: 400_000 };
  await state.claimOrderIntentCheckout(storage, claims, binding, 2_000);
  assert.equal(await state.completeOrderIntentCheckout(storage, claims, { checkoutAttemptId: ATTEMPT_A, ownerId: OWNER_A }, 400_000), true);
  assert.equal(await state.claimOrderIntentCheckout(storage, claims, { ...binding, ownerId: OWNER_B }, 400_000), 'completed');
  await assert.rejects(() => state.claimOrderIntentCheckout(storage, claims, { checkoutAttemptId: ATTEMPT_B, fingerprint: 'b'.repeat(64), ownerId: OWNER_B, leaseExpiresAt: 500_000 }, 400_000), (error) => error.status === 409);
});
