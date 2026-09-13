export type ProductCategory = 'wallet' | 'belt' | 'cover' | 'welding' | 'guitar-strap' | 'purse';

export type CustomizationFieldKey =
	| 'walletStyle' | 'primaryColor' | 'secondaryColor' | 'leatherMaterial' | 'toolingDesign'
	| 'pantsSize' | 'beltSizing' | 'foldHole' | 'beltWidth' | 'buckle'
	| 'coverDimensions' | 'bookType' | 'closure'
	| 'gearType' | 'fitNotes' | 'specialFinish'
	| 'strapLength' | 'strapWidth' | 'attachment' | 'hardware'
	| 'bagDimensions' | 'carryStyle' | 'pockets';

export interface PaidUpgrade {
	id: 'stingray' | 'gator' | 'ostrich' | 'lace-stitching';
	label: string;
	amount: number;
}

export interface CheckoutProduct {
	id: string;
	name: string;
	description: string;
	amount: number;
	category: ProductCategory;
	fieldKeys: CustomizationFieldKey[];
	requiredFieldKeys: CustomizationFieldKey[];
	upgrades: PaidUpgrade[];
}

export type CustomizationValues = Partial<Record<CustomizationFieldKey, string>>;

const freezeArray = <Value>(values: Value[]): Value[] => Object.freeze(values) as unknown as Value[];
const paidUpgrade = (upgrade: PaidUpgrade): PaidUpgrade => Object.freeze(upgrade) as PaidUpgrade;

const exoticUpgrades = freezeArray<PaidUpgrade>([
	paidUpgrade({ id: 'stingray', label: 'Stingray exotic hide', amount: 100 }),
	paidUpgrade({ id: 'gator', label: 'Gator exotic hide', amount: 50 }),
	paidUpgrade({ id: 'ostrich', label: 'Ostrich exotic hide', amount: 50 }),
	paidUpgrade({ id: 'lace-stitching', label: 'Lace / stitching', amount: 25 }),
]);

const laceStitchingUpgrade = freezeArray<PaidUpgrade>([
	paidUpgrade({ id: 'lace-stitching', label: 'Lace / stitching', amount: 25 }),
]);

const walletFields = freezeArray<CustomizationFieldKey>([
	'walletStyle', 'primaryColor', 'secondaryColor', 'leatherMaterial', 'toolingDesign',
]);
const walletRequiredFields = freezeArray<CustomizationFieldKey>([
	'walletStyle', 'primaryColor', 'leatherMaterial', 'toolingDesign',
]);
const beltFields = freezeArray<CustomizationFieldKey>([
	'pantsSize', 'beltSizing', 'foldHole', 'beltWidth', 'buckle', 'primaryColor', 'toolingDesign',
]);
const beltRequiredFields = freezeArray<CustomizationFieldKey>([
	'pantsSize', 'beltSizing', 'foldHole', 'beltWidth', 'buckle',
]);
const coverFields = freezeArray<CustomizationFieldKey>([
	'coverDimensions', 'bookType', 'closure', 'primaryColor', 'toolingDesign',
]);
const coverRequiredFields = freezeArray<CustomizationFieldKey>(['coverDimensions', 'bookType', 'closure']);
const weldingFields = freezeArray<CustomizationFieldKey>([
	'gearType', 'fitNotes', 'specialFinish', 'primaryColor', 'toolingDesign',
]);
const weldingRequiredFields = freezeArray<CustomizationFieldKey>(['gearType', 'fitNotes']);
const guitarStrapFields = freezeArray<CustomizationFieldKey>([
	'strapLength', 'strapWidth', 'attachment', 'hardware', 'primaryColor', 'toolingDesign',
]);
const guitarStrapRequiredFields = freezeArray<CustomizationFieldKey>(['strapLength', 'strapWidth', 'attachment']);
const purseFields = freezeArray<CustomizationFieldKey>([
	'bagDimensions', 'carryStyle', 'pockets', 'strapLength', 'hardware', 'primaryColor', 'secondaryColor', 'leatherMaterial', 'toolingDesign',
]);
const purseRequiredFields = freezeArray<CustomizationFieldKey>(['bagDimensions', 'carryStyle', 'pockets']);

