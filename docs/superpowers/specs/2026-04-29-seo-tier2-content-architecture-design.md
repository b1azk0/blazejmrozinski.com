# SEO Tier 2 — content architecture (topics, series, related posts)

**Status:** approved (brainstorming complete 2026-04-29)
**Branch:** `feat/seo-tier2-content-architecture`
**Worktree:** `.worktrees/feat-seo-tier2-content-architecture`
**Source backlog item:** `docs/backlog.md` → "SEO improvements — Tier 2 & Tier 3" → Tier 2 items #1, #2, #3
**Predecessor:** v0.12.0 shipped Tier 1 (sitewide entity graph, ProfilePage, dateModified, ScholarlyArticle linking)
**Target version:** v0.13.0

## Goal

Replace the current client-side `?tag=` filter on `/blog` with crawlable static topic-hub pages, add explicit series navigation that supersedes the hand-maintained footer link blocks in WP Infra posts, and add a related-posts module to the bottom of every non-series post. These three changes share a content-schema migration and several `BlogPost.astro` edits, so they ship together.

The goal is compounding SEO: pillar pages that accumulate authority for topical clusters, explicit series signals for multi-part work, and deeper internal linking to reduce orphan posts.

## Non-goals

- Image sitemap (Tier 2 #4) — separate spec.
- Pagefind static search (Tier 2 #5) — separate spec.
- FAQ/HowTo/TechArticle schema (Tier 3 #6, #7) — bolt onto adjacent work later.
- hreflang (Tier 3 #8) — blocked on PL i18n shipping.
- Twitter handles, custom 404, Lighthouse audit, Speakable (Tier 3 #9–12).
- Audience hubs (`/blog/audience/[audience]/`) — values are coarse and co-occur; would be near-duplicates of label hubs. Revisit when audience taxonomy gets editorial work.
- `/blog/series/` listing index — only two series exist; revisit at ≥4.
- Editorial `related: [slug, slug]` frontmatter override — YAGNI; topic membership gives sufficient editorial control.
- Featured/pinned posts (separate backlog item, paused brainstorm).
- Homepage changes. Homepage Writing section keeps its current "latest 3" behavior.

## Decisions resolved during brainstorming

1. **Tag taxonomy: hybrid model.** Free-form `tags` stay as on-card flavor (display only). A new controlled `topics` axis drives hub pages. Posts opt into topics via a new `topics: [slug]` frontmatter field. Topic metadata (title, description) lives in `src/data/topics.yml`.
2. **Tag chips and old `?tag=` URLs: Option A.** Tag chips become non-link `<span>`s unless the tag value matches a topic slug, in which case they link to the topic hub. Client-side `?tag=` filtering on `/blog` is removed. A small redirect script on `/blog` maps `?tag=foo` → `/blog/topic/foo/` if matched, or strips the param.
3. **Related-posts algorithm: A+D.** Series-aware first — if a post has `series` set, the series module replaces the related block. Otherwise pure topic-overlap with label-tiebreak with date-tiebreak: rank candidates by shared-topic count (desc), break ties by same-label, then by date (desc). If zero shared topics, fall back to same-label posts (newest first). Excludes the current post and any post in the same series. No curated `related: []` field.
4. **Series taxonomy.** Frontmatter: `series: <slug>` and `seriesIndex: <int>` (1-based). Metadata in `src/data/series.yml`. Landing pages at `/blog/series/[slug]/`. Existing hand-maintained "All parts in this series" footer link blocks in WP Infra posts are removed during backfill — the new SeriesNav module is the source of truth. Series slugs use editorial-readable names (`wp-infrastructure`, `talent-archetypes`), not filename shorthand. `seriesIndex` is explicit (not inferred from filename).
5. **Scope edges.** Topics index page (`/blog/topic/`) ships. Topics surface on the post page as a "Filed under" line near the byline. Sitemap entries added for topic index, every topic hub, every series landing. Build-time validation enforces consistency.

## Architecture

### New data files

**`src/data/topics.yml`** — controlled topic vocabulary. Keyed by slug:

```yaml
wordpress-infrastructure:
  title: WordPress Infrastructure
  description: Self-hosted WordPress on Hetzner VPS, from LEMP stack to monitoring.
psychometrics:
  title: Psychometrics
  description: Item response theory, classical test theory, custom assessment design.
ai-workflows:
  title: AI Workflows
  description: Building durable knowledge bases and agentic workflows for software work.
# … ~10–15 entries total, finalized during implementation
```

The exact slug list is finalized during commit 1 of the implementation; expected ~10–15 topics. Each topic must have ≥1 published post (validator enforces this).

**`src/data/series.yml`** — controlled series vocabulary. Keyed by slug:

```yaml
wp-infrastructure:
  title: WordPress Infrastructure
  description: A 7-part deep dive on running WordPress on a Hetzner VPS — LEMP stack, deploys, caching, security, automation, monitoring.
talent-archetypes:
  title: Talent Archetypes
  description: A 3-part series on the four workplace personality types recovered across two custom psychometric studies.
```

### Content schema additions

`src/content.config.ts`, blog collection:

```ts
topics: z.array(z.string()).default([]),
series: z.string().optional(),
seriesIndex: z.number().int().positive().optional(),
```

Existing fields (`tags`, `audience`, `format`, `label`, `status`, `safety_review`, `lastmod`, etc.) are unchanged.

### New lib modules

**`src/lib/topics.ts`**
- `loadTopics()` → reads and parses `src/data/topics.yml`, returns `Map<slug, { title, description }>`.
- `getTopic(slug)` → single topic or `undefined`.
- `getPostsForTopic(slug, posts)` → filters posts whose `topics` include `slug`, sorted desc by date.

**`src/lib/series.ts`**
- `loadSeries()` → reads and parses `src/data/series.yml`, returns `Map<slug, { title, description }>`.
- `getSeries(slug)` → single series or `undefined`.
- `getSeriesPosts(slug, posts)` → filters posts whose `series === slug`, sorted asc by `seriesIndex`.

**`src/lib/related-posts.ts`**
- `pickRelated(post, allPosts, n = 3)` → returns up to `n` related posts using the algorithm in Decision 3. Excludes the current post and any post sharing the same `series`.

### Build-time validation

A new Astro integration at `src/integrations/validate-taxonomy.ts` (or equivalent prebuild script) hooks into `astro:build:start` and walks `getCollection('blog')`. It asserts:

1. Every value in any post's `topics` array exists as a key in `src/data/topics.yml`.
2. Every `series` value exists as a key in `src/data/series.yml`.
3. Within each series, `seriesIndex` values are unique and form a contiguous 1..N (no gaps, no duplicates).
4. Every topic in `topics.yml` has ≥1 published post (no orphan topics).
5. Posts with `series` set must also have `seriesIndex` set.

Violations throw with messages like:

```
[validate-taxonomy] Post 'wp-infra-03-deploying-wordpress' references topic 'caching' which is not defined in src/data/topics.yml
[validate-taxonomy] Series 'wp-infrastructure' has gap at seriesIndex=4 (parts: 1,2,3,5,6,7)
[validate-taxonomy] Topic 'business-models' has zero published posts
```

Build fails on any violation. This is the only test layer for this PR (the repo has no test runner configured, and validators + a successful build cover the regressions that matter).

### New routes

| Route | Purpose | JSON-LD |
|---|---|---|
| `/blog/topic/` | Index of all topics — H1 "Topics", grid of TopicCards (title, description, post count, link) | none beyond Base |
| `/blog/topic/[slug]/` | Topic hub — H1, description, sorted post list (reuses PostCard) | `CollectionPage` with `mainEntity` = `ItemList` of post URLs + names |
| `/blog/series/[slug]/` | Series landing — H1, intro, ordered parts list (title, dek, date) | `CreativeWorkSeries` + `ItemList` of parts in `seriesIndex` order |

`/blog/series/` (the index) is **not** shipped — only two series exist; revisit at ≥4.

### Modified routes / components

**`src/pages/blog/index.astro`** — drop client-side `?tag=` filter behavior. Add a small `<script>` that on load reads `?tag=` and either `window.location.replace`s to `/blog/topic/<tag>/` (if matched against the loaded topics list) or strips the param. Card rendering unchanged.

**`src/components/PostCard.astro`** — tag chips render as `<span>` (not `<a>`) unless the tag value matches a topic slug, in which case they render as `<a>` linking to `/blog/topic/[slug]/`. Visual styling unchanged. Label chip behavior unchanged.

**`src/layouts/BlogPost.astro`** —
- Adds a "Filed under: Topic A · Topic B" line near the byline/date, linking each topic to its hub. Renders only if `topics.length > 0`.
- If `series` is set: mounts `<SeriesNav>` at the top of the post body (banner: "Part 3 of 7 — [WordPress Infrastructure series →]") and at the bottom (prev/next links + collapsed `<details>` TOC of all parts).
- If `series` is **not** set: mounts `<RelatedPosts>` at the bottom of the post body.
- JSON-LD additions on the `BlogPosting` graph node:
  - `about: [{ "@type": "Thing", name, url }]` — one entry per topic, `url` pointing to the topic hub.
  - `isPartOf: { "@type": "CreativeWorkSeries", url, name }` — present only if `series` is set.

**`src/components/LabelFilter.astro`** — remove the dead `activeTag` branch from the inline filter script (the `?tag=` path is gone). The `?label=` path stays as-is.

**`src/pages/sitemap-blog.xml.ts`** — add entries for `/blog/topic/`, every `/blog/topic/[slug]/`, every `/blog/series/[slug]/`. `changefreq=weekly` and `priority=0.7` for hubs/landings, `priority=0.6` for the topics index. `lastmod` for each topic hub = max `lastmod`/`date` across its member posts. `lastmod` for each series landing = max `lastmod`/`date` across its parts.

### New components

**`src/components/SeriesNav.astro`** — header banner ("Part N of M — [Series Title series →]" linking to landing) and footer block (prev/next part links + a collapsed `<details>` listing every part with title and date). Receives the current post and the full list of series posts as props.

**`src/components/RelatedPosts.astro`** — heading "Related reading" + 3 PostCards. Receives the picked posts as a prop (the page resolves them via `pickRelated()`).

**`src/components/TopicCard.astro`** — small card used on `/blog/topic/`: topic title (link), description, post count.

## User-facing surface (UX summary)

- **`/blog`** — unchanged visually; tag chips on cards may now be plain text or hub links depending on whether the tag is a topic; `?tag=foo` URLs redirect to topic hubs or strip.
- **`/blog/topic/`** — new: H1 "Topics", lead sentence, grid of topic cards.
- **`/blog/topic/[slug]/`** — new: H1 = topic title, description as lede, chronological post list (PostCard).
- **`/blog/series/[slug]/`** — new: H1 = series title, intro paragraph, ordered parts list (Part 1, Part 2, …) with title/dek/date.
- **Individual post page** — gains "Filed under" line near byline; series posts get header banner + footer prev/next + TOC; non-series posts get a Related Reading block at the bottom; existing hand-maintained WP Infra footer link blocks are removed.

## JSON-LD

- **Topic hub** — `CollectionPage` (id = canonical hub URL, `name` = topic title, `description`, `mainEntity` = `ItemList` of `{ position, url, name }` per post).
- **Series landing** — `CreativeWorkSeries` (id = canonical landing URL, `name`, `description`) with `hasPart` = `ItemList` of parts in `seriesIndex` order.
- **Post page** (in addition to existing `BlogPosting`):
  - `about` = array of `Thing` entries (one per topic, with `name` and `url`).
  - `isPartOf` = `CreativeWorkSeries` reference (present only if `series` is set).

## Migration / commit sequence

One PR, multiple commits, branch `feat/seo-tier2-content-architecture` (worktree off `main`).

### Commit 0 — branch hygiene (this commit)

- Add `.worktrees/` to tracked `.gitignore`.
- Add this spec doc to `docs/superpowers/specs/2026-04-29-seo-tier2-content-architecture-design.md`.

### Commit 1 — schema, data files, validation (no UI)

- Add `topics`, `series`, `seriesIndex` fields to blog schema in `src/content.config.ts`.
- Create `src/data/topics.yml` with finalized ~10–15 topics (titles + descriptions).
- Create `src/data/series.yml` with `wp-infrastructure` and `talent-archetypes`.
- Create `src/lib/topics.ts`, `src/lib/series.ts`, `src/lib/related-posts.ts`.
- Add `src/integrations/validate-taxonomy.ts` (or equivalent prebuild script in `package.json`) and wire it into `astro.config.mjs`.
- Validators are tolerant of empty `topics`/`series` until backfill happens. Topic-has-posts check (#4) is gated behind an env flag in this commit (enabled in commit 2).
- **Verification:** `npm run build` succeeds.

### Commit 2 — backfill content

- Edit all 19 published posts to add `topics: [...]` (1–3 per post).
- Edit 7 WP Infra posts: add `series: wp-infrastructure`, `seriesIndex: 1..7`. Remove the hand-maintained "All parts in this series" footer link blocks from each.
- Edit 3 Talent Archetypes posts: add `series: talent-archetypes`, `seriesIndex: 1..3`.
- Enable the topic-has-posts validator (must pass).
- **Verification:** `npm run build` succeeds, all 19 posts emit, validator passes with all checks enabled.

### Commit 3 — topic hub routes + index + sitemap

- `src/pages/blog/topic/index.astro`, `src/pages/blog/topic/[slug].astro`, `src/components/TopicCard.astro`.
- Update `src/pages/sitemap-blog.xml.ts` to include topic index + each hub.
- Update `src/components/PostCard.astro`: tag chips become non-link unless they match a topic slug.
- Update `src/pages/blog/index.astro`: replace client-side `?tag=` filter with the redirect-or-strip script.
- Update `src/components/LabelFilter.astro`: remove dead `activeTag` branch.
- **Verification:** every topic hub renders; sitemap entries correct; `/blog?tag=hetzner` (assuming `hetzner` is a topic) redirects to `/blog/topic/hetzner/`; `/blog?tag=fail2ban` (not a topic) strips param.

### Commit 4 — series routes + module + JSON-LD

- `src/pages/blog/series/[slug].astro`.
- `src/components/SeriesNav.astro`.
- Update `src/layouts/BlogPost.astro`: add Filed-under line, mount `<SeriesNav>` when `series` set, add `about` and `isPartOf` to JSON-LD.
- Update `src/pages/sitemap-blog.xml.ts` to include each series landing.
- **Verification:** WP Infra posts render the new module; prev/next work end-to-end; series landing pages validate; JSON-LD passes Schema.org validator.

### Commit 5 — related posts module

- `src/components/RelatedPosts.astro`.
- Mount in `src/layouts/BlogPost.astro` only when `series` is unset.
- **Verification:** non-series posts show 3 picks via topic-overlap; topic-zero posts (if any remain) fall back to label-only.

### Commit 6 — CHANGELOG + version bump

- Update `CHANGELOG.md` (per global rule).
- Bump `package.json` version to `0.13.0` (minor — meaningful new surfaces, no breaking change).
- Update `README.md` if blog/architecture sections describe content collections or routes.

## Manual verification checklist (before opening PR)

- [ ] `npm run build` succeeds clean.
- [ ] `/blog/topic/` renders all topics with non-zero counts.
- [ ] Each topic hub renders with H1, description, post list.
- [ ] `/blog/series/wp-infrastructure/` and `/blog/series/talent-archetypes/` render correctly.
- [ ] WP Infra post: banner at top, prev/next + TOC at bottom, no Related block, no orphan footer link block.
- [ ] Non-series post: Filed-under near byline, Related Reading block at bottom with sensible picks.
- [ ] `/blog?tag=hetzner` redirects to `/blog/topic/hetzner/` (assuming it's a topic).
- [ ] `/blog?tag=fail2ban` strips param to `/blog`.
- [ ] Post-page view source: `about` and `isPartOf` (if applicable) present in JSON-LD.
- [ ] `/sitemap-blog.xml`: new URLs present, no broken entries.
- [ ] Lighthouse on `/blog/topic/wordpress-infrastructure/` and a series landing — no regressions vs `/blog`.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Backfill assigns wrong topics, leading to weak hubs | Topics list is finalized in commit 1 with explicit titles + descriptions; backfill is reviewed post-commit-2 before merging |
| Old `?tag=foo` URLs already indexed | Redirect script on `/blog` handles them; sitemap drops the old query URLs implicitly (they were never sitemapped) |
| Series gaps after future post additions | Build-time validator catches non-contiguous `seriesIndex` |
| Dropping client-side filter breaks bookmarked URLs | Redirect script handles all `?tag=` URLs (matched → hub, unmatched → /blog) |
| `BlogPost.astro` already large; this adds three new modules | New modules live as separate components; `BlogPost.astro` only mounts them. If layout grows past ~200 lines, factor a `<PostMeta>` component |
| WP Infra footer link blocks reference exact slugs and break if posts are renamed | They're being removed; SeriesNav uses canonical slugs from frontmatter, no string matching |

## Open items for implementation phase

- Final list of topic slugs in `src/data/topics.yml` (will be drafted in commit 1, reviewed before commit 2 backfill).
- Whether to use a custom Astro integration vs a `prebuild` npm script for the validator (pick whichever the implementing session finds simpler — both are equivalent for our purposes).
- Whether the topics index page (`/blog/topic/`) gets included in `Header.astro` nav. Default: no. Discoverable via `/blog`-page links and footer if needed.

## Next step

Hand off to `superpowers:writing-plans` to draft a detailed implementation plan against this spec.
