import NewsletterSignup from './NewsletterSignup';

export default function NewsletterSection() {
	return (
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
					<NewsletterSignup source="home-page" className="max-w-md mx-auto" />
				</div>
			</div>
		</section>
	);
}
