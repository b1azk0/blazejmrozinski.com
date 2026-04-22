---
title: "Why Every Project Gets a Design Spec: A Product Spec Template for AI-Driven Development"
date: 2026-04-22
tags: [ai-workflow, operator-lessons, product-spec-template, design-spec]
audience: [ai-practitioners, product-leaders, founders]
format: cross-project-synthesis
description: "Design specs aren't documentation overhead. When your CTO is an AI, the spec is your management layer. Here's why the same pattern works across six projects in wildly different domains."
status: published
safety_review: false
source_queue: queue/2026-04-09.md
label: ai-automation
---

Last week I shipped three projects. A personal website with 11 page types, structured data schemas, and an interlinking strategy. A contractor protocol archive that mirrors formal documents and generates tax-advisor-ready PDFs. An academic paper writing template with citation automation and a build pipeline. These projects share nothing technically. Different stacks, different audiences, different goals. But every single one started the same way: with a design spec.

That pattern has now repeated across six projects spanning content platforms, quantitative research tools, tax software, server infrastructure, personal sites, and academic tooling. At some point, repetition stops being a habit and starts being a signal. The spec is doing something that I didn't fully understand when I started writing them.

## Table of Contents

- [The Obvious Argument and Why It's Incomplete](#the-obvious-argument-and-why-its-incomplete)
- [What the Spec Actually Contains](#what-the-spec-actually-contains)
- [Three Projects, One Week, Same Structure](#three-projects-one-week-same-structure)
- [Why the Spec Works as a Management Layer](#why-the-spec-works-as-a-management-layer)
- [The Failure Mode That Made This Click](#the-failure-mode-that-made-this-click)
- [Cross-Domain Consistency Is the Point](#cross-domain-consistency-is-the-point)
- [What This Actually Costs](#what-this-actually-costs)

## The Obvious Argument and Why It's Incomplete

"Planning before building improves outcomes." Yes. That's true and uninteresting. Every project management book says this. Every engineering org has some version of a design document template. The insight here is not that planning is good.

The insight is about what happens to the role of the spec when the person doing the implementation isn't a human colleague who builds context over months, asks clarifying questions in hallway conversations, and pushes back when something feels off. When your [technical partner is an AI](/blog/how-i-taught-ai-to-work-like-a-colleague/), the spec becomes the entire management relationship. There is no hallway. There are no months of shared context. There is the document you wrote and the execution that follows from it.

You might argue that good prompting achieves the same thing. That a detailed initial message can substitute for a spec document. I've tried that, and the difference is structural. A prompt disappears into the conversation. A spec persists as a reference document that both you and the AI can point back to when implementation drifts.

This changes what a spec needs to be. It's no longer a communication artifact that supplements a working relationship. It is the working relationship.

## What the Spec Actually Contains

I've converged on a format after iterating across enough projects that the pattern has stabilized. Every spec covers four things.

First, the scope and architecture. What are we building, what are the components, how do they relate to each other? For the personal website, this meant defining 11 page types, their content collection schemas, how structured data would be generated for each type, and the interlinking rules between sections. For the contractor archive, it meant defining which document types exist, how they map to legal requirements, and what the PDF generation pipeline looks like.

Second, the constraints and decisions. What did I already decide, and why? This is where I document choices like "use static site generation because the content changes monthly, not daily" or "generate PDFs from markdown because the contractor needs to email them to a tax advisor who expects a specific format." These decisions prevent the AI from reopening questions I've already resolved. That matters more than it sounds. Without explicit constraints, the AI will cheerfully re-derive decisions you already made, sometimes reaching different conclusions.

Third, the implementation plan. A numbered sequence of tasks, ordered by dependency, with enough detail that each task is independently executable. Ten tasks for the website. Six for the contractor archive. Eight for the academic template. Each task describes what "done" looks like.

Fourth, the definition of done for the project as a whole. What state does the system need to be in before I consider it shipped? This prevents scope creep during execution, which is a real risk when your implementer can generate code as fast as you can describe features.

## Three Projects, One Week, Same Structure

The personal website spec ran about 2,000 words. It defined page types (home, about, blog index, blog post, project page, project index, contact, legal pages, tag pages, category pages, 404), content collection schemas with required and optional fields, structured data requirements (JSON-LD for articles, person schema, breadcrumbs), interlinking rules (how blog posts reference projects and vice versa), and SEO infrastructure (sitemap generation, canonical URLs, Open Graph tags). The implementation plan broke this into 10 tasks. Then 70+ commits executed it systematically over a few days.

The contractor protocol archive spec was shorter, around 800 words. It defined the document types (contracts, acceptance protocols, monthly summaries), the folder structure, the metadata format, and the PDF generation approach. The key decision documented in the spec was that protocols would be authored in markdown and converted to PDF via a build script, because the contractor needs both a human-readable archive and tax-advisor-ready output. Six tasks. Clean execution.

The academic writing template spec defined citation automation (APA 7th edition via a citation style language file), a wiki-style knowledge system for organizing research notes, manuscript templates with proper academic formatting, and a build pipeline using Pandoc. Eight tasks. The spec caught an important design question early: should the knowledge wiki and the manuscript drafts live in the same repository or separate ones? I decided same repository with different directories, because cross-referencing during writing is more important than repository hygiene. That decision, made in the spec, saved at least an hour of restructuring later.

Three completely different domains. The same document structure. The same planning depth. The same execution pattern. One question this raises is whether the format would hold up for larger, multi-person projects. I don't know yet. For the kind of solo-operator, AI-delegated work I do, the structure hasn't needed modification.

## Why the Spec Works as a Management Layer

When I delegate to a human colleague, management happens through ongoing interaction. I describe what I want, they ask questions, I clarify, they push back on things that seem wrong, we iterate verbally until we reach shared understanding. Then they go build, and we check in periodically. The shared context accumulates over weeks and months. By the sixth project together, the colleague knows my preferences, my standards, my blind spots.

AI has none of that. Every [conversation starts from zero](/blog/building-a-brain-for-your-ai-cto/). The AI doesn't remember that I prefer explicit error handling over silent failures, or that I care more about maintainability than performance in most contexts, or that when I say "simple" I mean "minimal dependencies" not "fewer features." Without a spec, I end up providing this context piecemeal, through corrections during implementation. That's micromanagement. It's exhausting and it produces worse results.

The spec front-loads all of that context into a single document. When the AI reads a spec that says "generate PDF via a build script, not a runtime dependency, because the output needs to work offline," it doesn't need to ask why. When the implementation plan says "Task 4 depends on Task 2 and Task 3," the AI doesn't need to figure out the dependency graph. When the definition of done says "all 11 page types render correctly with structured data validated against Google's Rich Results Test," there's no ambiguity about when to stop.

The spec is, in my experience, the closest substitute for the relationship. That's why it matters, and that's why "planning is good" misses the point. Planning with a human colleague improves outcomes incrementally. Planning with an AI partner is the difference between delegation and micromanagement. I suspect that gap will narrow as AI context windows grow and persistent memory matures, but for now, the spec fills it.

## The Failure Mode That Made This Click

I didn't start with this discipline. Early on, I tried the conversational approach. "Build me a static site with a blog and some project pages." The AI produced something functional within minutes. It also made dozens of decisions I didn't agree with. The blog index showed excerpts when I wanted full titles with dates. Projects were sorted alphabetically when I wanted them ordered by recency. The structured data was missing entirely. Tags existed in the frontmatter but had no corresponding tag pages.

Here's the thing: none of these were bugs. They were reasonable defaults that didn't match my intent. Fixing them took longer than writing a spec would have, because each correction required explaining the broader context that motivated the change. "I want tag pages" is a simple request. "I want tag pages because the interlinking between tags, blog posts, and projects is part of the SEO architecture, and each tag page needs its own structured data and canonical URL" is the actual requirement. The spec is where that level of intent lives.

After the third project where I spent more time correcting implementation decisions than I would have spent writing a spec, the pattern became obvious. The spec isn't overhead. For the kind of projects I build, it's the cheapest form of quality control available when you can't rely on accumulated shared context.

## Cross-Domain Consistency Is the Point

The most interesting thing about applying this pattern across six projects is how well it transfers. The format doesn't change when I move from building a website to building tax software to setting up server infrastructure. The specifics change, obviously. A caching strategy for a web server is nothing like a citation automation pipeline. But the structure of the spec (scope and architecture, constraints and decisions, implementation plan, definition of done) works in all of them.

This suggests something about what the spec is actually doing. It's not a technical document. It's a thinking tool. Writing the spec forces me to answer questions I'd otherwise discover mid-implementation: What are the components? What did I already decide? What order should things happen in? When am I done?

Those questions are domain-independent. Every project has components, decisions, dependencies, and completion criteria. The spec is just a format for making those explicit before execution starts. The fact that the same format works for a personal website and for a tax calculation engine isn't a coincidence. It's because the spec operates at the level of project structure, which is consistent across domains, rather than at the level of technical implementation, which is not.

I should note that six projects is a small sample. The domains are varied, but they're all solo-operator projects with a single implementer. Whether this exact format holds up with teams, or with projects that require iterative discovery rather than upfront specification, is something I can't claim to know.

## What This Actually Costs

Writing a spec takes me 30 to 90 minutes depending on project complexity. The personal website spec took about 75 minutes. The contractor archive took about 30. The academic template was somewhere in between.

That time investment pays for itself in the first hour of implementation. Here's what I observed: without a spec, the first hour of any AI collaboration was spent establishing context through trial and error. With a spec, the first hour was productive execution against a clear plan. The payoff was immediate and consistent across all six projects.

There's also a compounding benefit I didn't anticipate. The specs become documentation. Six months from now, when I need to modify the contractor archive or add a new page type to the website, the spec tells me what the system was designed to do and why. That's information I would otherwise need to reverse-engineer from the code, which is slow and error-prone even when I wrote the code myself, and especially slow when the AI wrote it.

The honest cost is the discipline of doing it for small projects. It's tempting to skip the spec when the project feels simple. "It's just an academic template, how complicated can it be?" In my experience, the answer is always more complicated than it looks. The academic template had eight implementation tasks. The contractor archive had six. These aren't trivial projects, even when they feel trivial at the outset. The spec is what reveals the actual complexity before you're in the middle of it.

Six projects in, I've stopped debating whether a project is "big enough" to justify a spec. For every project I've tried it on, the answer has been yes. The spec is fast to write, impossible to regret, and the closest thing I've found to a management layer that scales across domains when your technical partner starts every conversation from zero. I don't yet know where this breaks down. Maybe at a certain project size, the spec itself becomes the bottleneck. But I haven't hit that wall yet.
