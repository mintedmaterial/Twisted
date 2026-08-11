# Whole-branch final review correction report

## Status and commits

Status: implementation complete and locally verified; publication remains intentionally blocked on the external/manual gates below.

- Implementation commit: `afa220846b0d27c1e8fe48efc0957fbd3236855d`
- Baseline reviewed: `8d00aa76d196bce68f43bb1d092ca41d15c64de8`

## Design and behavior delivered

- Added fail-closed `POST /api/order-intent`: strict JSON framing, visitor rate limiting before parsing, fixed Cloudflare Siteverify endpoint, exact `turnstile-spin-v1` action, hostname allowlist, five-minute age check, minimal R2 intent state, and HMAC-signed short-lived intent tokens.
- Added explicit dynamic Turnstile rendering/reset behavior. Upload and checkout require the signed intent and apply visitor-plus-intent rate limits before multipart/JSON parsing.
- Replaced upload trust in signatures/structure with sequential Cloudflare Images `info` plus real decode/re-encode to bounded, non-animated canonical JPEG streams. Enforced exact aggregate/request/file/dimension/pixel/output limits, per-intent quota, ownership, removal, promotion, success cleanup, and failure rollback.
- Derived the customer reference from the full checkout-attempt UUID with server-secret HMAC and one shared formatter/parser. The success return clears a draft only when that canonical reference matches the pending session reference.
- Bound idempotency to the exact Square endpoint, API version, contract version, origin/signing-dependent private manifest URL, and request-body bytes before manifest claim/reuse.
- Preserved lease/CAS replay safety, added intent checkout CAS state, structured non-PII cleanup logs, and a bounded cursor-aware authenticated reconciliation endpoint that CAS-tombstones expired pending manifests/redacts expired intents before deleting their assets.
- Locked every assistant mutation/navigation while checkout is in flight and guarded late responses by attempt and revision. Drafts survive Square handoff. Product switching preserves legal shared answers. Exotic hides are a radio group with visible None and server enforcement.
- Added Bible-cover product-only deep linking/focus, grouped product categories, a prepayment Not Sure contact path, exact accessible field limits/counters/required state, and neutral success copy with delivery estimate plus email/Facebook contacts.
- Regenerated Cloudflare bindings from Wrangler 4.106.0, declared required secret names without values, added R2/Images/rate-limit bindings, replaced glob-dependent test execution, and gated deploy behind successful tests/types/generated types/OpenNext plus manual dispatch and the protected `production` environment.
- Updated the original design/plan and deployment documentation so 500-character compact Square notes, private manifests, JPEG/PNG sources, canonical Images output, lifecycle targets, WAF, reconciliation, and publication gates are authoritative.

## Verification evidence

All commands ran from the repository root. Because this Windows Codex runtime exposes Node but no global npm executable, local commands invoked the repository tools with the bundled Node binary; CI uses the equivalent npm scripts on Linux.

- `node scripts/run-tests.cjs` — PASS: 118 tests, 118 passed, 0 failed, 0 skipped.
- `node node_modules/typescript/bin/tsc --noEmit` — PASS, no diagnostics.
- `node scripts/check-cloudflare-types.cjs --check` — PASS using Wrangler 4.106.0; generated file reproduced exactly after deterministic trailing-whitespace normalization.
- `node node_modules/next/dist/bin/next build` — PASS: compiled, type/lint validation completed, 21/21 static pages generated. Four non-blocking `@next/next/no-img-element` advisories remain for private/interactive image previews and the pre-existing featured-work lightbox.
- `node node_modules/@opennextjs/cloudflare/dist/cli/index.js build` — PASS (exit 0): repeated the Next production build, generated `.open-next/worker.js`, and reported “OpenNext build complete.” Windows emitted its documented compatibility warning and a post-bundle EPERM warning while trying to create an `@ast-grep` native-package symlink; the worker bundle was already complete. The Linux CI build is the authoritative clean-platform gate.
- `git diff --check` — PASS, no whitespace errors.
- Focused customer suite before full verification — PASS: 37/37.
- Focused checkout/route suite before full verification — PASS: 33/33.
- Focused operations/reconciliation suite — PASS: 6/6.

