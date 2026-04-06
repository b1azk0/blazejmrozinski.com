import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const now = new Date();
  const posts = (await getCollection('blog', ({ data }) => data.status === 'published' && data.date <= now))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Blazej Mrozinski',
    description: 'Writing on AI workflows, product development, psychometrics, and building across multiple domains.',
    site: context.site,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
