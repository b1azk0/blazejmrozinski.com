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

**Status:**
- Tier 1 shipped 2026-04-28 as **v0.12.0** (sitewide entity graph, ProfilePage, dateModified, ScholarlyArticle linking).
- Tier 2 #1–3 shipped 2026-04-29 as **v0.13.0** (topic hubs, series nav, related posts).
- Tier 2 #5 (Pagefind) shipped 2026-05-04 as **v0.14.0** (`/search` route + sitewide `SearchAction` JSON-LD).
- Tier 2 #4 (image sitemap) is the only remaining open Tier 2 item.
- Tier 3 #11 (Lighthouse audit) **DONE 2026-05-04** — findings below.
- Tier 3 #13–17 (audit-derived perf + a11y fixes) shipped 2026-05-04 as **v0.14.1** (`feat/seo-tier3-perf-a11y-polish`). Production Lighthouse re-run pending deploy.

**Goal:** Continue compounding the SEO work — Tier 2 is the routing/content-architecture layer (real pages where filters used to be, deeper interlinking, a search box). Tier 3 is targeted enrichment.
**Source of recommendations:** Audit done 2026-04-28 against current Astro setup (CF Pages static, custom multi-sitemap, IndexNow postbuild, Satori OG covers, glossary, RSS).

### Tier 2 — meaningful effort, real ranking impact

1. ~~**Static topic hub pages**~~ — **SHIPPED v0.13.0** (`src/pages/blog/topic/[slug].astro`, `src/data/topics.yml`).

2. ~~**Series navigation in frontmatter**~~ — **SHIPPED v0.13.0** (`series` + `seriesIndex` schema, `SeriesNav` component, `/blog/series/[slug]/` landing pages).

3. ~~**Related posts module**~~ — **SHIPPED v0.13.0** (`RelatedPosts.astro`, topic-overlap → label-tiebreak → date desc).

4. **Image sitemap** — emit `<image:image>` entries inside `sitemap-blog.xml.ts` for cover (`/covers/<slug>.png`) and inline body images. Inline images need parsing the rendered MDX/Markdown for `<img>` srcs. Currently the `/covers/*.png` files don't surface meaningfully in Google Images at scale.
   - Files: `src/pages/sitemap-blog.xml.ts`, possibly a new `src/lib/extract-post-images.ts` that walks rendered post HTML or the markdown source.
   - Add `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` namespace.

