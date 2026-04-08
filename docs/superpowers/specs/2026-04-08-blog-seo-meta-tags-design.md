# Blog SEO Meta Tags & Link Attributes

**Date:** 2026-04-08
**Status:** Approved
**Scope:** On-site/technical SEO fixes for blog posts and site-wide navigation

## Problem

Chrome SEO plugin audit revealed missing meta tags and attributes on blog pages:

- No `<meta name="keywords">` tag
- No `<meta name="robots">` tag
- No `<meta name="author">` tag
- No `<meta name="publisher">` tag
- 26 links without `title` attributes (nav, footer, in-content)
- Cover images with empty `alt=""` attribute

The existing `SEO.astro` component covers title, description, canonical, Open Graph, and Twitter Card tags but omits these traditional meta tags.

## Decisions

- **Link titles:** Add to nav and footer links only (option C). In-content blog body links are left as-is — link text is already descriptive.
- **Keywords meta tag:** Auto-populate from post `tags` array. Google ignores it, but it's low effort and silences the plugin.
- **Author/publisher:** Author defaults to "Blazej Mrozinski" with per-post frontmatter override. Publisher is always hardcoded.
- **Robots:** Available on all pages via SEO component prop, defaults to `index, follow`. Tag/pagination pages should use `noindex, follow`.
- **Image titles:** Not adding — decorative attribute, not an SEO signal.

### Robots strategy by page type

| Page type | Robots value |
|-----------|-------------|
| Blog posts | `index, follow` |
| Static pages (about, CV, work) | `index, follow` (default) |
| Company/project landings | `index, follow` (default) |
| Photography | `index, follow` (default) |
| Blog index (`/blog`) | `index, follow` (default) |
| Tag pages (if they exist) | `noindex, follow` |
| Pagination pages (if they exist) | `noindex, follow` |

## Changes

### 1. `src/components/SEO.astro`

Add three new optional props to the interface:

```typescript
interface Props {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  robots?: string;    // defaults to "index, follow"
  author?: string;    // defaults to "Blazej Mrozinski"
  keywords?: string;  // only rendered when provided
}
```

Add new meta tags after the existing description tag:

```html
<meta name="robots" content={robots} />
<meta name="author" content={author} />
<meta name="publisher" content="Blazej Mrozinski" />
{keywords && <meta name="keywords" content={keywords} />}
```

### 2. `src/layouts/Base.astro`

Add `robots`, `author`, `keywords` to the Props interface. Pass them through to the `<SEO>` component.

### 3. `src/layouts/BlogPost.astro`

- Pass `keywords={tags.join(', ')}` to Base
- Pass `author` from frontmatter (with fallback to default in SEO component)
- Fix cover image: change `alt=""` to `alt={title}`

### 4. `src/content.config.ts`

Add optional `author` field to the blog collection schema:

```typescript
author: z.string().optional(),
```

No changes needed to existing blog post frontmatter — the field is optional.

### 5. `src/components/Header.astro`

- Add `title={item.label}` to all nav links (desktop and mobile)
- Add `title="Blazej Mrozinski — Home"` to the logo/home link

### 6. `src/components/Footer.astro`

- Add `title={link.label}` to page links and connect links
- Add `title="Blazej Mrozinski — Home"` to the logo/home link
- Add `title="Contact me"` to the contact CTA link

## What this fixes

- "Keywords are missing!" — resolved via `<meta name="keywords">` from tags
- "Robots meta tag is not defined" — resolved via `<meta name="robots">`
- "Author is missing" — resolved via `<meta name="author">`
- "Publisher is missing" — resolved via `<meta name="publisher">`
- 26 links without title — significantly reduced (nav + footer covered)
- Images without alt — cover images get descriptive alt text from post title

## What's deliberately left alone

- Link titles in blog post body content (per option C decision)
- Image `title` attributes (not an SEO signal)
- `<meta name="keywords">` on non-blog pages (no tags data to populate from)
