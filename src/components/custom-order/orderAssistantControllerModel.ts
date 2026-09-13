import type { CustomizationValues, PaidUpgrade } from './orderAssistantModel';

export interface ErrorSummaryEntry {
	id: string;
	message: string;
}

export type ReviewErrors = Partial<Record<
	'customerName' | 'email' | 'phone' | 'notes' | 'acknowledgedStartingPrice' | '_form',
	string
>>;

export interface CustomerReviewInput {
	customerName: string;
	email: string;
	phone: string;
	notes: string;
	acknowledgedStartingPrice: boolean;
}

export function validateCustomerReview(input: CustomerReviewInput): ReviewErrors {
	const errors: ReviewErrors = {};
	if (!input.customerName.trim()) errors.customerName = 'Enter your name.';
	else if (input.customerName.length > 100) errors.customerName = 'Your name must be 100 characters or fewer.';
	if (!input.email.trim() || !/^\S+@\S+\.\S+$/.test(input.email)) errors.email = 'Enter a valid email address.';
	else if (input.email.length > 254) errors.email = 'Your email must be 254 characters or fewer.';
	if (input.phone.length > 40) errors.phone = 'Your phone number must be 40 characters or fewer.';
	if (input.notes.length > 300) errors.notes = 'Your notes must be 300 characters or fewer.';
	if (!input.acknowledgedStartingPrice) errors.acknowledgedStartingPrice = 'Confirm that you understand the starting price.';
	return errors;
}

export interface UploadedReferenceInput {
	name: string;
	url: string;
	contentType: string;
}

export interface CheckoutPayloadInput {
	checkoutAttemptId: string;
	productId: string;
	customization: CustomizationValues;
	upgradeIds: PaidUpgrade['id'][];
	referenceId?: string;
	referenceImages: UploadedReferenceInput[];
	customerName: string;
	email: string;
	phone: string;
	notes: string;
	acknowledgedStartingPrice: boolean;
}

export function clearErrors<ErrorKey extends string>(
	errors: Partial<Record<ErrorKey, string>>,
	keys: readonly ErrorKey[],
): Partial<Record<ErrorKey, string>> {
	const next = { ...errors };
	keys.forEach((key) => delete next[key]);
	return next;
}

export function getActiveErrorEntries<ErrorKey extends string>(
	errors: Partial<Record<ErrorKey, string>>,
	idForKey: (key: ErrorKey) => string,
	generalError = '',
): ErrorSummaryEntry[] {
	const entries = Object.entries(errors).flatMap(([key, message]) => (
		typeof message === 'string' && message.trim()
			? [{ id: idForKey(key as ErrorKey), message }]
			: []
	));

	return typeof generalError === 'string' && generalError.trim()
		? [...entries, { id: 'review-form', message: generalError }]
		: entries;
}

export function buildCheckoutPayload(input: CheckoutPayloadInput): CheckoutPayloadInput {
	return {
		checkoutAttemptId: input.checkoutAttemptId,
		productId: input.productId,
		customization: { ...input.customization },
		upgradeIds: [...input.upgradeIds],
		referenceId: input.referenceId,
		referenceImages: input.referenceImages.map(({ name, url, contentType }) => ({ name, url, contentType })),
		customerName: input.customerName,
		email: input.email,
		phone: input.phone,
		notes: input.notes,
		acknowledgedStartingPrice: input.acknowledgedStartingPrice,
	};
}
