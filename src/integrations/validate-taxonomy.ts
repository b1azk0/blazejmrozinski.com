import type { AstroIntegration } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

interface PostFrontmatter {
  status?: string;
  topics?: string[];
  series?: string;
  seriesIndex?: number;
}

const TOPICS_PATH = 'src/data/topics.yml';
const SERIES_PATH = 'src/data/series.yml';
const BLOG_DIR = 'src/content/blog';

function loadYamlMap(file: string): Map<string, unknown> {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = parse(raw) as Record<string, unknown> | null;
  return new Map(Object.entries(parsed ?? {}));
}

function readFrontmatter(file: string): PostFrontmatter {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return (parse(match[1]) as PostFrontmatter) ?? {};
}

function listBlogPosts(): { slug: string; data: PostFrontmatter }[] {
  const dir = path.join(process.cwd(), BLOG_DIR);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  return files.map((f) => ({
    slug: f.replace(/\.md$/, ''),
    data: readFrontmatter(path.join(dir, f)),
  }));
}

function validate(): string[] {
  const errors: string[] = [];
  const topics = loadYamlMap(path.join(process.cwd(), TOPICS_PATH));
  const series = loadYamlMap(path.join(process.cwd(), SERIES_PATH));
  const posts = listBlogPosts();
  const published = posts.filter((p) => (p.data.status ?? 'published') === 'published');

  // 1. Every topics: [x] value in any post must exist in topics.yml
  for (const post of posts) {
    for (const t of post.data.topics ?? []) {
      if (!topics.has(t)) {
        errors.push(
          `[validate-taxonomy] Post '${post.slug}' references topic '${t}' which is not defined in ${TOPICS_PATH}`
        );
      }
    }
  }

  // 2. Every `series` value must exist in series.yml
  for (const post of posts) {
    if (post.data.series && !series.has(post.data.series)) {
      errors.push(
        `[validate-taxonomy] Post '${post.slug}' references series '${post.data.series}' which is not defined in ${SERIES_PATH}`
      );
    }
  }

  // 3. seriesIndex values within a series must be unique and contiguous 1..N;
  // and posts with `series` set must also have `seriesIndex` set.
  const bySeries: Map<string, number[]> = new Map();
  for (const post of posts) {
    if (post.data.series && post.data.seriesIndex != null) {
      const arr = bySeries.get(post.data.series) ?? [];
      arr.push(post.data.seriesIndex);
      bySeries.set(post.data.series, arr);
    } else if (post.data.series && post.data.seriesIndex == null) {
      errors.push(
        `[validate-taxonomy] Post '${post.slug}' has series='${post.data.series}' but no seriesIndex`
      );
    }
  }
  for (const [slug, indices] of bySeries) {
    const sorted = [...indices].sort((a, b) => a - b);
    const expected = Array.from({ length: sorted.length }, (_, i) => i + 1);
    if (sorted.length !== new Set(sorted).size) {
      errors.push(
        `[validate-taxonomy] Series '${slug}' has duplicate seriesIndex values: ${sorted.join(',')}`
      );
    } else if (sorted.join(',') !== expected.join(',')) {
      errors.push(
        `[validate-taxonomy] Series '${slug}' has gap or non-1-based seriesIndex (parts: ${sorted.join(',')})`
      );
    }
  }

  // 4. Every topic in topics.yml must have ≥1 published post.
  {
    const usedTopics = new Set<string>();
    for (const post of published) {
      for (const t of post.data.topics ?? []) usedTopics.add(t);
    }
    for (const slug of topics.keys()) {
      if (!usedTopics.has(slug)) {
        errors.push(
          `[validate-taxonomy] Topic '${slug}' has zero published posts — orphan in ${TOPICS_PATH}`
        );
      }
    }
  }

  return errors;
}

export default function validateTaxonomy(): AstroIntegration {
  return {
    name: 'validate-taxonomy',
    hooks: {
      'astro:build:start': () => {
        const errors = validate();
        if (errors.length > 0) {
          throw new Error('\n' + errors.join('\n'));
        }
      },
      'astro:server:setup': () => {
        const errors = validate();
        if (errors.length > 0) {
          // Dev: log instead of throw, so editing posts incrementally doesn't kill the dev server
          for (const e of errors) console.warn(e);
        }
      },
    },
  };
}
