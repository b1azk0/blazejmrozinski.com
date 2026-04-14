---
term: "Confirmatory Factor Analysis (CFA)"
seoTitle: "Confirmatory Factor Analysis (CFA): Testing Measurement Models in Psychometrics"
description: "CFA tests whether observed variables fit a hypothesized factor structure. Learn how CFA validates psychometric instruments with fit indices and factor loadings."
definition: "Confirmatory Factor Analysis (CFA) is a statistical technique that tests whether observed variables (e.g., questionnaire items) conform to a hypothesized underlying factor structure."
domain: "psychometrics"
relatedContent:
  - "work/gyfted"
  - "work/swps-university"
relatedTerms:
  - "structural-equation-modeling"
  - "construct-validity"
  - "psychometric-assessment"
  - "classical-test-theory"
  - "item-response-theory"
status: published
date: 2026-04-09
---

Building a psychological assessment involves a hypothesis: that a set of observable responses — questionnaire items, behavioral ratings, test scores — reflects some underlying construct you can't directly measure. Confirmatory Factor Analysis (CFA) is how you test that hypothesis rigorously.

Unlike exploratory methods, CFA starts with a specified model. You say upfront which items should load on which factors, which factors should correlate, and which parameters should be fixed to zero. The analysis then evaluates how well that pre-specified structure fits the actual data. It's a test of a theory, not a search for patterns.

## CFA vs. EFA

The distinction matters. Exploratory Factor Analysis (EFA) lets the data suggest a factor structure — you specify the number of factors and let the algorithm determine which items cluster together. EFA is appropriate early in scale development when you're still discovering the structure of a construct domain.

CFA is appropriate after you have a theoretical basis for the structure. You need a reason to expect a given item to load on a given factor before you run CFA. Running EFA, adopting whatever structure emerges, and then "confirming" it with CFA on the same dataset is a methodological error — you've used the data twice in the same direction and inflated your confidence in a structure that may not replicate.

In practice: EFA to explore, CFA to confirm, ideally on independent samples or at minimum on held-out data.

## Key Components

**Latent variables** are the constructs you can't directly observe — conscientiousness, emotional intelligence, motivation. In CFA, these appear as circles in the path diagram.

**Observed indicators** are the things you actually measure: specific questionnaire items, subscale scores, behavioral counts. They appear as rectangles.

**Factor loadings** are the relationships between latent variables and their indicators. A loading of 0.70 means the item shares about half its variance (0.70²) with the underlying factor. Loadings below 0.40 suggest an item isn't doing much work; loadings above 0.90 suggest items may be too redundant.

**Error terms** capture the variance in each observed variable that isn't explained by the latent factor — unique variance and random measurement error. Every indicator has one, and they're almost never zero in real data.

**Factor correlations** (in oblique models) represent the relationships between latent variables. If you're measuring two correlated constructs, a correlated factor model is usually more realistic than an orthogonal one that forces them to be independent.

## Fit Indices

CFA produces a covariance matrix implied by your model. Fit indices compare that implied matrix to the observed covariance matrix in your data. No model fits perfectly — the question is whether it fits well enough to be useful.

Key fit indices and typical cutoffs:

**CFI (Comparative Fit Index):** Compares your model to a null model that assumes all variables are uncorrelated. Values ≥ 0.95 indicate good fit; ≥ 0.90 is acceptable in many contexts.

**TLI (Tucker-Lewis Index):** Similar to CFI but penalizes model complexity. Values ≥ 0.95 for good fit.

**RMSEA (Root Mean Square Error of Approximation):** Measures the average discrepancy between the model-implied and observed matrices per degree of freedom. Values ≤ 0.06 indicate good fit; ≤ 0.08 is often acceptable. RMSEA includes a 90% confidence interval — report both the estimate and the interval.

**SRMR (Standardized Root Mean Square Residual):** Average standardized residual across all correlations. Values ≤ 0.08 indicate good fit.

No single index is sufficient. Report multiple indices and interpret them together. A model with CFI = 0.96 and RMSEA = 0.11 has a problem — the RMSEA is flagging poor fit that the CFI is masking.

## Model Modification

When fit is poor, CFA output includes modification indices (MIs) — estimates of how much chi-square would decrease if a currently fixed parameter were freed. This is where many researchers go wrong: adding parameter modifications to improve fit without theoretical justification is equivalent to overfitting. You're optimizing for this sample, not finding a generalizable structure.

The defensible approach: only free a parameter if you have a theoretical reason to do so, and treat the modified model as a new hypothesis requiring replication. If your model needs substantial modification, the right response is often to revisit the theory and the item pool, not to add correlated errors until the fit indices look acceptable.

## Practical Use in Assessment Development

CFA is the standard validation tool for new psychological instruments. In the [psychometric assessments](/glossary/psychometric-assessment/) I've built at [Gyfted](/work/gyfted/), the typical validation sequence runs:

1. Literature review and item generation informed by a theoretical model
2. Pilot data collection (minimum 100–200 respondents)
3. Item screening via [Classical Test Theory](/glossary/classical-test-theory/) statistics
4. EFA on pilot data to check whether the structure holds empirically
5. New data collection for CFA
6. CFA to formally test the hypothesized structure
7. Multigroup CFA to test measurement invariance across relevant subgroups

Step 6 is where the model is accepted or rejected. If the hypothesized factor structure fits the CFA data well, you have evidence that your items are measuring what you intended them to measure. That's structural validity — one component of the broader [construct validity](/glossary/construct-validity/) argument. For ability-style instruments, [item response theory](/glossary/item-response-theory/) is a complementary framework that models item-level behavior rather than the factor structure of the whole scale.

## Common Mistakes

Running CFA before EFA on a new instrument, then claiming confirmation of a structure you found via EFA. Running CFA and EFA on the same data. Accepting a model because one fit index is above the cutoff while others are poor. Modifying models without theoretical justification and reporting only the final fit. Using small samples (CFA typically requires at least 200–300 respondents, and more for complex models with many parameters).

CFA is a test of theory. Using it as a polishing tool to make an atheoretical item pool look structured is a misuse that produces valid-seeming results that won't replicate.
