'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { checkoutProducts } from '@/data/checkout-products';
import { getGalleryOrderReference } from '@/data/gallery-order-references';
import type { CustomizationErrors, CustomizationValues, PaidUpgrade } from './orderAssistantModel';
import { applyUpgradeSelection, calculateDeliveryWindow, calculateOrderTotal, getCheckoutProduct, getDefaultCustomization, switchProductDraft, validateCustomization } from './orderAssistantModel';
import { buildCheckoutPayload, clearErrors, getActiveErrorEntries, validateCustomerReview, type ReviewErrors } from './orderAssistantControllerModel';
import { loadOrderDraft, resolveReactiveOrderNavigation, saveOrderDraft, shouldPersistOrderDraft, storePendingOrderReference } from './orderDraftStorage';
import CustomOrderFaq from './CustomOrderFaq';
import CustomizationStep from './CustomizationStep';
import OrderTrustPanel from './OrderTrustPanel';
import OrderProgress, { type OrderStep } from './OrderProgress';
import OrderInspirationCard from './OrderInspirationCard';
import OrderReviewStep from './OrderReviewStep';
import ProductSelectionStep from './ProductSelectionStep';
import TurnstileWidget from './TurnstileWidget';
import {
	completeReferenceImageUpload,
	createReferenceImageUploadState,
	expireReferenceImageSession,
	failReferenceImageUpload,
	getReferenceImageBrowserValidationError,
	removeFailedReference,
	removeUploadedReference,
	retryReferenceImageUpload,
	setReferenceImageUploadStatus,
	startReferenceImageUpload,
	type PendingReferenceImage,
} from './referenceImageUploadModel';

export type { UploadedReference } from './referenceImageUploadModel';

export interface CustomOrderDraft {
	productId: string;
	customization: CustomizationValues;
	upgradeIds: PaidUpgrade['id'][];
	referenceId?: string;
}

type Step = OrderStep;
interface ErrorSummaryProps {
	errors: Array<{ id: string; message: string }>;
	summaryRef: React.RefObject<HTMLDivElement | null>;
}

function ErrorSummary({ errors, summaryRef }: ErrorSummaryProps) {
	if (!errors.length) return null;

	return (
		<div ref={summaryRef} tabIndex={-1} role="alert" className="mb-6 rounded-lg border border-red-300/60 bg-red-950/30 p-4 text-red-100">
			<p className="font-bold">Please fix the following before continuing:</p>
			<ul className="mt-2 list-disc space-y-1 pl-5">
				{errors.map((error) => (
					<li key={`${error.id}-${error.message}`}><a href={`#${error.id}`} className="underline">{error.message}</a></li>
				))}
			</ul>
		</div>
	);
}

const initialProduct = checkoutProducts[0];

const customizationErrorId = (key: string) => key === '_form' ? 'customization-form' : `customization-${key}`;
const reviewErrorId = (key: string) => key === 'customerName'
	? 'customer-name'
	: key === 'acknowledgedStartingPrice'
		? 'starting-price-acknowledgement'
		: key === '_form'
			? 'review-form'
			: key === 'phone'
				? 'customer-phone'
				: key === 'notes'
					? 'order-notes'
					: 'customer-email';

