---
term: "Forced-Choice Assessment"
seoTitle: "What Is a Forced-Choice Assessment? Trading Off Equally Desirable Items"
description: "Forced-choice assessments make respondents trade off equally desirable items rather than rate each one independently. Learn how the format reduces faking and ceiling effects, and what its ipsative scoring costs."
definition: "A forced-choice assessment is a measurement format in which respondents must select between two or more items rather than rate each item independently, eliminating uniform endorsement and reducing socially desirable response bias."
domain: "psychometrics"
relatedContent:
  - "blog/measure-employee-engagement-custom-psychometric-work"
  - "work/gyfted"
relatedTerms:
  - "ipsative-measurement"
  - "ceiling-effect"
  - "likert-scale"
  - "psychometric-assessment"
  - "construct-validity"
status: published
date: 2026-04-27
---

If a Likert scale lets respondents agree with everything, a forced-choice assessment makes them choose. The format presents two or more items at once and asks the respondent to pick the one that fits them best (or both the most-fit and least-fit, in the multidimensional version). They cannot rate every option highly. They cannot rate every option neutrally. They are forced to express a preference, which is what the instrument exists to capture.

The format goes back to the 1940s, used originally in personnel selection and military classification work where Likert formats were producing scores too distorted by social desirability to support real decisions. It re-emerged in commercial assessment over the last two decades as the construct-irrelevant variance in Likert measurement became a more visible problem in high-stakes hiring contexts. It is now the default format in several major personality and values inventories used for senior leadership assessment.

## Why the Format Exists

The argument is straightforward. On a Likert scale, respondents can rate every prosocial item at the top of the scale, producing the [ceiling effect](/glossary/ceiling-effect/) that collapses variance. On a forced-choice format, they cannot. If two items are presented together and both are socially desirable — "I value team success" versus "I value individual achievement" — the respondent has to pick one. The trade-off is the data.

Forced choice also reduces faking. A respondent trying to present an idealized version of themselves on a Likert can simply rate every desirable item highly. On a forced choice, they have to choose between desirable options, which means impression management has to be more sophisticated than blanket positive endorsement. Studies on socially desirable responding consistently show that forced-choice formats produce smaller faking effects than Likert under instructions to fake good (Salgado and Tauriz 2014, Bartram 2007 on the OPQ32r).

The third advantage is harder to verbalize but practical: the forced-choice format makes respondents think. A Likert scale invites near-automatic responding once the respondent has settled into a pattern. A forced choice between two items requires a decision on each block. The cognitive engagement is higher, which produces data with more signal per item even before any psychometric advantages from the format itself.

## How It's Constructed

A forced-choice assessment has two main design dimensions: the block size and the response mode.

**Block size.** Pairs (two items per block) are the simplest. Triplets (three items, pick most and least) are common in commercial assessments. Quads and larger blocks are used occasionally where item economy matters more than respondent burden.

**Response mode.** Pick-most-only collects one response per block. Pick-most-and-least collects two responses per block (which extracts more information per block but increases respondent effort). Full ranking within a block extracts the most information but is significantly heavier for respondents.

Construction also has to balance the items within blocks. The standard approach is to match items on social desirability so respondents are choosing between options of similar attractiveness. Items measuring different traits but matched on desirability force respondents to express trait preference rather than desirability preference, which is what the instrument is trying to measure.

The block design also has to ensure each trait gets enough exposure. In a multidimensional assessment, every trait of interest needs to be represented across enough blocks for stable scoring. This is why forced-choice assessments tend to be longer than Likert versions of the same construct — you need more items to get the same information per trait.

## The Cost: Ipsative Data

The catch is that forced-choice scoring is naturally [ipsative](/glossary/ipsative-measurement/). Each respondent's scores sum to a constant, which means the scores describe within-person trait priorities rather than between-person trait levels.

This matters for analysis. Sample-level statistics, factor analyses, and correlations behave differently on ipsative data than on normative data. Standard analytic methods often produce misleading results when applied to ipsative scores without adjustment. Cheung and Chan (2002) is the classic reference on the analytic constraints; Brown and Maydeu-Olivares (2011, 2018) describe modern IRT-based approaches that recover normative scores from forced-choice data using the Thurstonian Item Response Theory model.

The Thurstonian approach is what most contemporary high-quality forced-choice assessments use. It models the underlying preferences as continuous latent variables, treats the forced-choice responses as evidence about which latent variable was higher in a given block, and recovers individual-level normative scores. This requires substantial sample sizes during calibration but produces scores that can be compared across respondents the way Likert scores can.

## When to Use It

Forced choice earns its complexity in specific use cases.

**High-stakes selection where faking is a serious risk.** Senior leadership hiring, sales role selection, executive assessment. The cost of impression management on a Likert format is high enough to justify the construction effort.

**Values and culture-fit measurement.** This is where Likert ceiling effects are most predictable. The gr8.tech custom values assessment I designed at [Gyfted](/work/gyfted/) used forced-choice for the core values items specifically because Likert produced unusable distributions on the same content.

**Self-other agreement contexts.** When self-ratings are being compared to manager ratings or peer ratings, forced-choice formats reduce the self-flattering bias that inflates self-ratings on Likert formats.

It is the wrong choice when the population is small enough that calibration of a Thurstonian model is unstable, when respondent burden is a serious constraint, when the construct is genuinely unidimensional and a Likert measurement of that single dimension is sufficient, or when the use case is descriptive rather than comparative (e.g., internal climate measurement where between-person comparison is not the goal).

## What Good Forced-Choice Looks Like in Practice

A well-constructed forced-choice assessment produces respondent feedback that says, in effect, "I had to think about that one." The blocks were balanced on desirability, the trade-offs were genuine, and the experience was harder than ticking through a Likert. That qualitative report is consistent with the quantitative observation that the data has more discriminative variance than the Likert version of the same content.

The data come back ipsative or, with Thurstonian scoring, normalized in a way that supports between-person comparison while preserving the format's resistance to faking. Item-level statistics show that no item in any block was uniformly chosen — within-block balance held up under field administration. Construct-level statistics show that the traits of interest separate from each other, that [discriminant validity](/glossary/discriminant-validity/) holds, and that criterion correlations look reasonable.

When any of those properties fails, the issue is usually in the block construction rather than in the format itself. Forced-choice as a format is well-validated. The work is in building the specific instrument well, which takes more design effort than building a Likert version of the same construct. The trade is worth it when the use case requires the format's properties; otherwise, Likert remains the cheaper and entirely adequate default.
