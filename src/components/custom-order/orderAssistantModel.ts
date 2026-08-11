import {
	checkoutProducts,
	type CheckoutProduct,
	type CustomizationFieldKey,
	type CustomizationValues,
	type PaidUpgrade,
	type ProductCategory,
} from '../../data/checkout-products';

export type {
	CheckoutProduct,
	CustomizationFieldKey,
	CustomizationValues,
	PaidUpgrade,
	ProductCategory,
};

export const HELP_ME = 'I need help deciding';

export interface CustomizationFieldDefinition {
	key: CustomizationFieldKey;
	label: string;
	control: 'text' | 'textarea' | 'select';
	options?: readonly string[];
	helperText?: string;
}

export type CustomizationErrors = Partial<Record<CustomizationFieldKey | '_form', string>>;

const textFieldHelper = 'Enter “I need help deciding” if you would like Randy’s guidance.';
const selectOptions = (...options: string[]) => Object.freeze([...options, HELP_ME]);

const text = (key: CustomizationFieldKey, label: string): CustomizationFieldDefinition => ({
	key,
	label,
	control: 'text',
	helperText: textFieldHelper,
});

const textarea = (key: CustomizationFieldKey, label: string): CustomizationFieldDefinition => ({
	key,
	label,
	control: 'textarea',
	helperText: textFieldHelper,
});

const select = (key: CustomizationFieldKey, label: string, options: readonly string[]): CustomizationFieldDefinition => ({
	key,
	label,
	control: 'select',
	options,
});

export const customizationFieldDefinitions: Record<CustomizationFieldKey, CustomizationFieldDefinition> = Object.freeze({
	walletStyle: select('walletStyle', 'Wallet style or layout', selectOptions('Roper', 'Bifold', 'Trifold', 'Clutch', 'Biker', 'Slim')),
	primaryColor: text('primaryColor', 'Primary leather color'),
	secondaryColor: text('secondaryColor', 'Secondary leather color'),
	leatherMaterial: text('leatherMaterial', 'Leather material'),
	toolingDesign: textarea('toolingDesign', 'Tooling design'),
	pantsSize: text('pantsSize', 'Pants size'),
	beltSizing: select('beltSizing', 'How will you measure?', selectOptions('Existing belt', 'Body measurement')),
	foldHole: text('foldHole', 'Fold to most-used hole'),
	beltWidth: select('beltWidth', 'Belt width', selectOptions('1 inch', '1.25 inches', '1.5 inches', '1.75 inches')),
	buckle: select('buckle', 'Buckle', selectOptions('Use my buckle', 'Include a buckle')),
	coverDimensions: text('coverDimensions', 'Cover dimensions'),
	bookType: select('bookType', 'Book type', selectOptions('Bible', 'Book', 'Planner', 'Legal pad')),
	closure: select('closure', 'Closure', selectOptions('None', 'Snap', 'Zipper')),
	gearType: {
		key: 'gearType',
		label: 'Welding gear (set automatically from the selected piece)',
		control: 'text',
		helperText: 'Automatically set from the selected piece.',
	},
	fitNotes: textarea('fitNotes', 'Fit notes'),
	specialFinish: textarea('specialFinish', 'Special finish'),
	strapLength: text('strapLength', 'Strap length'),
	strapWidth: text('strapWidth', 'Strap width'),
	attachment: select('attachment', 'Attachment', selectOptions('Standard guitar strap buttons', 'Acoustic headstock tie')),
	hardware: text('hardware', 'Hardware'),
	bagDimensions: text('bagDimensions', 'Bag dimensions'),
	carryStyle: select('carryStyle', 'Carry style', selectOptions('Handheld', 'Shoulder', 'Crossbody')),
	pockets: textarea('pockets', 'Pockets'),
});

export function getCheckoutProduct(id: string): CheckoutProduct | undefined {
	return checkoutProducts.find((product) => product.id === id);
}

export function getVisibleFields(id: string): CustomizationFieldKey[] {
	return [...(getCheckoutProduct(id)?.fieldKeys ?? [])];
}

export function getDefaultCustomization(productId: string): CustomizationValues {
	const product = getCheckoutProduct(productId);
	return product?.category === 'welding' ? { gearType: product.name } : {};
}

