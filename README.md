# blazejmrozinski.com

Personal brand site for Blazej Mrozinski — psychologist, psychometrician, product builder, researcher.

## Stack

- Astro (static site generator)
- Tailwind CSS
- Netlify (deployment)
- ContentForge (blog content source)

## Development

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # production build to dist/
npm run preview # preview production build
```

## Content

Blog posts come from [ContentForge](https://github.com/b1azk0/contentforge) via GitHub Action PRs. Static content (about, companies, projects, publications, CV) lives in `src/content/` and is edited directly.

### Collections

Defined in `src/content.config.ts` using Astro 6 Content Layer API with `glob` loader:

| Collection | Path | Description |
|------------|------|-------------|
| `blog` | `src/content/blog/` | Blog posts (populated by ContentForge) |
| `companies` | `src/content/companies/` | Company profiles (Gyfted, Nerds.family, Digital Savages, Distillery) |
| `projects` | `src/content/projects/` | Project writeups (7 projects across companies) |
| `pages` | `src/content/pages/` | Static pages (about, work, CV) |

## Deploy

Push to main → Netlify auto-deploys.
