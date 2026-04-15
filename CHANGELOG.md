# Changelog

All notable changes to blazejmrozinski.com are documented here.

## [0.10.0] — 2026-04-15 — Migrate Hosting from Netlify to Cloudflare Pages

### Changed
- Hosting moved from Netlify to Cloudflare Pages. Netlify's edge had been failing TLS for the custom domain repeatedly despite a valid certificate in their records (most recent incident: 2026-04-15, both apex and www returning `Connection reset by peer` during the TLS Client Hello while `blazejmrozinski.netlify.app` continued to serve fine). Cloudflare Pages now terminates TLS at Cloudflare's edge using their Universal SSL. DNS was already authoritative on Cloudflare, so the cutover is a same-account record swap with zero downtime and no propagation lag.
- Contact form handling moved from Netlify Forms to [Web3Forms](https://web3forms.com). Both forms (`src/pages/contact.astro` and `src/components/ContactForm.astro` on the homepage) now POST directly to Web3Forms, with hidden fields for the access key, subject, sender label, and a same-domain redirect to a new `/thanks` page. Honeypot via the `botcheck` hidden field instead of CAPTCHA.

### Added
- `public/_headers` ports the 3 security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) from `netlify.toml` to Cloudflare Pages syntax.
- `public/_redirects` ports the single `/sitemap.xml` → `/sitemap-index.xml` 301.
- `src/pages/thanks.astro` — short post-submit confirmation page Web3Forms redirects to.
- `## Setup TODOs` section in `CLAUDE.md` flagging the `WEB3FORMS_ACCESS_KEY_PLACEHOLDER` token in both forms that must be replaced with a real key from web3forms.com signup before submissions work.

### Removed
- `netlify.toml` — no longer the source of truth. Cloudflare Pages reads `public/_headers` and `public/_redirects` instead.
- Netlify deploy status badge from `README.md`.

### Notes
- ContentForge's `scripts/publish.sh` does not touch Netlify, build hooks, or webhooks (verified: `git`-only). Cloudflare Pages picks up commits identically. **No ContentForge changes required.**
- Rollback window: the Netlify project remains built and deployable for 1 week post-cutover. If anything breaks on Cloudflare Pages, recovery is re-adding the custom domains in Netlify and removing them from Cloudflare Pages — ~2 minutes, no DNS propagation lag (same Cloudflare account).
- Out of scope for this migration: CSP / HSTS / Permissions-Policy, JS-enhanced form UX, Cloudflare Web Analytics, cache rules, image resizing. Each is its own future task.
- Spec: `docs/superpowers/specs/2026-04-15-cloudflare-pages-migration-design.md`. Plan: `docs/superpowers/plans/2026-04-15-cloudflare-pages-migration.md`.

## [0.9.4] — 2026-04-15 — CLAUDE.md: Ahrefs Budget Rule

### Added
- `## Ahrefs budget` section in `CLAUDE.md` establishing the blog repo as post-publish execution only. All keyword research, SERP analysis, and matching-terms lookups belong in ContentForge (which already owns the research budget). Two narrow exceptions carved out: `site-audit-issues` (technical SEO on the live site) and `rank-tracker-overview` (read-only, explicit request only).

### Notes
- Goal: prevent duplicate Ahrefs credit spend between ContentForge and the blog repo. The natural workflow is ContentForge writes audit files to `seo/`, blog repo consumes them.

## [0.9.3] — 2026-04-15 — Blog Image Pipeline: Move Inline Images to Astro Optimization

### Changed
- Migrated blog post inline images from `public/images/blog/<slug>/` to `src/assets/blog/<slug>/` so they flow through Astro's image pipeline. Result: WebP output, lazy loading, intrinsic dimensions, hashed cache-busted filenames, and 30–55% smaller payloads on the 9 charts in `psychometric-analysis-university-exams` (e.g. ctt-item-map: 101kB → 47kB).
- Rewrote 9 markdown image references in `psychometric-analysis-university-exams.md` from absolute `/images/blog/...` paths to relative `../../assets/blog/...` paths so Astro processes them at build time.

### Added
- `## Blog post images` convention section in `CLAUDE.md` documenting the `src/assets/blog/<slug>/` pattern and explicitly forbidding `public/` for inline post images.

### Notes
- ContentForge's `publish.sh` will be updated in a sibling commit so future blog posts with images land in `src/assets/blog/<slug>/` automatically and never in `public/`.
- Cover/social-share images are unaffected — they're handled at the layout level, not in the markdown body.

## [0.9.2] — 2026-04-15 — Add Psychometric Analysis of University Exams

### Added
- New blog post `psychometric-analysis-university-exams` ("What Psychometric Analysis Reveals About University Exams (Real CTT and IRT Findings)") with `label: academic-work`. A real-data CTT + IRT walkthrough of university exams covering item discrimination, distractor adjacency, the Wright map, the test information function, 3PL fallback to 2PL, dead distractors, unidimensionality checks, and SEM-aware pass/fail.
- 9 chart PNGs under `public/images/blog/psychometric-analysis-university-exams/` (CTT item map, negatively discriminating item, Wright map, TIF, 3PL ICC comparison, dead distractors, scree plot, SEM pass/fail histogram, item classification buckets).

