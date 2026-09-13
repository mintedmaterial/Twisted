import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: 'standalone',
	outputFileTracingRoot: process.cwd(),
	images: {
		unoptimized: true,
	},
};

export default nextConfig;

// `initOpenNextCloudflareForDev()` is intentionally NOT enabled on Windows.
// It relies on a remote `workerd` preview session that fails to start on this OS.
// `getCloudflareContext()` therefore only works in the deployed Workers runtime.
// Local dev still renders the pages fine; API routes that touch D1/R2 need
// Cloudflare preview/production to fully exercise.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
