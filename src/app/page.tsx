import VideoBackground from "@/components/VideoBackground";
import Header from "@/components/Header";
import CustomOrderCheckout from "@/components/CustomOrderCheckout";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import NewsletterSection from "@/components/NewsletterSection";
import ProductSection from "@/components/ProductSection";
import Script from "next/script";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import FeaturedWork from "@/components/FeaturedWork";
import RandyVideo from "@/components/RandyVideo";

export default function Home() {
	const businessSchema = {
		"@context": "https://schema.org",
		"@type": "LocalBusiness",
		name: "Twisted Custom Leather",
		url: "https://twistedcustomleather.com",
		image: "https://twistedcustomleather.com/TCL1.png",
		description: "Custom handmade leather goods from Valliant, Oklahoma, including wallets, belts, purses, guitar straps, welding gear, Bible covers, and western leatherwork.",
		address: {
			"@type": "PostalAddress",
			addressLocality: "Valliant",
			addressRegion: "OK",
			addressCountry: "US",
		},
		telephone: "+1-580-392-9090",
		email: "randy@twistedcustomleather.com",
		sameAs: [
			"https://www.facebook.com/twistedcustomleather",
		],
		makesOffer: [
			{ "@type": "Offer", itemOffered: { "@type": "Product", name: "Custom Leather Wallets" } },
			{ "@type": "Offer", itemOffered: { "@type": "Product", name: "Custom Leather Belts" } },
			{ "@type": "Offer", itemOffered: { "@type": "Product", name: "Leather Guitar Straps" } },
			{ "@type": "Offer", itemOffered: { "@type": "Product", name: "Leather Welding Gear" } },
			{ "@type": "Offer", itemOffered: { "@type": "Product", name: "Custom Bible Covers" } },
		],
	};

	return (
		<div className="relative min-h-screen">
			<Script
				id="twisted-custom-leather-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
			/>
			<VideoBackground />

			<Header />

			<main>
				<Hero />
				<RandyVideo />
				<ProductSection />
				<FeaturedWork />
				<YouTubeEmbed />
				<CustomOrderCheckout />
				<NewsletterSection />
			</main>

			<Footer />
		</div>
	);
}
