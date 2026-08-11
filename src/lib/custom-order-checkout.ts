import {
	calculateOrderTotal,
	calculateDeliveryWindow,
	customizationFieldDefinitions,
	getCheckoutProduct,
	validateCustomization,
	type CheckoutProduct,
	type CustomizationFieldKey,
	type CustomizationValues,
	type PaidUpgrade,
} from '../components/custom-order/orderAssistantModel';
import { getGalleryOrderReference } from '../data/gallery-order-references';
import {
	ALLOWED_REFERENCE_TYPES,
	canonicalReferenceFilename,
	contentTypeFromCanonicalKey,
	createAssetToken,
	createAttachedReferenceKey,
	isCanonicalTemporaryReferenceKey,
	verifyAssetToken,
} from './order-assets';

export interface CheckoutRequestInput {
	checkoutAttemptId?: unknown;
	productId?: unknown;
	customization?: unknown;
	upgradeIds?: unknown;
	referenceId?: unknown;
	referenceImages?: unknown;
	customerName?: unknown;
	email?: unknown;
	phone?: unknown;
	notes?: unknown;
	acknowledgedStartingPrice?: unknown;
}

export interface ValidatedReferenceImageInput {
	name: string;
	url: string;
	contentType: string;
}

export interface VerifiedReferenceImage {
	sourceKey: string;
	key: string;
	name: string;
	url: string;
	contentType: string;
}

export interface ValidatedCustomOrder {
	checkoutAttemptId: string;
	orderReference: string;
	product: CheckoutProduct;
	customization: CustomizationValues;
	upgrades: PaidUpgrade[];
	galleryReferenceId?: string;
	referenceImages: ValidatedReferenceImageInput[];
	referenceImageUrls: string[];
	customerName: string;
	email: string;
	phone: string;
	notes: string;
	deliveryWindow: string;
	total: number;
}

export interface CheckoutProviderContext {
	environment: 'sandbox' | 'production';
	locationId: string;
	requestOrigin: string;
}

export interface SquareProviderRequestContract {
	contractVersion: number;
	endpoint: string;
	apiVersion: string;
	body: string;
}

interface CustomOrderManifestIdentity {
	version: 3;
	payloadFingerprint: string;
	providerContext: CheckoutProviderContext;
	checkoutAttemptId: string;
}

interface FullCustomOrderManifest extends CustomOrderManifestIdentity {
	ownerId: string;
	leaseExpiresAt: number;
	orderReference: string;
	createdAt: string;
	product: { id: string; name: string; startingAmount: number };
	customization: CustomizationValues;
	upgrades: Array<{ id: PaidUpgrade['id']; label: string; amount: number }>;
	galleryReferenceId?: string;
	referenceImages: Array<Omit<VerifiedReferenceImage, 'sourceKey'>>;
	contact: { customerName: string; email: string; phone: string };
	notes: string;
	deliveryWindow: string;
	total: number;
}

export interface PendingCustomOrderManifest extends FullCustomOrderManifest {
	checkoutState: 'pending';
}

export interface CompletedCustomOrderManifest extends FullCustomOrderManifest {
	checkoutState: 'completed';
	checkoutUrl: string;
}

export interface FailedCustomOrderManifest extends CustomOrderManifestIdentity {
	checkoutState: 'failed';
}

export type CustomOrderManifest =
	| PendingCustomOrderManifest
	| CompletedCustomOrderManifest
	| FailedCustomOrderManifest;

export interface SquareConfiguration {
	environment: 'sandbox' | 'production';
	apiOrigin: 'https://connect.squareupsandbox.com' | 'https://connect.squareup.com';
	accessToken: string;
	locationId: string;
}

export class CheckoutValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CheckoutValidationError';
	}
}

export class CheckoutConfigurationError extends Error {
	constructor(message = 'Square checkout is not configured for a supported environment.') {
		super(message);
		this.name = 'CheckoutConfigurationError';
	}
}

