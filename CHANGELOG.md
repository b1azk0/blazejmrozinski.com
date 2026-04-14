# Changelog

All notable changes to blazejmrozinski.com are documented here.

## [0.9.0] — 2026-04-14 — Polish Translation Content

### Added
- Full Polish translation of `src/i18n/pl.json` (40 UI dictionary keys across nav, footer, base, lang_switcher, 404, header).
- Full Polish translation of `src/content/pages/pl/{about,cv,work}.md` — long-form page content with internal links remapped to `/pl/*` routes.
- Full Polish translation of `src/content/companies/pl/*.md` (gyfted, nerds-family, digital-savages, swps-university).
- Full Polish translation of `src/content/projects/pl/*.md` (prawomat, hse-career-quiz, contentforge, ssm, kryptotracker, new-aggregator) including case-study frontmatter fields.
- `source_hash` fields on every PL content file so `npm run translate:check` reports zero drift against current EN sources.

### Changed
- Polished inline Polish strings on route shells: `/pl/kontakt` intro copy and form labels (with proper diacritics), `/pl/projekty` description, and breadcrumb labels on `/pl/praca/[slug]` and `/pl/projekty/[slug]`.

## [0.8.0] — 2026-04-13 — Polish Translation (i18n) Machinery

### Added
- Locale-aware shared components: `Header`, `Footer`, `Base`, `SEO`, and `LangSwitcher` now accept a `locale` prop and emit locale-aware URLs, nav labels, and hreflang annotations.
- `t()` helper with `src/i18n/en.json` and `src/i18n/pl.json` UI dictionaries.
- `src/i18n/routes.json` — canonical EN↔PL route map covering homepage, about, cv, contact, work (companies), projects (case studies), and 404.
- Polish routing under `/pl/*`: `/pl/`, `/pl/o-mnie`, `/pl/cv`, `/pl/kontakt`, `/pl/praca`, `/pl/praca/[slug]`, `/pl/projekty`, `/pl/projekty/[slug]`, `/pl/404`.
- Subdirectory layout for Polish content at `src/content/<collection>/pl/` (companies, projects, pages). Polish bodies are placeholders pending Claude translation session.
- `scripts/translate-check.mjs` — drift detection script comparing source-hashes of EN and PL content plus UI dictionary key coverage. Exposed as `npm run translate:check`.
- `scripts/translate-check.test.mjs` — 11 unit tests covering hashing stability and drift/dictionary reporting. Exposed as `npm run translate:check:test`.
- Hreflang alternate annotations in `sitemap-pages.xml` and `sitemap-work.xml` for translated routes.
- Optional post-commit git hook reminding to run `npm run translate:check` when EN source content changes.

## [0.7.2] — 2026-04-12 — Blog: WP Infrastructure Part 4

### Added
- Blog post "WordPress Caching with Nginx FastCGI, Redis, OPcache, and Cloudflare (Under 50ms TTFB)" — Part 4 of the WordPress Infrastructure from Scratch series. Deep-dive on four-layer WordPress caching stack with WooCommerce bypass rules. Label: infrastructure.

## [0.7.1] — 2026-04-13 — Blog: SaaS is dead narrative

### Added
- Blog post "Everyone Says SaaS Is Dead. Here's What They're Actually Observing." — 1900-word analysis separating the valid diagnosis from the wrong prognosis in the "SaaS is dead" narrative. SEO-optimized for primary keyword "saas is dead" (label: operator-notes).

## [0.7.0] — 2026-04-10 — Changelog

### Added
- Changelog timeline page at `/changelog/` with vertical timeline, colored release dots, and major/patch visual tiers
- Individual release detail pages at `/changelog/vX.Y.Z/` with categorized change lists and prev/next navigation
- CHANGELOG.md parser utility (`src/lib/changelog.ts`) — extracts structured release data at build time
- Version badge in footer brand column linking to changelog
- Changelog link in footer navigation
- Changelog sitemap at `/sitemap-changelog.xml` registered in sitemap index
- Release title convention in CHANGELOG.md headings (`## [x.y.z] — date — Title`)

## [0.6.1] — 2026-04-10 — Word Heatmap

### Added
- Word heatmap page at `/heat/` — interactive keyword cloud visualizing blog tag and label frequency with click-to-filter results, GA4 tracking (noindex, hidden from navigation)

## [0.6.0] — 2026-04-09 — Glossary

### Added
- Glossary content collection with term, seoTitle, definition, domain, relatedContent, relatedTerms fields
- Glossary index page at `/glossary` with alphabetical grouping and letter anchors
- Individual term pages at `/glossary/[term]` with DefinedTerm JSON-LD, domain badges, related content, and see-also cross-links
- Domain-to-color map utility (`src/lib/domains.ts`) for glossary visual theming
- Cover image generation for glossary terms with book/dictionary illustration
- Glossary sitemap (`sitemap-glossary.xml`) registered in sitemap index
- Glossary link in footer navigation

