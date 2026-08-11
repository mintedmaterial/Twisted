# Whole-Fix Rereview Report

Date: 2026-08-03
Branch: `codex/custom-order-assistant-design`
Reviewed baseline: `5b39508`
Status: all binding correction findings implemented and locally verified; production publication remains gated on the external/manual checks below.

## Implemented corrections

- Replaced the coarse order-intent checkout flag with version 2 attempt/fingerprint/owner/lease state. One intent now binds to exactly one checkout attempt and provider request, active pending work returns 409 to other owners, takeover requires an expired lease plus CAS, and completed replay succeeds only for the exact bound attempt/fingerprint.
- Renewed both manifest and intent leases immediately before Square. A durable completed provider manifest remains authoritative even if the short-lived intent expires during provider work; intent completion and temporary cleanup are observable best-effort follow-up work and cannot turn provider success into an error.
- Added a ten-minute reconciliation abandonment grace distinct from request takeover timing. Reconciliation records CAS loss, read/write/delete failures, continuation cursors, and failure counts without customer data.
- Made upload cleanup state-first: quota ownership is released with CAS before object deletion. CAS exhaustion keeps the object referenced and returns a retryable conflict instead of creating untracked content.
- Expired verification clears all uploaded, pending, and failed reference-image session state. Saved drafts now enforce 2,000-character field limits, canonical select options, product-specific upgrade allowlists, duplicate rejection, and one exotic hide.
- Made the Bible Cover header entry reactive to client-side same-page navigation while preserving unrelated query parameters and the anchor. It replaces the current draft, persists the selected Bible Cover, scrolls, and focuses the assistant.
- Added exact phone/notes validation with field-specific error-summary targets, inline errors, ARIA relationships, and visible counters.
- Pinned `wrangler` and `workerd` through `package.json` and `package-lock.json` at Wrangler 4.106.0. Cloudflare type generation now refuses a mismatched installed Wrangler and `--check` generates into a temporary directory without touching `cloudflare-env.d.ts`.
- Mapped `vars.NEXT_PUBLIC_TURNSTILE_SITE_KEY` into both workflow OpenNext builds. The popup route now reads the generated `getCloudflareContext().env.DB` binding.
- Corrected README deployment instructions and the original design/plan in place: deployment is manual `workflow_dispatch` plus protected-production approval; configuration is `wrangler.jsonc`; reference sources are JPEG/PNG with canonical JPEG output; Square notes are compact and capped at 500 characters; private data stays in `order-manifests/`.
- Strengthened behavior coverage for intent ownership/concurrency/expiry, cleanup/CAS/logging, draft semantics, same-page Bible navigation, expired uploads, exact review limits/accessibility, deployment configuration, generated types, and documentation accuracy.

## Exact verification results

- Focused intent route/state: `node --test scripts/order-intent-route.test.cjs scripts/order-intent-state.test.cjs` — PASS, 6/6.
- Focused CI/docs/popup: `node --test scripts/ci-operations.test.cjs` — PASS, 5/5.
- Full regression: `node scripts/run-tests.cjs` — PASS, 131/131, zero failures.
- TypeScript: `npm run typecheck` — PASS, exit 0.
- Locked generated types: `npm run cf-typegen` followed by `npm run cf-typecheck` — PASS with Wrangler 4.106.0; the second command generated in a temporary directory and left the committed target unchanged.
- Next production build: `NEXT_PUBLIC_TURNSTILE_SITE_KEY=<Cloudflare test key> npm run build` — PASS, all 21 static/dynamic routes generated.
- Full OpenNext build: `NEXT_PUBLIC_TURNSTILE_SITE_KEY=<Cloudflare test key> npm run build:opennext` — PASS, `.open-next/worker.js` and assets generated. The run required an ordinary temporary `npm` launcher because the Codex desktop runtime exposes Node but no `npm` executable on `PATH`.
- Diff hygiene: `git diff --check` — PASS.

## Warnings and self-review

- Next/OpenNext emitted the existing `@next/next/no-img-element` warnings for private reference previews and featured-work lightbox images. They are non-fatal and do not affect the correctness/security findings in this pass.
- OpenNext emitted its documented warning that Windows is not fully supported. The full build nevertheless completed and produced the worker. CI remains the authoritative Linux OpenNext gate.
- Wrangler 4.55.0 from the old lock was reproduced in a clean temporary install but its pinned Windows workerd crashed during runtime-type generation. The repository was therefore pinned consistently to Wrangler 4.106.0/workerd 1.20260630.1 in both package and lock; a clean install, type generation, non-mutating check, Next build, and OpenNext build all succeeded with that pair.
- No external Cloudflare resources, secrets, Square requests, GitHub changes, pushes, or deployments were created. Temporary clean-room installs and launchers were excluded from the repository; the local ignored `node_modules` is a normal clean install from the committed lock.
- Structured logs contain only event names, intent IDs, record types, counts, and cursor/failure information; no contact data, filenames, customization, IP address, or provider credentials are logged.

## External/manual publication gates

1. Configure the real Cloudflare Images, R2, rate-limit, WAF, Turnstile, D1, and protected GitHub production environment settings; verify required secrets without committing values.
2. Configure and inspect R2 lifecycle policies for `order-uploads/`, `order-assets/`, `order-intents/`, and `order-manifests/`, and run the authenticated maintenance reconciler through all continuation cursors.
3. Verify the production `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, allowed hostnames, real challenge rendering/reset behavior, and abuse controls on every production hostname.
4. Exercise Square sandbox and production configuration separately, including provider retries, delayed responses, matching/mismatched replay, success return, and no duplicate Payment Links. Do not perform an unapproved production payment.
5. Complete desktop/mobile, keyboard-only, focus, screen-reader, upload preview/removal/retry, same-page Bible navigation, and success/session-cleanup acceptance checks in real browsers.
6. Confirm worst-case Worker CPU/memory behavior for image validation and reconciliation pagination under the production plan.

Publication is intentionally not declared ready until these gates pass and the owner explicitly approves deployment.
