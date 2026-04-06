# Blog Cover Images & Label System — Design Spec

## Overview

Two features for the blog:

1. **Label system** — 7 high-level topic labels that power filter chips on `/blog`. Each post gets exactly one label. Existing `tags` stay as detail chips on cards.
2. **Programmatic cover images** — generated at build time from post title + label using satori. Each label has a color palette, gradient, and SVG illustration. Same images serve as OG social cards.

## Label Taxonomy

| Label | Slug | Accent Color | Covers |
|-------|------|-------------|--------|
| Infrastructure | `infrastructure` | `#78c8dc` (teal) | DevOps, servers, hosting, WordPress ops |
| AI & Automation | `ai-automation` | `#b48cff` (purple) | AI as CTO, AI workflows, LLM tooling |
| Product | `product` | `#6cc890` (green) | Product thinking, specs, decisions, UX |
| Research | `research` | `#dcb478` (amber) | Quantitative methods, experiments, data |
| Systems Thinking | `systems-thinking` | `#e08080` (red) | Knowledge systems, processes, org design |
| Operator Notes | `operator-notes` | `#c8c8c8` (gray) | Cross-cutting lessons, reflections |
| Academic Work | `academic-work` | `#a0a0d0` (indigo) | Thesis supervision, peer review, methodology |

## Blog Schema Changes

Add a `label` field to the blog content collection schema in `content.config.ts`:

```typescript
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    audience: z.array(z.string()).default([]),
    format: z.string().optional(),
    description: z.string(),
    status: z.enum(['draft', 'published']).default('published'),
    safety_review: z.boolean().default(false),
    label: z.enum([
      'infrastructure',
      'ai-automation',
      'product',
      'research',
      'systems-thinking',
      'operator-notes',
      'academic-work',
    ]).optional(),
  }),
});
```

The `label` field is optional so existing posts without it still work. Posts without a label won't show a cover image and won't be filterable by label.

## Label Filter on /blog

Replace the current `TagFilter` component usage on `/blog` with a new `LabelFilter` component. The existing `TagFilter` component stays in the codebase (it's a general-purpose filter) but the blog listing page switches to label-based filtering.

**LabelFilter behavior:**
- Horizontal row of label chips at the top of `/blog`, styled like the current tag filter
- Each chip shows the label name with a small colored dot matching its accent color
- "All" chip is active by default
- Click a label → filters posts to only that label (client-side, same `?label=` URL pattern)
- Active chip gets `bg-primary text-primary-foreground` styling (same as current TagFilter active state)

**PostCard changes:**
- Tags still display as small chips on each post card (unchanged)
- Add a small label indicator — the label name in small text with its accent color dot, shown near the date

## Cover Image Generation

### Architecture

A prebuild script generates cover images for each blog post that has a label. Uses satori to render HTML/CSS to SVG, then resvg to convert to 1200×630 PNG. Runs before `astro build` via an npm `prebuild` script.

**Generation flow:**
1. `npm run build` triggers `prebuild` script first
2. Script reads all markdown files in `src/content/blog/`, parses frontmatter
3. For each post with a label, render the cover template with satori
4. Output PNG to `public/covers/{post-slug}.png` (deterministic, cacheable)
5. Astro build runs — pages reference covers via `/covers/{slug}.png` URL
6. Cover URL is derived from the post slug (no need to store in frontmatter)

### Cover Template Design

Each cover has:
- **Background:** Dark gradient specific to the label's color world
- **Label badge:** Top-left, small caps text in a bordered pill with accent color
- **Title:** Bottom-left, white, bold, max 60% width (wraps naturally)
- **Site URL:** Below title in accent color, `blazejmrozinski.com`
- **SVG illustration:** Right side, ~40% of card width, prominent

### Label Illustrations (SVG)

Each label has a fixed SVG illustration rendered into the cover:

| Label | Illustration |
|-------|-------------|
| Infrastructure | Server rack with status LEDs, drive bays, terminal prompt |
| AI & Automation | Brain outline with neural pathways, connected nodes, I/O signals |
| Research | Scatter plot with regression line, confidence band, sample size |
| Product | Browser wireframe with nav, hero section, card grid, CTA |
| Systems Thinking | Flowchart with central hub, connected modules, feedback loops |
| Operator Notes | Terminal window with deploy logs, errors, warnings, blinking cursor |
| Academic Work | Research paper with abstract, citation highlight, review checkmark |

### Cover Usage

- **Blog post page:** Displayed as a hero banner below the title in `BlogPost.astro`
- **PostCard:** Optionally shown as a small thumbnail on featured cards
- **OG meta tags:** Used as `og:image` for social sharing (1200×630 is the standard)
- **Posts without a label:** No cover generated, no cover shown — graceful fallback

## Dependencies

New build dependencies:
- `satori` — HTML/CSS to SVG rendering
- `@resvg/resvg-js` — SVG to PNG conversion (faster and better quality than sharp for this use case)

## Pages Modified

| Page/Component | Change |
|----------------|--------|
| `src/content.config.ts` | Add `label` enum field to blog schema |
| `src/pages/blog/index.astro` | Replace TagFilter with LabelFilter, pass label data |
| `src/components/LabelFilter.astro` | New — label filter chips with colored dots |
| `src/components/PostCard.astro` | Add label indicator near date |
| `src/layouts/BlogPost.astro` | Add cover image display below title, set og:image |
| `src/pages/blog/[...slug].astro` | Pass label to BlogPost layout |
| `scripts/generate-covers.ts` | New — build-time cover generation script |
| `src/lib/labels.ts` | New — label config (colors, gradients, display names) |
| `src/lib/cover-svgs.ts` | New — SVG illustration templates per label |

## Label Config Structure

```typescript
// src/lib/labels.ts
export const labels = {
  'infrastructure': {
    name: 'Infrastructure',
    accent: '#78c8dc',
    gradient: ['#061e2e', '#0d3a4e', '#0a2e3e'],
  },
  'ai-automation': {
    name: 'AI & Automation',
    accent: '#b48cff',
    gradient: ['#120827', '#1e0d45', '#180a38'],
  },
  'product': {
    name: 'Product',
    accent: '#6cc890',
    gradient: ['#0a1f12', '#143826', '#0d2a1a'],
  },
  'research': {
    name: 'Research',
    accent: '#dcb478',
    gradient: ['#1f1208', '#3a2510', '#2b1a0a'],
  },
  'systems-thinking': {
    name: 'Systems Thinking',
    accent: '#e08080',
    gradient: ['#1a0a0a', '#3a1818', '#2a1010'],
  },
  'operator-notes': {
    name: 'Operator Notes',
    accent: '#c8c8c8',
    gradient: ['#0f0f0f', '#1c1c1c', '#141414'],
  },
  'academic-work': {
    name: 'Academic Work',
    accent: '#a0a0d0',
    gradient: ['#0d0a1f', '#1a1440', '#140f30'],
  },
} as const;
```

## ContentForge Integration

ContentForge posts already have `tags` and `audience` fields. The new `label` field needs to be added to posts in the ContentForge repo. This is a one-time addition per post — ContentForge should include `label` in its frontmatter template going forward.

## Out of Scope

- Tag-based filtering (tags stay visible but not used for the filter bar)
- Cover image manual override via frontmatter (can add later if needed)
- Different illustrations per post within the same label (all posts in a label share the same illustration)
- Animated covers
- Dark/light mode variants of covers
