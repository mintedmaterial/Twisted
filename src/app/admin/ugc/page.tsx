import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { UgcAdminDashboard } from '@/components/ugc/UgcAdminDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — UGC Review | Twisted Custom Leather',
	description: 'Review and approve Show Us Your Twisted Gear submissions.',
};

export default function UgcAdminPage() {
	return (
		<div className="relative min-h-screen">
			<div className="absolute inset-0 bg-wood-dark" />
			<Header />
			<main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
				<div className="max-w-6xl mx-auto">
					<div className="mb-8">
						<h1 className="text-3xl md:text-4xl font-bold text-cream mb-2">
							UGC Campaign Admin
						</h1>
						<p className="text-beige">
							Approve or decline Show Us Your Twisted Gear submissions. This page is protected by
							Cloudflare Access.
						</p>
					</div>
					<UgcAdminDashboard />
				</div>
			</main>
			<Footer />
		</div>
	);
}
