---
title: "Everyone Says SaaS Is Dead. Here's What They're Actually Observing."
date: 2026-04-13
tags: [saas-is-dead, saas-business-model, operator-lessons, ai-as-cto]
audience: [founders, product-leaders, general-professional]
format: what-changed-my-mind
description: "The 'SaaS is dead' narrative gets the diagnosis right and the prognosis wrong. AI makes code cheap. It barely touches trust, switching costs, and domain expertise — the parts that actually make a SaaS business model defensible."
status: published
safety_review: false
source_queue: queue/2026-04-09.md
label: operator-notes
---

A trillion dollars in software market value disappeared in a single week earlier this year. The trigger was a wave of AI announcements that made investors question whether the entire SaaS model still made sense. If AI can write code, and if anyone can spin up a competing product over a weekend, why would anyone pay Salesforce $300 per seat per month?

The narrative that followed was predictable. "SaaS is dead." It showed up in analyst reports, investor memos, founder Twitter, and every tech publication looking for a provocative headline. Some versions are more nuanced than others, but the core claim is consistent: AI makes software so cheap to build that existing SaaS companies lose their competitive advantages, margins compress, and the subscription model collapses under its own weight.

I've been watching this narrative with a specific kind of interest. I run multiple companies. I use AI as my primary technical partner for product development. I buy SaaS tools for my businesses. I'm simultaneously someone who benefits from AI making software cheaper to build and someone who depends on SaaS products built by other people. Both sides of the argument run through my daily work.

After months of reading the analysis, watching the market data, and testing the underlying claims against my own experience, I think the narrative gets the diagnosis mostly right and the prognosis almost entirely wrong.

## Table of Contents

