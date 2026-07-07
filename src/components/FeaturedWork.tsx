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
		src: '/featured-work/custom-pipeline-arm-pad.svg',
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
						const isExternalImage = item.src.startsWith('http');
						const imageClassName = "absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105";
						const card = (
							<article
								className={`group relative overflow-hidden rounded-lg border border-copper/30 bg-wood-dark/60 min-h-[18rem] ${item.span}`}
							>
								{isExternalImage ? (
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
