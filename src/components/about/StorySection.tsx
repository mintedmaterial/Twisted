import Image from 'next/image';

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
							Twisted Custom Leather found its beginning back in &apos;93. It didn&apos;t know it at the time. Because it all started as a hobby—just a guy in his workshop, tinkering with leather scraps and hand tools. But it quickly became a long-lived passion, the kind that keeps you up at night sketching designs and planning your next project.
						</p>
						<p>
							Over thirty years later, we&apos;re still at it. Creating heirloom-quality leather goods that Farmers, Ranchers, Welders, and everyone in between can depend on day in and day out. We believe in the beauty, longevity, and durability of hand-cut, carved, and tooled leather work. And we believe in the integrity of creating with premium materials—full-grain leather, solid hardware, and techniques that have stood the test of time.
						</p>
						<p>
							Because the last thing you need is to cinch down your $20 Wally World special on that important day, only to have the tongue rip clean off. Now you&apos;re late, beltless, and standing in the driveway wondering how your day got derailed by cheap leather. Don&apos;t be Kevin. Kevin bought the cheap belt. Kevin learned the hard way.
						</p>
						<p>
							Every piece we create is an antidote to disposable culture. In a world full of mass-produced items designed to be replaced, we craft wallets, belts, and accessories built to last a lifetime—and beyond. We&apos;re talking about leather that gets better with age, that tells a story with every scratch and scuff, that your grandkids will fight over someday.
						</p>
					</div>

					{/* Meet Randy Section */}
					<div className="mt-12 glass card-glow rounded-lg p-8">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
							<div className="md:col-span-1">
								<Image
									src="/Randy.jpg"
									alt="Randy, Master Craftsman and Founder of Twisted Custom Leather"
									width={420}
									height={560}
									className="rounded-lg shadow-lg w-full h-auto"
									sizes="(max-width: 768px) 100vw, 33vw"
								/>
							</div>
							<div className="md:col-span-2 space-y-4 text-beige">
								<h3 className="heading-western text-3xl text-copper mb-4">
									Meet the Master Craftsman
								</h3>
								<p>
									Randy, the founder, established Twisted Custom Leather as a small business in 2010. Having grown up around the cattle industry, horses, and rodeo, his interest in leather making came at an early age. He has been perfecting his leather craftsman skills ever since.
								</p>
								<p>
									Over time, Randy started making leather products for family and friends merely as a hobby. But in 2010, his son had a guy notice some of his work. He was a welder and wanted an armpad &quot;armguard&quot; for pipe welding. That quickly became a popular item and really helped Twisted Custom Leather take off.
								</p>
								<p>
									Now we make armguards and custom hoods for welders, leather belts, wallets, purses, sheaths, and more. We&apos;re proud to be one of the few companies to offer high-quality, handcrafted leather products using a blend of Western Floral, Basket Stamp, Big Weave, and other unique hand-carved designs along with grade A materials and exotic materials to build items that last a lifetime.
								</p>
							</div>
						</div>
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
