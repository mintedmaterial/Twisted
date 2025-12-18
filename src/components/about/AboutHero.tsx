import Image from 'next/image';

export default function AboutHero() {
	return (
		<section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
			{/* Background Image with Overlay */}
			<div className="absolute inset-0 -z-10">
				<Image
					src="/TCL1.png"
					alt="Twisted Custom Leather Workshop"
					fill
					className="object-cover"
					priority
				/>
				<div className="absolute inset-0 bg-black/70" />
			</div>

			{/* Hero Content */}
			<div className="relative px-4 sm:px-6 lg:px-8 py-20 text-center max-w-5xl mx-auto">
				<h1 className="heading-western text-glow text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-cream mb-6 float">
					Twisted enough for a Lifetime
				</h1>
				<p className="body-western text-xl sm:text-2xl lg:text-3xl text-beige max-w-3xl mx-auto">
					Handcrafted western leather goods with authentic quality and care.
				</p>
			</div>
		</section>
	);
}
