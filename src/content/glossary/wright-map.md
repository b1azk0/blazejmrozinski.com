---
term: "Wright Map"
seoTitle: "What Is a Wright Map? IRT Person-Item Visualization"
description: "A Wright map plots examinee ability against item difficulty on a shared logit scale, showing whether a test actually matches its cohort. Learn what well-aligned and poorly-aligned maps look like."
definition: "A Wright map is a two-panel visualization from Item Response Theory that plots examinee ability and item difficulty on a shared logit scale, revealing whether a test's difficulty distribution matches the population it measures."
domain: "psychometrics"
relatedContent:
  - "blog/psychometric-analysis-university-exams"
relatedTerms:
  - "item-response-theory"
  - "item-discrimination"
  - "classical-test-theory"
status: draft
date: 2026-04-17
---

A Wright map is the clearest single diagnostic for person-item targeting — the question of whether a test's difficulty range matches the population it measures. One image, two panels, a shared vertical scale — and you can see at a glance whether your test is calibrated to the cohort in front of it. No table of reliability coefficients, difficulty indices, or discrimination statistics shows targeting as quickly. It's one instrument on a larger dashboard, not the whole dashboard.

## What a Wright Map Shows

A Wright map has two panels sharing a vertical axis measured in logits. On the left panel, each examinee is plotted at their estimated ability (θ, theta). On the right panel, each item is plotted at its estimated difficulty (b). Because both quantities live on the same logit scale under [item response theory](/glossary/item-response-theory/), you can read directly across the map: a person sitting at θ = +1.0 has about a 50% probability of correctly answering an item whose difficulty sits at b = +1.0, a higher probability on easier items, and a lower probability on harder ones.

The map is typically rendered with persons on the left as a histogram or stacked dots and items on the right labeled by item number. Easy items sit low on the scale; hard items sit high. Low-ability examinees sit low; high-ability examinees sit high. The geometry is deliberately simple because the question it answers is simple: does the range of items on this test cover the range of abilities in this cohort?

## Reading the Map

Three patterns recur and each tells a different story.

**Clusters of persons well above the item cluster.** The test is too easy for the cohort. High-ability examinees run out of items that can distinguish them from each other — they all cluster near the top of the scoring distribution, and the test can't say which of them is strongest. This is a ceiling effect, and it compresses the top of the distribution into noise.

**Persons well below the item cluster.** The test is too hard. Low-ability examinees sit in a region of the trait where there are no items targeted at their level. Their scores are dominated by guessing and their ability estimates carry wide standard errors. Floor effect.

**Persons centered on items with comparable spread.** Well-aligned test. The bulk of examinees sit in the trait region where the bulk of items provide information, and the tails of the person distribution have items that can distinguish the extremes. This is the geometry you're aiming for.

Person-item alignment is not the same as saying every examinee is at the 50/50 point for every item. It means the item pool spans the range of abilities in the population with enough items in each region to measure precisely where measurement matters.

## What a Healthy vs Broken Map Looks Like

A concrete illustration. Imagine a university midterm where 80% of the student histogram sits above the hardest item on the test. Every strong student is answering every item correctly. The map shows an obvious vertical gap between the top of the item distribution and the top of the person distribution. The test score ceiling is pinning the estimates of the strongest students at the maximum, and the test cannot rank them relative to each other. If the course is selecting the top performers for a follow-on program or grading on a curve, the instrument is silently failing exactly where the decisions matter. The fix is not reweighting the items it has — it's adding harder items until the item distribution extends into the region where the top of the class actually sits.

The mirror pattern looks similar but inverted: persons piled up below the item cluster, score distribution hugging the floor, differences between weak and moderately weak students unmeasurable.

## Where Wright Maps Fit in the Diagnostic Stack

[Classical test theory](/glossary/classical-test-theory/) statistics — reliability, item difficulty proportions, [item discrimination](/glossary/item-discrimination/) indices — describe properties of the test averaged over the sample that took it. Each is useful in isolation, and none puts persons and items in the same visual frame. A Wright map does, and it forces the targeting question a table of statistics lets you dodge: is this test measuring the people I'm trying to measure?

Targeting is one diagnostic question among several. Local item misfit, differential item functioning across demographic groups, dimensionality, and option-level distractor behavior are separate questions that demand their own tools — infit and outfit statistics, DIF analyses, factor analysis, distractor plots. A Wright map won't surface any of them. It sits alongside those diagnostics, not above them.

The answer is often uncomfortable. Tests calibrated for one cohort get re-administered to a different cohort and turn out to be misaligned. Item banks drift over years as the population changes. New items get added at difficulty levels where the existing bank was already well covered, ignoring gaps at the tails. A Wright map surfaces all of this in a single plot. Reliability coefficients don't.

I make Wright maps a standard output in every assessment project I work on, including the one walked through in the [psychometric analysis of university exams](/blog/psychometric-analysis-university-exams), where the map surfaced a ceiling effect the summary statistics had quietly hidden.