const MAX_PAYMENT_NOTE_LENGTH = 500;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const REFERENCE_IMAGE_PATH_PATTERN = /^\/api\/order-assets\/[A-Za-z0-9_-]+$/u;
const DANGEROUS_NOTE_CONTROLS = /(?:[\u0000-\u001f\u007f-\u009f\u2028\u2029]|\p{Bidi_Control})+/gu;
const REQUEST_KEYS = new Set([
	'checkoutAttemptId',
	'productId',
	'customization',
	'upgradeIds',
	'referenceId',
	'referenceImages',
	'customerName',
	'email',
	'phone',
	'notes',
	'acknowledgedStartingPrice',
]);
const REFERENCE_IMAGE_KEYS = new Set(['name', 'url', 'contentType']);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function removeDangerousControls(value: string): string {
	return value.replace(DANGEROUS_NOTE_CONTROLS, ' ').replace(/\s+/gu, ' ').trim();
}

function readString(value: unknown, label: string, minimum: number, maximum: number): string {
	if (typeof value !== 'string') {
		throw new CheckoutValidationError(`${label} must be text.`);
	}

	const normalized = removeDangerousControls(value);
	if (normalized.length < minimum || normalized.length > maximum) {
		throw new CheckoutValidationError(`${label} must be between ${minimum} and ${maximum} characters.`);
	}

	return normalized;
}

function validateCustomizationValues(product: CheckoutProduct, input: unknown): CustomizationValues {
	if (!isRecord(input)) {
		throw new CheckoutValidationError('Customization details are required for this custom piece.');
	}

	const customization: CustomizationValues = {};
	for (const [key, value] of Object.entries(input)) {
		if (!product.fieldKeys.includes(key as CustomizationFieldKey)) {
			throw new CheckoutValidationError(`Customization field ${key} does not apply to ${product.name}.`);
		}

		const fieldKey = key as CustomizationFieldKey;
		const label = customizationFieldDefinitions[fieldKey].label;
		customization[fieldKey] = readString(value, label, 0, 2000);
	}

	const errors = validateCustomization(product.id, customization);
	const firstError = Object.entries(errors)[0];
	if (firstError) {
		const [key, message] = firstError;
		const label = key === '_form'
			? 'Customization'
			: customizationFieldDefinitions[key as CustomizationFieldKey].label;
		throw new CheckoutValidationError(`${label}: ${message}`);
	}

	return customization;
}

function validateUpgrades(product: CheckoutProduct, input: unknown): PaidUpgrade[] {
	if (!Array.isArray(input)) {
		throw new CheckoutValidationError('Upgrade selections must be a list.');
	}

	const seen = new Set<string>();
	const upgrades = input.map((upgradeId) => {
		if (typeof upgradeId !== 'string') {
			throw new CheckoutValidationError('Every upgrade selection must be valid.');
		}
		if (seen.has(upgradeId)) {
			throw new CheckoutValidationError(`Upgrade ${upgradeId} is a duplicate.`);
		}

		seen.add(upgradeId);
		const upgrade = product.upgrades.find((candidate) => candidate.id === upgradeId);
		if (!upgrade) {
			throw new CheckoutValidationError(`Upgrade ${upgradeId} is not available for ${product.name}.`);
		}
		return upgrade;
	});
	if (upgrades.filter(({ id }) => id === 'stingray' || id === 'gator' || id === 'ostrich').length > 1) {
		throw new CheckoutValidationError('Choose at most one exotic hide.');
	}
	return upgrades;
}

function validateReferenceImages(input: unknown): ValidatedReferenceImageInput[] {
	if (!Array.isArray(input)) {
		throw new CheckoutValidationError('Reference images must be a list.');
	}
	if (input.length > 3) {
		throw new CheckoutValidationError('Attach up to 3 reference images.');
	}

	const seenUrls = new Set<string>();
	return input.map((image) => {
		if (
			!isRecord(image)
			|| Object.keys(image).some((key) => !REFERENCE_IMAGE_KEYS.has(key))
			|| typeof image.name !== 'string'
			|| typeof image.contentType !== 'string'
			|| typeof image.url !== 'string'
			|| !REFERENCE_IMAGE_PATH_PATTERN.test(image.url)
		) {
			throw new CheckoutValidationError('Each reference image must use a valid local order asset path.');
		}
		if (seenUrls.has(image.url)) {
			throw new CheckoutValidationError('Reference image URLs must not be duplicate.');
		}
		seenUrls.add(image.url);
		return { name: image.name, url: image.url, contentType: image.contentType };
	});
}

