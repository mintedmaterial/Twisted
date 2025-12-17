'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
			setMobileMenuOpen(false);
		}
	};

	return (
		<header className="sticky top-0 z-50 glass backdrop-blur-md border-b border-copper/30">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16 md:h-20">
					<div className="flex items-center space-x-3">
						<Image
							src="/twisted.png"
							alt="Twisted Custom Leather Logo"
							width={40}
							height={40}
							className="rounded-full"
						/>
						<h1 className="text-lg md:text-xl font-bold italic text-cream">
							Twisted Custom Leather
						</h1>
					</div>

					<nav className="hidden md:flex items-center space-x-8">
						<button
							onClick={() => scrollToSection('home')}
							className="text-cream hover:text-copper transition-colors font-medium"
						>
							Home
						</button>
						<button
							onClick={() => scrollToSection('products')}
							className="text-cream hover:text-copper transition-colors font-medium"
						>
							Products
						</button>
						<button
							onClick={() => scrollToSection('video')}
							className="text-cream hover:text-copper transition-colors font-medium"
						>
							Our Craft
						</button>
						<button
							onClick={() => scrollToSection('contact')}
							className="text-cream hover:text-copper transition-colors font-medium"
						>
							Contact
						</button>
					</nav>

					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="md:hidden text-cream hover:text-copper transition-colors"
						aria-label="Toggle menu"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							{mobileMenuOpen ? (
								<path d="M6 18L18 6M6 6l12 12" />
							) : (
								<path d="M4 6h16M4 12h16M4 18h16" />
							)}
						</svg>
					</button>
				</div>

				{mobileMenuOpen && (
					<div className="md:hidden pb-4">
						<nav className="flex flex-col space-y-3">
							<button
								onClick={() => scrollToSection('home')}
								className="text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2"
							>
								Home
							</button>
							<button
								onClick={() => scrollToSection('products')}
								className="text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2"
							>
								Products
							</button>
							<button
								onClick={() => scrollToSection('video')}
								className="text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2"
							>
								Our Craft
							</button>
							<button
								onClick={() => scrollToSection('contact')}
								className="text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2"
							>
								Contact
							</button>
						</nav>
					</div>
				)}
			</div>
		</header>
	);
}
