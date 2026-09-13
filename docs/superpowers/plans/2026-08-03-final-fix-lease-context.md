# Final Fix Lease and Provider Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover abandoned custom-order checkout attempts safely while isolating manifest reuse by Square environment, location, and request origin, and finish PNG transparency validation.

**Architecture:** Replace delete-based cleanup with a versioned R2 state machine (`pending`, `completed`, `failed`). Pending records carry a 15-second lease; expired or failed records can be claimed only by an ETag-matching conditional write, and completion/failure are also ETag-CAS transitions. Manifest keys are namespaced by Square environment, while normalized fingerprints and explicit record context bind location and origin.

**Tech Stack:** Next.js route handlers, TypeScript, Cloudflare R2 conditional writes, Web Crypto, Node test runner, PNG/zlib fixtures.

## Global Constraints

- Work only in the existing `custom-order-assistant` linked worktree.
- Add and observe failing tests before every production behavior change.
- Use the unchanged checkout attempt UUID as every Square idempotency key, including takeover calls.
- Do not use unguarded manifest deletion.
- Do not create resources, push, merge, open a pull request, or deploy.

---

### Task 1: Reproduce lease recovery and provider-context failures

**Files:**
- Modify: `scripts/custom-order-checkout-route.test.cjs`

**Interfaces:**
- Consumes: the route `POST`, in-memory conditional R2 double, Square fetch double, and controllable `Date.now()`.
- Produces: behavioral coverage for lease claim/takeover/CAS and provider isolation.

- [ ] **Step 1: Extend the R2 double**

Record every attempted write before conditional evaluation and add a seed method:

```js
putAttempts.push({ key, body: String(body), options });
if (options?.onlyIf?.etagDoesNotMatch === '*' && existing) return null;
if (options?.onlyIf?.etagMatches && existing?.etag !== options.onlyIf.etagMatches) return null;
```

- [ ] **Step 2: Add failing lease tests**

Cover these exact outcomes:

```js
assert.equal(abandonedRecovery.status, 200);
assert.deepEqual(takeover.options.onlyIf, { etagMatches: 'seed-etag' });
assert.equal(activeReplay.status, 409);
assert.equal(fetchCountWhileActive, 1);
assert.equal(lateOriginalPayload.checkoutUrl, takeoverPayload.checkoutUrl);
assert.equal(finalManifest.checkoutState, 'failed');
assert.equal(storage.deletes.length, 0);
assert.deepEqual(squareBodies.map((body) => body.idempotency_key), [ATTEMPT_ID, ATTEMPT_ID]);
```

- [ ] **Step 3: Add failing provider-context tests**

Use one shared R2 bucket. Assert sandbox then production create distinct environment-scoped records and provider calls. Assert a replay after a sandbox location change or request-origin change returns 409 before another Square call and never returns the prior context's URL.

- [ ] **Step 4: Run route tests and verify RED**

Run: `node --test scripts/custom-order-checkout-route.test.cjs`

Expected: failures for version-3 seeded manifests, no takeover path, active wait/reuse behavior, late-owner overwrite, unsafe delete cleanup, sandbox URL reuse, and location/origin reuse.

---

### Task 2: Implement the CAS lease state machine and provider isolation

**Files:**
- Modify: `src/lib/custom-order-checkout.ts`
- Modify: `src/lib/order-assets.ts`
- Modify: `src/app/api/checkout/route.ts`
- Modify: `scripts/order-assets.test.cjs`

**Interfaces:**
- Produces: `CheckoutProviderContext`, manifest version 3, `failed` state, `leaseExpiresAt`, environment-scoped `createManifestKey(attemptId, environment)`, and provider-context-bound `createOrderPayloadFingerprint(order, images, context)`.

- [ ] **Step 1: Version and bind manifests**

