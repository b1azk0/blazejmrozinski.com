# Breadcrumbs + Section Navigation

**Date:** 2026-04-06
**Status:** Approved

## Summary

Add breadcrumbs and two section navigation patterns to improve wayfinding across the site. Breadcrumbs appear on all nested pages. Blog posts get a left sidebar TOC with scroll-tracking highlights. Company and case study pages get discreet right-edge dot navigation with scroll-tracking. Both nav patterns are desktop-only (hidden below `md:` breakpoint).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Breadcrumb scope | Blog, company, case study pages | Nested pages benefit from path context. Flat pages (About, CV, Contact, Publications) are top-level nav items — breadcrumbs add nothing. |
| Blog section nav | Left sidebar, sticky | Long posts (5,000+ words) need real navigation. Left sidebar is the standard docs/article pattern. |
| LP section nav | Right-edge dots with hover labels | Company/project pages are shorter. Discreet treatment matches the editorial aesthetic. |
| Scroll tracking | Yes, IntersectionObserver | Active section highlights as reader scrolls. Re-initializes on Astro view transitions. |
| Mobile behavior | Hidden below `md:` (768px) | Sidebar would fight content width. Dots too small to tap. Mobile readers scroll linearly. |
| Blog prose width | Unchanged (`max-w-3xl`) | Sidebar sits outside the prose column. Outer container widens to accommodate both. |
| Minimum headings | 3 h2s required | Don't show nav on pages with only 1-2 sections — not worth the visual overhead. |

## Component: Breadcrumb.astro

**Props:** `crumbs: {label: string, href: string}[]`

Renders a horizontal breadcrumb trail:
```
Home › Blog › Why I Ditched Managed WordPress Hosting
```

- All segments are links except the last (current page) — rendered as muted plain text
- Separator: `›` character
- Styled: `text-sm text-muted-foreground`, no background, sits between header and page title inside the content container
- Includes `BreadcrumbList` JSON-LD schema (array of `ListItem` with `position`, `name`, `item`)

**Integration:**
- `blog/[...slug].astro` → `[{label: "Home", href: "/"}, {label: "Blog", href: "/blog"}, {label: post.title}]`
- `work/[...slug].astro` → `[{label: "Home", href: "/"}, {label: "Work", href: "/work"}, {label: company.name}]`
- `projects/[...slug].astro` → `[{label: "Home", href: "/"}, {label: "Case Studies", href: "/projects"}, {label: project.name}]`

Last crumb has no `href` — component renders it as `<span>` instead of `<a>`.

## Component: BlogSidebar.astro

**Props:** `headings: {id: string, text: string}[]`

Left sidebar TOC for blog posts. Desktop only.

**Structure:**
- Label: "On this page" in small uppercase muted text
- List of heading links, each pointing to `#{id}`
- Active heading has a left accent border (`border-l-2 border-primary text-foreground`)
- Inactive headings: `text-muted-foreground`
- Smooth scroll on click (`scroll-behavior: smooth`)

**Layout integration in BlogPost.astro:**
- On `md:` screens: flex container with sidebar (~180px fixed) + prose column (`max-w-3xl`, unchanged)
- Outer wrapper widens to hold sidebar + prose without compressing prose (sidebar ~180px + prose `max-w-3xl` 768px + gap = ~960-980px total; use a custom `max-w` or `max-w-6xl` 1152px with the prose column constrained internally)
- Sidebar: `sticky top-24` so it follows the reader
- Below `md:`: sidebar is `hidden`, layout is single-column as today

**Client-side scroll tracking:**
- IntersectionObserver watches all h2 elements inside the article
- `rootMargin: '0px 0px -70% 0px'` — triggers when heading is in the top 30% of viewport
- When a heading enters, its sidebar link gets the active class, others lose it
- Script re-initializes on `astro:after-swap` event (view transitions)
- Click handler uses `scrollIntoView({ behavior: 'smooth' })`, respects `prefers-reduced-motion`

## Component: SectionDots.astro

**Props:** `headings: {id: string, text: string}[]`

Right-edge dot navigation for company and case study pages. Desktop only.

**Structure:**
- `fixed` position, right edge of viewport, vertically centered
- Column of dots, each a clickable link to `#{id}`
- Active dot: larger (8px), accent color
- Inactive dots: smaller (5px), muted color
- Labels appear on hover — slide in from the right with a short transition
- Smooth scroll on click

**Scroll tracking:** Same IntersectionObserver pattern as BlogSidebar — shared logic.

**No layout changes needed** — dots are fixed-position and don't affect content flow.

## Utility: src/utils/headings.ts

**Function:** `extractHeadings(html: string): {id: string, text: string}[]`

Parses rendered HTML string and returns all h2 elements with their `id` and text content. Used by both BlogSidebar and SectionDots to get heading data at build time.

Astro's `render()` returns a `Content` component. The heading extraction happens at the page level — each page template calls `render()`, extracts headings, and passes them as props to the nav component.

Alternative: use Astro's built-in `remarkPluginFrontmatter` or a remark plugin to extract headings during markdown processing. Evaluate which is simpler at implementation time.

## Files

| Action | File | What changes |
|--------|------|-------------|
| Create | `src/components/Breadcrumb.astro` | Breadcrumb trail with JSON-LD |
| Create | `src/components/BlogSidebar.astro` | Left sidebar TOC with scroll tracking |
| Create | `src/components/SectionDots.astro` | Right-edge dot nav with scroll tracking |
| Create | `src/utils/headings.ts` | Heading extraction from rendered HTML |
| Modify | `src/layouts/BlogPost.astro` | Add sidebar layout wrapper + breadcrumb slot |
| Modify | `src/pages/blog/[...slug].astro` | Extract headings, pass to layout, add breadcrumb |
| Modify | `src/pages/work/[...slug].astro` | Add breadcrumb + section dots |
| Modify | `src/pages/projects/[...slug].astro` | Add breadcrumb + section dots |

## Out of Scope

- Mobile section nav (dropdown, collapsible, or otherwise)
- TOC for h3 sub-headings (h2 only for both patterns)
- Auto-generated TOC inside blog post content (manual TOCs in markdown stay as-is)
- Section nav on flat pages
- Breadcrumbs on flat pages or homepage