## [0.5.3] — 2026-04-09 — IndexNow Fix

### Fixed
- Replaced stale IndexNow API key with new key (`3a838b06f8a64c129f2d2c72f535b6b2`)
- Updated key file in `public/` and key reference in `scripts/indexnow.ts`

## [0.5.2] — 2026-04-06 — SEO Meta Titles

### Changed
- Optimized meta titles on About, Work, CV, Publications, and Blog pages for keyword-rich SEO
- Shortened homepage meta description from ~218 to ~166 chars with clearer value proposition
- Replaced generic contact page description with consulting-specific copy
- Updated HSE Career Quiz project description to include IRT/CTT methodology and specifics

### Added
- `metaTitle` optional field on companies and projects content collections
- metaTitle values for Digital Savages, Gyfted, Nerds.family, SWPS University, and HSE Career Quiz
- Company and project templates now prefer `metaTitle` over `name` for `<title>` tag while keeping `name` as the visible H1

## [0.5.1] — 2026-04-06 — WordPress Infrastructure Series

### Added
- "WordPress Infrastructure from Scratch" blog series (7 posts)
  - Part 1: Why I Ditched Managed Hosting (2026-04-01)
  - Part 2: Building the LEMP Stack (2026-04-06)
  - Part 3: Deploying WordPress (2026-04-13)
  - Part 4: Four Layers of Caching (2026-04-20)
  - Part 5: Locking It Down (2026-04-27)
  - Part 6: Automating the Boring Parts (2026-05-04)
  - Part 7: Watching Over It All (2026-05-11)
- Series navigation block at the end of each post
- All posts use `infrastructure` label

### Removed
- Test cover post (`test-cover-post.md`)

## [0.5.0] — 2026-04-06 — Blog Label System

### Added
- Blog label system with 7 topic categories (Infrastructure, AI & Automation, Product, Research, Systems Thinking, Operator Notes, Academic Work)
- `label` enum field on blog collection schema (optional, one per post)
- LabelFilter component with colored accent dots on `/blog` listing
- Label indicator on PostCard and BlogPost layout
- Programmatic cover image generation via satori + resvg at build time
- Per-label SVG illustrations: server rack, brain, scatter plot, wireframe, flowchart, terminal, research paper
- Cover images used as OG social cards (1200×630 PNG)
- Cover display on individual blog post pages
- Prebuild script (`scripts/generate-covers.ts`) hooked into `npm run build`
- Static Geist TTF fonts for satori rendering (requires TTF, not variable WOFF2)

## [0.4.0] — 2026-04-05 — Photography Gallery

### Added
- Travel photography gallery with album pages and inline photo expand
- `photography` content collection — folder-per-album with co-located images
- Album listing page at `/photography` with responsive card grid
- Individual album pages with cinematic hero image, narrative story, and 3-column photo grid
- Inline photo expand on click (vanilla JS, no lightbox library)
- ImageGallery JSON-LD structured data on album pages
- "Beyond Work" hobbies section on About page (photography + ultrarunning)
- Sample album for development/testing
- Astro `astro:assets` image optimization (WebP, responsive srcset, lazy loading)

## [0.3.0] — 2026-04-04 — RSS & Analytics

### Added
- RSS 2.0 feed at `/rss.xml` via `@astrojs/rss`
- Cookie consent banner with conditional GA4 loading
- Stats labels and enriched Work page and homepage service cards

## [0.2.0] — 2026-04-04 — Site Launch

### Added
- Homepage with newspaper grid layout, services, case studies, companies, writing, booking CTA
- Blog listing with client-side tag filtering and individual post pages
- Work/company pages with Organization JSON-LD and related projects
- Case Studies section with optional structured layout (challenge/approach/results)
- Publications page with APA-formatted citations from YAML data
- About page with Person JSON-LD (credentials, affiliations, expertise)
- CV page with PDF download
- Contact page with Netlify Forms (inline + full)
- Content collections: blog, companies, projects, pages

### Components
- PostCard, CompanyCard, ProjectCard, PublicationEntry, ContactForm
- TagFilter, JsonLd, SEO, CookieConsent
- Header with active-page highlighting, Footer with 3-column layout

## [0.1.0] — 2026-04-04 — Initial Setup

### Added
- Initial Astro project with Tailwind CSS, sitemap, Netlify config
- Base layout with SEO, header, footer, dark mode, scroll animations
- Geist font family (variable weight)
- OKLCH color system with light/dark themes
