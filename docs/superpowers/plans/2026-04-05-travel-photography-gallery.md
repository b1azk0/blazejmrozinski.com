# Travel Photography Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a travel photography gallery with trip albums, each containing a hero image, narrative story, and browsable photo grid with inline expand.

**Architecture:** New `photography` content collection with co-located images per album folder. Three new pages: photography listing, individual album, and a hobbies section on the About page. Astro's built-in `astro:assets` handles image optimization at build time. Inline photo expand uses vanilla JS — no new dependencies.

**Tech Stack:** Astro 6 content collections, `astro:assets` (Image component), Tailwind CSS 4, vanilla JS

**Spec:** `docs/superpowers/specs/2026-04-05-travel-photography-gallery-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/content.config.ts` | Modify | Add `photography` collection with image schema |
| `src/content/photography/sample-album/index.md` | Create | Sample album for testing (will delete later or keep as template) |
| `src/content/photography/sample-album/hero.jpg` | Create | Sample hero image (small placeholder for testing) |
| `src/content/photography/sample-album/01-sample.jpg` | Create | Sample photo (small placeholder for testing) |
| `src/content/photography/sample-album/02-sample.jpg` | Create | Sample photo (small placeholder for testing) |
| `src/components/AlbumCard.astro` | Create | Card for photography listing grid — hero image, title, metadata |
| `src/components/PhotoGrid.astro` | Create | 3-column responsive grid that renders PhotoItem components |
| `src/components/PhotoItem.astro` | Create | Individual thumbnail with inline expand/collapse behavior |
| `src/components/HobbiesSection.astro` | Create | "Beyond Work" section with photography + ultrarunning cards |
| `src/pages/photography/index.astro` | Create | Photography listing page — album grid |
| `src/pages/photography/[...slug].astro` | Create | Individual album page — hero + story + photo grid |
| `src/pages/about.astro` | Modify | Add HobbiesSection before closing `</div>` |
| `CHANGELOG.md` | Modify | Add entry for photography gallery feature |
| `README.md` | Modify | Add photography section to content collections docs |

---

### Task 1: Add Photography Content Collection

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Add the photography collection schema**

Add the `photography` collection to `src/content.config.ts`. The schema uses Astro's `image()` helper for build-time optimization. Add it after the `pages` collection:

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

Update the `collections` export to include `photography`:

```typescript
export const collections = { blog, companies, projects, pages, photography };
```

- [ ] **Step 2: Verify the schema compiles**

Run: `cd /Users/bajzel/GitHub/blazejmrozinski.com && npx astro check 2>&1 | head -20`

Expected: No errors related to content.config.ts. The photography collection won't have content yet — that's fine.

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add photography content collection schema"
```

---

### Task 2: Add Sample Album Content

**Files:**
- Create: `src/content/photography/sample-album/index.md`
- Create: `src/content/photography/sample-album/hero.jpg`
- Create: `src/content/photography/sample-album/01-sample.jpg`
- Create: `src/content/photography/sample-album/02-sample.jpg`

We need real image files for Astro's image pipeline to process. Generate minimal valid JPEG files for testing.

- [ ] **Step 1: Create sample album directory and placeholder images**

Generate three tiny valid JPEG files (1x1 pixel is enough for schema validation, but use something visible for layout testing — 800x600 colored rectangles):

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com
mkdir -p src/content/photography/sample-album

# Generate colored placeholder JPEGs using sips (macOS built-in)
# Create a simple colored image using Python (available on macOS)
python3 -c "
from PIL import Image
colors = [(70, 100, 80), (100, 80, 60), (60, 80, 100)]
names = ['hero.jpg', '01-sample.jpg', '02-sample.jpg']
for color, name in zip(colors, names):
    img = Image.new('RGB', (800, 600), color)
    img.save(f'src/content/photography/sample-album/{name}', quality=85)
"
```

If PIL is not available, use ImageMagick:

