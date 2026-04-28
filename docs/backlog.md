# Backlog

Open ideas and partially-scoped features. Each entry is resumable — enough context to pick up cold.

---

## Highlighted / pinned blog posts

**Status:** brainstorming paused 2026-04-15, resume later
**Goal:** drive reader attention to high-value posts (e.g. the psychometric analysis / IRT post, the WordPress Hetzner infrastructure series), not just "whatever shipped most recently".

### Decisions made so far

- **Placement (agreed):** Option D from the placement mockup — small "Featured" strip on the homepage *and* a full "Editor's Picks" band at the top of `/blog`. One source-of-truth list, rendered in both places.

### Open questions (in rough order)

1. **Homepage treatment: replace, coexist, or merge the "Writing" section?**
   Currently the homepage Writing section shows the 3 most recent posts. When Featured lands, does it:
   - **Replace** the latest-3 block (simplest, but loses "what's new" for returning visitors)
   - **Coexist** as a distinct second section labeled "Featured" + existing "Latest" (clearer, longer homepage) — *Claude's recommendation*
   - **Merge** into one mixed grid of featured + latest (compact, visually muddled)

2. **Curation mechanism:**
   - `featured: true` frontmatter flag on each post (distributed, easy edit-in-place)
   - Separate `src/data/featured.yml` listing slugs in order (centralized, supports explicit ordering)
   - Hybrid: frontmatter flag + optional `featured_order: N`

