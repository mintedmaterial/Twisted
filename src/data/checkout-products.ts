export interface CheckoutProduct {
	id: string;
	name: string;
	description: string;
	amount: number;
}

export const checkoutProducts: CheckoutProduct[] = [
	{
		id: 'custom-wallet',
		name: 'Custom Wallet',
		description: 'Starting price for a handmade leather wallet. Heavy tooling, exotic leather, or unusual layouts may require a quote.',
		amount: 140
	},
	{
		id: 'tooled-wallet',
		name: 'Tooled Wallet',
		description: 'Starting price for a tooled wallet with more custom detail and western character.',
		amount: 200
	},
	{
		id: 'custom-belt',
		name: 'Custom Belt',
		description: 'Starting price for a handmade custom belt with fit and leather details confirmed after checkout.',
		amount: 180
	},
	{
		id: 'floral-tooled-belt',
		name: 'Floral Tooled Belt',
		description: 'Starting price for a floral tooled western belt. Complex patterns or premium materials may require a quote.',
		amount: 360
	},
	{
		id: 'bible-cover',
		name: 'Bible Or Book Cover',
		description: 'Starting price for a custom Bible, book, planner, or legal pad cover.',
		amount: 220
	},
	{
		id: 'welding-gear',
		name: 'Welding Gear',
		description: 'Starting price for custom leather welding gear built for real use.',
		amount: 280
	},
	{
		id: 'guitar-strap',
		name: 'Guitar Strap',
		description: 'Starting price for a handmade leather guitar strap with custom design details.',
		amount: 240
	},
	{
		id: 'custom-purse',
		name: 'Custom Purse Or Bag',
		description: 'Starting price for a custom purse or bag. Larger, exotic, or heavily tooled bags are quote-only.',
		amount: 400
	}
];