```bash
convert -size 800x600 xc:'rgb(70,100,80)' src/content/photography/sample-album/hero.jpg
convert -size 800x600 xc:'rgb(100,80,60)' src/content/photography/sample-album/01-sample.jpg
convert -size 800x600 xc:'rgb(60,80,100)' src/content/photography/sample-album/02-sample.jpg
```

If neither is available, download tiny placeholder images:

```bash
curl -sL "https://placehold.co/800x600/465064/ffffff.jpg?text=Hero" -o src/content/photography/sample-album/hero.jpg
curl -sL "https://placehold.co/800x600/64503C/ffffff.jpg?text=Photo+1" -o src/content/photography/sample-album/01-sample.jpg
curl -sL "https://placehold.co/800x600/3C5064/ffffff.jpg?text=Photo+2" -o src/content/photography/sample-album/02-sample.jpg
```

- [ ] **Step 2: Create the sample album markdown**

Write `src/content/photography/sample-album/index.md`:

```markdown
---
title: "Sample Album"
location: "Test Location"
date: 2024-06-15
description: "A sample album for testing the photography gallery layout"
tags: [sample, test]
order: 1
hero: ./hero.jpg
photos:
  - file: ./01-sample.jpg
    caption: "First sample photo"
  - file: ./02-sample.jpg
    caption: "Second sample photo"
---

This is a sample album used for developing and testing the photography gallery. Replace with a real trip album when ready.
```

- [ ] **Step 3: Verify Astro can load the collection**

Run: `cd /Users/bajzel/GitHub/blazejmrozinski.com && npx astro build 2>&1 | tail -20`

Expected: Build succeeds. The photography collection is loaded but no pages reference it yet — that's fine. No errors about missing images or schema validation failures.

- [ ] **Step 4: Commit**

```bash
git add src/content/photography/
git commit -m "feat: add sample photography album for gallery development"
```

---

### Task 3: Build AlbumCard Component

**Files:**
- Create: `src/components/AlbumCard.astro`

- [ ] **Step 1: Create the AlbumCard component**

This component follows the pattern of the existing `ProjectCard.astro` — a clickable card linking to the album page. It shows the hero image, title, location, date, and photo count.

Write `src/components/AlbumCard.astro`:

```astro
---
import { Image } from 'astro:assets';

interface Props {
  title: string;
  description: string;
  location: string;
  date: Date;
  photoCount: number;
  hero: ImageMetadata;
  slug: string;
}

const { title, description, location, date, photoCount, hero, slug } = Astro.props;

const formattedDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
---

<a href={`/photography/${slug}`} class="group block rounded-lg overflow-hidden border bg-card text-card-foreground hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
  <div class="aspect-[3/2] overflow-hidden">
    <Image
      src={hero}
      alt={title}
      widths={[400, 600]}
      sizes="(max-width: 768px) 100vw, 50vw"
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
  </div>
  <div class="p-4">
    <p class="font-semibold group-hover:text-primary/80 transition-colors">{title}</p>
    <p class="text-sm text-muted-foreground mt-1">
      {location} · {formattedDate} · {photoCount} photos
    </p>
  </div>
</a>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AlbumCard.astro
git commit -m "feat: add AlbumCard component for photography listing"
```

---

### Task 4: Build PhotoItem Component

**Files:**
- Create: `src/components/PhotoItem.astro`

- [ ] **Step 1: Create the PhotoItem component**

This component renders a thumbnail that expands inline when clicked. The expanded view shows the larger image with its caption. Uses vanilla JS via a `<script>` tag (Astro processes this as a module, deduped across instances).

Write `src/components/PhotoItem.astro`:

