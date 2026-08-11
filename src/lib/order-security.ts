const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
export const TURNSTILE_ACTION = 'turnstile-spin-v1';
export const TURNSTILE_TOKEN_LIFETIME_MS = 5 * 60 * 1000;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const REFERENCE_PATTERN = /^TCL-[A-Z2-9]{8}-[A-Z2-9]{4}$/u;
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface OrderIntentClaims {
	intentId: string;
	issuedAt: number;
	expiresAt: number;
}

interface TurnstileResponse {
	success: boolean;
	challenge_ts?: string;
	hostname?: string;
	'error-codes'?: string[];
	action?: string;
	cdata?: string;
	metadata?: { ephemeral_id?: string };
}

export interface TurnstileVerificationInput {
	token: string;
	secret: string;
	remoteIp?: string;
	allowedHostnames: readonly string[];
	now?: number;
	fetchImpl?: typeof fetch;
}

export type TurnstileVerification =
	| { ok: true }
	| { ok: false; reason: 'configuration' | 'token' | 'provider' | 'action' | 'hostname' | 'expired' };

function encodeBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/gu, '');
}

function decodeBase64Url(value: string): Uint8Array | null {
	if (!/^[A-Za-z0-9_-]+$/u.test(value)) return null;
	try {
		const padding = '='.repeat((4 - value.length % 4) % 4);
		const binary = atob(value.replace(/-/gu, '+').replace(/_/gu, '/') + padding);
		const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
		return encodeBase64Url(bytes) === value ? bytes : null;
	} catch {
		return null;
	}
}

async function importHmacKey(secret: string, usage: KeyUsage): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		[usage],
	);
}

async function sign(value: string, secret: string): Promise<Uint8Array> {
	const key = await importHmacKey(secret, 'sign');
	return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

async function verify(value: string, signature: Uint8Array, secret: string): Promise<boolean> {
	const key = await importHmacKey(secret, 'verify');
	return crypto.subtle.verify('HMAC', key, signature.slice().buffer as ArrayBuffer, new TextEncoder().encode(value));
}

function encodeReference(bytes: Uint8Array, length: number): string {
	let accumulator = 0;
	let bits = 0;
	let encoded = '';
	for (const byte of bytes) {
		accumulator = (accumulator << 8) | byte;
		bits += 8;
		while (bits >= 5 && encoded.length < length) {
			bits -= 5;
			encoded += REFERENCE_ALPHABET[(accumulator >>> bits) & 31];
		}
		if (encoded.length === length) break;
		accumulator &= (1 << bits) - 1;
	}
	return encoded;
}

export async function createOrderReference(checkoutAttemptId: string, secret: string): Promise<string> {
	if (!UUID_V4_PATTERN.test(checkoutAttemptId) || !secret.trim()) {
		throw new Error('A valid checkout attempt and reference secret are required.');
	}
	const digest = await sign(`order-reference:v1:${checkoutAttemptId.toLowerCase()}`, secret);
	const encoded = encodeReference(digest, 12);
	return `TCL-${encoded.slice(0, 8)}-${encoded.slice(8)}`;
}

export function parseOrderReference(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const normalized = value.trim().toUpperCase();
	return REFERENCE_PATTERN.test(normalized) ? normalized : null;
}

export async function createOrderIntentToken(claims: OrderIntentClaims, secret: string): Promise<string> {
	if (
		!secret.trim()
		|| !UUID_V4_PATTERN.test(claims.intentId)
		|| !Number.isSafeInteger(claims.issuedAt)
		|| !Number.isSafeInteger(claims.expiresAt)
		|| claims.expiresAt <= claims.issuedAt
		|| claims.expiresAt - claims.issuedAt > TURNSTILE_TOKEN_LIFETIME_MS
	) {
		throw new Error('Invalid order-intent claims.');
	}
	const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
	return `${payload}.${encodeBase64Url(await sign(payload, secret))}`;
}

export async function verifySignedOrderIntentToken(
	token: unknown,
	secret: string,
): Promise<OrderIntentClaims | null> {
	if (typeof token !== 'string' || !secret.trim()) return null;
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [payload, encodedSignature] = parts;
	const payloadBytes = decodeBase64Url(payload);
	const signature = decodeBase64Url(encodedSignature);
	if (!payloadBytes || !signature || !(await verify(payload, signature, secret))) return null;

	try {
		const claims = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(payloadBytes)) as unknown;
		if (
			typeof claims !== 'object'
			|| claims === null
			|| Array.isArray(claims)
			|| Object.keys(claims).sort().join(',') !== 'expiresAt,intentId,issuedAt'
		) return null;
		const candidate = claims as Record<string, unknown>;
		if (
			typeof candidate.intentId !== 'string'
			|| !UUID_V4_PATTERN.test(candidate.intentId)
			|| !Number.isSafeInteger(candidate.issuedAt)
			|| !Number.isSafeInteger(candidate.expiresAt)
		) return null;
		const issuedAt = candidate.issuedAt as number;
		const expiresAt = candidate.expiresAt as number;
		if (
			expiresAt <= issuedAt
			|| expiresAt - issuedAt > TURNSTILE_TOKEN_LIFETIME_MS
		) return null;
		return { intentId: candidate.intentId, issuedAt, expiresAt };
	} catch {
		return null;
	}
}

