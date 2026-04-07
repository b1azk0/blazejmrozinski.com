# Polish Localization Design Spec

**Date:** 2026-04-07
**Status:** Approved design, not yet implemented
**Owner:** Blazej Mrozinski
**Note:** This spec reflects the site state as of 2026-04-07. If the site has expanded since then (new pages, components, collections), audit the inventory sections below before implementing.

---

## Goal

Add a Polish-language version of blazejmrozinski.com. Polish visitors (the primary audience — Blazej lives and works in Poland) get translated pages, navigation, and UI. Blog posts remain in English and are shown as-is to Polish-version visitors.

## Decisions Made

- **URL structure:** `/pl/` prefix with Polish slugs (`/pl/o-mnie/`, `/pl/praca/`, etc.)
- **English stays at root:** No `/en/` prefix. English is the default.
- **Blog posts:** Stay in English only. Polish blog index (`/pl/blog/`) shows the same posts with a visible note that content is in English.
- **Publications:** Stay in English (academic convention).
- **Translation method:** AI-translated from English, reviewed by Blazej for voice/tone.

## Architecture

### Astro i18n Configuration

Enable Astro's built-in i18n routing in `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://www.blazejmrozinski.com',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pl'],
    routing: {
      prefixDefaultLocale: false, // English at /, Polish at /pl/
    },
  },
  // ... rest unchanged
});
```

### Translation System

Create `src/lib/i18n.ts` with:

1. A `translations` object mapping string keys to `{ en: string, pl: string }` pairs
2. A `t(key, locale)` helper function
3. A `getLocale(Astro)` helper that reads the current locale from the URL

This covers all UI strings: nav labels, button text, section headings, footer text, cookie consent, filter labels, meta descriptions, etc.

**String inventory (as of 2026-04-07):**

| Component | Strings to translate |
|-----------|---------------------|
| Header.astro | Nav labels: Work, Case Studies, Blog, Publications, About, CV, Contact |
| Footer.astro | Section labels (Pages, Connect, Get in Touch), description paragraph, copyright, "Contact me" |
| ContactForm.astro | "Email address", placeholder, "Send" |
| CookieConsent.astro | Cookie notice text, "Accept", "Decline" |
| LabelFilter.astro | "All" label |
| YearFilter.astro | "All" label |
| TagFilter.astro | Any static text |
| PostCard.astro | Date formatting locale |
| CompanyCard.astro | No static strings (data-driven) |
| ProjectCard.astro | "Case Study" badge text |
| PublicationEntry.astro | "DOI", "PDF" button labels |
| BlogSidebar.astro | Section headings |
| HobbiesSection.astro | All hobby text |
| Breadcrumb.astro | Crumb labels (passed from pages) |
| Base.astro | `<html lang="">` attribute, "Skip to content" |

### Content Collections

Duplicate content markdown files for Polish:

```
src/content/
  pages/
    about.md           ← English
    about.pl.md        ← Polish
    cv.md
    cv.pl.md
    work.md
    work.pl.md
  companies/
    gyfted.md
    gyfted.pl.md
    digital-savages.md
    digital-savages.pl.md
    nerds-family.md
    nerds-family.pl.md
    swps-university.md
    swps-university.pl.md
  projects/
    prawomat.md
    prawomat.pl.md
    hse-career-quiz.md
    hse-career-quiz.pl.md
    ... (all 6 projects)
  blog/
    *.md               ← English only, no .pl.md variants
  publications.yml     ← English only
  photography/
    ...                ← English only (captions are minimal)
```

Alternatively, use a directory-based approach (`pages/en/about.md`, `pages/pl/about.md`). The `.pl.md` suffix approach is simpler for this site since collections are small.

Update `src/content.config.ts` to add a `locale` field or use filename convention to filter content by language.

### Page Routing

For each existing page, create a Polish counterpart under `src/pages/pl/`:

```
src/pages/
  index.astro                    → /
  about.astro                    → /about
  cv.astro                       → /cv
  contact.astro                  → /contact
  publications.astro             → /publications
  blog/index.astro               → /blog
  blog/[...slug].astro           → /blog/:slug
  work/index.astro               → /work
  work/[...slug].astro           → /work/:slug
  projects/index.astro           → /projects
  projects/[...slug].astro       → /projects/:slug

  pl/
    index.astro                  → /pl/
    o-mnie.astro                 → /pl/o-mnie
    cv.astro                     → /pl/cv
    kontakt.astro                → /pl/kontakt
    publikacje.astro             → /pl/publikacje
    blog/index.astro             → /pl/blog  (shows English posts with note)
    blog/[...slug].astro         → redirects to /blog/:slug (or renders same post)
    praca/index.astro            → /pl/praca
    praca/[...slug].astro        → /pl/praca/:slug
    projekty/index.astro         → /pl/projekty
    projekty/[...slug].astro     → /pl/projekty/:slug