```astro
---
import { Image } from 'astro:assets';

interface Props {
  photo: ImageMetadata;
  caption?: string;
  index: number;
}

const { photo, caption, index } = Astro.props;
---

<div class="photo-item" data-photo-index={index}>
  <button
    type="button"
    class="w-full aspect-[4/3] overflow-hidden rounded-md cursor-pointer border border-transparent hover:border-ring transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    aria-expanded="false"
    aria-label={caption || `Photo ${index + 1}`}
  >
    <Image
      src={photo}
      alt={caption || `Photo ${index + 1}`}
      widths={[300, 500]}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      class="w-full h-full object-cover"
      loading="lazy"
    />
  </button>
  <div class="photo-expanded hidden mt-2 mb-4" role="region" aria-label={caption || `Photo ${index + 1} expanded`}>
    <Image
      src={photo}
      alt={caption || `Photo ${index + 1}`}
      widths={[800, 1200, 1600]}
      sizes="(max-width: 768px) 100vw, 800px"
      class="w-full rounded-md"
      loading="lazy"
    />
    {caption && (
      <p class="text-sm text-muted-foreground mt-2 text-center">{caption}</p>
    )}
  </div>
</div>

<script>
  document.addEventListener('astro:page-load', () => {
    document.querySelectorAll('.photo-item button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.photo-item') as HTMLElement;
        const expanded = item.querySelector('.photo-expanded') as HTMLElement;
        const isOpen = !expanded.classList.contains('hidden');

        // Close any other open photo
        document.querySelectorAll('.photo-item .photo-expanded:not(.hidden)').forEach((el) => {
          el.classList.add('hidden');
          el.closest('.photo-item')?.querySelector('button')?.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          expanded.classList.remove('hidden');
          btn.setAttribute('aria-expanded', 'true');
          expanded.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PhotoItem.astro
git commit -m "feat: add PhotoItem component with inline expand"
```

---

### Task 5: Build PhotoGrid Component

**Files:**
- Create: `src/components/PhotoGrid.astro`

- [ ] **Step 1: Create the PhotoGrid component**

This wraps PhotoItem components in a responsive 3-column grid. When a photo expands, it breaks out of the grid column to span full width.

Write `src/components/PhotoGrid.astro`:

```astro
---
import PhotoItem from '@/components/PhotoItem.astro';

interface Props {
  photos: Array<{
    file: ImageMetadata;
    caption?: string;
  }>;
}

const { photos } = Astro.props;
---

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  {photos.map((photo, i) => (
    <PhotoItem photo={photo.file} caption={photo.caption} index={i} />
  ))}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PhotoGrid.astro
git commit -m "feat: add PhotoGrid component"
```

---

### Task 6: Build Album Page

**Files:**
- Create: `src/pages/photography/[...slug].astro`

- [ ] **Step 1: Create the album page**

This follows the same dynamic route pattern as `src/pages/projects/[...slug].astro`. It renders the hero image, story, and photo grid in the hybrid layout from the design spec.

Write `src/pages/photography/[...slug].astro`:

```astro
---
import Base from '@/layouts/Base.astro';
import JsonLd from '@/components/JsonLd.astro';
import PhotoGrid from '@/components/PhotoGrid.astro';
import { Image } from 'astro:assets';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const albums = await getCollection('photography');
  return albums.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);

const formattedDate = entry.data.date.toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
});

const galleryJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ImageGallery',
  name: entry.data.title,
  description: entry.data.description,
  author: {
    '@type': 'Person',
    name: 'Blazej Mrozinski',
    url: 'https://blazejmrozinski.com/about',
  },
  contentLocation: {
    '@type': 'Place',
    name: entry.data.location,
  },
  dateCreated: entry.data.date.toISOString().split('T')[0],
};
---

<Base title={entry.data.title} description={entry.data.description} fullWidth>
  <JsonLd data={galleryJsonLd} />

  <!-- Hero -->
  <div class="relative">
    <div class="aspect-[21/9] max-h-[420px] overflow-hidden">
      <Image
        src={entry.data.hero}
        alt={entry.data.title}
        widths={[800, 1200, 1600, 2000]}
        sizes="100vw"
        class="w-full h-full object-cover"
        loading="eager"
      />
    </div>
    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    <div class="absolute bottom-0 left-0 right-0 p-6 md:p-10">
      <div class="container max-w-5xl mx-auto">
        <h1 class="text-3xl md:text-5xl font-bold tracking-tight text-white">{entry.data.title}</h1>
        <p class="text-white/70 mt-2">
          {entry.data.location} · {formattedDate} · {entry.data.photos.length} photos
        </p>
      </div>
    </div>
  </div>

  <!-- Story -->
  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-10">
    <a href="/photography" class="text-sm text-muted-foreground hover:text-foreground transition-colors">&larr; All Albums</a>

    <div class="prose prose-neutral dark:prose-invert max-w-none mt-6" data-animate>
      <Content />
    </div>
  </div>

  <!-- Photo Grid -->
  <div class="container max-w-5xl mx-auto px-4 sm:px-6 pb-16" data-animate>
    <PhotoGrid photos={entry.data.photos} />
  </div>
</Base>
```