### Notes
- SEO research saved in `~/GitHub/contentforge/published/seo/2026-04-14-psychometric-analysis-university-exams.md`. Primary target: "psychometric analysis" (vol 250, KD 16, TP 3,100). Secondaries: "item response theory" (vol 800, KD 5), "classical test theory" (vol 400, KD 1).

## [0.9.1] — 2026-04-15 — SEO Audit Implementation: Published Blog Posts

### Changed
- Retitled 4 blog posts to capture keyword-aligned phrases identified in the 2026-04-15 published-blog audit:
  - `how-i-taught-ai-to-work-like-a-colleague`: "How to Configure Claude Code: Subagents, Skills, and Safety Protocols for a Real Workflow" (targets "claude code subagents", "claude code agents", "how to use claude code")
  - `seo-architecture-before-first-visitor`: "SEO Architecture for a New Website: What to Build Before Your First Visitor" (targets "seo for new website" KD 6 / TP 644k, "seo architecture")
  - `wp-infra-03-deploying-wordpress`: "Production WordPress Deployment with Redis Object Cache Pro and Nginx" (targets "object cache pro", "wordpress redis object cache")
  - `wp-infra-04-four-layers-of-caching`: "WordPress Performance Optimization: Nginx FastCGI, Redis, OPcache, and Cloudflare (Under 50ms TTFB)" (targets "wordpress performance optimization" TP 1,500)
- Rewrote meta descriptions on 7 posts to front-load target keywords (posts 1, 2, 4, 5, 7, 8, 9 in the audit).
- Reworked tag arrays on all 9 published posts to reflect target keyword clusters (claude-code, seo-for-new-website, object-cache-pro, wordpress-performance-optimization, etc.).
- URLs (slugs) were intentionally left unchanged on all posts to preserve existing inbound links and avoid redirect churn — Netlify redirect support is available in `netlify.toml` if a future rename is needed.

### Added
- Internal cross-links with keyword-aligned anchor text:
  - `building-a-brain-for-your-ai-cto` → `how-i-taught-ai-to-work-like-a-colleague` ("configuring Claude Code subagents, skills, and safety protocols")
  - `wp-infra-04-four-layers-of-caching` → `wp-infra-03-deploying-wordpress` ("Object Cache Pro setup")
  - `wp-infra-01-why-i-ditched-managed-hosting` → `wp-infra-04-four-layers-of-caching` ("WordPress performance optimization")

### Notes
- Source audit: `~/GitHub/contentforge/seo/2026-04-15-published-blog-audit.md`.
- Audit-recommended body additions for the `how-i-taught-ai-to-work-like-a-colleague` post (adding verbatim "Claude Code subagents" section heading) were NOT applied, because the body does not actually cover Claude Code's subagents/skills/hooks features as platform primitives — it covers configuration documents. The retitle keeps the frontmatter keyword signal but flags a title/body mismatch that will need either body expansion or a title softening in a follow-up pass.

## [0.9.0] — 2026-04-15 — SEO Audit Implementation: Glossary Cluster Linking

### Added
- Inline cross-glossary links across the four topical clusters from the 2026-04-15 Ahrefs audit:
  - Psychometrics: `construct-validity` ↔ `confirmatory-factor-analysis` ↔ `classical-test-theory` ↔ `item-response-theory` ↔ `psychometric-assessment`
  - WordPress infrastructure: `lemp-stack` ↔ `php-fpm` ↔ `opcache` ↔ `fastcgi-cache` ↔ `redis-object-cache` ↔ `fail2ban`
  - SEO/product: `e-e-a-t` ↔ `internal-linking` ↔ `indexnow` ↔ `content-model`
- Inline glossary links inside the wp-infra blog series (parts 1–5) and the SEO/AI essays (`seo-architecture-before-first-visitor`, `personal-site-as-product`, `building-a-brain-for-your-ai-cto`, `how-i-taught-ai-to-work-like-a-colleague`).
- Glossary references on `projects/hse-career-quiz`, `projects/contentforge`, `companies/gyfted`, and `companies/swps-university` linking technical terms to their canonical definitions.
- "How I Validate Psychometric Assessments" section and a soft consulting CTA on `glossary/psychometric-assessment` pointing to `/contact`.
- "Available for selective consulting engagements" line at the top of the CV page with a contact link.
- Expanded `relatedTerms` arrays across the cluster glossary entries so the on-page "See also" rail reflects the full topical neighborhood.

### Changed
- `glossary/fail2ban` description rewritten to lead with general intrusion prevention rather than WordPress-specific framing, matching the actual search intent for "fail2ban".
- `/contact` page title updated from "Contact" to "Contact: Psychometric Consulting, Product Strategy, and SEO" to capture commercial-intent service phrases.
- `glossary/fail2ban` opening paragraph reframed to make explicit that Fail2ban is general-purpose Linux intrusion prevention, with WordPress and SSH as illustrative examples rather than the only use cases.

### Notes
- Source: `~/GitHub/contentforge/seo/2026-04-15-landing-pages-audit.md` (Ahrefs research from 2026-04-15).
- Glossary body lengths were already 700–1100 words per entry, so the audit's "expand body content" recommendation was already satisfied. The implementation focused on the connective tissue (cross-linking) and surgical content edits (description, CTA, title) rather than long-form rewrites.

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
