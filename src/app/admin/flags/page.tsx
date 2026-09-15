/**
 * Admin flags dashboard page.
 * Shows current state of all feature flags.
 * Protected by Cloudflare Access (same as /admin/ugc).
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FlagsDashboard } from '@/components/admin/FlagsDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — Feature Flags | Twisted Custom Leather',
	description: 'View and manage feature flag states.',
};

export default function FlagsAdminPage() {
	return (
		<div className="relative min-h-screen">
			<div className="absolute inset-0 bg-wood-dark" />
			<Header />
			<main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
				<div className="max-w-4xl mx-auto">
					<div className="mb-8">
						<h1 className="text-3xl md:text-4xl font-bold text-cream mb-2">
							Feature Flags
						</h1>
						<p className="text-beige">
							Current state of all feature toggles. Managed through Cloudflare Flagship.
							This page is protected by Cloudflare Access.
						</p>
					</div>
					<FlagsDashboard />
				</div>
			</main>
			<Footer />
		</div>
	);
}
