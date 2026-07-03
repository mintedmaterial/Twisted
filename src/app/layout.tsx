import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
	metadataBase: new URL("https://twistedcustomleather.com"),
	title: {
		default: "Twisted Custom Leather | Custom Handmade Leather Goods in Oklahoma",
		template: "%s | Twisted Custom Leather",
	},
	description: "Custom handmade leather goods from Valliant, Oklahoma. Order wallets, belts, purses, guitar straps, welding gear, Bible covers, and one-of-a-kind western leatherwork.",
	keywords: [
		"custom leather",
		"custom leather goods Oklahoma",
		"handmade leather wallets",
		"western leather goods",
		"custom leather belts",
		"leather guitar straps",
		"leather welding gear",
		"Bible covers",
		"Valliant Oklahoma leather"
	],
	applicationName: "Twisted Custom Leather",
	authors: [{ name: "Twisted Custom Leather" }],
	creator: "Twisted Custom Leather",
	publisher: "Twisted Custom Leather",
	alternates: {
		canonical: "/",
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://twistedcustomleather.com",
		siteName: "Twisted Custom Leather",
		title: "Twisted Custom Leather | Custom Handmade Leather Goods in Oklahoma",
		description: "Handmade western leather goods built for work, gifts, musicians, welders, and everyday carry.",
		images: [
			{
				url: "/TCL1.png",
				width: 1200,
				height: 630,
				alt: "Twisted Custom Leather handmade leatherwork",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Twisted Custom Leather | Custom Handmade Leather Goods",
		description: "Custom wallets, belts, purses, guitar straps, welding gear, Bible covers, and western leather goods from Oklahoma.",
		images: ["/TCL1.png"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
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

				{/* @ts-expect-error - ElevenLabs custom element */}
				<elevenlabs-convai agent-id="agent_4901kd1hbf8keec91akr5trg8czn"></elevenlabs-convai>
				<Script
					src="https://unpkg.com/@elevenlabs/convai-widget-embed@beta"
					strategy="afterInteractive"
				/>
			</body>
		</html>
	);
}
