import Link from 'next/link';

export default function Footer() {
	return (
		<footer id="contact" className="glass border-t border-copper/30 py-12 md:py-16 px-4 sm:px-6 lg:px-8 mt-16">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8">
					<div>
						<h3 className="heading-western text-2xl text-cream mb-4">
							Twisted Custom Leather
						</h3>
						<p className="body-western text-beige text-sm">
							Handcrafted western leather goods with authentic quality and care.
						</p>
					</div>

					<div>
						<h4 className="font-bold text-lg text-cream mb-4">Products</h4>
						<ul className="space-y-2 text-beige text-sm">
							<li><Link href="/#products" className="hover:text-copper transition-colors">Wallets</Link></li>
							<li><Link href="/#products" className="hover:text-copper transition-colors">Belts</Link></li>
							<li><Link href="/#products" className="hover:text-copper transition-colors">Purses</Link></li>
							<li><Link href="/#products" className="hover:text-copper transition-colors">Welding Gear</Link></li>
							<li><Link href="/#products" className="hover:text-copper transition-colors">Book/Bible/Planner Covers</Link></li>
						</ul>
					</div>

					<div>
						<h4 className="font-bold text-lg text-cream mb-4">Connect</h4>
						<ul className="space-y-2 text-beige text-sm">
							<li>
								<a
									href="https://twistedcustomleather.com"
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-copper transition-colors"
								>
									Website
								</a>
							</li>
							<li>
								<a
									href="https://www.facebook.com/twistedcustomleather"
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-copper transition-colors"
								>
									Facebook
								</a>
							</li>
							<li>
								<a
									href="https://www.google.com/search?q=twisted+custom+leather+valliant"
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-copper transition-colors"
								>
									Google Reviews
								</a>
							</li>
							<li>
								<span className="block text-sage text-xs font-bold uppercase tracking-wide">
									Marketing
								</span>
								<a href="mailto:connie@twistedcustomleather.com" className="hover:text-copper transition-colors">
									connie@twistedcustomleather.com
								</a>
							</li>
							<li>
								<span className="block text-sage text-xs font-bold uppercase tracking-wide">
									Crafter
								</span>
								<a href="mailto:randy@twistedcustomleather.com" className="hover:text-copper transition-colors">
									randy@twistedcustomleather.com
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-copper/20 pt-8 text-center">
					<p className="text-beige text-sm">
						&copy; {new Date().getFullYear()} Twisted Custom Leather. All rights reserved.
					</p>
					<p className="text-sage text-xs mt-2">
						Site developed and Maintained by{' '}
						<a
							href="https://srvcflo.com/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-copper hover:text-copper-light transition-colors font-bold"
						>
							Srvcflo
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
