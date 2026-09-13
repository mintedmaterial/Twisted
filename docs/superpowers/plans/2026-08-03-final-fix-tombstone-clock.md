# Minimal Failure Tombstones and Fresh Checkout Leases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure every owned checkout failure removes customer order content through ETag CAS and every lease decision/write uses current time, including a CAS renewal immediately before Square.

**Architecture:** Model the stored checkout manifest as a discriminated union: pending/completed records contain the full validated order, while a failed tombstone contains only version, state, attempt ID, payload fingerprint, and provider context. The route reconstructs every new or takeover pending record from the freshly validated request and verified images. Lease creation, comparison, takeover, and pre-Square renewal each read a fresh clock and use conditional R2 writes.

**Tech Stack:** Next.js route handlers, TypeScript discriminated unions, Cloudflare R2 ETag conditions, Web Crypto fingerprints, Node test runner.

## Global Constraints

- Work only in the existing `custom-order-assistant` linked worktree on `codex/custom-order-assistant-design`.
- Add and observe failing tests before production changes.
- A failed tombstone may contain only `version`, `checkoutState`, `payloadFingerprint`, `providerContext`, and `checkoutAttemptId`.
- Provider environment, location, origin, and normalized payload fingerprint must still be checked before retry/takeover.
- Every initial claim and takeover write must derive its lease from a clock read immediately before that write.
- Every pending-lease comparison must read the clock at the comparison.
- Renew the owned pending record through ETag CAS immediately before Square; only the renewed ETag may complete or fail the record.
- Do not delete manifests or modify a record after losing its ETag.
- Do not create external resources, push, merge, open a pull request, or deploy.

---

### Task 1: Reproduce retained failure content

**Files:**
- Modify: `scripts/custom-order-checkout-route.test.cjs`

**Interfaces:**
- Consumes: the route `POST`, in-memory R2 conditional-write double, and Square fetch double.
- Produces: exact tombstone assertions for provider, transport, response parsing, URL, and completion-CAS failures plus retry reconstruction coverage.

- [ ] **Step 1: Extend the R2 double with conditional-write interception**

Add an optional callback that observes each attempted write and can return `false` to force that one conditional operation to miss without mutating the stored object. Preserve `putAttempts` as the audit trail.

- [ ] **Step 2: Add exact tombstone assertions for every failure class**

Exercise these provider outcomes separately: non-2xx response, thrown transport error, rejected/malformed JSON parsing, missing payment URL, and a forced completion-CAS miss. For every case assert the final object equals:

```js
{
  version: 3,
  checkoutState: 'failed',
  payloadFingerprint: expectedFingerprint,
  providerContext: providerContext(),
  checkoutAttemptId: ATTEMPT_ID,
}
```

This exact comparison proves the tombstone has no contact, customization, notes, product, upgrades, gallery reference, delivery window, total, owner, lease, checkout URL, or reference-image data.

- [ ] **Step 3: Add failed-tombstone retry reconstruction coverage**

Fail the first provider request, then retry the identical validated request. Assert the retry CAS-replaces the tombstone with a pending record containing the freshly validated contact/customization/notes/reference image data, then completes successfully. Assert a changed payload still receives 409 before Square.

- [ ] **Step 4: Run route tests and verify RED**

Run: `node --test scripts/custom-order-checkout-route.test.cjs`

Expected: the exact tombstone checks show retained customer/order fields, retry reconstruction cannot use a minimal tombstone, and existing write-count assertions also expose the missing pre-Square renewal.

---

### Task 2: Reproduce stale lease timing

**Files:**
- Modify: `scripts/custom-order-checkout-route.test.cjs`

**Interfaces:**
- Consumes: controllable `Date.now`, R2 head/put hooks, and route `POST`.
- Produces: direct coverage for slow pre-claim verification, failed takeover CAS attempts, and immediate pre-provider lease renewal.

- [ ] **Step 1: Add a verification-delay clock test**

Advance the controlled clock by 60 seconds inside photo `head` verification. Assert the first successful claim lease is 15 seconds after the advanced time rather than the request-start time.

- [ ] **Step 2: Add a failed-CAS clock test**

Seed an expired matching record. Force the first ETag takeover attempt to return null while advancing the clock by 60 seconds. Assert the successful later takeover compares against the advanced clock and writes a lease 15 seconds after a fresh clock read.

- [ ] **Step 3: Assert pre-Square renewal**

