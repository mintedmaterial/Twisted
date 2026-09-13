# Whole-Fix Re-review Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct every binding finding in `.superpowers/sdd/whole-fix-review-findings.md` while preserving fail-closed checkout and external publication gates.

**Architecture:** Replace the coarse intent checkout flag with an attempt/fingerprint/owner/lease CAS record coordinated with the manifest lease. Separate request takeover time from reconciliation abandonment time, make cleanup state-first and observable, and move customer-side recovery behavior into testable pure models plus rendered components. Pin the Cloudflare toolchain and make CI/document checks exact.

**Tech Stack:** Next.js 15, TypeScript, Cloudflare Workers/R2/Images/Turnstile/rate-limit bindings, Node test runner, OpenNext.

## Global Constraints

- Use TDD for every behavior change and retain useful existing tests.
- Do not push, deploy, create resources, or mutate external systems.
- Commit only intended tracked repository files and the required report.

---

### Task 1: Intent ownership and expiry-safe completion

**Files:** Modify `src/lib/order-intent-state.ts`, `src/app/api/checkout/route.ts`, `scripts/custom-order-checkout-route.test.cjs`; add focused intent-state coverage.

- [x] Add failing sequential/concurrent distinct-attempt and provider-time-expiry tests.
- [x] Replace `available|pending|completed` with exact attempt/fingerprint/owner/lease binding and CAS-matched claim, renew, complete, and release APIs.
- [x] Coordinate manifest and intent ownership, and make post-manifest intent finalization best-effort after durable success.
- [x] Run checkout/intent focused tests to green.

### Task 2: Customer state, draft validation, and accessible interactions

**Files:** Modify assistant/draft/header/review components and their model/behavior tests.

- [x] Add failing tests for expired-intent uploaded-state recovery, draft semantic validation, reactive Bible navigation, exact phone/notes errors, disabled/stale interactions, visible Turnstile, and success cleanup.
- [x] Add a pure intent-reset/upload recovery transition and use it whenever verification expires.
- [x] Validate saved drafts with field lengths, select allowlists, valid upgrades, and exotic exclusivity before render.
- [x] React to same-page URL navigation and expose field-specific accessible validation/counters.
- [x] Run customer-focused behavior tests to green.

### Task 3: Reconciliation and cleanup consistency

**Files:** Modify reconciliation/upload/checkout cleanup code and focused tests.

- [x] Add failing in-flight grace, pagination/auth/CAS/delete/log/failure-count, rollback, quota-release, and ownership tests.
- [x] Introduce a reconciliation abandonment grace substantially longer than the request takeover lease.
- [x] Perform state/quota CAS release before deletion where required; surface exhausted CAS and every cleanup failure with structured non-PII logs.
- [x] Run upload/reconciliation/checkout cleanup tests to green.

### Task 4: Locked bindings, popup route, CI, and authoritative docs

**Files:** Modify lockfile/package scripts/workflow, popup route/tests, README, design/plan/deployment docs, and CI/docs tests.

- [x] Add failing checks for locked Wrangler/workerd reproduction, both workflow build environments, non-mutating type check, popup generated binding use, and contradictory documentation.
- [x] Pin the Cloudflare toolchain represented by the lockfile and generate/compare types through a temporary file.
- [x] Wire `vars.NEXT_PUBLIC_TURNSTILE_SITE_KEY` into both builds and replace the popup cast with `getCloudflareContext().env.DB`.
- [x] Rewrite obsolete design/plan/README guidance in place and strengthen contradiction tests.
- [x] Run operations/docs/popup tests to green.

### Task 5: Full verification, report, and commit

**Files:** Create `.superpowers/sdd/whole-fix-rereview-report.md`.

- [x] Run every focused suite and the cross-platform full suite.
- [x] Run TypeScript, locked generated-binding reproduction, and `git diff --check`.
- [x] Run standalone Next and OpenNext builds and record exact warnings/results.
- [x] Audit intended files, write the report with remaining external gates, and commit without controller artifacts.
