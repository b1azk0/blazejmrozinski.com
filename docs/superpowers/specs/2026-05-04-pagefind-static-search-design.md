# Pagefind static search

**Date:** 2026-05-04
**Branch:** `feat/seo-tier3-pagefind-search`
**Status:** Spec — approved by Blazej; awaiting implementation plan.

## Why this exists

The site has a `WebSite` JSON-LD node emitted sitewide from `Base.astro` (added in v0.12.0, Tier 1 entity graph). It currently lacks a `potentialAction` → `SearchAction`. Google won't consider showing a sitelinks search box on brand SERP without one, and the action only counts if the target URL actually performs search. Pagefind is the smallest path to a real on-site search that lets us legitimately declare the action. Secondary win: visitors landing on a deep glossary or blog post get a way to find adjacent content.

This is **Tier 2 item #5** from `docs/backlog.md`. Tier 2 #1–3 shipped in v0.13.0 (topic hubs, series nav, related posts). Tier 2 #4 (image sitemap) and Pagefind (#5) are the remaining open Tier 2 items.

The Tier 3 Lighthouse audit (2026-05-04, also in `docs/backlog.md`) found LCP at 4.0–4.7s sitewide. That outcome is what informs the **bundle-scope** decision below — sitewide JS would undo the perf wins we want to ship next.

## Decisions

Three brainstorming questions answered on 2026-05-04:

| # | Question | Choice | Why |
|---|----------|--------|-----|
| 1 | Entry point + bundle scope | **A — dedicated `/search` page only** | Pagefind JS loads on `/search` only; zero perf cost on every other page. Site traffic is mostly inbound from search engines onto long-form posts; those readers don't need a search bar above the fold. A real `/search` URL is also what makes the `SearchAction` JSON-LD legitimate. |
| 2 | Index scope | **B — blog + glossary + companies + projects + publications + about + cv** | Covers all real "destination" content (~70 docs). Excludes navigation/listing pages (`/blog`, `/blog/topic/…`, `/blog/series/…`, `/work`, `/projects`), photography (visual, no useful indexable text), the noindex'd changelog, and the paused PL routes. PL exclusion is temporary — when i18n unpauses, switch to a per-locale Pagefind config. |
| 3 | UI flavor | **A — default Pagefind UI** | Search is a low-traffic destination on this site. Most design effort would be invisible. Default UI themed via CSS variables to the site's palette + serif/sans stack ships fast. Swapping to a custom UI later is straightforward — Pagefind's index doesn't care which UI consumes it. |

## Scope

**In:**
1. New `/search` route serving the default Pagefind UI, themed to site palette, seeded from `?q=` query param.
2. `pagefind` added as dev dep; `postbuild` chains `pagefind --site dist` before the existing `indexnow.ts`.
3. `data-pagefind-body` opt-in attribute added to the content layouts in scope #2; `data-pagefind-ignore` on `<header>` and `<footer>`.
4. `getWebSiteNode()` in `src/lib/jsonld.ts` gains `potentialAction: SearchAction`.
5. `robots.txt` disallows `/pagefind/` (the bundle assets, not the search route).
6. Footer gains a "Search" nav link.

**Out:**
- Header search box / cmd-K modal (rejected in Q1).
- Per-locale (PL) Pagefind index (defer until PL i18n unpauses).
- Custom result cards using `PostCard` (rejected in Q3).
- Search analytics (queries that fail / succeed) — possible later GA4 event work.
- Image-search facets — content is text-driven.

## Architecture

### Files touched

**New:**
- `src/pages/search.astro` — the route. Mounts default Pagefind UI in a `<div id="search">`, themes via CSS variables, reads `?q=` and seeds search input. `<meta name="robots" content="noindex">`.

**Modified:**
- `package.json` — adds `pagefind` (^1.x) to `devDependencies`; `postbuild` becomes `pagefind --site dist && node --import tsx scripts/indexnow.ts`.
- `src/lib/jsonld.ts` — `getWebSiteNode()` gains `potentialAction`.
- `src/components/Header.astro` — `data-pagefind-ignore` on `<header>`.
- `src/components/Footer.astro` — `data-pagefind-ignore` on `<footer>`; add "Search" link.
- `src/layouts/BlogPost.astro` — `data-pagefind-body` on `<article>`. `data-pagefind-ignore` on `SeriesNav`, `RelatedPosts`, "Filed under" line so they don't pollute snippets.
- `src/pages/glossary/[term].astro` — `data-pagefind-body` on `<main>`.
- `src/pages/work/[slug].astro` — `data-pagefind-body` on `<main>`.
- `src/pages/projects/[slug].astro` — `data-pagefind-body` on `<main>`.
- `src/pages/publications.astro` — `data-pagefind-body` on `<main>`.
- `src/pages/about.astro` — `data-pagefind-body` on `<main>`.
- `src/pages/cv.astro` — `data-pagefind-body` on `<main>`.
- `public/robots.txt` — `Disallow: /pagefind/`.

**Not touched (intentional):**
- Listing pages (`/blog`, `/blog/topic/...`, `/blog/series/...`, `/work`, `/projects`, photography) — by not opting in, they're invisible to Pagefind once any page uses `data-pagefind-body`.
- Changelog routes — already noindex; no need to re-exclude.
- PL routes — same reason as listings; no opt-in, no index.

### Build pipeline

```
npm run build
  └─ astro:build → writes dist/
  └─ postbuild:
       1. pagefind --site dist
          → writes dist/pagefind/{pagefind.js, pagefind-ui.js, pagefind-ui.css, fragment/, index/, ...}
       2. node --import tsx scripts/indexnow.ts
```