- [ ] **Step 2: Verify the album page renders**

Run: `cd /Users/bajzel/GitHub/blazejmrozinski.com && npm run dev`

Open: `http://localhost:4321/photography/sample-album`

Expected: Page renders with the colored placeholder hero image, story text, and a grid of two thumbnail images. Clicking a thumbnail should expand it inline showing the larger image and caption.

Stop the dev server after verifying.

- [ ] **Step 3: Commit**

```bash
git add src/pages/photography/
git commit -m "feat: add album page with hero, story, and photo grid"
```

---

### Task 7: Build Photography Listing Page

**Files:**
- Create: `src/pages/photography/index.astro`

- [ ] **Step 1: Create the listing page**

This follows the same pattern as `src/pages/projects/index.astro`. Shows a grid of album cards sorted by order, then date.

Write `src/pages/photography/index.astro`:

```astro
---
import Base from '@/layouts/Base.astro';
import AlbumCard from '@/components/AlbumCard.astro';
import { getCollection } from 'astro:content';

const albums = (await getCollection('photography'))
  .sort((a, b) => a.data.order - b.data.order || b.data.date.getTime() - a.data.date.getTime());
---

<Base title="Travel Photography" description="Landscapes and stories from the road — travel photography by Blazej Mrozinski.">
  <div class="container max-w-4xl mx-auto px-4 sm:px-6 py-12">
    <h1 class="text-4xl font-bold tracking-tight mb-2" data-animate>Travel Photography</h1>
    <p class="text-muted-foreground mb-8" data-animate>Landscapes and stories from the road.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {albums.map((album, i) => (
        <div data-animate data-delay={String(Math.min(i + 1, 4))}>
          <AlbumCard
            title={album.data.title}
            description={album.data.description}
            location={album.data.location}
            date={album.data.date}
            photoCount={album.data.photos.length}
            hero={album.data.hero}
            slug={album.id}
          />
        </div>
      ))}
    </div>
  </div>
</Base>
```

- [ ] **Step 2: Verify the listing page renders**

Run: `cd /Users/bajzel/GitHub/blazejmrozinski.com && npm run dev`

Open: `http://localhost:4321/photography`

Expected: Page shows one album card (the sample album) with the hero image, title, location, date, and photo count. Clicking the card navigates to `/photography/sample-album`.

Stop the dev server after verifying.

- [ ] **Step 3: Commit**

```bash
git add src/pages/photography/index.astro
git commit -m "feat: add photography listing page"
```

---

### Task 8: Build HobbiesSection and Add to About Page

**Files:**
- Create: `src/components/HobbiesSection.astro`
- Modify: `src/pages/about.astro`

- [ ] **Step 1: Create the HobbiesSection component**

Write `src/components/HobbiesSection.astro`:

