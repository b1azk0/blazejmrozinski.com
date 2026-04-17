---
term: "Cronbach's Alpha"
seoTitle: "What Is Cronbach's Alpha? Reliability Coefficient Explained"
description: "Cronbach's alpha is the most common estimate of internal-consistency reliability in psychometrics. Learn how it's computed, what values are acceptable, and where it misleads."
definition: "Cronbach's alpha is a coefficient of internal-consistency reliability that estimates how well a set of test items measures a single underlying construct, based on the average inter-item correlation."
domain: "psychometrics"
relatedContent:
  - "blog/psychometric-analysis-university-exams"
relatedTerms:
  - "classical-test-theory"
  - "construct-validity"
  - "item-discrimination"
  - "psychometric-assessment"
  - "confirmatory-factor-analysis"
status: draft
date: 2026-04-17
---

Cronbach's alpha is the number almost everyone reports when they talk about "test reliability," and it's also the statistic most widely misunderstood by the people reporting it. At its core, alpha is an estimate of internal consistency — how much the items on a scale correlate with each other, adjusted for the number of items. It is not a measure of validity, it is not a measure of stability over time, and it does not tell you that your scale measures one thing. High alpha is a necessary condition for treating a test score as a coherent number, but it is nowhere near sufficient.

## What Alpha Actually Measures

Alpha estimates one specific thing: the degree to which responses to the items on a scale move together within a single administration. It's derived from the average inter-item correlation and the number of items. The formal definition sits inside [classical test theory](/glossary/classical-test-theory/) and assumes that all items are tau-equivalent — that every item measures the same latent trait with the same precision. That assumption is almost never true, which is one of the reasons alpha tends to underestimate reliability when items are unequally weighted and overestimate the coherence of the underlying construct.

What alpha is not: it is not test-retest reliability. It says nothing about whether you'd get the same score from the same person next week. It is not [construct validity](/glossary/construct-validity/). A scale can have alpha of .95 and still measure the wrong thing — if ten redundant items all correlate with each other because they all tap the same narrow facet of a broader construct, alpha will look beautiful while the instrument systematically misses what you actually want to measure. Reliability is a ceiling for validity, never a substitute.

## Rough Interpretation Bands

The conventional thresholds treat alpha as if there were one right cutoff. There isn't. Useful rough bands:

- **.70** — minimally acceptable for research where you're reporting group-level means
- **.80** — appropriate for most diagnostic or decision-support uses
- **.90+** — the floor for high-stakes individual decisions (selection, admissions, clinical diagnosis)

These numbers come from Nunnally and have been repeated as doctrine for decades. In practice they depend on what the score is used for and what the cost of measurement error looks like. A five-item screener used to flag candidates for follow-up can tolerate .75. A single-number decision that determines whether someone gets a job offer or a medical diagnosis cannot. Rigid cutoffs detached from use case are measurement theatre.

## What Inflates Alpha Misleadingly

Three common patterns make alpha look better than the underlying instrument deserves:

**Item count.** Alpha is mathematically tied to test length. Add more items — even redundant ones — and alpha rises. A 40-item scale with mediocre inter-item correlations can easily hit .90 while a 6-item scale with genuinely strong correlations sits at .80. Comparing alphas across scales of different length without thinking about this is how people convince themselves that bloated instruments are more reliable than tight ones.

**Multidimensional scales.** If your 30-item scale actually measures two correlated factors rather than one, alpha will still report a single high number. The [item discrimination](/glossary/item-discrimination/) statistics will look fine. Only [confirmatory factor analysis](/glossary/confirmatory-factor-analysis/) or a careful look at the factor structure will surface that you're averaging over two different things.

**Redundant near-duplicate items.** Three items that are essentially paraphrases of each other inflate average inter-item correlation without adding measurement coverage. Alpha rewards this; good scale design does not.

## When Alpha Is the Wrong Tool

For heterogeneous constructs — anything intentionally multidimensional, or anything where the items are meant to be formative rather than reflective — McDonald's omega is the more defensible statistic. Omega doesn't assume tau-equivalence and plays correctly with factor structure.

For very short scales (fewer than about five items), alpha is unstable and essentially uninterpretable. Report inter-item correlations directly or think harder about whether reliability is the right frame at all.

For instruments calibrated under [item response theory](/glossary/item-response-theory/), alpha is the wrong unit of analysis. IRT reports marginal reliability and the test information function, which make it explicit that precision varies across the trait continuum. A single average reliability number hides the thing you most need to know: where on the scale is the test actually measuring well.

Reliability coefficients are a tool for catching broken instruments, not a trophy to display. In my [psychometric analysis of university exams](/blog/psychometric-analysis-university-exams) I walk through what alpha was and wasn't telling us on real test data, and where it pointed me toward items worth rewriting rather than whole tests worth scrapping.
