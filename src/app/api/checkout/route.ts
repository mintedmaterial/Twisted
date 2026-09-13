import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
	CheckoutConfigurationError,
	CheckoutValidationError,
	completeOrderManifest,
	createOrderPayloadFingerprint,
	failOrderManifest,
	getSquareConfiguration,
	makeOrderManifest,
	makePaymentNote,
	renewOrderManifest,
	resolveCompletedReferenceImages,
	validateCheckoutRequest,
	verifyReferenceImages,
	type CheckoutProviderContext,
	type CustomOrderManifest,
	type PendingCustomOrderManifest,
} from '@/lib/custom-order-checkout';
import { createAssetToken, createManifestKey } from '@/lib/order-assets';
import {
	claimOrderIntentCheckout,
	completeOrderIntentCheckout,
	OrderIntentStateError,
	readOrderIntentState,
	releaseOrderIntentCheckout,
	renewOrderIntentCheckout,
	type CheckoutIntentOwner,
} from '@/lib/order-intent-state';
import { createOrderReference, verifyOrderIntentToken, verifySignedOrderIntentToken } from '@/lib/order-security';

const SQUARE_API_VERSION = '2026-05-20';
const SQUARE_CONTRACT_VERSION = 4;
const PENDING_LEASE_MS = 15_000;
const MAX_MANIFEST_CLAIM_ATTEMPTS = 8;

class SquareProviderError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SquareProviderError';
	}
}

class CheckoutAttemptConflictError extends Error {
	constructor() {
		super('This checkout attempt is already associated with a different order. Start checkout again.');
		this.name = 'CheckoutAttemptConflictError';
	}
}

class CheckoutAttemptPendingError extends Error {
	constructor() {
		super('This checkout attempt is still being created. Try again.');
		this.name = 'CheckoutAttemptPendingError';
	}
}

class ManifestStateError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ManifestStateError';
	}
}

interface StoredManifest {
	etag: string;
	manifest: CustomOrderManifest;
}

interface ManifestOwnership {
	bucket: R2Bucket;
	key: string;
	etag: string;
	manifest: PendingCustomOrderManifest;
}

const FAILED_MANIFEST_KEYS = new Set([
	'version',
	'checkoutState',
	'payloadFingerprint',
	'providerContext',
	'checkoutAttemptId',
]);

function runtimeConfiguration(env: CloudflareEnv): Record<string, unknown> {
	return { ...process.env, ...env };
}

function checkoutErrorResponse(error: string, status: number) {
	return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function readContentLength(request: Request): number | null {
	const raw = request.headers.get('Content-Length');
	if (!raw || !/^\d+$/u.test(raw)) return null;
	const value = Number(raw);
	return Number.isSafeInteger(value) ? value : null;
}

function bearerToken(request: Request): string | null {
	const match = request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_.-]+)$/u);
	return match?.[1] ?? null;
}

function isHttpsUrl(value: string): boolean {
	try {
		return new URL(value).protocol === 'https:';
	} catch {
		return false;
	}
}

