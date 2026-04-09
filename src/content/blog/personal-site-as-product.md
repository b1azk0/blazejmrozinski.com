---
title: "Building a Personal Website Like a Product: What Changes When You Apply Product Thinking"
date: 2026-03-16
tags: [ai-as-cto, product-thinking]
audience: [ai-practitioners, founders, general-professional]
format: how-i-work
description: "Most personal websites are abandoned brochures. I built mine like a product in 5 days with 70+ commits, typed content schemas, structured data, and an automated asset pipeline. Here's what product thinking changes about a personal site."
status: published
safety_review: false
source_queue: queue/2026-04-09.md
note: "v2, rewritten with Nezlek-derived voice rules"
label: product
---

Most personal websites die within six months of launch. The pattern is predictable: someone spends a weekend picking a template, drops in a bio and headshot, maybe adds a few links, publishes it, and never touches it again. A year later, the domain renewal email arrives and they wonder whether to bother.

I don't think the failure mode is laziness. I think it's architecture. A personal site built as a brochure has no reason to be updated, no structure for growth, and no relationship between its parts. Add a new project? It's a line in a paragraph somewhere. Publish a paper? Better remember to update that page manually. Start a company? Good luck fitting that into the static "About" section.

I spent five days building my personal site from scratch. Seventy-plus commits. The result is something fundamentally different from a brochure, and the reason has nothing to do with design taste or technical sophistication. It has everything to do with treating the site like a product build. Whether the approach generalizes beyond my particular situation is a question I can't answer yet. But I can describe what happened and why, and let the specifics speak for themselves.

## Table of Contents