export function validateCheckoutRequest(input: unknown, now = new Date()): ValidatedCustomOrder {
	if (!isRecord(input) || Object.keys(input).some((key) => !REQUEST_KEYS.has(key))) {
		throw new CheckoutValidationError('Checkout accepts exactly one custom piece.');
	}

	if (typeof input.checkoutAttemptId !== 'string' || !UUID_V4_PATTERN.test(input.checkoutAttemptId)) {
		throw new CheckoutValidationError('Checkout attempt must use a valid identifier.');
	}
	const checkoutAttemptId = input.checkoutAttemptId.toLowerCase();
	if (typeof input.productId !== 'string') {
		throw new CheckoutValidationError('Checkout accepts exactly one custom piece.');
	}
	const product = getCheckoutProduct(input.productId);
	if (!product) {
		throw new CheckoutValidationError('Checkout accepts exactly one custom piece from the catalog.');
	}

	if (input.acknowledgedStartingPrice !== true) {
		throw new CheckoutValidationError('Confirm that you understand the starting price.');
	}

	const customization = validateCustomizationValues(product, input.customization);
	const upgrades = validateUpgrades(product, input.upgradeIds);
	const referenceImages = validateReferenceImages(input.referenceImages);
	let galleryReferenceId: string | undefined;
	if (input.referenceId !== undefined) {
		if (
			typeof input.referenceId !== 'string'
			|| !getGalleryOrderReference(product.id, input.referenceId)
		) {
			throw new CheckoutValidationError('Choose an inspiration reference that matches the selected piece.');
		}
		galleryReferenceId = input.referenceId;
	}
	const customerName = readString(input.customerName, 'Customer name', 1, 100);
	const email = readString(input.email, 'Email', 3, 254);
	if (!EMAIL_PATTERN.test(email)) {
		throw new CheckoutValidationError('Enter a valid email address.');
	}
	const phone = readString(input.phone, 'Phone', 0, 40);
	const notes = readString(input.notes, 'Notes', 0, 300);

	return {
		checkoutAttemptId,
		// Issued by the route from an HMAC of the full attempt ID after secret configuration is verified.
		orderReference: '',
		product,
		customization,
		upgrades,
		...(galleryReferenceId ? { galleryReferenceId } : {}),
		referenceImages,
		referenceImageUrls: referenceImages.map(({ url }) => url),
		customerName,
		email,
		phone,
		notes,
		deliveryWindow: calculateDeliveryWindow(now),
		total: calculateOrderTotal(product.id, upgrades.map((upgrade) => upgrade.id)),
	};
}

export function getSquareConfiguration(env: Record<string, unknown>): SquareConfiguration {
	const environment = typeof env.SQUARE_ENVIRONMENT === 'string'
		? env.SQUARE_ENVIRONMENT.trim()
		: '';
	if (environment !== 'sandbox' && environment !== 'production') {
		throw new CheckoutConfigurationError();
	}

	const tokenKey = environment === 'sandbox'
		? 'SQUARE_SANDBOX_ACCESS_TOKEN'
		: 'SQUARE_PRODUCTION_ACCESS_TOKEN';
	const locationKey = environment === 'sandbox'
		? 'SQUARE_SANDBOX_LOCATION_ID'
		: 'SQUARE_PRODUCTION_LOCATION_ID';
	const accessToken = typeof env[tokenKey] === 'string' ? env[tokenKey].trim() : '';
	const locationId = typeof env[locationKey] === 'string' ? env[locationKey].trim() : '';
	if (!accessToken || !locationId) throw new CheckoutConfigurationError();

	return {
		environment,
		apiOrigin: environment === 'sandbox'
			? 'https://connect.squareupsandbox.com'
			: 'https://connect.squareup.com',
		accessToken,
		locationId,
	};
}

