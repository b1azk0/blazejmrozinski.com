# Glossary Expansion Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 11 new glossary entries derived from the 10 newest blog posts, optimized against an Ahrefs audit produced in ContentForge.

**Architecture:** Pure content task. Each entry is a single `.md` file under `src/content/glossary/` conforming to the existing glossary collection schema in `src/content.config.ts`. No TypeScript, component, or layout changes. The Astro build validates schema on compile; sitemap auto-generates. Between drafting and publishing there is a human-in-the-loop checkpoint where ContentForge runs Ahrefs research and drops an audit file into `contentforge/seo/`.

**Tech Stack:** Astro content collections, YAML frontmatter, Markdown.

---

## Reference materials

- Spec: `docs/superpowers/specs/2026-04-17-glossary-expansion-batch-design.md`
- House-style glossary entry: `src/content/glossary/lemp-stack.md` (infrastructure), `src/content/glossary/fail2ban.md` (infrastructure, detailed), `src/content/glossary/item-response-theory.md` (psychometrics), `src/content/glossary/e-e-a-t.md` (seo). Read these before drafting.
- Writing voice: `~/.claude/projects/-Users-bajzel-GitHub-blazejmrozinski-com/memory/user_writing_voice_profile.md`. Operator-pragmatic. First-person where earned. No hype, no emoji, no "in today's fast-paced world."
- Existing slugs (do not collide): big-five-personality, classical-test-theory, confirmatory-factor-analysis, construct-validity, content-model, context-window, e-e-a-t, fail2ban, fastcgi-cache, indexnow, internal-linking, item-response-theory, knowledge-base-ai, lemp-stack, onet, opcache, php-fpm, psychometric-assessment, redis-object-cache, specification-driven-development, ssl-tls-certificate, static-site-generator, structural-equation-modeling, structured-data-json-ld, vps

## Writing conventions (apply to all 11 entries)

- **Frontmatter:** `status: draft` initially. `date: 2026-04-17`. Internal `/glossary/<slug>/` link targets end with `/`.
- **Body length:** 500-900 words.
- **Structure:** 1-paragraph lead (plain definition, no jargon) → 3-5 H2 sections → close with one inline link to a parent blog post.
- **Inline links:** At least 2 outbound `/glossary/<slug>/` links to related terms (existing or new). At least 1 link to a parent blog post.
- **No images, no code blocks unless the term needs them** (e.g. `cron` and `ufw` benefit from a few command examples; `switching-cost` does not).
- **Voice check before committing:** re-read each entry asking: would Blazej say this? Cut hype, cut "in today's world", cut anything performative.

---

### Task 1: Pre-flight verification

**Files:** none modified.

- [ ] **Step 1: Confirm working directory and branch**

Run:
```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com && git status --short && git branch --show-current
```
Expected: branch `main`, clean or only pre-existing modified files (CHANGELOG.md, ThemeScript.astro, ThemeToggle.astro).

- [ ] **Step 2: Confirm dev build is green before changes**

Run:
```bash
npm run build
```
Expected: build succeeds with no content-collection errors. If it fails, fix before proceeding — drafts will just add noise to existing failure.

- [ ] **Step 3: Confirm ContentForge SEO output directory exists**

Run:
```bash
ls ~/GitHub/contentforge/seo/ | head -5
```
Expected: directory exists. We'll drop the audit file here later. No file required yet.

---

### Task 2: Draft infrastructure cluster (5 entries)

**Files (all create):**
- `src/content/glossary/cache-warming.md`
- `src/content/glossary/transient-cleanup.md`
- `src/content/glossary/cron.md`
- `src/content/glossary/ufw.md`
- `src/content/glossary/watchdog-monitoring.md`

- [ ] **Step 1: Write `cache-warming.md`**

Frontmatter:
```yaml
---
term: "Cache Warming"
seoTitle: "What Is Cache Warming? Pre-Populating Caches Before Traffic"
description: "Cache warming pre-populates caches after a flush so the first visitor hits a warm cache, not a cold server. Learn why it matters and how to automate it on WordPress."
definition: "Cache warming is the practice of pre-populating a cache with data before live traffic arrives, so the first request after a cache flush hits a warm cache rather than triggering an expensive cold rebuild."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-06-automating-the-boring-parts"
  - "blog/wp-infra-04-four-layers-of-caching"
relatedTerms:
  - "fastcgi-cache"
  - "redis-object-cache"
  - "opcache"
  - "transient-cleanup"
  - "cron"
status: draft
date: 2026-04-17
---
```

