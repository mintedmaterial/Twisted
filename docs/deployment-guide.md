# Custom-order deployment guide

The custom-order flow is implemented, but publication remains gated on external Cloudflare and Square configuration plus manual verification. A merge to `main` runs verification only. Deployment requires a manually dispatched workflow and approval through the protected GitHub `production` environment.

## Required configuration

- Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the Linux build environment. Use Cloudflare's official test site key only for local/test builds; never make it a production fallback.
- Add Worker secrets named `TURNSTILE_SECRET_KEY`, `ORDER_INTENT_TOKEN_SECRET`, `ORDER_ASSET_TOKEN_SECRET`, `ORDER_REFERENCE_SECRET`, `ORDER_MAINTENANCE_SECRET`, and `SQUARE_PRODUCTION_ACCESS_TOKEN`. Generate independent high-entropy values for each order secret.
- Confirm `TURNSTILE_ALLOWED_HOSTNAMES`, the Square production location, the R2 `ORDER_ASSETS` bucket, the `IMAGES` binding, and all three rate-limit bindings in `wrangler.jsonc`.
- Configure Cloudflare WAF rules for `/api/order-intent`, `/api/order-assets*`, and `/api/checkout` as a second abuse-control layer. The Worker remains fail-closed if a required Turnstile, R2, Images, rate-limit, or secret binding is absent.
- Restrict `POST /api/order-maintenance` to an authenticated scheduler or operator using `ORDER_MAINTENANCE_SECRET`; invoke it regularly (recommended hourly). No scheduler is created by this change.

## R2 lifecycle and reconciliation

Configure these bucket lifecycle targets in the Cloudflare dashboard or approved infrastructure workflow:

- `order-intents/`: 1 day
- `order-uploads/`: 1 day
- `order-assets/`: 90 days
- `order-manifests/`: 365 days

The authenticated maintenance endpoint scans a bounded batch and uses ETag CAS before redacting expired intents or tombstoning expired pending manifests. It then removes their temporary or newly attached customer images. If the JSON response includes `manifestCursor` or `intentCursor`, invoke the endpoint again with those query parameters until no cursor remains. Structured logs contain event names and counts, never customer data. Lifecycle rules are the independent backstop.

## Image and checkout contract

Customers may upload up to three JPEG or PNG source files, each at most 8 MB. The Worker checks declared request size before multipart parsing, inspects each source with the Cloudflare Images binding, enforces dimension and pixel caps, and sequentially decodes/re-encodes every accepted image to a non-animated canonical JPEG before streaming it to R2. Real remote Images verification is a publication gate.

Square receives one item and a compact payment note of at most 500 characters. Private customization, contact, and attached-image details live in the signed R2 manifest URL. Provider endpoint, API version, origin, signing-dependent URL, and exact request body are included in the idempotency fingerprint.

## Manual publication gates

Before approving the `production` environment deployment, use Node 22 and run `npm ci`, `npm test`, `npm run typecheck`, `npm run cf-typecheck`, and `npm run build:opennext` on Linux; verify the real Images binding; test Turnstile action and hostname enforcement; confirm WAF/rate-limit behavior; test sandbox and production Square credentials separately; verify R2 lifecycle rules; invoke and inspect the maintenance reconciler; then perform keyboard, mobile, stale-response, upload-removal, retry, and matching/mismatched success-return checks.
