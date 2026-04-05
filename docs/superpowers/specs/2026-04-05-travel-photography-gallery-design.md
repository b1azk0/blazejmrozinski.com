# Travel Photography Gallery — Design Spec

## Overview

Add a travel photography gallery to blazejmrozinski.com. Albums organized by trip, each with a hero image, narrative story, and browsable photo grid. Accessible from the About page under a "Beyond Work" hobbies section. Photography gets its own pages; ultrarunning gets a mention alongside it.

## Content Architecture

### Collection: `photography`

New Astro content collection following the existing pattern (blog, companies, projects).

**Folder structure** — each album is a self-contained folder:

```
src/content/photography/
  iceland-ring-road/
    index.md          ← album metadata + story
    hero.jpg          ← featured/cover image
    01-glacier.jpg
    02-northern-lights.jpg
    03-black-beach.jpg
    ...
  patagonia-torres/
    index.md
    hero.jpg
    ...
```

**Schema** (`content.config.ts`):

```typescript
const photography = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/photography' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    location: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(0),
    hero: image(),
    photos: z.array(z.object({
      file: image(),
      caption: z.string().optional(),
    })),
  }),
});
```

**Example frontmatter:**

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

Ten days on the Ring Road in March. The kind of trip where
you stop the car every twenty minutes because the light changed...
```

### Image Handling

- **Source images**: Exported from Lightroom at 2400px long edge, quality 85%, JPG
- **Build-time optimization**: Astro's built-in `astro:assets` pipeline — automatic WebP conversion, responsive `srcset`, lazy loading
- **No external services**: All images live in the repo, optimized at build time
- **Scale**: 10-15 albums, 20-40 photos each. If this grows significantly, migrate to Git LFS (same folder structure, no content changes needed)

## Pages

### 1. About Page — "Beyond Work" Section

Added to the existing About page, before the contact CTA.

- Section heading: "Beyond Work"
- Brief intro line
- Two cards side by side:
  - **Travel Photography** — short description + "Browse albums →" link to `/photography`
  - **Ultrarunning** — short description, no link (no dedicated page for now)

### 2. Photography Listing (`/photography`)

- Page title: "Travel Photography"
- Subtitle/intro line
- 2-column responsive grid of album cards (1 column on mobile)
- Each card shows:
  - Hero image (optimized, aspect-ratio constrained)
  - Album title
  - Location · Date · Photo count
- Cards link to individual album pages
- Sorted by `order` field (manual control), falling back to date

### 3. Album Page (`/photography/[slug]`)

Hybrid layout — story context up top, browsable grid below.

**Hero section:**
- Full-width hero image with title and metadata overlaid at bottom
- Title, location, date, photo count

**Story section:**
- Centered, readable-width column (matching site's prose style)
- Rendered from the markdown body of `index.md`
- Can be hand-written or AI-generated from bullet points

**Photo grid:**
- 3-column responsive grid (2 on tablet, 1 on mobile)
- Thumbnails at consistent aspect ratio (4:3)
- **Inline expand on click**: clicked photo expands in place, pushes grid down, shows full-size image with caption below. Click again to collapse. No lightbox, no overlay.
- Vanilla JS — no library needed. Small Astro component handles the toggle.

## Navigation & Information Architecture

- Photography is **not** in the main nav
- Accessed via: About page → "Beyond Work" section → "Browse albums →"
- URL structure: `/photography` (listing), `/photography/[slug]` (album)
- Each album page has a back link to the listing

## Story Generation Workflow

For albums where the user doesn't want to write the full story:

1. In `index.md`, write bullet points in the body instead of prose
2. Use Claude to generate a narrative from the bullet points + frontmatter context (location, date, tags)
3. Replace bullet points with generated text, edit as needed
4. This is a manual step — no automated generation pipeline. Just a conversation with Claude when adding a new album.

## Components

| Component | Purpose |
|-----------|---------|
| `AlbumCard.astro` | Card for the listing grid — hero image, title, metadata |
| `PhotoGrid.astro` | 3-column grid with inline expand behavior |
| `PhotoItem.astro` | Individual thumbnail + expand/collapse logic |
| `HobbiesSection.astro` | "Beyond Work" section for the About page |

## Technical Notes

- **No new dependencies** — Astro's built-in image optimization + Tailwind + vanilla JS
- **SEO**: Album pages get JSON-LD structured data (ImageGallery schema), following the site's existing SEO pattern
- **Responsive**: All layouts adapt — 2→1 columns on listing, 3→2→1 on photo grid
- **Performance**: Images lazy-loaded, thumbnails served at grid size (not full resolution), hero image eagerly loaded

## Out of Scope

- Lightbox / overlay viewer
- Individual photo pages / URLs
- EXIF data display
- Tag filtering on the listing page
- Automated story generation pipeline
- Ultrarunning dedicated page (just a mention on About)
