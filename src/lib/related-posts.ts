import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'blog'>;

interface ScoredPost {
  post: Post;
  sharedTopics: number;
  sameLabel: boolean;
  date: number;
}

export function pickRelated(current: Post, allPosts: Post[], n = 3): Post[] {
  const currentTopics = new Set(current.data.topics);
  const currentSeries = current.data.series;
  const currentLabel = current.data.label;

  const candidates = allPosts.filter(
    (p) =>
      p.id !== current.id &&
      // exclude posts in the same series (series module covers them)
      !(currentSeries && p.data.series === currentSeries)
  );

  const scored: ScoredPost[] = candidates.map((post) => ({
    post,
    sharedTopics: post.data.topics.filter((t) => currentTopics.has(t)).length,
    sameLabel: currentLabel != null && post.data.label === currentLabel,
    date: post.data.date.getTime(),
  }));

  // primary path: at least one shared topic
  const withSharedTopics = scored
    .filter((s) => s.sharedTopics > 0)
    .sort(
      (a, b) =>
        b.sharedTopics - a.sharedTopics ||
        Number(b.sameLabel) - Number(a.sameLabel) ||
        b.date - a.date
    );

  if (withSharedTopics.length >= n) {
    return withSharedTopics.slice(0, n).map((s) => s.post);
  }

  // fallback: top up with same-label posts not already included
  const includedIds = new Set(withSharedTopics.map((s) => s.post.id));
  const labelFallback = scored
    .filter((s) => s.sameLabel && !includedIds.has(s.post.id))
    .sort((a, b) => b.date - a.date);

  return [...withSharedTopics, ...labelFallback].slice(0, n).map((s) => s.post);
}