Order matters: Pagefind has to run after Astro's build (it walks the rendered HTML in `dist/`) and before deploy. IndexNow is unaffected by Pagefind output but runs second to keep the existing IndexNow ping behavior intact.

CF Pages publishes the entire `dist/` directory so the Pagefind bundle ships alongside the site. No CDN configuration needed.

### Per-result metadata

Pagefind picks up the page `<title>` automatically. Add explicit `data-pagefind-meta` attributes on each opted-in layout:

| Layout | `kind` | `date` |
|--------|--------|--------|
| `BlogPost.astro` | `blog` | `frontmatter.date` (ISO) |
| `glossary/[term].astro` | `glossary` | — |
| `work/[slug].astro` | `company` | — |
| `projects/[slug].astro` | `project` | — |
| `publications.astro` | `publication` | — |
| `about.astro` | `page` | — |
| `cv.astro` | `page` | — |

`kind` lets the UI render a small label per result (default UI supports custom meta rendering via `processResult`). `date` lets us add a "newest first" sort later without re-indexing.

### Search route UX

`/search.astro`:

1. Same `Base` layout as the rest of the site.
2. `<h1>Search</h1>`, short subhead ("Search across the blog, glossary, work, and writing"), `<div id="search"></div>` mount point.
3. `<link rel="stylesheet" href="/pagefind/pagefind-ui.css">` plus a small `<style>` block mapping Pagefind's CSS variables to the site's Tailwind tokens:
   - `--pagefind-ui-primary` → site primary
   - `--pagefind-ui-background` / `--pagefind-ui-text` → site background / foreground
   - `--pagefind-ui-border` → site border
   - `--pagefind-ui-tag` → muted background for `kind` chips
   - `--pagefind-ui-font` → site sans family
4. Module script that imports `/pagefind/pagefind-ui.js`, instantiates `new PagefindUI({ element: '#search', showImages: false, resetStyles: false })`, and on mount reads `new URLSearchParams(location.search).get('q')` → calls `pagefindUI.triggerSearch(q)` if present.
5. `<meta name="robots" content="noindex">`.
6. **View Transitions interaction:** Pagefind UI mutates DOM on init. Astro's `ClientRouter` morphs DOM on navigation. To avoid Pagefind's mount running against a stale DOM, the link to `/search` in the footer gets `data-astro-reload` (forces a full page load, simplest fix). Alternative is wiring `astro:page-load` to re-init Pagefind UI; reload is cheaper to maintain.

### JSON-LD `SearchAction`

`getWebSiteNode()` in `src/lib/jsonld.ts` returns:

```ts
{
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: 'Blazej Mrozinski',
  description: '…',
  inLanguage: 'en-US',
  publisher: { '@id': PERSON_ID },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}
```

Emitted sitewide because `Base.astro` puts the WebSite node into every page's `@graph`.

## Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| Pagefind UI's default font stack leaks into search results, breaking visual consistency | Override `--pagefind-ui-font` and audit final rendered DOM during dev. |
| `ClientRouter` (Astro view transitions) breaks Pagefind UI mount on navigation | `data-astro-reload` on the footer's "Search" link — forces full page load on entry to `/search`. Simpler than re-initializing Pagefind UI on `astro:page-load`. |
| `trailingSlash` mismatch — `/search` vs `/search/` | Confirm during dev which form CF Pages serves. Pick one canonical, 301 the other. (Related to audit finding #14 but small enough to handle inline.) |
| Pagefind index size larger than expected on mobile | Verify size after first build (`ls -la dist/pagefind/index/`). Expected 30–80 KB compressed for ~70 documents at this content density. If oversized, scope can tighten. |
| `data-pagefind-body` on `BlogPost.astro` accidentally indexes `SeriesNav` / `RelatedPosts` / "Filed under" chrome | Add `data-pagefind-ignore` on those specific elements — declarative and verifiable. |
| Pagefind CLI fails the build on macOS / CI Cloudflare Pages runner | Pagefind ships pre-built binaries for darwin-arm64, darwin-x64, linux-x64, linux-arm64. CF Pages uses Linux. Add a `node --version` / build smoke test in the first commit before wiring everything else. |

## Validation

Before merging:
1. `npm run build` succeeds end-to-end (Astro + Pagefind + IndexNow).
2. `dist/pagefind/` exists; `dist/pagefind/pagefind.js` and `dist/pagefind/pagefind-ui.js` are present.
3. `npm run preview` → open `/search` → search for "wordpress" returns blog results, "irt" returns glossary + blog results, "gyfted" returns the company page.
4. `view-source:/` shows the `WebSite` JSON-LD has `potentialAction.target.urlTemplate` ending in `/search?q={search_term_string}`.
5. `view-source:/search/` shows `<meta name="robots" content="noindex">`.
6. `view-source:/blog/<some-post>/` has `data-pagefind-body` on the article and `data-pagefind-ignore` on header/footer/series-nav/related-posts.
7. Manual check: search for content known to live on a *listing* page (e.g. a topic hub heading) returns nothing — confirms opt-in scope.
8. Lighthouse re-run on `/` and `/search`:
   - `/` mobile Performance score does not regress vs the 2026-05-04 audit baseline (86).
   - `/search` mobile Performance ≥80 (acceptable for a JS-heavy interactive route).

## Resumption

If this design needs to pause: branch is `feat/seo-tier3-pagefind-search` cut from `main` after v0.13.0. The Lighthouse audit findings live in `docs/backlog.md` (committed alongside this spec). The implementation plan, when written, will land at `docs/superpowers/plans/2026-05-04-pagefind-static-search.md`.
