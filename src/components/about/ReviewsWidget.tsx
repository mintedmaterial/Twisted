export default function ReviewsWidget() {
	return (
		<section className="px-4 sm:px-6 lg:px-8 py-20">
			<div className="max-w-5xl mx-auto">
				<h2 className="heading-western text-glow text-4xl sm:text-5xl text-copper mb-6 text-center">
					What Our Customers Say
				</h2>
				<p className="text-beige text-center mb-12 text-lg">
					Don&apos;t just take our word for it—see what our customers have to say about
					their Twisted Custom Leather experience.
				</p>

				{/* Review Links Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
					{/* Google Reviews */}
					<a
						href="https://www.google.com/search?q=twisted+custom+leather+valliant"
						target="_blank"
						rel="noopener noreferrer"
						className="glass card-glow rounded-lg p-8 hover:scale-105 transition-transform"
					>
						<div className="flex items-center gap-4 mb-4">
							<svg className="w-12 h-12 text-copper" viewBox="0 0 24 24" fill="currentColor">
								<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
								<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
								<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
								<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
							</svg>
							<div>
								<h3 className="heading-western text-2xl text-cream">Google Reviews</h3>
								<p className="text-sage text-sm">See what customers say</p>
							</div>
						</div>
						<p className="text-beige">
							Read authentic reviews from our satisfied customers on Google.
						</p>
					</a>

					{/* Facebook Reviews */}
					<a
						href="https://www.facebook.com/twistedcustomleather/reviews"
						target="_blank"
						rel="noopener noreferrer"
						className="glass card-glow rounded-lg p-8 hover:scale-105 transition-transform"
					>
						<div className="flex items-center gap-4 mb-4">
							<svg className="w-12 h-12 text-copper" viewBox="0 0 24 24" fill="currentColor">
								<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
							</svg>
							<div>
								<h3 className="heading-western text-2xl text-cream">Facebook Reviews</h3>
								<p className="text-sage text-sm">Join our community</p>
							</div>
						</div>
						<p className="text-beige">
							Connect with us and see reviews from our Facebook community.
						</p>
					</a>
				</div>

				{/* Testimonial Placeholder */}
				<div className="glass card-glow rounded-lg p-8">
					<div className="flex items-start gap-4">
						<svg className="w-8 h-8 text-copper flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
						</svg>
						<div>
							<div className="flex gap-1 mb-2">
								{[...Array(5)].map((_, i) => (
									<svg key={i} className="w-5 h-5 text-copper" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
									</svg>
								))}
							</div>
							<p className="text-beige italic mb-2">
								&ldquo;The quality of the craftsmanship is outstanding. My wallet gets compliments
								everywhere I go. Truly custom leather twisted enough for all my needs!&rdquo;
							</p>
							<p className="text-sage text-sm">— [Customer testimonial from reviews]</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
