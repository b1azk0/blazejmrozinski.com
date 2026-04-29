import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { loadTopics, getPostsForTopic } from '@/lib/topics';
import { loadSeries, getSeriesPosts } from '@/lib/series';

const site = 'https://www.blazejmrozinski.com';

function maxDate(dates: Date[]): Date {
  return dates.reduce((max, d) => (d > max ? d : max), new Date(0));
}

export const GET: APIRoute = async () => {
  const now = new Date();
  const posts = (
    await getCollection('blog', ({ data }) => data.status === 'published' && data.date <= now)
  ).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const postUrls = posts.map((post) => {
    const lastmod = (post.data.lastmod ?? post.data.date).toISOString().split('T')[0];
    return `  <url>
    <loc>${site}/blog/${post.id}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  // Topic index
  const topicIndexUrl = `  <url>
    <loc>${site}/blog/topic/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;

  // Per-topic hubs — lastmod = max(post.lastmod ?? post.date) across the topic's posts
  const topics = loadTopics();
  const topicUrls = [...topics.keys()].map((slug) => {
    const topicPosts = getPostsForTopic(slug, posts);
    const dates = topicPosts.map((p) => p.data.lastmod ?? p.data.date);
    const lastmod = dates.length > 0 ? maxDate(dates).toISOString().split('T')[0] : undefined;
    return `  <url>
    <loc>${site}/blog/topic/${slug}/</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  // Per-series landings — lastmod = max(post.lastmod ?? post.date) across the series' posts
  const series = loadSeries();
  const seriesUrls = [...series.keys()].map((slug) => {
    const seriesParts = getSeriesPosts(slug, posts);
    const dates = seriesParts.map((p) => p.data.lastmod ?? p.data.date);
    const lastmod = dates.length > 0 ? maxDate(dates).toISOString().split('T')[0] : undefined;
    return `  <url>
    <loc>${site}/blog/series/${slug}/</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...postUrls, topicIndexUrl, ...topicUrls, ...seriesUrls].join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
