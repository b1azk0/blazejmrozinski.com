---
term: "Item Discrimination"
seoTitle: "What Is Item Discrimination? Test Quality Statistic Explained"
description: "Item discrimination measures how well a single test item separates high from low scorers. A core item analysis statistic — learn point-biserial, why negative values signal broken items, and how to fix them."
definition: "Item discrimination is a psychometric statistic describing how well a single test item separates examinees who score high on the overall test from those who score low, typically expressed as a point-biserial correlation between item response and total score."
domain: "psychometrics"
relatedContent:
  - "blog/psychometric-analysis-university-exams"
relatedTerms:
  - "classical-test-theory"
  - "cronbach-alpha"
  - "distractor-analysis"
  - "item-response-theory"
  - "construct-validity"
status: draft
date: 2026-04-17
---

Item discrimination is the single most useful statistic for deciding whether a test item is pulling its weight. It asks a direct question: does this item tend to be answered correctly by people who do well on the test overall, and incorrectly by people who do poorly? If yes, the item is contributing signal. If not, it's adding noise or, worse, measuring something other than what the rest of the test measures.

## Definition and the Point-Biserial Computation

For a dichotomously scored item — right or wrong, 0 or 1 — the standard discrimination statistic is the point-biserial correlation between the item score and the total test score. It's just a Pearson correlation where one variable happens to be binary. Values range from -1 to +1. Positive values mean high scorers tend to get the item right; negative values mean the opposite.

Within [classical test theory](/glossary/classical-test-theory/), the point-biserial is the workhorse. Under [item response theory](/glossary/item-response-theory/), the same concept lives in the discrimination parameter `a` — the slope of the item characteristic curve at its inflection point. Steeper curve, higher `a`, better discrimination. The two frameworks converge on the same intuition: an item that fails to separate strong from weak examinees is not doing its job.

## Interpretation

Rough working bands for point-biserial discrimination:

- **> .30** — good. The item clearly tracks overall performance.
- **.20 – .30** — marginal. Usable, but worth watching.
- **< .20** — suspect. Either weakly related to the construct or poorly worded.
- **< 0** — broken. Revisit immediately.

A worked example. Imagine a 50-question exam where the top 27% of students score above 40 and the bottom 27% score below 25. On item 12, the correct answer (key: C) is selected by 30% of top students and 70% of bottom students. The point-biserial comes out negative — around -.25. The item is actively harming the test: students who understand the material are systematically picking a different option than the one marked correct.

## Why Negative Discrimination Happens

Negative item discrimination is rare and always worth investigating. Three common causes, roughly in order of frequency:

**Scoring key error.** By far the most common cause. The "correct" answer in the key is wrong. The students who actually understand the material pick the genuinely correct option, which the key marks as a distractor. This is almost always the first hypothesis to test — it's fixed in seconds and happens on real exams more often than most instructors admit.

**Ambiguous stem or defensible alternative.** The stem is worded such that a careful reader sees multiple defensible answers, and high-ability students pick the more sophisticated one. The key rewards the surface reading. The fix is to rewrite the stem, not to argue with the statistics.

**Construct mismatch.** The item measures something genuinely different from the rest of the test — a trivia question hiding inside a concept exam, or a procedural item on a test otherwise measuring understanding. Items like this drag down [Cronbach's alpha](/glossary/cronbach-alpha/) and muddle the factor structure. They belong on a different test or not at all.

## Using Discrimination Alongside Difficulty

Discrimination becomes much more informative when you cross it with item difficulty (the proportion of examinees who answer correctly). The useful quadrants:

- **Easy + high discrimination.** A warm-up item. Most people get it, but those who miss it are disproportionately the weakest students. Good for the front of a test, fine to keep.
- **Medium difficulty + high discrimination.** The ideal item. Contributes maximum information about where examinees sit relative to each other.
- **Hard + high discrimination.** A ceiling item. Only strong students get it right. Valuable if your test needs to distinguish at the top.
- **Hard + low discrimination.** Guessing noise. The item is difficult because it's confusing, not because it measures a harder concept. Usually the first candidate for rewriting.
- **Easy + low discrimination.** Everyone gets it. Contributes essentially zero information and wastes test time.

The pathological combination is high difficulty with low or negative discrimination — an item that almost nobody gets right and where the handful who do aren't the strongest students. That's a [distractor analysis](/glossary/distractor-analysis/) problem waiting to be diagnosed.

Discrimination is where item-level psychometric review starts. I work through this quadrant analysis on real exam data in the [psychometric analysis of university exams](/blog/psychometric-analysis-university-exams), including the cases where a single rewritten item flipped from negative discrimination to solidly positive and recovered several percentage points of test reliability.
