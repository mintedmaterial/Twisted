'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';

const photoAlbums = {
	wallets: 'https://photos.google.com/share/AF1QipOsNxODm1-e7A7G3G6ZEPn-cshXXMuZRXZXyykPdt4nqefNbiUnD5bRCaW32J-fsg?key=RFJLS0hBckVXTmpubFdBU0xGbzNjSWFiXzR2VnVn',
	belts: 'https://photos.app.goo.gl/LTtAmZFpcWxB893j2',
	weldingGear: 'https://photos.google.com/share/AF1QipPzOOqKXTMznO6pcbD_tzOVFen160_3j2S1ndp848nNXufyX3sKbKXxPNT_lbFSwA?key=QWpuY19GY1BIWWg0bndnZnFRdmY1bmZNME40RDl3',
};

const walletLinks = [
	{ href: '/products/wallets/slim', label: 'Slim Wallets' },
	{ href: '/products/wallets/bifold-trifold', label: 'Bifold & Trifold' },
	{ href: '/products/wallets/clutch', label: 'Clutch Wallets' },
	{ href: '/products/wallets/roper', label: 'Roper Wallets' },
];

export default function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
	const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
	const productsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const openProductsDropdown = () => {
		if (productsCloseTimer.current) clearTimeout(productsCloseTimer.current);
		setProductsDropdownOpen(true);
	};

	const scheduleProductsDropdownClose = () => {
		if (productsCloseTimer.current) clearTimeout(productsCloseTimer.current);
		productsCloseTimer.current = setTimeout(() => setProductsDropdownOpen(false), 300);
	};

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
			setMobileMenuOpen(false);
		}
	};

	const closeMobileMenu = () => {
		setMobileMenuOpen(false);
		setMobileProductsOpen(false);
	};

	return (
		<header className="sticky top-0 z-50 glass backdrop-blur-md border-b border-copper/30">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16 md:h-20">
					<div className="flex items-center space-x-3">
						<Image src="/twisted.png" alt="Twisted Custom Leather Logo" width={40} height={40} className="rounded-full" />
						<h1 className="text-lg md:text-xl font-bold italic text-cream">Twisted Custom Leather</h1>
					</div>

					<nav className="hidden md:flex items-center space-x-8">
						<Link href="/" className="text-cream hover:text-copper transition-colors font-medium">Home</Link>

						<div className="relative" onMouseEnter={openProductsDropdown} onMouseLeave={scheduleProductsDropdownClose} onFocus={openProductsDropdown} onBlur={scheduleProductsDropdownClose}>
							<button className="text-cream hover:text-copper transition-colors font-medium flex items-center gap-1">
								Products
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
							</button>

							{productsDropdownOpen && (
								<div className="absolute top-full left-0 pt-3 w-56">
									<div className="glass backdrop-blur-md rounded-lg border border-copper/30 py-2 shadow-lg">
										<div className="px-3 py-2">
											<p className="text-xs text-sage uppercase tracking-wide font-bold mb-2">Wallets</p>
											{walletLinks.map((link) => (
												<Link key={link.href} href={link.href} className="block px-3 py-2 text-cream hover:text-copper hover:bg-copper/10 rounded transition-colors">
													{link.label}
												</Link>
											))}
										</div>
										<div className="border-t border-copper/30 mt-2 pt-2 px-3">
											<p className="text-xs text-sage uppercase tracking-wide font-bold px-3 py-1">Photo Albums</p>
											<a href={photoAlbums.wallets} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-cream hover:text-copper hover:bg-copper/10 rounded transition-colors">Wallet Album</a>
											<a href={photoAlbums.belts} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-cream hover:text-copper hover:bg-copper/10 rounded transition-colors">Belts Album</a>
											<Link href="/#featured-work" className="block px-3 py-2 text-cream hover:text-copper hover:bg-copper/10 rounded transition-colors">Purses & Leather Work</Link>
											<a href={photoAlbums.weldingGear} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-cream hover:text-copper hover:bg-copper/10 rounded transition-colors">Welding Gear Album</a>
											<button onClick={() => scrollToSection('custom-order')} className="block w-full text-left px-3 py-2 text-cream hover:text-copper hover:bg-copper/10 rounded transition-colors">Bible Cover Quote</button>
										</div>
									</div>
								</div>
							)}
						</div>

						<Link href="/about" className="text-cream hover:text-copper transition-colors font-medium">About</Link>
						<button onClick={() => scrollToSection('contact')} className="text-cream hover:text-copper transition-colors font-medium">Contact</button>
					</nav>

					<button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-cream hover:text-copper transition-colors" aria-label="Toggle menu">
						<svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
							{mobileMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
						</svg>
					</button>
				</div>

				{mobileMenuOpen && (
					<div className="md:hidden pb-4">
						<nav className="flex flex-col space-y-3">
							<Link href="/" onClick={closeMobileMenu} className="text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2">Home</Link>

							<div>
								<button onClick={() => setMobileProductsOpen(!mobileProductsOpen)} className="w-full text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2 flex items-center justify-between">
									Products
									<svg className={`w-4 h-4 transition-transform ${mobileProductsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
								</button>

								{mobileProductsOpen && (
									<div className="ml-4 mt-2 space-y-2">
										<p className="text-xs text-sage uppercase tracking-wide font-bold px-2 py-1">Wallets</p>
										{walletLinks.map((link) => (
											<Link key={link.href} href={link.href} onClick={closeMobileMenu} className="block text-cream hover:text-copper transition-colors px-2 py-2">
												{link.label}
											</Link>
										))}
										<p className="text-xs text-sage uppercase tracking-wide font-bold px-2 py-1 mt-2">Photo Albums</p>
										<a href={photoAlbums.wallets} target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu} className="block text-cream hover:text-copper transition-colors px-2 py-2">Wallet Album</a>
										<a href={photoAlbums.belts} target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu} className="block text-cream hover:text-copper transition-colors px-2 py-2">Belts Album</a>
										<Link href="/#featured-work" onClick={closeMobileMenu} className="block text-cream hover:text-copper transition-colors px-2 py-2">Purses & Leather Work</Link>
										<a href={photoAlbums.weldingGear} target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu} className="block text-cream hover:text-copper transition-colors px-2 py-2">Welding Gear Album</a>
										<button onClick={() => scrollToSection('custom-order')} className="block w-full text-left text-cream hover:text-copper transition-colors px-2 py-2">Bible Cover Quote</button>
									</div>
								)}
							</div>

							<Link href="/about" onClick={closeMobileMenu} className="text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2">About</Link>
							<button onClick={() => scrollToSection('contact')} className="text-cream hover:text-copper transition-colors font-medium text-left px-2 py-2">Contact</button>
						</nav>
					</div>
				)}
			</div>
		</header>
	);
}
