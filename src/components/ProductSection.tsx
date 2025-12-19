import ProductCard from './ProductCard';

const products = [
	{
		title: 'Wallets',
		description: 'Handcrafted leather wallets with timeless western style and durability.',
		iconImage: '/wallet.png',
	},
	{
		title: 'Belts',
		description: 'Premium leather belts tooled and crafted for lasting quality.',
		iconImage: '/belt.png',
	},
	{
		title: 'Purses',
		description: 'Elegant leather purses combining function with western charm.',
		iconImage: '/purse.jpeg',
	},
	{
		title: 'Welding Gear',
		description: 'Heavy-duty leather gear built to protect and endure.',
		iconImage: '/Pancake-black.png',
	},
	{
		title: 'Bible Covers',
		description: 'Beautiful custom leather Bible covers crafted with care.',
		iconImage: '/Book-cover.png',
	},
];

export default function ProductSection() {
	return (
		<section id="products" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-12 md:mb-16">
					<h2 className="heading-western text-glow text-4xl sm:text-5xl md:text-6xl text-cream mb-4">
						Our Products
					</h2>
					<p className="body-western text-xl md:text-2xl text-beige max-w-3xl mx-auto">
						Each piece crafted with authentic western tradition and quality leather
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
