import type { APIRoute } from 'astro';

const site = 'https://www.blazejmrozinski.com';

const pages = [
  { loc: '/',             changefreq: 'weekly',  priority: '1.0' },
  { loc: '/about/',       changefreq: 'monthly', priority: '0.8' },
  { loc: '/blog/',        changefreq: 'weekly',  priority: '0.9' },
  { loc: '/contact/',     changefreq: 'yearly',  priority: '0.6' },
  { loc: '/cv/',          changefreq: 'monthly', priority: '0.5' },
  { loc: '/publications/',changefreq: 'monthly', priority: '0.6' },
];

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>
    <loc>${site}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
