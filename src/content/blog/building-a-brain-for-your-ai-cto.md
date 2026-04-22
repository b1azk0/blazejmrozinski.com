---
title: "How I Built a Knowledge Base That Makes AI Actually Useful Across Projects"
date: 2026-04-04
tags: [ai-knowledge-base, ai-coding-assistant, ai-as-cto, knowledge-systems]
audience: [ai-practitioners, product-leaders, founders]
format: how-i-work
description: "AI coding assistants work well in a single repo. They fall apart across multiple projects and companies. I built a 30-document knowledge base that gives AI full context in 30 seconds instead of 15 minutes."
status: published
safety_review: false
source_queue: queue/2026-04-04.md
label: ai-automation
---

Three months ago, [Marcin](https://rubyonai.com/) introduced me to the idea of treating AI as a genuine technical partner. He set up [OpenClaw](https://rubyonai.com/) and we began product development on new features at [nerds.family](https://nerds.family), with me as CPO and Marcin as CTO. After that initial phase, I moved to my own Claude Code setup and started building a persistent knowledge layer for all my product needs across a content management platform, a quantitative research engine, server infrastructure, and personal automation tools.

It worked far better than I expected, but only after I solved a problem that nobody talks about in AI productivity content: AI memory has gotten remarkably good within a single project, but it has no soul. No sense of who you are across projects, what your business looks like, or why you made the decisions you made.

## Table of Contents

- [Why AI Loses Context Across Projects](#why-ai-loses-context-across-projects)
- [Building a Persistent Knowledge Base for AI](#building-a-persistent-knowledge-base-for-ai)
- [Results: From 15-Minute Setup to 30 Seconds](#results-from-15-minute-setup-to-30-seconds)
- [Knowledge Base Structure That Scales](#knowledge-base-structure-that-scales)
- [What AI Context Management Can't Solve](#what-ai-context-management-cant-solve)
- [Why AI Knowledge Compounds Across Projects](#why-ai-knowledge-compounds-across-projects)
- [How to Build Your Own AI Knowledge Base](#how-to-build-your-own-ai-knowledge-base)

## Why AI Loses Context Across Projects

AI memory has come a long way. Context windows are massive, tools can read files, and session continuity keeps getting better. If you're working on one project in one repo, the experience is already quite good.

The gap shows up when you operate across multiple projects, companies, and domains. The AI doesn't know that the content platform you're building has a partner who manages SSH access on the production server. It doesn't know that the last time someone automated a config change on that server, you got locked out. It doesn't know which of your four business entities owns which project, or that one of them has strict confidentiality requirements that the others don't.

Each project works fine in isolation. What's missing is the connective tissue: the global context that turns a capable coding tool into something that understands your situation well enough to make real decisions.

Longer [context windows](/glossary/context-window/) and better prompts help at the margins. But the most important context (why decisions were made, what was tried and failed, who is responsible for what across your entire operation) is exactly the kind of thing that doesn't live in any single repo.

## Building a Persistent Knowledge Base for AI

Instead of hoping the AI would figure things out from increasingly elaborate prompts, I built it a persistent [AI knowledge base](/glossary/knowledge-base-ai/). A structured set of documents that the AI reads at the start of every session, covering:

**Who we are.** The specific operating model, stated explicitly. I lead product, growth, and vision. The AI leads technology. I have veto power. The AI has free hand until I push back. This framing changes how the AI makes recommendations. It stops asking permission for routine technical decisions and starts flagging only the calls that genuinely need my input.

**The business landscape.** An entity map covering multiple companies, partnerships, and roles. When I'm working on one project, the AI knows which company it belongs to, who the partners are, what the sensitivity level is, and how it relates to other projects. This prevents the embarrassing mistake of suggesting something that works technically but ignores a business constraint.

**Active projects.** A registry with status, stack, architecture decisions, and links to detailed project docs. When I say "let's work on the content platform," the AI already knows it's a Rails app deployed with container orchestration, that the next phase involves embedding infrastructure, and that there's a partner who handles the development side.

**Hard rules.** Things like "never touch SSH config without discussion" and "always update the README and changelog." These came from real incidents. We had a server lockout that taught us the hard way about the cost of automated config changes without human checkpoints.

**Lessons learned.** Documented post-mortems and workflow discoveries that inform future decisions. The AI reads these and applies them proactively, rather than repeating mistakes I've already made.

## Results: From 15-Minute Setup to 30 Seconds

The difference was immediate and compound.

**Session start-up time dropped from 15 minutes to 30 seconds.** Previously, every session began with me explaining context: what the project is, where we left off, what constraints apply. Now I say "let's continue on the content platform" and the AI already knows the full picture. Over dozens of sessions per week across multiple projects, this is hours recovered.

**Decision quality improved because the AI could weigh tradeoffs I'd forgotten to mention.** When planning a deployment strategy, the AI referenced our infrastructure document (which servers are available, what's already running on them) and our safety protocols (from the lockout incident) without me prompting it. It recommended a specific server and flagged that we'd need to coordinate with the partner who manages SSH access. Context it pulled from the entity map, not from my prompt.

**Consistency across sessions stopped being a problem.** The AI doesn't recommend microservices this week when it agreed on a monolith last week, because the architecture decisions are documented and it reads them. The knowledge base acts as institutional memory that neither of us can accidentally forget.

**The AI started catching my mistakes.** With enough context about the business landscape, the AI could identify when I was about to make a decision that conflicted with a constraint I wasn't thinking about. "This would require deploying to a server that's currently running the production site for a client. Want to use the dedicated staging server instead?" It had access to information I'd written down but wasn't holding in working memory at that moment.

## Knowledge Base Structure That Scales

After iterating on the format for several weeks, I settled on a structure:

**One entry-point document** that the AI reads first. It describes the operating model, links to everything else, and lists hard rules. This is the AI's "boot sequence."

**Entity and project registries** that map the business landscape. The AI consults them when context is needed, but doesn't need to internalize them all at once.

**Project-specific docs** with architecture decisions, tech stack, status, and key documents. Each project gets its own file, updated as decisions are made.

**How-we-work docs** that describe communication style, decision-making process, and safety protocols. These shape the AI's behavior more than any system prompt.

**Lessons learned** from incidents and discoveries. These are the highest-value documents because they encode experiential knowledge that would otherwise evaporate between sessions.

The total corpus is modest. Maybe 30 documents, mostly under a page each. The insight is that structured, curated context beats raw volume. The AI doesn't need my entire email history; it needs the distilled decisions and constraints that should inform every technical recommendation.

## What AI Context Management Can't Solve

I want to be clear about what this system does and doesn't do.

The knowledge base is small enough that the AI reads the relevant portions directly at session start. There's no embedding, no similarity search, no retrieval pipeline. The overhead is minimal and the reliability is total. Every piece of context is guaranteed to be loaded.

Every significant decision still goes through me. The knowledge base makes the AI a better advisor. The "CTO" framing means it brings recommendations with reasoning, and I decide whether to follow them.

The AI is extraordinarily good at holding complexity, managing context across multiple systems, and generating technically sound implementations. It is weak at understanding market dynamics, user psychology, or the political reality of a business partnership. The knowledge base gives it the context to operate within those constraints, but the constraints themselves come from my judgment.

## Why AI Knowledge Compounds Across Projects

The most unexpected benefit has been compounding. Each new project benefits from every previous one. When I set up a content distillation pipeline, the AI already knew my voice, my business entities, my other projects, and the sensitivity rules for what can and can't be published. It didn't need to learn these from scratch.

When I registered a new quantitative research project, the AI immediately understood where it fit in the portfolio, which entity it belonged to, and what infrastructure was available for deployment. Context that would have taken a full session to establish was available in seconds.

This compounding is why I think the knowledge base approach is more important than any individual AI capability improvement. A more capable model that starts from zero every session is still starting from zero. A moderately capable model with full context of your business, your decisions, and your constraints can make recommendations that a genius with no context cannot.

## How to Build Your Own AI Knowledge Base

If you're going to build something like this, start small:

1. Write down who you are, what you're building, and how you want the AI to work with you. One page.
2. Document your active projects: what they are, what stack they use, what decisions have been made.
3. After every significant session, ask yourself: "What did the AI need to know that I had to explain manually?" Write that down.
4. After every incident or surprise, document the lesson.
5. Reference these documents at the start of every session.

Within two weeks, you'll have a knowledge base that makes every AI interaction materially better. Within a month, you'll wonder how you worked without it.

Once the knowledge base exists, the next question is how to get the assistant to use it well — role definitions, safety protocols, feedback loops, and context management for AI assistants across projects. I wrote a follow-up on [configuring Claude Code subagents, skills, and safety protocols](/blog/how-i-taught-ai-to-work-like-a-colleague/) that covers exactly that process. Zooming in one level further, each new project then gets its own [design spec](/blog/design-spec-every-project/), which is the document the AI reads to know what we're actually building this time.

The current discourse around AI productivity focuses almost entirely on model capabilities, on what the AI can do. The bigger leverage, in my experience, is in what the AI knows. And unlike model capabilities, that's entirely under your control.