- [What the 'SaaS Is Dead' Narrative Gets Right](#what-the-saas-is-dead-narrative-gets-right)
- [The Confusion at the Center](#the-confusion-at-the-center)
- [What Building With AI Actually Teaches You](#what-building-with-ai-actually-teaches-you)
- [Enterprise Complexity Is Not a Bug](#enterprise-complexity-is-not-a-bug)
- [Where the AI Pressure on SaaS Actually Lands](#where-the-ai-pressure-on-saas-actually-lands)
- [What's Actually Replacing the Old SaaS Model](#whats-actually-replacing-the-old-saas-model)
- [What This Means If You Build or Buy Software](#what-this-means-if-you-build-or-buy-software)

## What the 'SaaS Is Dead' Narrative Gets Right

The diagnosis isn't wrong. Several things are genuinely happening.

Per-seat pricing is becoming harder to justify. When AI agents start handling workflows that previously required human operators, charging per human seat stops mapping to the value delivered. A company that automated 40% of its support ticket handling doesn't want to pay the same per-seat rate for its helpdesk software. The pricing model needs to evolve, and companies that resist consumption-based or outcome-based pricing will lose customers to those that don't.

Historically high gross margins are masking real inefficiency. SaaS companies have operated for years on 70-80% gross margins, which left room for bloated teams, slow shipping cycles, and features nobody asked for. AI-native competitors are showing up with half the headcount and shipping faster. The margin compression is real, and it's exposing companies that confused high margins with healthy operations.

Talent is migrating. Top engineers are moving from established SaaS companies to AI-native startups where the work is more interesting and the equity has more upside. The companies losing their best people are left with teams less equipped to adapt, which accelerates the problem. This is a real dynamic, and it's not evenly distributed. The companies already struggling to attract talent are the ones losing the most.

Valuations are under genuine pressure. When terminal value makes up 80% or more of a SaaS company's valuation and AI uncertainty makes that terminal value harder to project, stock prices correct. This isn't market irrationality. It's investors doing math with wider error bars.

All of this is real. The question is what it means.

## The Confusion at the Center

The "SaaS is dead" narrative makes a specific logical leap that I think is wrong: it assumes that because AI makes software cheaper to build, existing software companies lose their reason to exist.

This confuses building software with running a software business. They are not the same thing, and the gap between them is where the narrative falls apart.

Building a functional MVP of a CRM takes less time than it used to. That's true. But running a CRM business requires HIPAA compliance, SOC 2 certification, enterprise sales cycles, data migration tooling, 24/7 support, integration with 200 other tools, a security team, a legal team, localization, accessibility, multi-tenancy, and a decade of institutional knowledge about what happens when a customer with 50,000 records tries to do a bulk import at 3am on a Friday.

AI makes the code part cheaper. The code part was maybe 15% of what makes an enterprise SaaS company defensible. The other 85% is distribution, trust, compliance, switching costs, domain expertise, and the accumulated weight of being embedded in a customer's workflow. None of those got cheaper this year.

The weekend-project argument is particularly revealing. Yes, someone can build a tool that replicates the core features of a SaaS product in a weekend. People have been doing this since the open-source movement began. The reason those weekend projects rarely turn into viable businesses is not that the code wasn't good enough. It's that code was never the moat.

## What Building With AI Actually Teaches You

I build products with AI every day. I have direct, ongoing experience with what AI makes easier and what it doesn't touch.

AI is extraordinary at generating implementations from well-written specs. It handles complex codebases, manages context across multiple systems, and produces technically sound code at a speed that would have been unimaginable three years ago. I'm a psychologist and product leader who doesn't write code. AI is my CTO. The things I'm able to ship would have required a full engineering team not long ago.

Here is what AI does not do: it doesn't tell me what to build. It doesn't understand why a particular pricing model will fail for a specific market segment. It doesn't know that the customer who's been quiet for three months is about to churn because they got acquired and the new parent company standardizes on a competitor. It doesn't understand that the feature request from your biggest customer is actually a symptom of a deeper workflow problem that requires rethinking the entire module.

Product judgment, market understanding, customer relationships, domain expertise. These are the hard parts of running a software business. AI doesn't make them cheaper. If anything, AI raises the bar, because when everyone can build the software, the differentiation shifts entirely to these non-code factors.

My experience building with AI has made me more convinced, not less, that established SaaS companies with real domain depth are defensible. The ones at risk are the ones whose only value was the code itself. And honestly, those companies were always vulnerable. AI just accelerated the timeline.

## Enterprise Complexity Is Not a Bug

There's a strain of the "SaaS is dead" argument that treats enterprise complexity as a legacy problem that AI will sweep away. SaaS sprawl, integration headaches, vendor management, procurement cycles. The implication is that AI-native solutions will be so seamless that all this complexity disappears.

I find this unconvincing. Enterprise complexity exists because enterprises are complex. A multinational with operations in 40 countries needs software that handles 40 different regulatory regimes, multiple languages, different data residency requirements, and organizational structures that evolved over decades of acquisitions. That complexity isn't a property of the software. It's a property of the business. New software, AI-native or otherwise, still has to handle it.

What works for a five-person startup using AI to replace three SaaS subscriptions does not transfer to a Fortune 500 company with embedded systems, custom integrations, and organizational dependencies spanning decades. The scale gap is not a temporary market inefficiency. It's a structural feature of how large organizations operate.

Vertical SaaS companies that understand specific industries (healthcare, manufacturing, financial services) are actually better positioned than they were before. Their domain knowledge is harder to replicate than their code ever was. AI makes their engineering more efficient, which improves their margins. The threat was always that someone with better code would eat their lunch. Now that code is commoditized, their non-code advantages become relatively more valuable.

## Where the AI Pressure on SaaS Actually Lands

The pressure is real, but it's not distributed evenly. Understanding where it lands matters more than the headline claim.

**Point solutions are genuinely threatened.** A SaaS tool that does one thing (schedule social media posts, convert file formats, track a single metric) has low switching costs and a feature set that's easy to replicate. These are the products most vulnerable to AI-powered alternatives or to being absorbed into larger platforms. If your product's value can be described in a single sentence, someone's agent will eventually do it.

**Multi-product platforms with deep integrations are more defensible than ever.** A company using Salesforce isn't just using a CRM. They're using a CRM connected to their marketing automation, connected to their support ticketing, connected to their analytics, connected to their billing. The switching cost isn't "find a better CRM." It's "rebuild seven years of integrated workflows." AI doesn't reduce that switching cost. In many cases, it increases it, because AI-powered features built on top of existing data create new dependencies.

**AI-native startups are real competitors in specific niches.** They're building faster, with smaller teams, and they're attracting talent. But they face the same go-to-market challenges every startup faces: getting customers to trust an unproven vendor with critical data, building enterprise-grade reliability, navigating procurement processes designed to filter out small companies. Being AI-native is an engineering advantage. It is not a distribution advantage.

The companies most at risk are mid-market SaaS players with undifferentiated products, bloated organizations, and no clear domain moat. That's a specific population, not the entire SaaS industry.

## What's Actually Replacing the Old SaaS Model

The pricing shift is real. Per-seat subscription pricing made sense when software was used by humans and the value scaled with the number of humans using it. As AI agents take on more of the work, charging per seat stops mapping to the value delivered. Consumption-based and outcome-based pricing are already emerging, and the transition will be painful for companies optimized around predictable recurring revenue. Wall Street loved the predictability of SaaS subscriptions. The new models are harder to forecast, which creates valuation uncertainty even when the underlying business is healthy.

But the pricing change is surface-level compared to the deeper shift underneath it. The more interesting thing happening is that the product itself is becoming secondary to the outcome.

Think about the trajectory of a sales analytics tool. First it shows you dashboards. Then it starts suggesting talk tracks. Then it coaches reps in real time. Then it qualifies leads, drafts outreach, and handles follow-up autonomously. At some point along that arc, you stop buying a product and start buying a result. The interface becomes invisible. What you're paying for is the outcome: more deals closed, faster pipeline, better conversion. The software is still there, but it's infrastructure, not the value proposition.

This pattern is showing up across categories. Customer service platforms that used to sell ticket management now sell "automated resolution." Healthcare software that used to sell clinical dashboards now sells time back for physicians. Financial planning tools that used to sell spreadsheet automation now sell actionable forecasts. In each case, the product is converging toward the outcome the buyer actually wanted all along. The tool was always a proxy for the result. AI is collapsing the distance between the two.

Contract theory has a name for this. Companies have always wanted to buy results, not tools. Nobody purchases a CRM because they enjoy configuring workflows. They buy it to close more deals. The middleware between intention and outcome existed because automation wasn't sophisticated enough to eliminate it. AI is stripping away that middleware, and as it does, the value shifts from the product to the service it delivers.

This is a more interesting evolution than "SaaS dies." It suggests that the companies best positioned for the next decade aren't the ones with the most features. They're the ones closest to delivering measurable outcomes. A vendor that can say "we increased your conversion rate by 14%" is harder to replace than one that says "we gave you a dashboard that shows your conversion rate." The first is a service relationship. The second is a tool rental.

But the need for those outcomes doesn't go away. Organizations still need to manage customer relationships, track financial data, coordinate projects, communicate internally, analyze performance, and comply with regulations. The form factor changes. The delivery model evolves. The underlying need persists.

What's dying is a specific version of SaaS: the one where you charge $50/seat/month for a product that hasn't meaningfully improved in three years, that requires a dedicated administrator, and that locks customers in through data portability friction rather than genuine value. That version deserves to die. Its death is not evidence that the entire model is collapsing. It's evidence that the model is maturing toward what buyers always wanted: outcomes, not tools.

## What This Means If You Build or Buy Software

If you're building a SaaS product, the question isn't whether AI threatens your business. It does. The question is where the threat actually lands. If your moat is code quality or feature breadth, you're exposed. If your moat is domain expertise, customer trust, data network effects, or integration depth, AI probably strengthens your position by making your engineering more efficient while leaving your real advantages intact.

If you're buying SaaS for your organization, the "SaaS is dead" narrative might tempt you to build instead of buy. Be careful with that impulse. Building a tool is one thing. Maintaining it, securing it, scaling it, supporting it across an organization for five years is something else entirely. The build-vs-buy calculus has shifted, but it hasn't flipped. AI makes building easier. It doesn't make operating easier.

If you're an operator running a small company, as I am, the real takeaway is this: AI changes who can build software and how fast. It does not change what makes software valuable. The hard problems (figuring out what to build, for whom, and why they'll pay for it) are exactly as hard as they were before. Maybe harder, because the competitive surface just got wider.

The SaaS industry is going through a genuine correction. Pricing models will change. Undifferentiated products will die. Bloated organizations will shrink. That's a healthy market doing what healthy markets do: punishing complacency and rewarding adaptation. Calling it death is the kind of dramatic framing that generates clicks and misleads operators. The boring, accurate version is that software is becoming cheaper to build, more expensive to differentiate, and more dependent than ever on the non-code factors that most people in tech have historically undervalued.

I suspect that in two years, the "SaaS is dead" takes will look the way "the cloud will never work for enterprise" takes look now. Directionally aware of a real shift, completely wrong about the magnitude and the implications.
