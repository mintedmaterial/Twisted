import type { CheckoutProduct, CustomizationValues, PaidUpgrade } from './orderAssistantModel';
import { customizationFieldDefinitions } from './orderAssistantModel';
import type { UploadedReference } from './referenceImageUploadModel';
import type { GalleryOrderReference } from '@/data/gallery-order-references';
import OrderInspirationCard from './OrderInspirationCard';
import type { ReviewErrors } from './orderAssistantControllerModel';

export const STARTING_PRICE_ACKNOWLEDGEMENT = 'I understand that I am paying the full starting price for this custom piece. Twisted Custom Leather will confirm the design and measurements before work begins. Upgrades or changes I approve may require an additional payment.';

interface OrderReviewStepProps {
	product: CheckoutProduct;
	customization: CustomizationValues;
	upgrades: PaidUpgrade[];
	referenceImages: UploadedReference[];
	inspiration?: GalleryOrderReference;
	total: number;
	deliveryWindow: string;
	customerName: string;
	email: string;
	phone: string;
	notes: string;
	acknowledgedStartingPrice: boolean;
	errors: ReviewErrors;
	isSubmitting: boolean;
	onCustomerNameChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onPhoneChange: (value: string) => void;
	onNotesChange: (value: string) => void;
	onAcknowledgedChange: (value: boolean) => void;
	onInspirationRemove: () => void;
	onBack: () => void;
}

