'use client';

import { useState, useEffect } from 'react';
import NewsletterSignup from './NewsletterSignup';

export default function PromoPopup() {
	const [isOpen, setIsOpen] = useState(false);
	const [hasInteracted, setHasInteracted] = useState(false);

	useEffect(() => {
		// Check if user has already dismissed the popup
		const dismissed = localStorage.getItem('promo-popup-dismissed');
		const subscribed = localStorage.getItem('newsletter-subscribed');

		if (!dismissed && !subscribed) {
			// Show popup after 3 seconds
			const timer = setTimeout(() => {
				setIsOpen(true);
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, []);

	const handleClose = () => {
		setIsOpen(false);
		if (!hasInteracted) {
			localStorage.setItem('promo-popup-dismissed', 'true');
			// Track dismissal in database
			fetch('/api/popup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'dismissed' })
			});
		}
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Overlay */}
			<div
				className="fixed inset-0 bg-black/70 z-50 transition-opacity"
				onClick={handleClose}
			/>

			{/* Popup */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
				<div
					className="relative w-full max-w-2xl bg-wood-dark border-4 border-copper rounded-lg shadow-2xl pointer-events-auto overflow-hidden"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Close button */}
					<button
						onClick={handleClose}
						className="absolute top-4 right-4 text-cream hover:text-copper transition-colors z-10"
						aria-label="Close popup"
					>
						<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					{/* Content */}
					<div className="p-8 sm:p-12 text-center">
						{/* Logo or Brand Image */}
						<div className="mb-6">
							<img
								src="/twisted.png"
								alt="Twisted Custom Leather"
								className="w-32 h-auto mx-auto"
							/>
						</div>

						{/* Heading */}
						<h2 className="heading-western text-4xl sm:text-5xl text-copper mb-4">
							UNLOCK $20 OFF
						</h2>
						<h3 className="heading-western text-2xl sm:text-3xl text-cream mb-6">
							YOUR 1ST ORDER!
						</h3>

						{/* Description */}
						<p className="text-beige text-lg mb-8">
							To claim it, let us know who you&apos;re shopping for!
						</p>

						{/* Newsletter Signup */}
						<div className="mb-6">
							<NewsletterSignup
								source="popup"
								className="max-w-md mx-auto"
							/>
						</div>

						{/* Terms */}
						<p className="text-sage text-sm">
							VALID ON ORDERS $100+
						</p>

						{/* No Thanks Link */}
						<button
							onClick={handleClose}
							className="mt-6 text-beige/70 hover:text-beige underline text-sm transition-colors"
						>
							No Thanks, I Like Paying Full Price
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