H2 outline:
1. Why caches need warming (cold-start tax after flush / deploy)
2. What warming actually does (HTTP crawl of sitemap URLs, DB query pre-heat for Redis, OPcache preload)
3. Automating it (curl over sitemap in a cron job, typical 2-5 min)
4. When it matters vs when it doesn't (high-traffic sites, post-deploy, plugin updates)

Inline links: `/glossary/fastcgi-cache/`, `/glossary/redis-object-cache/`, `/glossary/opcache/`, `/glossary/cron/`, close with `/blog/wp-infra-06-automating-the-boring-parts`.

- [ ] **Step 2: Write `transient-cleanup.md`**

Frontmatter:
```yaml
---
term: "Transient Cleanup"
seoTitle: "What Are WordPress Transients and How to Clean Them Up"
description: "WordPress transients are short-lived cached values stored in the options table. Learn how orphaned transients accumulate, why they slow the database, and how to clean them on a schedule."
definition: "Transient cleanup is the periodic removal of expired and orphaned WordPress transients — short-lived cached values stored in the wp_options table that persist past their expiry and bloat the database."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-06-automating-the-boring-parts"
  - "blog/wp-infra-04-four-layers-of-caching"
relatedTerms:
  - "redis-object-cache"
  - "cache-warming"
  - "cron"
status: draft
date: 2026-04-17
---
```

H2 outline:
1. What transients are (get_transient / set_transient, with or without Redis)
2. Why they leak (plugins storing then orphaning, WP not guaranteeing cleanup, autoload flag trap)
3. How to detect bloat (wp_options row count, autoloaded size query)
4. Cleanup patterns (WP-CLI `transient delete --expired`, scheduled cron, WordPress vs Redis-backed behavior)

Inline links: `/glossary/redis-object-cache/`, `/glossary/cache-warming/`, `/glossary/cron/`, close with `/blog/wp-infra-06-automating-the-boring-parts`.

- [ ] **Step 3: Write `cron.md`**

Frontmatter:
```yaml
---
term: "Cron"
seoTitle: "What Is Cron? Scheduled Jobs on Linux Explained"
description: "Cron is the Linux scheduler for recurring jobs — backups, cache warming, healthchecks, cleanups. Learn crontab syntax, where jobs log, and why WP-Cron is different."
definition: "Cron is the time-based job scheduler built into Unix-like operating systems, used to run scripts or commands on a recurring schedule defined in a crontab file."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-06-automating-the-boring-parts"
  - "blog/wp-infra-07-watching-over-it-all"
relatedTerms:
  - "vps"
  - "lemp-stack"
  - "cache-warming"
  - "transient-cleanup"
  - "watchdog-monitoring"
status: draft
date: 2026-04-17
---
```

H2 outline:
1. How cron works (cron daemon, per-user crontabs, root crontab, system cron dirs)
2. Crontab syntax (five-field minute/hour/day/month/weekday, with one worked example)
3. Where cron output goes (MAILTO, redirect to log, logrotate integration)
4. WP-Cron vs system cron (why disabling WP-Cron and calling `wp cron event run --due-now` from system cron is the production pattern)
5. Typical jobs on a WP server (backups, certbot renew, cache warm, transient cleanup, healthchecks)

Inline links: `/glossary/vps/`, `/glossary/lemp-stack/`, `/glossary/cache-warming/`, `/glossary/watchdog-monitoring/`, close with `/blog/wp-infra-06-automating-the-boring-parts`.

- [ ] **Step 4: Write `ufw.md`**

Frontmatter:
```yaml
---
term: "UFW (Uncomplicated Firewall)"
seoTitle: "What Is UFW? Uncomplicated Firewall on Linux Explained"
description: "UFW is a friendly front-end to iptables/nftables for managing Linux firewall rules. Learn default policies, common commands, and how UFW integrates with Fail2ban on WordPress servers."
definition: "UFW (Uncomplicated Firewall) is a user-friendly command-line front-end to Linux's iptables or nftables firewall, designed to make common firewall tasks simple without hiding the underlying ruleset."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-05-locking-it-down"
relatedTerms:
  - "fail2ban"
  - "vps"
  - "lemp-stack"
  - "ssl-tls-certificate"
status: draft
date: 2026-04-17
---
```