export async function verifyOrderIntentToken(
	token: unknown,
	secret: string,
	now = Date.now(),
): Promise<OrderIntentClaims | null> {
	const claims = await verifySignedOrderIntentToken(token, secret);
	if (!claims || now < claims.issuedAt - 30_000 || now >= claims.expiresAt) return null;
	return claims;
}

function isTurnstileResponse(value: unknown): value is TurnstileResponse {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.success === 'boolean'
		&& (candidate.challenge_ts === undefined || typeof candidate.challenge_ts === 'string')
		&& (candidate.hostname === undefined || typeof candidate.hostname === 'string')
		&& (candidate.action === undefined || typeof candidate.action === 'string')
		&& (candidate['error-codes'] === undefined || (
			Array.isArray(candidate['error-codes'])
			&& candidate['error-codes'].every((code) => typeof code === 'string')
		))
	);
}

export async function verifyTurnstile(input: TurnstileVerificationInput): Promise<TurnstileVerification> {
	const token = typeof input.token === 'string' ? input.token.trim() : '';
	const secret = typeof input.secret === 'string' ? input.secret.trim() : '';
	const allowedHostnames = new Set(input.allowedHostnames.map((hostname) => hostname.trim()).filter(Boolean));
	if (!secret || allowedHostnames.size === 0) return { ok: false, reason: 'configuration' };
	if (!token || token.length > 2048) return { ok: false, reason: 'token' };

	try {
		const body: Record<string, string> = {
			secret,
			response: token,
			idempotency_key: crypto.randomUUID(),
		};
		if (input.remoteIp) body.remoteip = input.remoteIp;
		const response = await (input.fetchImpl ?? fetch)(TURNSTILE_SITEVERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		if (!response.ok) return { ok: false, reason: 'provider' };
		const result: unknown = await response.json();
		if (!isTurnstileResponse(result) || !result.success) return { ok: false, reason: 'provider' };
		if (result.action !== TURNSTILE_ACTION) return { ok: false, reason: 'action' };
		if (!result.hostname || !allowedHostnames.has(result.hostname)) return { ok: false, reason: 'hostname' };
		const challengedAt = Date.parse(result.challenge_ts ?? '');
		const now = input.now ?? Date.now();
		if (!Number.isFinite(challengedAt) || challengedAt > now + 30_000 || now - challengedAt > TURNSTILE_TOKEN_LIFETIME_MS) {
			return { ok: false, reason: 'expired' };
		}
		return { ok: true };
	} catch {
		return { ok: false, reason: 'provider' };
	}
}
