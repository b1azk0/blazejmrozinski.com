import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const site = 'https://www.blazejmrozinski.com';

export const GET: APIRoute = async () => {
  const albums = await getCollection('photography');

  const urls = [
    { loc: '/photography/', lastmod: undefined, changefreq: 'monthly', priority: '0.6' },
    ...albums.map((a) => ({
      loc: `/photography/${a.id}/`,
      lastmod: a.data.date.toISOString().split('T')[0],
      changefreq: 'yearly' as const,
      priority: '0.5',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${site}${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
