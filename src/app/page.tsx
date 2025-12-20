import VideoBackground from "@/components/VideoBackground";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductSection from "@/components/ProductSection";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";

export default function Home() {
	return (
		<div className="relative min-h-screen">
			<VideoBackground />

			<Header />

			<main>
				<Hero />
				<ProductSection />
				<YouTubeEmbed />
				<NewsletterSection />
			</main>

			<Footer />
		</div>
	);
}
