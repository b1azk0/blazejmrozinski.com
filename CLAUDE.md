# blazejmrozinski.com

Personal brand site for Blazej Mrozinski. Astro static site deployed on Netlify.

## Key Context

- **Owner:** Blazej Mrozinski — see ~/GitHub/ClaudioBrain for full profile
- **Blog source:** ContentForge repo pushes markdown posts via GitHub Action
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

## Commands

```bash
npm run dev      # dev server at localhost:4321
npm run build    # production build
npm run preview  # preview production build
```
