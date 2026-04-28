import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const site = 'https://www.blazejmrozinski.com';

export const GET: APIRoute = async () => {
  const now = new Date();
  const posts = (await getCollection('blog', ({ data }) => data.status === 'published' && data.date <= now))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${posts.map((post) => {
  const lastmod = (post.data.lastmod ?? post.data.date).toISOString().split('T')[0];
  return `  <url>
    <loc>${site}/blog/${post.id}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
}).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
