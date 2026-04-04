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

## Pages

| Route | Source | Description |
|-------|--------|-------------|
| `/` | `src/pages/index.astro` | Homepage with newspaper grid layout, profile, companies, recent posts, CTA |
| `/blog` | `src/pages/blog/index.astro` | Blog listing with client-side tag filtering |
| `/blog/:slug` | `src/pages/blog/[...slug].astro` | Individual blog post pages |
| `/work` | `src/pages/work/index.astro` | Work overview with rendered page content and company listing |
| `/work/:slug` | `src/pages/work/[...slug].astro` | Company landing pages with related projects |
| `/projects` | `src/pages/projects/index.astro` | Projects listing with ProjectCard grid |
| `/projects/:slug` | `src/pages/projects/[...slug].astro` | Project landing pages with company link |
| `/about` | `src/pages/about.astro` | About page with Person JSON-LD |
| `/publications` | `src/pages/publications.astro` | Publications grouped by year with ScholarlyArticle JSON-LD |
| `/cv` | `src/pages/cv.astro` | CV page with PDF download button |
| `/contact` | `src/pages/contact.astro` | Full contact form (Netlify Forms) with social links |

## Components

| Component | Description |
|-----------|-------------|
| `PostCard` | Blog post card with title, description, date, tag pills |
| `CompanyCard` | Company card with name, domain, role |
| `ContactForm` | Inline Netlify Forms contact form |
| `TagFilter` | Tag filter pills with client-side show/hide |
| `ProjectCard` | Project card with name, domain, description, hover effect |
| `PublicationEntry` | APA-formatted publication citation with DOI/PDF links |
| `JsonLd` | JSON-LD structured data injection |
| `SEO` | Open Graph and Twitter Card meta tags |
| `Header` | Dark nav header with page links and social links |
| `Footer` | 3-column footer with identity, nav, social |

## Deploy

Push to main → Netlify auto-deploys.
