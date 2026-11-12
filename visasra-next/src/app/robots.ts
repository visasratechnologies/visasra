import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/worker/'],
      },
    ],
    sitemap: 'https://www.visasra.com/sitemap.xml',
  };
}