H2 outline:
1. What UFW sits on top of (iptables/nftables — UFW doesn't replace the kernel firewall, it generates the rules)
2. Default deny-incoming / allow-outgoing posture on a fresh server
3. Common commands (`ufw allow`, `ufw status numbered`, `ufw delete <n>`)
4. UFW + Fail2ban integration (which backend to configure so bans end up in UFW's ruleset)
5. Typical ruleset for a WordPress VPS (allow 22, 80, 443, deny rest)

Inline links: `/glossary/fail2ban/`, `/glossary/vps/`, `/glossary/lemp-stack/`, close with `/blog/wp-infra-05-locking-it-down`.

- [ ] **Step 5: Write `watchdog-monitoring.md`**

Frontmatter:
```yaml
---
term: "Watchdog Monitoring"
seoTitle: "What Is Watchdog Monitoring? External Health Checks Explained"
description: "Watchdog monitoring runs health checks from a separate machine, so it still works when the primary server has locked up. Learn the pattern, tradeoffs, and a minimal Telegram-alert setup."
definition: "Watchdog monitoring is the practice of running health checks from an external machine, independent of the server being monitored, so total outages are detected even when the primary host cannot report its own state."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-07-watching-over-it-all"
relatedTerms:
  - "vps"
  - "cron"
  - "fail2ban"
status: draft
date: 2026-04-17
---
```

H2 outline:
1. Why internal healthchecks aren't enough (a kernel panic cannot alert about itself)
2. The watchdog pattern (separate cheap VPS, HTTP pings, SSH probes on a longer cadence, alert fan-out)
3. Alert channels (Telegram bot, email, paging — tradeoffs on latency vs fatigue)
4. Keeping the watchdog cheap and boring (no dependency on the thing it watches, minimal surface area, cron + curl + a small script)

Inline links: `/glossary/vps/`, `/glossary/cron/`, `/glossary/fail2ban/`, close with `/blog/wp-infra-07-watching-over-it-all`.

- [ ] **Step 6: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds. Schema errors here will name the offending file and field — fix frontmatter, re-run.

- [ ] **Step 7: Commit**

```bash
git add src/content/glossary/cache-warming.md src/content/glossary/transient-cleanup.md src/content/glossary/cron.md src/content/glossary/ufw.md src/content/glossary/watchdog-monitoring.md
git commit -m "$(cat <<'EOF'
feat: draft infrastructure glossary entries (cache-warming, transient-cleanup, cron, ufw, watchdog-monitoring)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Draft psychometrics cluster (4 entries)

**Files (all create):**
- `src/content/glossary/cronbach-alpha.md`
- `src/content/glossary/item-discrimination.md`
- `src/content/glossary/distractor-analysis.md`
- `src/content/glossary/wright-map.md`

- [ ] **Step 1: Write `cronbach-alpha.md`**

Frontmatter:
```yaml
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
```

H2 outline:
1. What alpha actually measures (internal consistency, not test-retest, not validity)
2. Rough interpretation bands (.70 / .80 / .90 — and why rigid cutoffs are a mistake)
3. What inflates alpha misleadingly (too many items, multi-dimensional scales, redundant items)
4. When alpha is the wrong tool (heterogeneous constructs, small item counts, IRT contexts where omega or marginal reliability fit better)

Inline links: `/glossary/classical-test-theory/`, `/glossary/construct-validity/`, `/glossary/item-discrimination/`, close with `/blog/psychometric-analysis-university-exams`.

- [ ] **Step 2: Write `item-discrimination.md`**

Frontmatter:
```yaml
---
term: "Item Discrimination"
seoTitle: "What Is Item Discrimination? Test Quality Statistic Explained"
description: "Item discrimination measures how well a single test item separates high from low scorers. Learn the point-biserial statistic, why negative values are alarming, and how to fix bad items."
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
```

H2 outline:
1. Definition and the point-biserial computation (item score vs total score correlation)
2. Interpretation (>.30 good, .20-.30 marginal, <.20 suspect, <0 broken — with one worked example)
3. Why negative discrimination happens (scoring key error, miskeyed correct answer, ambiguous stem)
4. Using discrimination alongside difficulty (the 2x2 quality map — easy-low-discrim vs hard-low-discrim failure modes)

Inline links: `/glossary/classical-test-theory/`, `/glossary/cronbach-alpha/`, `/glossary/distractor-analysis/`, close with `/blog/psychometric-analysis-university-exams`.

- [ ] **Step 3: Write `distractor-analysis.md`**

Frontmatter:
```yaml
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
```

H2 outline:
1. Why distractors matter (a 4-option item with one obvious wrong answer is effectively a 3-option item)
2. Dead distractors (<2% selection rate — and the easy fix: replace or reduce option count)
3. High-ability students picking a distractor (red flag — usually a defensible alternate answer or ambiguity in the stem)
4. Distractor analysis as the cheapest improvement lever for existing item banks

Inline links: `/glossary/item-discrimination/`, `/glossary/classical-test-theory/`, `/glossary/psychometric-assessment/`, close with `/blog/psychometric-analysis-university-exams`.

- [ ] **Step 4: Write `wright-map.md`**

Frontmatter:
```yaml
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
```

H2 outline:
1. What a Wright map shows (two panels, same vertical axis in logits — persons on one side, items on the other)
2. Reading the map (where clusters of persons sit relative to item difficulty, ceiling and floor effects made visible)
3. What a healthy vs broken map looks like (spread of items matching spread of persons vs items all clustered easy or hard)
4. Why this is the most informative single diagnostic to show a test author

Inline links: `/glossary/item-response-theory/`, `/glossary/item-discrimination/`, `/glossary/classical-test-theory/`, close with `/blog/psychometric-analysis-university-exams`.

- [ ] **Step 5: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/content/glossary/cronbach-alpha.md src/content/glossary/item-discrimination.md src/content/glossary/distractor-analysis.md src/content/glossary/wright-map.md
git commit -m "$(cat <<'EOF'
feat: draft psychometrics glossary entries (cronbach-alpha, item-discrimination, distractor-analysis, wright-map)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Draft product cluster (2 entries)

**Files (all create):**
- `src/content/glossary/switching-cost.md`
- `src/content/glossary/outcome-based-pricing.md`

- [ ] **Step 1: Write `switching-cost.md`**

Frontmatter:
```yaml
---
term: "Switching Cost"
seoTitle: "What Is Switching Cost? The Moat That Actually Holds SaaS Together"
description: "Switching cost is the time, effort, and risk a customer takes on to replace one tool with another. Learn why it's the real SaaS moat and why 'AI makes code cheap' misses the point."
definition: "Switching cost is the total economic, operational, and cognitive effort required for a customer to replace one product or service with another, including data migration, retraining, integration rework, and risk of disruption."
domain: "product"
relatedContent:
  - "blog/saas-is-dead-narrative"
relatedTerms:
  - "outcome-based-pricing"
status: draft
date: 2026-04-17
---
```

H2 outline:
1. Why switching cost is the real SaaS moat (not features, not even UX — the thing that stops customers leaving when a cheaper tool appears)
2. Components of switching cost (data, integrations, workflow embedding, trained staff, audit trail, political capital)
3. Why "AI makes software cheap to build" doesn't dissolve switching cost (new entrants still face everyone else's embedded tools, not a greenfield market)
4. Strategic implications (incumbents defend via deeper integration; challengers win by attacking segments where switching cost is still low)

Inline links: `/glossary/outcome-based-pricing/`, close with `/blog/saas-is-dead-narrative`.

- [ ] **Step 2: Write `outcome-based-pricing.md`**

Frontmatter:
```yaml
---
term: "Outcome-Based Pricing"
seoTitle: "What Is Outcome-Based Pricing? The Post-Seat SaaS Pricing Model"
description: "Outcome-based pricing charges for measurable results — deals closed, tickets resolved, dollars saved — instead of per-seat subscriptions. Learn why AI is pushing SaaS toward it."
definition: "Outcome-based pricing is a SaaS pricing model in which customers pay based on measurable business results delivered by the product, such as transactions completed or time saved, rather than on headcount, usage volume, or feature tier."
domain: "product"
relatedContent:
  - "blog/saas-is-dead-narrative"
relatedTerms:
  - "switching-cost"
status: draft
date: 2026-04-17
---
```

H2 outline:
1. The shift away from per-seat (seats imply human users; AI agents don't map to seats cleanly)
2. What counts as an outcome (deals closed, tickets resolved, dollars recovered — requires attribution the vendor can prove)
3. Why outcome pricing is hard in practice (measurement, disputes, vendor revenue unpredictability, customer accounting)
4. Where outcome pricing is landing first (sales, support, collections — categories where outcomes are numerically legible)

Inline links: `/glossary/switching-cost/`, close with `/blog/saas-is-dead-narrative`.

- [ ] **Step 3: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/content/glossary/switching-cost.md src/content/glossary/outcome-based-pricing.md
git commit -m "$(cat <<'EOF'
feat: draft product glossary entries (switching-cost, outcome-based-pricing)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Preview and local verification

**Files:** none modified.

- [ ] **Step 1: Start preview server**

Run:
```bash
npm run build && npm run preview
```
Expected: preview server starts, typically at http://localhost:4321.

- [ ] **Step 2: Spot-check 3 representative pages**

Visit in a browser:
- `http://localhost:4321/glossary/cache-warming/`
- `http://localhost:4321/glossary/cronbach-alpha/`
- `http://localhost:4321/glossary/switching-cost/`

Expected: all three render. Body is 500-900 words. Related-terms and related-content sections show the links specified in frontmatter. No broken internal links.

- [ ] **Step 3: Check sitemap**

Visit `http://localhost:4321/sitemap-glossary.xml`.

Expected: XML includes all 11 new slugs (cache-warming, transient-cleanup, cron, ufw, watchdog-monitoring, cronbach-alpha, item-discrimination, distractor-analysis, wright-map, switching-cost, outcome-based-pricing) alongside existing 25.

Note: If the sitemap filters by `status: published`, the 11 new drafts will NOT yet appear — that's expected at this stage. Re-verify after Task 8.

- [ ] **Step 4: Stop preview server** (Ctrl-C)

- [ ] **Step 5: Push draft batch to origin**

```bash
git push origin main
```
Expected: push succeeds. Cloudflare Pages will deploy the drafts, but since `status: draft` entries are typically excluded from the public index and sitemap, the effect is negligible — they exist on the site only if you know the slug. Confirm this matches existing glossary behavior (check `src/pages/glossary/index.astro` and `src/pages/sitemap-glossary.xml.ts` for status filtering).

---

### Task 6: [HUMAN CHECKPOINT] ContentForge Ahrefs audit

This task does not run in this repo. Pause execution here and hand off to ContentForge.

**What to do (in the ContentForge repo / session):**
- For each of the 11 slugs, run `keywords-explorer-overview` with the most natural-phrasing primary keyword:
  - cache-warming → "cache warming" / "wordpress cache warming"
  - transient-cleanup → "wordpress transients"
  - cron → "linux cron" / "crontab"
  - ufw → "ufw firewall" / "uncomplicated firewall"
  - watchdog-monitoring → "watchdog monitoring" / "external health check"
  - cronbach-alpha → "cronbach's alpha"
  - item-discrimination → "item discrimination" / "point biserial"
  - distractor-analysis → "distractor analysis"
  - wright-map → "wright map"
  - switching-cost → "switching cost"
  - outcome-based-pricing → "outcome based pricing"
- Where overview's related-terms list is thin, follow up with `keywords-explorer-related-terms`.
- Write the results to `~/GitHub/contentforge/seo/glossary-audit-2026-04-17.md` with per-slug sections containing: primary keyword, volume, difficulty, top 3 related terms, one-line SERP observation, and (if applicable) a note when the term is zero-volume / topical-only.

- [ ] **Step 1: Confirm audit file exists before proceeding**

Run:
```bash
ls -la ~/GitHub/contentforge/seo/glossary-audit-2026-04-17.md && wc -l ~/GitHub/contentforge/seo/glossary-audit-2026-04-17.md
```
Expected: file exists, >50 lines. If absent, stop — the audit hasn't been run yet.

---

### Task 7: Apply audit revisions

**Files (modify, all 11):**
- `src/content/glossary/cache-warming.md`
- `src/content/glossary/transient-cleanup.md`
- `src/content/glossary/cron.md`
- `src/content/glossary/ufw.md`
- `src/content/glossary/watchdog-monitoring.md`
- `src/content/glossary/cronbach-alpha.md`
- `src/content/glossary/item-discrimination.md`
- `src/content/glossary/distractor-analysis.md`
- `src/content/glossary/wright-map.md`
- `src/content/glossary/switching-cost.md`
- `src/content/glossary/outcome-based-pricing.md`

- [ ] **Step 1: Read the audit file**

Run:
```bash
cat ~/GitHub/contentforge/seo/glossary-audit-2026-04-17.md
```

- [ ] **Step 2: For each entry, revise frontmatter against audit data**

For each of the 11 entries, update in the frontmatter:

- `seoTitle`: prefer the phrasing that matches the primary-keyword entry in the audit (typically "What Is [primary KW]?" format). Keep under 60 characters where possible.
- `description`: rewrite to 150-160 characters, leading with the primary keyword. Include one related keyword from the audit's related-terms cluster. Must read naturally — don't keyword-stuff.
- `relatedTerms`: cross-check against the audit's related-terms cluster. Add any terms we already have in the glossary that the audit surfaced as related; remove any in the draft that the audit suggests are unrelated.

Body revisions:
- If the audit identifies a common sub-query (e.g. "how is cronbach's alpha calculated"), adjust an H2 heading to match that question form where it doesn't force the prose.
- For zero-volume / topical-only terms (the spec predicts this for `wright-map` and possibly `distractor-analysis`): keep the draft frontmatter as-is. Add a sentence to the body that naturally links to the parent blog post for that context — don't manufacture keyword density.

- [ ] **Step 3: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/content/glossary/*.md
git commit -m "$(cat <<'EOF'
feat: optimize glossary batch per Ahrefs audit

Applied per-term revisions from contentforge/seo/glossary-audit-2026-04-17.md:
seoTitle, description, and relatedTerms aligned to audit data.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Flip to published, update CHANGELOG, ship

**Files:**
- Modify: all 11 glossary files (`status: draft` → `status: published`)
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Flip status on all 11 entries**

For each of the 11 files, change the `status:` line in frontmatter from `draft` to `published`. The `date:` field stays at `2026-04-17`.

- [ ] **Step 2: Update CHANGELOG.md**

Read the current CHANGELOG first to match its format (likely Keep-a-Changelog style). Add an entry under an Unreleased or date-stamped section:

```markdown
### Added
- 11 new glossary entries derived from the 10 newest blog posts: cache-warming, transient-cleanup, cron, ufw, watchdog-monitoring (infrastructure); cronbach-alpha, item-discrimination, distractor-analysis, wright-map (psychometrics); switching-cost, outcome-based-pricing (product). SEO metadata optimized from Ahrefs audit in contentforge/seo/glossary-audit-2026-04-17.md.
```

- [ ] **Step 3: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Start preview and re-verify sitemap**

Run:
```bash
npm run preview
```

Visit `http://localhost:4321/sitemap-glossary.xml`. Expected: all 11 new slugs now appear.

Visit `http://localhost:4321/glossary/` index. Expected: all 11 new entries listed alongside the existing 25.

Stop preview (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
git add src/content/glossary/*.md CHANGELOG.md
git commit -m "$(cat <<'EOF'
feat: publish glossary expansion batch (11 entries)

Flips 11 entries from draft to published. Updates CHANGELOG.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Push**

```bash
git push origin main
```
Expected: push succeeds. Cloudflare Pages deploys automatically.

- [ ] **Step 7: Post-deploy verification**

Wait ~2 minutes for Cloudflare Pages to deploy. Then spot-check:
- `https://blazejmrozinski.com/glossary/cache-warming/` → 200
- `https://blazejmrozinski.com/glossary/wright-map/` → 200
- `https://blazejmrozinski.com/glossary/switching-cost/` → 200
- `https://blazejmrozinski.com/sitemap-glossary.xml` → contains all 11 slugs

If any URL 404s, check the CF Pages deploy log for build errors.

---

## Done criteria

- 11 new URLs live at `/glossary/<slug>/`
- `sitemap-glossary.xml` contains all 11
- CHANGELOG.md has the entry
- No broken internal links introduced (an entry linking to `/glossary/foo/` that doesn't exist would fail the build anyway, but spot-check the parent-blog-post links during preview)
- Audit file `contentforge/seo/glossary-audit-2026-04-17.md` exists and is referenced in commit history
