import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Campaign Paused | Twisted Custom Leather',
	description: 'The Show Us Your Twisted Gear campaign is currently paused.',
};

export default function CampaignPausedPage() {
	return (
		<div className="relative min-h-screen">
			<div className="absolute inset-0 bg-wood-dark" />
			<Header />
			<main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
				<div className="max-w-2xl mx-auto text-center">
					<h1 className="text-4xl md:text-5xl font-bold text-cream mb-4">
						Campaign Paused
					</h1>
					<p className="text-lg text-beige max-w-xl mx-auto">
						We are not accepting new submissions for the Show Us Your Twisted Gear
						campaign right now. Check back soon or follow us on Facebook for updates.
					</p>
					<a
						href="https://www.facebook.com/twistedcustomleather"
						className="inline-block mt-6 px-6 py-3 rounded-lg bg-copper text-cream font-medium hover:bg-copper/80 transition-colors"
					>
						Follow on Facebook
					</a>
				</div>
			</main>
			<Footer />
		</div>
	);
}