export async function verifyReferenceImages(
	order: ValidatedCustomOrder,
	bucket: R2Bucket,
	secret: string,
	intentId: string,
	ownedUploadKeys: readonly string[],
	requestOrigin: string,
	allowMissingTemporaryObjects = false,
): Promise<VerifiedReferenceImage[]> {
	return Promise.all(order.referenceImages.map(async (reference) => {
		const token = reference.url.slice(reference.url.lastIndexOf('/') + 1);
		const sourceKey = await verifyAssetToken(token, secret);
		if (
			!sourceKey
			|| !isCanonicalTemporaryReferenceKey(sourceKey)
			|| !sourceKey.startsWith(`order-uploads/${intentId}/`)
			|| !ownedUploadKeys.includes(sourceKey)
		) {
			throw new CheckoutValidationError('One or more reference images could not be verified. Remove them and upload again.');
		}
		const expectedContentType = contentTypeFromCanonicalKey(sourceKey);
		const object = await bucket.head(sourceKey);
		const storedContentType = object?.httpMetadata?.contentType;
		const originalName = object?.customMetadata?.originalName;
		if (
			(!object && !allowMissingTemporaryObjects)
			|| (object && object.customMetadata?.recordType !== 'temporary-order-upload')
			|| (object && object.customMetadata?.intentId !== intentId)
			|| !expectedContentType
			|| (object && (!storedContentType || !ALLOWED_REFERENCE_TYPES.has(storedContentType)))
			|| (object && storedContentType !== expectedContentType)
			|| (object && (typeof originalName !== 'string' || !originalName.trim()))
			|| reference.contentType !== 'image/jpeg'
		) {
			throw new CheckoutValidationError('One or more reference images could not be verified. Remove them and upload again.');
		}
		const key = createAttachedReferenceKey(order.checkoutAttemptId, sourceKey);
		const attachedToken = await createAssetToken(key, secret);

		return {
			sourceKey,
			key,
			name: canonicalReferenceFilename(originalName ?? reference.name, expectedContentType),
			url: `${requestOrigin}/api/order-assets/${attachedToken}`,
			contentType: expectedContentType,
		};
	}));
}

/**
 * Reconstructs the immutable reference-image identity for an already-completed
 * manifest without consulting temporary objects. The signed source token and
 * deterministic attached key prove that the request names the same uploads;
 * the durable manifest supplies the canonical filename captured at checkout.
 */
export async function resolveCompletedReferenceImages(
	order: ValidatedCustomOrder,
	manifestReferences: readonly { key: string; name: string; url: string; contentType: string }[],
	secret: string,
	intentId: string,
	requestOrigin: string,
): Promise<VerifiedReferenceImage[] | null> {
	if (order.referenceImages.length !== manifestReferences.length) return null;
	const resolved = await Promise.all(order.referenceImages.map(async (reference) => {
		const token = reference.url.slice(reference.url.lastIndexOf('/') + 1);
		const sourceKey = await verifyAssetToken(token, secret);
		if (
			!sourceKey
			|| !isCanonicalTemporaryReferenceKey(sourceKey)
			|| !sourceKey.startsWith(`order-uploads/${intentId}/`)
			|| reference.contentType !== 'image/jpeg'
		) return null;
		const contentType = contentTypeFromCanonicalKey(sourceKey);
		if (!contentType) return null;
		const key = createAttachedReferenceKey(order.checkoutAttemptId, sourceKey);
		const stored = manifestReferences.find((candidate) => candidate.key === key);
		if (
			!stored
			|| stored.contentType !== contentType
			|| typeof stored.name !== 'string'
			|| !stored.name.trim()
		) return null;
		const attachedToken = await createAssetToken(key, secret);
		const url = `${requestOrigin}/api/order-assets/${attachedToken}`;
		if (stored.url !== url) return null;
		return { sourceKey, key, name: stored.name, url, contentType };
	}));
	if (resolved.some((reference) => reference === null)) return null;
	return resolved as VerifiedReferenceImage[];
}

