export default function YouTubeEmbed() {
	return (
		<section id="video" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
			<div className="max-w-5xl mx-auto">
				<div className="text-center mb-8 md:mb-12">
					<h2 className="heading-western text-glow text-4xl sm:text-5xl md:text-6xl text-cream mb-4">
						The Craft Behind The Leather
					</h2>
					<p className="body-western text-xl md:text-2xl text-beige">
						Hear from the artisan behind Twisted Custom Leather
					</p>
				</div>

				<div className="card-glow glass rounded-lg p-2 md:p-4">
					<div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
						<iframe
							className="absolute top-0 left-0 w-full h-full rounded-md"
							src="https://www.youtube.com/embed/_T6CCywAbSk?si=gweNcacWUwJ7FUTX"
							title="Twisted Custom Leather Craftsman"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							referrerPolicy="strict-origin-when-cross-origin"
							allowFullScreen
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