```

**Shared logic approach:** Polish pages import the same components as English pages but pass `locale="pl"` to the layout. Components read locale and use `t()` for UI strings. Content is loaded from `.pl.md` files.

### Layout Changes

`Base.astro` needs:
- Accept `locale` prop (default: `'en'`)
- Set `<html lang={locale}>`
- Pass locale to Header, Footer, CookieConsent
- Include hreflang `<link>` tags in `<head>`

### Language Switcher

Add a language toggle to the Header (next to ThemeToggle):
- On English pages: shows "PL" linking to the Polish equivalent
- On Polish pages: shows "EN" linking to the English equivalent
- Mapping between English and Polish URLs stored in a lookup or derived from route conventions

### Blog on Polish Version

`/pl/blog/` renders the same blog post list as `/blog/` but with:
- Polish UI strings (section headings, filter labels)
- A visible note at the top: "Posty na blogu sa w jezyku angielskim" (Blog posts are in English)
- Post cards link to `/blog/:slug` (English URLs) since there are no Polish post pages
- No hreflang="pl" on individual blog posts — they are English content

## SEO

### hreflang Tags

Every page that has both English and Polish versions gets both hreflang tags in `<head>`:

```html
<link rel="alternate" hreflang="en" href="https://www.blazejmrozinski.com/about" />
<link rel="alternate" hreflang="pl" href="https://www.blazejmrozinski.com/pl/o-mnie" />
<link rel="alternate" hreflang="x-default" href="https://www.blazejmrozinski.com/about" />
```

Pages without Polish versions (blog posts, publications) only get:
```html
<link rel="alternate" hreflang="en" href="..." />
<link rel="alternate" hreflang="x-default" href="..." />
```

### hreflang URL Mapping

Create `src/lib/hreflang.ts` with a mapping:

```ts
export const hreflangMap: Record<string, { en: string; pl: string }> = {
  home:         { en: '/',              pl: '/pl/' },
  about:        { en: '/about',         pl: '/pl/o-mnie' },
  cv:           { en: '/cv',            pl: '/pl/cv' },
  contact:      { en: '/contact',       pl: '/pl/kontakt' },
  publications: { en: '/publications',  pl: '/pl/publikacje' },
  work:         { en: '/work',          pl: '/pl/praca' },
  blog:         { en: '/blog',          pl: '/pl/blog' },
  projects:     { en: '/projects',      pl: '/pl/projekty' },
  // Dynamic pages (companies, projects) derive from slug
};
```

### Sitemaps

Add `src/pages/sitemap-pl.xml.ts` covering all Polish pages with `<lastmod>` dates.

Update `sitemap-index.xml.ts` to include the Polish sitemap.

Add hreflang annotations to existing sitemaps using the `<xhtml:link>` format:

```xml
<url>
  <loc>https://www.blazejmrozinski.com/about</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://www.blazejmrozinski.com/about"/>
  <xhtml:link rel="alternate" hreflang="pl" href="https://www.blazejmrozinski.com/pl/o-mnie"/>
