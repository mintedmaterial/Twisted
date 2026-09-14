/* eslint-disable */
export {};
declare global {
  interface CloudflareEnv {
    UGC_ASSETS?: R2Bucket;
    EMAIL?: { send: (msg: unknown) => Promise<void> };
    DISCORD_WEBHOOK_URL?: string;
    CAMPAIGN_FROM_ADDRESS?: string;
    CLOUDFLARE_ACCOUNT_ID?: string;
  }
}
