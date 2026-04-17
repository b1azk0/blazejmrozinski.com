# Glossary Expansion Batch (2026-04-17) — Design Spec

**Date:** 2026-04-17
**Status:** Approved
**Goal:** Add 11 glossary entries derived from the 10 newest blog posts, with Ahrefs-informed SEO metadata sourced via ContentForge.

---

## Overview

The glossary currently has 25 entries. Scanning the 10 newest blog posts (2026-04-04 through 2026-05-11) surfaces 11 strong candidate terms not yet covered — each is either an established industry term with real search intent or a named concept referenced across multiple posts. This spec covers writing those 11 entries, optimizing them against Ahrefs research performed in ContentForge, and publishing.

---

## Scope — 11 Entries

| Slug | Domain | Parent posts |
|------|--------|-------------|
| `cache-warming` | infrastructure | wp-infra-06, wp-infra-04 |
| `transient-cleanup` | infrastructure | wp-infra-06, wp-infra-04 |
| `cron` | infrastructure | wp-infra-06, wp-infra-07 |
| `ufw` | infrastructure | wp-infra-05 |
| `watchdog-monitoring` | infrastructure | wp-infra-07 |
| `cronbach-alpha` | psychometrics | psychometric-analysis-university-exams |
| `item-discrimination` | psychometrics | psychometric-analysis-university-exams |
| `distractor-analysis` | psychometrics | psychometric-analysis-university-exams |
| `wright-map` | psychometrics | psychometric-analysis-university-exams |
| `switching-cost` | product | saas-is-dead-narrative |
| `outcome-based-pricing` | product | saas-is-dead-narrative |

**Domains:** All entries reuse existing domain values (`infrastructure`, `psychometrics`, `product`). No new domain strings introduced — matches existing conventions where `fail2ban` and `ssl-tls-certificate` also live under `infrastructure`.

**Out of scope (explicitly rejected during brainstorming):** `ai-safety-protocol`, `knowledge-distillation-pipeline`, `ai-agent-configuration`, `database-optimization`, `health-check-automation`, `page-cache-bypass`. Reasons: either author's framing (not established terms), generic phrases without search intent, or cannibalize existing glossary entries.

---

## Page Structure

Match existing pattern. Reference: `src/content/glossary/lemp-stack.md`.

**Frontmatter:**

```yaml
---
term: "UFW (Uncomplicated Firewall)"
seoTitle: "What Is UFW? Uncomplicated Firewall on Linux Explained"
description: "150-160 char keyword-rich meta description."
definition: "One-sentence plain definition, featured-snippet targetable."
domain: "security"
relatedContent:
  - "blog/wp-infra-05-locking-it-down"
relatedTerms:
  - "fail2ban"
  - "vps"
status: draft
date: 2026-04-17
---
```

**Body:**
- Opening paragraph — plain-language definition, no jargon yet
- 3-5 H2 sections — what it does, how it works, typical configuration, when it applies
- 400-900 words
- Inline links to related glossary terms using `/glossary/<slug>/` convention
- Inline link to one or two parent blog posts for "see this in context"
- No comments, no emoji, no images (glossary pages are text-only per existing pattern)

**Voice:** Blazej's writing voice (see `~/.claude/projects/.../user_writing_voice_profile.md`). Operator-pragmatic, first-person where earned, no hype.

---

## Ahrefs Research (ContentForge Handoff)

This repo does not call Ahrefs tools per project CLAUDE.md rule. Research happens in ContentForge.

**Flow:**

1. **This repo writes drafts first** — all 11 entries created with `status: draft`, best-guess `seoTitle` / `description` / `relatedTerms` based on knowledge of each term. Drafts rendered on dev server only (not linked from site index per existing glossary behavior).

2. **ContentForge runs research** — for each of the 11 terms, call `keywords-explorer-overview` to capture primary keyword, monthly search volume, difficulty, SERP snapshot, and related-terms cluster. Write results to `contentforge/seo/glossary-audit-2026-04-17.md` in a structured format.

3. **This repo consumes the audit** — for each entry, revise:
   - `seoTitle` → aligned with primary keyword from audit
   - `description` → incorporates primary + one related keyword, 150-160 chars
   - `relatedTerms` → cross-check against audit's related-terms cluster
   - Body H2s → tune section headings toward high-intent sub-queries
   - Link back to audit file in commit message

4. **Flip to published** — `status: draft` → `status: published`, commit, push → Cloudflare Pages deploys automatically.

**Credit budget:** 11 `keywords-explorer-overview` calls + optional `keywords-explorer-related-terms` for any term where the overview's related list looks thin. Total in ContentForge, not here.

---

## Cross-Linking Strategy

**In-scope (this pass):**
- Each new entry's `relatedContent` → 1-3 parent blog posts
- Each new entry's `relatedTerms` → existing glossary entries where applicable (e.g., `ufw` → `fail2ban`, `vps`)
- Body of each new entry includes inline `/glossary/...` links to 2-4 related terms
- New entries cross-link to each other where natural (e.g., `cache-warming` ↔ `transient-cleanup` ↔ `cron`)

**Out-of-scope (deferred):**
- Editing the 10 blog posts to add inline `[term](/glossary/...)` links pointing to the new entries. Separate pass, bigger blast radius on published content. After this batch ships, a follow-up task will list which posts would benefit and propose edits for review.

---

## Sitemap & Index

- `sitemap-glossary.xml.ts` auto-generates from the glossary collection — no manual update needed. Verify after publish.
- `/glossary/` index page lists all published entries — no manual update needed.
- `sitemap-index.xml.ts` already references `sitemap-glossary.xml.ts` — no change.

---

## Publish Flow

1. Write 11 drafts → commit (`feat: draft 11 glossary entries from newest post scan`)
2. Wait for ContentForge audit file at `contentforge/seo/glossary-audit-2026-04-17.md`
3. Revise drafts per audit → commit (`feat: optimize glossary entries per Ahrefs audit`)
4. Flip status to `published` → commit (`feat: publish glossary expansion batch`) → push to `main` → Cloudflare Pages deploys
5. Update `CHANGELOG.md` with the 11 new entries
6. Verify live URLs return 200 and appear in `sitemap-glossary.xml`

---

## Success Criteria

- All 11 entries live at `/glossary/<slug>/` with 200 status
- Each entry has primary keyword aligned to Ahrefs data where volume exists; for zero-volume terms (likely `wright-map`, possibly `distractor-analysis`), keep draft-best-guess metadata and note in the audit file that the term is topical/educational rather than search-driven
- Each entry has ≥2 outbound `/glossary/` links and ≥1 `relatedContent` link
- `sitemap-glossary.xml` includes all 11 new URLs
- `CHANGELOG.md` entry describes the batch
- No broken internal links introduced

---

## Non-Goals

- No changes to blog post bodies
- No changes to glossary schema
- No changes to glossary layout / component
- No new domain string values introduced
- No rank tracking setup — that is ContentForge's job if it happens at all
