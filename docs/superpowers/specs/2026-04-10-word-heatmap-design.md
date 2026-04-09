# Word Heatmap — Design Spec

**Date:** 2026-04-10
**Status:** Approved
**Route:** `/heat/`

## Overview

An interactive keyword cloud page that visualizes blog tag and label frequency. Clicking a keyword reveals a filtered list of matching blog posts and related landing pages (projects, companies). Serves as an alternative discovery/engagement tool — hidden from navigation, accessible only by URL.

## Data Sources

### Keywords (displayed in cloud)

1. **Blog tags** — extracted from all published blog posts' `tags` frontmatter arrays. Each tag gets a frequency count (number of posts using it). ~20 unique tags currently.

2. **Blog labels** — extracted from all published posts' `label` field. Each label gets a frequency count. 7 labels currently (infrastructure, ai-automation, product, research, systems-thinking, operator-notes, academic-work).

### Filtered Results (displayed on click)

1. **Blog posts** — matched by tag or label.
2. **Projects** — matched via domain (same domain as clicked label) OR via `related_posts` (project links to a post that has the clicked tag/label).
3. **Companies** — matched via domain OR via `related_projects` → `related_posts` chain.

### Out of Scope

- Glossary terms and domains
- Body content word frequency analysis (frontmatter only)
- Search functionality

## Page Structure

### Meta & Visibility

- `<meta name="robots" content="noindex, nofollow">`
- No sitemap entry
- No links from header or footer navigation
- Discoverable only by direct URL

### Layout

Uses `Base.astro` layout (standard header/footer). Immersive feel with wider content area.

```
┌──────────────────────────────────────────┐
│  Header (standard)                       │
├──────────────────────────────────────────┤
│                                          │
│   Title: "Explore by keyword"            │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │                                      │ │
│ │   WORD CLOUD                         │ │
│ │   max-w-5xl, centered flexbox wrap   │ │
│ │   ● tags = solid weighted text       │ │
│ │   ● labels = pill/outline style      │ │
│ │                                      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ── divider (hidden until click) ──────── │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │  Results (hidden until click)        │ │
│ │  "7 posts + 2 pages for «keyword»"  │ │
│ │                                      │ │
│ │  Blog Post Cards                     │ │
│ │  ── Related Pages ──                 │ │
│ │  Project/Company Cards               │ │
│ └──────────────────────────────────────┘ │
│                                          │
├──────────────────────────────────────────┤
│  Footer (standard)                       │
└──────────────────────────────────────────┘
```

## Visual Design

### Word Cloud

- **Flexbox layout:** `flex-wrap: wrap`, `justify-content: center`, `align-items: baseline`
- **Gap:** ~12–20px horizontal, ~8–16px vertical
- **Font sizing:** 14px (frequency 1) to 48px (max frequency), scaled linearly or logarithmically
- **Cursor:** pointer on all keywords, smooth transitions on hover/active

### Tags (solid text style)

- Rendered as plain text
- Font-weight varies with frequency: 400–800
- Color mapped from domain palette (`domains.ts`): for each tag, find the label most commonly co-occurring across its posts. If a tag's posts span 3+ different labels with no majority, use a neutral gray (#a0a0a0)
- Hover: slight scale-up + underline

### Labels (pill/outline style)

- Rendered with border + border-radius, no fill
- Color from existing `labels.ts` palette
- Hover: background fill transitions in
- Visually distinct from tags at a glance

### Active State (both types)

- Background fill with keyword's color at ~15% opacity
- Slight scale bump (1.05)
- Retains its tag/label styling otherwise

### Result Cards

- **Blog post cards:** left color border (post's label color), title as link, description excerpt, label pill + date in muted text
- **Project/Company cards:** same structure with domain label, dashed left border or slightly different background to distinguish from posts
- Results split into "Posts" and "Related Pages" groups; Related Pages subheading only shown if matches exist

### Dark/Light Mode

- Domain color palette has good contrast on both backgrounds
- Result card backgrounds use slightly elevated surface color (matching existing card patterns)

### Responsive

- Cloud font sizes scale down ~20% on mobile
- Results stack naturally (already single-column)
- Full-width on small screens, `max-w-5xl` with padding on desktop

## Interaction

### Click Flow

1. User clicks a keyword `<span>` in the cloud
2. JS adds `.active` class to that keyword, removes from previously active keyword
3. Results section reveals (CSS transition — fade/slide)
4. JS filters pre-rendered hidden content list using `data-tags` and `data-label` attributes
5. Matching blog posts shown first, then projects/companies under "Related Pages"
6. Smooth scroll to results area
7. Clicking same keyword again deselects and hides results

### Content Matching Logic

- **Tag clicked:** show posts where `data-tags` contains that tag
- **Label clicked:** show posts where `data-label` matches that label
- **Projects/Companies:** show if `data-domain` matches a clicked label, OR if any `data-related-posts` slugs appear in the currently matched posts

### URL State

- Active keyword stored in query param: `/heat/?k=wordpress`
- Page loads with keyword pre-selected if param present (shareable links)
- Uses `astro:after-swap` event for persistence across page transitions

### Result Count

A line above results: "7 posts + 2 pages for **wordpress**"

## Analytics

GA4 custom event fired on each keyword click:

```js
gtag('event', 'heatmap_click', { keyword: 'wordpress', keyword_type: 'tag' });
```

Captures: which keywords get clicked, tag vs label engagement ratio.

## File Structure

### New Files

- `src/pages/heat/index.astro` — single self-contained page

### Reused Infrastructure

- `src/layouts/Base.astro` — page layout
- `src/lib/labels.ts` — label colors and display names
- `src/lib/domains.ts` — domain colors for tag coloring
- Filter pattern from `TagFilter.astro` / `LabelFilter.astro` as reference

### No New Dependencies

Zero external JS libraries. Vanilla JS only.
