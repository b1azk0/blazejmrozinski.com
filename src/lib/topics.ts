import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import type { CollectionEntry } from 'astro:content';

export interface TopicConfig {
  title: string;
  description: string;
}

export type TopicSlug = string;

let cache: Map<TopicSlug, TopicConfig> | null = null;

export function loadTopics(): Map<TopicSlug, TopicConfig> {
  if (cache) return cache;
  const file = path.join(process.cwd(), 'src/data/topics.yml');
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = parse(raw) as Record<string, TopicConfig> | null;
  cache = new Map(Object.entries(parsed ?? {}));
  return cache;
}

export function getTopic(slug: TopicSlug): TopicConfig | undefined {
  return loadTopics().get(slug);
}

export function isTopic(slug: string): boolean {
  return loadTopics().has(slug);
}

export function getTopicSlugs(): TopicSlug[] {
  return [...loadTopics().keys()];
}

export function getPostsForTopic(
  slug: TopicSlug,
  posts: CollectionEntry<'blog'>[]
): CollectionEntry<'blog'>[] {
  return posts
    .filter((p) => p.data.topics.includes(slug))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
