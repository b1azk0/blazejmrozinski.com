import type { APIRoute } from 'astro';
import { getAllReleases } from '@/lib/changelog';

const site = 'https://www.blazejmrozinski.com';

export const GET: APIRoute = () => {
  const releases = getAllReleases();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}/changelog/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
${releases.map((r) => `  <url>
    <loc>${site}/changelog/v${r.version}/</loc>
    <lastmod>${r.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
