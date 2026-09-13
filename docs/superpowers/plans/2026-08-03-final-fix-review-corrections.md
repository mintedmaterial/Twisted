# Final Fix Review Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct every Important and Minor finding in the independent review of commit `17b5253` while preserving one stable Square idempotency key per normalized checkout attempt.

**Architecture:** Store a fingerprinted, owner-tagged pending/completed checkout record at the deterministic R2 manifest key. Claim it with an atomic create-if-absent write, use an ETag-guarded completion write, make identical requests reuse or wait for that record, and reject a conflicting fingerprint before Square. Upgrade PNG validation to asynchronously inflate IDAT bytes and validate exact scanline structure while keeping JPEG and PNG as the only accepted formats.

**Tech Stack:** Next.js 15 route handlers, TypeScript, Cloudflare R2 conditional writes, Web Crypto, Web `DecompressionStream`, Node test runner.

## Global Constraints

- Work only in the existing `custom-order-assistant` worktree and preserve all user/controller artifacts.
- Follow red-green-refactor for every behavior change.
- Do not create external resources, push, merge, open a pull request, or deploy.
- Re-run focused tests, the complete suite, TypeScript, Next production build, and OpenNext build before completion.

---

### Task 1: Reproduce manifest idempotency and exact Square contract failures

**Files:**
- Modify: `scripts/custom-order-checkout-route.test.cjs`
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/lib/custom-order-checkout.ts`

**Interfaces:**
- Consumes: the validated `ValidatedCustomOrder`, verified image records, and deterministic `createManifestKey(attemptId)`.
- Produces: `createOrderPayloadFingerprint(order, images): Promise<string>` plus manifest records with `checkoutState`, `payloadFingerprint`, `ownerId`, and an optional completed `checkoutUrl`.

- [ ] **Step 1: Write failing route tests**

Add an in-memory R2 double that implements conditional `put`, `get`, `head`, and `delete`, then assert:

```js
assert.deepEqual(firstSquareBody, secondSquareBody);
assert.equal(fetchCount, 1);                    // identical sequential and concurrent requests
assert.equal(conflict.status, 409);             // same attempt, different normalized payload
assert.equal(storage.objects.has(manifestKey), true); // replay failure cannot remove completed data
assert.deepEqual(options.onlyIf, { etagDoesNotMatch: '*' });
```

Deep-assert the exact Square method, three headers, and complete body including description, quick-pay name, USD currency, amount in cents, location, redirect, shipping flag, payment note, and absence of extra fields.

- [ ] **Step 2: Run the route test and verify RED**

Run: `node --test scripts/custom-order-checkout-route.test.cjs`

Expected: failures showing duplicate provider calls, overwritten/deleted manifests, no conflict response, no conditional writes/state, and incomplete exact assertions.

- [ ] **Step 3: Add stable payload fingerprinting**

Canonicalize the validated semantic order payload with recursively sorted object keys, sorted set-like upgrades/reference-image keys, and no volatile `createdAt` or server delivery-window value, then SHA-256 the canonical JSON:

```ts
export async function createOrderPayloadFingerprint(
	order: ValidatedCustomOrder,
	referenceImages: VerifiedReferenceImage[],
): Promise<string>;
```

- [ ] **Step 4: Implement the R2 state protocol**

Create a pending manifest with a random owner ID and:

```ts
bucket.put(key, JSON.stringify(pending), {
	onlyIf: { etagDoesNotMatch: '*' },
	httpMetadata: { contentType: 'application/json' },
	customMetadata: { recordType: 'custom-order-manifest', checkoutState: 'pending', payloadFingerprint, ownerId },
});
```

If creation loses, read the existing record: return a matching completed URL, wait for a matching pending record to complete, reject a different fingerprint with 409, and retry the claim only if the failed owner removed its pending object. Only the owner that received the successful create result may call Square. Complete with `onlyIf: { etagMatches: pendingEtag }`. On failure, delete only if a fresh read still has the same pending ETag, fingerprint, and owner.

- [ ] **Step 5: Run the route test and verify GREEN**

Run: `node --test scripts/custom-order-checkout-route.test.cjs`

Expected: all route tests pass with one provider call for identical/concurrent requests and no completed-record deletion.

---

### Task 2: Reproduce and correct PNG decoding gaps

**Files:**
- Modify: `scripts/order-assets.test.cjs`
- Modify: `src/lib/order-assets.ts`
- Modify: `src/app/api/order-assets/route.ts`

**Interfaces:**
- Consumes: an upload body as `ArrayBuffer | Uint8Array`.
- Produces: `detectReferenceContentType(input): Promise<'image/jpeg' | 'image/png' | null>`.

- [ ] **Step 1: Replace synthetic valid fixtures and add malformed CRC-correct PNGs**

Read the genuine repository assets `public/agent-avatar.jpg` and `public/belt-icon.png`. Build CRC-correct PNG fixtures with Node zlib that contain invalid filter method, missing/forbidden/duplicate/oversized palettes, a reserved chunk-type bit, invalid decompressed row filters, truncated rows, and extra decompressed data.

- [ ] **Step 2: Run the asset test and verify RED**

Run: `node --test scripts/order-assets.test.cjs`

Expected: current synchronous detection or container-only PNG validation accepts at least one CRC-correct malformed fixture.

- [ ] **Step 3: Implement complete PNG structural and scanline validation**

Enforce IHDR width/height, valid bit-depth/color-type pairs, compression/filter method 0, interlace 0/1, reserved chunk-type bits, critical chunk order/multiplicity, PLTE constraints, and relevant `tRNS` constraints. Concatenate IDAT, inflate with `DecompressionStream('deflate')`, cap expected decoded bytes, require exact non-interlaced or Adam7 scanline lengths, require row filters 0-4, and validate decoded indexed samples against palette size.

- [ ] **Step 4: Await image detection in the upload route**

```ts
const detectedTypes = await Promise.all(
	bodies.map((body) => detectReferenceContentType(body)),
);
```

- [ ] **Step 5: Run the asset test and verify GREEN**

Run: `node --test scripts/order-assets.test.cjs`

Expected: genuine JPEG/PNG fixtures pass and every malformed CRC-correct PNG fails before R2 writes.

---

### Task 3: Reproduce and correct full Bidi_Control sanitization

**Files:**
- Modify: `scripts/custom-order-checkout.test.cjs`
- Modify: `src/lib/custom-order-checkout.ts`

**Interfaces:**
- Consumes/produces: `sanitizePaymentNoteValue(value: string): string`.

- [ ] **Step 1: Add an individual-character test**

Test every Unicode Bidi_Control code point individually:

```js
const bidiControls = [0x061c, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069];
for (const codePoint of bidiControls) {
	assert.equal(checkout.sanitizePaymentNoteValue(`before${String.fromCodePoint(codePoint)}after`), 'before after');
}
```

Also assert that normal Arabic, Hebrew, accented text, Greek, and emoji remain.

- [ ] **Step 2: Run the checkout unit test and verify RED**

Run: `node --test scripts/custom-order-checkout.test.cjs`

Expected: U+061C, U+200E, and U+200F remain and fail the new assertions.

- [ ] **Step 3: Use the complete Unicode property**

Replace the incomplete hand-written bidi range with `\p{Bidi_Control}` in the dangerous-control expression while retaining the existing C0/C1, DEL, line-separator, and paragraph-separator coverage.

- [ ] **Step 4: Run the checkout unit test and verify GREEN**

Run: `node --test scripts/custom-order-checkout.test.cjs`

Expected: every Bidi_Control is removed and ordinary Unicode remains.

---

### Task 4: Full verification, self-review, report, and commit

**Files:**
- Modify: `.superpowers/sdd/final-fix-report.md` (controller report, leave untracked)
- Review: all files changed since `17b5253`

- [ ] **Step 1: Run focused tests**

Run: `node --test scripts/custom-order-checkout-route.test.cjs scripts/order-assets.test.cjs scripts/custom-order-checkout.test.cjs`

Expected: all focused tests pass with zero failures.

- [ ] **Step 2: Run complete verification**

Run the full Node suite, `tsc --noEmit`, `next build`, the OpenNext build, and `git diff --check`; require exit 0 for every command.

- [ ] **Step 3: Self-review against every finding**

Confirm atomic create/CAS state ownership, stable normalized fingerprinting, identical/conflicting/concurrent/failed-replay behavior, exact Square request shape, genuine fixtures, decompressed PNG rejection, and all twelve Bidi_Control code points.

- [ ] **Step 4: Commit only intended tracked changes**

Commit with: `fix: make custom order retries race safe`

- [ ] **Step 5: Append verification evidence to the controller report**

Record the red/green commands, final command outputs, commit SHA, self-review result, Windows OpenNext concern if still present, and the unchanged external publication gates.
