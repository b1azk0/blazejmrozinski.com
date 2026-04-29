# SEO Tier 2 — Content Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add static topic-hub pages, explicit series navigation, and a related-posts module to the blog. Replace the client-side `?tag=` filter with crawlable `/blog/topic/[slug]/` routes; supersede hand-maintained WP Infra footer link blocks with an auto-rendered SeriesNav component; add 3-card RelatedPosts at the bottom of every non-series post.

**Architecture:** Hybrid taxonomy — controlled `topics` (in `src/data/topics.yml`) drive hub pages and JSON-LD; free-form `tags` stay as on-card flavor only. Series modeled via frontmatter `series` + `seriesIndex`, with metadata in `src/data/series.yml`. Build-time validator enforces taxonomy consistency. Six commits on a single branch off `main`.

**Tech Stack:** Astro 6 (static output), Tailwind 4, content collections, `yaml` parser (already a dep), TypeScript, custom Astro integration for validation.

**Spec:** `docs/superpowers/specs/2026-04-29-seo-tier2-content-architecture-design.md` — read before starting.

**Branch / worktree:** `feat/seo-tier2-content-architecture` at `.worktrees/feat-seo-tier2-content-architecture/`. Commit 0 (`.gitignore` + spec) is already done at `17a7966`.

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `src/content.config.ts` | modify | Add `topics`, `series`, `seriesIndex` fields to blog schema |
| `src/data/topics.yml` | create | Controlled topic vocabulary (slug → title, description) |
| `src/data/series.yml` | create | Controlled series vocabulary (slug → title, description) |
| `src/lib/topics.ts` | create | Load topics yml; lookup helpers |
| `src/lib/series.ts` | create | Load series yml; lookup helpers; series-posts sort |
| `src/lib/related-posts.ts` | create | Pick N related posts via topic-overlap + label-tiebreak + date |
| `src/integrations/validate-taxonomy.ts` | create | Astro integration; build-time consistency checks |
| `astro.config.mjs` | modify | Register validate-taxonomy integration |
| `src/components/PostCard.astro` | modify | Tag chips → non-link `<span>` unless tag is a topic |
| `src/components/LabelFilter.astro` | modify | Remove dead `activeTag` branch from inline script |
| `src/components/TopicCard.astro` | create | Card used on `/blog/topic/` index |
| `src/components/SeriesNav.astro` | create | Series header banner + footer prev/next + collapsed TOC |
| `src/components/RelatedPosts.astro` | create | "Related reading" heading + 3 PostCards |
| `src/pages/blog/index.astro` | modify | Replace client-side `?tag=` filter with redirect-or-strip script |
| `src/pages/blog/topic/index.astro` | create | Topics index page |
| `src/pages/blog/topic/[slug].astro` | create | Topic hub (per-topic) |
| `src/pages/blog/series/[slug].astro` | create | Series landing page |
| `src/pages/sitemap-blog.xml.ts` | modify | Add topic index + topic hubs + series landings |
| `src/layouts/BlogPost.astro` | modify | Add Filed-under line; mount SeriesNav or RelatedPosts; add `about` and `isPartOf` JSON-LD; remove tag chips row from header |
| `src/content/blog/*.md` | modify (19 posts) | Add `topics: [...]`; add `series` + `seriesIndex` on 10 series posts; remove WP Infra footer "Full Series" blocks (7 posts) |
| `CHANGELOG.md` | modify | Append `0.13.0` entry |
| `README.md` | modify (maybe) | Update if it describes blog routes/collections |

---

## Commit 1 — Schema, data files, validation, lib modules

This commit lands all infrastructure with empty/stub data so the build passes. No UI changes yet.

### Task 1.1: Add schema fields for topics and series

