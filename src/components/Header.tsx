'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
	const [mobileProductsOpen, setMobileProductsOpen] = useState(false);

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

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center space-x-8">
						<Link
							href="/"
							className="text-cream hover:text-copper transition-colors font-medium"
						>
							Home
						</Link>

						{/* Products Dropdown */}
						<div
							className="relative"
							onMouseEnter={() => setProductsDropdownOpen(true)}
							onMouseLeave={() => setProductsDropdownOpen(false)}
						>
							<button
								className="text-cream hover:text-copper transition-colors font-medium flex items-center gap-1"
							>
								Products
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{productsDropdownOpen && (
								<div className="absolute top-full left-0 mt-2 w-56 glass backdrop-blur-md rounded-lg border border-copper/30 py-2 shadow-lg">
									<div className="px-3 py-2">
										<p className="text-xs text-sage uppercase tracking-wide font-bold mb-2">Wallets</p>
										<Link
											href="/products/wallets/slim"
											className="block px-3 py-2 text-cream hover:text-copper hover:bg-copper/10 rounded transition-colors"
										>
											Slim Wallets
										</Link>
										<Link
											href="/products/wallets/bifold-trifold"
											className="block px-3 py-2 text-cream hover:text-copper hover:bg-copper/10 rounded transition-colors"
										>
											Bifold & Trifold
										</Link>
										<Link
											href="/products/wallets/clutch"
											className="block px-3 py-2 text-cream hover:text-copper hover:bg-copper/10 rounded transition-colors"
										>
											Clutch Wallets
										</Link>
										<Link
											href="/products/wallets/roper"
											className="block px-3 py-2 text-cream hover:text-copper hover:bg-copper/10 rounded transition-colors"
										>
											Roper Wallets
										</Link>
									</div>
									<div className="border-t border-copper/30 mt-2 pt-2 px-3">
										<p className="text-xs text-beige/50 px-3 py-1">Coming Soon</p>
										<span className="block px-3 py-2 text-beige/50 cursor-not-allowed">Belts</span>
										<span className="block px-3 py-2 text-beige/50 cursor-not-allowed">Purses</span>
										<span className="block px-3 py-2 text-beige/50 cursor-not-allowed">Welding Gear</span>
										<span className="block px-3 py-2 text-beige/50 cursor-not-allowed">Bible Covers</span>
									</div>
								</div>
							)}
						</div>

						<Link
							href="/about"
							className="text-cream hover:text-copper transition-colors font-medium"
						>
							About
						</Link>
						<button
							onClick={() => scrollToSection('contact')}
							className="text-cream hover:text-copper transition-colors font-medium"
						>
							Contact
						</button>
					</nav>

					{/* Mobile Menu Button */}
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

				{/* Mobile Navigation */}
				{mobileMenuOpen && (
					<div className="md:hidden pb-4">
						<nav className="flex flex-col space-y-3">
							<Link
								href="/"
								onClick={() => setMobileMenuOpen(false)}
								className="text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2"
							>
								Home
							</Link>

							{/* Products with Sub-menu */}
							<div>
								<button
									onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
									className="w-full text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2 flex items-center justify-between"
								>
									Products
									<svg
										className={`w-4 h-4 transition-transform ${mobileProductsOpen ? 'rotate-180' : ''}`}
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</button>

								{mobileProductsOpen && (
									<div className="ml-4 mt-2 space-y-2">
										<p className="text-xs text-sage uppercase tracking-wide font-bold px-2 py-1">Wallets</p>
										<Link
											href="/products/wallets/slim"
											onClick={() => setMobileMenuOpen(false)}
											className="block text-cream hover:text-copper transition-colors px-2 py-2"
										>
											Slim Wallets
										</Link>
										<Link
											href="/products/wallets/bifold-trifold"
											onClick={() => setMobileMenuOpen(false)}
											className="block text-cream hover:text-copper transition-colors px-2 py-2"
										>
											Bifold & Trifold
										</Link>
										<Link
											href="/products/wallets/clutch"
											onClick={() => setMobileMenuOpen(false)}
											className="block text-cream hover:text-copper transition-colors px-2 py-2"
										>
											Clutch Wallets
										</Link>
										<Link
											href="/products/wallets/roper"
											onClick={() => setMobileMenuOpen(false)}
											className="block text-cream hover:text-copper transition-colors px-2 py-2"
										>
											Roper Wallets
										</Link>
										<p className="text-xs text-beige/50 px-2 py-1 mt-2">Coming Soon</p>
										<span className="block text-beige/50 px-2 py-2 cursor-not-allowed">Belts</span>
										<span className="block text-beige/50 px-2 py-2 cursor-not-allowed">Purses</span>
										<span className="block text-beige/50 px-2 py-2 cursor-not-allowed">Welding Gear</span>
										<span className="block text-beige/50 px-2 py-2 cursor-not-allowed">Bible Covers</span>
									</div>
								)}
							</div>

							<Link
								href="/about"
								onClick={() => setMobileMenuOpen(false)}
								className="text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2"
							>
								About
							</Link>
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
