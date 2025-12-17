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
							<li className="hover:text-copper transition-colors cursor-pointer">Wallets</li>
							<li className="hover:text-copper transition-colors cursor-pointer">Belts</li>
							<li className="hover:text-copper transition-colors cursor-pointer">Purses</li>
							<li className="hover:text-copper transition-colors cursor-pointer">Welding Gear</li>
							<li className="hover:text-copper transition-colors cursor-pointer">Bible Covers</li>
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
							<li className="hover:text-copper transition-colors cursor-pointer">Email</li>
							<li className="hover:text-copper transition-colors cursor-pointer">Facebook</li>
							<li className="hover:text-copper transition-colors cursor-pointer">Instagram</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-copper/20 pt-8 text-center">
					<p className="text-beige text-sm">
						&copy; {new Date().getFullYear()} Twisted Custom Leather. All rights reserved.
					</p>
					<p className="text-sage-dark text-xs mt-2 italic">
						Custom leather twisted enough for all your needs
					</p>
				</div>
			</div>
		</footer>
	);
}
