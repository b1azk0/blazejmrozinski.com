# Glossary Feature — Design Spec

**Date:** 2026-04-09
**Status:** Approved
**Goal:** SEO-first glossary of terms used across the site, driving internal linking and topical authority.

---

## Overview

A `/glossary/` section that defines key terms from all domains covered on blazejmrozinski.com (psychometrics, infrastructure, AI/automation, product, research). Each term is a standalone page targeting long-tail search queries (e.g., "what is item response theory"). Glossary pages link to relevant site content. Content-to-glossary links are added manually.

Terms are generated as drafts by Claude Code on demand, reviewed by Blazej before publishing. No external API dependencies.

---

## Content Collection

### Location

```
src/content/glossary/
  item-response-theory.md
  lemp-stack.md
  opcache.md
  ...
```

### Schema

Added to `src/content.config.ts` as a new collection:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `term` | string | yes | Display name, e.g. "Item Response Theory (IRT)" |
| `seoTitle` | string | yes | Keyword-optimized page title, e.g. "What Is Item Response Theory (IRT)? Definition & Applications" |
| `description` | string | yes | Meta description, 150-160 chars, keyword-rich |
| `definition` | string | yes | One-sentence plain definition for structured data / featured snippet targeting |
| `domain` | string | yes | Topical domain, e.g. "psychometrics", "infrastructure", "ai-automation", "product", "research". Plain string, not enum — grows organically as content expands. |
| `relatedContent` | string[] | no | Slugs of related site content, e.g. `["blog/wp-infra-02-building-the-lemp-stack", "work/gyfted"]`. Rendered as "Related on this site" links. |
| `relatedTerms` | string[] | no | Slugs of other glossary terms for "See also" cross-linking. |
| `status` | enum: draft/published | yes | Same pattern as blog posts. Default: draft. |
| `date` | date | yes | For sitemap lastmod and freshness signals. |

**Body:** Markdown, 300-800 words. Full SEO definition written in Blazej's voice. Structured with h2/h3 subheadings for scannability and passage ranking.

---

## Pages & Routing

### Index Page — `/glossary`

**File:** `src/pages/glossary/index.astro`

- Lists all published terms grouped alphabetically (A, B, C...)
- Letter anchors for quick navigation
- Each entry shows: term name, domain badge, one-sentence `definition`
- Clicking navigates to the term page
- No search, filter, or pagination at this scale (20-30 terms)

### Term Page — `/glossary/[...slug]`

**File:** `src/pages/glossary/[...slug].astro`

**Structure:**
1. Breadcrumb: Home > Glossary > Term Name
2. H1: the `term` field
3. Domain badge (styled like blog labels, using domain string to pick accent color from a domain→color map in a shared utility; unknown domains get a neutral default color)
4. Markdown body (full SEO definition)
5. "Related on this site" section — links from `relatedContent`, rendered as a simple linked list with titles
6. "See also" section — links from `relatedTerms`, compact list of other glossary terms

### SEO Per Term Page

- `<title>`: the `seoTitle` field
- `<meta name="description">`: the `description` field
- JSON-LD: `DefinedTerm` schema with `name`, `description` (the `definition` field), `url`, and `inDefinedTermSet` pointing to `/glossary`
- OG image: generated cover via existing `generate-covers.ts` pipeline with glossary-specific illustration and domain-based accent color

---

## Glossary Update Workflow

**Trigger:** Run in Claude Code terminal — either ask "update the glossary" or invoke a dedicated command.

**Steps Claude Code performs:**

1. **Scan** — read all published blog posts, company pages, project pages, and existing glossary terms
2. **Identify gaps** — compare content against existing terms, suggest new terms
3. **Present candidates** — show list to Blazej before writing anything (e.g., "I'd suggest adding: OPcache, FastCGI Cache, Redis Object Cache. Proceed?")
4. **Generate drafts** — write `.md` files in `src/content/glossary/` with `status: draft`, full markdown body
5. **Update related content** — refresh `relatedContent` and `relatedTerms` on existing terms based on current published content
6. **Report** — summarize what was created and updated

**Rules:**
- Never sets `status: published` — Blazej reviews and flips manually
- Never overwrites existing term body content — only updates frontmatter fields (`relatedContent`, `relatedTerms`)
- Never deletes terms
- Idempotent — running without new content produces no changes

---

## Sitemap & Navigation

### Sitemap
- New `src/pages/sitemap-glossary.xml.ts` — auto-generates from published glossary terms
- Added to `sitemap-index.xml.ts`

### Footer
- "Glossary" link added to the Pages column in `Footer.astro`, alongside Work, Case Studies, Blog, etc.

### Header
- No change. Glossary does not appear in top-level navigation.

### Cover Images
- Extend `generate-covers.ts` to handle glossary collection
- Glossary-specific illustration (book/dictionary icon)
- Domain-based accent color from the label color system

---

## Interlinking Strategy

- **Glossary → Content:** Automated via `relatedContent` field. The update workflow populates this by scanning which posts/pages mention the term.
- **Content → Glossary:** Manual. Added through `links.yml` CRM or direct markdown editing. Not injected automatically into blog posts (avoids ContentForge conflicts).
- **Glossary → Glossary:** Via `relatedTerms` field. Cross-links between related terms (e.g., "IRT" ↔ "CTT", "OPcache" ↔ "FastCGI Cache").

---

## Explicitly Out of Scope

- No auto-injection of glossary links into blog post markdown (no remark/rehype plugin)
- No search or filter on the index page
- No pagination
- No category/tag filtering system (domain field handles visual grouping)
- No RSS feed for glossary terms
- No header navigation link
- No external API dependency (Claude API, headless CMS, etc.)