```astro
---
// "Beyond Work" section for the About page
---

<section class="mt-16 pt-12 border-t" data-animate>
  <h2 class="text-2xl font-bold tracking-tight mb-4">Beyond Work</h2>
  <p class="text-muted-foreground mb-6 leading-relaxed">
    When I'm not building products or analyzing data, I'm either chasing light with a camera or chasing elevation on mountain trails.
  </p>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <a href="/photography" class="group block rounded-lg border bg-card text-card-foreground p-6 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <div class="text-2xl mb-3" aria-hidden="true">📷</div>
      <p class="font-semibold group-hover:text-primary/80 transition-colors">Travel Photography</p>
      <p class="text-sm text-muted-foreground mt-2 leading-relaxed">
        Landscapes and street scenes from trips across Europe, South America, and beyond.
      </p>
      <span class="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-3 inline-flex items-center gap-1">
        Browse albums
        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </a>

    <div class="rounded-lg border bg-card text-card-foreground p-6">
      <div class="text-2xl mb-3" aria-hidden="true">🏔</div>
      <p class="font-semibold">Ultrarunning</p>
      <p class="text-sm text-muted-foreground mt-2 leading-relaxed">
        Mountain ultras and long-distance trail races. The longer and steeper, the better.
      </p>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add HobbiesSection to the About page**

In `src/pages/about.astro`, add the import at the top of the frontmatter (after the existing imports):

```typescript
import HobbiesSection from '@/components/HobbiesSection.astro';
```

Then add the component inside the container div, after the `AboutContent` block and before the closing `</div>`:

Find this in `src/pages/about.astro`:
```astro
    {AboutContent && (
      <div class="prose prose-neutral dark:prose-invert max-w-none" data-animate>
        <AboutContent />
      </div>
    )}
  </div>
```

Replace with:
```astro
    {AboutContent && (
      <div class="prose prose-neutral dark:prose-invert max-w-none" data-animate>
        <AboutContent />
      </div>
    )}

    <HobbiesSection />
  </div>
```

- [ ] **Step 3: Verify the About page renders with the hobbies section**

Run: `cd /Users/bajzel/GitHub/blazejmrozinski.com && npm run dev`

Open: `http://localhost:4321/about`

Expected: The About page shows all existing content, followed by a "Beyond Work" section with two cards — Photography (clickable, links to /photography) and Ultrarunning (static). The section has a top border separating it from the main content.

Stop the dev server after verifying.

- [ ] **Step 4: Commit**

```bash
git add src/components/HobbiesSection.astro src/pages/about.astro
git commit -m "feat: add Beyond Work hobbies section to About page"
```

---

### Task 9: Full Build Verification

**Files:** (none — verification only)

- [ ] **Step 1: Run a full production build**

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com && npm run build
```

Expected: Build completes successfully. Output should include the photography pages:
- `photography/index.html`
- `photography/sample-album/index.html`

- [ ] **Step 2: Preview the production build**

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com && npm run preview
```

Open: `http://localhost:4321/photography`

Verify:
1. Listing page shows the sample album card with optimized hero image
2. Clicking the card navigates to the album page
3. Album page shows hero image, story text, photo grid
4. Clicking a thumbnail expands it inline with caption
5. Clicking the expanded photo collapses it
6. About page → "Beyond Work" → Photography card links to `/photography`
7. Back link on album page returns to listing

Stop the preview server after verifying.

---

### Task 10: Update Documentation

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`

- [ ] **Step 1: Add CHANGELOG entry**

Add an entry to the top of the existing changelog in `CHANGELOG.md`:

```markdown
## [Unreleased]

### Added
- Travel photography gallery with album pages and inline photo expand
- Photography content collection with co-located images per album
- Photography listing page at /photography with album cards
- Individual album pages with hero image, narrative story, and photo grid
- "Beyond Work" hobbies section on About page (photography + ultrarunning)
- Sample album for development/testing
```

- [ ] **Step 2: Update README**

Add a `photography/` entry to the Content Collections section of `README.md` (alongside blog, companies, projects, etc.):

```markdown
- `photography/` — travel photo albums (folder per trip with co-located images)
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md README.md
git commit -m "docs: add photography gallery to changelog and readme"
```