export function validateCustomization(productId: string, values: CustomizationValues): CustomizationErrors {
	const product = getCheckoutProduct(productId);

	if (!product) {
		return { _form: 'Choose a valid custom piece.' };
	}

	if (Object.keys(values).some((key) => !product.fieldKeys.includes(key as CustomizationFieldKey))) {
		return { _form: 'Remove options that do not apply to this piece.' };
	}

	if (product.category === 'welding' && values.gearType !== product.name) {
		return { gearType: 'This field is set automatically for the selected piece.' };
	}

	const errors = product.fieldKeys.reduce<CustomizationErrors>((fieldErrors, key) => {
		const definition = customizationFieldDefinitions[key];
		const value = values[key];
		if (
			definition.control === 'select'
			&& typeof value === 'string'
			&& value.trim()
			&& !definition.options?.includes(value)
		) {
			fieldErrors[key] = 'Choose one of the available options.';
		}
		return fieldErrors;
	}, {});

	return product.requiredFieldKeys.reduce<CustomizationErrors>((requiredErrors, key) => {
		const value = values[key];

		if (typeof value !== 'string' || value.trim().length === 0) {
			requiredErrors[key] = 'Please complete this field or choose “I need help deciding”.';
		}

		return requiredErrors;
	}, errors);
}

export function calculateOrderTotal(productId: string, upgradeIds: string[]): number {
	const product = getCheckoutProduct(productId);

	if (!product) {
		throw new Error(`Unknown custom order product: ${productId}`);
	}

	const selectedUpgradeIds = new Set<string>();
	if (new Set(upgradeIds).size !== upgradeIds.length) throw new Error('Upgrade selections must not contain duplicates.');
	const exoticUpgradeIds = upgradeIds.filter((upgradeId) => EXOTIC_HIDE_IDS.has(upgradeId as PaidUpgrade['id']));
	if (exoticUpgradeIds.length > 1) throw new Error('Choose at most one exotic hide.');
	const upgrades = upgradeIds.map((upgradeId) => {
		if (selectedUpgradeIds.has(upgradeId)) {
			throw new Error(`Upgrade ${upgradeId} is a duplicate.`);
		}

		selectedUpgradeIds.add(upgradeId);
		const upgrade = product.upgrades.find((candidate) => candidate.id === upgradeId);

		if (!upgrade) {
			throw new Error(`Upgrade ${upgradeId} is not available for ${product.name}.`);
		}

		return upgrade;
	});

	return upgrades.reduce((total, upgrade) => total + upgrade.amount, product.amount);
}

const EXOTIC_HIDE_IDS = new Set<PaidUpgrade['id']>(['stingray', 'gator', 'ostrich']);

export function applyUpgradeSelection(
	current: PaidUpgrade['id'][],
	upgradeId: PaidUpgrade['id'],
	selected: boolean,
): PaidUpgrade['id'][] {
	if (!selected) return current.filter((id) => id !== upgradeId);
	const withoutSelection = current.filter((id) => id !== upgradeId);
	return EXOTIC_HIDE_IDS.has(upgradeId)
		? [...withoutSelection.filter((id) => !EXOTIC_HIDE_IDS.has(id)), upgradeId]
		: [...withoutSelection, upgradeId];
}

export interface SwitchableOrderDraft {
	productId: string;
	customization: CustomizationValues;
	upgradeIds: PaidUpgrade['id'][];
	referenceId?: string;
}

export function switchProductDraft(current: SwitchableOrderDraft, productId: string): SwitchableOrderDraft {
	const nextProduct = getCheckoutProduct(productId);
	if (!nextProduct || current.productId === productId) return current;
	const preserved = Object.fromEntries(
		Object.entries(current.customization).filter(([key, value]) => (
			nextProduct.fieldKeys.includes(key as CustomizationFieldKey)
			&& typeof value === 'string'
			&& value.length <= 2000
			&& (
				customizationFieldDefinitions[key as CustomizationFieldKey].control !== 'select'
				|| customizationFieldDefinitions[key as CustomizationFieldKey].options?.includes(value)
			)
		)),
	) as CustomizationValues;
	return {
		productId,
		customization: { ...preserved, ...getDefaultCustomization(productId) },
		upgradeIds: current.upgradeIds.filter((upgradeId) => nextProduct.upgrades.some(({ id }) => id === upgradeId as PaidUpgrade['id'])),
	};
}

const formatUtcDate = (date: Date): string => new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC',
}).format(date);

export function calculateDeliveryWindow(now: Date): string {
	const earliest = new Date(now.getTime());
	const latest = new Date(now.getTime());
	earliest.setUTCDate(earliest.getUTCDate() + 42);
	latest.setUTCDate(latest.getUTCDate() + 56);

	return `${formatUtcDate(earliest)} – ${formatUtcDate(latest)}`;
}
