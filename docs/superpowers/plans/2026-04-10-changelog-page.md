# Changelog Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public `/changelog/` section with a timeline index page and per-release detail pages, powered by parsing `CHANGELOG.md` at build time.

**Architecture:** A parser utility (`src/lib/changelog.ts`) reads `CHANGELOG.md` and extracts structured release data. Two Astro pages consume this data: an index page rendering a vertical timeline, and a dynamic detail page per release. The footer gets a version badge and a Changelog nav link.

**Tech Stack:** Astro (static SSG), Tailwind CSS 4.2, TypeScript, Node.js `fs` for build-time file reading.

**Spec:** `docs/superpowers/specs/2026-04-10-changelog-page-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `CHANGELOG.md` | Add ` — Title` to each release heading |
| Create | `src/lib/changelog.ts` | Parse CHANGELOG.md into `Release[]` |
| Create | `src/pages/changelog/index.astro` | Timeline index page |
| Create | `src/pages/changelog/[version].astro` | Release detail page |
| Modify | `src/components/Footer.astro` | Version badge in brand column + Changelog nav link |
| Create | `src/pages/sitemap-changelog.xml.ts` | Changelog sitemap |
| Modify | `src/pages/sitemap-index.xml.ts` | Register changelog sitemap |
| Modify | `CHANGELOG.md` | Add entry for this feature |

---

### Task 1: Add Release Titles to CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

This is a retroactive edit — append ` — Title` to each release heading so the parser can extract human-readable titles for the timeline.

- [ ] **Step 1: Edit CHANGELOG.md headings**

Change each `## [x.y.z] — date` heading to include a title. Apply these exact edits:

```
## [0.6.1] — 2026-04-10
→
## [0.6.1] — 2026-04-10 — Word Heatmap

## [0.6.0] — 2026-04-09
→
## [0.6.0] — 2026-04-09 — Glossary

## [0.5.3] — 2026-04-09
→
## [0.5.3] — 2026-04-09 — IndexNow Fix

## [0.5.2] — 2026-04-06
→
## [0.5.2] — 2026-04-06 — SEO Meta Titles

## [0.5.1] — 2026-04-06
→
## [0.5.1] — 2026-04-06 — WordPress Infrastructure Series

## [0.5.0] — 2026-04-06
→
## [0.5.0] — 2026-04-06 — Blog Label System

## [0.4.0] — 2026-04-05
→
## [0.4.0] — 2026-04-05 — Photography Gallery

## [0.3.0] — 2026-04-04
→
## [0.3.0] — 2026-04-04 — RSS & Analytics

## [0.2.0] — 2026-04-04
→
## [0.2.0] — 2026-04-04 — Site Launch

## [0.1.0] — 2026-04-04
→
## [0.1.0] — 2026-04-04 — Initial Setup
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add release titles to CHANGELOG.md headings"
```

---

### Task 2: Create CHANGELOG.md Parser

**Files:**
- Create: `src/lib/changelog.ts`

- [ ] **Step 1: Create the parser**

