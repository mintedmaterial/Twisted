import type { ChangeEvent } from 'react';
import type { CustomizationErrors, CustomizationFieldDefinition, CustomizationValues, PaidUpgrade } from './orderAssistantModel';
import { customizationFieldDefinitions, getCheckoutProduct, getVisibleFields } from './orderAssistantModel';
import ReferenceImageUpload from './ReferenceImageUpload';
import type { ReferenceImageUploadState } from './referenceImageUploadModel';

interface CustomizationStepProps {
	productId: string;
	values: CustomizationValues;
	upgradeIds: PaidUpgrade['id'][];
	errors: CustomizationErrors;
	onValueChange: (key: keyof CustomizationValues, value: string) => void;
	onUpgradeChange: (upgradeId: PaidUpgrade['id'], selected: boolean) => void;
	referenceImageUploadState: ReferenceImageUploadState;
	onReferenceFilesSelected: (files: File[]) => void;
	onReferenceRetry: (id: string) => void;
	onReferenceFailedRemove: (id: string) => void;
	onReferenceUploadedRemove: (url: string) => void;
	disabled?: boolean;
}

function FieldControl({ definition, value, onChange, error, helperId, required }: {
	definition: CustomizationFieldDefinition;
	value: string;
	onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
	error?: string;
	helperId?: string;
	required: boolean;
}) {
	const id = `customization-${definition.key}`;
	const errorId = `customization-${definition.key}-error`;
	const describedBy = [helperId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined;
	const className = 'mt-1 min-h-11 w-full rounded-lg border border-copper/30 bg-charcoal/70 px-3 py-2 text-cream focus:outline-none focus:border-copper';
	if (definition.control === 'textarea') {
		return <textarea id={id} value={value} onChange={onChange} rows={4} maxLength={2000} className={className} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} />;
	}

	if (definition.control === 'select') {
		return (
			<select id={id} value={value} onChange={onChange} className={className} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy}>
				<option value="">Select an option</option>
				{definition.options?.map((option) => <option key={option} value={option}>{option}</option>)}
			</select>
		);
	}

	return <input id={id} value={value} onChange={onChange} readOnly={definition.key === 'gearType'} maxLength={2000} className={className} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} />;
}

export default function CustomizationStep({
	productId,
	values,
	upgradeIds,
	errors,
	onValueChange,
	onUpgradeChange,
	referenceImageUploadState,
	onReferenceFilesSelected,
	onReferenceRetry,
	onReferenceFailedRemove,
	onReferenceUploadedRemove,
	disabled,
}: CustomizationStepProps) {
	const product = getCheckoutProduct(productId);
	const fields = getVisibleFields(productId);

	if (!product) return null;

	return (
		<div id="customization-form" className="space-y-7">
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				{fields.map((key) => {
					const definition = customizationFieldDefinitions[key];
					const error = errors[key];
					const helperId = definition.helperText ? `customization-${key}-help` : undefined;
					const required = product.requiredFieldKeys.includes(key);

					return (
						<div key={key} className={definition.control === 'textarea' ? 'sm:col-span-2' : ''}>
							<label htmlFor={`customization-${key}`} className="font-bold text-cream">{definition.label}{required ? ' *' : ''}</label>
							{definition.helperText && <p id={helperId} className="mt-1 text-sm text-beige">{definition.helperText}</p>}
							<FieldControl
								definition={definition}
								value={values[key] ?? ''}
								onChange={(event) => onValueChange(key, event.target.value)}
								error={error}
								helperId={helperId}
								required={required}
							/>
							<p className="mt-1 text-right text-xs text-beige">{(values[key] ?? '').length}/2000</p>
							{error && <p id={`customization-${key}-error`} className="mt-1 text-sm text-red-300">{error}</p>}
						</div>
					);
				})}
			</div>

			{product.upgrades.length > 0 && (
				<fieldset className="rounded-lg border border-copper/20 bg-charcoal/40 p-4">
					<legend className="px-1 font-bold text-cream">Available upgrades</legend>
					<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
						{product.upgrades.filter((upgrade) => !['stingray', 'gator', 'ostrich'].includes(upgrade.id)).map((upgrade) => (
							<label key={upgrade.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-copper/30 px-3 py-2 text-beige">
								<input
									type="checkbox"
									checked={upgradeIds.includes(upgrade.id)}
									onChange={(event) => onUpgradeChange(upgrade.id, event.target.checked)}
								/>
								<span>{upgrade.label} (+${upgrade.amount})</span>
							</label>
						))}
						{product.upgrades.some((upgrade) => ['stingray', 'gator', 'ostrich'].includes(upgrade.id)) && (
							<fieldset className="sm:col-span-2 rounded-lg border border-copper/20 p-3">
								<legend className="px-1 font-bold text-cream">Exotic hide</legend>
								<label className="mr-5 inline-flex min-h-11 items-center gap-2"><input type="radio" name="exotic-hide" checked={!upgradeIds.some((id) => ['stingray', 'gator', 'ostrich'].includes(id))} onChange={() => upgradeIds.filter((id) => ['stingray', 'gator', 'ostrich'].includes(id)).forEach((id) => onUpgradeChange(id, false))} />None</label>
								{product.upgrades.filter((upgrade) => ['stingray', 'gator', 'ostrich'].includes(upgrade.id)).map((upgrade) => <label key={upgrade.id} className="mr-5 inline-flex min-h-11 items-center gap-2"><input type="radio" name="exotic-hide" checked={upgradeIds.includes(upgrade.id)} onChange={() => onUpgradeChange(upgrade.id, true)} />{upgrade.label} (+${upgrade.amount})</label>)}
							</fieldset>
						)}
					</div>
				</fieldset>
			)}

			<ReferenceImageUpload
				state={referenceImageUploadState}
				disabled={disabled}
				onFilesSelected={onReferenceFilesSelected}
				onRetry={onReferenceRetry}
				onRemoveFailed={onReferenceFailedRemove}
				onRemoveUploaded={onReferenceUploadedRemove}
			/>
		</div>
	);
}