export default function OrderReviewStep({
	product,
	customization,
	upgrades,
	referenceImages,
	inspiration,
	total,
	deliveryWindow,
	customerName,
	email,
	phone,
	notes,
	acknowledgedStartingPrice,
	errors,
	isSubmitting,
	onCustomerNameChange,
	onEmailChange,
	onPhoneChange,
	onNotesChange,
	onAcknowledgedChange,
	onInspirationRemove,
	onBack,
}: OrderReviewStepProps) {
	const answers = Object.entries(customization).filter(([, value]) => value?.trim());

	return (
		<div className="space-y-7">
			{inspiration && <OrderInspirationCard reference={inspiration} onRemove={onInspirationRemove} />}

			<div className="rounded-lg border border-copper/20 bg-charcoal/40 p-5">
				<h4 className="heading-western text-2xl text-cream">Your custom piece</h4>
				<div className="mt-3 space-y-2 text-beige">
					<p><span className="font-bold text-cream">{product.name}</span> — starting at ${product.amount}</p>
					{upgrades.map((upgrade) => <p key={upgrade.id}>{upgrade.label} (+${upgrade.amount})</p>)}
					{answers.map(([key, value]) => <p key={key}><span className="font-bold text-cream">{customizationFieldDefinitions[key as keyof CustomizationValues].label}:</span> {value}</p>)}
					<p><span className="font-bold text-cream">Full starting total:</span> ${total}</p>
					<p><span className="font-bold text-cream">Estimated delivery:</span> {deliveryWindow}</p>
				</div>
			</div>

			{referenceImages.length > 0 && (
				<div className="rounded-lg border border-copper/20 bg-charcoal/40 p-5">
					<h4 className="heading-western text-2xl text-cream">Reference images</h4>
					<ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
						{referenceImages.map((reference) => (
							<li key={reference.url} className="overflow-hidden rounded-lg border border-copper/30">
								<img src={reference.url} alt={`Reference image: ${reference.name}`} className="aspect-square w-full object-cover" />
								<p className="truncate px-2 py-1 text-sm text-beige">{reference.name}</p>
							</li>
						))}
					</ul>
				</div>
			)}

			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<div>
					<label htmlFor="customer-name" className="font-bold text-cream">Your name</label>
					<input id="customer-name" value={customerName} onChange={(event) => onCustomerNameChange(event.target.value)} maxLength={100} disabled={isSubmitting} autoComplete="name" aria-required="true" aria-invalid={Boolean(errors.customerName)} aria-describedby={errors.customerName ? 'customer-name-error' : undefined} className="mt-1 min-h-11 w-full rounded-lg border border-copper/30 bg-charcoal/70 px-3 py-2 text-cream focus:outline-none focus:border-copper" />
					{errors.customerName && <p id="customer-name-error" className="mt-1 text-sm text-red-300">{errors.customerName}</p>}
				</div>
				<div>
					<label htmlFor="customer-email" className="font-bold text-cream">Email</label>
					<input id="customer-email" type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} maxLength={254} disabled={isSubmitting} autoComplete="email" aria-required="true" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'customer-email-error' : undefined} className="mt-1 min-h-11 w-full rounded-lg border border-copper/30 bg-charcoal/70 px-3 py-2 text-cream focus:outline-none focus:border-copper" />
					{errors.email && <p id="customer-email-error" className="mt-1 text-sm text-red-300">{errors.email}</p>}
				</div>
				<div>
					<label htmlFor="customer-phone" className="font-bold text-cream">Phone</label>
					<input id="customer-phone" type="tel" value={phone} onChange={(event) => onPhoneChange(event.target.value)} maxLength={40} disabled={isSubmitting} autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'customer-phone-error customer-phone-count' : 'customer-phone-count'} className="mt-1 min-h-11 w-full rounded-lg border border-copper/30 bg-charcoal/70 px-3 py-2 text-cream focus:outline-none focus:border-copper" />
					<div className="mt-1 flex items-start justify-between gap-3 text-sm">
						{errors.phone ? <p id="customer-phone-error" className="text-red-300">{errors.phone}</p> : <span />}
						<p id="customer-phone-count" className="text-xs text-beige">{phone.length}/40</p>
					</div>
				</div>
				<div className="sm:col-span-2">
					<label htmlFor="order-notes" className="font-bold text-cream">Extra notes</label>
					<textarea id="order-notes" value={notes} onChange={(event) => onNotesChange(event.target.value)} maxLength={300} disabled={isSubmitting} rows={4} aria-invalid={Boolean(errors.notes)} aria-describedby={errors.notes ? 'order-notes-error order-notes-count' : 'order-notes-count'} className="mt-1 w-full rounded-lg border border-copper/30 bg-charcoal/70 px-3 py-2 text-cream focus:outline-none focus:border-copper" />
					<div className="mt-1 flex items-start justify-between gap-3 text-sm">
						{errors.notes ? <p id="order-notes-error" className="text-red-300">{errors.notes}</p> : <span />}
						<p id="order-notes-count" className="text-xs text-beige">{notes.length}/300</p>
					</div>
				</div>
			</div>

			<div className="rounded-lg border border-copper/20 bg-charcoal/40 p-4">
				<label htmlFor="starting-price-acknowledgement" className="flex min-h-11 cursor-pointer items-start gap-3 text-beige">
					<input id="starting-price-acknowledgement" type="checkbox" checked={acknowledgedStartingPrice} disabled={isSubmitting} onChange={(event) => onAcknowledgedChange(event.target.checked)} aria-required="true" aria-invalid={Boolean(errors.acknowledgedStartingPrice)} aria-describedby={errors.acknowledgedStartingPrice ? 'starting-price-acknowledgement-error' : undefined} className="mt-1" />
					<span>{STARTING_PRICE_ACKNOWLEDGEMENT}</span>
				</label>
				{errors.acknowledgedStartingPrice && <p id="starting-price-acknowledgement-error" className="mt-1 text-sm text-red-300">{errors.acknowledgedStartingPrice}</p>}
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<button type="button" disabled={isSubmitting} onClick={onBack} className="min-h-11 rounded-lg border border-copper/50 px-5 py-3 font-bold text-cream hover:bg-copper/20">Back to customization</button>
				<button type="submit" disabled={isSubmitting} className="min-h-11 rounded-lg bg-copper px-5 py-3 font-bold text-charcoal hover:bg-cream disabled:cursor-wait disabled:opacity-60">
					{isSubmitting ? 'Opening Square...' : 'Continue To Secure Square Checkout'}
				</button>
			</div>
		</div>
	);
}
