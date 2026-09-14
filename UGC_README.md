# UGC Campaign - Show Us Your Twisted Gear

## Required environment variables / secrets

Set these via `wrangler secret put` (production) or `.dev.vars` (local):

- `MAGIC_LINK_SECRET` - 32+ byte random string for signing status links.
- `DISCORD_WEBHOOK_URL` - Webhook URL for new-submission notifications.
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID (used for REST email sends).
- `CLOUDFLARE_EMAIL_API_TOKEN` - API token scoped to `Zone:Edit` and `Email Sending:Edit`.

Via wrangler.jsonc `vars`:

- `CAMPAIGN_FROM_ADDRESS` - defaults to `campaigns@twistedcustomleather.com`.

## Cloudflare account setup

1. Enable Email Sending for the domain:
   `wrangler email sending enable twistedcustomleather.com`
2. Verify the R2 bucket `twisted-order-assets` exists.
3. Run the D1 schema:
   `wrangler d1 execute twisted-newsletter --remote --file=./schema-ugc.sql`
4. Protect `/admin/ugc` with a Cloudflare Access (Zero Trust) application. The admin API only allows emails listed in `src/app/api/ugc/admin/route.ts`.

## Routes

- Public submit page: `/submit-your-gear`
- Alias redirect: `/submit-your-leather` -> `/submit-your-gear` (308)
- Customer status request: `/my-submissions`
- Admin review page (Access-gated): `/admin/ugc`
- API endpoints:
  - `POST /api/ugc/submit`
  - `GET /api/ugc/status`
  - `POST /api/ugc/magic-link`
  - `GET /api/ugc/admin?status=pending`
  - `POST /api/ugc/admin`
  - `GET /api/ugc/preview?key=...`

## Social account tie-in

This campaign collects Instagram/TikTok handles and tags creators manually when published. Fully automated account verification would require platform OAuth app approvals; add that only if the campaign becomes recurring.

## Facebook Reel

A vertical campaign teaser was generated from your existing reel (`twisted-ad-reel-2.mov`) and saved to `videos/ugc-reel/twisted-ugc-campaign-reel.mp4`.
