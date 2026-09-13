/**
 * Lightweight HMAC-SHA256 for signing magic links.
 * Runs inside Cloudflare Workers using the Web Crypto API.
 */

export async function signPayload(secret: string, payload: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function verifyPayload(secret: string, payload: string, signature: string): Promise<boolean> {
	const expected = await signPayload(secret, payload);
	if (signature.length !== expected.length) return false;
	let result = 0;
	for (let i = 0; i < signature.length; i++) {
		result |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return result === 0;
}

export function encodeMagicLinkPayload(email: string, maxAgeMinutes = 60): string {
	const expires = Math.floor(Date.now() / 1000) + maxAgeMinutes * 60;
	return btoa(JSON.stringify({ e: email, exp: expires }));
}

export function decodeMagicLinkPayload(raw: string): { email: string; expires: number } | null {
	try {
		const json = atob(raw);
		const parsed = JSON.parse(json) as { e?: string; exp?: number };
		if (!parsed.e || typeof parsed.exp !== 'number') return null;
		return { email: parsed.e, expires: parsed.exp };
	} catch {
		return null;
	}
}
