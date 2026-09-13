import 'next';

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			MAGIC_LINK_SECRET?: string;
			CLOUDFLARE_ACCOUNT_ID?: string;
			CLOUDFLARE_EMAIL_API_TOKEN?: string;
		}
	}
}

export {};
