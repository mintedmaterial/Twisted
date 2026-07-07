import Image from 'next/image';

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
		src: 'data:image/jpeg;base64,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',
		alt: 'Custom tooled leather welding arm pad set',
		title: 'Custom Pipeline Arm Guard',
		category: 'Welding Gear',
		span: '',
		width: 360,
		height: 270,
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
