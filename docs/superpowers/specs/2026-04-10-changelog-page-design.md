# Changelog Page — Design Spec

## Overview

A public-facing `/changelog/` section that presents the site's evolution as an interactive timeline. Dual audience: general visitors see a narrative of how the site grows; tech-curious visitors can drill into categorized change lists per release.

**Data source:** CHANGELOG.md (parsed at build time). No new content collection.

## Routes

| Route | Description |
|-------|-------------|
| `/changelog/` | Index page — timeline of all releases |
| `/changelog/[version]/` | Detail page per release (e.g., `/changelog/v0.6.0/`) |

## Index Page (`/changelog/`)

### Layout

- **Container:** max-w-3xl, matching blog and glossary pages
- **Header:** Serif H1 "Changelog", subtitle "How this site evolves — every feature, fix, and iteration.", release count stat line (e.g., "10 releases since April 2026")
- **Body:** Vertical timeline with left-aligned spine

### Timeline Structure

The timeline is a vertical line (2px, border color) with release nodes attached. Two visual tiers:

**Major releases (x.Y.0)** render as full cards:
- Large colored dot on the timeline spine (16px, unique accent color per release)
- Card with: version badge (colored), date, serif title, narrative description, change count badges (Added/Changed/Fixed/Removed), "view release →" link
- Each card is a clickable link to its detail page
- Scroll-in animation with staggered delays (data-animate pattern)

**Patch/minor releases (x.y.Z where Z > 0)** cluster into compact inline rows:
- Small dot on the spine (8px, muted gray)
- Single-line: version number, one-line description, date
- Each row links to its detail page
- Consecutive patches group together between major releases

**Special case — v0.2.0 (Site Launch):** Slightly larger dot (20px), brighter border on the card, to mark the origin story.

### Accent Colors

Each major release gets a unique accent color from a rotating palette. The color applies to the timeline dot, the version badge text, and the version badge background on the detail page. Palette cycles through a set of 7-8 colors (purple, blue, amber, green, pink, cyan, orange, etc.) mapped by release index.

## Release Detail Page (`/changelog/[version]/`)

### Layout

- **Container:** max-w-3xl
- **Breadcrumb:** Changelog / v0.6.0
- **Header:** Version badge (pill, accent-colored) + date, serif H1 title, narrative description paragraph
- **Stats bar:** Change count badges (same as index card)
- **Change sections:** Grouped by category, each with:
  - Colored dot + uppercase label: Added (green), Changed (amber), Fixed (blue), Removed (red)
  - List of change items (parsed from CHANGELOG.md bullets)
  - Subtle separator between items
- **Prev/Next navigation:** Links to adjacent releases at the bottom, showing version + title

### Data Per Release

```typescript
interface Release {
  version: string;       // "0.6.0"
  date: string;          // "2026-04-09"
  title: string;         // "Glossary System" — from heading convention
  description: string;   // derived from first "Added" bullet, truncated to first sentence
  isMajor: boolean;      // true if patch version is 0
  accentColor: string;   // from rotating palette
  changes: {
    added: string[];
    changed: string[];
    fixed: string[];
    removed: string[];
  };
}
```

## CHANGELOG.md Title Convention

To support human-readable titles on the timeline, adopt a heading convention:

```markdown
## [0.6.1] — 2026-04-10 — Word Heatmap
```

Appending ` — Title` after the date. The parser extracts the title if present; if absent, it derives one from the first "Added" bullet (truncated to first clause).

This is a one-time retroactive edit to CHANGELOG.md (add titles to existing releases) plus a going-forward convention.

## Homepage Version Badge

A small text link in the footer's brand column (the first column with the name + bio), positioned below the bio paragraph:

```
v0.6.1 · view changelog
```

- Font size: ~11px, muted color (#444 dark / equivalent in light mode)
- "view changelog" is underlined
- Links to `/changelog/`
- Version number is read from the same parser (latest release)

## Footer Navigation

Add "Changelog" to the footer's Pages column, alongside the existing Glossary link.

## Data Flow

1. **`src/lib/changelog.ts`** — parser utility:
   - Reads `CHANGELOG.md` from the project root at build time
   - Parses semver headings, dates, optional titles
   - Groups bullet items by category (Added/Changed/Fixed/Removed)
   - Non-standard categories (e.g., "Components" in v0.2.0) are folded into Added
   - Returns `Release[]` sorted newest-first
   - Exports helpers: `getLatestVersion()`, `getReleaseByVersion()`, `getAllReleases()`

2. **`src/pages/changelog/index.astro`** — calls `getAllReleases()`, renders timeline
3. **`src/pages/changelog/[version].astro`** — dynamic route, calls `getReleaseByVersion()`, renders detail page
4. **Footer component** — calls `getLatestVersion()` for the badge
5. **`src/pages/sitemap-changelog.xml.ts`** — generates sitemap from all releases
6. **`src/pages/sitemap-index.xml.ts`** — updated to include changelog sitemap

## SEO

- **Index page:** title "Changelog — Blazej Mrozinski", description about site evolution
- **Detail pages:** title "v0.6.0: Glossary System — Changelog", description from the release narrative
- No JSON-LD required (no standard schema for changelogs)
- `<link rel="canonical">` on each page
- Sitemap inclusion per the sitemap rules in CLAUDE.md

## Mobile Considerations

- Timeline spine and dots scale down slightly on mobile
- Cards maintain full width (single column, already constrained by max-w-3xl)
- Compact patch rows remain single-line, with date wrapping below version if needed
- Prev/Next nav stacks vertically on narrow screens

## Dark/Light Mode

All colors use the existing OKLCH-based CSS custom properties. Accent colors for timeline dots and version badges work in both themes (chosen for sufficient contrast in both). Card backgrounds use `bg-card`, borders use `border` tokens.

## Scroll Animations

Use the existing `data-animate` system with staggered `data-delay` attributes on timeline entries, matching the blog and glossary index pages.

## What This Spec Does NOT Include

- No filtering or search on the changelog index (YAGNI — 10 releases today)
- No RSS feed for the changelog
- No cover image generation for releases
- No content collection — CHANGELOG.md is the single source of truth
- No JavaScript interactivity beyond existing scroll animations