Create `src/lib/changelog.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ACCENT_PALETTE = [
  '#a78bfa', // purple
  '#60a5fa', // blue
  '#f59e0b', // amber
  '#34d399', // green
  '#f472b6', // pink
  '#22d3ee', // cyan
  '#fb923c', // orange
  '#a3e635', // lime
];

export interface ReleaseChanges {
  added: string[];
  changed: string[];
  fixed: string[];
  removed: string[];
}

export interface Release {
  version: string;
  date: string;
  title: string;
  description: string;
  isMajor: boolean;
  accentColor: string;
  changes: ReleaseChanges;
}

function deriveTitle(changes: ReleaseChanges): string {
  const first = changes.added[0] || changes.changed[0] || changes.fixed[0] || changes.removed[0] || '';
  const dash = first.indexOf(' — ');
  if (dash > 0) return first.slice(0, dash);
  const period = first.indexOf('. ');
  if (period > 0) return first.slice(0, period);
  if (first.length > 60) return first.slice(0, 60).replace(/\s+\S*$/, '') + '…';
  return first;
}

function deriveDescription(changes: ReleaseChanges): string {
  const first = changes.added[0] || changes.changed[0] || changes.fixed[0] || changes.removed[0] || '';
  const period = first.indexOf('. ');
  if (period > 0) return first.slice(0, period + 1);
  return first;
}

function parseChanges(block: string): ReleaseChanges {
  const changes: ReleaseChanges = { added: [], changed: [], fixed: [], removed: [] };
  let currentCategory: string | null = null;

  for (const line of block.split('\n')) {
    const categoryMatch = line.match(/^### (\w+)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].toLowerCase();
      continue;
    }
    if (currentCategory && line.startsWith('- ')) {
      const item = line.slice(2).trim();
      if (currentCategory in changes) {
        changes[currentCategory as keyof ReleaseChanges].push(item);
      } else {
        changes.added.push(item);
      }
    }
  }

  return changes;
}

export function getAllReleases(): Release[] {
  const content = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf-8');
  const releases: Release[] = [];
  let majorIndex = 0;

  const blocks = content.split(/^## /m).slice(1);

  for (const block of blocks) {
    const headingMatch = block.match(/^\[(\d+\.\d+\.\d+)\]\s*—\s*(\d{4}-\d{2}-\d{2})(?:\s*—\s*(.+?))?$/m);
    if (!headingMatch) continue;

    const [, version, date, explicitTitle] = headingMatch;
    const patch = parseInt(version.split('.')[2], 10);
    const isMajor = patch === 0 && version !== '0.1.0';

    const changes = parseChanges(block);
    const accentColor = isMajor
      ? (version === '0.2.0' ? '#ffffff' : ACCENT_PALETTE[majorIndex % ACCENT_PALETTE.length])
      : '#666666';
    if (isMajor) majorIndex++;

    const title = explicitTitle?.trim() || deriveTitle(changes);
    const description = deriveDescription(changes);

    releases.push({ version, date, title, description, isMajor, accentColor, changes });
  }

  return releases;
}

export function getReleaseByVersion(version: string): Release | undefined {
  return getAllReleases().find((r) => r.version === version);
}

export function getLatestVersion(): string {
  const releases = getAllReleases();
  return releases.length > 0 ? releases[0].version : '0.0.0';
}
```

- [ ] **Step 2: Verify the parser**

Run a quick verification script:

```bash
npx tsx -e "
  const { getAllReleases, getLatestVersion } = require('./src/lib/changelog.ts');
  const releases = getAllReleases();
  console.log('Total releases:', releases.length);
  console.log('Latest version:', getLatestVersion());
  releases.forEach(r => console.log(
    r.isMajor ? '●' : '·',
    'v' + r.version,
    '—',
    r.title,
    '| added:', r.changes.added.length,
    'changed:', r.changes.changed.length,
    'fixed:', r.changes.fixed.length,
    'removed:', r.changes.removed.length
  ));
"
```

Expected output: 10 releases listed, v0.6.1 as latest, major releases (v0.2.0–v0.6.0 + v0.6.1) marked with `●`, v0.1.0 and patches marked with `·`. Each release should have a title and non-zero change counts.

If the import syntax doesn't work with `require`, try:

```bash
npx tsx -e "
  import { getAllReleases, getLatestVersion } from './src/lib/changelog.ts';
  const releases = getAllReleases();
  console.log('Total releases:', releases.length);
  console.log('Latest version:', getLatestVersion());
  for (const r of releases) {
    console.log(r.isMajor ? '●' : '·', 'v' + r.version, '—', r.title, '| a:', r.changes.added.length, 'c:', r.changes.changed.length, 'f:', r.changes.fixed.length, 'r:', r.changes.removed.length);
  }
"
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/changelog.ts
git commit -m "feat(changelog): add CHANGELOG.md parser utility"
```

---

### Task 3: Build the Changelog Index Page

**Files:**
- Create: `src/pages/changelog/index.astro`

**Reference patterns:** `src/pages/glossary/index.astro` for layout/CSS classes.

- [ ] **Step 1: Create the index page**

Create `src/pages/changelog/index.astro`:

