import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import GalleryLightbox from '@/components/GalleryLightbox';
import Header from '@/components/Header';
import VideoBackground from '@/components/VideoBackground';
import WalletGallery from '@/components/WalletGallery';
import { galleries, getGallery } from '@/data/galleries';

type GalleryPageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export function generateStaticParams() {
	return galleries.map((gallery) => ({
		slug: gallery.slug,
	}));
}

export async function generateMetadata({ params }: GalleryPageProps) {
	const { slug } = await params;
	const gallery = getGallery(slug);

	if (!gallery) {
		return {};
	}

	return {
		title: `${gallery.title} Gallery`,
		description: gallery.description,
		alternates: {
			canonical: `/gallery/${gallery.slug}`,
		},
		openGraph: {
			title: `${gallery.title} Gallery | Twisted Custom Leather`,
			description: gallery.description,
			url: `/gallery/${gallery.slug}`,
			images: [{ url: gallery.cover, width: 1200, height: 630, alt: `${gallery.title} leatherwork gallery` }],
		},
	};
}

export default async function GalleryPage({ params }: GalleryPageProps) {
	const { slug } = await params;
	const gallery = getGallery(slug);

	if (!gallery) {
		notFound();
	}

	return (
		<div className="relative min-h-screen">
			<VideoBackground />
			<Header />

			<main className="px-4 sm:px-6 lg:px-8 py-14 md:py-20">
				<section className="max-w-7xl mx-auto">
					<Link
						href="/#featured-work"
						className="inline-flex items-center text-copper-light hover:text-cream font-bold mb-8 transition-colors"
					>
						&lt;- Back to featured work
					</Link>

					<div className="grid lg:grid-cols-[1fr_0.72fr] gap-8 lg:gap-12 items-end mb-10 md:mb-14">
						<div>
							<p className="text-copper-light font-bold uppercase mb-3">
								{gallery.eyebrow}
							</p>
							<h1 className="heading-western text-glow text-5xl sm:text-6xl lg:text-7xl text-cream mb-5">
								{gallery.title}
							</h1>
							<p className="body-western text-lg md:text-xl text-beige max-w-3xl">
								{gallery.description}
							</p>
						</div>

						<div className="glass rounded-lg p-5 md:p-6">
							<p className="text-sage text-sm font-bold uppercase mb-2">
								Custom orders
							</p>
							<p className="text-beige text-sm md:text-base mb-5">
								See something close to what you want? Send the idea and we can talk through leather, tooling, fit, and price.
							</p>
							<Link
								href="/#custom-order"
								className="inline-flex items-center justify-center rounded-lg bg-copper px-5 py-3 text-charcoal font-bold hover:bg-cream transition-colors"
							>
								Start a custom order
							</Link>
						</div>
					</div>

					{gallery.images.length > 0 ? (
						gallery.slug === 'wallets' ? (
							<WalletGallery images={gallery.images} />
						) : (
							<GalleryLightbox images={gallery.images} />
						)
					) : (
						<div className="glass rounded-lg border border-copper/30 p-8 md:p-10 text-center">
							<h2 className="heading-western text-3xl text-cream mb-3">
								New photos coming soon
							</h2>
							<p className="text-beige max-w-2xl mx-auto">
								We are refreshing this gallery with newer custom work. For now, start a custom order and tell us what kind of portfolio or cover you have in mind.
							</p>
						</div>
					)}
				</section>
			</main>

			<Footer />
		</div>
	);
}
