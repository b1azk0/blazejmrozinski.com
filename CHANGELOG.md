# Changelog

All notable changes to blazejmrozinski.com are documented here.

## [0.6.0] — 2026-04-09

### Added
- Glossary content collection with term, seoTitle, definition, domain, relatedContent, relatedTerms fields
- Glossary index page at `/glossary` with alphabetical grouping and letter anchors
- Individual term pages at `/glossary/[term]` with DefinedTerm JSON-LD, domain badges, related content, and see-also cross-links
- Domain-to-color map utility (`src/lib/domains.ts`) for glossary visual theming
- Cover image generation for glossary terms with book/dictionary illustration
- Glossary sitemap (`sitemap-glossary.xml`) registered in sitemap index
- Glossary link in footer navigation

## [0.5.3] — 2026-04-09

### Fixed
- Replaced stale IndexNow API key with new key (`3a838b06f8a64c129f2d2c72f535b6b2`)
- Updated key file in `public/` and key reference in `scripts/indexnow.ts`

## [0.5.2] — 2026-04-06

### Changed
- Optimized meta titles on About, Work, CV, Publications, and Blog pages for keyword-rich SEO
- Shortened homepage meta description from ~218 to ~166 chars with clearer value proposition
- Replaced generic contact page description with consulting-specific copy
- Updated HSE Career Quiz project description to include IRT/CTT methodology and specifics

### Added
- `metaTitle` optional field on companies and projects content collections
- metaTitle values for Digital Savages, Gyfted, Nerds.family, SWPS University, and HSE Career Quiz
- Company and project templates now prefer `metaTitle` over `name` for `<title>` tag while keeping `name` as the visible H1

## [0.5.1] — 2026-04-06

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

## [0.5.0] — 2026-04-06

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