**Files:**
- Modify: `src/content.config.ts:7-22` (the blog collection's `schema`)

- [ ] **Step 1: Edit blog schema**

In `src/content.config.ts`, find the `blog` collection's `schema` block. Add three fields. After the existing change, the blog schema should be:

```ts
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    audience: z.array(z.string()).default([]),
    format: z.string().optional(),
    description: z.string(),
    status: z.enum(['draft', 'published']).default('published'),
    safety_review: z.boolean().default(false),
    label: z.enum([
      'infrastructure',
      'ai-automation',
      'product',
      'research',
      'systems-thinking',
      'operator-notes',
      'academic-work',
    ]).optional(),
    topics: z.array(z.string()).default([]),
    series: z.string().optional(),
    seriesIndex: z.number().int().positive().optional(),
  }),
});
```

- [ ] **Step 2: Verify build still passes (no posts use new fields yet, defaults handle it)**

Run: `npm run build`
Expected: build succeeds, all 19 posts emit.

### Task 1.2: Create stub data files

**Files:**
- Create: `src/data/topics.yml`
- Create: `src/data/series.yml`

The full topic list is finalized in Commit 2. This commit lands a single stub topic and the two real series so the validator has data to walk.

- [ ] **Step 1: Create the data directory and topics.yml stub**

Create `src/data/topics.yml`:

```yaml
# Controlled topic vocabulary. Each slug becomes a hub page at /blog/topic/<slug>/.
# Posts opt in via the `topics: [slug]` frontmatter field. Free-form `tags` are unaffected.
# Validator (src/integrations/validate-taxonomy.ts) enforces: every topic value in any
# post must exist here, and every topic here must have ≥1 published post.

# Stub — finalized list lands in Commit 2 (post backfill).
wordpress-infrastructure:
  title: WordPress Infrastructure
  description: Self-hosted WordPress on Hetzner VPS — LEMP stack, deploys, caching, security, automation, monitoring.
```

- [ ] **Step 2: Create series.yml**

Create `src/data/series.yml`:

```yaml
# Controlled series vocabulary. Each slug becomes a landing page at /blog/series/<slug>/.
# Posts opt in via `series: <slug>` + `seriesIndex: <int>` frontmatter.
# Validator enforces: every `series` value in a post must exist here; seriesIndex values
# within a series must be unique and form a contiguous 1..N.

wp-infrastructure:
  title: WordPress Infrastructure
  description: A 7-part deep dive on running WordPress on a Hetzner VPS — LEMP stack, deploys, caching, security, automation, monitoring.

talent-archetypes:
  title: Talent Archetypes
  description: A 3-part series on the four workplace personality types recovered across two custom psychometric studies.
```

### Task 1.3: Implement `src/lib/topics.ts`

**Files:**
- Create: `src/lib/topics.ts`

- [ ] **Step 1: Write topics.ts**

```ts
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
```

### Task 1.4: Implement `src/lib/series.ts`

**Files:**
- Create: `src/lib/series.ts`

- [ ] **Step 1: Write series.ts**

```ts
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
```

### Task 1.5: Implement `src/lib/related-posts.ts`

**Files:**
- Create: `src/lib/related-posts.ts`

- [ ] **Step 1: Write related-posts.ts**

Algorithm (per spec): rank candidates by shared-topic count desc; tiebreak by same-label, then by date desc. Fall back to same-label posts (newest first) if zero shared topics. Exclude current post and posts in the same series.

```ts
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
```

### Task 1.6: Implement validation integration

**Files:**
- Create: `src/integrations/validate-taxonomy.ts`

- [ ] **Step 1: Write the integration**

The integration runs at `astro:build:start` (and `astro:server:setup` for dev). It reads posts directly from disk (not via `getCollection` — content collections aren't available in the integration hook context).

```ts
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
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
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

  // 3. seriesIndex values within a series must be unique and contiguous 1..N
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

  // 4. Every topic in topics.yml must have ≥1 published post (gated by env var until backfill)
  if (process.env.VALIDATE_TAXONOMY_REQUIRE_TOPIC_POSTS === 'true') {
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
```

### Task 1.7: Wire integration into Astro config

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Register the integration**

Replace the file content with:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import validateTaxonomy from './src/integrations/validate-taxonomy.ts';

export default defineConfig({
  site: 'https://www.blazejmrozinski.com',
  integrations: [validateTaxonomy()],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build succeeds. Validator passes (one stub topic exists in `topics.yml`, no posts use `topics`/`series`/`seriesIndex` yet, the orphan-topic check is gated by env var so the unused stub topic doesn't fail).

### Task 1.8: Negative-test the validator (deliberate breakage, fix, commit)

**Files:** none changed

This step verifies the validator actually catches issues. Don't skip — it's the only test layer.

- [ ] **Step 1: Inject a deliberate violation in a post**

Edit any blog post (e.g. `src/content/blog/personal-site-as-product.md`), add `topics: [nonexistent-topic]` to its frontmatter.

- [ ] **Step 2: Run build, expect failure**

Run: `npm run build`
Expected output includes:
```
[validate-taxonomy] Post 'personal-site-as-product' references topic 'nonexistent-topic' which is not defined in src/data/topics.yml
```

- [ ] **Step 3: Test the orphan-topic check**

Remove the violation from the post. Now run with the orphan-topic check enabled:

Run: `VALIDATE_TAXONOMY_REQUIRE_TOPIC_POSTS=true npm run build`
Expected output includes:
```
[validate-taxonomy] Topic 'wordpress-infrastructure' has zero published posts — orphan in src/data/topics.yml
```

- [ ] **Step 4: Verify clean build still passes without the env var**

Run: `npm run build`
Expected: build succeeds.

### Task 1.9: Commit

- [ ] **Step 1: Stage and commit**

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com/.worktrees/feat-seo-tier2-content-architecture
git add src/content.config.ts src/data/ src/lib/topics.ts src/lib/series.ts src/lib/related-posts.ts src/integrations/ astro.config.mjs
git commit -m "$(cat <<'EOF'
feat(seo-tier2): schema, data files, validation, lib modules

Adds topics/series/seriesIndex fields to blog schema, src/data/topics.yml
and src/data/series.yml as controlled vocabularies, lib helpers
(loadTopics, loadSeries, pickRelated), and a validate-taxonomy Astro
integration enforcing taxonomy consistency at build time. No UI changes
yet — that comes after content backfill in commit 2.

The orphan-topic check (every topic must have ≥1 published post) is
gated behind VALIDATE_TAXONOMY_REQUIRE_TOPIC_POSTS=true until the
backfill commit lands.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 2 — Backfill content (topics, series, footer-block removal)

This commit assigns `topics` to all 19 posts, `series`+`seriesIndex` to the 10 series posts, removes the structured "Full Series" footer block from the 7 WP Infra posts, and enables the orphan-topic validator check.

### Task 2.1: Finalize topic list in `src/data/topics.yml`

**Files:**
- Modify: `src/data/topics.yml`

- [ ] **Step 1: Replace `topics.yml` with the finalized list**

Use the post-content distribution analyzed during brainstorming. Suggested ~12 topics (final count can vary; rule is each topic has ≥2 posts):

```yaml
# Controlled topic vocabulary. Each slug becomes a hub page at /blog/topic/<slug>/.
# Posts opt in via the `topics: [slug]` frontmatter field. Free-form `tags` are unaffected.
# Validator enforces: every topic value in any post must exist here, and every topic
# here must have ≥1 published post.

wordpress-infrastructure:
  title: WordPress Infrastructure
  description: Self-hosted WordPress on Hetzner VPS — LEMP stack, deploys, caching, security, automation, monitoring.

caching:
  title: Caching
  description: Layered caching strategies for high-traffic WordPress and WooCommerce sites — page, object, opcode, and CDN.

devops:
  title: DevOps
  description: Server provisioning, hardening, monitoring, and automation for self-hosted infrastructure.

psychometrics:
  title: Psychometrics
  description: Item response theory, classical test theory, and custom assessment design for talent and L&D.

talent-development:
  title: Talent Development
  description: HiPo programs, cluster-based L&D budgeting, and the build-versus-buy decision for psychometric instruments.

ai-workflows:
  title: AI Workflows
  description: Building durable knowledge bases and agentic workflows for software work — Claude Code, design specs, AI-as-CTO.

product-strategy:
  title: Product Strategy
  description: Narratives, business models, and product-market positioning for builder-led companies.

seo:
  title: SEO
  description: Technical SEO, structured data, and content architecture for personal brands and small sites.

personal-brand:
  title: Personal Brand
  description: Personal sites as products — design, copy, structured data, and growth engineering for an indie consulting brand.
```

The exact slug list can be tuned during backfill; the validator catches any drift between this file and post frontmatter.

### Task 2.2: Backfill `topics` on all 19 posts

**Files:**
- Modify: every `.md` in `src/content/blog/` (19 posts).

- [ ] **Step 1: Edit each post's frontmatter to add `topics: [...]`**

Map each post to 1–3 topics. Reference assignment (use as starting point, adjust during edit if a better fit appears):

| Post | Topics |
|---|---|
| `building-a-brain-for-your-ai-cto.md` | `ai-workflows` |
| `custom-vs-offshelf-instrument.md` | `psychometrics`, `talent-development` |
| `design-spec-every-project.md` | `ai-workflows` |
| `four-workplace-personality-types-recovered-across-two-custom-psychometric-studies.md` | `psychometrics`, `talent-development` |
| `how-i-taught-ai-to-work-like-a-colleague.md` | `ai-workflows` |
| `measure-employee-engagement-custom-psychometric-work.md` | `psychometrics`, `talent-development` |
| `personal-site-as-product.md` | `personal-brand`, `seo` |
| `psychometric-analysis-university-exams.md` | `psychometrics` |
| `saas-is-dead-narrative.md` | `product-strategy` |
| `seo-architecture-before-first-visitor.md` | `seo`, `personal-brand` |
| `wp-infra-01-why-i-ditched-managed-hosting.md` | `wordpress-infrastructure`, `devops` |
| `wp-infra-02-building-the-lemp-stack.md` | `wordpress-infrastructure`, `devops` |
| `wp-infra-03-deploying-wordpress.md` | `wordpress-infrastructure`, `caching` |
| `wp-infra-04-four-layers-of-caching.md` | `wordpress-infrastructure`, `caching` |
| `wp-infra-05-locking-it-down.md` | `wordpress-infrastructure`, `devops` |
| `wp-infra-06-automating-the-boring-parts.md` | `wordpress-infrastructure`, `devops` |
| `wp-infra-07-watching-over-it-all.md` | `wordpress-infrastructure`, `devops` |
| `years-of-experience-hipo-program-design.md` | `psychometrics`, `talent-development` |

Add the line in each post's frontmatter, conventionally between `format:` and `description:`. Example diff for `wp-infra-01-why-i-ditched-managed-hosting.md`:

```diff
 format: deep-dive
+topics: [wordpress-infrastructure, devops]
 description: "I moved my WordPress and WooCommerce sites..."
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build succeeds, validator passes (every `topics` value matches `topics.yml`).

### Task 2.3: Backfill `series` + `seriesIndex` on 7 WP Infra posts

**Files:**
- Modify: `wp-infra-01` through `wp-infra-07` (`src/content/blog/wp-infra-NN-*.md`)

- [ ] **Step 1: Add series fields to each WP Infra post**

For each `wp-infra-NN-*.md`, add to frontmatter:

```yaml
series: wp-infrastructure
seriesIndex: <NN>
```

Where `<NN>` matches the filename prefix (1-based, contiguous 1..7).

- [ ] **Step 2: Remove the structured "Full Series" footer block from each WP Infra post**

Each WP Infra post ends with a block beginning at `---` (horizontal rule) and titled `## WordPress Infrastructure from Scratch — Full Series` followed by a numbered list of seven items. Example tail to remove:

```markdown
---

## WordPress Infrastructure from Scratch — Full Series

1. **Why I Ditched Managed Hosting** *(you are here)*
2. [Building the LEMP Stack](/blog/wp-infra-02-building-the-lemp-stack)
3. [Deploying WordPress the Right Way](/blog/wp-infra-03-deploying-wordpress)
4. [Four Layers of Caching](/blog/wp-infra-04-four-layers-of-caching)
5. [Locking It Down](/blog/wp-infra-05-locking-it-down)
6. [Automating the Boring Parts](/blog/wp-infra-06-automating-the-boring-parts)
7. [Watching Over It All](/blog/wp-infra-07-watching-over-it-all)
```

Delete the trailing `---` separator and everything after it on each of the 7 posts. SeriesNav (Commit 4) will render this content automatically.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: build succeeds. Validator confirms `wp-infrastructure` series has parts 1..7 contiguous.

### Task 2.4: Backfill `series` + `seriesIndex` on 3 Talent Archetypes posts

**Files:**
- Modify: `four-workplace-personality-types-recovered-across-two-custom-psychometric-studies.md`, `years-of-experience-hipo-program-design.md`, `custom-vs-offshelf-instrument.md`

- [ ] **Step 1: Add series fields by publication order**

Per CHANGELOG `0.11.12`, the publication order is:

| File | seriesIndex |
|---|---|
| `four-workplace-personality-types-recovered-across-two-custom-psychometric-studies.md` | 1 |
| `years-of-experience-hipo-program-design.md` | 2 |
| `custom-vs-offshelf-instrument.md` | 3 |

For each, add to frontmatter:

```yaml
series: talent-archetypes
seriesIndex: <N>
```

**Important:** Talent Archetypes posts have only **prose** references to other parts (e.g. "Part 2 of this series covers..."), not a structured TOC block. Leave the prose as-is — it's editorial and complements the auto-rendered SeriesNav rather than duplicating it.

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build succeeds. Validator confirms `talent-archetypes` series has parts 1..3 contiguous.

### Task 2.5: Enable the orphan-topic validator check by default

**Files:**
- Modify: `src/integrations/validate-taxonomy.ts:107` (the orphan-topic check guard)

- [ ] **Step 1: Remove the env var gate**

Find this block in `src/integrations/validate-taxonomy.ts`:

```ts
  // 4. Every topic in topics.yml must have ≥1 published post (gated by env var until backfill)
  if (process.env.VALIDATE_TAXONOMY_REQUIRE_TOPIC_POSTS === 'true') {
    const usedTopics = new Set<string>();
```

Replace with:

```ts
  // 4. Every topic in topics.yml must have ≥1 published post.
  {
    const usedTopics = new Set<string>();
```

(The braces are kept to preserve the `usedTopics` block scope.)

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build succeeds. Every topic in `topics.yml` is now required to have ≥1 post; the backfill must satisfy this. If a topic shows as orphan, drop it from `topics.yml` or assign it to a relevant post.

### Task 2.6: Commit

- [ ] **Step 1: Stage and commit**

```bash
git add src/data/topics.yml src/content/blog/ src/integrations/validate-taxonomy.ts
git commit -m "$(cat <<'EOF'
content(seo-tier2): backfill topics, series, remove WP Infra footer blocks

Assigns 1–3 topics to all 19 published posts. Adds series=wp-infrastructure
+ seriesIndex 1..7 to the 7 WP Infra posts; series=talent-archetypes +
seriesIndex 1..3 to the 3 Talent Archetypes posts. Removes the structured
"Full Series" footer block from each WP Infra post (SeriesNav will render
it auto in commit 4). Talent Archetypes prose references stay (they're
editorial, not redundant).

Enables the orphan-topic validator check by default — every topic in
topics.yml must have ≥1 published post.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 3 — Topic hub routes + index + sitemap + PostCard chip changes

UI surface for topics: index page, per-topic hubs, PostCard tag chip behavior, blog index `?tag=` redirect.

### Task 3.1: Create `TopicCard` component

**Files:**
- Create: `src/components/TopicCard.astro`

- [ ] **Step 1: Write the component**

```astro
---
interface Props {
  slug: string;
  title: string;
  description: string;
  count: number;
}
const { slug, title, description, count } = Astro.props;
---

<a
  href={`/blog/topic/${slug}/`}
  class="group block rounded-lg border bg-card text-card-foreground p-6 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
>
  <h3 class="text-lg font-bold tracking-tight group-hover:text-primary/80 transition-colors">
    {title}
  </h3>
  <p class="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
  <p class="text-xs text-muted-foreground mt-4">
    {count} {count === 1 ? 'post' : 'posts'}
  </p>
</a>
```

### Task 3.2: Create the topics index page

**Files:**
- Create: `src/pages/blog/topic/index.astro`

- [ ] **Step 1: Write the page**

```astro
---
import Base from '@/layouts/Base.astro';
import Breadcrumb from '@/components/Breadcrumb.astro';
import TopicCard from '@/components/TopicCard.astro';
import { getCollection } from 'astro:content';
import { loadTopics, getPostsForTopic } from '@/lib/topics';

const now = new Date();
const allPosts = await getCollection(
  'blog',
  ({ data }) => data.status === 'published' && data.date <= now
);
const topics = loadTopics();

const entries = [...topics.entries()]
  .map(([slug, config]) => ({
    slug,
    title: config.title,
    description: config.description,
    count: getPostsForTopic(slug, allPosts).length,
  }))
  .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));

const crumbs = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Topics' },
];
---

<Base
  title="Blog topics"
  description="Browse blog posts by topic — WordPress infrastructure, psychometrics, AI workflows, SEO, and more."
>
  <div class="container max-w-5xl mx-auto px-4 sm:px-6 py-12">
    <Breadcrumb crumbs={crumbs} />
    <h1 class="text-4xl font-bold tracking-tight mb-4" data-animate>Topics</h1>
    <p class="text-muted-foreground mb-8 max-w-2xl" data-animate>
      Browse posts by subject area. Each topic links to a curated hub of posts on that theme.
    </p>
    <div class="grid gap-4 sm:grid-cols-2">
      {entries.map((e, i) => (
        <div data-animate data-delay={String(Math.min(i + 1, 5))}>
          <TopicCard slug={e.slug} title={e.title} description={e.description} count={e.count} />
        </div>
      ))}
    </div>
  </div>
</Base>
```

### Task 3.3: Create the per-topic hub page

**Files:**
- Create: `src/pages/blog/topic/[slug].astro`

- [ ] **Step 1: Write the page**

```astro
---
import Base from '@/layouts/Base.astro';
import Breadcrumb from '@/components/Breadcrumb.astro';
import PostCard from '@/components/PostCard.astro';
import JsonLd from '@/components/JsonLd.astro';
import { getCollection } from 'astro:content';
import { loadTopics, getPostsForTopic } from '@/lib/topics';
import { SITE_URL } from '@/lib/jsonld';

export async function getStaticPaths() {
  const topics = loadTopics();
  return [...topics.keys()].map((slug) => ({ params: { slug } }));
}

const { slug } = Astro.params;
const topics = loadTopics();
const topic = topics.get(slug!);
if (!topic) {
  throw new Error(`Topic not found: ${slug}`);
}

const now = new Date();
const allPosts = await getCollection(
  'blog',
  ({ data }) => data.status === 'published' && data.date <= now
);
const posts = getPostsForTopic(slug!, allPosts);

const canonicalUrl = `${SITE_URL}/blog/topic/${slug}/`;
const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': canonicalUrl,
  url: canonicalUrl,
  name: topic.title,
  description: topic.description,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: posts.map((post, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/blog/${post.id}/`,
      name: post.data.title,
    })),
  },
};

const crumbs = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Topics', href: '/blog/topic/' },
  { label: topic.title },
];
---

<Base title={`${topic.title} — Blog`} description={topic.description}>
  <JsonLd data={collectionJsonLd} />
  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <Breadcrumb crumbs={crumbs} />
    <h1 class="text-4xl font-bold tracking-tight mb-4" data-animate>{topic.title}</h1>
    <p class="text-muted-foreground mb-8" data-animate>{topic.description}</p>
    {posts.length > 0 ? (
      <div class="grid gap-4">
        {posts.map((post, i) => (
          <div data-animate data-delay={String(Math.min(i + 1, 5))}>
            <PostCard
              title={post.data.title}
              description={post.data.description}
              date={post.data.date}
              tags={post.data.tags}
              slug={post.id}
              label={post.data.label}
            />
          </div>
        ))}
      </div>
    ) : (
      <p class="text-muted-foreground">No posts on this topic yet.</p>
    )}
  </div>
</Base>
```

Note: `Breadcrumb` exists at `src/components/Breadcrumb.astro` (used by `BlogPost.astro`). Confirm its props match `{ label, href }[]` before this step — if it expects different shape, adjust the crumbs arrays in 3.2 and 3.3 accordingly.

### Task 3.4: Modify PostCard — tag chips become non-link unless tag is a topic

**Files:**
- Modify: `src/components/PostCard.astro`

- [ ] **Step 1: Add `isTopic` import and update tag chip rendering**

Replace the tag-chips block (lines ~37–45 currently in the `<div class="flex items-center gap-3 mt-4 flex-wrap">` section) with:

```astro
{tags.length > 0 && (
  <div class="flex gap-1.5 flex-wrap">
    {tags.map((tag) =>
      isTopic(tag) ? (
        <a
          href={`/blog/topic/${tag}/`}
          class="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full hover:bg-accent transition-colors"
        >
          {tag}
        </a>
      ) : (
        <span class="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
          {tag}
        </span>
      )
    )}
  </div>
)}
```

Also add to the frontmatter imports at the top of the file:

```astro
import { isTopic } from '@/lib/topics';
```

### Task 3.5: Modify `/blog` index — replace client-side `?tag=` filter with redirect script

**Files:**
- Modify: `src/pages/blog/index.astro`
- Modify: `src/components/LabelFilter.astro`

The existing `?tag=` filter is in `LabelFilter.astro`'s inline `<script>`. Drop the dead `activeTag` branch from there, and add a tiny `?tag=` redirect at the top of `/blog/index.astro` that runs before anything else.

- [ ] **Step 1: Edit `LabelFilter.astro` — remove the `activeTag` branch**

Find the inline script in `LabelFilter.astro` (lines ~50–75). Remove the `activeTag` references entirely. The new script body:

```ts
function filterPosts() {
  const params = new URLSearchParams(window.location.search);
  const activeLabel = params.get('label');
  const articles = document.querySelectorAll<HTMLElement>('[data-post-label]');
  const filterLinks = document.querySelectorAll<HTMLAnchorElement>('#label-filter a');

  filterLinks.forEach((link) => {
    const label = link.dataset.label;
    const isActive = (!activeLabel && label === 'all') || activeLabel === label;
    link.classList.toggle('bg-primary', isActive);
    link.classList.toggle('text-primary-foreground', isActive);
    link.classList.toggle('bg-secondary', !isActive);
    link.classList.toggle('text-secondary-foreground', !isActive);
  });

  articles.forEach((article) => {
    if (!activeLabel) {
      article.style.display = '';
      return;
    }
    article.style.display = article.dataset.postLabel === activeLabel ? '' : 'none';
  });
}

filterPosts();
document.addEventListener('astro:after-swap', filterPosts);
```

- [ ] **Step 2: Add `?tag=` redirect to `/blog/index.astro`**

In `src/pages/blog/index.astro`, add a topic-slug list to the page frontmatter and a `<script>` before the page content:

In the frontmatter (top of file), add:

```ts
import { getTopicSlugs } from '@/lib/topics';
const topicSlugs = getTopicSlugs();
```

In the rendered output (inside `<Base>`, before `<div class="container">`), add:

```astro
<script is:inline define:vars={{ topicSlugs }}>
  (function () {
    const params = new URLSearchParams(window.location.search);
    const tag = params.get('tag');
    if (!tag) return;
    if (topicSlugs.includes(tag)) {
      window.location.replace('/blog/topic/' + encodeURIComponent(tag) + '/');
    } else {
      // strip the param without reload
      params.delete('tag');
      const qs = params.toString();
      window.history.replaceState(null, '', '/blog' + (qs ? '?' + qs : ''));
    }
  })();
</script>
```

- [ ] **Step 3: Verify build and behavior**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run preview` and in a browser:
- Visit `/blog?tag=wordpress-infrastructure` → should redirect to `/blog/topic/wordpress-infrastructure/`.
- Visit `/blog?tag=fail2ban` (assuming `fail2ban` is not a topic) → URL strips to `/blog`, no redirect, page renders.

### Task 3.6: Update `sitemap-blog.xml.ts` — add topic index + hubs

**Files:**
- Modify: `src/pages/sitemap-blog.xml.ts`

- [ ] **Step 1: Replace file content**

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { loadTopics, getPostsForTopic } from '@/lib/topics';

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...postUrls, topicIndexUrl, ...topicUrls].join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
```

(Series-landing entries are added in Commit 4. Keeping commits scoped.)

- [ ] **Step 2: Verify build and sitemap content**

Run: `npm run build`
Expected: build succeeds.

Run: `cat dist/sitemap-blog.xml | head -50`
Expected: includes the existing 19 post URLs plus `/blog/topic/` index plus one URL per topic in `topics.yml`.

### Task 3.7: Manual verification checklist for Commit 3

- [ ] **Step 1: Eyeball each surface**

Run: `npm run preview`

Check in a browser:
- `/blog/topic/` — H1 "Topics", grid of cards, each shows post count > 0.
- `/blog/topic/wordpress-infrastructure/` — H1 = topic title, description, list of 7 WP Infra posts.
- `/blog` — page renders, label filter chips work.
- `/blog?tag=wordpress-infrastructure` — redirects to `/blog/topic/wordpress-infrastructure/`.
- `/blog?tag=fail2ban` (a free-form tag, not a topic) — strips param, page renders.
- Open any post on `/blog`. Tag chips on its PostCard: tags matching topic slugs are clickable links; non-topic tags are plain `<span>` (rendered identically except no underline/cursor).

### Task 3.8: Commit

- [ ] **Step 1: Stage and commit**

```bash
git add src/components/TopicCard.astro src/components/PostCard.astro src/components/LabelFilter.astro src/pages/blog/index.astro src/pages/blog/topic/ src/pages/sitemap-blog.xml.ts
git commit -m "$(cat <<'EOF'
feat(seo-tier2): topic hub routes + index + sitemap + PostCard chip changes

Adds /blog/topic/ index and /blog/topic/[slug]/ hub pages with
CollectionPage JSON-LD. PostCard tag chips now render as <a> when the
tag matches a topic slug (linking to its hub) and as <span> otherwise.
/blog?tag=foo redirects to the topic hub if matched, strips the param
otherwise. LabelFilter's dead activeTag branch removed.

Sitemap-blog now emits the topic index plus one URL per topic (lastmod
= max post date in that topic).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 4 — Series routes + SeriesNav module + JSON-LD

### Task 4.1: Create the `SeriesNav` component

**Files:**
- Create: `src/components/SeriesNav.astro`

- [ ] **Step 1: Write the component**

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  current: CollectionEntry<'blog'>;
  seriesTitle: string;
  seriesSlug: string;
  parts: CollectionEntry<'blog'>[]; // sorted by seriesIndex asc
  position: 'header' | 'footer';
}

const { current, seriesTitle, seriesSlug, parts, position } = Astro.props;
const total = parts.length;
const currentIndex = current.data.seriesIndex ?? 1;
const prev = parts.find((p) => (p.data.seriesIndex ?? 0) === currentIndex - 1);
const next = parts.find((p) => (p.data.seriesIndex ?? 0) === currentIndex + 1);
---

{position === 'header' && (
  <div class="not-prose mb-8 rounded-md border bg-secondary/50 px-4 py-3 text-sm">
    <a href={`/blog/series/${seriesSlug}/`} class="hover:text-foreground transition-colors">
      <strong>Part {currentIndex} of {total}</strong> — {seriesTitle} series →
    </a>
  </div>
)}

{position === 'footer' && (
  <nav class="not-prose mt-12 border-t pt-6" aria-label="Series navigation">
    <div class="flex justify-between gap-4 mb-4">
      {prev ? (
        <a
          href={`/blog/${prev.id}/`}
          class="text-sm text-muted-foreground hover:text-foreground transition-colors max-w-[45%]"
        >
          <span class="block text-xs uppercase tracking-wider mb-1">← Previous</span>
          <span class="block">{prev.data.title}</span>
        </a>
      ) : (
        <span></span>
      )}
      {next ? (
        <a
          href={`/blog/${next.id}/`}
          class="text-sm text-muted-foreground hover:text-foreground transition-colors max-w-[45%] text-right"
        >
          <span class="block text-xs uppercase tracking-wider mb-1">Next →</span>
          <span class="block">{next.data.title}</span>
        </a>
      ) : (
        <span></span>
      )}
    </div>
    <details class="text-sm">
      <summary class="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
        All {total} parts in {seriesTitle}
      </summary>
      <ol class="mt-3 space-y-1 list-decimal list-inside">
        {parts.map((p) => {
          const isCurrent = p.id === current.id;
          return (
            <li class={isCurrent ? 'font-medium' : ''}>
              {isCurrent ? (
                <span>{p.data.title} (you are here)</span>
              ) : (
                <a href={`/blog/${p.id}/`} class="hover:text-foreground transition-colors">
                  {p.data.title}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  </nav>
)}
```

### Task 4.2: Create the series landing page

**Files:**
- Create: `src/pages/blog/series/[slug].astro`

- [ ] **Step 1: Write the page**

```astro
---
import Base from '@/layouts/Base.astro';
import Breadcrumb from '@/components/Breadcrumb.astro';
import JsonLd from '@/components/JsonLd.astro';
import { getCollection } from 'astro:content';
import { loadSeries, getSeriesPosts } from '@/lib/series';
import { SITE_URL } from '@/lib/jsonld';

export async function getStaticPaths() {
  const series = loadSeries();
  return [...series.keys()].map((slug) => ({ params: { slug } }));
}

const { slug } = Astro.params;
const series = loadSeries();
const config = series.get(slug!);
if (!config) {
  throw new Error(`Series not found: ${slug}`);
}

const now = new Date();
const allPosts = await getCollection(
  'blog',
  ({ data }) => data.status === 'published' && data.date <= now
);
const parts = getSeriesPosts(slug!, allPosts);

const canonicalUrl = `${SITE_URL}/blog/series/${slug}/`;
const seriesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWorkSeries',
  '@id': canonicalUrl,
  url: canonicalUrl,
  name: config.title,
  description: config.description,
  hasPart: parts.map((post) => ({
    '@type': 'BlogPosting',
    '@id': `${SITE_URL}/blog/${post.id}/`,
    url: `${SITE_URL}/blog/${post.id}/`,
    name: post.data.title,
    position: post.data.seriesIndex,
  })),
};

const crumbs = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: config.title },
];

const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
---

<Base title={`${config.title} — Series`} description={config.description}>
  <JsonLd data={seriesJsonLd} />
  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <Breadcrumb crumbs={crumbs} />
    <h1 class="text-4xl font-bold tracking-tight mb-4" data-animate>{config.title}</h1>
    <p class="text-muted-foreground mb-10 max-w-2xl" data-animate>{config.description}</p>
    <ol class="space-y-6">
      {parts.map((post, i) => (
        <li data-animate data-delay={String(Math.min(i + 1, 5))}>
          <article class="border-l-2 border-border pl-6">
            <p class="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Part {post.data.seriesIndex}
            </p>
            <h2 class="text-xl font-bold tracking-tight">
              <a
                href={`/blog/${post.id}/`}
                class="hover:text-primary/80 transition-colors"
              >
                {post.data.title}
              </a>
            </h2>
            <p class="text-sm text-muted-foreground mt-2 leading-relaxed">
              {post.data.description}
            </p>
            <time class="text-xs text-muted-foreground mt-2 block" datetime={post.data.date.toISOString()}>
              {formatDate(post.data.date)}
            </time>
          </article>
        </li>
      ))}
    </ol>
  </div>
</Base>
```

### Task 4.3: Modify `BlogPost.astro` — Filed-under, SeriesNav, JSON-LD

**Files:**
- Modify: `src/layouts/BlogPost.astro`

- [ ] **Step 1: Add new imports and computed values to the frontmatter**

After the existing imports, add:

```ts
import SeriesNav from '@/components/SeriesNav.astro';
import { loadTopics, getTopic } from '@/lib/topics';
import { loadSeries, getSeriesPosts } from '@/lib/series';
import { getCollection } from 'astro:content';
import { SITE_URL } from '@/lib/jsonld';
```

Extend the `Props` interface to include the new fields:

```ts
interface Props {
  title: string;
  description: string;
  date: Date;
  lastmod?: Date;
  tags: string[];
  audience: string[];
  author?: string;
  label?: string;
  topics?: string[];
  series?: string;
  seriesIndex?: number;
  crumbs: { label: string; href?: string }[];
  headings: { depth: number; slug: string; text: string }[];
}
```

Update the destructure:

```ts
const { title, description, date, lastmod, tags, audience, author, label, topics = [], series, seriesIndex, crumbs, headings } = Astro.props;
```

Add resolution logic after the `dateModified` line:

```ts
const topicEntries = topics.map((slug) => ({ slug, config: getTopic(slug) })).filter((t) => t.config);

let seriesParts: Awaited<ReturnType<typeof getCollection>> = [];
let seriesTitle: string | undefined;
if (series) {
  const allPosts = await getCollection(
    'blog',
    ({ data }) => data.status === 'published' && data.date <= new Date()
  );
  seriesParts = getSeriesPosts(series, allPosts);
  seriesTitle = loadSeries().get(series)?.title;
}
```

Extend `articleJsonLd` to include `about` and `isPartOf`:

```ts
const articleJsonLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  datePublished: date.toISOString(),
  dateModified,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': canonicalUrl,
  },
  author: authorNode,
  publisher: { '@id': PERSON_ID },
  keywords: tags.join(', '),
  ...(coverUrl ? { image: `${SITE_URL}${coverUrl}` } : {}),
};

if (topicEntries.length > 0) {
  articleJsonLd.about = topicEntries.map((t) => ({
    '@type': 'Thing',
    name: t.config!.title,
    url: `${SITE_URL}/blog/topic/${t.slug}/`,
  }));
}

if (series && seriesTitle) {
  articleJsonLd.isPartOf = {
    '@type': 'CreativeWorkSeries',
    url: `${SITE_URL}/blog/series/${series}/`,
    name: seriesTitle,
  };
}
```

(Replace the original `articleJsonLd` literal with the variable above. Note: `image` URL changed from inline string to `SITE_URL` constant — keeps `jsonld.ts` as the only place that knows the base URL.)

- [ ] **Step 2: Update the rendered template**

Find the `<header class="mb-8">` block and replace it with this version:

```astro
<header class="mb-8">
  <h1 class="text-4xl font-bold tracking-tight mb-4">{title}</h1>
  <div class="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
    <a href="/about" class="hover:text-foreground transition-colors">Blazej Mrozinski</a>
    <span>&middot;</span>
    <time datetime={date.toISOString()}>{formattedDate}</time>
    {labelConfig && label && (
      <>
        <span>&middot;</span>
        <a href={`/blog?label=${label}`} class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
          <span
            class="w-1.5 h-1.5 rounded-full"
            style={`background-color: ${labelConfig.accent};`}
            aria-hidden="true"
          />
          {labelConfig.name}
        </a>
      </>
    )}
  </div>
  {topicEntries.length > 0 && (
    <p class="text-sm text-muted-foreground mt-3">
      <span>Filed under: </span>
      {topicEntries.map((t, i) => (
        <>
          <a href={`/blog/topic/${t.slug}/`} class="hover:text-foreground transition-colors">{t.config!.title}</a>
          {i < topicEntries.length - 1 && <span> · </span>}
        </>
      ))}
    </p>
  )}
</header>
```

(The previous `tags` row inside the `<header>` is removed — per spec, tags don't appear on the post page.)

Right after the cover image block (the `{coverUrl && ...}` block) and before `<div class="prose prose-neutral...">`, add the SeriesNav header:

```astro
{series && seriesTitle && (
  <SeriesNav
    current={Astro.props as never}
    seriesTitle={seriesTitle}
    seriesSlug={series}
    parts={seriesParts as never}
    position="header"
  />
)}
```

After the `<slot />` line (i.e. after the closing `</div>` of `<div class="prose ...">`), add the SeriesNav footer:

```astro
{series && seriesTitle && (
  <SeriesNav
    current={Astro.props as never}
    seriesTitle={seriesTitle}
    seriesSlug={series}
    parts={seriesParts as never}
    position="footer"
  />
)}
```

(The `as never` casts are because `Astro.props` doesn't expose the full `CollectionEntry<'blog'>` shape; SeriesNav uses `id` and `data.seriesIndex` which the layout receives separately. Acceptable workaround: change SeriesNav to accept lighter props — `currentId: string`, `currentIndex: number` — instead of the full entry. If you prefer that path, refactor SeriesNav before this step.)

**Recommended refactor (cleaner):** Change `SeriesNav` props to:

```ts
interface Props {
  currentId: string;
  currentIndex: number;
  seriesTitle: string;
  seriesSlug: string;
  parts: CollectionEntry<'blog'>[];
  position: 'header' | 'footer';
}
```

Then mount it with:

```astro
<SeriesNav
  currentId={Astro.params.slug!}
  currentIndex={seriesIndex!}
  seriesTitle={seriesTitle}
  seriesSlug={series}
  parts={seriesParts}
  position="header"
/>
```

Update the SeriesNav body to use `currentId` and `currentIndex` instead of `current.id` and `current.data.seriesIndex`. Pick one path; do not commit the `as never` workaround.

- [ ] **Step 3: Pass new props from the post page**

`BlogPost.astro` is invoked from individual blog post entries. Astro's `getStaticPaths` for blog posts lives in `src/pages/blog/[slug].astro`. Read that file and confirm where props are passed; the call site likely currently spreads `entry.data`. If it doesn't pass `topics`, `series`, `seriesIndex`, add them.

Run: `grep -n 'BlogPost' src/pages/blog/[slug].astro`

Inspect the file. If props are passed via `<BlogPost {...entry.data} ... />` or similar, the new fields are picked up automatically (they exist on `entry.data` after the schema change). If props are listed explicitly, add the three new fields by name.

### Task 4.4: Update `sitemap-blog.xml.ts` — add series landings

**Files:**
- Modify: `src/pages/sitemap-blog.xml.ts`

- [ ] **Step 1: Append series-landing URLs**

Add an import and a new URL block. After the topics URLs section, before the `xml` template literal, add:

```ts
import { loadSeries, getSeriesPosts } from '@/lib/series';

// (existing imports above)
```

And before the `xml` const:

```ts
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
```

Update the join to include `seriesUrls`:

```ts
${[...postUrls, topicIndexUrl, ...topicUrls, ...seriesUrls].join('\n')}
```

### Task 4.5: Verify Commit 4 build and behavior

- [ ] **Step 1: Build and preview**

Run: `npm run build && npm run preview`

Browser checks:
- `/blog/series/wp-infrastructure/` — 7 ordered parts, intro text matches series.yml.
- `/blog/series/talent-archetypes/` — 3 ordered parts.
- Open `/blog/wp-infra-03-deploying-wordpress/` — header banner "Part 3 of 7 — WordPress Infrastructure series →", footer prev (Part 2) + next (Part 4) + collapsed TOC of all 7.
- Open `/blog/four-workplace-personality-types-recovered-across-two-custom-psychometric-studies/` — banner "Part 1 of 3 — Talent Archetypes series →", footer next (Part 2), no prev.
- Open any non-series post — Filed-under line near byline, no SeriesNav anywhere.
- View page source on a series post — `isPartOf` and `about` present in JSON-LD.

- [ ] **Step 2: Validate JSON-LD**

Copy a series post's JSON-LD blob into a Schema.org validator (e.g. validator.schema.org). Expect no errors.

### Task 4.6: Commit

- [ ] **Step 1: Stage and commit**

```bash
git add src/components/SeriesNav.astro src/pages/blog/series/ src/layouts/BlogPost.astro src/pages/sitemap-blog.xml.ts src/pages/blog/[slug].astro
git commit -m "$(cat <<'EOF'
feat(seo-tier2): series routes + SeriesNav module + JSON-LD additions

Adds /blog/series/[slug]/ landing pages with CreativeWorkSeries
JSON-LD. SeriesNav component renders header banner ("Part N of M") and
footer prev/next + collapsed full-series TOC on every series-post.
BlogPost layout gains a "Filed under" line linking to topic hubs;
JSON-LD now includes `about` (one Thing per topic) and `isPartOf`
(CreativeWorkSeries) when applicable. Tag chips removed from the
post-header — they live on /blog cards now.

Sitemap-blog adds one URL per series landing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 5 — Related posts module

### Task 5.1: Create the `RelatedPosts` component

**Files:**
- Create: `src/components/RelatedPosts.astro`

- [ ] **Step 1: Write the component**

```astro
---
import PostCard from '@/components/PostCard.astro';
import type { CollectionEntry } from 'astro:content';

interface Props {
  posts: CollectionEntry<'blog'>[];
}
const { posts } = Astro.props;
---

{posts.length > 0 && (
  <section class="not-prose mt-12 border-t pt-8" aria-labelledby="related-heading">
    <h2 id="related-heading" class="text-2xl font-bold tracking-tight mb-6">Related reading</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard
          title={post.data.title}
          description={post.data.description}
          date={post.data.date}
          tags={post.data.tags}
          slug={post.id}
          label={post.data.label}
        />
      ))}
    </div>
  </section>
)}
```

### Task 5.2: Mount in `BlogPost.astro` (when no series)

**Files:**
- Modify: `src/layouts/BlogPost.astro`

- [ ] **Step 1: Add import and resolution**

In the frontmatter:

```ts
import RelatedPosts from '@/components/RelatedPosts.astro';
import { pickRelated } from '@/lib/related-posts';
```

After the series resolution block, add:

```ts
let relatedPosts: typeof seriesParts = [];
if (!series) {
  const allPosts = await getCollection(
    'blog',
    ({ data }) => data.status === 'published' && data.date <= new Date()
  );
  // Build a synthetic "current post" for pickRelated. Since BlogPost.astro
  // only receives data fields, reconstruct enough for the algorithm.
  const slug = Astro.params.slug!;
  const current = allPosts.find((p) => p.id === slug);
  if (current) {
    relatedPosts = pickRelated(current, allPosts, 3);
  }
}
```

**Note on duplicate `getCollection` calls:** the series block already calls `getCollection` when `series` is set. To avoid two calls in the rare future case, you can hoist a single `allPosts` fetch above both branches:

```ts
let seriesParts: Awaited<ReturnType<typeof getCollection>> = [];
let seriesTitle: string | undefined;
let relatedPosts: typeof seriesParts = [];

if (series || true) {
  const allPosts = await getCollection(
    'blog',
    ({ data }) => data.status === 'published' && data.date <= new Date()
  );
  if (series) {
    seriesParts = getSeriesPosts(series, allPosts);
    seriesTitle = loadSeries().get(series)?.title;
  } else {
    const slug = Astro.params.slug!;
    const current = allPosts.find((p) => p.id === slug);
    if (current) relatedPosts = pickRelated(current, allPosts, 3);
  }
}
```

- [ ] **Step 2: Mount in template**

After the SeriesNav footer mount (or after `</article>`'s closing if no SeriesNav block follows), add:

```astro
{!series && relatedPosts.length > 0 && (
  <RelatedPosts posts={relatedPosts} />
)}
```

It's positioned inside the `<article>` element, after `<slot />` and after the SeriesNav footer block, so the spacing rules already in `BlogPost.astro`'s container apply.

### Task 5.3: Verify and commit

- [ ] **Step 1: Build and preview**

Run: `npm run build && npm run preview`

Browser checks:
- Open `/blog/saas-is-dead-narrative/` (single-topic `product-strategy`, no series). Bottom of page: "Related reading" + 3 cards. Pick should reflect topic-overlap (none other in `product-strategy`) → fall back to label `operator-notes`.
- Open `/blog/personal-site-as-product/` (topics `personal-brand`, `seo`). Picks should include `seo-architecture-before-first-visitor` (shares both topics).
- Open any WP Infra post. **No** Related Reading block (because `series` is set; SeriesNav covers it).

- [ ] **Step 2: Commit**

```bash
git add src/components/RelatedPosts.astro src/layouts/BlogPost.astro
git commit -m "$(cat <<'EOF'
feat(seo-tier2): related posts module on non-series posts

Adds RelatedPosts component (3-card grid, "Related reading" heading)
mounted at the bottom of BlogPost.astro only when the post has no
series set. Pick algorithm: topic-overlap (desc) → same-label tiebreak
→ date desc; falls back to same-label posts when topic-overlap is zero.
Excludes the current post and any post in the same series.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 6 — CHANGELOG + README + final verification

### Task 6.1: Update `CHANGELOG.md`

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Insert new release entry at the top**

Below the `# Changelog` heading and the intro paragraph, insert:

```markdown
## [0.13.0] — 2026-04-29 — SEO Tier 2: content architecture (topic hubs, series nav, related posts)

### Added
- **Controlled topic vocabulary** at `src/data/topics.yml` — slugs map to title + description; drives hub pages and JSON-LD.
- **Topic hub pages** at `/blog/topic/` (index) and `/blog/topic/[slug]/` (per-topic), each with `CollectionPage` JSON-LD and an `ItemList` of member posts. Replaces the previous client-side `?tag=` filter on `/blog`.
- **Series taxonomy** — frontmatter `series: <slug>` + `seriesIndex: <int>` (1-based, contiguous within a series). Series metadata at `src/data/series.yml`.
- **Series landing pages** at `/blog/series/[slug]/` with `CreativeWorkSeries` + `hasPart` JSON-LD listing parts in order.
- **`SeriesNav` component** — renders a "Part N of M" banner at the top of every series post and a prev/next + collapsed all-parts TOC at the bottom. Replaces the hand-maintained "Full Series" footer block on WP Infra posts.
- **`RelatedPosts` component** — 3-card "Related reading" block at the bottom of every non-series post. Algorithm: topic-overlap → same-label tiebreak → date desc, with same-label fallback when topic-overlap is zero.
- **"Filed under" line** near the byline of every post that has at least one topic, linking each topic to its hub.
- **Build-time taxonomy validator** (`src/integrations/validate-taxonomy.ts`) — fails the build if any post references an undefined topic/series, if `seriesIndex` values are duplicated or non-contiguous within a series, or if `topics.yml` contains an orphan slug with zero published posts.
- **Sitemap entries** for `/blog/topic/` index, every topic hub, every series landing.
- **Article JSON-LD additions:** `about` array (one `Thing` per topic) and `isPartOf` (`CreativeWorkSeries`) when applicable.

### Changed
- **`PostCard` tag chips** now render as plain `<span>` unless the tag value matches a topic slug, in which case they link to the topic hub. Style unchanged.
- **`/blog`** drops the client-side `?tag=` filter behavior. A new client-side handler maps `?tag=foo` → `/blog/topic/foo/` if the tag is a topic, otherwise strips the param. The `?label=` filter is unchanged.
- **`BlogPost.astro` header** no longer renders the tag chips row — tags live on `/blog` cards only.

### Removed
- **WP Infra "Full Series" footer link block** on Posts 1–7. SeriesNav is now the source of truth.

### Why
- **Crawlable pillar pages.** Free-form `?tag=` filters were unreliable for crawlers and accumulated no link equity. Static topic hubs become real URLs that compound authority for the topical clusters this site is trying to rank on (WordPress infrastructure, psychometrics, AI workflows, SEO).
- **Explicit series signals.** WP Infra and Talent Archetypes are the two multi-part bodies of work on this site. Hand-maintained TOC blocks were fragile (already burned us once at v0.11.13). Auto-rendered SeriesNav pulls from frontmatter — single source of truth, validates at build time, never drifts.
- **Deeper internal linking.** RelatedPosts on every non-series post deepens crawl, lifts dwell time, and reduces orphan posts. Topic-overlap algorithm uses the controlled axis we just defined; no risk of clustering on noisy free-form tags.
```

### Task 6.2: Update `README.md` if needed

**Files:**
- Modify (maybe): `README.md`

- [ ] **Step 1: Check whether README describes blog routes/collections**

Run: `grep -n -E 'blog|topic|series|content collection' README.md | head -20`

If the README has sections describing the blog content collection or routes, update them to mention the new `topics`, `series`, `seriesIndex` schema fields and the new routes (`/blog/topic/`, `/blog/series/`). If the README is purely setup/dev instructions, no change needed.

### Task 6.3: Run final verification checklist (from spec)

- [ ] **Step 1: Build clean**

Run: `rm -rf dist && npm run build`
Expected: succeeds, no validator errors, 119+ pages built (was 119 at baseline; expect ~119 + topic index + N topics + 2 series = 130+).

- [ ] **Step 2: Eyeball every surface in browser**

Run: `npm run preview`

Walk through this list:
- [ ] `/blog/topic/` renders all topics with non-zero counts.
- [ ] Every topic hub renders with H1, description, post list.
- [ ] `/blog/series/wp-infrastructure/` and `/blog/series/talent-archetypes/` render correctly with ordered parts.
- [ ] WP Infra post (e.g. `/blog/wp-infra-03-deploying-wordpress/`): banner at top, prev/next + TOC at bottom, no Related block, no orphan footer link block.
- [ ] Non-series post (e.g. `/blog/saas-is-dead-narrative/`): Filed-under near byline, Related Reading block at bottom with sensible picks, no SeriesNav.
- [ ] `/blog?tag=wordpress-infrastructure` redirects to `/blog/topic/wordpress-infrastructure/`.
- [ ] `/blog?tag=fail2ban` (a non-topic free-form tag) strips the param to `/blog`.
- [ ] View source on any post: `about` and (if applicable) `isPartOf` present in JSON-LD.
- [ ] `/sitemap-blog.xml`: includes new URLs (topic index, topic hubs, series landings); no broken entries.
- [ ] Lighthouse on `/blog/topic/wordpress-infrastructure/` and `/blog/series/wp-infrastructure/` — no critical regressions vs `/blog`.

### Task 6.4: Commit

- [ ] **Step 1: Commit**

```bash
git add CHANGELOG.md README.md
git commit -m "$(cat <<'EOF'
docs(seo-tier2): CHANGELOG entry for v0.13.0 + README sync

v0.13.0 covers the topic hubs + series nav + related posts bundle.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 6.5: Open PR to main

- [ ] **Step 1: Push branch and open PR**

```bash
git push -u origin feat/seo-tier2-content-architecture
gh pr create --title "feat(seo-tier2): topic hubs, series nav, related posts" --body "$(cat <<'EOF'
## Summary

Bundles backlog Tier 2 items #1–3 from `docs/backlog.md`:
- **Topic hubs** at `/blog/topic/` and `/blog/topic/[slug]/` — replaces the previous client-side `?tag=` filter on `/blog`.
- **Series navigation** via `series` + `seriesIndex` frontmatter, landing pages at `/blog/series/[slug]/`, auto-rendered `SeriesNav` component supersedes the hand-maintained WP Infra footer link block.
- **Related posts** module on every non-series post.

Spec: `docs/superpowers/specs/2026-04-29-seo-tier2-content-architecture-design.md`
Plan: `docs/superpowers/plans/2026-04-29-seo-tier2-content-architecture.md`

Hybrid taxonomy — controlled `topics` (in `src/data/topics.yml`) drive hub pages and JSON-LD; free-form `tags` stay as on-card flavor only. Build-time validator enforces taxonomy consistency. Six commits map to the spec's six-commit sequence.

## Test plan

- [ ] `npm run build` succeeds clean (validator passes; ~130+ pages).
- [ ] `/blog/topic/` renders all topics with non-zero counts.
- [ ] Each topic hub renders correctly.
- [ ] Both series landings (wp-infrastructure, talent-archetypes) render in order.
- [ ] WP Infra post: banner + prev/next + TOC; no Related block; no orphan footer.
- [ ] Non-series post: Filed-under + Related Reading.
- [ ] `/blog?tag=wordpress-infrastructure` redirects; `/blog?tag=fail2ban` strips.
- [ ] View source: `about` + `isPartOf` JSON-LD present where applicable.
- [ ] `/sitemap-blog.xml` includes new URLs.
- [ ] Lighthouse: no critical regressions vs `/blog`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Notes

**Spec coverage check:**
- Topic hubs (Decision 1, 2): ✅ Tasks 3.2, 3.3, 3.4, 3.5
- Hybrid tag taxonomy with topics.yml: ✅ Tasks 1.2, 2.1
- Tag chips become non-link unless topic: ✅ Task 3.4
- `?tag=` redirect/strip: ✅ Task 3.5
- Related-posts algorithm (Decision 3): ✅ Task 1.5 (algorithm) + 5.2 (mount)
- Series taxonomy (Decision 4): ✅ Tasks 1.1 (schema), 1.4 (helpers), 2.1, 2.3, 2.4 (backfill), 4.1–4.3 (UI)
- Topics index page: ✅ Task 3.2
- Filed-under on post: ✅ Task 4.3 step 2
- Sitemap entries: ✅ Tasks 3.6, 4.4
- Build-time validation: ✅ Task 1.6
- WP Infra footer block removal: ✅ Task 2.3 step 2
- CHANGELOG + version: ✅ Task 6.1 (note: package.json stays at 0.0.1 by repo convention)

**Type consistency check:** `loadTopics` returns `Map<TopicSlug, TopicConfig>` everywhere. `loadSeries` returns `Map<SeriesSlug, SeriesConfig>`. `pickRelated(current, allPosts, n)` matches its only call site in 5.2. SeriesNav has the `as never` workaround discussed but recommends a clean refactor — make sure to take the refactor path during execution.

**Placeholder scan:** No "TBD"/"TODO" in the plan body; all code blocks are complete; the only deferred decision is the exact list of topics in 2.1 (which is judgment-based and the validator catches drift).
