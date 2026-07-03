import ProductCard from './ProductCard';

const products = [
	{
		title: 'Wallets',
		description: 'Handcrafted wallets, ropers, clutches, and card holders built to be carried every day.',
		iconImage: '/wallet-icon.png',
	},
	{
		title: 'Belts',
		description: 'Premium leather belts cut, tooled, and fitted for long-lasting western quality.',
		iconImage: '/belt-icon.png',
	},
	{
		title: 'Purses',
		description: 'Leather purses and bags with practical layouts, custom details, and western charm.',
		iconImage: '/purse-icon.png',
	},
	{
		title: 'Welding Gear',
		description: 'Heavy-duty leather gear built to protect and endure.',
		iconImage: '/Pancake-black.png',
	},
	{
		title: 'Bible Covers',
		description: 'Beautiful custom leather Bible covers crafted with care.',
		iconImage: '/bible-icon.png',
	},
	{
		title: 'Misc',
		description: 'Guitar straps, sheaths, gifts, and specialty pieces made around your idea.',
		iconImage: '/misc-icon.png',
	},
];

export default function ProductSection() {
	return (
		<section id="products" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-12 md:mb-16">
					<h2 className="heading-western text-glow text-4xl sm:text-5xl md:text-6xl text-cream mb-4">
						What We Make
					</h2>
					<p className="body-western text-xl md:text-2xl text-beige max-w-3xl mx-auto">
						Choose a starting point, then tell us the leather, tooling, and details you have in mind.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
					{products.map((product) => (
						<ProductCard
							key={product.title}
							title={product.title}
							description={product.description}
							iconImage={product.iconImage}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
