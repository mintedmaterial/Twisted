import type { Metadata } from "next";
import VoiceAgent from "@/components/VoiceAgent";
import "./globals.css";

export const metadata: Metadata = {
	title: "Twisted Custom Leather | Handcrafted Western Leather Goods",
	description: "Custom leather twisted enough for all your needs. Handcrafted wallets, belts, purses, welding gear, and Bible covers with authentic western craftsmanship.",
	keywords: ["custom leather", "western leather goods", "handcrafted leather", "leather wallets", "leather belts", "leather purses", "welding gear", "Bible covers"],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
				<link rel="preload" href="/background.mp4" as="video" type="video/mp4"></link>
			</head>
			<body className="antialiased">
				{children}
				<VoiceAgent />
			</body>
		</html>
	);
}