export default function CustomOrderAssistant() {
	const searchParams = useSearchParams();
	const queryProductId = searchParams.get('product');
	const queryReferenceId = searchParams.get('reference');
	const [step, setStep] = useState<Step>(1);
	const [draft, setDraft] = useState<CustomOrderDraft>({
		productId: initialProduct.id,
		customization: getDefaultCustomization(initialProduct.id),
		upgradeIds: [],
	});
	const [customizationErrors, setCustomizationErrors] = useState<CustomizationErrors>({});
	const [reviewErrors, setReviewErrors] = useState<ReviewErrors>({});
	const [customerName, setCustomerName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [notes, setNotes] = useState('');
	const [acknowledgedStartingPrice, setAcknowledgedStartingPrice] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const checkoutSubmissionInFlight = useRef(false);
	const checkoutAttemptIdRef = useRef<string | undefined>(undefined);
	const submissionRevisionRef = useRef(0);
	const [turnstileToken, setTurnstileToken] = useState('');
	const [turnstileResetNonce, setTurnstileResetNonce] = useState(0);
	const [orderIntent, setOrderIntent] = useState<{ token: string; expiresAt: string } | null>(null);
	const [referenceImageUploadState, setReferenceImageUploadState] = useState(createReferenceImageUploadState);
	const referenceImageUploadInFlight = useRef(false);
	const referenceImageSessionRevisionRef = useRef(0);
	const [checkoutError, setCheckoutError] = useState('');
	const errorSummaryRef = useRef<HTMLDivElement>(null);
	const stepHeadingRef = useRef<HTMLHeadingElement>(null);
	const previousStepRef = useRef<Step>(step);
	const [isDraftHydrated, setIsDraftHydrated] = useState(false);
	const [isDraftDirty, setIsDraftDirty] = useState(false);
	const didLoadDraft = useRef(false);

	const product = getCheckoutProduct(draft.productId) ?? initialProduct;
	const inspiration = draft.referenceId
		? getGalleryOrderReference(draft.productId, draft.referenceId)
		: undefined;
	const total = useMemo(() => calculateOrderTotal(product.id, draft.upgradeIds), [product.id, draft.upgradeIds]);
	const deliveryWindow = useMemo(() => calculateDeliveryWindow(new Date()), []);
	const activeErrors = step === 2
		? getActiveErrorEntries(customizationErrors, customizationErrorId)
		: step === 3
			? getActiveErrorEntries(reviewErrors, reviewErrorId, checkoutError)
			: [];

	useEffect(() => {
		if (previousStepRef.current === step) return;
		previousStepRef.current = step;
		requestAnimationFrame(() => stepHeadingRef.current?.focus());
	}, [step]);

	useEffect(() => {
		const currentDraft = didLoadDraft.current ? draft : loadOrderDraft() ?? draft;
		const navigation = resolveReactiveOrderNavigation(currentDraft, window.location.href);
		if (!didLoadDraft.current) {
			didLoadDraft.current = true;
			setDraft(navigation?.draft ?? currentDraft);
			setIsDraftHydrated(true);
		}
		if (navigation) {
			setDraft(navigation.draft);
			saveOrderDraft(navigation.draft);
			setIsDraftDirty(false);
			window.history.replaceState(
				window.history.state,
				'',
				navigation.replacementUrl,
			);
			if (navigation.draft.productId === 'bible-cover') {
				requestAnimationFrame(() => {
					document.getElementById('custom-order')?.scrollIntoView({ behavior: 'smooth' });
					stepHeadingRef.current?.focus();
				});
			}
		}
	// Query values make the assistant respond when a Next Link changes this page in place.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryProductId, queryReferenceId]);

	useEffect(() => {
		if (!shouldPersistOrderDraft(isDraftHydrated, isDraftDirty)) return;
		saveOrderDraft(draft);
		setIsDraftDirty(false);
	}, [draft, isDraftDirty, isDraftHydrated]);

	function focusErrors() {
		requestAnimationFrame(() => errorSummaryRef.current?.focus());
	}

	function invalidateCheckoutAttempt() {
		if (checkoutSubmissionInFlight.current) return;
		checkoutAttemptIdRef.current = undefined;
		submissionRevisionRef.current += 1;
	}

	function resetTurnstile() {
		referenceImageSessionRevisionRef.current += 1;
		setTurnstileToken('');
		setOrderIntent(null);
		setTurnstileResetNonce((current) => current + 1);
		setReferenceImageUploadState((current) => expireReferenceImageSession(current));
		invalidateCheckoutAttempt();
	}

	async function ensureOrderIntent(): Promise<{ token: string; expiresAt: string }> {
		if (orderIntent && Date.parse(orderIntent.expiresAt) > Date.now() + 5_000) return orderIntent;
		if (orderIntent) {
			resetTurnstile();
			throw new Error('Your verification expired. Complete the challenge again.');
		}
		if (!turnstileToken) throw new Error('Complete the verification challenge before continuing.');
		const response = await fetch('/api/order-intent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token: turnstileToken }),
		});
		const data = await response.json() as { orderIntentToken?: unknown; expiresAt?: unknown; error?: unknown };
		if (!response.ok || typeof data.orderIntentToken !== 'string' || typeof data.expiresAt !== 'string') {
			resetTurnstile();
			throw new Error(typeof data.error === 'string' ? data.error : 'Verification failed. Reset the challenge and try again.');
		}
		const created = { token: data.orderIntentToken, expiresAt: data.expiresAt };
		setOrderIntent(created);
		setTurnstileToken('');
		return created;
	}

	function selectProduct(productId: string) {
		if (checkoutSubmissionInFlight.current) return;
		const nextProduct = getCheckoutProduct(productId);
		if (!nextProduct) return;

		setDraft((current) => {
			if (current.productId === productId) return current;
			setIsDraftDirty(true);
			return switchProductDraft(current, productId);
		});
		setCustomizationErrors({});
		setCheckoutError('');
		invalidateCheckoutAttempt();
	}

	function changeCustomization(key: keyof CustomizationValues, value: string) {
		if (checkoutSubmissionInFlight.current) return;
		setDraft((current) => {
			if (current.customization[key] === value) return current;
			setIsDraftDirty(true);
			return { ...current, customization: { ...current.customization, [key]: value } };
		});
		setCustomizationErrors((current) => clearErrors(current, [key, '_form']));
		setCheckoutError('');
		invalidateCheckoutAttempt();
	}

	function changeUpgrade(upgradeId: PaidUpgrade['id'], selected: boolean) {
		if (checkoutSubmissionInFlight.current) return;
		setDraft((current) => {
			const isSelected = current.upgradeIds.includes(upgradeId);
			if (isSelected === selected) return current;
			setIsDraftDirty(true);
			return {
				...current,
				upgradeIds: applyUpgradeSelection(current.upgradeIds, upgradeId, selected),
			};
		});
		setCheckoutError('');
		invalidateCheckoutAttempt();
	}

	function removeInspiration() {
		if (checkoutSubmissionInFlight.current) return;
		setDraft((current) => {
			if (!current.referenceId) return current;
			setIsDraftDirty(true);
			return { ...current, referenceId: undefined };
		});
		setCheckoutError('');
		invalidateCheckoutAttempt();
	}

	function continueToCustomization() {
		if (checkoutSubmissionInFlight.current) return;
		setCheckoutError('');
		setStep(2);
	}

	function continueToReview() {
		if (checkoutSubmissionInFlight.current) return;
		if (referenceImageUploadState.pending.length > 0) return;
		const errors = validateCustomization(draft.productId, draft.customization);
		setCustomizationErrors(errors);
		if (Object.keys(errors).length) {
			focusErrors();
			return;
		}
		setStep(3);
	}


	async function uploadReferenceImages(entries: PendingReferenceImage[], nextState: ReturnType<typeof startReferenceImageUpload>['state']) {
		if (referenceImageUploadInFlight.current || checkoutSubmissionInFlight.current) return;
		referenceImageUploadInFlight.current = true;
		const sessionRevision = referenceImageSessionRevisionRef.current;
		const ids = entries.map((entry) => entry.id);
		setReferenceImageUploadState(nextState);
		const formData = new FormData();
		for (const entry of entries) formData.append('files', entry.file as File);

		try {
			const orderIntent = await ensureOrderIntent();
			if (referenceImageSessionRevisionRef.current !== sessionRevision) return;
			const response = await fetch('/api/order-assets', { method: 'POST', headers: { Authorization: `Bearer ${orderIntent.token}` }, body: formData });
			const data = await response.json() as { error?: unknown; files?: unknown };
			if (referenceImageSessionRevisionRef.current !== sessionRevision) return;
			if (!response.ok) {
				if (response.status === 401 || response.status === 403) {
					resetTurnstile();
					return;
				}
				const message = typeof data.error === 'string' && data.error.trim()
					? data.error
					: 'Unable to upload reference images right now.';
				setReferenceImageUploadState((current) => failReferenceImageUpload(current, ids, message));
				return;
			}
			setReferenceImageUploadState((current) => completeReferenceImageUpload(current, ids, data.files));
		} catch (error) {
			setReferenceImageUploadState((current) => failReferenceImageUpload(current, ids, error instanceof Error ? error.message : 'Unable to upload reference images right now.'));
		} finally {
			referenceImageUploadInFlight.current = false;
		}
	}

	function selectReferenceFiles(files: File[]) {
		if (referenceImageUploadInFlight.current || checkoutSubmissionInFlight.current) return;
		const validationError = getReferenceImageBrowserValidationError(referenceImageUploadState, files);
		if (validationError) {
			setReferenceImageUploadState((current) => setReferenceImageUploadStatus(current, validationError));
			return;
		}
		const start = startReferenceImageUpload(referenceImageUploadState, files.map((file) => ({ id: crypto.randomUUID(), file })));
		if (start.started) {
			invalidateCheckoutAttempt();
			void uploadReferenceImages(start.entries, start.state);
		}
	}

	function retryReferenceImage(id: string) {
		if (referenceImageUploadInFlight.current || checkoutSubmissionInFlight.current) return;
		const start = retryReferenceImageUpload(referenceImageUploadState, id);
		if (start.started) {
			invalidateCheckoutAttempt();
			void uploadReferenceImages(start.entries, start.state);
		}
	}

	async function removeUploadedReferenceImage(url: string) {
		if (referenceImageUploadInFlight.current || checkoutSubmissionInFlight.current) return;
		try {
			const orderIntent = await ensureOrderIntent();
			const response = await fetch('/api/order-assets', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orderIntent.token}` },
				body: JSON.stringify({ url }),
			});
			if (!response.ok) {
				if (response.status === 401 || response.status === 403) resetTurnstile();
				throw new Error('Unable to remove the reference image right now.');
			}
			invalidateCheckoutAttempt();
			setReferenceImageUploadState((current) => removeUploadedReference(current, url));
		} catch (error) {
			setReferenceImageUploadState((current) => setReferenceImageUploadStatus(current, error instanceof Error ? error.message : 'Unable to remove the reference image right now.'));
		}
	}

	function selectStep(nextStep: Step) {
		if (checkoutSubmissionInFlight.current) return;
		if (nextStep === 2) {
			continueToCustomization();
			return;
		}
		if (nextStep === 3) {
			if (step === 1) {
				setStep(2);
				return;
			}
			continueToReview();
			return;
		}
		setCheckoutError('');
		setStep(1);
	}

	function changeCustomerName(value: string) {
		if (checkoutSubmissionInFlight.current) return;
		setCustomerName(value);
		setReviewErrors((current) => clearErrors(current, ['customerName', '_form']));
		setCheckoutError('');
		invalidateCheckoutAttempt();
	}

	function changeEmail(value: string) {
		if (checkoutSubmissionInFlight.current) return;
		setEmail(value);
		setReviewErrors((current) => clearErrors(current, ['email', '_form']));
		setCheckoutError('');
		invalidateCheckoutAttempt();
	}

	function changePhone(value: string) {
		if (checkoutSubmissionInFlight.current) return;
		setPhone(value);
		setReviewErrors((current) => clearErrors(current, ['phone', '_form']));
		setCheckoutError('');
		invalidateCheckoutAttempt();
	}

	function changeNotes(value: string) {
		if (checkoutSubmissionInFlight.current) return;
		setNotes(value);
		setReviewErrors((current) => clearErrors(current, ['notes', '_form']));
		setCheckoutError('');
		invalidateCheckoutAttempt();
	}

	function changeAcknowledgement(value: boolean) {
		if (checkoutSubmissionInFlight.current) return;
		setAcknowledgedStartingPrice(value);
		setReviewErrors((current) => clearErrors(current, ['acknowledgedStartingPrice', '_form']));
		setCheckoutError('');
		invalidateCheckoutAttempt();
	}

	async function submitOrder(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (checkoutSubmissionInFlight.current) return;
		setCheckoutError('');
		const errors = validateCustomerReview({ customerName, email, phone, notes, acknowledgedStartingPrice });
		setReviewErrors(errors);
		if (Object.keys(errors).length) {
			focusErrors();
			return;
		}

		checkoutSubmissionInFlight.current = true;
		setIsSubmitting(true);
		const checkoutAttemptId = checkoutAttemptIdRef.current ?? crypto.randomUUID();
		checkoutAttemptIdRef.current = checkoutAttemptId;
		const submissionRevision = ++submissionRevisionRef.current;
		let redirectStarted = false;
		try {
			const orderIntent = await ensureOrderIntent();
			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orderIntent.token}` },
				body: JSON.stringify(buildCheckoutPayload({
					checkoutAttemptId,
					productId: draft.productId,
					customization: draft.customization,
					upgradeIds: draft.upgradeIds,
					referenceId: draft.referenceId,
					referenceImages: referenceImageUploadState.uploaded.map(({ name, url, contentType }) => ({ name, url, contentType })),
					customerName,
					email,
					phone,
					notes,
					acknowledgedStartingPrice,
				})),
			});
			const data = await response.json() as { checkoutUrl?: string; orderReference?: string; error?: string };
			if (checkoutAttemptIdRef.current !== checkoutAttemptId || submissionRevisionRef.current !== submissionRevision) return;
			if (!response.ok || !data.checkoutUrl || !data.orderReference) {
				if (response.status === 401 || response.status === 403) resetTurnstile();
				throw new Error(data.error || 'Checkout could not be started.');
			}
			storePendingOrderReference(data.orderReference);
			redirectStarted = true;
			window.location.assign(data.checkoutUrl);
		} catch (error) {
			if (checkoutAttemptIdRef.current !== checkoutAttemptId || submissionRevisionRef.current !== submissionRevision) return;
			setCheckoutError(error instanceof Error ? error.message : 'Checkout could not be started.');
			focusErrors();
		} finally {
			if (!redirectStarted && checkoutAttemptIdRef.current === checkoutAttemptId && submissionRevisionRef.current === submissionRevision) {
				setIsSubmitting(false);
				checkoutSubmissionInFlight.current = false;
			}
		}
	}

	return (
		<section id="custom-order" className="px-4 py-16 sm:px-6 md:py-24 lg:px-8">
			<div className="mx-auto max-w-5xl">
				<div className="mb-10 text-center">
					<p className="mb-4 text-sm uppercase tracking-[0.35em] text-copper">Secure Square Checkout</p>
					<h2 className="heading-western text-glow text-4xl text-cream sm:text-5xl">Start A Custom Order</h2>
					<p className="mx-auto mt-4 max-w-3xl text-lg text-beige">Choose one handmade piece, share the details, then continue safely to Square.</p>
				</div>

				<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
					<div className="glass card-glow rounded-lg border border-copper/30 p-4 sm:p-6">
						<OrderProgress step={step} onStepSelect={selectStep} disabled={isSubmitting} />
						<form id="review-form" noValidate onSubmit={submitOrder} className="mt-8">
						<fieldset disabled={isSubmitting} className="min-w-0 border-0 p-0">
						<ErrorSummary errors={activeErrors} summaryRef={errorSummaryRef} />
						<h3 ref={stepHeadingRef} tabIndex={-1} className="heading-western mb-5 text-3xl text-cream">
							{step === 1 ? 'Choose your piece' : step === 2 ? 'Customize it' : 'Review and pay'}
						</h3>
						<div className="mb-6">
							<TurnstileWidget
								siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
								resetNonce={turnstileResetNonce}
								disabled={isSubmitting}
								onToken={setTurnstileToken}
								onExpired={resetTurnstile}
								onError={resetTurnstile}
							/>
						</div>
						{inspiration && step !== 3 && <OrderInspirationCard reference={inspiration} onRemove={removeInspiration} />}

						{step === 1 && (
							<>
								<ProductSelectionStep selectedProductId={draft.productId} onSelect={selectProduct} />
								<button type="button" onClick={continueToCustomization} className="mt-7 min-h-11 w-full rounded-lg bg-copper px-5 py-3 font-bold text-charcoal hover:bg-cream">Continue to customization</button>
							</>
						)}

						{step === 2 && (
							<>
								<CustomizationStep disabled={isSubmitting} productId={draft.productId} values={draft.customization} upgradeIds={draft.upgradeIds} errors={customizationErrors} onValueChange={changeCustomization} onUpgradeChange={changeUpgrade} referenceImageUploadState={referenceImageUploadState} onReferenceFilesSelected={selectReferenceFiles} onReferenceRetry={retryReferenceImage} onReferenceFailedRemove={(id) => { if (checkoutSubmissionInFlight.current) return; invalidateCheckoutAttempt(); setReferenceImageUploadState((current) => removeFailedReference(current, id)); }} onReferenceUploadedRemove={(url) => { void removeUploadedReferenceImage(url); }} />
								<div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
									<button type="button" onClick={() => setStep(1)} className="min-h-11 rounded-lg border border-copper/50 px-5 py-3 font-bold text-cream hover:bg-copper/20">Back to pieces</button>
									<button type="button" disabled={referenceImageUploadState.pending.length > 0} onClick={continueToReview} className="min-h-11 rounded-lg bg-copper px-5 py-3 font-bold text-charcoal hover:bg-cream disabled:cursor-wait disabled:opacity-60">Continue to review</button>
								</div>
							</>
						)}

						{step === 3 && <OrderReviewStep product={product} customization={draft.customization} upgrades={product.upgrades.filter((upgrade) => draft.upgradeIds.includes(upgrade.id))} referenceImages={referenceImageUploadState.uploaded} inspiration={inspiration} total={total} deliveryWindow={deliveryWindow} customerName={customerName} email={email} phone={phone} notes={notes} acknowledgedStartingPrice={acknowledgedStartingPrice} errors={reviewErrors} isSubmitting={isSubmitting} onCustomerNameChange={changeCustomerName} onEmailChange={changeEmail} onPhoneChange={changePhone} onNotesChange={changeNotes} onAcknowledgedChange={changeAcknowledgement} onInspirationRemove={removeInspiration} onBack={continueToCustomization} />}
						</fieldset>
						</form>
					</div>
					<div className="space-y-6">
						<OrderTrustPanel />
						<CustomOrderFaq />
					</div>
				</div>
			</div>
		</section>
	);
}
