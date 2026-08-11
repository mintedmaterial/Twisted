# Whole-Fix Third Review Correction Plan

> **For Codex:** Follow the systematic-debugging, test-driven-development, and verification-before-completion skills. Add each regression test first, observe the relevant failure, implement the narrow correction, and rerun the focused test before moving on.

**Goal:** Close every second-rereview finding while preserving an attempt-bound checkout after any potentially successful provider invocation, permitting only exact completed-manifest replay after intent expiry, and proving browser-visible recovery and validation behavior with rendered interaction tests.

**Architecture:** Treat checkout as a durable state machine with a provider-invocation boundary. Before that boundary, proven local failures may release the intent and roll back assets; at or after the boundary, the manifest, attached assets, attempt ID, fingerprint, and provider idempotency key remain durable so an identical retry can reconcile without allowing a distinct attempt. Completed replay authenticates the signed claims and exact stored request from the completed manifest before consulting live intent or temporary objects. Browser behavior is exercised through real React rendering in a DOM environment, while reconciliation and cleanup paths expose structured counters for every failed compare-and-set or object operation.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node 22, Node test runner, Testing Library/JSDOM, Cloudflare Workers/D1/R2/Images, Square Checkout API.

---

### Task 1: Freeze the checkout ambiguity and replay contract in failing route tests

**Files:**
- Modify: `scripts/custom-order-checkout-route.test.cjs`
- Modify: `scripts/order-intent-state.test.cjs`
- Modify: `src/lib/custom-order-checkout.ts`
- Modify: `src/lib/order-intent-state.ts`

1. Add sequential and genuinely concurrent distinct-attempt tests around one intent, plus same-attempt replay tests.
2. Add provider transport, malformed response, invalid checkout URL, and completion-CAS ambiguity tests. Assert a later distinct attempt cannot invoke Square and an identical attempt keeps the same Square idempotency key.
3. Add completed-manifest lost-response replay after intent expiry, with and without images, and an intent-finalization failure case. Assert replay succeeds without temporary-object reads and cannot authorize new work.
4. Run the focused tests and record their current failures.

### Task 2: Correct the durable checkout state machine

**Files:**
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/lib/custom-order-checkout.ts`
- Modify: `src/lib/order-intent-state.ts`
- Modify: `scripts/custom-order-checkout-route.test.cjs`

1. Separate signed-claim authentication from freshness enforcement so an expired token can identify only an already-completed exact manifest.
2. Resolve and verify an exact completed manifest before live intent or temporary-object checks; reject mismatches and all non-completed expired requests.
3. Mark the provider boundary immediately before invocation. Release/rollback only failures proven to occur before it; retain binding, pending manifest, and attached objects after it.
4. Preserve the attempt/fingerprint and reuse the Square idempotency key for identical retry/takeover.
5. Delete temporary sources only after durable intent completion succeeds; retain them when completion is ambiguous.
6. Rerun the focused route/runtime tests to green.

### Task 3: Make cleanup and reconciliation failures observable

**Files:**
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/app/api/order-assets/route.ts`
- Modify: `src/app/api/order-maintenance/route.ts`
- Modify: `src/lib/order-intent-state.ts`
- Modify: `scripts/custom-order-checkout-route.test.cjs`
- Modify: `scripts/order-assets.test.cjs`
- Modify: `scripts/order-reconciliation.test.cjs`

1. Add failing tests for manifest tombstone false/throw, upload-intent release throw, partial and total deletion failure, attached rollback failure, pagination cursor propagation, maintenance authentication, and real compare-and-set contention.
2. Return or log structured attempted/succeeded/failed counts for cleanup work, and log false compare-and-set outcomes separately from thrown exceptions.
3. Use settled cleanup operations so a release exception never prevents object deletion or hides its result.
4. Rerun all three focused route suites.

### Task 4: Add rendered browser interaction coverage and close UI races

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Add: `scripts/custom-order-rendered-interactions.test.cjs`
- Modify: `src/components/custom-order/CustomOrderAssistant.tsx`
- Modify: `src/components/custom-order/TurnstileWidget.tsx`
- Modify: `src/components/custom-order/OrderReviewStep.tsx`
- Modify: `src/components/custom-order/orderAssistantModel.ts`

1. Add the minimal Node 22-compatible Testing Library/JSDOM development dependencies.
2. Render the production assistant/component tree and add failing interaction tests for Turnstile expiry/reset, a late upload response, cleared/recovery state, and the resulting checkout payload.
3. Add rendered same-page Bible navigation tests that mimic App Router query updates and assert product/state update, one-time order-parameter consumption, campaign/hash preservation, scroll, and focus.
4. Add rendered phone/notes tests for limits, counters, inline errors, ARIA wiring, summary links, and first-invalid focus.
5. Add a session epoch/abort guard so late upload completions cannot restore expired state, and make navigation/focus effects idempotent under query updates.
6. Rerun the rendered suite and the existing assistant model suites.

### Task 5: Make generated bindings Node-22 and checkout-path independent

**Files:**
- Modify: `package.json`
- Modify: `scripts/check-cloudflare-types.cjs`
- Modify: `scripts/cloudflare-types.test.cjs`
- Modify: `.github/workflows/deploy.yml`
- Modify: `README.md`
- Regenerate: `cloudflare-env.d.ts`

1. Add failing tests for Node 22 alignment, relocation-independent output on Windows/Linux-style paths, deterministic generated banners, and temporary-directory cleanup on success and failure.
2. Normalize only the Wrangler invocation-path portion of the generated banner while preserving the binding hash/content.
3. Remove early `process.exit` paths so `finally` always removes temporary output.
4. Pin the project, both workflows, and README prerequisites to Node 22; regenerate and verify bindings.

### Task 6: Reconcile authoritative docs with deployed architecture

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-02-custom-order-assistant-design.md`
- Modify: `docs/superpowers/plans/2026-08-02-custom-order-assistant.md`
- Modify: `docs/deployment-guide.md`
- Modify: `scripts/ci-operations.test.cjs`

1. Add failing documentation contract assertions for 2,000-character customization, 300-character notes, Square’s compact <=500-character provider note, private contact/customization manifests, actual attempt-bound attached keys, and current D1/R2/Images/rate-limit bindings.
2. Remove language describing implemented storage as planned and update manual deployment instructions to the current generated-binding/Node-22 workflow.
3. Rerun documentation and binding tests.

### Task 7: Run the complete closeout matrix and commit only intended files

**Files:**
- Add: `.superpowers/sdd/whole-fix-third-review-report.md`

1. Run every targeted route, runtime, rendered-interaction, cleanup, documentation, and bindings suite.
2. Run the full Node suite, TypeScript, Cloudflare type generation/check, Next production build, and full OpenNext production build.
3. Inspect generated bindings and the final diff, verify no external deployment/mutation occurred, and exclude unrelated controller artifacts.
4. Record RED/GREEN evidence, matrix coverage, exact command results, changed-file inventory, and residual risks in the report.
5. Commit the intended correction set on `codex/custom-order-assistant-design`.