```astro
---
import Base from '@/layouts/Base.astro';
import { getAllReleases } from '@/lib/changelog';
import type { Release } from '@/lib/changelog';

const releases = getAllReleases();
const totalReleases = releases.length;
const earliestDate = releases.length > 0 ? releases[releases.length - 1].date : '';
const earliestMonth = earliestDate
  ? new Date(earliestDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  : '';

// Group into timeline entries: major releases get cards, consecutive patches cluster
type TimelineEntry =
  | { type: 'major'; release: Release }
  | { type: 'patches'; releases: Release[] };

const timeline: TimelineEntry[] = [];
let patchBuffer: Release[] = [];

for (const release of releases) {
  if (release.isMajor) {
    if (patchBuffer.length > 0) {
      timeline.push({ type: 'patches', releases: [...patchBuffer] });
      patchBuffer = [];
    }
    timeline.push({ type: 'major', release });
  } else {
    patchBuffer.push(release);
  }
}
if (patchBuffer.length > 0) {
  timeline.push({ type: 'patches', releases: patchBuffer });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
---

<Base
  title="Changelog"
  description="How blazejmrozinski.com evolves — every feature, fix, and iteration tracked release by release."
>
  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <h1 class="text-4xl font-bold tracking-tight mb-2" data-animate>Changelog</h1>
    <p class="text-muted-foreground mb-1" data-animate data-delay="1">
      How this site evolves — every feature, fix, and iteration.
    </p>
    <p class="text-sm text-muted-foreground/60 mb-10" data-animate data-delay="1">
      {totalReleases} releases since {earliestMonth}
    </p>

    <!-- Timeline -->
    <div class="relative ml-3 sm:ml-6 border-l-2 border-border" data-animate data-delay="2">
      {timeline.map((entry, i) => {
        const delay = String(Math.min(i + 3, 6));

        if (entry.type === 'major') {
          const r = entry.release;
          const isLaunch = r.version === '0.2.0';
          const dotSize = isLaunch ? 'h-5 w-5' : 'h-4 w-4';
          const dotOffset = isLaunch ? '-left-[11px]' : '-left-[9px]';
          const borderClass = isLaunch ? 'border-foreground/30' : 'border-border';

          return (
            <div class="relative pb-8 pl-6 sm:pl-8" data-animate data-delay={delay}>
              {/* Timeline dot */}
              <div
                class:list={['absolute top-5 rounded-full border-[3px] border-background', dotSize, dotOffset]}
                style={`background-color: ${r.accentColor};`}
              />
              {/* Card */}
              <a
                href={`/changelog/v${r.version}/`}
                class:list={[
                  'block rounded-xl border p-5 bg-card hover:border-foreground/20 transition-colors group',
                  isLaunch && 'border-foreground/10',
                ]}
              >
                <div class="flex items-baseline justify-between gap-4 mb-1">
                  <span
                    class="text-xs font-semibold tracking-wide"
                    style={`color: ${r.accentColor};`}
                  >
                    v{r.version}
                  </span>
                  <span class="text-xs text-muted-foreground/50 shrink-0">
                    {formatDate(r.date)}
                  </span>
                </div>
                <h2 class="text-lg font-bold tracking-tight mb-1 group-hover:text-primary transition-colors">
                  {r.title}
                </h2>
                <p class="text-sm text-muted-foreground leading-relaxed mb-3">
                  {r.description}
                </p>
                <div class="flex items-center gap-2 flex-wrap">
                  {r.changes.added.length > 0 && (
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                      {r.changes.added.length} added
                    </span>
                  )}
                  {r.changes.changed.length > 0 && (
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                      {r.changes.changed.length} changed
                    </span>
                  )}
                  {r.changes.fixed.length > 0 && (
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                      {r.changes.fixed.length} fixed
                    </span>
                  )}
                  {r.changes.removed.length > 0 && (
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                      {r.changes.removed.length} removed
                    </span>
                  )}
                  <span class="flex-1" />
                  <span class="text-xs text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                    view release →
                  </span>
                </div>
              </a>
            </div>
          );
        }

        // Patch cluster
        return (
          <div class="relative pb-8 pl-6 sm:pl-8" data-animate data-delay={delay}>
            {/* Small dot */}
            <div class="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-muted-foreground/30" />
            <div class="space-y-1">
              {entry.releases.map((r) => (
                <a
                  href={`/changelog/v${r.version}/`}
                  class="flex items-baseline justify-between gap-4 py-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div class="flex items-baseline gap-2 min-w-0">
                    <span class="text-xs font-medium text-muted-foreground/70 shrink-0">
                      v{r.version}
                    </span>
                    <span class="text-sm truncate">{r.title}</span>
                  </div>
                  <span class="text-xs text-muted-foreground/40 shrink-0">
                    {shortDate(r.date)}
                  </span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
</Base>
```

