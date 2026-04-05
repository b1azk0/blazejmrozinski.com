# Changelog

## 2026-04-05 — Travel photography gallery

- Added `photography` content collection with co-located images per album folder
- Added `src/components/AlbumCard.astro` — album card with hero image, title, metadata
- Added `src/components/PhotoItem.astro` — thumbnail with inline expand/collapse on click
- Added `src/components/PhotoGrid.astro` — responsive 3-column photo grid
- Added `src/components/HobbiesSection.astro` — "Beyond Work" section for About page
- Added `src/pages/photography/index.astro` — album listing page at /photography
- Added `src/pages/photography/[...slug].astro` — album pages with hero, story, photo grid, ImageGallery JSON-LD
- Updated `src/pages/about.astro` — added hobbies section (photography + ultrarunning)
- Added sample album for development/testing
- Images optimized at build time via Astro's `astro:assets` (WebP, responsive srcset, lazy loading)
- No new dependencies — vanilla JS for inline expand

## 2026-04-04 — RSS feed and cookie consent with GA4

- Installed `@astrojs/rss` package
- Added `src/pages/rss.xml.js` — RSS feed endpoint with all published blog posts (title, date, description, link)
- Added `src/components/CookieConsent.astro` — lightweight cookie consent banner:
  - Shows on first visit (checks localStorage for 'analytics-consent')
  - If accepted: loads GA4 script dynamically via gtag
  - If rejected: hides banner, doesn't load GA4
  - Respects prior choice silently (no banner if already decided)
  - Uses `import.meta.env.PUBLIC_GA4_ID` for GA4 measurement ID
  - Renders nothing if no GA4 ID is configured
  - Fixed position banner at bottom with Tailwind dark styling, Accept/Decline buttons
- Updated `src/layouts/Base.astro` — imported CookieConsent and added before `</body>`
- Build verified: `dist/rss.xml` generated successfully (empty until blog posts added)
- No GA4 ID set in environment, so banner won't appear until configured via `PUBLIC_GA4_ID`

## 2026-04-04 — Publications, CV, about, and contact pages

- Added `src/pages/publications.astro` — publications listing grouped by year, parsed from `src/content/publications.yml`
- Added `src/content/publications.yml` — 6 peer-reviewed publications in YAML format
- Added `src/components/PublicationEntry.astro` — APA-style citation with DOI/PDF links
- Added `src/pages/about.astro` — about page with expanded Person JSON-LD (alumniOf, hasCredential, knowsAbout, sameAs)
- Added `src/pages/cv.astro` — CV page with PDF download button, rendered from pages collection
- Added `src/pages/contact.astro` — full contact form (name, email, message) with Netlify Forms and social links
- Added `public/publications/.gitkeep` and `public/images/.gitkeep` placeholder directories
- Installed `yaml` package for YAML parsing

## 2026-04-04 — Work/company and project listing and landing pages

- Added `src/components/ProjectCard.astro` — project card with border, rounded corners, hover effect
- Added `src/pages/work/index.astro` — work overview rendering pages collection "work" entry + sorted company list
- Added `src/pages/work/[...slug].astro` — company landing pages with markdown body, related projects, Organization JSON-LD
- Added `src/pages/projects/index.astro` — projects listing with ProjectCard grid
- Added `src/pages/projects/[...slug].astro` — project landing pages with company link, CreativeWork JSON-LD

## 2026-04-04 — Blog listing and post pages

- Added `src/pages/blog/index.astro` — blog listing with all published posts
- Added `src/pages/blog/[...slug].astro` — dynamic route for individual blog posts
- Added `src/layouts/BlogPost.astro` — post layout with article JSON-LD schema, prose styling
- Added `src/components/TagFilter.astro` — tag filter pills with client-side JS filtering
- Uses `getCollection('blog')` + `render(entry)` from Astro Content Layer API
- Handles empty blog collection gracefully

## 2026-04-04 — Homepage with newspaper grid layout

- Replaced placeholder homepage with full newspaper-style grid layout
- Two-column layout: profile sidebar (280px) + recent writing (1fr)
- Added `src/components/PostCard.astro` — blog post card with featured variant
- Added `src/components/CompanyCard.astro` — company card linking to /work/:slug
- Added `src/components/ContactForm.astro` — inline Netlify Forms contact form
- Added `src/components/JsonLd.astro` — structured data injection component
- Person JSON-LD schema with worksFor array from companies collection
- Dark CTA section with contact form
- Responsive: stacked on mobile, side-by-side on md+

## 2026-04-04 — Content collections and schemas

- Added `src/content.config.ts` with 4 collections (blog, companies, projects, pages) using Astro 6 Content Layer API with `glob` loader
- Added 4 company profiles: Gyfted, Nerds.family, Digital Savages, Distillery
- Added 7 project writeups: Distillery, Prawomat, SSM, KryptoTracker, ContentForge, News Aggregator, HSE Career Quiz
- Added 3 static pages: about, work, CV
- Created empty blog collection with `.gitkeep`
- Adapted from task spec: used `src/content.config.ts` (not legacy `src/content/config.ts`) and `glob` loader (not `type: 'content'`) per Astro 6 API

## 2026-04-04 — Base layout, header, footer, SEO

- Added SEO component with Open Graph and Twitter Card meta tags
- Added Base layout (HTML shell with SEO slot)
- Added Page layout (Base + Header + Footer + centered content area)
- Added Header with nav links, active-page highlighting, and social links
- Added Footer with 3-column layout (identity, navigation, social/ORCID)
- Updated index page to use Page layout

## 2026-04-04 — Initial setup

- Astro project scaffolded with Tailwind CSS, sitemap, Netlify config
- Design spec: ~/GitHub/ClaudioBrain/docs/superpowers/specs/2026-04-04-personal-site-design.md