## Self-review

- Reviewed the complete baseline-to-implementation diff and staged file list; only implementation, behavioral tests, generated types, CI, plan/spec, and deployment-guide files were committed. Controller-created `.superpowers/sdd` briefs/reviews/reports were preserved and excluded except this required report.
- Confirmed secrets are names only in `wrangler.jsonc`; no secret values, visitor IPs, or customer PII are persisted/logged by the intent or reconciliation layers.
- Confirmed expensive JSON/multipart parsing occurs only after framing, signed-intent, and rate-limit checks. Uploads are sequential and canonicalized through the binding; the legacy structural parser remains only as a retained utility/test surface, not the upload security boundary.
- Confirmed CAS precedes reconciler deletion, checkout rollback retains valid temporary uploads, completion deletes temporary copies only after success, and continuation cursors prevent a fixed first page from starving later records.
- Confirmed generated Worker types replace the deleted handwritten order-environment interface and application routes use `CloudflareEnv` without double casts.
- Confirmed CI order is tests, TypeScript, generated-binding check, and Linux OpenNext verification before any deploy job; a push to main cannot deploy because deploy also requires manual dispatch and `production` environment approval.

## Deliberate deviations and evidence

- Reconciliation is request-triggered rather than a configured cron. This avoids creating or activating an external schedule in this pass. The authenticated endpoint is bounded to 50 records per namespace per call and returns continuation cursors; the deployment guide specifies how an approved scheduler/operator must exhaust them.
- Real remote Images, Turnstile, rate-limit/WAF, R2 lifecycle, and Square production behavior were not exercised or created. Local tests use behavioral binding/provider doubles and verify fail-closed behavior. The brief explicitly keeps these as publication gates.
- Five legacy upload-route tests for the superseded unauthenticated structural-parser architecture were removed. Their still-useful parser/token/private-serving coverage remains, while the new intent/upload suite behaviorally covers framing, auth, rate-limit order, quota, Images decode/re-encode, sequential storage, rollback, removal, promotion, and cleanup.

## External/manual publication gates

1. Configure independent high-entropy Worker secrets: `TURNSTILE_SECRET_KEY`, `ORDER_INTENT_TOKEN_SECRET`, `ORDER_ASSET_TOKEN_SECRET`, `ORDER_REFERENCE_SECRET`, `ORDER_MAINTENANCE_SECRET`, and the applicable Square token.
2. Provide the production `NEXT_PUBLIC_TURNSTILE_SITE_KEY` at Linux build time and confirm `TURNSTILE_ALLOWED_HOSTNAMES` for every production hostname; never use Cloudflare test keys as production defaults.
3. Confirm/deploy the R2 bucket, Images binding, all three rate-limit bindings, and production Square location/credentials through approved infrastructure processes.
4. Configure R2 lifecycle rules: `order-intents/` 1 day, `order-uploads/` 1 day, `order-assets/` 90 days, and `order-manifests/` 365 days.
5. Configure WAF rules for the intent, upload/asset, and checkout endpoints; verify rate-limit behavior from real visitor traffic.
6. Configure an authenticated recurring invocation of `/api/order-maintenance`, exhaust returned cursors, and inspect structured reconciliation/cleanup logs.
7. Run real remote Images verification and malformed/large image probes on Cloudflare.
8. Exercise Square sandbox and production separately, including success redirect, identical replay, conflicting replay, provider failure, and attached-image cleanup.
9. Configure required reviewers on the GitHub `production` environment and let the Linux workflow pass all verification steps before approval.
10. Complete keyboard, screen-reader, mobile, upload/removal/retry, stale-response, Bible-cover deep-link, and matching/mismatched success-return checks in the production candidate.
