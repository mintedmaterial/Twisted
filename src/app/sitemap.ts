import type { MetadataRoute } from 'next';

const baseUrl = 'https://twistedcustomleather.com';

export default function sitemap(): MetadataRoute.Sitemap {
	const routes = [
		'',
		'/about',
		'/products/wallets/slim',
		'/products/wallets/bifold-trifold',
		'/products/wallets/clutch',
		'/products/wallets/roper',
	];

	return routes.map((route) => ({
		url: `${baseUrl}${route}`,
		lastModified: new Date(),
		changeFrequency: route === '' ? 'weekly' : 'monthly',
		priority: route === '' ? 1 : 0.7,
	}));
}
