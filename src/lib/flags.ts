/**
 * Feature flag evaluation for Twisted Custom Leather.
 *
 * Uses Cloudflare Flagship native binding when available.
 * Falls back to hardcoded defaults in local dev or when the binding is unreachable.
 *
 * Flags control feature visibility — NOT authorization.
 * Auth (Cloudflare Access, magic links) remains independent.
 */

// ─── Flag keys ───────────────────────────────────────────────────────────────

export const FLAG_KEYS = [
	'ugc_campaign',           // UGC submission form, status portal, admin review
	'ugc_gallery',            // "In the Wild" gallery display
	'square_store_credit',    // Store credit redemption at checkout
	'email_sequences',        // Automated campaign email sending
	'order_lookup',           // Customer order history/status page
	'social_feed',            // Facebook/Instagram feed on homepage
	'product_pages_content',  // Real product page content vs "Coming Soon"
	'monthly_featured_creator', // Featured creator spotlight banner
	'customer_portal',        // Customer portal (magic-link auth, dashboard)
	'admin_agent',            // Admin AI chat agent (Durable Object)
	'customer_agent',         // Customer AI chat agent (Durable Object)
	'social_worker',          // Social posting worker integration
	'hermes_container_agent', // On-demand Hermes agent in Cloudflare Container
] as const;

export type FlagKey = (typeof FLAG_KEYS)[number];

// ─── Default values ──────────────────────────────────────────────────────────
// These are the fallback values used when:
// 1. Local dev (Flagship binding is remote-only)
// 2. The binding is somehow unreachable
// 3. A flag hasn't been defined in the Flagship dashboard yet
//
// Current live behavior is the baseline — UGC is on (already deployed),
// everything else is off until the corresponding issue is built.

export const FLAG_DEFAULTS: Record<FlagKey, boolean> = {
	ugc_campaign: true,           // Live on production
	ugc_gallery: false,           // Issue #14
	square_store_credit: false,  // Issue #15
	email_sequences: false,       // Issue #16
	order_lookup: false,          // Issue #17
	social_feed: false,           // Issue #18
	product_pages_content: false, // Issue #19
	monthly_featured_creator: false, // Future
	customer_portal: false,      // Issue #21
	admin_agent: false,           // Issue #22
	customer_agent: false,        // Issue #23
	social_worker: false,         // Issue #24
	hermes_container_agent: false, // Issue #26
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FlagContext {
	/** Stable visitor identifier (e.g. from cookie, or anonymous) */
	visitorId?: string;
	/** Customer ID if authenticated */
	customerId?: number;
	/** Whether the current user is an admin */
	isAdmin?: boolean;
}

// ─── Evaluator ───────────────────────────────────────────────────────────────

/**
 * Evaluate a feature flag.
 *
 * Uses the Cloudflare Flagship binding when available (production/remote).
 * Falls back to FLAG_DEFAULTS in local dev or when the binding is unreachable.
 *
 * Flagship bindings are remote-only in local Wrangler, so we must handle
 * the case where the binding exists but can't reach the service.
 */
export async function evaluateFlag(
	env: { FLAGS?: any; [key: string]: unknown },
	key: FlagKey,
	context?: FlagContext
): Promise<boolean> {
	// If no Flagship binding, use default
	if (!env.FLAGS) {
		return FLAG_DEFAULTS[key];
	}

	try {
		// Build a stable targeting context
		const targetingContext: Record<string, string | number | boolean> = {};
		if (context?.visitorId) targetingContext.visitorId = context.visitorId;
		if (context?.customerId) targetingContext.customerId = context.customerId;
		if (context?.isAdmin) targetingContext.isAdmin = context.isAdmin;

		// Evaluate using the native binding
		// The Flagship binding's evaluate method returns a result with a value
		const result = await env.FLAGS.evaluate(key, targetingContext);
		const value = typeof result === 'boolean' ? result : result?.value;
		return typeof value === 'boolean' ? value : FLAG_DEFAULTS[key];
	} catch {
		// Binding unavailable or flag not defined — fall back to default
		// This is expected in local dev (remote-only binding)
		return FLAG_DEFAULTS[key];
	}
}

/**
 * Evaluate multiple flags in one call (more efficient than sequential calls).
 */
export async function evaluateFlags(
	env: { FLAGS?: any; [key: string]: unknown },
	keys: FlagKey[],
	context?: FlagContext
): Promise<Record<FlagKey, boolean>> {
	const entries = await Promise.all(
		keys.map(async (key) => [key, await evaluateFlag(env, key, context)] as const)
	);
	return Object.fromEntries(entries) as Record<FlagKey, boolean>;
}

/**
 * Get all flag states for the admin dashboard display.
 */
export async function getAllFlagStates(
	env: { FLAGS?: any; [key: string]: unknown },
	context?: FlagContext
): Promise<Array<{ key: FlagKey; enabled: boolean; default: boolean }>> {
	const results = await evaluateFlags(env, FLAG_KEYS, context);
	return FLAG_KEYS.map((key) => ({
		key,
		enabled: results[key],
		default: FLAG_DEFAULTS[key],
	}));
}

/**
 * Get a stable visitor ID from request cookies, or generate one.
 * This is used for consistent flag targeting across requests from the same visitor.
 */
export function getVisitorId(request: Request): string {
	// Check for existing visitor cookie
	const cookieHeader = request.headers.get('Cookie') ?? '';
	const match = cookieHeader.match(/tcl_visitor=([^;]+)/);
	if (match) return match[1];

	// Generate a new one (doesn't persist here — the response should set the cookie)
	const id = `v_${crypto.randomUUID()}`;
	return id;
}

/**
 * Create the Set-Cookie header for the visitor ID.
 */
export function visitorCookie(id: string): string {
	const maxAge = 365 * 24 * 60 * 60; // 1 year
	return `tcl_visitor=${id}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
}
