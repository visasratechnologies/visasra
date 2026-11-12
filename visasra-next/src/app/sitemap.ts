import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.visasra.com';

  const routes = [
    '',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/shipping-policy',
    '/customs-policy',
    '/acceptable-use',
    '/worker-terms',
    '/contact',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}

