import Image from 'next/image';

const featuredWork = [
	{
		src: '/featured-work/custom-leather-wallet-set.jpg',
		alt: 'Two custom leather portfolios',
		title: 'Portfolios',
		category: 'Portfolios',
		span: 'lg:col-span-2',
		width: 400,
		height: 300,
	},
	{
		src: '/featured-work/rooster-floral-bifold-wallet.png',
		alt: 'Front side of a custom floral tooled bifold wallet with rooster artwork',
		title: 'Wallet Set',
		category: 'Wallets',
		span: '',
		width: 700,
		height: 510,
		position: 'center center',
	},
	{
		src: '/featured-work/tooled-leather-cross-purse-set.jpg',
		alt: 'Custom floral tooled leather purse and wallet set',
		title: 'Floral Purse Set',
		category: 'Purses',
		span: 'sm:row-span-2',
		width: 250,
		height: 335,
	},
	{
		src: '/featured-work/custom-pipeline-leather-armguard.jpg',
		alt: 'Custom pipeline leather arm guard with Texas tooling',
		title: 'Custom Pipeline Arm Guard',
		category: 'Welding Gear',
		span: '',
		width: 207,
		height: 278,
	},
	{
		src: '/featured-work/custom-tooled-belt-rs-tail.jpg',
		alt: 'Custom hand-tooled leather belt with initials and floral tooling',
		title: 'Custom Personalized Belts',
		category: 'Belts',
		span: '',
		width: 597,
		height: 403,
	},
	{
		src: '/featured-work/western-leather-belt-buckle.jpg',
		alt: 'Western tooled leather belt with buckle detail',
		title: 'Western Belt Detail',
		category: 'Belts',
		span: '',
		width: 597,
		height: 403,
	},
	{
		src: '/featured-work/turquoise-laced-leather-belt.jpg',
		alt: 'Hand-tooled leather belt with turquoise lacing',
		title: 'Turquoise Laced Belt',
		category: 'Belts',
		span: '',
		width: 597,
		height: 403,
	},
	{
		src: '/featured-work/personalized-tooled-leather-belts.jpg',
		alt: 'Personalized hand-tooled leather belts with names',
		title: 'Name Tooled Belts',
		category: 'Belts',
		span: '',
		width: 597,
		height: 403,
	},
	{
		src: '/featured-work/custom-leather-floral-purse-lgv.jpg',
		alt: 'Custom floral tooled leather laptop bag with initials',
		title: 'Laptop Bag',
		category: 'Bags',
		span: 'lg:col-span-2',
		width: 250,
		height: 335,
	},
	{
		src: '/featured-work/custom-floral-leather-handbag-lgv.jpg',
		alt: 'Custom floral tooled leather handbag with initials',
		title: 'Floral Handbag',
		category: 'Bags',
		span: '',
		width: 250,
		height: 335,
	},
	{
		src: '/featured-work/matching-cross-leather-bags.jpg',
		alt: 'Matching hand-tooled leather bags with cross designs',
		title: 'Matching Cross Bags',
		category: 'Bags',
		span: '',
		width: 250,
		height: 335,
	},
	{
		src: '/featured-work/cross-leather-purse-set.jpg',
		alt: 'Hand-tooled leather purse set with cross designs',
		title: 'Cross Purse Set',
		category: 'Purses',
		span: '',
		width: 250,
		height: 335,
	},
	{
		src: '/featured-work/floral-leather-phone-case.jpg',
		alt: 'Colorful floral tooled leather phone case',
		title: 'Phone Case',
		category: 'Accessories',
		span: '',
		width: 207,
		height: 278,
	},
	{
		src: '/featured-work/custom-leather-watch-band-set.jpg',
		alt: 'Set of custom hand-tooled leather watch bands',
		title: 'Watch Band Set',
		category: 'Accessories',
		span: '',
		width: 207,
		height: 278,
	},
	{
		src: '/featured-work/custom-leather-band-closeup.jpg',
		alt: 'Close-up of custom tooled leather band stitching and tooling',
		title: 'Tooled Band Close-Up',
		category: 'Accessories',
		span: '',
		width: 207,
		height: 278,
	},
	{
		src: '/featured-work/floral-tooled-leather-wallet.jpg',
		alt: 'Hand-tooled floral leather wallet',
		title: 'Floral Tooled Wallet',
		category: 'Wallets',
		span: '',
		width: 700,
		height: 510,
	},
	{
		src: '/featured-work/floral-leather-wallet-front.jpg',
		alt: 'Front of a floral tooled leather wallet',
		title: 'Floral Wallet Front',
		category: 'Wallets',
		span: '',
		width: 700,
		height: 510,
	},
	{
		src: '/featured-work/basketweave-floral-leather-wallet.jpg',
		alt: 'Basketweave and floral tooled leather wallet',
		title: 'Basketweave Wallet',
		category: 'Wallets',
		span: '',
		width: 700,
		height: 510,
	},
	{
		src: '/featured-work/colorful-hand-tooled-leather-wallet.jpg',
		alt: 'Colorful hand-tooled floral leather wallet',
		title: 'Color Floral Wallet',
		category: 'Wallets',
		span: '',
		width: 700,
		height: 510,
	},
	{
		src: '/featured-work/black-leather-bifold-wallet.jpg',
		alt: 'Black leather bifold wallet',
		title: 'Black Bifold',
		category: 'Wallets',
		span: '',
		width: 700,
		height: 510,
	},
	{
		src: '/featured-work/custom-leather-wallet-and-card-holder.jpg',
		alt: 'Custom leather wallet and matching card holder',
		title: 'Wallet & Card Holder',
		category: 'Wallets',
		span: '',
		width: 700,
		height: 510,
	},
	{
		src: '/featured-work/hand-tooled-leather-corner-wallet.jpg',
		alt: 'Close-up corner of a hand-tooled leather wallet',
		title: 'Corner Tooling',
		category: 'Wallets',
		span: '',
		width: 700,
		height: 510,
	},
	{
		src: '/featured-work/tooled-leather-wallet-on-workbench.jpg',
		alt: 'Tooled leather wallet resting on a workbench',
		title: 'Workbench Wallet',
		category: 'Wallets',
		span: '',
		width: 700,
		height: 510,
	},
	{
		src: '/featured-work/custom-tooled-leather-belt-rs.jpg',
		alt: 'Custom hand-tooled leather belt with RS initials',
		title: 'RS Tooled Belt',
		category: 'Belts',
		span: '',
		width: 597,
		height: 403,
	},
	{
		src: '/featured-work/custom-name-tooled-leather-belts.jpg',
		alt: 'Custom leather belts tooled with names',
		title: 'Custom Name Belts',
		category: 'Belts',
		span: '',
		width: 597,
		height: 403,
	},
	{
		src: '/featured-work/custom-tooled-leather-panel.jpg',
		alt: 'Custom hand-tooled leather panel with floral detail',
		title: 'Tooled Panel',
		category: 'Custom Work',
		span: '',
		width: 597,
		height: 403,
	},
	{
		src: '/featured-work/custom-tooled-leather-work-display.jpg',
		alt: 'Display of custom tooled leather pieces and workshop tools',
		title: 'Custom Work Display',
		category: 'Custom Work',
		span: '',
		width: 597,
		height: 403,
	},
	{
		src: '/featured-work/oklahoma-state-tooled-leather-panel.jpg',
		alt: 'Oklahoma State themed tooled leather panel',
		title: 'Oklahoma State Panel',
		category: 'Custom Work',
		span: '',
		width: 597,
		height: 403,
	},
	{
		src: '/featured-work/custom-white-bread-leather-armguard.jpg',
		alt: 'Custom leather welding arm guard with White Bread lettering',
		title: 'White Bread Arm Guard',
		category: 'Welding Gear',
		span: '',
		width: 207,
		height: 278,
	},
];

