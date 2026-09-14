import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { UgcUploadForm } from '@/components/ugc/UgcUploadForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Show Us Your Twisted Gear | Twisted Custom Leather',
	description:
		'Submit a photo or video of your Twisted gear in action. If we publish it, earn up to $25 in store credit.',
};

export default function SubmitGearPage() {
	return (
		<div className="relative min-h-screen">
			<div className="absolute inset-0 bg-wood-dark" />
			<Header />
			<main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
				<div className="max-w-3xl mx-auto">
					<div className="text-center mb-10">
						<h1 className="text-4xl md:text-5xl font-bold text-cream mb-4">
							Show us your Twisted gear
						</h1>
						<p className="text-lg text-beige max-w-2xl mx-auto">
							Send us a quick photo or short video of your gear in the wild. If we publish it,
							you will earn store credit — and we will tag you when it goes live.
						</p>
					</div>

					<div className="rounded-2xl border border-copper/30 bg-cream/5 backdrop-blur-sm p-6 md:p-10 shadow-xl">
						<div className="mb-8 pb-6 border-b border-copper/20">
							<h2 className="text-xl font-bold text-cream mb-3">What we are looking for</h2>
							<ul className="space-y-2 text-beige text-sm">
								<li>The product clearly visible and in real use</li>
								<li>Decent lighting, vertical video for clips</li>
								<li>Faces or people only if they are okay being featured</li>
							</ul>
							<p className="mt-4 text-copper font-medium text-sm">
								Usable videos earn $25 credit. Usable photos earn $10 credit. Credit is issued only
								if we publish your submission.
							</p>
						</div>

						<UgcUploadForm />
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
