import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import type { CollectionEntry } from 'astro:content';

export interface SeriesConfig {
  title: string;
  description: string;
}

export type SeriesSlug = string;

let cache: Map<SeriesSlug, SeriesConfig> | null = null;

export function loadSeries(): Map<SeriesSlug, SeriesConfig> {
  if (cache) return cache;
  const file = path.join(process.cwd(), 'src/data/series.yml');
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = parse(raw) as Record<string, SeriesConfig> | null;
  cache = new Map(Object.entries(parsed ?? {}));
  return cache;
}

export function getSeries(slug: SeriesSlug): SeriesConfig | undefined {
  return loadSeries().get(slug);
}

export function getSeriesSlugs(): SeriesSlug[] {
  return [...loadSeries().keys()];
}

/** Returns posts in the series, sorted ascending by seriesIndex. */
export function getSeriesPosts(
  slug: SeriesSlug,
  posts: CollectionEntry<'blog'>[]
): CollectionEntry<'blog'>[] {
  return posts
    .filter((p) => p.data.series === slug)
    .sort((a, b) => (a.data.seriesIndex ?? 0) - (b.data.seriesIndex ?? 0));
}
