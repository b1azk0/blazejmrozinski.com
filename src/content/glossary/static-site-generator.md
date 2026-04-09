---
term: "Static Site Generator"
seoTitle: "What Is a Static Site Generator? Astro, Next.js & Modern Web Architecture"
description: "Static site generators build HTML at compile time instead of on each request. Learn how SSGs like Astro deliver speed, security, and SEO advantages."
definition: "A static site generator (SSG) is a tool that builds a complete website as pre-rendered HTML files at compile time, rather than generating pages dynamically on each server request."
domain: "product"
relatedContent:
  - "blog/personal-site-as-product"
  - "blog/seo-architecture-before-first-visitor"
relatedTerms:
  - "content-model"
  - "structured-data-json-ld"
status: draft
date: 2026-04-09
---

There are three ways to get an HTML page to a browser: generate it once at build time and serve the pre-built file, generate it on the server when the request arrives, or send minimal HTML to the client and build the page in JavaScript after it loads. Static site generators do the first. Most of the web still does the second. The rise of JavaScript frameworks made the third temporarily fashionable, until the performance problems became too obvious to ignore.

For content-first sites — blogs, documentation, personal brands, marketing sites — static generation is usually the correct architectural choice. Not because it's simple, but because it's the right trade-off for the use case.

## What Happens at Build Time

An SSG reads your content sources (Markdown files, YAML data, CMS APIs, databases) and your templates, runs the combination through a build process, and outputs a directory of static files: HTML, CSS, JavaScript, images. Every URL your site will ever serve has a corresponding pre-built file waiting.

When a user requests a page, the server does almost nothing — it finds the file and sends it. There's no database query, no template rendering, no session management. The work happened at build time, once, not at request time, once per visitor.

## The Advantages

**Speed:** Pre-built HTML loads faster than dynamically generated pages by default. There's no server-side processing latency. Static files can be served from a CDN that routes each request to the nearest edge location, reducing network latency further.

**Security:** No server-side code execution on requests means a dramatically smaller attack surface. SQL injection, server-side code execution, authentication vulnerabilities — the entire class of server-side runtime exploits simply doesn't apply to static files.

**SEO:** Search engine crawlers can index pre-rendered HTML directly. Client-side JavaScript rendering (the SPA pattern) requires crawlers to execute JavaScript, which introduces delay and occasional rendering failures. Static HTML is the most reliable crawling surface.

**Hosting simplicity and cost:** Static files can be hosted anywhere — Netlify, Vercel, Cloudflare Pages, an S3 bucket, a plain nginx server. No application server to manage, no database to maintain, no uptime monitoring for application processes.

## The Disadvantages

**Build times:** Every content change requires a rebuild. For large sites (tens of thousands of pages), builds can take minutes. Most modern SSGs include incremental builds that only rebuild what changed, but this adds complexity.

**Dynamic content limitations:** User-specific content, real-time data, personalization, and any feature that requires knowing who the user is at request time requires additional layers — typically client-side JavaScript calling APIs. This is solvable but adds architecture.

**Content update lag:** On a purely static site, publishing new content requires a build and deploy cycle. For a blog, that might be fine. For a news site, it might not be acceptable without automation.

## Popular Static Site Generators

**Astro:** Built for content-heavy sites. Ships zero JavaScript to the client by default — a meaningful performance advantage over frameworks that default to full hydration. Uses a component model that lets you bring in React, Vue, or Svelte components for interactive islands while keeping the rest static. Strong content collections support with type-safe schemas.

**Next.js:** React framework that supports static generation, server-side rendering, and client-side rendering within the same project. Powerful but complex. Better suited to applications that need dynamic features alongside static content.

**Hugo:** Written in Go, which makes it extremely fast at build time. No JavaScript in the build toolchain. Good fit for large sites where build speed matters.

**Eleventy (11ty):** Minimal, flexible, JavaScript-based. No strong opinions about templating or structure. Good for projects where you want full control over the stack.

## Astro's Distinctive Approach

Astro's "islands architecture" deserves specific mention because it solves the biggest limitation of JavaScript frameworks used as SSGs: by default, they ship runtime JavaScript for every component, even ones that don't need it. Astro flips this default — components are HTML-only unless you explicitly mark them as interactive with a `client:` directive.

The result is sites that are genuinely fast on slow networks and low-powered devices, not just fast in favorable benchmark conditions.

Content collections in Astro are schema-validated Markdown or MDX files organized by type. The schema validation at build time is particularly valuable: a content file with a missing required field or an incorrect type produces a build error rather than a runtime failure or silent rendering bug. The content model is enforced by the build toolchain.

This site is built on Astro, deployed to Netlify. The build process generates static HTML for every page, injects JSON-LD structured data, generates XML sitemaps from the content collections, and runs a postbuild script to notify search engines via IndexNow. There's no application server. The total infrastructure is: a Netlify account and a GitHub repo.

## When SSG vs. SSR vs. SPA

Use static generation when: content changes infrequently, pages are publicly accessible, and SEO matters.

Use server-side rendering when: content is user-specific, highly personalized, or changes faster than you can build.

Use client-side rendering sparingly: for interactive application features that genuinely need dynamic client-side state. Not for marketing pages, not for blogs, not for content that doesn't change per user.

Most "should I build a SPA or an SSG?" debates are resolved by asking which pages actually need client-side dynamism. Usually it's a minority. Build those with client-side rendering. Build everything else statically.