```ts
export interface CheckoutProviderContext {
	environment: 'sandbox' | 'production';
	locationId: string;
	requestOrigin: string;
}

export interface CustomOrderManifest {
	version: 3;
	checkoutState: 'pending' | 'completed' | 'failed';
	providerContext: CheckoutProviderContext;
	leaseExpiresAt: number;
	// existing validated order fields
}
```

Include `providerContext` in canonical fingerprint input and use `order-manifests/<environment>/<attempt-id>.json` keys.

- [ ] **Step 2: Claim or take over with CAS**

Initial claim uses `etagDoesNotMatch: '*'`. A matching active pending lease returns 409 immediately. A matching expired pending or failed record changes to a new owner/lease only through:

```ts
bucket.put(key, JSON.stringify(takeoverManifest), {
	...manifestMetadata(takeoverManifest),
	onlyIf: { etagMatches: stored.etag },
});
```

Retry the read/CAS loop if another invocation wins first.

- [ ] **Step 3: Complete and fail with CAS only**

Completion uses the owner's current ETag. Failure transitions to `failed` with the same ETag condition; it never calls `delete`. If a late owner loses CAS, read and return an already completed matching result, or fail without modifying the new owner's record.

- [ ] **Step 4: Run route and manifest-route tests and verify GREEN**

Run: `node --test scripts/custom-order-checkout-route.test.cjs scripts/order-assets.test.cjs`

Expected: all route lease/context tests pass, signed environment-scoped manifest retrieval remains valid, and every provider call uses the same attempt UUID.

---

### Task 3: Reproduce and correct PNG transparency semantics

**Files:**
- Modify: `scripts/order-assets.test.cjs`
- Modify: `src/lib/order-assets.ts`

**Interfaces:**
- Consumes/produces: asynchronous `detectReferenceContentType` PNG validation.

- [ ] **Step 1: Add CRC-correct negative fixtures**

Build three otherwise valid one-pixel PNGs:

```js
makePng({ colorType: 2, beforeData: [pngChunk('tRNS', sixBytes), pngChunk('PLTE', red)] });
makePng({ colorType: 0, bitDepth: 1, beforeData: [pngChunk('tRNS', Buffer.from([0, 2]))], rawImageData: Buffer.from([0, 0]) });
makePng({ colorType: 2, bitDepth: 8, beforeData: [pngChunk('tRNS', Buffer.from([1, 0, 0, 0, 0, 0]))] });
```

- [ ] **Step 2: Run the asset tests and verify RED**

Run: `node --test scripts/order-assets.test.cjs`

Expected: the CRC-correct transparency fixtures are accepted instead of returning null.

- [ ] **Step 3: Enforce ordering and ranges**

Reject `PLTE` encountered after `tRNS`. For grayscale, require the 16-bit transparent sample to fit the IHDR bit depth; for truecolor, require all three 16-bit samples to fit the IHDR bit depth.

- [ ] **Step 4: Run asset tests and verify GREEN**

Run: `node --test scripts/order-assets.test.cjs`

Expected: genuine images still pass and every transparency negative returns null.

---

### Task 4: Verify, self-review, report, and commit

**Files:**
- Modify: `.superpowers/sdd/final-fix-report.md` (leave as an untracked controller artifact)
- Review: every tracked change after `c942124`

- [ ] **Step 1: Run focused verification**

Run the route, checkout, and asset tests together; require zero failures.

- [ ] **Step 2: Run full verification**

Run the complete Node test suite, `tsc --noEmit`, Next production build, OpenNext packaging, and diff checks; require exit 0.

- [ ] **Step 3: Self-review every re-review requirement**

Confirm abandoned recovery, active rejection, late-owner CAS loss, takeover failure CAS, no manifest delete, stable provider idempotency, sandbox/production namespace isolation, location/origin binding, and PNG tRNS ordering/ranges.

- [ ] **Step 4: Commit intended tracked changes**

Commit with: `fix: recover abandoned checkout leases`

- [ ] **Step 5: Append evidence to the final report**

Record red/green counts, final command results, self-review, correction SHA, and unchanged external publication gates.
