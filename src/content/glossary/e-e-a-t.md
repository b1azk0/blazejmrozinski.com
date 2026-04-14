---
term: "E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)"
seoTitle: "What Is E-E-A-T? Google's Quality Framework for Content and SEO"
description: "E-E-A-T is Google's quality framework evaluating Experience, Expertise, Authoritativeness, and Trustworthiness. Learn how it affects rankings and how to demonstrate it."
definition: "E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) is a framework from Google's Search Quality Rater Guidelines used to evaluate the quality and credibility of web content."
domain: "product"
relatedContent:
  - "blog/personal-site-as-product"
  - "blog/seo-architecture-before-first-visitor"
relatedTerms:
  - "structured-data-json-ld"
  - "internal-linking"
  - "indexnow"
  - "content-model"
status: published
date: 2026-04-09
---

E-E-A-T started as E-A-T in Google's Search Quality Rater Guidelines — a document that trains the human contractors who evaluate search results quality. In December 2022, Google added a second E for Experience, making explicit something that was previously implied: that having done something matters, not just knowing about it.

The framework is not a ranking algorithm. It doesn't map to a specific ranking signal or a score you can optimize for directly. It's a quality evaluation framework — a description of what "good" looks like that informs both human raters and, indirectly, how Google's systems are trained and calibrated.

## What Each Letter Means

**Experience** is the first E added in 2022. It asks: does the author have first-hand experience with the subject? A review of a hotel is more credible if written by someone who stayed there. A guide to managing a chronic illness carries more weight if written by someone who has it. Experience is distinct from expertise — you can be an expert on something you've never personally experienced, and you can have direct experience without formal credentials.

**Expertise** is domain knowledge and skill. For technical or professional topics, expertise means demonstrated competence — training, credentials, a track record of accurate information in the field. The definition shifts by topic: medical expertise means medical credentials; product expertise means demonstrable technical knowledge and applied experience.

**Authoritativeness** is recognition by the broader community. It's the difference between claiming to be an expert and being recognized as one. Citations, mentions by authoritative sources, backlinks from respected sites, speaker credentials, published research — these are all authoritativeness signals. You can't manufacture authoritativeness; it accumulates from external recognition.

**Trustworthiness** is the most foundational of the four. A site can lack expertise in some areas but still be trustworthy if it's honest about what it knows and doesn't know, has clear ownership and contact information, and doesn't manipulate or deceive. Trustworthiness is about integrity, not just competence.

## YMYL and Why E-E-A-T Matters More in Some Areas

E-E-A-T thresholds aren't uniform across all content. Google applies heightened scrutiny to YMYL — "Your Money or Your Life" — topics where inaccurate information could cause real harm. Medical advice, financial decisions, legal guidance, and safety information are the core YMYL categories.

For a YMYL page, low E-E-A-T is a serious quality problem. For a page about recipe ideas or movie recommendations, the stakes are lower and the E-E-A-T bar is correspondingly less demanding. If you're producing content in high-stakes domains, demonstrating E-E-A-T isn't optional.

## How to Demonstrate E-E-A-T

The signals that demonstrate E-E-A-T are mostly about making existing credibility visible and verifiable, not manufacturing credibility that doesn't exist.

**Author bios and credentials:** Every article should have an identifiable author with a bio that covers their relevant background. Not a generic corporate bio — specific credentials, relevant experience, what makes this person qualified to write about this topic.

**First-person experience:** When you've done the thing you're writing about, say so. First-person accounts of direct experience are a clear Experience signal. "I've been using IRT-based assessment design for eight years across organizational contexts" is more credible than "IRT is commonly used in assessment."

**Citations and sources:** Link to your sources. Cite research. Reference primary data. This demonstrates that your claims are grounded and verifiable, and it connects your content to authoritative sources in the field. The same logic applies on the inside of your own site: a deliberate [internal linking](/glossary/internal-linking/) structure that connects related concepts makes your topical depth visible to both readers and search engines.

**Original research:** Data you've collected, analyses you've run, surveys you've conducted — these are strong E-E-A-T signals because they demonstrate direct contribution to the knowledge base, not just synthesis of others' work.

**External validation:** Speak at conferences. Publish in peer-reviewed outlets. Get cited by others. These are authoritativeness signals, and they're necessarily earned over time.

## E-E-A-T in Structured Data

Structured data supports E-E-A-T by making author and publisher information explicit and machine-readable. A `Person` schema on an about page, with `alumniOf`, `worksFor`, and `sameAs` properties linking to external profiles and credentials, gives Google verifiable entity data that supports E-E-A-T assessment. An `Article` schema with `author` pointing to that `Person` entity connects the content to the verified author.

This is one reason the person schema on an about page is more than cosmetic. It's an E-E-a-T signal embedded in the technical architecture of the site.

## A Personal Brand Site as E-E-A-T Infrastructure

A personal site built with deliberate E-E-A-T architecture is itself a long-term credibility asset. The about page establishes identity and credentials. Publications and research pages demonstrate authoritativeness. Blog posts with first-person professional experience demonstrate the Experience dimension specifically. Underneath all of this sits a [content model](/glossary/content-model/) that defines author, publication, project, and post as first-class entities — making the credibility graph explicit rather than implied. A change-aware indexing protocol like [IndexNow](/glossary/indexnow/) then ensures search engines actually see updates promptly.

The goal isn't to perform credibility. It's to make genuine credibility visible to the systems — human and algorithmic — that evaluate it. If you have the credentials and experience, the architecture should surface that clearly. If you don't, no amount of structured data will substitute for actually doing the work.
