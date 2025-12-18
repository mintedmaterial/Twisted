export default function StorySection() {
	return (
		<section className="px-4 sm:px-6 lg:px-8 py-20">
			<div className="max-w-4xl mx-auto">
				{/* Company Story */}
				<div className="mb-16">
					<h2 className="heading-western text-glow text-4xl sm:text-5xl text-copper mb-6">
						Our Story
					</h2>
					<div className="space-y-4 text-beige text-lg leading-relaxed">
						<p>
							Twisted Custom Leather was founded with a passion for creating heirloom-quality
							leather goods that stand the test of time. We believe in the beauty of
							hand-stitched craftsmanship and the integrity of premium materials.
						</p>
						<p>
							Every piece we create is an antidote to disposable culture. In a world of
							mass-produced items designed to be replaced, we craft wallets, belts, and
							accessories built to last a lifetime—and beyond.
						</p>
						<p className="italic text-copper-light">
							[Edit this section with your founder&apos;s story and company history]
						</p>
					</div>
				</div>

				{/* Three Pillars */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{/* Locally Owned & Operated */}
					<div className="glass card-glow rounded-lg p-8 text-center">
						<div className="w-16 h-16 bg-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</div>
						<h3 className="heading-western text-2xl text-copper mb-3">
							Locally Owned & Operated
						</h3>
						<p className="text-beige">
							Based in Valliant, Oklahoma, we&apos;re proud to be a local business serving
							our community and customers nationwide with authentic craftsmanship.
						</p>
					</div>

					{/* Crafted With Love */}
					<div className="glass card-glow rounded-lg p-8 text-center">
						<div className="w-16 h-16 bg-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
							</svg>
						</div>
						<h3 className="heading-western text-2xl text-copper mb-3">
							Crafted With Love, Designed to Last
						</h3>
						<p className="text-beige">
							Every stitch, every edge, every detail is carefully crafted by hand.
							We use only premium full-grain leather and time-honored techniques.
						</p>
					</div>

					{/* Lifetime Guarantee */}
					<div className="glass card-glow rounded-lg p-8 text-center">
						<div className="w-16 h-16 bg-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
						</div>
						<h3 className="heading-western text-2xl text-copper mb-3">
							The Lifetime Guarantee
						</h3>
						<p className="text-beige">
							We stand behind our work. If your Twisted Custom Leather piece ever
							fails due to craftsmanship, we&apos;ll repair or replace it. That&apos;s our promise.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
