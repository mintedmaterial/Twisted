import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { UgcStatusPortal } from '@/components/ugc/UgcStatusPortal';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
	title: 'My Submissions | Twisted Custom Leather',
	description: 'Check the status of your Twisted Gear submissions and store credit.',
};

export default function MySubmissionsPage() {
	return (
		<div className="relative min-h-screen">
			<div className="absolute inset-0 bg-wood-dark" />
			<Header />
			<main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
				<div className="max-w-3xl mx-auto">
					<div className="text-center mb-10">
						<h1 className="text-4xl md:text-5xl font-bold text-cream mb-4">My submissions</h1>
						<p className="text-lg text-beige">
							Check the status of your Show Us Your Twisted Gear submissions and store credit.
						</p>
					</div>
					<div className="rounded-2xl border border-copper/30 bg-cream/5 backdrop-blur-sm p-6 md:p-10 shadow-xl">
						<Suspense fallback={<div className="text-cream text-center py-8">Loading status portal...</div>}>
							<UgcStatusPortal />
						</Suspense>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
