# Whole-Branch Final Review Correction Plan

**Goal:** Close every remaining customer-flow, abuse-control, storage-lifecycle, image-processing, retry-integrity, CI, generated-type, and publication-documentation gap identified in the binding whole-branch review.

**Constraints:** Stay in the existing worktree, use the existing `IMAGES` binding for decode/re-encode, create no external resources, deploy nothing, and implement every behavior test-first. Production remains fail-closed until the documented Cloudflare and Square publication gates are provisioned.

## Task 1: Shared order-intent and reference contracts

- Add red tests for Siteverify success/failure, action/hostname checks, token age and replay rejection, HMAC order-intent round trips, and non-guessable customer references derived from the full attempt ID.
- Implement a shared security module for fixed Siteverify calls, intent signing/parsing, visitor-IP extraction, R2 intent state, and one canonical reference formatter/parser.
- Verify the focused tests, then refactor only while green.

## Task 2: Intent-gated, rate-limited image uploads

- Add red route tests proving content type and content length are checked before parsing, malformed/extra fields fail, rate limiting runs before body parsing, intent ownership and upload quota are enforced, processing is sequential, and Cloudflare Images info/input/transform/output produce canonical non-animated JPEGs.
- Replace permanent upload writes with `order-uploads/<intent>/...` temporary objects and signed local URLs. Add authenticated removal and rollback behavior.
- Verify exact size, dimension, megapixel, count, output-size, and cleanup boundaries.

## Task 3: Checkout promotion, exact provider contract, and reconciliation

- Add red tests for intent-gated checkout, one-active/completed-checkout CAS state, temporary-object ownership, successful promotion to `order-assets/`, failed promotion/Square cleanup, retained temporary uploads on retryable failure, and expired-state reconciliation.
- Build the exact Square request, manifest URL, version, item name, note bytes, and contract version before any claim/reuse decision; bind the normalized provider request and signing/config context into the fingerprint.
- Promote assets before completion, persist attached signed URLs in the private manifest, and delete temporary objects only after successful completion.

## Task 4: Customer-flow integrity and validation

- Add red model/component tests for full mutation locking during checkout, submission revision guards, pending-reference draft clearing, legal answer preservation on product switch, mutually exclusive exotic hides with an explicit None option, grouped products, Not Sure contact path, and Bible Cover header entry behavior.
- Add exact client/server limits, counters, `aria-required`, field-level and summary errors, `noValidate`, and disabled navigation/input/upload/inspiration/back controls.
- Add explicit Turnstile rendering with action `turnstile-spin-v1`, reset-on-failure/retry, and short-lived intent acquisition before upload/checkout.

## Task 5: Success return and pending draft contract

- Add red tests for checkout-to-success reference round trips and session-storage matching.
- Store the pending reference when Square returns a payment link; clear the local draft only on a valid matching success return.
- Show the canonical server reference, neutral payment wording, the 42-56 day estimate, Facebook, and the existing Randy email contact.

## Task 6: Cloudflare configuration, generated types, CI, and documentation

- Add red source/config tests for required generated bindings, cross-platform test invocation, TypeScript and OpenNext gates, protected production deployment, lifecycle prefixes, WAF/rate-limit/Turnstile/Images publication gates, and no premature deployment-ready claim.
- Update `wrangler.jsonc` with non-secret binding declarations and documented triggers only, then regenerate `cloudflare-env.d.ts` with repository Wrangler 4.106.0.
- Replace handwritten binding casts with generated `CloudflareEnv` types and add structured non-PII cleanup/tombstone logs.

## Task 7: Full verification and handoff

- Run every focused test, the complete cross-platform test suite, generated-type freshness check, TypeScript, Next build, and Linux-compatible OpenNext build.
- Inspect the full diff for secrets, PII, stale contracts, unrelated edits, and missed review requirements.
- Write `.superpowers/sdd/whole-branch-fix-report.md`, commit the complete pass, and report the commit and remaining publication gates without pushing, merging, opening a PR, or deploying.