export function makeOrderManifest(
	order: ValidatedCustomOrder,
	referenceImages: VerifiedReferenceImage[],
	createdAt: Date,
	providerContext: CheckoutProviderContext,
	payloadFingerprint: string,
	ownerId: string,
	leaseExpiresAt: number,
): PendingCustomOrderManifest {
	return {
		version: 3,
		checkoutState: 'pending',
		payloadFingerprint,
		ownerId,
		leaseExpiresAt,
		providerContext: { ...providerContext },
		checkoutAttemptId: order.checkoutAttemptId,
		orderReference: order.orderReference,
		createdAt: createdAt.toISOString(),
		product: { id: order.product.id, name: order.product.name, startingAmount: order.product.amount },
		customization: { ...order.customization },
		upgrades: order.upgrades.map(({ id, label, amount }) => ({ id, label, amount })),
		...(order.galleryReferenceId ? { galleryReferenceId: order.galleryReferenceId } : {}),
		referenceImages: referenceImages.map(({ key, name, url, contentType }) => ({ key, name, url, contentType })),
		contact: { customerName: order.customerName, email: order.email, phone: order.phone },
		notes: order.notes,
		deliveryWindow: order.deliveryWindow,
		total: order.total,
	};
}

function canonicalJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
	if (isRecord(value)) {
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
			.join(',')}}`;
	}
	return JSON.stringify(value);
}

export async function createOrderPayloadFingerprint(
	order: ValidatedCustomOrder,
	referenceImages: VerifiedReferenceImage[],
	providerContext: CheckoutProviderContext,
	providerRequest: SquareProviderRequestContract,
): Promise<string> {
	const normalizedPayload = {
		providerContext,
		providerRequest,
		checkoutAttemptId: order.checkoutAttemptId,
		orderReference: order.orderReference,
		productId: order.product.id,
		customization: order.customization,
		upgradeIds: order.upgrades.map(({ id }) => id).sort(),
		galleryReferenceId: order.galleryReferenceId ?? null,
		referenceImages: referenceImages
			.map(({ sourceKey, key, name, contentType }) => ({ sourceKey, key, name, contentType }))
			.sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0)),
		contact: {
			customerName: order.customerName,
			email: order.email,
			phone: order.phone,
		},
		notes: order.notes,
		total: order.total,
	};
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(canonicalJson(normalizedPayload)),
	);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function completeOrderManifest(
	manifest: PendingCustomOrderManifest,
	checkoutUrl: string,
): CompletedCustomOrderManifest {
	return { ...manifest, checkoutState: 'completed', checkoutUrl };
}

export function renewOrderManifest(
	manifest: PendingCustomOrderManifest,
	leaseExpiresAt: number,
): PendingCustomOrderManifest {
	return { ...manifest, leaseExpiresAt };
}

export function failOrderManifest(manifest: PendingCustomOrderManifest): FailedCustomOrderManifest {
	return {
		version: manifest.version,
		checkoutState: 'failed',
		payloadFingerprint: manifest.payloadFingerprint,
		providerContext: { ...manifest.providerContext },
		checkoutAttemptId: manifest.checkoutAttemptId,
	};
}

export function sanitizePaymentNoteValue(value: string): string {
	return removeDangerousControls(value).replace(/\|/gu, '/');
}

export function truncateByCodePoint(value: string, maximum: number): string {
	return Array.from(value).slice(0, Math.max(0, maximum)).join('');
}

export function makePaymentNote(order: ValidatedCustomOrder, privateRecordUrl: string): string {
	const mandatorySegments = [
		`Order: ${sanitizePaymentNoteValue(order.orderReference)}`,
		order.galleryReferenceId ? `Inspiration: ${sanitizePaymentNoteValue(order.galleryReferenceId)}` : '',
		`Private record: ${sanitizePaymentNoteValue(privateRecordUrl)}`,
	].filter(Boolean);
	const mandatory = mandatorySegments.join(' | ');
	const mandatoryLength = Array.from(mandatory).length;
	if (mandatoryLength > MAX_PAYMENT_NOTE_LENGTH) {
		throw new CheckoutValidationError('The private order reference is too long for Square checkout.');
	}

	const summary = sanitizePaymentNoteValue(`Item: ${order.product.name} | Total: $${order.total}`);
	const availableSummaryLength = MAX_PAYMENT_NOTE_LENGTH - mandatoryLength - 3;
	if (availableSummaryLength <= 0) return mandatory;
	const truncatedSummary = truncateByCodePoint(summary, availableSummaryLength);
	return truncatedSummary ? `${mandatory} | ${truncatedSummary}` : mandatory;
}