For a normal checkout, assert the sequence is conditional create, ETag-CAS pending renewal, Square fetch, and ETag-CAS completion. In the fetch double, assert the stored pending lease is still active at provider-call time and the completion uses the renewal ETag.

- [ ] **Step 4: Run route tests and verify RED**

Run: `node --test scripts/custom-order-checkout-route.test.cjs`

Expected: current code writes leases from the stale request timestamp, does not renew before Square, and has no retry-safe clock behavior after a forced CAS miss.

---

### Task 3: Implement the manifest union and minimal tombstone

**Files:**
- Modify: `src/lib/custom-order-checkout.ts`
- Modify: `src/app/api/checkout/route.ts`

**Interfaces:**
- Produces: `PendingCustomOrderManifest`, `CompletedCustomOrderManifest`, `FailedCustomOrderManifest`, `CustomOrderManifest`, `renewOrderManifest`, and a minimal `failOrderManifest`.

- [ ] **Step 1: Split manifest state types**

Define a shared identity with version, state-independent fingerprint/provider/attempt data. Pending and completed variants retain the full validated order plus owner and lease. The failed variant contains no fields beyond the five global-constraint keys.

- [ ] **Step 2: Make failure construction minimal**

Implement `failOrderManifest(pending)` by selecting only the five tombstone fields rather than spreading the pending record. Update the route validator and R2 metadata builder to accept minimal failed records and full pending/completed records.

- [ ] **Step 3: Reconstruct pending takeover records**

Remove takeover-by-spread. Whether the stored record is expired pending or failed, build a new pending record from the current validated order and verified images after fingerprint/provider checks.

- [ ] **Step 4: Run route tests and verify tombstone GREEN**

Run: `node --test scripts/custom-order-checkout-route.test.cjs`

Expected: exact tombstone and retry reconstruction assertions pass; timing tests may remain red until Task 4.

---

### Task 4: Implement fresh-clock claims and renewal

**Files:**
- Modify: `src/lib/custom-order-checkout.ts`
- Modify: `src/app/api/checkout/route.ts`
- Modify: `scripts/custom-order-checkout-route.test.cjs`

**Interfaces:**
- Consumes: `makeOrderManifest` and `renewOrderManifest`.
- Produces: fresh conditional claim/takeover writes and an owned renewed ETag for the Square request.

- [ ] **Step 1: Refresh every claim and takeover**

Inside each claim-loop iteration, call `Date.now()` immediately before initial conditional create and build that pending record with `leaseExpiresAt = claimNow + 15_000`. After reading an existing pending record, call `Date.now()` for the active-lease comparison. Immediately before an expired/failed takeover write, call it again and reconstruct the pending record with that value.

- [ ] **Step 2: Renew before Square**

Construct the Square request body first. Then read `Date.now()`, extend the pending lease, and ETag-CAS the renewed pending record. Update ownership with the returned ETag and invoke `fetch` immediately. If renewal loses CAS, do not call Square or alter the winner.

- [ ] **Step 3: Use the renewed ETag for all terminal writes**

Completion and the catch-path tombstone transition both use the renewal ETag. A stale owner may read and reuse an already completed matching record but cannot overwrite another owner.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test scripts/custom-order-checkout-route.test.cjs scripts/custom-order-checkout.test.cjs scripts/order-assets.test.cjs`

Expected: every tombstone, retry, timing, renewal, stale-owner, provider-isolation, and asset test passes.

---

### Task 5: Verify, self-review, report, and commit

**Files:**
- Modify: `.superpowers/sdd/final-fix-report.md` (leave untracked as a controller artifact)
- Review: every tracked change after `d1b5827`

**Interfaces:**
- Produces: a verified local correction commit and evidence report.

- [ ] **Step 1: Run full verification**

Run the complete Node test suite, `tsc --noEmit`, Next production build, OpenNext packaging, `git diff --check`, and staged diff checks. Require exit 0 except the documented non-fatal Windows OpenNext traced-symlink warning.

- [ ] **Step 2: Self-review every requirement**

Confirm exact minimal tombstones for all five failure classes, fresh pending reconstruction, fingerprint/provider conflict safety, fresh time at each comparison/write, pre-Square renewal, stale-owner fencing, stable Square idempotency, and zero manifest deletes.

- [ ] **Step 3: Commit intended tracked changes**

Commit with: `fix: minimize failed checkout records`

- [ ] **Step 4: Append final evidence**

Append RED/GREEN counts, full command results, self-review, correction SHA, and unchanged publication gates to `.superpowers/sdd/final-fix-report.md` without staging controller artifacts.
