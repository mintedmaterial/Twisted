import VideoBackground from "@/components/VideoBackground";
import Header from "@/components/Header";
import CustomOrderCheckout from "@/components/CustomOrderCheckout";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import NewsletterSection from "@/components/NewsletterSection";
import ProductSection from "@/components/ProductSection";
import YouTubeEmbed from "@/components/YouTubeEmbed";

export default function Home() {
	return (
		<div className="relative min-h-screen">
			<VideoBackground />

			<Header />

			<main>
				<Hero />
				<ProductSection />
				<YouTubeEmbed />
				<CustomOrderCheckout />
				<NewsletterSection />
			</main>

			<Footer />
		</div>
	);
}
