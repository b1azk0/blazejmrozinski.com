# Changelog

## 2026-04-04 — Content collections and schemas

- Added `src/content.config.ts` with 4 collections (blog, companies, projects, pages) using Astro 6 Content Layer API with `glob` loader
- Added 4 company profiles: Gyfted, Nerds.family, Digital Savages, Distillery
- Added 7 project writeups: Distillery, Prawomat, SSM, KryptoTracker, ContentForge, News Aggregator, HSE Career Quiz
- Added 3 static pages: about, work, CV
- Created empty blog collection with `.gitkeep`
- Adapted from task spec: used `src/content.config.ts` (not legacy `src/content/config.ts`) and `glob` loader (not `type: 'content'`) per Astro 6 API

## 2026-04-04 — Base layout, header, footer, SEO

- Added SEO component with Open Graph and Twitter Card meta tags
- Added Base layout (HTML shell with SEO slot)
- Added Page layout (Base + Header + Footer + centered content area)
- Added Header with nav links, active-page highlighting, and social links
- Added Footer with 3-column layout (identity, navigation, social/ORCID)
- Updated index page to use Page layout

## 2026-04-04 — Initial setup

- Astro project scaffolded with Tailwind CSS, sitemap, Netlify config
- Design spec: ~/GitHub/ClaudioBrain/docs/superpowers/specs/2026-04-04-personal-site-design.md
