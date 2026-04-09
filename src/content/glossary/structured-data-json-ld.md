---
term: "Structured Data (JSON-LD)"
seoTitle: "What Is Structured Data (JSON-LD)? Schema.org Markup for SEO Explained"
description: "JSON-LD structured data helps search engines understand your content. Learn how Schema.org markup powers rich snippets, knowledge panels, and SEO visibility."
definition: "Structured data is machine-readable code (typically JSON-LD format) embedded in web pages that describes content to search engines using the Schema.org vocabulary."
domain: "product"
relatedContent:
  - "blog/seo-architecture-before-first-visitor"
relatedTerms:
  - "internal-linking"
  - "e-e-a-t"
  - "indexnow"
status: published
date: 2026-04-09
---

Search engines read HTML. They can parse text, follow links, and infer meaning from structure. But inferring is unreliable at scale. Structured data removes the guesswork — it tells a search engine directly: "this is an article, written by this person, published on this date, about this topic." No inference required.

## What Structured Data Does

Most web pages contain information that has inherent semantic structure — an article has an author and a publication date; a product has a price and availability; a person has credentials and affiliations. Standard HTML communicates how to display that information, not what it means. Structured data provides the meaning layer.

When Google's crawler encounters structured data, it can classify the page accurately, extract specific attributes, and connect the page to entities in the Knowledge Graph. That classification affects how your content appears in search results and whether it qualifies for enhanced SERP features.

## JSON-LD vs Microdata vs RDFa

Three formats can express structured data. JSON-LD won.

**Microdata** and **RDFa** both require embedding attributes directly inside your existing HTML elements. You end up with markup like `<span itemprop="name">` scattered throughout the template. It's fragile — any HTML refactor risks breaking your structured data — and it couples your presentation layer to your semantic layer in ways that become maintenance headaches.

**JSON-LD** (JavaScript Object Notation for Linked Data) is injected as a separate `<script type="application/ld+json">` block, usually in the `<head>`. The structured data is entirely separate from the presentation HTML. You can update one without touching the other. Google officially recommends JSON-LD, and it's what I use across this site.

## Schema.org Vocabulary

Schema.org is a collaborative vocabulary maintained by Google, Microsoft, Yahoo, and Yandex. It defines hundreds of types — from generic (`Thing`, `CreativeWork`) to highly specific (`MolecularEntity`, `Campground`). Each type has defined properties. An `Article` can have `author`, `datePublished`, `headline`, `image`, `publisher`. A `Person` can have `jobTitle`, `affiliation`, `alumniOf`, `sameAs`.

The `sameAs` property deserves particular attention. It lets you link your entity to its canonical representation on external knowledge bases — Wikidata, LinkedIn, an organization's official site. This is how structured data helps Google resolve ambiguity: two pages about "Blazej Mrozinski" can be identified as referring to the same real-world entity.

## Common Types and What They Do

**Article / BlogPosting:** The foundational type for editorial content. Triggers article rich results and helps Google associate posts with their author entity.

**Person:** Used on about pages and author profiles. The `credentials`, `alumniOf`, `worksFor`, and `sameAs` properties directly support E-E-A-T signals.

**Organization:** For company and project pages. Links the site to the organizations the person is associated with.

**DefinedTerm / DefinedTermSet:** The appropriate type for glossary content like this page. It signals to search engines that this is authoritative definitional content.

**BreadcrumbList:** Communicates page hierarchy. Eligible for breadcrumb display in SERPs.

## How Google Uses Structured Data

Structured data enables several SERP enhancements:

- **Rich snippets:** Star ratings, recipe details, event dates, FAQ accordions that expand directly in search results
- **Knowledge panels:** The information boxes on the right side of search results, populated from entity data
- **Sitelinks search box:** For navigating a site's search directly from Google
- **Article carousels:** In Google Discover and news surfaces

Not all structured data produces visible SERP features. Some of it is used purely for classification and entity resolution — invisible in the results but consequential for how Google understands your content.

## Implementation in Astro

In a static site generator like Astro, JSON-LD is straightforward to implement. Each page template generates its structured data dynamically from frontmatter and content collection data, injects it into the `<head>` as a `<script type="application/ld+json">` block, and outputs a different type for different page types — `BlogPosting` for articles, `DefinedTerm` for glossary entries, `Person` for the about page.

This site uses structured data across every page type. Blog posts include `Article` markup with author and publisher entities. The about page uses `Person` schema. Glossary entries use `DefinedTerm`. The entire implementation lives in page templates and is generated at build time — no JavaScript needed at runtime.

## Testing and Validation

Google's Rich Results Test (search.google.com/test/rich-results) validates your structured data and shows which rich results your page is eligible for. The Schema Markup Validator (validator.schema.org) checks correctness against the Schema.org specification.

Both tools are worth running after any significant template change. Structured data errors are silent at runtime — the page renders normally while the markup fails — so active validation is the only way to catch problems.

The ROI on structured data is asymmetric: the implementation cost is moderate, the maintenance cost is low once it's in the templates, and the upside — better entity resolution, rich snippets, and long-term Knowledge Graph presence — compounds over time.
