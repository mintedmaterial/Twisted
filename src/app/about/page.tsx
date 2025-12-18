import AboutHero from '@/components/about/AboutHero';
import StorySection from '@/components/about/StorySection';
import SupplierLogos from '@/components/about/SupplierLogos';
import ReviewsWidget from '@/components/about/ReviewsWidget';

export const metadata = {
	title: 'About Us | Twisted Custom Leather',
	description: 'Learn about Twisted Custom Leather - locally owned, handcrafted leather goods with a lifetime guarantee. Quality materials from trusted suppliers.',
	keywords: ['about twisted custom leather', 'handmade leather', 'valliant oklahoma', 'custom leather goods', 'lifetime guarantee']
};

export default function AboutPage() {
	return (
		<div className="relative min-h-screen">
			{/* Video Background (matching homepage) */}
			<div className="fixed inset-0 -z-10 overflow-hidden">
				<video
					autoPlay
					loop
					muted
					playsInline
					className="absolute inset-0 w-full h-full object-cover"
				>
					<source src="/background.mp4" type="video/mp4" />
				</video>
				<div className="absolute inset-0 bg-black/60" />
			</div>

			{/* Page Content */}
			<main>
				{/* Hero Section */}
				<AboutHero />

				{/* Story Section */}
				<StorySection />

				{/* Supplier Logos */}
				<SupplierLogos />

				{/* Reviews Widget */}
				<ReviewsWidget />

				{/* Newsletter CTA (matching Lifetime Leather pattern) */}
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
							<form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
								<input
									type="email"
									placeholder="Enter your email"
									className="flex-1 px-4 py-3 rounded-lg bg-wood-dark/30 border-2 border-wood-light/30 text-cream placeholder-beige/50 focus:border-copper focus:outline-none transition-colors"
									disabled
								/>
								<button
									type="submit"
									className="px-6 py-3 bg-copper/20 border-2 border-copper rounded-lg text-copper font-bold cursor-not-allowed opacity-70 transition-opacity"
									disabled
								>
									Coming Soon
								</button>
							</form>
							<p className="text-sm text-sage mt-4">
								Newsletter signup will be available when our store launches
							</p>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
