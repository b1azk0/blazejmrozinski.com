---
term: "Structural Equation Modeling (SEM)"
seoTitle: "Structural Equation Modeling (SEM): Testing Complex Relationships in Research"
description: "SEM tests complex relationships between observed and latent variables simultaneously. Learn how path analysis, CFA, and full SEM work in psychological research."
definition: "Structural Equation Modeling (SEM) is a multivariate statistical framework that tests hypothesized relationships among observed and latent variables simultaneously, combining factor analysis with path analysis."
domain: "research"
relatedContent:
  - "work/swps-university"
relatedTerms:
  - "confirmatory-factor-analysis"
  - "construct-validity"
status: draft
date: 2026-04-09
---

Most statistical techniques test one relationship at a time. Regression predicts an outcome from a set of predictors. CFA tests whether items fit a factor structure. But psychological theory usually posits more complex mechanisms: that a treatment affects wellbeing partly by increasing self-efficacy, which in turn reduces anxiety. Or that childhood adversity predicts adult depression through multiple mediating pathways simultaneously.

Structural Equation Modeling (SEM) tests that kind of model — a complete theoretical structure — in one analysis. That's the core appeal, and the core risk: the more complex the model, the more assumptions it embeds, and the more ways it can be wrong.

## What SEM Does

SEM specifies a set of equations describing how variables relate to each other and estimates all the parameters simultaneously. In a full SEM, this involves two linked components:

**The measurement model** specifies how latent constructs relate to their observed indicators. This is CFA. Each construct (e.g., job satisfaction) is defined by multiple items, and the measurement model tests whether those items behave as expected — adequate loadings, acceptable fit.

**The structural model** specifies how the latent constructs relate to each other. This is path analysis at the level of latent variables. If you hypothesize that perceived competence mediates the relationship between feedback quality and job satisfaction, the structural model tests that.

Running both simultaneously has an important advantage: it accounts for measurement error in the constructs when estimating the structural relationships. If you instead created sum scores and ran path analysis on those, measurement error in your scales would attenuate the relationships. SEM with latent variables corrects for this — the structural parameters reflect relationships between the error-free latent variables, not the imperfect observed composites.

## Why SEM Matters for Psychological Research

Three capabilities make SEM particularly valuable:

**Mediation testing:** SEM can estimate indirect effects — the path from X to Y that passes through a mediator M. With bootstrap confidence intervals for indirect effects, you can test mediation without the problematic Baron and Kenny sequential regression approach. Full mediation, partial mediation, and competing models (direct-only, indirect-only) can be compared directly.

**Measurement error correction:** As above — path coefficients in SEM reflect relationships between latent constructs, not contaminated composite scores. This gives more accurate estimates of effect sizes than regression on sum scores.

**Model comparison:** SEM allows you to formally compare nested models using chi-square difference tests, and non-nested models using information criteria (AIC, BIC). If you have two competing theoretical accounts of how variables relate, you can test which model fits better.

**Longitudinal models:** Cross-lagged panel models and latent growth curve models are special cases of SEM. They let you test whether earlier scores predict later scores, whether trajectories over time differ across groups, and whether changes in one variable predict changes in another.

## Software

**Mplus** is the standard for complex SEM work in psychology. It handles the widest range of model types (categorical indicators, mixture models, multilevel SEM, Bayesian estimation), has mature documentation, and is the tool most commonly used in high-quality psychological research. The downside: it's expensive and has a steep learning curve.

**lavaan** (in R) is the open-source alternative and has become the standard in academic psychology. The syntax is readable, output is comprehensive, and the ecosystem includes semTools for multigroup analysis, semPlot for path diagrams, and blavaan for Bayesian estimation. For most models lavaan covers, it's as capable as Mplus.

**AMOS** (part of the IBM SPSS suite) is widely used in applied organizational and management research. The GUI-based path diagram interface lowers the barrier to entry, but the flexibility for complex models is more limited than Mplus or lavaan.

## Model Specification

The most important part of SEM is drawing the path diagram before looking at data. Every arrow represents a theoretical claim. Every absence of an arrow is also a claim — that two variables are unrelated (or that their relationship is fully mediated by something else in the model).

Underspecified models — where you've left out relevant relationships — will show poor fit and produce biased estimates. Overspecified models — where you've included every possible relationship — will fit any data and tell you nothing. Good SEM requires good theory first.

## Fit Evaluation

The same fit indices used in CFA apply in SEM: CFI, TLI, RMSEA, SRMR. The same cutoffs apply (CFI ≥ 0.95, RMSEA ≤ 0.06 for good fit). When fit is poor, the structural model, the measurement model, or both may be misspecified. Modification indices can suggest changes, but the same caution applies: don't modify without theoretical justification, and treat any modified model as requiring replication.

## Limitations

**Sample size:** SEM is parameter-hungry. A model with many latent variables and complex relationships requires several hundred respondents at minimum — rules of thumb range from 10 to 20 observations per free parameter, though simulation research suggests absolute minimums around 200. Complex models can require 500+.

**Equivalent models:** A structural model often has equivalent models — different path structures that produce identical fit. The fact that your model fits well doesn't mean your specific theoretical structure is correct; an equivalent model with different paths may fit equally well. This is rarely acknowledged in published research and is a genuine limitation.

**Causality:** SEM fits covariance structures. Without experimental manipulation or longitudinal data with appropriate time lags, SEM can't establish causality even when it's framed in causal language. "X predicts Y through M" is a statement about covariance patterns, not mechanism, unless the study design supports causal inference.

SEM is a powerful tool for testing explicit theories in psychological research. The complexity it enables is an asset when the theory is well-developed and the data design is appropriate — and a liability when it's used to impose theoretical structure on data that could support many alternatives equally well.