5. ~~**Pagefind static search**~~ — **SHIPPED v0.14.0** (PR #3, 2026-05-04). `/search` route powered by Pagefind UI; sitewide `SearchAction` in `getWebSiteNode()`; opt-in indexing on 7 content layouts (76 documents). Spec: `docs/superpowers/specs/2026-05-04-pagefind-static-search-design.md`. Plan: `docs/superpowers/plans/2026-05-04-pagefind-static-search.md`.

### Tier 3 — situational

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

11. ~~**Lighthouse / Core Web Vitals audit**~~ — **DONE 2026-05-04**. Findings below seed items 13–17.

12. **`SpeakableSpecification`** for voice search (read-aloud-friendly summaries on blog posts and the about page). Niche, but cheap if added alongside any other Article schema work.

### Lighthouse audit — 2026-05-04

**Tooling:** local Lighthouse v12 via `npx lighthouse`, mobile form factor, simulated 4G + 4× CPU throttling. PageSpeed Insights API was first-choice but Google has set the unauthenticated daily quota to 0; would need a free API key for repeat runs.

**Routes audited (6):** `/`, `/blog`, `/about`, `/blog/wp-infra-04-four-layers-of-caching`, `/blog/topic/wordpress-infrastructure/`, `/blog/series/wp-infrastructure/`.

| Page | Perf | A11y | BP | SEO | LCP (ms) |
|------|------|------|----|----|----------|
| `/` | 86 | 96 | 96 | 100 | 4113 |
| `/blog` | 85 | 94 | 96 | 100 | 4122 |
| `/about` | 84 | 96 | 96 | 100 | 4093 |
| `/blog/wp-infra-04-...` | 82 | 96 | 96 | 100 | 4698 |
| `/blog/topic/wordpress-infrastructure/` | 86 | 94 | 96 | 100 | 4121 |
| `/blog/series/wp-infrastructure/` | 84 | 96 | 96 | 100 | 4146 |

**What's good:** CLS=0 sitewide, TBT 7-30ms, FCP <1.1s, TTFB 44-180ms, **SEO 100 across the board** (Tier 1+2 doing their job). View Transitions / `ClientRouter` did not produce an INP regression — TBT is fine.

**What's dragging Performance down — all 4 issues are LCP-related:**

1. **Header logo is `loading="lazy"` and is the LCP element on 5 of 6 pages.** Lazy-loading defers the fetch by ~1050ms ("Resource load delay"). Logo selector: `header.sticky > div.container > a > img.block`, source `/_astro/logo-light.B1uqV4iN_1tQFix.webp` (82×40). Fix is one attribute (`loading="eager"`, optionally `fetchpriority="high"`). Estimated saving: ~1000ms LCP on every page.

2. **Trailing-slash redirect adds 800ms** on `/blog`, `/about`, `/blog/wp-infra-04-...`. Cloudflare Pages 301-redirects `/blog` → `/blog/`, but Lighthouse hits the un-slashed form. Fix: ensure all internal links emit the trailing-slash form (or add a `trailingSlash: 'always'` Astro config check). Estimated saving: 800ms LCP+FCP on affected pages.

3. **WP Infra Part 4 has font-block-on-render delay.** Different from #1 — that page's LCP is the article `<h1>` with 2047ms of pure "Element render delay" and zero resource-load time. Means the H1 paints invisible until the web font loads. Likely no `font-display: swap` and/or no `<link rel="preload">` on the heading font. Estimated saving: ~1500ms LCP on long article pages.

4. **`unused-javascript` 500ms saving** on every page — the only flagged source is GA4's `gtag.js` (160KB, 42% unused). Vendor code; not actionable without dropping analytics or moving to a partytown-style worker. Park.

**Accessibility (96/94 → 100):**

5. **`color-contrast` fails on every page** — single offender: footer changelog version badge. Selector: `<a href="/changelog" class="text-muted-foreground/40">`. The `/40` opacity drops contrast below WCAG AA. One Tailwind class change fixes all 6 pages.

6. **`heading-order` fails on `/blog` and `/blog/topic/wordpress-infrastructure/`** — `PostCard` `<h3>` follows page `<h1>` directly with no `<h2>` between. Add a (visually-hidden, optional) `<h2>` above the post grid.

**Other diagnostics, lower priority:**
- `image-size-responsive`: header logo source is exactly 82×40 — DPR>1 mobiles want a 2× source. Bundles into fix #1.
- `cache-insight`: only flags Cloudflare's own beacon JS — third-party, not actionable.

**If items 1–3 + 5–6 get fixed:** estimated LCP from ~4.2s → ~1.5–1.8s (Good band), Performance score from 84-86 → 95+, Accessibility 100. Lighthouse JSONs preserved at `/tmp/lh-audit/*-mobile.json` until next reboot.

### New Tier 3 items derived from audit

13. ~~**Eager-load the header logo**~~ — **SHIPPED v0.14.1** (`feat/seo-tier3-perf-a11y-polish`). Both `<Image>` variants in `Header.astro` got `loading="eager"` and `fetchpriority="high"`.

14. ~~**Trailing-slash internal links**~~ — **SHIPPED v0.14.1**. `astro.config.mjs` now sets `trailingSlash: 'always'`; ~30 internal hrefs across components, layouts, page-level breadcrumb arrays, the `SearchAction` `urlTemplate` in `jsonld.ts`, and one stray markdown link in `cv.md` flipped to slashed form.

15. ~~**Web-font preload**~~ — **SHIPPED v0.14.1**. `FontPreload.astro` now ships only `Geist-Variable.woff2` (mono dropped); `<link rel="preload" as="font" type="font/woff2" crossorigin>` lands in `<head>` via `Base.astro`. `font-display: swap` was already declared in `global.css`.

16. ~~**Footer changelog badge contrast**~~ — **SHIPPED v0.14.1**. `text-muted-foreground/40` → `/70`.

17. ~~**Heading order on blog index and topic hubs**~~ — **SHIPPED v0.14.1**. `<h2 class="sr-only">` added above the post grid on both `/blog/index.astro` and `/blog/topic/[slug].astro`.

### New deferred items surfaced during the polish PR

18. **Markdown body links lacking trailing slash.** With `trailingSlash: 'always'` now in effect, any author-written link in `src/content/**/*.md` of the form `[label](/blog/some-post)` (no slash, no extension) triggers a CF Pages 301 on click. The polish PR fixed one stray case (`cv.md`); a one-time grep + sweep across all markdown collections (blog posts, glossary terms, pages) would close the remaining surface.
    - Files: `src/content/blog/*.md`, `src/content/glossary/*.md`, `src/content/pages/*.md`. Could be a script.

19. **Automated link-form regression test.** The polish PR's review caught the markdown leak only because of a manual dist-wide grep. A test along the lines of "scan every `dist/**/*.html` for `href="/[a-z-]+"` (no trailing slash, no extension, no `?` or `#`) and fail the build if any survive" would prevent the next regression. Could live alongside `pagefind-check.test.mjs`.
    - Files: new `scripts/internal-links-check.test.mjs`, `npm run links:check` script.

20. **Astro dev-server vs `trailingSlash: 'always'` UX.** With the new setting, `npm run dev` returns 404 for un-slashed URLs (e.g. typing `localhost:4321/blog` in the address bar). Production CF Pages handles redirects, so the experience differs by environment. Worth one line in the README's "running locally" section so future contributors aren't confused.
    - Files: `README.md` (development section).

21. **`indexnow.ts` runs on every local build via `postbuild`.** Local `npm run build` pings IndexNow ("Submitted successfully"). Ideally gated on a CI/CF Pages env var so personal-machine builds don't ping every time.
    - Files: `scripts/indexnow.ts`.

### Why not now

Tier 2 #4 (image sitemap) is opportunistic — fold it into the next time `sitemap-blog.xml.ts` is open.

Tier 3 #6, #7, #9, #10, #12 are opportunistic — bolt onto adjacent work.

Tier 3 #18–21 are byproducts of v0.14.1; #19 and #21 are small enough to bundle into a future maintenance commit. #18 is a one-time content sweep. #20 is a README one-liner.

### Next step on resume

1. **Re-run Lighthouse against production** once v0.14.1 deploys to CF Pages — update the audit table at the top of this section with the post-fix numbers and confirm the LCP regression is closed.
2. Then either tackle Tier 2 #4 (image sitemap) or pick from the remaining Tier 3 backlog (#6 FAQ, #7 HowTo, #9 Twitter handles, #10 custom 404, #12 Speakable, or the new #18–21 byproducts).
3. Then return to Tier 2 #4 (image sitemap) or Tier 3 backlog (#6 FAQ, #7 HowTo, #9 Twitter handles, #10 custom 404, #12 Speakable) as priorities dictate.