function isOrigin(value: string): boolean {
	try {
		const parsed = new URL(value);
		return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.origin === value;
	} catch {
		return false;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProviderContext(value: unknown): value is CheckoutProviderContext {
	return (
		isRecord(value)
		&& (value.environment === 'sandbox' || value.environment === 'production')
		&& typeof value.locationId === 'string'
		&& value.locationId.length > 0
		&& typeof value.requestOrigin === 'string'
		&& isOrigin(value.requestOrigin)
	);
}

function isCustomOrderManifest(value: unknown): value is CustomOrderManifest {
	const hasIdentity = (
		isRecord(value)
		&& value.version === 3
		&& typeof value.payloadFingerprint === 'string'
		&& /^[0-9a-f]{64}$/u.test(value.payloadFingerprint)
		&& isProviderContext(value.providerContext)
		&& typeof value.checkoutAttemptId === 'string'
	);
	if (!hasIdentity) return false;
	if (value.checkoutState === 'failed') {
		return (
			Object.keys(value).length === FAILED_MANIFEST_KEYS.size
			&& Object.keys(value).every((key) => FAILED_MANIFEST_KEYS.has(key))
		);
	}
	return (
		(value.checkoutState === 'pending' || value.checkoutState === 'completed')
		&& typeof value.ownerId === 'string'
		&& value.ownerId.length > 0
		&& typeof value.leaseExpiresAt === 'number'
		&& Number.isFinite(value.leaseExpiresAt)
		&& typeof value.orderReference === 'string'
		&& (value.checkoutState !== 'completed' || (typeof value.checkoutUrl === 'string' && isHttpsUrl(value.checkoutUrl)))
	);
}

function sameProviderContext(left: CheckoutProviderContext, right: CheckoutProviderContext): boolean {
	return (
		left.environment === right.environment
		&& left.locationId === right.locationId
		&& left.requestOrigin === right.requestOrigin
	);
}

function sameRecord(left: Record<string, string>, right: Record<string, string>): boolean {
	const leftEntries = Object.entries(left).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
	const rightEntries = Object.entries(right).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
	return JSON.stringify(leftEntries) === JSON.stringify(rightEntries);
}

function matchesCompletedRequest(
	manifest: Extract<CustomOrderManifest, { checkoutState: 'completed' }>,
	order: ReturnType<typeof validateCheckoutRequest> & { orderReference: string },
	providerContext: CheckoutProviderContext,
): boolean {
	return (
		sameProviderContext(manifest.providerContext, providerContext)
		&& manifest.checkoutAttemptId === order.checkoutAttemptId
		&& manifest.orderReference === order.orderReference
		&& manifest.product.id === order.product.id
		&& sameRecord(manifest.customization, order.customization)
		&& JSON.stringify(manifest.upgrades.map(({ id }) => id).sort()) === JSON.stringify(order.upgrades.map(({ id }) => id).sort())
		&& (manifest.galleryReferenceId ?? null) === (order.galleryReferenceId ?? null)
		&& manifest.contact.customerName === order.customerName
		&& manifest.contact.email === order.email
		&& manifest.contact.phone === order.phone
		&& manifest.notes === order.notes
		&& manifest.total === order.total
	);
}

function manifestOptions(manifest: CustomOrderManifest) {
	const customMetadata: Record<string, string> = {
		recordType: 'custom-order-manifest',
		checkoutState: manifest.checkoutState,
		payloadFingerprint: manifest.payloadFingerprint,
		providerEnvironment: manifest.providerContext.environment,
		providerLocationId: manifest.providerContext.locationId,
		requestOrigin: manifest.providerContext.requestOrigin,
	};
	if (manifest.checkoutState !== 'failed') {
		customMetadata.ownerId = manifest.ownerId;
		customMetadata.leaseExpiresAt = String(manifest.leaseExpiresAt);
	}
	return {
		httpMetadata: { contentType: 'application/json' },
		customMetadata,
	};
}

async function readManifest(bucket: R2Bucket, key: string): Promise<StoredManifest | null> {
	const object = await bucket.get(key);
	if (!object) return null;

	try {
		const manifest = await object.json<unknown>();
		if (!object.etag || !isCustomOrderManifest(manifest)) {
			throw new ManifestStateError('The stored checkout manifest is invalid.');
		}
		return { etag: object.etag, manifest };
	} catch (error) {
		if (error instanceof ManifestStateError) throw error;
		throw new ManifestStateError('The stored checkout manifest could not be read.');
	}
}

async function markOwnedManifestFailed(ownership: ManifestOwnership): Promise<void> {
	try {
		const failedManifest = failOrderManifest(ownership.manifest);
		const replaced = await ownership.bucket.put(
			ownership.key,
			JSON.stringify(failedManifest),
			{
				...manifestOptions(failedManifest),
				onlyIf: { etagMatches: ownership.etag },
			},
		);
		if (!replaced) console.warn(JSON.stringify({
			event: 'order_manifest_tombstone_cas_miss',
			checkoutAttemptId: ownership.manifest.checkoutAttemptId,
		}));
	} catch {
		console.warn(JSON.stringify({
			event: 'order_manifest_tombstone_failed',
			checkoutAttemptId: ownership.manifest.checkoutAttemptId,
		}));
	}
}

function checkoutResponse(manifest: CustomOrderManifest) {
	if (manifest.checkoutState !== 'completed' || !manifest.checkoutUrl) {
		throw new ManifestStateError('The stored checkout manifest is not complete.');
	}
	return NextResponse.json({
		checkoutUrl: manifest.checkoutUrl,
		orderReference: manifest.orderReference,
	});
}

export async function POST(request: NextRequest) {
	let ownership: ManifestOwnership | undefined;
	let attachedKeys: string[] = [];
	let claimedIntent: { bucket: R2Bucket; claims: import('@/lib/order-security').OrderIntentClaims; owner: CheckoutIntentOwner } | undefined;
	let providerInvocationStarted = false;

	try {
		const contentType = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
		if (contentType !== 'application/json') return checkoutErrorResponse('Checkout requires JSON.', 415);
		const contentLength = readContentLength(request);
		if (contentLength === null) return checkoutErrorResponse('Checkout requires a content length.', 411);
		if (contentLength < 1 || contentLength > 64 * 1024) {
			return checkoutErrorResponse('Checkout request is too large.', 413);
		}
		const { env } = getCloudflareContext();
		const intentSecret = env.ORDER_INTENT_TOKEN_SECRET?.trim();
		if (!env.ORDER_ASSETS || !env.ORDER_CHECKOUT_RATE_LIMITER || !intentSecret) {
			return checkoutErrorResponse('Checkout verification is not configured.', 503);
		}
		const authorizationToken = bearerToken(request);
		const signedIntentClaims = await verifySignedOrderIntentToken(authorizationToken, intentSecret);
		if (!signedIntentClaims) return checkoutErrorResponse('Complete verification before checkout.', 401);
		const freshIntentClaims = await verifyOrderIntentToken(authorizationToken, intentSecret);
		const visitorIp = request.headers.get('CF-Connecting-IP')?.trim();
		if (!visitorIp || visitorIp.length > 64) return checkoutErrorResponse('Unable to verify this request.', 403);
		const rate = await env.ORDER_CHECKOUT_RATE_LIMITER.limit({
			key: `order-checkout:${visitorIp}:${signedIntentClaims.intentId}`,
		});
		if (!rate.success) return checkoutErrorResponse('Please wait before trying checkout again.', 429);

		let input: unknown;
		try {
			input = await request.json();
		} catch {
			throw new CheckoutValidationError('Checkout request must be valid JSON for one custom piece.');
		}

		const validationTime = Date.now();
		const validatedOrder = validateCheckoutRequest(input, new Date(validationTime));
		const config = runtimeConfiguration(env);
		const square = getSquareConfiguration(config);
		const secret = env.ORDER_ASSET_TOKEN_SECRET?.trim();
		const referenceSecret = env.ORDER_REFERENCE_SECRET?.trim();
		if (!secret || !referenceSecret) {
			throw new CheckoutConfigurationError('Private order records are not configured.');
		}
		const order = {
			...validatedOrder,
			orderReference: await createOrderReference(validatedOrder.checkoutAttemptId, referenceSecret),
		};

		const requestOrigin = new URL(request.url).origin;
		const providerContext: CheckoutProviderContext = {
			environment: square.environment,
			locationId: square.locationId,
			requestOrigin,
		};
		const manifestKey = createManifestKey(order.checkoutAttemptId, square.environment);
		const manifestToken = await createAssetToken(manifestKey, secret);
		const privateRecordUrl = `${requestOrigin}/api/order-assets/${manifestToken}`;
		const redirectUrl = `${requestOrigin}/checkout/success?ref=${encodeURIComponent(order.orderReference)}`;
		const squareEndpoint = `${square.apiOrigin}/v2/online-checkout/payment-links`;
		const squareRequestBody = JSON.stringify({
			idempotency_key: order.checkoutAttemptId,
			description: 'Twisted Custom Leather website custom order',
			quick_pay: {
				name: 'Twisted Custom Leather Custom Order',
				price_money: {
					amount: order.total * 100,
					currency: 'USD',
				},
				location_id: square.locationId,
			},
			checkout_options: {
				redirect_url: redirectUrl,
				ask_for_shipping_address: true,
			},
			payment_note: makePaymentNote(order, privateRecordUrl),
		});
		const providerRequestContract = {
			contractVersion: SQUARE_CONTRACT_VERSION,
			endpoint: squareEndpoint,
			apiVersion: SQUARE_API_VERSION,
			body: squareRequestBody,
		};
		const replayCandidate = await readManifest(env.ORDER_ASSETS, manifestKey);
		if (replayCandidate?.manifest.checkoutState === 'completed') {
			const replayReferences = await resolveCompletedReferenceImages(
				order,
				replayCandidate.manifest.referenceImages,
				secret,
				signedIntentClaims.intentId,
				requestOrigin,
			);
			if (
				replayReferences
				&& matchesCompletedRequest(replayCandidate.manifest, order, providerContext)
				&& replayReferences.length === replayCandidate.manifest.referenceImages.length
			) return checkoutResponse(replayCandidate.manifest);
		}
		if (!freshIntentClaims) return checkoutErrorResponse('Complete verification before checkout.', 401);
		const intentClaims = freshIntentClaims;
		const storedIntent = await readOrderIntentState(env.ORDER_ASSETS, intentClaims);
		const verifiedReferenceImages = await verifyReferenceImages(
			order,
			env.ORDER_ASSETS,
			secret,
			intentClaims.intentId,
			storedIntent.state.uploadKeys,
			requestOrigin,
			storedIntent.state.checkoutState === 'completed',
		);
		const payloadFingerprint = await createOrderPayloadFingerprint(
			order,
			verifiedReferenceImages,
			providerContext,
			providerRequestContract,
		);
		const ownerId = crypto.randomUUID();
		const intentOwner: CheckoutIntentOwner = { checkoutAttemptId: order.checkoutAttemptId, ownerId };
		const initialLeaseExpiresAt = Date.now() + PENDING_LEASE_MS;
		const intentClaim = await claimOrderIntentCheckout(env.ORDER_ASSETS, intentClaims, {
			...intentOwner,
			fingerprint: payloadFingerprint,
			leaseExpiresAt: initialLeaseExpiresAt,
		});
		if (intentClaim === 'claimed') claimedIntent = { bucket: env.ORDER_ASSETS, claims: intentClaims, owner: intentOwner };
		const finalizeCompletedIntent = async () => {
			let transitioned = !claimedIntent;
			if (claimedIntent) {
				try {
					transitioned = await completeOrderIntentCheckout(claimedIntent.bucket, claimedIntent.claims, claimedIntent.owner);
					if (!transitioned) console.warn(JSON.stringify({ event: 'order_intent_completion_cas_miss', intentId: intentClaims.intentId }));
				} catch {
					console.warn(JSON.stringify({ event: 'order_intent_completion_failed', intentId: intentClaims.intentId }));
				}
			}
			if (!transitioned) return;
			claimedIntent = undefined;
			const cleanup = await Promise.allSettled(verifiedReferenceImages.map(async ({ sourceKey }) => env.ORDER_ASSETS.delete(sourceKey)));
			const failures = cleanup.filter((result) => result.status === 'rejected').length;
			if (failures > 0) console.warn(JSON.stringify({
				event: 'order_temp_cleanup_deferred',
				intentId: intentClaims.intentId,
				attempted: cleanup.length,
				succeeded: cleanup.length - failures,
				failed: failures,
			}));
		};
		if (intentClaim !== 'claimed') {
			const stored = await readManifest(env.ORDER_ASSETS, manifestKey);
			if (stored?.manifest.checkoutState === 'completed' && stored.manifest.payloadFingerprint === payloadFingerprint && sameProviderContext(stored.manifest.providerContext, providerContext)) {
				await finalizeCompletedIntent();
				return checkoutResponse(stored.manifest);
			}
			throw new CheckoutAttemptPendingError();
		}
		const pendingManifestAt = (claimTime: number) => makeOrderManifest(
			order,
			verifiedReferenceImages,
			new Date(claimTime),
			providerContext,
			payloadFingerprint,
			ownerId,
			claimTime + PENDING_LEASE_MS,
		);

		for (let attempt = 0; attempt < MAX_MANIFEST_CLAIM_ATTEMPTS && !ownership; attempt += 1) {
			const claimTime = Date.now();
			const claimManifest = pendingManifestAt(claimTime);
			const created = await env.ORDER_ASSETS.put(
				manifestKey,
				JSON.stringify(claimManifest),
				{
					...manifestOptions(claimManifest),
					onlyIf: { etagDoesNotMatch: '*' },
				},
			);
			if (created) {
				if (!created.etag) throw new ManifestStateError('The checkout manifest claim has no ETag.');
				ownership = {
					bucket: env.ORDER_ASSETS,
					key: manifestKey,
					etag: created.etag,
					manifest: claimManifest,
				};
				break;
			}

			const stored = await readManifest(env.ORDER_ASSETS, manifestKey);
			if (!stored) continue;
			if (
				!sameProviderContext(stored.manifest.providerContext, providerContext)
				|| stored.manifest.payloadFingerprint !== payloadFingerprint
			) {
				throw new CheckoutAttemptConflictError();
			}
			if (stored.manifest.checkoutState === 'completed') {
				await finalizeCompletedIntent();
				return checkoutResponse(stored.manifest);
			}
			const comparisonTime = Date.now();
			if (stored.manifest.checkoutState === 'pending' && stored.manifest.leaseExpiresAt > comparisonTime) {
				throw new CheckoutAttemptPendingError();
			}

			const takeoverTime = Date.now();
			const takeoverManifest = pendingManifestAt(takeoverTime);
			const takenOver = await env.ORDER_ASSETS.put(
				manifestKey,
				JSON.stringify(takeoverManifest),
				{
					...manifestOptions(takeoverManifest),
					onlyIf: { etagMatches: stored.etag },
				},
			);
			if (takenOver) {
				if (!takenOver.etag) throw new ManifestStateError('The checkout manifest takeover has no ETag.');
				ownership = {
					bucket: env.ORDER_ASSETS,
					key: manifestKey,
					etag: takenOver.etag,
					manifest: takeoverManifest,
				};
			}
		}
		if (!ownership) throw new CheckoutAttemptPendingError();

		const squareRequestOptions = {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${square.accessToken}`,
				'Square-Version': SQUARE_API_VERSION,
				'Content-Type': 'application/json',
			},
			body: squareRequestBody,
		};

		const renewalTime = Date.now();
		const renewedManifest = renewOrderManifest(
			ownership.manifest,
			renewalTime + PENDING_LEASE_MS,
		);
		const renewed = await env.ORDER_ASSETS.put(
			manifestKey,
			JSON.stringify(renewedManifest),
			{
				...manifestOptions(renewedManifest),
				onlyIf: { etagMatches: ownership.etag },
			},
		);
		if (!renewed) {
			const stored = await readManifest(env.ORDER_ASSETS, manifestKey);
			if (
				stored?.manifest.checkoutState === 'completed'
				&& stored.manifest.payloadFingerprint === payloadFingerprint
				&& sameProviderContext(stored.manifest.providerContext, providerContext)
			) {
				await finalizeCompletedIntent();
				ownership = undefined;
				return checkoutResponse(stored.manifest);
			}
			throw new ManifestStateError('The checkout manifest lease could not be renewed.');
		}
		if (!renewed.etag) throw new ManifestStateError('The renewed checkout manifest has no ETag.');
		ownership = { ...ownership, etag: renewed.etag, manifest: renewedManifest };
		const intentRenewed = await renewOrderIntentCheckout(env.ORDER_ASSETS, intentClaims, {
			...intentOwner,
			leaseExpiresAt: renewedManifest.leaseExpiresAt,
		});
		if (!intentRenewed) throw new ManifestStateError('The order intent lease could not be renewed.');

		for (const reference of verifiedReferenceImages) {
			const source = await env.ORDER_ASSETS.get(reference.sourceKey);
			if (!source?.body) {
				throw new CheckoutValidationError('One or more reference images could not be promoted. Upload them again.');
			}
			await env.ORDER_ASSETS.put(reference.key, source.body, {
				httpMetadata: { contentType: reference.contentType },
				customMetadata: {
					recordType: 'attached-order-asset',
					originalName: reference.name,
					checkoutAttemptId: order.checkoutAttemptId,
				},
			});
			attachedKeys.push(reference.key);
		}

		providerInvocationStarted = true;
		const squareResponse = await fetch(
			squareEndpoint,
			squareRequestOptions,
		);

		const data = await squareResponse.json() as {
			payment_link?: { url?: string; long_url?: string };
			errors?: Array<{ detail?: string; code?: string }>;
		};

		if (!squareResponse.ok) {
			console.error('Square checkout rejected the payment-link request:', data.errors);
			throw new SquareProviderError('Square rejected the payment-link request.');
		}

		const checkoutUrl = data.payment_link?.long_url || data.payment_link?.url;
		if (!checkoutUrl || !isHttpsUrl(checkoutUrl)) {
			console.error('Square checkout response did not include a secure payment-link URL.');
			throw new SquareProviderError('Square did not return a secure payment-link URL.');
		}

		const completedManifest = completeOrderManifest(ownership.manifest, checkoutUrl);
		const completed = await env.ORDER_ASSETS.put(
			manifestKey,
			JSON.stringify(completedManifest),
			{
				...manifestOptions(completedManifest),
				onlyIf: { etagMatches: ownership.etag },
			},
		);
		if (!completed) {
			const stored = await readManifest(env.ORDER_ASSETS, manifestKey);
			if (
				stored?.manifest.checkoutState === 'completed'
				&& stored.manifest.payloadFingerprint === payloadFingerprint
				&& sameProviderContext(stored.manifest.providerContext, providerContext)
			) {
				await finalizeCompletedIntent();
				ownership = undefined;
				return checkoutResponse(stored.manifest);
			}
			throw new ManifestStateError('The checkout manifest could not be completed.');
		}

		await finalizeCompletedIntent();
		ownership = undefined;
		attachedKeys = [];
		return checkoutResponse(completedManifest);
	} catch (error) {
		if (!providerInvocationStarted) {
			if (ownership) await markOwnedManifestFailed(ownership);
			if (attachedKeys.length > 0) {
				const bucket = ownership?.bucket ?? claimedIntent?.bucket;
				const cleanup = bucket
					? await Promise.allSettled(attachedKeys.map(async (key) => bucket.delete(key)))
					: [];
				const failed = cleanup.filter((result) => result.status === 'rejected').length + (bucket ? 0 : attachedKeys.length);
				console.warn(JSON.stringify({
					event: 'order_attached_assets_rolled_back',
					attempted: attachedKeys.length,
					succeeded: attachedKeys.length - failed,
					failed,
				}));
			}
			if (claimedIntent) {
				try {
					const released = await releaseOrderIntentCheckout(claimedIntent.bucket, claimedIntent.claims, claimedIntent.owner);
					if (!released) console.warn(JSON.stringify({ event: 'order_intent_release_cas_miss', intentId: claimedIntent.claims.intentId }));
				} catch {
					console.warn(JSON.stringify({ event: 'order_intent_release_failed', intentId: claimedIntent.claims.intentId }));
				}
			}
		} else {
			console.warn(JSON.stringify({ event: 'order_provider_outcome_ambiguous', checkoutAttemptId: ownership?.manifest.checkoutAttemptId }));
		}

		if (error instanceof CheckoutValidationError) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}
		if (error instanceof CheckoutAttemptConflictError || error instanceof CheckoutAttemptPendingError) {
			return NextResponse.json({ error: error.message }, { status: 409 });
		}
		if (error instanceof OrderIntentStateError) {
			return checkoutErrorResponse(error.message, error.status);
		}
		if (error instanceof CheckoutConfigurationError) {
			return NextResponse.json({ error: 'Square checkout is not configured yet.' }, { status: 500 });
		}

		if (!(error instanceof SquareProviderError)) console.error('Checkout error:', error);
		return NextResponse.json(
			{ error: 'Unable to start checkout right now.' },
			{ status: 500 },
		);
	}
}
