export default function RandyVideo() {
	return (
		<section id="meet-randy" className="px-4 sm:px-6 lg:px-8 py-14 md:py-20">
			<div className="glass card-glow max-w-5xl mx-auto rounded-2xl overflow-hidden border border-copper/40">
				<div className="p-6 md:p-10 text-center">
					<p className="body-western text-copper-light text-sm sm:text-base uppercase tracking-[0.24em] mb-3">
						More Than 30 Years of Leatherwork
					</p>
					<h2 className="heading-western text-4xl sm:text-5xl md:text-6xl text-cream mb-4">
						Meet Randy
					</h2>
					<p className="body-western text-lg sm:text-xl text-beige max-w-3xl mx-auto">
						See how Randy handcrafts custom leather goods and learn how to order a piece made especially for you.
					</p>
				</div>

				<video
					controls
					playsInline
					preload="metadata"
					className="block w-full aspect-video bg-black object-contain"
					aria-label="Randy introduces Twisted Custom Leather and explains how to order"
				>
					<source src="/randy-twisted-custom-leather.mp4" type="video/mp4" />
					Your browser does not support embedded video.
				</video>

				<div className="p-6 md:p-8 text-center">
					<a
						href="#custom-order"
						className="inline-flex rounded-lg px-8 py-4 text-lg font-bold text-cream bg-copper/80 hover:bg-copper transition-colors"
					>
						Start Your Custom Order
					</a>
				</div>
			</div>
		</section>
	);
}
