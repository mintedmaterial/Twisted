import Image from 'next/image';

const armPadPhoto = 'data:image/jpeg;base64,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';

const featuredWork = [
	{
		src: 'https://lh3.googleusercontent.com/pw/AP1GczPM9XIkZnxqrfQIgXv7yF7vDC2g4VhSlAPzsXu_YRmwUiVRtEaZefpRKuxp7sj9KUbOoM771elbKB6RksdC5m4byxM_F5RZ3MOTjDQd3JbJ8D-SKLfRvmq7V17KVa1ySQMOqysjcTpJKXtCSVxsSnjrcg7oUh2RKSPr4BqAMfVrQPoQXK2pnOZhVF8q6FehjpAYQdDa5yUAtQjle3u9pi3sKgMtD0gwAlu89y2E_knZ78SvhjbTfFIzFTPwIwY8_Uei1QTQSNUsuisv94ZCl4pcwiT7Iv33P8KTlEnqW1wlxL2-pE2UXIIj-GvEBrdnTLLClZc5gG5uaoL9eyMk_SR9z3PsVbQ2jxNHZlG3k_GyuE97qDhn-tlauUakG6cNircphT_-w03oykcqboYHycuycXbZCQ3ORUSuiG2ybkDuZdvX1x-j7Hvhr6Z1U_17U5OyzQRj2rO7zE1aG7wkF_TLy-5d-Jkc5zuhqp7f7KSKt6wthQ7p-CxqMVMDqWi37W7miZ5NzSTdTKfjWMW4lp8GxIGsIHsgDP4OL6G6hJn9ZtWoGXSTbTGXvybZseB43PI3GcuVwXbFVF2VXqwt388IpBQfZSshT7nr5WsWaVBh90_P1_t_QVqILTivcGeoWtiJOblNMfj0qm3hV_YVNA5HGfW4E-nQAq1L2lTvyJjYYEXZWecpw2cBlE0EAyYuSwuZyXzdgffpJ-KQcFfmDeZJpz-Ef2AKlEyEqP5z_E-R2NwxuUd5EyEthyV8M7h164mbmLARRXdA05jhjQN1M9gjhzAGMfKAimpO79PEJL8bowuvuP64B2NGfZLSF2mFm22tL0MiHsK8Hdh-aSw9Z4xlT3YhdAhVBvRF1X6R4GGYZ9vrrqSwH2pbzqWfWfS5TIMm91JWNCZ3XCFxCkORhGY7n2k0-d9YXjH-DmvTuXBYXaTo9Wqn6JIo3UjdBK845de09Ixwio7is9YA2ObjZeVwI6wZuI4exUcHqS_yU0bwnIYj-w=w401-h301-no',
		alt: 'Custom tooled leather portfolio cover with floral tooling and a name panel',
		title: 'Portfolios',
		category: 'Portfolios',
		span: '',
		width: 401,
		height: 301,
		href: 'https://photos.app.goo.gl/GpcrR32WbqrkSV4L7',
	},
	{
		src: '/featured-work/custom-leather-wallet-denim.svg',
		alt: 'Custom tooled leather wallet on denim',
		title: 'Wallet Set',
		category: 'Wallets',
		span: '',
		width: 181,
		height: 159,
		position: 'center center',
		href: 'https://photos.google.com/share/AF1QipOsNxODm1-e7A7G3G6ZEPn-cshXXMuZRXZXyykPdt4nqefNbiUnD5bRCaW32J-fsg?key=RFJLS0hBckVXTmpubFdBU0xGbzNjSWFiXzR2VnVn',
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
		src: armPadPhoto,
		alt: 'Custom tooled leather welding arm pad set',
		title: 'Custom Pipeline Arm Guard',
		category: 'Welding Gear',
		span: '',
		width: 220,
		height: 165,
		href: 'https://photos.google.com/share/AF1QipPzOOqKXTMznO6pcbD_tzOVFen160_3j2S1ndp848nNXufyX3sKbKXxPNT_lbFSwA?key=QWpuY19GY1BIWWg0bndnZnFRdmY1bmZNME40RDl3',
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
		src: '/purse.jpeg',
		alt: 'Brown custom leather fringe purse',
		title: 'Leather Fringe Purse',
		category: 'Purses',
		span: '',
		width: 1536,
		height: 2048,
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
						const isPlainImage = item.src.startsWith('http') || item.src.startsWith('data:');
						const imageClassName = "absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105";
						const card = (
							<article
								className={`group relative overflow-hidden rounded-lg border border-copper/30 bg-wood-dark/60 min-h-[18rem] ${item.span}`}
							>
								{isPlainImage ? (
									<img
										src={item.src}
										alt={item.alt}
										className={imageClassName}
										style={{ objectPosition: item.position ?? 'center' }}
									/>
								) : (
									<Image
										src={item.src}
										alt={item.alt}
										width={item.width}
										height={item.height}
										className={imageClassName}
										style={{ objectPosition: item.position ?? 'center' }}
										sizes={item.span ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
									/>
								)}
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
