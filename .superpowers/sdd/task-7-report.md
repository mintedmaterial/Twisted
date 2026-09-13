# Task 7: Trust, FAQ, and Post-Payment Timeline

## Delivered

- Added a reassurance panel beside the custom-order assistant with the four approved facts and the existing Google and Facebook review destinations.
- Added six native `<details>` / `<summary>` FAQ entries covering starting price, confirmation, approved changes, the 42–56 day estimate, reference-image handling, and one-piece ordering.
- Updated checkout success to validate `?ref=` against the `TCL-` reference format, display valid references with a save reminder, and show the four approved next steps while retaining both actions.

## RED evidence

- Added `scripts/custom-order-trust-success.test.cjs` before production changes.
- `node --test scripts/custom-order-trust-success.test.cjs` could not run because `node` is not on this shell's PATH.
- The configured bundled Node runtime ran the test and produced four expected failures: both new component files were absent, the assistant did not import/render them, and the success page lacked the timeline and query handling.

## GREEN evidence

- Focused trust/success test: 4 passing.
- Focused trust, assistant, model, and checkout suite: 27 passing.
- TypeScript: `tsc --noEmit` exited 0.

## Self-review

- Reused the exact review URLs from `ReviewsWidget.tsx`.
- Used only the approved 42–56 day estimate; no testimonial, rating, guarantee, or additional schedule was added.
- The success page renders only references matching `TCL-[A-Z2-9]{6}` and preserves Back Home and Facebook message actions.
- `git diff --check` completed without whitespace errors.

## Follow-up corrective pass: checkout claims and retention gate

### RED evidence

- Extended `scripts/custom-order-trust-success.test.cjs` before changing production copy.
- The bundled Node runtime produced the expected failures: the FAQ did not state that checkout collects the full published starting price or that approved upgrades are included, it promised deletion after 90 days, and the success page claimed payment/order receipt solely from a formatted query reference.

### GREEN evidence

- `node --test scripts/custom-order-trust-success.test.cjs scripts/custom-order-assistant-component.test.cjs scripts/custom-order-checkout.test.cjs`: 17 passing, 0 failing.
- `tsc --noEmit`: exited 0.
- `git diff --check`: exited 0 with no whitespace errors.

### Self-review

- Missing or malformed `ref` values now receive a neutral checkout-support state; the page does not claim an order or payment was received.
- A valid-format reference is presented only as a returned-from-Square reference. Its copy conditions the next action on payment having completed; URL format is not treated as payment verification.
- The four cards are labeled as the general process, beginning with `Payment through Square`, rather than as completed statuses.
- The FAQ now says checkout collects the full published starting price for one selected piece, includes selected allowed upgrades in that checkout total, and may require a separate payment for later customer-approved changes.
- Customer-facing copy now says reference photos are stored privately for the order process and are not published as gallery work without permission. It does not promise active deletion.

### Required pre-publish infrastructure gate

- The intended production retention policy is deletion of reference photos after 90 days. Do not publish that customer-facing promise until production R2 lifecycle deletion is configured and independently verified.
