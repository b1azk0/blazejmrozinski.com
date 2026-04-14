---
title: "How I Taught AI to Work Like a Colleague"
date: 2026-04-07
tags: [ai-as-cto, knowledge-systems]
audience: [ai-practitioners, product-leaders, founders]
format: how-i-work
description: "A hands-on guide to configuring AI assistants through role definitions, safety protocols, and feedback loops. How I turned Claude Code from a capable tool into a personalized technical partner over several weeks of real work."
status: published
safety_review: false
source_queue: null
label: ai-automation
---

I recently wrote about building a [knowledge base for AI](/glossary/knowledge-base-ai/) that gives AI full context across multiple projects. Several people asked a follow-up question I'd skipped: how do you actually get the AI to use that context well? How do you go from "capable tool with good reference material" to something that knows your working style, respects your boundaries, and improves over time?

The answer was less about the knowledge base and more about the process of working together. I didn't write a perfect configuration one weekend. I started with a rough identity document, worked alongside the AI for a few weeks, and shaped its behavior through corrections, incidents, and accumulated feedback. The configuration I have today emerged from that process. It's still evolving.

I did all of this with Claude Code. The principles apply to any AI tool that supports persistent instructions (ChatGPT's Custom Instructions, Cursor rules files, system prompts in API-based setups), but the specific mechanisms I'll describe are Claude's. I won't pretend I built equivalent setups on every platform. This is what I actually did.

## Table of Contents

- [Starting from Zero](#starting-from-zero)
- [The First Document: Defining Who We Are](#the-first-document-defining-who-we-are)
- [Writing the Operating Manual](#writing-the-operating-manual)
- [The Incident That Changed Everything](#the-incident-that-changed-everything)
- [Teaching AI Your Preferences Through Feedback](#teaching-ai-your-preferences-through-feedback)
- [The Compound Effect](#the-compound-effect)
- [What You Can Start With Tomorrow](#what-you-can-start-with-tomorrow)

## Starting from Zero

The first sessions were productive enough in isolation. Within a single project, the AI could read the codebase, check git history, and make reasonable recommendations. The problems started when I switched context.

I run multiple projects across several business entities. A content management platform with a development partner. A quantitative research engine for crypto strategies. Server infrastructure shared across client sites. Personal automation tools. Each lives in its own repository, has its own constraints, and connects to the others in ways that only I know about.

Every time I started a session on a different project, I spent ten to fifteen minutes re-explaining context. Who I am. What this project is. What decisions were already made. What constraints apply. The AI had no way to know any of this, so I dictated it fresh every time.

The frustrating part wasn't the repetition. It was the quality gap. The AI would make technically sound recommendations that ignored business constraints it couldn't know about. It would suggest deploying to a server already running production sites for clients. It would recommend an architecture pattern we'd explicitly decided against two weeks earlier. It would treat me like a generic user instead of someone with domain expertise in psychometrics and product strategy who happens to not write code.

I tried solving this with better prompts. Longer system messages. It helped at the margins, but the core problem remained: I was trying to compress years of business context and decision history into a few paragraphs of text, re-written from scratch every time. The information wasn't the bottleneck. Persistence was.

## The First Document: Defining Who We Are

The first configuration document I wrote was a role definition. One page describing who I am, who the AI is, and how we relate to each other.

The first version was too simple. "I'm a product leader who uses AI for technical work." Accurate but useless. It doesn't tell the AI how to calibrate its communication, what decisions it should make autonomously, or where my expertise starts and its expertise ends.

The version that worked was specific about four things: what each party brings, what each party needs, how decisions get made, and what the dynamic looks like.

Here's a condensed version of what I wrote:

> **What I bring:** Product vision and growth strategy. Deep understanding of data, statistical reasoning, and experimental methodology. SEO and digital marketing expertise. Business context about what matters and what's worth building.
>
> **What I need from the AI:** Technical implementation I can trust without reading every line. Clear reasoning I can evaluate and challenge from a product perspective. Honest assessment of what's hard, risky, or easy. A partner who thinks about the product, not just the code.
>
> **What the AI brings:** Architecture, implementation, debugging, deployment. Technical decision-making with clear justification. The ability to hold complex system context and reason about it.
>
> **What the AI needs from me:** Product direction and priorities. Domain knowledge. Pushback when reasoning doesn't convince, because veto power keeps quality high.
>
> **Our dynamic:** I have veto power. The AI has free hand until pushed back. Small stuff: the AI just moves. Big architectural calls: the AI presents options with tradeoffs, I decide. When we disagree: the AI makes its case with clear reasoning. If I'm not convinced, I veto and the AI adjusts.

The effect was immediate. The AI stopped asking permission for routine technical decisions. It started presenting architectural choices as options with tradeoffs instead of asking "what should I do?" It calibrated its communication to someone who understands systems and data but doesn't write code: real technical terms with clear reasoning instead of jargon walls or dumbed-down explanations.

The framing mattered more than I expected. Calling this a "CTO" role rather than "assistant" or "helper" changed the AI's posture. It started owning technical decisions the way a CTO would: making the call, justifying it, being ready to defend it if challenged. That's a fundamentally different mode than waiting for instructions.

The first version of this document was too vague to change anything. It took three or four sessions of noticing gaps ("why did the AI ask me which database to use when it should have just decided?") before the role definitions got specific enough to actually shape behavior.

## Writing the Operating Manual

The role document answered "who are we?" The next gap was "how do we actually work together?"

I noticed the AI's communication style was inconsistent. Some sessions it over-explained as if I'd never seen a database. Others it fired off jargon without context. It would ask permission for decisions I'd already delegated, then make calls I wanted input on. The behavior was unpredictable because I'd defined roles without defining process.

So I wrote an operating manual covering communication expectations, decision-making protocols, and checkpoint rules:

> **Communication style:** Technical but accessible. Use real technical terms, explain the reasoning, don't hide behind jargon but don't avoid it either. Direct about tradeoffs: "this is faster but harder to change later." When something is genuinely complex, explain just enough for an informed decision.
>
> **Decision-making:** The AI leads technical decisions (architecture, stack, tooling). I lead product and growth (what to build, for whom, priorities). The AI justifies recommendations with reasoning and tradeoffs. Small decisions: the AI just moves, no permission needed. Architectural calls: present 2-3 options with tradeoffs, recommend one, let me pick.
>
> **Checkpoints:** Narrate as you go. What you're doing, why, what you expect to happen. Stop at decision forks. This lets me catch product-level mistakes early, when they're cheap to fix.

Most people who configure AI tools focus on what they want the AI to know. This document focused on how the AI should behave. It's the difference between giving a new hire a project brief and giving them the employee handbook. The brief tells them what to work on. The handbook tells them how to communicate, when to escalate, and what decisions are theirs to make.

After this document existed, sessions became predictable. I stopped getting the "would you like me to..." deference pattern on routine technical choices. Instead I got opinionated recommendations with clear reasoning. The working relationship started feeling like an actual working relationship.

## The Incident That Changed Everything

Three weeks into this setup, the AI locked me out of a production server. Three times, in the same project.

The first incident: I asked for SSH hardening on a VPS. The AI modified the authentication configuration to add two-factor login. In the process, it commented out the line handling standard password authentication for all users. SSH stopped accepting any login method. Complete lockout. I had to boot into rescue mode through the hosting provider's console to fix it.

The second incident, same server: the AI disabled root login without checking how I actually log in. I log in as root. Locked out again.

The third: the AI configured the firewall to actively reject malicious connections instead of silently dropping them. The flood of rejection responses triggered the hosting provider's automated DDoS protection, which blocked SSH at the network level. This made debugging the first two lockouts significantly harder because the port appeared dead from the outside, even after the underlying issues were fixed.

All three incidents shared a root cause: moving too fast on dangerous operations without sufficient caution. The AI was confident, technically competent, and wrong about critical assumptions it never thought to verify.

Instead of a "don't do that again" conversation, I wrote it into the configuration as a structured safety protocol:

> **Command Tiers:**
>
> | Tier | What | Behavior |
> |------|------|----------|
> | 1: Read-only | Diagnostics, status checks, logs | Auto-approve, no plan needed |
> | 2: Writes | Config changes, installs, deploys | Per approved plan, self-verify each step |
> | 3: Dangerous | Auth changes, firewall rules, database drops | Stop. Flag risk. Wait for go-ahead. |
>
> **Before any dangerous operation:**
> 1. Explicitly flag the risk and what could go wrong
> 2. Let me prepare (backups, save state)
> 3. Wait for my go-ahead
> 4. Execute with self-verification at each step

The command tier system didn't come from a security best practices guide. It came from three stressful incidents that could have been avoided. And that's the broader lesson: the most valuable configuration documents are the ones you write reactively, after something actually goes wrong. Incidents are configuration fuel.

Anyone using AI for consequential work will eventually hit a moment where the AI does something confidently wrong. The question is whether that becomes a one-time verbal correction that fades between sessions, or a persistent rule that prevents the entire category of mistake going forward. Writing it down is the difference.

## Teaching AI Your Preferences Through Feedback

The role document, operating manual, and safety protocol all came from deliberate writing. The next layer of configuration emerged from corrections I made during regular work, most of which I didn't plan to make.

I use a content pipeline that generates blog posts from my project work. The first batch of drafts came back well-structured and technically solid, but the writing was full of em dashes used as parenthetical separators. I'd never noticed how much AI-generated text relies on that pattern until I saw it in writing that was supposed to sound like me. I flagged it: "stop using em dashes, use commas instead or break into two sentences." That correction got stored as a persistent rule.

In the same review, I noticed the AI kept using a framing pattern: "Not as a tool. Not as a search engine. As a CTO." It's a structure that reads as distinctly AI-generated, the kind of rhetorical escalation that sounds polished but feels manufactured. I flagged that too. Another persistent rule.

Here's what the stored correction actually looks like in the memory system:

> **Rule:** Avoid "not X, but Y" framing in drafts.
> **Why:** It's a crutch pattern that LLMs overuse. Makes content feel templated.
> **How to apply:** Rewrite any "Not as a coding assistant. Not as a search engine. As the CTO..." patterns. State what something IS directly instead of defining it by what it isn't.

Other corrections accumulated the same way. I mentioned a draft was "just perfect in terms of length" at about 2,100 words. That became a preference. I corrected a draft that said "AI has no memory" to something more nuanced, because the reality is more complicated. The oversimplification bothered me. That nuance became a principle.

Over a few weeks, the AI built a detailed voice profile by analyzing my published writing and refining it against my editorial feedback. It now knows that my writing reads as "practitioner explaining to peers," that I earn credibility through specificity rather than assertion, and that I'm honest about limits rather than papering over them.

None of this was planned. It accumulated from friction. I didn't know I disliked em dashes in AI-generated content until I saw a draft full of them. I didn't know I had a strong opinion about how to frame AI's memory limitations until the AI got it wrong. Configuration through feedback is as much self-discovery as it is instruction-writing.

## The Compound Effect

Each configuration layer was written for a specific problem at a specific time. The role document came from early friction. The operating manual from inconsistent communication. The safety protocol from server lockouts. The preference system from editorial feedback. None were designed as parts of a coherent system.

But together, they compound into something qualitatively different from "AI with good prompts."

When I recently built a [content distillation pipeline](/projects/contentforge) (the system that produces these blog posts), the AI already knew my voice, my business entities, my privacy boundaries, and my editorial standards from weeks of accumulated work on other projects. It didn't need a single calibration session. It produced drafts that read like me on the first attempt, because everything it needed had been documented through the process of working together.

When I registered a new quantitative research project, the AI immediately understood where it fit in my portfolio, what infrastructure was available, and what level of operational caution was appropriate. Context that would have taken a full introductory session was available in seconds.

[The first post in this series](/blog/building-a-brain-for-your-ai-cto) argued that what AI knows matters more than what AI can do. I'd now add a second half: how AI knows you (your working style, your boundaries, your mistakes) matters as much as what it knows about your projects.

## What You Can Start With Tomorrow

If you want to build something like this, the order matters more than the thoroughness.

**Start with a one-page identity document.** Who you are, what you're building, what role the AI plays. Be specific about decision authority. "You lead technical decisions, I lead product decisions" is more useful than "help me with my project."

**After your next three sessions, write down every correction you made.** "Don't do X" and "yes, exactly like that" are equally valuable. Store them somewhere the AI reads at session start. Claude has CLAUDE.md files and a memory system, ChatGPT has Custom Instructions, Cursor has rules files.

**Wait for something to go wrong.** When it does, don't just fix the immediate problem. Write down what happened, why, and what the rule should be going forward. This will produce your highest-value configuration document.

**After a week, write the operating manual.** By now you'll know how you actually work together, not how you imagined you would. Writing it after real experience makes it descriptive rather than aspirational.

**Keep iterating.** The configuration is never finished. My setup today is better than it was two weeks ago, and it will be better again in two weeks. The document I wrote after the server lockout is still one of the most valuable pieces in the entire knowledge base, and it only exists because something went wrong.

The gap between a generic AI and a personalized one is smaller than most people assume. About twenty documents and a few weeks of paying attention. The hard part isn't the writing. It's the discipline of noticing what works, what doesn't, and writing it down before you forget.
