import Image from 'next/image';

const featuredWork = [
	{
		src: '/featured-work/custom-leather-wallet-set.jpg',
		alt: 'Two custom leather portfolios',
		title: 'Portfolios',
		category: 'Portfolios',
		span: '',
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
		span: '',
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
		href: 'https://photos.google.com/share/AF1QipPzOOqKXTMznO6pcbD_tzOVFen160_3j2S1ndp848nNXufyX3sKbKXxPNT_lbFSwA?key=QWpuY19GY1BIWWg0bndnZnFRdmY1bmZNME40RDl3',
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
		src: '/featured-work/custom-tooled-belt-rs-tail.jpg',
		alt: 'Turquoise custom tooled leather belt from the Twisted Custom Leather belts album',
		title: 'Belts Album',
		category: 'Photo Album',
		span: '',
		width: 490,
		height: 368,
		href: 'https://photos.app.goo.gl/LTtAmZFpcWxB893j2',
	},
	{
		src: '/featured-work/custom-leather-floral-purse-lgv.jpg',
		alt: 'Custom tooled leather purse and wallet from Twisted Custom Leather',
		title: 'Tooled Purse & Wallet',
		category: 'Purses',
		span: '',
		width: 419,
		height: 313,
	},
	{
		src: '/featured-work/custom-leather-floral-purse-lgv.jpg',
		alt: 'Custom floral tooled leather laptop bag with initials',
		title: 'Laptop Bag',
		category: 'Bags',
		span: '',
		width: 250,
		height: 335,
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

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
					{featuredWork.map((item) => {
						const card = (
							<article
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
						);

						if (item.href) {
							return (
								<a
									key={item.title}
									href={item.href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`Open ${item.title}`}
								>
									{card}
								</a>
							);
						}

						return (
							<div key={item.title}>
								{card}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
