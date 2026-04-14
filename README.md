# blazejmrozinski.com

[![Netlify Status](https://api.netlify.com/api/v1/badges/8c12de62-7e86-47a7-b671-71f5639d7acf/deploy-status)](https://app.netlify.com/projects/blazejmrozinski/deploys)

Personal brand site for Blazej Mrozinski — psychologist, psychometrician, product builder, researcher.

## Stack

- Astro (static site generator)
- Tailwind CSS
- Netlify (deployment)
- ContentForge (blog content source)

## Development

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # production build to dist/
npm run preview # preview production build
```

## Content

Blog posts come from [ContentForge](https://github.com/b1azk0/contentforge) via GitHub Action PRs. Static content (about, companies, projects, publications, CV) lives in `src/content/` and is edited directly.

### Collections

Defined in `src/content.config.ts` using Astro 6 Content Layer API with `glob` loader:

| Collection | Path | Description |
|------------|------|-------------|
| `blog` | `src/content/blog/` | Blog posts (populated by ContentForge) |
| `companies` | `src/content/companies/` | Company profiles (Gyfted, Nerds.family, Digital Savages, Distillery) |
| `projects` | `src/content/projects/` | Project writeups (7 projects across companies) |
| `pages` | `src/content/pages/` | Static pages (about, work, CV) |
| `photography` | `src/content/photography/` | Travel photo albums (folder per trip with co-located images) |
| `glossary` | `src/content/glossary/` | Glossary terms (psychometrics, infrastructure, product, AI). Cross-linked into four topical clusters and used as the primary SEO surface — see `seo/2026-04-15-landing-pages-audit.md` in ContentForge. |

Polish translations of `companies`, `projects`, and `pages` live under a `pl/` subdirectory inside each collection (e.g. `src/content/companies/pl/gyfted.md`). They are detected at build time by the Polish route pages and kept in sync with their English source via `npm run translate:check` (see Internationalization below).

## Pages

| Route | Source | Description |
|-------|--------|-------------|
| `/` | `src/pages/index.astro` | Homepage with newspaper grid layout, profile, companies, recent posts, CTA |
| `/blog` | `src/pages/blog/index.astro` | Blog listing with client-side tag filtering |
| `/blog/:slug` | `src/pages/blog/[...slug].astro` | Individual blog post pages |
| `/work` | `src/pages/work/index.astro` | Work overview with rendered page content and company listing |
| `/work/:slug` | `src/pages/work/[...slug].astro` | Company landing pages with related projects |
| `/projects` | `src/pages/projects/index.astro` | Projects listing with ProjectCard grid |
| `/projects/:slug` | `src/pages/projects/[...slug].astro` | Project landing pages with company link |
| `/photography` | `src/pages/photography/index.astro` | Travel photography album listing |
| `/photography/:slug` | `src/pages/photography/[...slug].astro` | Individual album with hero, story, photo grid |
| `/about` | `src/pages/about.astro` | About page with Person JSON-LD, "Beyond Work" hobbies section |
| `/publications` | `src/pages/publications.astro` | Publications grouped by year with ScholarlyArticle JSON-LD |
| `/cv` | `src/pages/cv.astro` | CV page with PDF download button |
| `/contact` | `src/pages/contact.astro` | Full contact form (Netlify Forms) with social links |
| `/rss.xml` | `src/pages/rss.xml.js` | RSS 2.0 feed of published blog posts |

## Components

| Component | Description |
|-----------|-------------|
| `PostCard` | Blog post card with title, description, date, tag pills |
| `CompanyCard` | Company card with name, domain, role |
| `ContactForm` | Inline Netlify Forms contact form |
| `TagFilter` | Tag filter pills with client-side show/hide |
| `ProjectCard` | Project card with name, domain, description, hover effect |
| `PublicationEntry` | APA-formatted publication citation with DOI/PDF links |
| `AlbumCard` | Photography album card with hero image, title, metadata |
| `PhotoGrid` | Responsive 3-column photo grid |
| `PhotoItem` | Photo thumbnail with inline expand/collapse |
| `HobbiesSection` | "Beyond Work" section for About page (photography + ultrarunning) |
| `CookieConsent` | Cookie consent banner with GA4 conditional loading |
| `JsonLd` | JSON-LD structured data injection |
| `SEO` | Open Graph and Twitter Card meta tags |
| `Header` | Dark nav header with page links and social links |
| `Footer` | 3-column footer with identity, nav, social |

## Adding a Photo Album

Each album is a self-contained folder under `src/content/photography/`.

### 1. Export from Lightroom

Select your trip photos and export:
- **Format:** JPEG
- **Long edge:** 2400px
- **Quality:** 85%
- **Output folder:** `src/content/photography/<trip-name>/` (use kebab-case, e.g. `iceland-ring-road`)

### 2. Pick and rename the hero image

Choose your best shot and rename it to `hero.jpg`. This image appears on the listing page card and as the full-width banner on the album page.

### 3. Create index.md

Create `src/content/photography/<trip-name>/index.md`:

```yaml
---
title: "Iceland Ring Road"
location: "Iceland"
date: 2024-03-15
description: "10 days circling Iceland in winter"
tags: [landscape, winter, nordic]
order: 1
hero: ./hero.jpg
photos:
  - file: ./01-glacier.jpg
    caption: "Svínafellsjökull at dawn"
  - file: ./02-northern-lights.jpg
    caption: "Aurora over Jökulsárlón"
  - file: ./03-black-beach.jpg
    caption: "Reynisfjara"
---

Your story text goes here. Write it yourself, or drop bullet points
and ask Claude to generate a narrative.
```

**Fields:**
- `title` — album name
- `location` — country or region
- `date` — trip date (used for sorting)
- `description` — one-line summary (used in meta tags)
- `tags` — for future filtering (not displayed yet)
- `order` — manual sort order on listing page (lower = first)
- `hero` — path to hero image (relative to the album folder)
- `photos` — array of `file` + optional `caption` pairs

### 4. Push

```bash
git add src/content/photography/<trip-name>/
git commit -m "feat: add <trip-name> photo album"
git push
```

Netlify builds automatically. Astro optimizes all images at build time (WebP conversion, responsive srcset, lazy loading). The album appears at `/photography/<trip-name>` and on the listing at `/photography`.

### Tips

- **Photo order** follows the array order in frontmatter — arrange them how you want them displayed
- **Captions are optional** — omit the `caption` field for photos that don't need one
- **File names** don't matter (besides `hero.jpg`) — use whatever Lightroom exports or rename for clarity
- **Story generation** — write bullet points in the markdown body, then ask Claude to turn them into prose
- **Scaling** — at 10-15 albums this works great. If the collection grows large, consider Git LFS for images

## Blog Labels

Each blog post can have a `label` field in its frontmatter — one of 7 topic categories:

| Label | Slug | Description |
|-------|------|-------------|
| Infrastructure | `infrastructure` | DevOps, servers, hosting |
| AI & Automation | `ai-automation` | AI workflows, LLM tooling |
| Product | `product` | Product thinking, specs |
| Research | `research` | Quantitative methods, experiments |
| Systems Thinking | `systems-thinking` | Knowledge systems, processes |
| Operator Notes | `operator-notes` | Lessons and reflections |
| Academic Work | `academic-work` | Thesis, peer review, methodology |

Add `label: infrastructure` (or any slug) to a post's frontmatter. Labels power the filter chips on `/blog` and determine the auto-generated cover image.

### Cover Images

Cover images are generated automatically at build time from the post's title + label. Each label has a unique color palette and SVG illustration. The same image serves as the OG social card.

- **Generated by:** `scripts/generate-covers.ts` (runs as `prebuild` before `astro build`)
- **Output:** `public/covers/{post-slug}.png` (1200×630, gitignored)
- **Dependencies:** satori, @resvg/resvg-js, tsx

## Internationalization

The site ships English at the root and Polish under `/pl/*`. Polish routes currently cover the homepage, about (`/pl/o-mnie`), CV (`/pl/cv`), contact (`/pl/kontakt`), work index and company pages (`/pl/praca`, `/pl/praca/[slug]`), and projects index and case studies (`/pl/projekty`, `/pl/projekty/[slug]`). Blog and publications stay English-only for now.

UI strings live in `src/i18n/en.json` and `src/i18n/pl.json` and are looked up via the `t()` helper. The canonical EN↔PL route map is `src/i18n/routes.json`. Shared components (`Header`, `Footer`, `Base`, `SEO`, `LangSwitcher`) take a `locale` prop and emit locale-aware URLs and `hreflang` annotations.

Run `npm run translate:check` to detect drift between English source content and its Polish siblings (based on source-hashes) and to flag missing or empty dictionary keys. Run `npm run translate:check:test` to execute the unit tests for the drift script.

## Environment Variables

| Variable | Description | Format |
|----------|-------------|--------|
| `PUBLIC_GA4_ID` | Google Analytics 4 measurement ID (optional) | `G-XXXXXXXXXX` |

If `PUBLIC_GA4_ID` is not set, the cookie consent banner will not render. Set it via Netlify environment variables to enable GA4 tracking with user consent.

## Deploy

Push to main → Netlify auto-deploys.