- [ ] **Step 2: Verify in dev server**

```bash
npm run dev
```

Open `http://localhost:4321/changelog/` in the browser. Verify:
- Page title and subtitle render
- Timeline spine shows with correct vertical line
- Major releases show as cards with colored dots, titles, descriptions, badges
- Patch releases cluster as compact inline rows
- v0.2.0 has a slightly larger dot and brighter border
- All links point to `/changelog/vX.Y.Z/` (will 404 until Task 4)

- [ ] **Step 3: Commit**

```bash
git add src/pages/changelog/index.astro
git commit -m "feat(changelog): add timeline index page at /changelog/"
```

---

### Task 4: Build the Release Detail Page

**Files:**
- Create: `src/pages/changelog/[version].astro`

**Reference patterns:** `src/pages/glossary/[...slug].astro` for getStaticPaths + Breadcrumb usage.

- [ ] **Step 1: Create the detail page**

Create `src/pages/changelog/[version].astro`:

```astro
---
import Base from '@/layouts/Base.astro';
import Breadcrumb from '@/components/Breadcrumb.astro';
import { getAllReleases } from '@/lib/changelog';
import type { Release } from '@/lib/changelog';

export function getStaticPaths() {
  const releases = getAllReleases();
  return releases.map((release, index) => ({
    params: { version: `v${release.version}` },
    props: {
      release,
      prevRelease: releases[index + 1] || null,
      nextRelease: releases[index - 1] || null,
    },
  }));
}

interface Props {
  release: Release;
  prevRelease: Release | null;
  nextRelease: Release | null;
}

const { release, prevRelease, nextRelease } = Astro.props;

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const categories = [
  { key: 'added' as const, label: 'Added', dotColor: 'bg-emerald-400', textColor: 'text-emerald-400' },
  { key: 'changed' as const, label: 'Changed', dotColor: 'bg-amber-400', textColor: 'text-amber-400' },
  { key: 'fixed' as const, label: 'Fixed', dotColor: 'bg-blue-400', textColor: 'text-blue-400' },
  { key: 'removed' as const, label: 'Removed', dotColor: 'bg-red-400', textColor: 'text-red-400' },
];
---

<Base
  title={`v${release.version}: ${release.title} — Changelog`}
  description={release.description}
>
  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <Breadcrumb crumbs={[
      { label: 'Home', href: '/' },
      { label: 'Changelog', href: '/changelog' },
      { label: `v${release.version}` },
    ]} />

    {/* Header */}
    <header class="mb-8" data-animate>
      <div class="flex items-center gap-3 mb-3">
        <span
          class="text-xs font-semibold tracking-wide px-2.5 py-1 rounded-full"
          style={`color: ${release.accentColor}; background-color: ${release.accentColor}15;`}
        >
          v{release.version}
        </span>
        <span class="text-sm text-muted-foreground/60">
          {formatDate(release.date)}
        </span>
      </div>
      <h1 class="text-4xl font-bold tracking-tight mb-3">{release.title}</h1>
      <p class="text-muted-foreground leading-relaxed">{release.description}</p>
    </header>

    {/* Stats bar */}
    <div class="flex gap-2 flex-wrap mb-8" data-animate data-delay="1">
      {release.changes.added.length > 0 && (
        <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
          {release.changes.added.length} added
        </span>
      )}
      {release.changes.changed.length > 0 && (
        <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">
          {release.changes.changed.length} changed
        </span>
      )}
      {release.changes.fixed.length > 0 && (
        <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400">
          {release.changes.fixed.length} fixed
        </span>
      )}
      {release.changes.removed.length > 0 && (
        <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">
          {release.changes.removed.length} removed
        </span>
      )}
    </div>

    <hr class="border-border mb-8" />

    {/* Change sections */}
    {categories.map(({ key, label, dotColor, textColor }) => {
      const items = release.changes[key];
      if (items.length === 0) return null;
      return (
        <section class="mb-8" data-animate data-delay="2">
          <div class="flex items-center gap-2 mb-4">
            <span class:list={['w-1.5 h-1.5 rounded-full', dotColor]} />
            <h2 class:list={['text-xs font-semibold uppercase tracking-widest', textColor]}>
              {label}
            </h2>
          </div>
          <ul class="space-y-0">
            {items.map((item) => (
              <li class="text-sm text-foreground/80 leading-relaxed py-2 border-b border-border/50 last:border-0">
                {item}
              </li>
            ))}
          </ul>
        </section>
      );
    })}

    {/* Prev / Next */}
    <hr class="border-border mt-4 mb-6" />
    <nav class="flex justify-between items-start gap-4" data-animate data-delay="3">
      {prevRelease ? (
        <a
          href={`/changelog/v${prevRelease.version}/`}
          class="flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors min-w-0"
        >
          <span class="text-muted-foreground/40 mt-0.5 shrink-0">←</span>
          <div class="min-w-0">
            <div class="text-[10px] uppercase tracking-wide text-muted-foreground/50">Previous</div>
            <div class="text-sm truncate">v{prevRelease.version} — {prevRelease.title}</div>
          </div>
        </a>
      ) : <div />}
      {nextRelease ? (
        <a
          href={`/changelog/v${nextRelease.version}/`}
          class="flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors text-right min-w-0"
        >
          <div class="min-w-0">
            <div class="text-[10px] uppercase tracking-wide text-muted-foreground/50">Next</div>
            <div class="text-sm truncate">v{nextRelease.version} — {nextRelease.title}</div>
          </div>
          <span class="text-muted-foreground/40 mt-0.5 shrink-0">→</span>
        </a>
      ) : <div />}
    </nav>
  </div>
</Base>
```

