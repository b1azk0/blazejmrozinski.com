# Changelog

All notable changes to blazejmrozinski.com are documented here.

## [0.5.0] — 2026-04-06

### Added
- `label` enum field to blog collection schema (7 values: infrastructure, ai-automation, product, research, systems-thinking, operator-notes, academic-work; optional)
- Test blog post `test-cover-post.md` with `label: infrastructure` for verifying cover generation
- `Geist-Regular.ttf` and `Geist-Bold.ttf` static fonts for cover generator (satori requires TTF, not WOFF2)
- `public/covers/` added to `.gitignore` — generated at build time, not committed

### Fixed
- `scripts/generate-covers.ts`: replaced WOFF2 font path with static TTF files; satori's opentype.js does not support WOFF2 or variable fonts

## [0.4.0] — 2026-04-05

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

## [0.3.0] — 2026-04-04

### Added
- RSS 2.0 feed at `/rss.xml` via `@astrojs/rss`
- Cookie consent banner with conditional GA4 loading
- Stats labels and enriched Work page and homepage service cards

## [0.2.0] — 2026-04-04

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

## [0.1.0] — 2026-04-04

### Added
- Initial Astro project with Tailwind CSS, sitemap, Netlify config
- Base layout with SEO, header, footer, dark mode, scroll animations
- Geist font family (variable weight)
- OKLCH color system with light/dark themes
