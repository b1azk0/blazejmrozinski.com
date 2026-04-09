---
term: "Content Model"
seoTitle: "What Is a Content Model? Structured Content Design for Websites and CMS"
description: "A content model defines the types, fields, and relationships of content in a system. Learn how content modeling drives consistent, scalable website architecture."
definition: "A content model is a formal definition of the content types, their fields, relationships, and constraints within a content management system or website."
domain: "product"
relatedContent:
  - "blog/personal-site-as-product"
relatedTerms:
  - "static-site-generator"
  - "structured-data-json-ld"
status: published
date: 2026-04-09
---

A content model is the blueprint for your content before a single word is written or a page is built. It defines what kinds of content exist, what properties each kind has, how different content types relate to each other, and what rules govern valid content. Get it right and the rest of the system follows logically. Skip it and you accumulate inconsistencies that become expensive to fix later.

## Content Model vs. Database Schema

The comparison to a database schema is apt but incomplete. A database schema defines tables, columns, data types, and foreign key relationships. A content model does all of that but at a higher level of abstraction — it also defines the semantic meaning of each type and field, the authoring experience, and how content relates to the user-facing product.

A content model says: "A blog post has a title, an author, a publication date, a body, a list of tags, and a status (draft/published). The author is a reference to a Person entity. Tags are references to a Taxonomy entity." A database schema would say the same thing, but with column types and index specifications. The content model is the product design artifact; the schema is the implementation artifact.

## Designing a Content Model

The design process starts with entities — the distinct types of things your content describes.

For a personal brand site, the entities might be: Person (you), Companies (organizations you've been part of), Projects (products you've built), Blog Posts (articles), Publications (academic or professional works), and Glossary Terms. Each is a distinct entity type with its own properties and relationships.

Then you define attributes for each entity: what properties does a Blog Post have? Title, description, publication date, body content, author reference, tags, SEO metadata, cover image, featured flag, status. Each attribute has a type (text, date, reference, boolean), a cardinality (required vs. optional, single vs. multiple), and possibly validation constraints.

Then relationships: a Blog Post is authored by a Person. A Project is associated with a Company. A Glossary Term can reference related Blog Posts and related Terms. These relationships aren't just navigational — they carry semantic meaning that can be expressed in structured data and surfaced in the UI.

## Taxonomy and Reference Fields

Two content modeling patterns come up constantly.

**Taxonomy fields** categorize content into predefined sets. A "domain" field on a glossary term (values: "psychometrics", "product", "ai-automation") is a taxonomy. Taxonomies enable filtering, navigation by category, and topical grouping. The key design decision: open vocabulary (any string) vs. closed vocabulary (only predefined values). Closed vocabularies are more consistent but require maintenance as new categories emerge.

**Reference fields** link one content type to another. A Blog Post's author field references a Person entity. Rather than duplicating the author's name and bio in every post, you store it once in the Person entity and reference it. This is the principle of normalization applied to content: single source of truth, consistent everywhere it's used.

## Content Models in Astro Content Collections

Astro's content collections implement a content model through Zod schemas defined in `src/content/config.ts`. Each collection has a schema that specifies what fields are valid, what types they must be, and which are required vs. optional. The schema is enforced at build time — a content file that doesn't conform to the schema produces a build error.

This site uses collections for blog posts, companies, projects, glossary terms, publications, and photography albums. Each collection has a distinct schema reflecting its entity type. The blog collection schema includes SEO fields, cover image, and tags. The glossary collection includes `term`, `definition`, `domain`, `relatedContent`, and `relatedTerms`. The company collection includes founding date, current status, and the person's role.

## Content Model as Product Design Artifact

The content model is worth documenting explicitly, not just implementing in code. A written content model forces clarity about what content you're actually producing and why. It's the artifact that bridges editorial thinking ("what do I want to say and how do I want to organize it?") and technical implementation ("how is this structured in the system?").

For a site that generates structured data, the content model is especially consequential. The fields in your content model map directly to the properties in your Schema.org markup. If you've modeled a Person entity with `alumniOf`, `worksFor`, and `sameAs` fields, you can generate rich Person structured data automatically from that model. If those fields don't exist in the model, you can't.

A well-designed content model is infrastructure. It's not visible to site visitors, but it determines the ceiling on what the site can express, how consistently it expresses it, and how maintainable it is as the content grows.
