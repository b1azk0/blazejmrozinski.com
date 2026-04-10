import type { APIRoute } from 'astro';

const site = 'https://www.blazejmrozinski.com';

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${site}/sitemap-pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${site}/sitemap-blog.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${site}/sitemap-work.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${site}/sitemap-photography.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${site}/sitemap-glossary.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${site}/sitemap-changelog.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
