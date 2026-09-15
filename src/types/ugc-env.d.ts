export {};
declare global {
  interface CloudflareEnv {
    UGC_ASSETS?: R2Bucket;
    EMAIL?: { send: (msg: unknown) => Promise<void> };
    DISCORD_WEBHOOK_URL?: string;
    CAMPAIGN_FROM_ADDRESS?: string;
    CLOUDFLARE_ACCOUNT_ID?: string;
    MAGIC_LINK_SECRET?: string;
    CLOUDFLARE_EMAIL_API_TOKEN?: string;
    [key: string]: unknown;
  }
}
