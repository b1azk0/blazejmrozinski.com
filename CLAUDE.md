# blazejmrozinski.com

Personal brand site for Blazej Mrozinski. Astro static site deployed on Cloudflare Pages.

## Key Context

- **Owner:** Blazej Mrozinski — see ~/GitHub/ClaudioBrain for full profile
- **Blog source:** ContentForge repo pushes markdown posts via plain `git push`
- **Layout:** Newspaper grid — editorial, serif headings, dark header/footer
- **SEO:** Full JSON-LD structured data, interlinking across person/company/project/post entities

## Content Collections

- `blog/` — markdown posts from ContentForge (don't edit directly, they'll be overwritten)
- `companies/` — company landing pages
- `projects/` — project landing pages
- `publications.yml` — structured publication data
- `pages/` — static page content (about, work, CV)

## Related Repos

| Repo | Relationship |
|------|-------------|
| [ClaudioBrain](https://github.com/b1azk0/ClaudioBrain) | Knowledge base, design spec, implementation plan |
| [contentforge](https://github.com/b1azk0/contentforge) | Blog content source — pushes posts here |

## Ahrefs budget

This repo is for **post-publish execution**, not keyword research. ContentForge (`~/GitHub/contentforge`) owns all Ahrefs calls and the research budget. The workflow is: ContentForge runs keyword research, writes an audit file to `contentforge/seo/`, and this repo consumes that file to apply edits, build, and deploy. Credits are spent once, in ContentForge.

**Default rule:** the blog repo does not call Ahrefs MCP tools. If a task here seems to need Ahrefs data (rank check, new audit, competitive look, SERP verification), ask first and prefer running the research from ContentForge instead — save the output to `contentforge/seo/`, then come back here to execute.

**Narrow exceptions** (still confirm before calling):
- `site-audit-issues` — technical SEO issues on the live site (broken links, missing canonicals, 404s). Site-level, cheap, no overlap with ContentForge's content work.
- `rank-tracker-overview` — read-only check against an already-configured rank tracker list, when explicitly requested.

Everything else — `keywords-explorer-*`, `site-explorer-*`, `serp-overview`, `matching-terms`, `related-terms`, backlink/refdomain tools — belongs in ContentForge.

## Blog post images

Inline images in blog posts must use Astro's image pipeline so they get optimized (WebP, lazy loading, srcset, hashed filenames). Convention:

- **Image files:** `src/assets/blog/<post-slug>/<file>.png|jpg|webp`
- **Markdown reference:** `![alt text](../../assets/blog/<post-slug>/<file>.png)` — relative path from the `.md` file in `src/content/blog/`
- **Do NOT** put inline post images in `public/` — they bypass the image pipeline (no optimization, no responsive variants)
- Cover/social-share images are a separate concern (handled at the layout level, not the markdown body) and may live elsewhere

ContentForge's `publish.sh` handles this transformation automatically when copying drafts to the blog repo: it copies referenced asset files from `contentforge/drafts/blog/assets/` to `src/assets/blog/<slug>/` and rewrites the markdown image refs.

## Sitemap

Sitemaps are custom (not `@astrojs/sitemap`) — see `src/pages/sitemap-*.xml.ts`. Blog, work, pages, and photography sitemaps auto-generate from content collections at build time. The sitemap index (`sitemap-index.xml.ts`) is static and must be updated manually.

**Rule:** When adding a new content collection, new static pages, or a new section to the site, always:
1. Create a corresponding `sitemap-{section}.xml.ts` if one doesn't exist
2. Add it to `sitemap-index.xml.ts`
3. Verify `robots.txt` still points to the correct sitemap index

## Commands

```bash
npm run dev      # dev server at localhost:4321
npm run build    # production build
npm run preview  # preview production build
```
