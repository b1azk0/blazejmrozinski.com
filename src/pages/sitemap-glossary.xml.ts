import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const site = 'https://www.blazejmrozinski.com';

export const GET: APIRoute = async () => {
  const terms = (await getCollection('glossary', ({ data }) => data.status === 'published'))
    .sort((a, b) => a.data.term.localeCompare(b.data.term));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}/glossary/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
${terms.map((term) => `  <url>
    <loc>${site}/glossary/${term.id}/</loc>
    <lastmod>${term.data.date.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