- [ ] **Step 2: Verify in dev server**

```bash
npm run dev
```

Open `http://localhost:4321/changelog/v0.6.0/` in the browser. Verify:
- Breadcrumb shows: Home › Changelog › v0.6.0
- Version badge in accent color, date, title, description render
- Stats badges show correct counts
- Change sections appear with color-coded labels (Added green, Changed amber, etc.)
- Each change item listed with subtle separators
- Prev/Next navigation links work and point to adjacent releases

Also check `http://localhost:4321/changelog/v0.2.0/` (the launch release) and `http://localhost:4321/changelog/v0.1.0/` (the first release, should have no "Previous" link).

- [ ] **Step 3: Commit**

```bash
git add src/pages/changelog/[version].astro
git commit -m "feat(changelog): add release detail pages at /changelog/vX.Y.Z/"
```

---

### Task 5: Update Footer

**Files:**
- Modify: `src/components/Footer.astro`

Two changes: (1) version badge below brand bio, (2) Changelog link in Pages column.

- [ ] **Step 1: Add import and version variable**

In `src/components/Footer.astro`, add the import and variable in the frontmatter (between the `---` fences):

Add after the existing imports (after line 4 `import logoDark from '@/assets/logo-dark.png';`):

```typescript
import { getLatestVersion } from '@/lib/changelog';

const latestVersion = getLatestVersion();
```

- [ ] **Step 2: Add version badge below the brand bio**

In `src/components/Footer.astro`, find the brand bio paragraph (line 46-48):

```html
        <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
          Psychologist, psychometrician, product builder. Building at the intersection of cognitive science, AI, and growth engineering.
        </p>
```

Add immediately after it:

```html
        <a
          href="/changelog"
          class="inline-block mt-2 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          v{latestVersion} · <span class="underline underline-offset-2">view changelog</span>
        </a>
```

- [ ] **Step 3: Add Changelog to the Pages nav list**