export default function FeaturedWork() {
	return (
		<section id="featured-work" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 md:mb-14">
					<div className="max-w-3xl">
						<p className="text-copper-light font-bold uppercase mb-3">
							Real pieces, real handwork
						</p>
						<h2 className="heading-western text-glow text-4xl sm:text-5xl md:text-6xl text-cream mb-4">
							Featured Leather Work
						</h2>
						<p className="body-western text-lg md:text-xl text-beige">
							A closer look at custom belts, wallets, bags, and tooled details made by hand in Valliant, Oklahoma.
						</p>
					</div>

					<a
						href="#custom-order"
						className="glass rounded-lg px-6 py-3 text-center font-bold text-cream hover:text-copper-light transition-colors border border-copper/50"
					>
						Start Your Piece
					</a>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[18rem] gap-4 md:gap-5">
					{featuredWork.map((item) => (
						<article
							key={item.src}
							className={`group relative overflow-hidden rounded-lg border border-copper/30 bg-wood-dark/60 min-h-[18rem] ${item.span}`}
						>
							<Image
								src={item.src}
								alt={item.alt}
								width={item.width}
								height={item.height}
								className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
								style={{ objectPosition: item.position ?? 'center' }}
								sizes={item.span ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-wood-dark/80 via-wood-dark/10 to-transparent" />
							<div className="absolute left-4 right-4 bottom-4">
								<p className="text-copper-light text-sm font-bold uppercase">
									{item.category}
								</p>
								<h3 className="heading-western text-2xl text-cream">
									{item.title}
								</h3>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
