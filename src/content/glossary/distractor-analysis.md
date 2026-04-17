---
term: "Distractor Analysis"
seoTitle: "What Is Distractor Analysis? Evaluating Multiple-Choice Wrong Answers"
description: "Distractor analysis examines which wrong-answer options students actually pick on a multiple-choice test. Learn how to spot dead distractors and rewrite items that aren't pulling weight."
definition: "Distractor analysis is the examination of how frequently each wrong-answer option on a multiple-choice test item is selected, used to identify non-functional ('dead') distractors and improve item quality."
domain: "psychometrics"
relatedContent:
  - "blog/psychometric-analysis-university-exams"
relatedTerms:
  - "item-discrimination"
  - "classical-test-theory"
  - "psychometric-assessment"
status: draft
date: 2026-04-17
---

Most test analysis stops at whether an item was answered correctly. Distractor analysis looks at the wrong answers — which ones students actually picked, and in what proportions. That view is cheap to produce, often ignored, and almost always the fastest way to improve an existing item bank. A multiple-choice item is only as strong as its wrong-answer options, and a shockingly large proportion of items on real exams have one or two options that nobody ever chooses.

## Why Distractors Matter

A four-option multiple-choice item with one obviously-wrong answer is effectively a three-option item. The expected guessing rate rises from 25% to 33%. One more non-functional distractor and you're at a 50-50 coin flip for anyone without knowledge of the content. That shift directly inflates the scores of weak examinees and compresses the bottom of the score distribution — which damages [item discrimination](/glossary/item-discrimination/) across the whole test, not just on the bad item.

The fix is to treat distractors as first-class content, not filler. Every option should be plausible enough that a student without the relevant knowledge cannot immediately rule it out. If a distractor exists only to round out four letters, it isn't doing any psychometric work.

## Dead Distractors

A rough working cutoff: any option selected by fewer than 2% of examinees is a "dead distractor." It's functionally invisible to the examinee pool — they read it, dismiss it instantly, and move on. The item is a three-option question with a dummy letter attached.

Two fixes, in order of preference:

**Rewrite.** Replace the dead option with something more plausible. Usually that means drawing from common student errors, half-right reasoning, or confusions between adjacent concepts. If you have free-text responses from a previous cohort, mine them — students will have generated better distractors than you'll invent at a desk.

**Reduce option count.** Not every item needs four options. Three well-calibrated distractors beat four where one is obviously filler. Modern psychometric practice, especially in medical and professional licensing testing, has moved toward three-option items for exactly this reason. The research supports it: shorter option sets don't meaningfully hurt reliability and make writing functional distractors much easier.

## High-Ability Students Picking a Distractor

The most useful signal from distractor analysis is not which options are dead — it's which wrong options are disproportionately chosen by the top of the distribution. If strong students consistently pick option B instead of the keyed option C, something is wrong with the item, not with the students.

Two likely causes:

**The distractor is defensible as correct.** The content is sloppy. Two options are genuinely right under reasonable readings, and the more sophisticated students notice the alternative reading while weaker students pick the option the instructor had in mind. Within [classical test theory](/glossary/classical-test-theory/), this shows up as reduced discrimination; more aggressively, it can produce a negative point-biserial on the keyed option.

**The stem is ambiguous.** The question can be read two ways, and the two readings lead to different answers. High-ability students spot the ambiguity and commit to the reading that produces the distractor.

Either way, the correct response is to fix the item. Don't argue with the signal. The students who understand the material best are telling you something about your stem or your key.

## Distractor Analysis as the Cheapest Improvement Lever

In [psychometric assessment](/glossary/psychometric-assessment/) work, the economics of item improvement matter. Writing a new item from scratch is hours of content expert time plus pilot data plus calibration. Rewriting a dead distractor on an existing item is maybe thirty minutes, reuses the rest of the item and its existing difficulty history, and often moves a marginal item into the solidly useful range.

For any institution sitting on an item bank of more than a few hundred questions, distractor analysis is the highest-leverage cleanup pass available. Scrapping bad items is expensive. Rewriting their weakest option is almost free. The order of operations I use on real item banks: run discrimination and difficulty statistics first, identify the bottom 15-20% of items by discrimination, and before deciding to scrap any of them, look at the distractor frequencies. A meaningful fraction of those weak items are salvageable with a single rewritten distractor.

I walk through the full workflow on a real exam dataset in the [psychometric analysis of university exams](/blog/psychometric-analysis-university-exams), including the specific cases where a single distractor rewrite recovered an item that would otherwise have been dropped from the bank.