const product = (details: CheckoutProduct): CheckoutProduct => Object.freeze(details) as CheckoutProduct;

export const checkoutProducts: CheckoutProduct[] = freezeArray([
	product({
		id: 'custom-wallet',
		name: 'Custom Wallet',
		description: 'Starting price for a handmade leather wallet. Heavy tooling, exotic leather, or unusual layouts may require a quote.',
		amount: 140,
		category: 'wallet',
		fieldKeys: walletFields,
		requiredFieldKeys: walletRequiredFields,
		upgrades: exoticUpgrades,
	}),
	product({
		id: 'tooled-wallet',
		name: 'Tooled Wallet',
		description: 'Starting price for a tooled wallet with more custom detail and western character.',
		amount: 200,
		category: 'wallet',
		fieldKeys: walletFields,
		requiredFieldKeys: walletRequiredFields,
		upgrades: exoticUpgrades,
	}),
	product({
		id: 'custom-belt',
		name: 'Custom Belt',
		description: 'Starting price for a handmade custom belt with fit and leather details confirmed after checkout.',
		amount: 180,
		category: 'belt',
		fieldKeys: beltFields,
		requiredFieldKeys: beltRequiredFields,
		upgrades: exoticUpgrades,
	}),
	product({
		id: 'floral-tooled-belt',
		name: 'Floral Tooled Belt',
		description: 'Starting price for a floral tooled western belt. Complex patterns or premium materials may require a quote.',
		amount: 360,
		category: 'belt',
		fieldKeys: beltFields,
		requiredFieldKeys: beltRequiredFields,
		upgrades: exoticUpgrades,
	}),
	product({
		id: 'bible-cover',
		name: 'Bible Or Book Cover',
		description: 'Starting price for a custom Bible, book, planner, or legal pad cover.',
		amount: 220,
		category: 'cover',
		fieldKeys: coverFields,
		requiredFieldKeys: coverRequiredFields,
		upgrades: exoticUpgrades,
	}),
	product({
		id: 'welding-armguard',
		name: 'Armguard',
		description: 'Starting price for a custom leather armguard built for real welding work.',
		amount: 280,
		category: 'welding',
		fieldKeys: weldingFields,
		requiredFieldKeys: weldingRequiredFields,
		upgrades: laceStitchingUpgrade,
	}),
	product({
		id: 'welding-hood',
		name: 'Welding Hood',
		description: 'Starting price for a custom leather welding hood with fit and details confirmed after checkout.',
		amount: 280,
		category: 'welding',
		fieldKeys: weldingFields,
		requiredFieldKeys: weldingRequiredFields,
		upgrades: laceStitchingUpgrade,
	}),
	product({
		id: 'welding-knee-pads',
		name: 'Knee Pads',
		description: 'Starting price for custom leather welding knee pads built for durability and comfort.',
		amount: 280,
		category: 'welding',
		fieldKeys: weldingFields,
		requiredFieldKeys: weldingRequiredFields,
		upgrades: laceStitchingUpgrade,
	}),
	product({
		id: 'guitar-strap',
		name: 'Guitar Strap',
		description: 'Starting price for a handmade leather guitar strap with custom design details.',
		amount: 240,
		category: 'guitar-strap',
		fieldKeys: guitarStrapFields,
		requiredFieldKeys: guitarStrapRequiredFields,
		upgrades: laceStitchingUpgrade,
	}),
	product({
		id: 'custom-purse',
		name: 'Custom Purse Or Bag',
		description: 'Starting price for a custom purse or bag. Larger, exotic, or heavily tooled bags are quote-only.',
		amount: 400,
		category: 'purse',
		fieldKeys: purseFields,
		requiredFieldKeys: purseRequiredFields,
		upgrades: exoticUpgrades,
	}),
]);