- [The Brochure Problem](#the-brochure-problem)
- [What Product Thinking Actually Means Here](#what-product-thinking-actually-means-here)
- [Content as a Data Model](#content-as-a-data-model)
- [The Structured Data Graph](#the-structured-data-graph)
- [Building for Discovery, Not Just Display](#building-for-discovery-not-just-display)
- [Five Days, Seventy Commits, One Non-Developer](#five-days-seventy-commits-one-non-developer)
- [What I Would Not Have Built Without Product Thinking](#what-i-would-not-have-built-without-product-thinking)
- [The Maintenance Question](#the-maintenance-question)

## The Brochure Problem

A brochure website has flat content. Pages exist in isolation. The "About" page doesn't know about the "Projects" page. The blog doesn't know about the publications. Nothing connects to anything else, because the site was conceived as a set of independent pages, not as a system of related information.

This matters more than it seems. When your content is flat, every update requires manual coordination. You add a new project, and now you need to update the homepage, maybe the CV, maybe the navigation. You forget one of those updates, and the site becomes inconsistent. Inconsistency compounds. After a few months, you stop updating because the friction is too high and the site no longer accurately represents you anyway.

The deeper problem is that flat sites can't express relationships. A person founds companies. Those companies run projects. Those projects produce publications and blog posts. Publications cite co-authors. Blog posts reference projects. There is a rich graph of connections between the things a person does, and a brochure website throws all of that away in favor of a few static pages.

One question this raises is whether most people actually need that level of structure. For someone with a single job and a LinkedIn profile, probably not. But the moment your professional life spans multiple entities, disciplines, or roles, the brochure model starts breaking in ways that aren't immediately visible. The site looks fine on launch day. The decay happens silently over the following months.

I didn't set out to build a graph database. I set out to build a personal website that wouldn't become stale. Solving the staleness problem required solving the structure problem first.

## What Product Thinking Actually Means Here

I should scope what I mean by "product thinking" in this context, because the term gets used loosely. Here, it means starting with the user's problem and working backward to the system that solves it. It means writing a spec before touching any implementation. It means defining entities and their relationships before choosing layouts. It means thinking about content lifecycle, not just content display.

For a personal site, the "user" is partly the visitor and partly me. Visitors need to quickly find relevant information, understand who this person is and what they do, and discover connections between different areas of work. I need a site that's easy to update, that reflects changes in one place automatically across related pages, and that doesn't require me to remember which five pages need editing every time something changes.

The spec I wrote before building anything covered content types, their fields, their relationships, the navigation model, the pages that would be generated from each content type, and the metadata each page needed for search engines. It looked more like a database schema document than a website wireframe. That was the first sign I was building something different from a typical personal site.

## Content as a Data Model

The core insight was treating every piece of content as a typed entity with defined fields and explicit relationships to other entities.

A Person entity has professional summaries, expertise areas, and links to Company entities. A Company entity has a description, a role field, a time period, and links to Project entities. A Project entity has a status, a technology stack summary, a description, and links to Blog Post entities and Publication entities. Publications have co-authors, journals, years, and citation data.

Every one of these entities is defined with a typed schema. The schema enforces structure: you can't create a Project without linking it to a Company, because the schema requires that field. You can't publish a blog post without tags and a description, because the schema validates on build.

This probably sounds like over-engineering for a personal website. I thought so too, initially. The counterargument is practical: the schema is what makes the site maintainable. When I add a new project, the system knows which company it belongs to, which blog posts reference it, and which pages need to show it. The project page is generated automatically. The company page updates to list the new project. The homepage reflects the change. One edit, consistent everywhere.

The alternative, which is what most personal sites do, is to manually maintain consistency across pages. That works for a site with three pages. It breaks down the moment your professional life has any real complexity. Multiple companies, multiple projects, publications spanning years, blog posts that reference specific work. Without typed schemas and explicit relationships, you're maintaining a house of cards. Whether this level of schema rigor is necessary for every personal site is debatable. For one with the complexity of mine, the investment paid for itself within the first week.

## The Structured Data Graph

Once the content model existed, something interesting emerged: the site could generate its own structured data graph. It generates sitemaps too, but the structured data is where the real value lives. The graph tells search engines exactly how the entities on the site relate to each other.

Here's what that looks like in practice. A Person schema connects to Organization schemas through employment relationships. Organizations connect to specific creative works and projects. Blog posts connect back to the person as author and to projects as subjects. Publications carry scholarly metadata. The entire site becomes a machine-readable knowledge graph about one person's professional life.

This matters for discoverability, though the effects take time to materialize. A typical personal site gives Google a name, a title, and some paragraphs. The structured data graph gives Google a complete entity model: this person founded these companies, worked on these projects, published these papers, and writes about these topics. That level of semantic clarity is what separates a site that shows up in knowledge panels from one that's just another indexed page. I should note that I haven't verified this with my own site yet. The infrastructure is in place, and the theory is well-established, but I'll need months of search data to confirm the actual impact.

I didn't build the structured data by hand. The content schemas generate it. When you define a Person entity with links to Company entities, the system can automatically produce the corresponding JSON-LD. The structured data is a downstream artifact of good content modeling, not an additional maintenance burden. That's the part that would have been easy to miss without the product lens: the metadata isn't a separate workstream. It falls out of the content model for free.

## Building for Discovery, Not Just Display

Product thinking changed how I approached every feature. Instead of asking "what should this page look like?" I asked "what job does this page do?"

The blog doesn't just display posts. It has label-based filtering so visitors can see only the topics relevant to them. Each post has a sidebar table of contents generated from its headings, so long-form content is navigable. Cover images are generated as part of the build pipeline rather than requiring manual creation for each post. That last detail matters more than it sounds: if publishing a post requires me to also open a design tool and create a social image, that's friction that will eventually stop me from publishing.

The photography section isn't a gallery grid. It's organized into albums with individual photo pages that support inline expansion. The structure matches how someone would actually browse photography: by collection, then by individual image.

The publications page has year-based filter chips because an academic publication list spanning two decades is useless without filtering. The CV page isn't a PDF download. It's a structured page with professional summaries and impact highlights that search engines can index.

Every one of these decisions came from asking the product question: what does the person visiting this page actually need? A brochure approach would have produced a blog page, a gallery page, a publications list, and a CV PDF. Product thinking produced filtered, navigable, interconnected pages that serve specific user needs.

The contact page integrates a calendar booking system instead of just listing an email address, because the job of the contact page is to reduce the friction between "I want to talk to this person" and actually scheduling a conversation.

Breadcrumbs with JSON-LD schema on every page, section navigation dots for long pages, multi-sitemap architecture, Google Consent Mode v2 integration, IndexNow for instant search engine notification on publish. None of these features are exciting individually. Together, they represent what a personal site looks like when you treat every surface as a product surface with a job to do.

## Five Days, Seventy Commits, One Non-Developer

Here's the part that would have been impossible three years ago: I don't write code. I'm a psychologist and product leader who thinks in systems, data, and methodology. The entire technical implementation was done by AI, working from specs I wrote. I've written previously about [building a persistent knowledge layer](/blog/building-a-brain-for-your-ai-cto) that gives AI full context across projects. That context layer is what made this kind of systematic execution possible.

The workflow was the same one I use for product builds at my companies. Write a design spec describing the content model, the page types, the features, and the metadata requirements. Review the spec for gaps. Create an implementation plan. Execute in focused sprints. Review and iterate.

Seventy-plus commits across five days means roughly fourteen commits per day. Each commit represented a discrete, reviewable change: add the content schema for projects, implement the blog filtering UI, generate structured data from company entities, configure the multi-sitemap, add breadcrumb navigation. The granularity was intentional. Small commits make it possible to review what changed, catch issues early, and maintain a clear history of decisions.

The technology stack was Astro for the static site generator, Tailwind for styling, and Netlify for deployment. These are public tools, well-documented, well-suited for content-heavy sites. The choice wasn't interesting. What was interesting was how product thinking shaped what got built on top of them.

I suspect a developer building a personal site with the same stack would have produced something technically competent but structurally flat. Pages, components, styles, done. That's a hypothesis, not a fact, and I'm sure plenty of developers bring excellent product instincts to their personal sites. But in general, the default mental model for building a website is "what pages do I need?" The product mental model starts elsewhere: "what entities exist, how do they relate, and what views serve the people who need them?" The site architecture ends up reflecting the problem domain rather than the technology powering it.

## What I Would Not Have Built Without Product Thinking

Looking back at the feature list, several things would not exist if I'd approached this as a conventional website project.

Content collections with typed schemas connecting person to companies to projects to publications to blog posts. This is a product data model. A developer thinks about pages. A product person thinks about entities. The distinction sounds abstract, but it determined the entire architecture.

Automated cover image generation. This comes from thinking about the content lifecycle: what happens when I publish a new post? If the answer involves a manual step in a design tool, that step will eventually become the reason I stop publishing. The product question is: what makes the publishing workflow frictionless?

The structured data graph. This comes from recognizing that the site serves two user types: human visitors and search engines. A brochure approach optimizes for human visitors only. Treating search engines as a second user type, with their own needs and their own "UI" (structured data), is a product decision.

The integration between contact forms and calendar booking. This comes from mapping the user journey: someone reads a blog post, finds it valuable, wants to connect. How many clicks between that impulse and a booked meeting? Reducing that number is a product optimization.

None of these features are technically impressive. They're product-impressive, if that's a useful distinction. They emerge from asking the right questions about who the site serves and how, not from writing clever code.

## The Maintenance Question

The real test of a personal site isn't launch day. It's six months later.

A brochure site degrades because every update requires remembering which pages to touch and mustering the motivation to touch them. A product-built site should degrade more slowly, because the structure handles consistency and the content model makes updates atomic: change one entity, and every page that references it reflects the change. I say "should" because I'm five days in, not six months in. The theory is sound. The evidence is pending.

Will I actually maintain this site? The honest answer is that I don't know yet. What I know is that the friction is lower than any personal site I've built before. Adding a new blog post is one file. Adding a new project is one file that automatically appears on the right company page, gets linked from relevant blog posts, and shows up in structured data. The system handles the coordination that used to be my job.

The deeper point is that product thinking is a lens, not a technology choice. You can apply it to a personal website, a SaaS dashboard, or a tax tracking spreadsheet. For the personal site specifically, the practice was: define your entities, map their relationships, design for the user's actual job, and build the system so that maintenance is cheap. Most personal websites fail because they're designed for launch day. Product thinking designs for day 180.

Five days and seventy commits built a site that I think will still be accurate a year from now. If I'm wrong, I'll write about that too.