</url>
```

### Canonical URLs

Each language version is self-canonical. `/pl/o-mnie` has `canonical="/pl/o-mnie"`, not pointing to `/about`.

### JSON-LD

Polish pages generate JSON-LD with Polish text where applicable:
- `Person.jobTitle` in Polish
- `WebSite.name` stays "Blazej Mrozinski" (proper noun)
- Page-specific structured data uses Polish descriptions

### robots.txt

Add Polish sitemap:
```
Sitemap: https://www.blazejmrozinski.com/sitemap-index.xml
```
(No change needed if sitemap-index already references the Polish sitemap.)

### IndexNow

The existing postbuild script (`scripts/indexnow.ts`) already reads all sitemaps. Once `sitemap-pl.xml.ts` exists and is referenced in the sitemap index, Polish URLs will be submitted automatically.

## Implementation Phases

### Phase 1: Infrastructure + Homepage

**Goal:** Validate the architecture end-to-end with one page.

1. Enable Astro i18n in config
2. Create `src/lib/i18n.ts` with translation system
3. Create `src/lib/hreflang.ts` with URL mapping
4. Update `Base.astro` to accept locale, set `<html lang>`, render hreflang tags
5. Update Header with locale-aware nav labels + language switcher
6. Update Footer with locale-aware strings
7. Update CookieConsent with locale-aware strings
8. Create `src/pages/pl/index.astro` (Polish homepage)
9. Translate homepage content: services, stats labels, section headings, CTAs, conviction quotes
10. Verify hreflang, canonical, JSON-LD on both versions
11. Test language switcher navigation

### Phase 2: Static Pages + Company Pages

**Goal:** Translate all non-blog content pages.

1. Create Polish content files (`.pl.md`) for: about, cv, work, and all 4 companies
2. Create Polish page routes: `/pl/o-mnie`, `/pl/cv`, `/pl/kontakt`, `/pl/publikacje`, `/pl/praca/`, `/pl/praca/[...slug]`
3. Create `/pl/kontakt` with Polish contact form labels
4. Create `/pl/publikacje` with Polish section headings (publication entries stay in English)
5. Update all components that render on these pages to accept locale
6. Verify hreflang on all pages (both directions)
7. Add Polish sitemap

### Phase 3: Projects + Blog Shell + QA

**Goal:** Complete coverage and SEO polish.

1. Create Polish content files for all 6 projects
2. Create Polish project routes: `/pl/projekty/`, `/pl/projekty/[...slug]`
3. Create `/pl/blog/` index showing English posts with Polish UI and language note
4. Handle blog post links from Polish blog index (link to `/blog/:slug`)
5. Photography pages — decide whether to translate or skip (minimal text)
6. Full hreflang audit across all pages
7. Polish sitemap covers all Polish pages
8. Update sitemap-index
9. JSON-LD audit on Polish pages
10. Cross-browser and mobile QA
11. Test IndexNow submits Polish URLs

## Maintenance Considerations

- **Content changes:** When English page copy is updated, the Polish `.pl.md` must be updated too. Consider a checklist or CI check that flags `.pl.md` files older than their English counterparts.
- **New pages:** Any new English page needs a Polish counterpart added to the routing, content, hreflang map, and sitemap.
- **Blog posts:** No maintenance needed — they stay English-only.
- **Component strings:** New UI strings must be added to the translation file in both languages.

## Risks

1. **Voice drift in translation.** Blazej's English voice is specific (practitioner-to-peers, dry humor, no marketing). Polish translation must preserve this. Every translated page needs Blazej's review.
2. **Content sync.** Pages get updated frequently. Polish versions will lag unless there's a deliberate update workflow.
3. **Incomplete hreflang.** Missing a single hreflang pair confuses Google. The hreflang map must be maintained as a single source of truth.
4. **Blog UX.** Switching from Polish UI to English blog content is jarring. The language note helps but doesn't fully solve this. Monitor user behavior after launch.

## Page Count Estimate (as of 2026-04-07)

| Type | English pages | Polish pages needed |
|------|--------------|-------------------|
| Homepage | 1 | 1 |
| Static pages | 5 (about, cv, contact, publications, work index) | 5 |
| Company pages | 4 | 4 |
| Project pages | 6 | 6 |
| Blog index | 1 | 1 (shell only) |
| Blog posts | ~10 | 0 (stay English) |
| Photography | 2+ | TBD (skip or translate) |
| **Total new Polish pages** | — | **~17-19** |

## File Inventory to Audit Before Implementation

If the site has changed since this spec was written, check these before starting:

- `src/pages/` — any new page routes?
- `src/components/` — any new components with hardcoded strings?
- `src/content/` — any new collections or content files?
- `src/content.config.ts` — any schema changes?
- `src/pages/sitemap-*.xml.ts` — any new sitemaps?
- `src/lib/labels.ts` — any new labels needing Polish names?
- `package.json` — any new build scripts affecting routing?
