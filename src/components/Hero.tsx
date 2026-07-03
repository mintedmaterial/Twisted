export default function Hero() {
	return (
		<section
			id="home"
			className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20"
		>
			<div className="text-center max-w-5xl mx-auto">
				<h1 className="heading-western text-glow glitch-hover text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-cream mb-6 md:mb-8 float">
					Twisted Custom Leather
				</h1>

				<p className="body-western text-xl sm:text-2xl md:text-3xl lg:text-4xl text-beige mb-8 md:mb-12">
					Handmade Oklahoma leather built for work, gifts, and one-of-a-kind pieces.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href="#custom-order"
						className="card-glow glass rounded-lg px-8 py-4 text-lg font-bold text-cream hover:text-copper transition-all duration-300"
					>
						Start A Custom Order
					</a>
					<a
						href="#products"
						className="glass rounded-lg px-8 py-4 text-lg font-medium text-cream hover:text-copper-light transition-all duration-300 border border-copper/50"
					>
						Browse What We Make
					</a>
				</div>
			</div>
		</section>
	);
}
