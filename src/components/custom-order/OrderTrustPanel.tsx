const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?q=twisted+custom+leather+valliant';
const FACEBOOK_REVIEWS_URL = 'https://www.facebook.com/twistedcustomleather/reviews';

export default function OrderTrustPanel() {
	return (
		<aside aria-labelledby="order-trust-heading" className="glass rounded-lg border border-copper/30 p-5">
			<h3 id="order-trust-heading" className="heading-western text-2xl text-cream">Order with confidence</h3>
			<ul className="mt-4 space-y-3 text-beige">
				<li>30+ years of leathercraft</li>
				<li>Handmade in Valliant, Oklahoma</li>
				<li aria-label="Secure Square checkout">Secure checkout through Square</li>
				<li>Design details confirmed before work begins</li>
			</ul>
			<div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-copper">
				<a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-cream">Google Reviews</a>
				<a href={FACEBOOK_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-cream">Facebook Reviews</a>
			</div>
		</aside>
	);
}
