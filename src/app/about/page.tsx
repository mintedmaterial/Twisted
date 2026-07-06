import AboutHero from '@/components/about/AboutHero';
import StorySection from '@/components/about/StorySection';
import ReviewsWidget from '@/components/about/ReviewsWidget';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata = {
	title: 'About Randy and Twisted Custom Leather',
	description: 'Meet Randy and the story behind Twisted Custom Leather in Valliant, Oklahoma. Handmade wallets, belts, welding gear, guitar straps, and western leather goods built to last.',
	keywords: ['about twisted custom leather', 'Randy leather craftsman', 'handmade leather Oklahoma', 'valliant oklahoma', 'custom leather goods', 'lifetime guarantee'],
	alternates: {
		canonical: '/about',
	},
	openGraph: {
		title: 'About Randy and Twisted Custom Leather',
		description: 'A locally owned Oklahoma leather shop creating handmade western leather goods with premium materials and real-life durability.',
		url: '/about',
		images: [{ url: '/Randy.jpg', width: 1200, height: 630, alt: 'Randy of Twisted Custom Leather' }],
	},
};

export default function AboutPage() {
	return (
		<div className="relative min-h-screen">
			<div className="fixed inset-0 -z-10 overflow-hidden">
				<video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
					<source src="/background.mp4" type="video/mp4" />
				</video>
				<div className="absolute inset-0 bg-black/60" />
			</div>

			<main>
				<AboutHero />
				<StorySection />
				<ReviewsWidget />

				<section className="px-4 sm:px-6 lg:px-8 py-16">
					<div className="max-w-3xl mx-auto">
						<div className="glass card-glow rounded-lg p-8 sm:p-12 text-center">
							<h2 className="heading-western text-3xl sm:text-4xl text-copper mb-4">
								Stay Connected
							</h2>
							<p className="text-beige mb-6">
								Subscribe to get special offers, new product launches, and behind-the-scenes
								updates from our workshop.
							</p>
							<NewsletterSignup source="about-page" className="max-w-md mx-auto" />
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