In `src/components/Footer.astro`, find the `footerLinks.pages` array (lines 7-15) and add a Changelog entry after CV:

```typescript
    { href: '/cv', label: 'CV' },
    { href: '/changelog', label: 'Changelog' },
```

- [ ] **Step 4: Verify in dev server**

```bash
npm run dev
```

Open `http://localhost:4321/` and scroll to the footer. Verify:
- Brand column shows `v0.6.1 · view changelog` below the bio text
- Version badge links to `/changelog/`
- "Changelog" appears in the Pages column list
- Both links work

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat(changelog): add version badge and nav link to footer"
```

---

### Task 6: Add Changelog Sitemap

**Files:**
- Create: `src/pages/sitemap-changelog.xml.ts`
- Modify: `src/pages/sitemap-index.xml.ts`

**Reference pattern:** `src/pages/sitemap-glossary.xml.ts`

- [ ] **Step 1: Create the changelog sitemap**

Create `src/pages/sitemap-changelog.xml.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getAllReleases } from '@/lib/changelog';

const site = 'https://www.blazejmrozinski.com';

export const GET: APIRoute = () => {
  const releases = getAllReleases();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}/changelog/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
${releases.map((r) => `  <url>
    <loc>${site}/changelog/v${r.version}/</loc>
    <lastmod>${r.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
```

- [ ] **Step 2: Register in sitemap index**

In `src/pages/sitemap-index.xml.ts`, add the changelog sitemap entry. Find:

```xml
  <sitemap>
    <loc>${site}/sitemap-glossary.xml</loc>
  </sitemap>
```

Add after it:

```xml
  <sitemap>
    <loc>${site}/sitemap-changelog.xml</loc>
  </sitemap>
```

- [ ] **Step 3: Verify sitemaps**

```bash
npm run dev
```

Open `http://localhost:4321/sitemap-changelog.xml` — should list the changelog index URL and one URL per release.

Open `http://localhost:4321/sitemap-index.xml` — should include `sitemap-changelog.xml` in the list.

- [ ] **Step 4: Commit**

```bash
git add src/pages/sitemap-changelog.xml.ts src/pages/sitemap-index.xml.ts
git commit -m "feat(changelog): add changelog sitemap and register in index"
```

---

### Task 7: Full Build Verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors. The changelog pages should appear in the build output (`dist/changelog/index.html`, `dist/changelog/v0.6.1/index.html`, etc.).

- [ ] **Step 2: Preview and spot-check**

```bash
npm run preview
```

Open `http://localhost:4321/changelog/` and walk through:
1. Index page loads with timeline
2. Click a major release card → detail page loads with full change list
3. Prev/Next navigation works on detail pages
4. Footer version badge and Changelog nav link work
5. Click back to index from breadcrumb

- [ ] **Step 3: Check all release detail pages generate**

```bash
ls dist/changelog/
```

Expected: Directories for `v0.1.0`, `v0.2.0`, `v0.3.0`, `v0.4.0`, `v0.5.0`, `v0.5.1`, `v0.5.2`, `v0.5.3`, `v0.6.0`, `v0.6.1`, each containing `index.html`.

---

### Task 8: Update Documentation

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add changelog entry for this feature**

Add a new release section at the top of `CHANGELOG.md` (after the header line, before the v0.6.1 entry):

```markdown
## [0.7.0] — 2026-04-10 — Changelog

### Added
- Changelog timeline page at `/changelog/` with vertical timeline, colored release dots, and major/patch visual tiers
- Individual release detail pages at `/changelog/vX.Y.Z/` with categorized change lists and prev/next navigation
- CHANGELOG.md parser utility (`src/lib/changelog.ts`) — extracts structured release data at build time
- Version badge in footer brand column linking to changelog
- Changelog link in footer navigation
- Changelog sitemap at `/sitemap-changelog.xml` registered in sitemap index
- Release title convention in CHANGELOG.md headings (`## [x.y.z] — date — Title`)
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "feat(changelog): add changelog page feature — v0.7.0

Timeline index at /changelog/ with per-release detail pages,
CHANGELOG.md parser, footer integration, and sitemap."
```
