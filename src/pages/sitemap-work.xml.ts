import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const site = 'https://www.blazejmrozinski.com';

export const GET: APIRoute = async () => {
  const companies = await getCollection('companies');
  const projects = await getCollection('projects');

  const urls = [
    { loc: '/work/', changefreq: 'monthly', priority: '0.8' },
    { loc: '/projects/', changefreq: 'monthly', priority: '0.7' },
    ...companies.map((c) => ({
      loc: `/work/${c.id}/`,
      changefreq: 'monthly' as const,
      priority: '0.7',
    })),
    ...projects.map((p) => ({
      loc: `/projects/${p.id}/`,
      changefreq: 'monthly' as const,
      priority: '0.6',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${site}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
