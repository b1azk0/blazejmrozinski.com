# blazejmrozinski.com

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

## Environment Variables

| Variable | Description | Format |
|----------|-------------|--------|
| `PUBLIC_GA4_ID` | Google Analytics 4 measurement ID (optional) | `G-XXXXXXXXXX` |

If `PUBLIC_GA4_ID` is not set, the cookie consent banner will not render. Set it via Netlify environment variables to enable GA4 tracking with user consent.

## Deploy

Push to main → Netlify auto-deploys.
