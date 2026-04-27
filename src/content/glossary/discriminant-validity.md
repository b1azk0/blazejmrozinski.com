---
term: "Discriminant Validity"
seoTitle: "What Is Discriminant Validity? Showing Your Test Measures Something Distinct"
description: "Discriminant validity is evidence that a test does not correlate too highly with measures of distinct constructs. Learn how to test it with HTMT, the Fornell-Larcker criterion, and what to do when discriminant validity fails."
definition: "Discriminant validity is the degree to which a test correlates less strongly with measures of theoretically distinct constructs than with measures of the same construct, providing evidence that the test is not redundant with neighboring measures."
domain: "psychometrics"
relatedContent:
  - "blog/measure-employee-engagement-custom-psychometric-work"
  - "work/gyfted"
  - "projects/hse-career-quiz"
relatedTerms:
  - "construct-validity"
  - "confirmatory-factor-analysis"
  - "psychometric-assessment"
  - "classical-test-theory"
  - "item-response-theory"
status: published
date: 2026-04-27
---

A test that correlates with everything is measuring nothing in particular. That is the problem discriminant validity is designed to catch. If your new measure of leadership potential correlates 0.85 with general intelligence, 0.80 with extraversion, and 0.78 with conscientiousness, the parsimonious explanation is that you have built a noisy general-positive-evaluation factor, not a measure of leadership potential. The whole point of building a specific instrument was to measure something specific, and the evidence says you didn't.

Discriminant validity is one half of the construct-validity pair introduced by Campbell and Fiske in 1959. The other half, convergent validity, is the requirement that your measure correlate strongly with other measures of the same construct. The two have to be evaluated together. A measure can have strong convergent validity (it correlates highly with other measures of leadership potential) and weak discriminant validity (it also correlates highly with measures of unrelated traits). When that happens, the convergent finding is contaminated, because what looks like agreement on the target construct is partly agreement on a broader common factor.

## The Logic

The argument is about specificity. If your construct definition says leadership potential is distinct from general cognitive ability and from extraversion, then your measure of leadership potential should produce different correlations than measures of those neighboring constructs do. Specifically, it should correlate higher with other measures of leadership potential than with measures of cognitive ability or extraversion.

This is testable. You administer your new measure alongside (a) other measures of the same construct, (b) measures of theoretically distinct constructs, and (c) the criterion you eventually want to predict. The correlation matrix tells you whether your measure is sitting where the theory says it should sit.

Failure of discriminant validity has two common shapes. The boring shape is method variance: your measure correlates with everything because everything in the matrix uses the same method (self-report Likert items), and shared method inflates all the correlations. The substantive shape is conceptual overlap: your measure shares a meaningful amount of variance with neighboring constructs because the items you wrote are not as construct-specific as the construct definition implied.

## How It's Tested

Several methods are in active use. None of them is universally accepted, and the choice depends on the analytic framework you're working in.

**Fornell-Larcker criterion.** Common in covariance-based [confirmatory factor analysis](/glossary/confirmatory-factor-analysis/) and structural equation modeling. The criterion: the square root of the average variance extracted (AVE) for each construct must exceed its correlations with all other constructs in the model. The intuition is that a construct should explain more variance in its own indicators than it shares with any other construct. Fornell-Larcker is the historical default, easy to compute, and widely reported.

**Heterotrait-monotrait ratio (HTMT).** A more recent alternative proposed by Henseler, Ringle, and Sarstedt in 2015. HTMT compares the average of correlations between items measuring different constructs (heterotrait) to the average of correlations between items measuring the same construct (monotrait). Values below 0.85 (strict) or 0.90 (liberal) indicate adequate discriminant validity. Simulation studies have shown HTMT is more sensitive to discriminant validity violations than Fornell-Larcker, and it has become the preferred test in many contemporary applied papers.

**Cross-loadings inspection.** In an exploratory or confirmatory factor analysis, items should load high on their target factor and low on other factors. Substantial cross-loadings indicate items that aren't construct-specific. Inspecting the loading matrix is a basic check that should accompany any formal discriminant validity test.

**Multitrait-multimethod (MTMM) matrix.** The Campbell-Fiske original approach. You measure multiple traits using multiple methods (self-report, observer report, behavioral). Discriminant validity is supported when same-trait, different-method correlations exceed different-trait, same-method correlations. MTMM is more expensive to design but controls for method variance directly, which other approaches do not.

## Why Failures Happen

Items often look construct-specific in isolation but turn out to overlap with neighboring constructs once tested. A common pattern: items written to measure "engagement" include statements about feeling that one's job matters, having opportunities to grow, and getting along with coworkers. Each of those is a defensible engagement indicator on its own, but the combination produces a scale that overlaps substantially with job satisfaction and with perceived organizational support. The instrument measures engagement plus, and the plus contaminates the discriminant evidence.

A second common pattern: response style. Some respondents are systematically positive across instruments; others are systematically negative. When all measures rely on self-report, response style produces correlations that look like construct overlap but are actually method overlap. Multi-method designs are the cleanest way to disentangle these, though they're rarely affordable in applied measurement work.

A third pattern: the construct itself was not well-defined. If the [construct definition](/glossary/construct-definition/) is fuzzy, the items will be fuzzy, and the scale will pick up nearby content because there is no sharp boundary to keep it in scope. This is a definition problem disguised as a validity problem, and rerunning the analysis won't help — the construct itself has to be re-specified.

## What to Do When It Fails

**Trim items.** Cross-loadings inspection identifies items that load nearly as strongly on neighboring factors as on the target factor. Removing them often improves discriminant validity at modest cost to internal consistency. The trade-off is acceptable when discriminant validity was the binding problem.

**Re-specify the model.** If two factors that the construct definition treats as distinct produce a correlation above 0.85, the parsimony argument is that they are one factor, not two. Either the theoretical model needs revision (they are facets of a single construct, not separate constructs) or the instrument needs more discriminating items between them.

**Re-define the construct.** When neither item trimming nor model re-specification resolves the issue, the construct definition itself is probably the source. The instrument is measuring what the items actually capture, not what the definition claimed it would capture, and forcing the instrument back to the definition through item edits is unlikely to work.

**Add method variance controls.** When the failure is method-driven, adding behavioral measures, observer reports, or alternate response formats (forced-choice rather than Likert) can break the response-style component. This is more expensive than item-level fixes but addresses the actual cause when method variance is real.

## Why It Matters in Practice

For applied measurement, discriminant validity is the test that separates a real instrument from a glorified positive-affect scale. Hiring assessments without discriminant validity evidence produce predictions that look strong because they correlate with everything, including the criterion. The correlation is real, but the explanation is wrong. The assessment isn't predicting performance because it measures the construct it claims to measure; it's predicting performance because it correlates with general cognitive ability or with response style. In contexts where the confounding variable changes (different role, different population, different organizational context), the prediction stops working and nobody knows why.

In the [Gyfted](/work/gyfted/) instruments I have validated, discriminant validity testing usually starts with HTMT for any covariance-based analysis and Fornell-Larcker as a secondary report for stakeholders accustomed to seeing it. Cross-loadings get inspected as a standard part of CFA reporting. The honest cases — where discriminant validity does not initially hold — usually trigger one of the responses above rather than a search for a friendlier metric to report. Ignoring discriminant problems and shipping the instrument anyway is the failure mode that produces the assessment scandals that periodically reach the popular press, and it is not worth the short-term saving.