3. **How many posts?** Fixed top-N (e.g. exactly 3) or variable (whatever's flagged)?

4. **Series handling:** The WP Infra series is 7 posts (5 published, 3 drafts). Featuring the whole series means… pinning all 7 cards? Pinning Part 1 as a "series entry point"? Creating a dedicated series landing page? (Note: there's no series collection in the schema today — just convention via filename prefix `wp-infra-NN-*`.)

5. **Visual treatment:** Labeled ribbon ("Editor's Pick" / "Start Here"), distinct card background, a featured-post badge on the PostCard component?

6. **Dedicated `/start-here` page:** Deferred from placement decision, but worth revisiting as a companion to the homepage/blog-index strips — sometimes the best place to tell someone "read these 5, in this order" is a standalone page.

### Relevant files

- `src/pages/index.astro` — homepage Writing section around lines 260–290
- `src/pages/blog/index.astro` — blog index, currently sorts chronological and passes `featured={i === 0}` to PostCard (positional only)
- `src/components/PostCard.astro` — `featured?: boolean` prop currently just toggles title size (`text-2xl` vs `text-lg`)
- `src/content.config.ts` — blog schema; no `featured` / `pinned` field exists yet

### Next step on resume

Answer question 1 (homepage replace/coexist/merge), then proceed through questions 2–6, then write a proper design doc to `docs/superpowers/specs/YYYY-MM-DD-featured-posts-design.md` and hand off to implementation.

---

## SEO improvements — Tier 2 & Tier 3

**Status:** Tier 1 shipped 2026-04-28 as v0.12.0 (sitewide entity graph, ProfilePage, dateModified, ScholarlyArticle linking). Tier 2 and Tier 3 deferred.
**Goal:** Continue compounding the SEO work — Tier 2 is the routing/content-architecture layer (real pages where filters used to be, deeper interlinking, a search box). Tier 3 is targeted enrichment.
**Source of recommendations:** Audit done 2026-04-28 against current Astro setup (CF Pages static, custom multi-sitemap, IndexNow postbuild, Satori OG covers, glossary, RSS).

### Tier 2 — meaningful effort, real ranking impact

Each item is independently shippable but they touch routing/build, so likely best grouped into one branch with proper testing.

1. **Static topic hub pages** — replace `/blog?tag=...` query-string filters with crawlable `/blog/topic/[tag]/` static pages. Each gets a `CollectionPage` JSON-LD, an H1 keyed off the tag, the post list, and a short tag description (sourced from a new `src/data/tags.yml` or similar). Filters are unreliable for crawlers and don't accumulate links; static hubs become pillar pages. Same for `/blog/audience/[audience]/` if worth doing.
   - Files: new `src/pages/blog/topic/[tag].astro` with `getStaticPaths`, update `PostCard`/`Header` links, retire (or 301-redirect) the `?tag=` query path.
   - Add `sitemap-blog.xml.ts` entries for hubs.
   - Decision needed: tag taxonomy is currently free-form per-post — should we lock it down to a controlled vocabulary first? Probably yes; otherwise we generate tag pages with one post on them.

2. **Series navigation in frontmatter** — add `series: <slug>` and `seriesIndex: <int>` to the blog content schema. Render explicit prev/next links at the top and bottom of each post in `BlogPost.astro`. Emit `isPartOf` JSON-LD pointing at a (new) `/blog/series/[slug]/` landing page. Big topical-clustering signal for the WP Infra series (7 parts) and Talent Archetypes (3 parts), and currently both rely on hand-maintained footer links — fragile (we just shipped a fix for missing WP Infra footer links in v0.11.13).
   - Files: `src/content.config.ts`, `src/layouts/BlogPost.astro`, new `src/pages/blog/series/[slug].astro`, new `src/data/series.yml` for series titles/descriptions.
   - Migration: backfill `series` field on existing WP Infra and Talent Archetypes posts.

3. **Related posts module** at the bottom of `BlogPost.astro` — 3 cards, tag-or-label-match. Reduces orphan posts, deepens crawl, lifts dwell time. Already have all the data via `getCollection('blog')`. Decision: tag overlap (Jaccard) vs same-label vs author-curated `related: [slugs]` field. Probably tag-overlap with label tiebreak is enough; revisit if results look weird.
   - Files: `src/layouts/BlogPost.astro`, possibly a new `src/components/RelatedPosts.astro`.

4. **Image sitemap** — emit `<image:image>` entries inside `sitemap-blog.xml.ts` for cover (`/covers/<slug>.png`) and inline body images. Inline images need parsing the rendered MDX/Markdown for `<img>` srcs. Currently the `/covers/*.png` files don't surface meaningfully in Google Images at scale.
   - Files: `src/pages/sitemap-blog.xml.ts`, possibly a new `src/lib/extract-post-images.ts` that walks rendered post HTML or the markdown source.
   - Add `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` namespace.

5. **Pagefind static search** — zero infra (builds at `astro build`), ~100 KB JS on the search route. Two payoffs: (a) on-site search makes the existing `WebSite` JSON-LD `potentialAction` → `SearchAction` legit, unlocking the SERP sitelinks search box; (b) actually useful for visitors landing on a deep glossary or blog post.
   - Files: add `pagefind` as a dev dep, hook into `postbuild` in `package.json` (after IndexNow), new `src/pages/search.astro`, update `getWebSiteNode()` in `src/lib/jsonld.ts` to include the SearchAction.
   - Tradeoff: another postbuild step; bundle weight only loads on the search page if implemented carefully.

### Tier 3 — situational

These are small, opt-in, or dependent on other work landing first.

6. **`FAQPage` schema for posts that have Q&A structure.** Auto-detect from H2/H3 patterns ("How does…?", "Why do…?", "What is…?") or opt-in via a `faq` frontmatter array. Tutorial posts (WP Infra series) and explainer posts are good fits. Don't over-apply — invalid FAQ markup gets penalized.
   - Files: `src/content.config.ts`, `src/layouts/BlogPost.astro`.

7. **`HowTo` / `TechArticle` schema** for tutorial-style posts. The WP Infra series is the obvious candidate — every part is a step-by-step. Either a `howto` frontmatter block (steps array) or auto-render from `<ol>` blocks in posts marked `format: tutorial`. Probably worth doing only on posts where the tutorial structure is explicit and stable.
   - Files: same as #6.

8. **`hreflang` wiring** — only relevant when the paused PL i18n branch (`feat/polish-i18n`, PR #1) ships. Need to coordinate with `Base.astro` SEO component: emit `<link rel="alternate" hreflang>` for both `en` and `pl`, plus `x-default`. Also extend custom sitemaps to include `xhtml:link` alternates per URL.
   - Note: per global memory, PL translation is manual-only and the branch is paused on Blazej's manual pass.

9. **Twitter `site` / `creator` handles in SEO.astro**, **`og:image:alt`** for accessibility + minor signal, **`og:image:type` `image/png`** to be explicit. Quick win, ~10 line diff.
   - Files: `src/components/SEO.astro`.

10. **Custom 404 page** with cross-section navigation (Latest 3 posts, top glossary entries, contact link). Currently no `src/pages/404.astro` — Cloudflare Pages serves a generic one. A linked 404 reduces wasted crawl budget on dead URLs and keeps users in-funnel.
    - File: new `src/pages/404.astro`.

11. **Lighthouse / Core Web Vitals audit** on the live CF Pages site. Can't tell from code alone whether LCP/CLS/INP are fine — most likely they are (static + Tailwind + lazy-loaded images), but worth confirming. If anything, the `ClientRouter` (Astro view transitions) could create an INP regression on slow devices.
    - Action: run Lighthouse on `/`, `/blog`, a long blog post, `/about`. Document findings here.

12. **`SpeakableSpecification`** for voice search (read-aloud-friendly summaries on blog posts and the about page). Niche, but cheap if added alongside any other Article schema work.

### Why not now

Tier 2 is mostly routing/build changes — they want a single, well-tested branch (or a few), not piecemeal commits. Worth doing when there's a clear free week to focus, ideally before publishing the next big content cluster so newly published posts get the structural lift from day one.

Tier 3 is opportunistic — bolt onto adjacent work (e.g. add `FAQPage` schema next time editing `BlogPost.astro`; add custom 404 next time touching pages; address Twitter handles next time SEO.astro is open).

### Next step on resume

1. Pick Tier 2 group #1–3 (topic hubs, series nav, related posts) for the first PR — they share `BlogPost.astro` edits and a content-schema migration, so bundling makes sense.
2. Write a design doc at `docs/superpowers/specs/YYYY-MM-DD-seo-tier2-content-architecture.md` covering: tag taxonomy decision, redirect strategy for old `?tag=` URLs, series/related-posts data flow.
3. After merge, schedule a Lighthouse audit (Tier 3 #11) before deciding whether to ship Pagefind (Tier 2 #5).
