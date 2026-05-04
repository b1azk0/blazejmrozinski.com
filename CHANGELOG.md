# Changelog

All notable changes to blazejmrozinski.com are documented here.

## [0.14.0] — 2026-05-04 — Pagefind static search + sitewide SearchAction

### Added
- **`/search` route** powered by Pagefind v1.x default UI, themed via CSS variables to match the site's palette and font stack. Reads `?q=` query param so deep-linking to a search query works. View-transitions-aware (mounts via `astro:page-load`); `noindex, nofollow`.
- **Sitewide `SearchAction`** in the WebSite JSON-LD (`getWebSiteNode()` → `potentialAction`). Required for Google to consider showing a sitelinks search box on brand SERP. URL template: `https://www.blazejmrozinski.com/search?q={search_term_string}`.
- **`data-pagefind-body` opt-in** on content layouts: BlogPost, glossary terms, companies, projects, publications, about, cv. Each result carries `data-pagefind-meta` `kind:<type>` and (on blog posts) `date:<iso>` for future relevance/sort use. 76 documents indexed at this site size.
- **`data-pagefind-ignore`** on Header, Footer, Breadcrumb, YearFilter, SeriesNav, RelatedPosts, the BlogPost "Filed under" line, the CV "Download PDF" anchor, and the work-page relatedProjects section so search snippets aren't polluted with chrome.
- **Footer "Search" link** between Glossary and About in the pages nav.
- **Build-artifact verification harness** (`scripts/pagefind-check.test.mjs`, `npm run pagefind:check`): 13 assertions covering bundle ship, sitewide SearchAction, opt-in coverage, listing exclusion, chrome ignore markers, `/search` well-formedness, robots disallow, sitemap exclusion, and footer link presence.

### Changed
- **`postbuild` script** now runs `pagefind --site dist` before the existing IndexNow ping. CF Pages publishes `dist/pagefind/` alongside the site; no CDN change needed.
- **`robots.txt`** adds `Disallow: /pagefind/` so the Pagefind bundle assets aren't crawled as if they were content. `/search` itself is allowed to be crawled but is `noindex` at the page level.

### Why
- The Tier 1 entity graph (v0.12.0) declared `WebSite` sitewide but had no `potentialAction` — Google can't surface a sitelinks search box without a real, working search URL. Pagefind is the smallest path to a legitimate `/search?q=` that lets the action count.
- Listing pages (`/blog`, topic hubs, series landings, work index, projects index) and the photography gallery are deliberately not indexed: they're navigation, not search destinations. A reader searching "wordpress" should land on a post, not on a hub. PL routes excluded for now and will get a separate per-locale index when i18n unpauses.
- Bundle scope: Pagefind UI loads only on `/search`. Sitewide JS would add ~120 KB to every page on a site whose Lighthouse audit (2026-05-04, see `docs/backlog.md`) just put LCP into the "Needs Improvement" band. Keeping the bundle off long-form pages preserves headroom for the perf fixes coming next.

### Lighthouse (mobile, simulated 4G + 4× CPU)

| Page | Perf | A11y | BP | SEO | LCP |
|------|------|------|----|----|-----|
| `/` | 100 | 96 | 96 | 100 | 1653ms |
| `/search` | 99 | 96 | 96 | 69 | 1953ms |

## [0.13.0] — 2026-04-29 — SEO Tier 2: content architecture (topic hubs, series nav, related posts)

### Added
- **Controlled topic vocabulary** at `src/data/topics.yml` — slugs map to title + description; drives hub pages and JSON-LD.
- **Topic hub pages** at `/blog/topic/` (index) and `/blog/topic/[slug]/` (per-topic), each with `CollectionPage` JSON-LD and an `ItemList` of member posts. Replaces the previous client-side `?tag=` filter on `/blog`.
- **Series taxonomy** — frontmatter `series: <slug>` + `seriesIndex: <int>` (1-based, contiguous within a series). Series metadata at `src/data/series.yml`.
- **Series landing pages** at `/blog/series/[slug]/` with `CreativeWorkSeries` + `hasPart` JSON-LD listing parts in order.
- **`SeriesNav` component** — renders a "Part N of M" banner at the top of every series post and a prev/next + collapsed all-parts TOC at the bottom. Replaces the hand-maintained "Full Series" footer block on WP Infra posts.
- **`RelatedPosts` component** — 3-card "Related reading" block at the bottom of every non-series post. Algorithm: topic-overlap → same-label tiebreak → date desc, with same-label fallback when topic-overlap is zero.
- **"Filed under" line** near the byline of every post that has at least one topic, linking each topic to its hub.
- **Build-time taxonomy validator** (`src/integrations/validate-taxonomy.ts`) — fails the build if any post references an undefined topic/series, if `seriesIndex` values are duplicated or non-contiguous within a series, or if `topics.yml` contains an orphan slug with zero published posts.
- **Sitemap entries** for `/blog/topic/` index, every topic hub, every series landing.
- **Article JSON-LD additions:** `about` array (one `Thing` per topic) and `isPartOf` (`CreativeWorkSeries`) when applicable.

### Changed
- **`PostCard` tag chips** now render as plain `<span>` unless the tag value matches a topic slug, in which case they link to the topic hub. Style unchanged.
- **`/blog`** drops the client-side `?tag=` filter behavior. A new client-side handler maps `?tag=foo` → `/blog/topic/foo/` if the tag is a topic, otherwise strips the param. The `?label=` filter is unchanged.
- **`BlogPost.astro` header** no longer renders the tag chips row — tags live on `/blog` cards only.

### Removed
- **WP Infra "Full Series" footer link block** on Posts 1–7. SeriesNav is now the source of truth.

### Why
- **Crawlable pillar pages.** Free-form `?tag=` filters were unreliable for crawlers and accumulated no link equity. Static topic hubs become real URLs that compound authority for the topical clusters this site is trying to rank on (WordPress infrastructure, psychometrics, AI workflows, SEO).
- **Explicit series signals.** WP Infra and Talent Archetypes are the two multi-part bodies of work on this site. Hand-maintained TOC blocks were fragile (already burned us once at v0.11.13). Auto-rendered SeriesNav pulls from frontmatter — single source of truth, validates at build time, never drifts.
- **Deeper internal linking.** RelatedPosts on every non-series post deepens crawl, lifts dwell time, and reduces orphan posts. Topic-overlap algorithm uses the controlled axis we just defined; no risk of clustering on noisy free-form tags.

## [0.12.0] — 2026-04-28 — SEO: Tier 1 entity graph (sitewide WebSite + Person, ProfilePage, dateModified, ScholarlyArticle linking)

### Added
- **`src/lib/jsonld.ts`** — canonical JSON-LD identifiers (`PERSON_ID`, `WEBSITE_ID`, `ABOUT_PAGE_ID`) and node builders (`getPersonNode`, `getWebSiteNode`, `getSiteGraph`). All cross-page schemas now reference the canonical Person and WebSite entities by `@id`, so Google merges them into a single graph instead of treating each page's Person block as a separate entity.
- **Sitewide `@graph` from `Base.astro`** — every page now emits one `<script type="application/ld+json">` with `WebSite` + `Person` (including `worksFor` populated from the `companies` collection, `alumniOf`, `hasCredential`, `knowsAbout`, `sameAs`, `image`, `mainEntityOfPage`).
- **`ProfilePage` schema on `/about`** — replaces the previous standalone Person. `ProfilePage` has `@id` `${SITE_URL}/about/#profile`, `mainEntity: { @id: PERSON_ID }`. Targets Google's dedicated ProfilePage SERP treatment for personal-brand sites.
- **`lastmod` field on blog frontmatter** — optional `z.coerce.date()` in `content.config.ts`. Used in `BlogPost.astro` Article JSON-LD as `dateModified` and in `sitemap-blog.xml.ts` as `<lastmod>` (falls back to `date` when absent). Bumping `lastmod` on edits now produces a fresh-content signal without changing the published date.

### Changed
- **`BlogPost.astro` Article JSON-LD**: `author` and `publisher` are now `{ @id: PERSON_ID }` references instead of inline Person duplicates. When a post's frontmatter `author` differs from "Blazej Mrozinski", an inline `Person` is emitted as a fallback. `dateModified` now distinct from `datePublished`.
- **`publications.astro` ScholarlyArticle JSON-LD**: consolidated the previous N standalone `ScholarlyArticle` blocks into a single `CollectionPage` with an `ItemList` of `ScholarlyArticle`/`Chapter` nodes. Mrozinski-led publications now link `author` to the canonical Person `@id`. Each entry adds DOI as `identifier` (PropertyValue), `volumeNumber`/`issueNumber` parsed from the volume string, `pageStart`/`pageEnd`/`pagination`, and `encoding` (PDF MediaObject) where available.
- **`index.astro`**: removed local `WebSite` and `Person` JSON-LD blocks (now emitted sitewide from Base, populated with the same `companies`-derived `worksFor`).

### Why
- **Entity unification.** Previously, the homepage emitted a basic Person (with `worksFor`) and `/about` emitted a richer Person (with `alumniOf`, `hasCredential`, `knowsAbout`, `sameAs`) — both anonymous, no shared identifier. Search engines treated them as two separate entities. With a stable `@id` and a sitewide canonical Person, every page contributes signal to the same Knowledge-Graph candidate.
- **Article author authority.** Blog post `author` blocks were inline duplicates with only `name` and `url`, missing the credentials and academic profile. Linking by `@id` lets Google associate every published article with the full Person entity (PhD, ORCID, Scholar, peer-reviewed publications) — direct E-E-A-T signal for Helpful Content rankings.
- **Publication-record E-E-A-T moat.** The `publications.yml` record is one of the strongest authority signals on the site (15+ peer-reviewed papers across JPSP, Frontiers, etc.). Wrapping it in a single `CollectionPage` → `ItemList` of properly-typed `ScholarlyArticle` nodes (with DOI identifiers and Person `@id` linking) connects the academic record directly to the canonical Person and to the brand.
- **Freshness signals.** Setting `dateModified == datePublished` gave every post a static signal. The new `lastmod` field lets edits bump the freshness timestamp without rewriting publish dates, matching Google's preferred pattern for evergreen content updates.

## [0.11.13] — 2026-04-27 — Fix: WP Infra series footer links on Posts 1-5

### Fixed
- Series footer on Posts 1 through 5 of the "WordPress Infrastructure from Scratch" series had `*(stay tuned)*` placeholder lines for items 6 and 7. The placeholders were left in when those posts were drafted before Parts 6 and 7 existed, and never updated when those parts shipped. Replaced both placeholder lines with proper `[Title](/blog/wp-infra-0N-slug)` links on all five posts. Each post's footer now lists all seven parts with the current post bolded as `(you are here)` and the other six as live links.
- Affected files: `wp-infra-01-why-i-ditched-managed-hosting.md`, `wp-infra-02-building-the-lemp-stack.md`, `wp-infra-03-deploying-wordpress.md`, `wp-infra-04-four-layers-of-caching.md`, `wp-infra-05-locking-it-down.md`. Posts 6 and 7 were already correct.

## [0.11.12] — 2026-04-27 — Blog: Talent Archetypes 3-post series (scheduled 2026-04-30, 2026-05-02, 2026-05-04)

### Added
- Three-part series sourced from two internal client deliverables (psychometric work for an enterprise IT services firm and a consumer-tech company), staggered across two weeks. The daily Cloudflare rebuild cron picks each post up at the UTC threshold of its frontmatter date.
  - **2026-04-30**, lead post: "Four Workplace Personality Types Recovered Across Two Custom Psychometric Studies." Cluster analysis convergence across two completely different instruments produced the same four-archetype talent structure. The cluster-by-role distribution table is the most actionable artifact in the engagements and drives an L&D budget allocation model that's different from the standard role-by-role model. 4 charts (archetype card grid, score profiles small multiples, two cluster-by-role heatmaps).
  - **2026-05-02**, second post: "Why HiPo Programs Should Measure More Than Tenure: Years of Experience Predicts Two Psychometric Traits." Two SEM models converged on the same finding: years of professional experience predict exactly two traits in each study (a curiosity-family trait and a self-efficacy/ownership-family trait), with the others remaining experience-independent. Implications for high-potential program design and L&D investment. 2 charts (two-panel SEM path diagram, sorted β coefficient bar chart).
  - **2026-05-04**, third post: "Custom Psychometric Instrument or Off-the-Shelf? The Build-vs-Buy Decision." The methodology counterpart. A decision rule for when to build a custom instrument versus license an off-the-shelf one, with the two client engagements serving as worked examples. 2 charts (decision flowchart, cost-over-decision-volume curves).
- All three posts labelled `research`. All three flagged `safety_review: true` in source until publish; clients are abstracted as Org A and Org B in the post body, with brand-specific value names from Org B translated to standard psychometric construct labels (Resilience, Growth Mindset, Bias for Action, Ownership, Trust-Building).
- Internal cross-links: each post forward and backward references the others; all three reference the published [employee-engagement post](/blog/measure-employee-engagement-custom-psychometric-work) for methodology context.
- Glossary cross-links to construct-definition, discriminant-validity, ceiling-effect, forced-choice-assessment, structural-equation-modeling, and psychometric-assessment.
- Charts produced via `scripts/make-talent-archetypes-charts.py` in ContentForge using the same matplotlib pipeline as the engagement post charts.

### SEO
- Combined Ahrefs research across all three posts (1,333 units): primary keywords "personality types in the workplace" (Post 1, vol 100, KD 5, TP 450), "hipo development" (Post 2, vol 100, KD 0, TP 250) and "high potential employee program" (Post 2 secondary, vol 70, KD 3, TP 200), and "personality assessment for hiring" (Post 3, vol 80, KD 7, TP 90). Post 1 also targets "employee development plan" (vol 1,700, KD 9, TP 1,400) as a secondary head term for the L&D allocation half of the post.
- The series occupies a niche topical space; head-term volume is small, and the high-volume adjacent keywords (e.g., "personality clusters" at 800 vol) have wrong intent (clinical psychology). Optimization is light: keyword in title and meta description, secondary terms in H2s where they fit naturally, no voice distortion.
- Full SEO research and rejected-candidate notes archived in ContentForge at `seo/2026-04-27-talent-archetypes-series.md`.

## [0.11.11] — 2026-04-27 — Glossary: 9-entry expansion sourced from recent posts

### Added
- 9 new glossary entries, all `domain: psychometrics` except restic which is `infrastructure`. Sourced from terms that appear in the newest blog posts (WP Infra 6/7 and the employee-engagement post) but were missing from the glossary, then filtered through Ahrefs keyword research:
  - `likert-scale` — flagship pick. 41,000 monthly searches US, KD 18, TP 16,000. Traffic bet of the batch.
  - `construct-definition` — 2,300 vol, KD 12. Central to the engagement post's argument.
  - `discriminant-validity` — 1,800 vol, KD 4. Uncontested SERP; should rank quickly.
  - `ceiling-effect` — 1,300 vol, KD 6. Explicit subject of the engagement post chart.
  - `restic` — 1,300 vol, KD 33. Only infra entry; central to WP Infra 6/7 backup architecture.
  - `gallup-q12` — 600 vol, KD 20, TP 14,000 (parent topic "q12" at vol 2,400). Highest TP-to-difficulty ratio in batch.
  - `ipsative-measurement` — 600 vol, KD 0. Supports the forced-choice cluster.
  - `situational-judgment-test` — 200 vol, KD 9 (parent vol 800).
  - `forced-choice-assessment` — 40 vol, KD 0, TP 500. Anchor for the response-format trade-off cluster.
- Combined monthly search volume across primary keywords: ~48,940. Average KD: ~12.

### Updated
- Forward links in 3 published blog posts now point to the new glossary entries: `measure-employee-engagement-custom-psychometric-work.md` (6 new internal links — Q12, construct-validity, Likert/forced-choice/situational-judgment, discriminant-validity, ceiling-effects, construct-definition), `wp-infra-06-automating-the-boring-parts.md` (1 link to restic), `wp-infra-07-watching-over-it-all.md` (1 link to restic).
- Reverse interlinks: existing glossary entries `psychometric-assessment.md`, `construct-validity.md`, `big-five-personality.md`, `classical-test-theory.md`, `cronbach-alpha.md`, and `cron.md` had their `relatedTerms` arrays extended to surface the new entries from related glossary pages.
- Wording fix in employee-engagement post: "discriminative validity" → "discriminant validity" (the formal psychometric term, matching the new glossary slug).

### SEO
- Research sourced from Ahrefs keywords-explorer-overview (~860 units across 20 candidate keywords). Full audit and rejected-candidate notes archived in ContentForge at `seo/glossary-audit-2026-04-27.md`.
- Rejected candidates with rationale: `employee engagement` (KD 61, brand-dominated SERP), `mariadb` (KD 79), `wp-cli` (KD 54), `rclone` (rclone.org owns SERP), `ttfb` / `time to first byte` (KD 42-46), `oom killer` (Linux-narrow), `action scheduler` (low volume), `healthcheck` (generic intent), `psychometric validation` (would dilute focus vs construct-validity).

## [0.11.10] — 2026-04-27 — Blog: WordPress Server Monitoring (WP Infra Part 7)

### Added
- New blog post: "WordPress Server Monitoring: Self-Healing Healthchecks, Status Dashboards, and Telegram Alerts" — final post in the 7-part WordPress Infrastructure from Scratch series. Three-layer monitoring architecture: (1) a self-healing cron healthcheck script that checks PHP-FPM, Nginx, fail2ban, MariaDB, Redis, disk, memory, and log sizes every 5 minutes and auto-restarts anything that's died; (2) an on-demand WordPress server status dashboard with a companion diagnostic/repair tool (`wp-status-fix`) that fixes common WordPress brokenness automatically; (3) an external Telegram bot on a separate server ("Watchdog") running a restricted SSH shell that watches uptime from the outside and sends alerts only when something actually needs attention. Also covers log analysis, resource planning for Hetzner tier upgrades, security and SEO audit scripts, WordPress disaster recovery from restic backups, and scaling across multiple servers. Closes with a series summary tying all 7 posts together. Labelled `infrastructure`.
- Scheduled for 2026-04-27 via frontmatter `date:`. The daily Cloudflare rebuild cron (v0.11.8) picks it up within minutes of the UTC threshold passing.
- Internal links: all 6 prior posts in the series (`/blog/wp-infra-01` through `/blog/wp-infra-06`) in the "Full Series" footer block.
- Outbound link: companion repository at `https://github.com/b1azk0/wordpress-infrastructure`.

### SEO
- Primary keyword: `server monitoring` (Ahrefs US: 1800 vol, KD 6, CPC $0.45). Biggest single-keyword opportunity in the entire WP infra series, KD 6 makes top-10 realistic.
- Secondary: `wordpress monitoring` (100 vol, KD 1, CPC $4.00), the highest-CPC keyword in the series with buyer-intent. `healthcheck script` and `telegram bot monitoring` covered as zero-volume but distinctive angles.
- H2 headings reworked during the 2026-04-15 Ahrefs pass to front-load keywords: "The Sleep Problem" → "Why WordPress Servers Need Monitoring", "Layer 1: Self-Healing Healthcheck" → "Self-Healing Healthcheck Script for WordPress Services", "The Diagnostic Companion" → "Automated WordPress Diagnostics and Repair Tool", "Layer 3: The Watchdog Telegram Bot" → "Telegram Bot for External WordPress Uptime Monitoring", and six more. Title rewritten from "Watching Over It All: Monitoring, Self-Healing, and Knowing When to Sleep" to the current keyword-leading form.

## [0.11.9] — 2026-04-26 — Blog: WordPress Backup Automation (WP Infra Part 6)

### Added
- New blog post: "WordPress Backup Automation: Nightly Backups, Database Cleanup, Cache Warming, and Plugin Sync" — Part 6 of the WordPress Infrastructure from Scratch series. Walks through the full nightly cron chain for production WordPress servers: automated per-site backups to cloud storage (WP-CLI exports plus file rsync, compressed and uploaded nightly), a MariaDB database optimization and cleanup script that prunes transients, expired options, spam comments, and Action Scheduler garbage, a cross-server plugin distribution system (cloud storage as the plugin registry, each server pulls the zips it needs), a five-phase cache warming routine that crawls the XML sitemap to prime FastCGI and Redis caches before first-visitor TTFB, and full server snapshots to cloud storage with restic. Closes with the morning-verification routine and how the log format is designed to be scannable in 30 seconds. Labelled `infrastructure`.
- Scheduled for 2026-04-26 via frontmatter `date:`. Visible on the live site within minutes of the 00:05 UTC rebuild cron after that date.
- Internal links: Parts 3 (`deploying-wordpress`), 4 (`four-layers-of-caching`), 5 (`locking-it-down`) linked inline in the "What's Next" section; full series TOC at the bottom links all 7 posts.
- Outbound link: companion repository at `https://github.com/b1azk0/wordpress-infrastructure` under the `06-automation/` directory.

### SEO
- Primary keyword: `restic backup` (Ahrefs US: 250 vol, KD 12, traffic potential 1100, CPC $3.50). The post is one of very few that combines restic with WordPress, the primary differentiator from generic WP-backup-plugin listicles.
- Secondary keyword touches: `wordpress automated backup`, `cron job`, `WordPress automation`, `cache warming`, `sitemap crawl`, `plugin distribution`, `WordPress database optimization`, all worked into H2s during the 2026-04-15 Ahrefs validation pass. H2s rewritten from their original creative names ("wp-backup: Site-Level Backups to Cloud Storage", "wp-maintain v3: The Database Cleanup Beast", "wp-plugin-sync: Cloud Storage as Plugin Distribution") to the keyword-leading forms now in the post.

## [0.11.8] — 2026-04-23 — Infra: scheduled Cloudflare Pages rebuild for future-dated posts

### Added
- `.github/workflows/scheduled-rebuild.yml` — GitHub Actions workflow that triggers a Cloudflare Pages deploy hook at 00:05 UTC daily. Rationale: the blog's `/blog` index and `[...slug]` route filter posts with `data.date <= new Date()`, so posts dated for a future day are filtered out of the build until that day. Without a scheduled rebuild, future-dated posts sit as "published but not visible" until the next manual push. The daily cron picks them up automatically within minutes of the UTC date threshold passing.
- Also exposes `workflow_dispatch` so manual rebuilds can be triggered from the Actions tab.
- One-time setup required: create a Cloudflare Pages deploy hook (Settings → Builds & deployments → Deploy hooks), copy the URL, add it as a GitHub repository secret named `CLOUDFLARE_PAGES_DEPLOY_HOOK`. Documented in the workflow header.

## [0.11.7] — 2026-04-24 — Blog: How to Measure Employee Engagement When Gallup's Numbers Don't Fit Your Org

### Added
- New blog post: "How to Measure Employee Engagement When Gallup's Numbers Don't Fit Your Org" — positioning piece anchored on the 22-vs-79 manager-engagement gap from Gallup's 2026 State of the Global Workplace report. Argues that population-level engagement statistics can describe a climate but cannot diagnose a specific organization, and that closing the gap requires custom psychometric assessment rather than another off-the-shelf survey. Walks through a four-component working definition of custom psychometric work (construct definition, instrument design, validation, feedback architecture) and presents three client engagements as receipts: LSEG (hiring at scale for the Gdynia shared service centre), EPAM (competency-mapped architecture across four talent-development programs), and gr8.tech (discriminative values measurement using combined forced-choice, ranking, and situational-judgment formats). Closes with a buyer-facing section on when to commission custom measurement and when not to. Labelled `research`.
- Three inline charts: (1) a bar chart of the Gallup 2026 22%-vs-79% manager-engagement gap (real data); (2) a two-panel histogram comparing Likert and forced-choice response distributions on the same values item, explicitly labelled as simulated with parameters shaped to match the ceiling-effect pattern documented in Cheung & Chan (2002) and Meade (2004); (3) a comparison of Gallup's 2015 70%-of-variance claim against the typical ICC(1) range for organizational work-attitude outcomes (10–30%) from Bliese (2000) and LeBreton & Senter (2008). Each chart carries full screen-reader alt text describing axes, values, annotations, and the takeaway.
- Three assets under `src/assets/blog/measure-employee-engagement-custom-psychometric-work/`: `gallup-manager-engagement-gap.png`, `ceiling-effects-likert-vs-forced-choice.png`, `between-team-variance-gallup-vs-literature.png`.
- Internal links from the post: `/work/gyfted`, `/blog/psychometric-analysis-university-exams/`, `/contact/`, plus glossary entries for psychometric-assessment, classical-test-theory, confirmatory-factor-analysis, item-response-theory, construct-validity, big-five-personality.
- Outbound links: the Gallup SOGW 2026 report hub, plus LSEG and EPAM case-study pages on gyfted.me (topical-authority signal).

### SEO
- Primary keyword: `measuring employee engagement` (Ahrefs US: 600 vol, KD 9, traffic potential 109K). Secondary: `how to measure employee engagement` (700 vol, KD 6), `psychometric assessment` (800 vol, KD 12).
- Title leads with the primary phrase. URL slug `measure-employee-engagement-custom-psychometric-work` includes both primary keyword and positioning phrase. Meta description is 159 characters and leads on the 22-vs-79 stat.
- Differentiates from the SERP (HR-tech vendor listicles) by leading with measurement-science perspective rather than tool listicle.

## [0.11.6] — 2026-04-22 — Blog: Cross-link design-spec post with AI-workflow siblings

### Changed
- `design-spec-every-project` now links out to `how-i-taught-ai-to-work-like-a-colleague` (on "technical partner is an AI") and `building-a-brain-for-your-ai-cto` (on "conversation starts from zero"). These two posts form a three-layer story with the new design-spec post: session configuration → cross-project knowledge base → per-project spec. The anchor phrases sit inside existing sentences, no new prose added.
- `how-i-taught-ai-to-work-like-a-colleague` and `building-a-brain-for-your-ai-cto` each gained a one-sentence forward reference to the new design-spec post in their respective conclusions, so the three posts now interlink in a triangle rather than the previous line (building-a-brain → how-i-taught-ai).

## [0.11.5] — 2026-04-22 — Blog: Why Every Project Gets a Design Spec

### Added
- New blog post: "Why Every Project Gets a Design Spec: A Product Spec Template for AI-Driven Development" — cross-project synthesis on why a short written spec has become the consistent starting point across six projects in unrelated domains (personal website, contractor archive, academic template, tax software, server infrastructure, quantitative research tool). Argues that when the implementer is an AI with no accumulated shared context, the spec stops being documentation overhead and becomes the management layer itself. Covers the four-part spec format (scope and architecture, constraints and decisions, implementation plan, definition of done), three concrete case examples, the failure mode that made the pattern click, and the 30–90 minute time cost. Labelled `ai-automation`.

## [0.11.4] — 2026-04-20 — Noindex Changelog Section

### Changed
- `/changelog` (index) and `/changelog/v*` (per-release) pages now send `<meta name="robots" content="noindex, nofollow">`. The changelog is internal dev log copy — not something that should compete for search impressions or dilute the site's topical focus.
- Removed `sitemap-changelog.xml` from `sitemap-index.xml.ts` and deleted `src/pages/sitemap-changelog.xml.ts`. Including noindex'd URLs in a sitemap sends contradictory signals to Google; the cleaner pattern is to drop them from the sitemap entirely.

## [0.11.3] — 2026-04-20 — Fix LinkedIn and Google Scholar URLs Site-wide

### Fixed
- LinkedIn profile URL corrected from `https://linkedin.com/in/blazejmrozinski` to `https://www.linkedin.com/in/bmrozinski/` across `src/components/Footer.astro`, `src/pages/about.astro` (Person JSON-LD `sameAs`), and `src/pages/contact.astro`.
- Google Scholar profile URL corrected from the invalid `https://scholar.google.com/citations?user=blazejmrozinski` to the canonical `https://scholar.google.com/citations?user=RpSeDYwAAAAJ` in the same three files. The old URLs 404'd, which also degraded the Person entity's `sameAs` graph for SEO.

## [0.11.2] — 2026-04-20 — Blog: Unpublish WP Infra Parts 6 and 7, Fix Part 5 TOC

### Removed
- `src/content/blog/wp-infra-06-automating-the-boring-parts.md` and `src/content/blog/wp-infra-07-watching-over-it-all.md`. Parts 6 and 7 had been sitting in the blog repo since the initial 7-post commit (`cb96ef3`) but were never intended to be visible — they're drafts in ContentForge (`~/GitHub/contentforge/drafts/blog/`) awaiting review. Removing the files takes them out of the collection, the sitemap, and the series nav. They'll be restored from the drafts when published.

### Fixed
- Part 5 series TOC now matches the format used on Parts 1–4: the current post is bolded with `*(you are here)*`, and Parts 6 and 7 are shown as plain text with `*(stay tuned)*`. The previous commit had linked them as if they were live, which would have produced 404s. The inline `*Previous:* / *Next:*` annotations were also removed from the end of Part 5 to match the format of the other published parts.
- Parts 1–4 series TOC entries for Part 5 flipped from `Locking It Down *(stay tuned)*` to an active link to `/blog/wp-infra-05-locking-it-down`.
- Glossary entries `cron`, `transient-cleanup`, `cache-warming`, and `watchdog-monitoring` had `relatedContent` refs and closing-paragraph links pointing to the unpublished `wp-infra-06` and `wp-infra-07` posts. The frontmatter refs were removed (or reduced to the published Part 4 where applicable), and the trailing sentences with the broken links were trimmed to end on the last body claim instead.

## [0.11.1] — 2026-04-20 — Blog: WP Infrastructure Part 5 (WordPress Security on VPS)

### Added
- New blog post: "WordPress Security on VPS: Nginx Rate Limiting, Fail2ban Jails, and SSL Hardening" — Part 5 of the WordPress Infrastructure from Scratch series. Covers the two-layer defense architecture (Nginx request filtering in front of PHP, fail2ban bans at the iptables layer), rate limiting for `wp-login.php`, scanner detection jails, SSL/TLS hardening with Let's Encrypt and Cloudflare, WordPress and WooCommerce application-level settings, and the `wp-security-check` audit script. Labelled `infrastructure`.
- Series TOC block appended so cross-links from Parts 1–4 and 6–7 resolve through the full index.

## [0.10.1] — 2026-04-15 — Default to Light Theme

### Changed
- Theme default is now light for all first-time visitors. Previously, with no `localStorage.theme` set, the site fell back to `prefers-color-scheme: dark` — meaning anyone on a dark-mode OS landed on the dark UI. The `ThemeScript` fallback and the `matchMedia` listener in `ThemeToggle` have been removed, so the site renders on a white background unless the user explicitly picks dark via the toggle (choice persisted in `localStorage`).

## [0.11.0] — 2026-04-17 — Glossary Expansion: 11 New Entries From Newest Posts

### Added
- 11 new glossary entries derived from the 10 newest blog posts:
  - **Infrastructure (5):** `cache-warming`, `transient-cleanup`, `cron`, `ufw`, `watchdog-monitoring` — supporting the WordPress Infrastructure series (wp-infra-04 through wp-infra-07)
  - **Psychometrics (4):** `cronbach-alpha`, `item-discrimination`, `distractor-analysis`, `wright-map` — supporting the psychometric analysis of university exams post
  - **Product (2):** `switching-cost`, `outcome-based-pricing` — supporting the "SaaS is dead" narrative post
- SEO metadata optimized against Ahrefs audit in `~/GitHub/contentforge/seo/glossary-audit-2026-04-17.md` (693 units). Notable revisions: `switching-cost` retargeted to plural form (parent keyword 5x larger volume), `item-discrimination` description surfaces parent topic "item analysis" (300/mo), `outcome-based-pricing` meta adds "where it breaks" hook matching draft content.

### Notes
- All entries cross-link within the batch and to existing glossary entries where relevant (e.g. `cache-warming` ↔ `transient-cleanup` ↔ `cron`; `ufw` → `fail2ban`; `item-discrimination` → `classical-test-theory` + `item-response-theory`).
- Sitemap (`sitemap-glossary.xml`) auto-regenerates from the glossary collection — all 11 URLs pick up without manual sitemap edits.
- Out of scope (deferred): editing the 10 parent blog posts to add inline `[term](/glossary/...)` links pointing to the new entries. Separate pass, bigger blast radius.
- Spec: `docs/superpowers/specs/2026-04-17-glossary-expansion-batch-design.md`. Plan: `docs/superpowers/plans/2026-04-17-glossary-expansion-batch.md`.

## [0.10.0] — 2026-04-15 — Migrate Hosting from Netlify to Cloudflare Pages

### Changed
- Hosting moved from Netlify to Cloudflare Pages. Netlify's edge had been failing TLS for the custom domain repeatedly despite a valid certificate in their records (most recent incident: 2026-04-15, both apex and www returning `Connection reset by peer` during the TLS Client Hello while `blazejmrozinski.netlify.app` continued to serve fine). Cloudflare Pages now terminates TLS at Cloudflare's edge using their Universal SSL. DNS was already authoritative on Cloudflare, so the cutover is a same-account record swap with zero downtime and no propagation lag.
- Contact form handling moved from Netlify Forms to [Web3Forms](https://web3forms.com). Both forms (`src/pages/contact.astro` and `src/components/ContactForm.astro` on the homepage) now POST directly to Web3Forms, with hidden fields for the access key, subject, sender label, and a same-domain redirect to a new `/thanks` page. Honeypot via the `botcheck` hidden field instead of CAPTCHA.

### Added
- `public/_headers` ports the 3 security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) from `netlify.toml` to Cloudflare Pages syntax.
- `public/_redirects` ports the single `/sitemap.xml` → `/sitemap-index.xml` 301.
- `src/pages/thanks.astro` — short post-submit confirmation page Web3Forms redirects to.
- `## Setup TODOs` section in `CLAUDE.md` flagging the `WEB3FORMS_ACCESS_KEY_PLACEHOLDER` token in both forms that must be replaced with a real key from web3forms.com signup before submissions work.

### Removed
- `netlify.toml` — no longer the source of truth. Cloudflare Pages reads `public/_headers` and `public/_redirects` instead.
- Netlify deploy status badge from `README.md`.

### Notes
- ContentForge's `scripts/publish.sh` does not touch Netlify, build hooks, or webhooks (verified: `git`-only). Cloudflare Pages picks up commits identically. **No ContentForge changes required.**
- Rollback window: the Netlify project remains built and deployable for 1 week post-cutover. If anything breaks on Cloudflare Pages, recovery is re-adding the custom domains in Netlify and removing them from Cloudflare Pages — ~2 minutes, no DNS propagation lag (same Cloudflare account).
- Out of scope for this migration: CSP / HSTS / Permissions-Policy, JS-enhanced form UX, Cloudflare Web Analytics, cache rules, image resizing. Each is its own future task.
- Spec: `docs/superpowers/specs/2026-04-15-cloudflare-pages-migration-design.md`. Plan: `docs/superpowers/plans/2026-04-15-cloudflare-pages-migration.md`.

## [0.9.4] — 2026-04-15 — CLAUDE.md: Ahrefs Budget Rule

### Added
- `## Ahrefs budget` section in `CLAUDE.md` establishing the blog repo as post-publish execution only. All keyword research, SERP analysis, and matching-terms lookups belong in ContentForge (which already owns the research budget). Two narrow exceptions carved out: `site-audit-issues` (technical SEO on the live site) and `rank-tracker-overview` (read-only, explicit request only).

### Notes
- Goal: prevent duplicate Ahrefs credit spend between ContentForge and the blog repo. The natural workflow is ContentForge writes audit files to `seo/`, blog repo consumes them.

## [0.9.3] — 2026-04-15 — Blog Image Pipeline: Move Inline Images to Astro Optimization

### Changed
- Migrated blog post inline images from `public/images/blog/<slug>/` to `src/assets/blog/<slug>/` so they flow through Astro's image pipeline. Result: WebP output, lazy loading, intrinsic dimensions, hashed cache-busted filenames, and 30–55% smaller payloads on the 9 charts in `psychometric-analysis-university-exams` (e.g. ctt-item-map: 101kB → 47kB).
- Rewrote 9 markdown image references in `psychometric-analysis-university-exams.md` from absolute `/images/blog/...` paths to relative `../../assets/blog/...` paths so Astro processes them at build time.

### Added
- `## Blog post images` convention section in `CLAUDE.md` documenting the `src/assets/blog/<slug>/` pattern and explicitly forbidding `public/` for inline post images.

### Notes
- ContentForge's `publish.sh` will be updated in a sibling commit so future blog posts with images land in `src/assets/blog/<slug>/` automatically and never in `public/`.
- Cover/social-share images are unaffected — they're handled at the layout level, not in the markdown body.

## [0.9.2] — 2026-04-15 — Add Psychometric Analysis of University Exams

### Added
- New blog post `psychometric-analysis-university-exams` ("What Psychometric Analysis Reveals About University Exams (Real CTT and IRT Findings)") with `label: academic-work`. A real-data CTT + IRT walkthrough of university exams covering item discrimination, distractor adjacency, the Wright map, the test information function, 3PL fallback to 2PL, dead distractors, unidimensionality checks, and SEM-aware pass/fail.
- 9 chart PNGs under `public/images/blog/psychometric-analysis-university-exams/` (CTT item map, negatively discriminating item, Wright map, TIF, 3PL ICC comparison, dead distractors, scree plot, SEM pass/fail histogram, item classification buckets).

### Notes
- SEO research saved in `~/GitHub/contentforge/published/seo/2026-04-14-psychometric-analysis-university-exams.md`. Primary target: "psychometric analysis" (vol 250, KD 16, TP 3,100). Secondaries: "item response theory" (vol 800, KD 5), "classical test theory" (vol 400, KD 1).

## [0.9.1] — 2026-04-15 — SEO Audit Implementation: Published Blog Posts

### Changed
- Retitled 4 blog posts to capture keyword-aligned phrases identified in the 2026-04-15 published-blog audit:
  - `how-i-taught-ai-to-work-like-a-colleague`: "How to Configure Claude Code: Subagents, Skills, and Safety Protocols for a Real Workflow" (targets "claude code subagents", "claude code agents", "how to use claude code")
  - `seo-architecture-before-first-visitor`: "SEO Architecture for a New Website: What to Build Before Your First Visitor" (targets "seo for new website" KD 6 / TP 644k, "seo architecture")
  - `wp-infra-03-deploying-wordpress`: "Production WordPress Deployment with Redis Object Cache Pro and Nginx" (targets "object cache pro", "wordpress redis object cache")
  - `wp-infra-04-four-layers-of-caching`: "WordPress Performance Optimization: Nginx FastCGI, Redis, OPcache, and Cloudflare (Under 50ms TTFB)" (targets "wordpress performance optimization" TP 1,500)
- Rewrote meta descriptions on 7 posts to front-load target keywords (posts 1, 2, 4, 5, 7, 8, 9 in the audit).
- Reworked tag arrays on all 9 published posts to reflect target keyword clusters (claude-code, seo-for-new-website, object-cache-pro, wordpress-performance-optimization, etc.).
- URLs (slugs) were intentionally left unchanged on all posts to preserve existing inbound links and avoid redirect churn — Netlify redirect support is available in `netlify.toml` if a future rename is needed.

### Added
- Internal cross-links with keyword-aligned anchor text:
  - `building-a-brain-for-your-ai-cto` → `how-i-taught-ai-to-work-like-a-colleague` ("configuring Claude Code subagents, skills, and safety protocols")
  - `wp-infra-04-four-layers-of-caching` → `wp-infra-03-deploying-wordpress` ("Object Cache Pro setup")
  - `wp-infra-01-why-i-ditched-managed-hosting` → `wp-infra-04-four-layers-of-caching` ("WordPress performance optimization")

### Notes
- Source audit: `~/GitHub/contentforge/seo/2026-04-15-published-blog-audit.md`.
- Audit-recommended body additions for the `how-i-taught-ai-to-work-like-a-colleague` post (adding verbatim "Claude Code subagents" section heading) were NOT applied, because the body does not actually cover Claude Code's subagents/skills/hooks features as platform primitives — it covers configuration documents. The retitle keeps the frontmatter keyword signal but flags a title/body mismatch that will need either body expansion or a title softening in a follow-up pass.

## [0.9.0] — 2026-04-15 — SEO Audit Implementation: Glossary Cluster Linking

### Added
- Inline cross-glossary links across the four topical clusters from the 2026-04-15 Ahrefs audit:
  - Psychometrics: `construct-validity` ↔ `confirmatory-factor-analysis` ↔ `classical-test-theory` ↔ `item-response-theory` ↔ `psychometric-assessment`
  - WordPress infrastructure: `lemp-stack` ↔ `php-fpm` ↔ `opcache` ↔ `fastcgi-cache` ↔ `redis-object-cache` ↔ `fail2ban`
  - SEO/product: `e-e-a-t` ↔ `internal-linking` ↔ `indexnow` ↔ `content-model`
- Inline glossary links inside the wp-infra blog series (parts 1–5) and the SEO/AI essays (`seo-architecture-before-first-visitor`, `personal-site-as-product`, `building-a-brain-for-your-ai-cto`, `how-i-taught-ai-to-work-like-a-colleague`).
- Glossary references on `projects/hse-career-quiz`, `projects/contentforge`, `companies/gyfted`, and `companies/swps-university` linking technical terms to their canonical definitions.
- "How I Validate Psychometric Assessments" section and a soft consulting CTA on `glossary/psychometric-assessment` pointing to `/contact`.
- "Available for selective consulting engagements" line at the top of the CV page with a contact link.
- Expanded `relatedTerms` arrays across the cluster glossary entries so the on-page "See also" rail reflects the full topical neighborhood.

### Changed
- `glossary/fail2ban` description rewritten to lead with general intrusion prevention rather than WordPress-specific framing, matching the actual search intent for "fail2ban".
- `/contact` page title updated from "Contact" to "Contact: Psychometric Consulting, Product Strategy, and SEO" to capture commercial-intent service phrases.
- `glossary/fail2ban` opening paragraph reframed to make explicit that Fail2ban is general-purpose Linux intrusion prevention, with WordPress and SSH as illustrative examples rather than the only use cases.

### Notes
- Source: `~/GitHub/contentforge/seo/2026-04-15-landing-pages-audit.md` (Ahrefs research from 2026-04-15).
- Glossary body lengths were already 700–1100 words per entry, so the audit's "expand body content" recommendation was already satisfied. The implementation focused on the connective tissue (cross-linking) and surgical content edits (description, CTA, title) rather than long-form rewrites.

## [0.7.2] — 2026-04-12 — Blog: WP Infrastructure Part 4

### Added
- Blog post "WordPress Caching with Nginx FastCGI, Redis, OPcache, and Cloudflare (Under 50ms TTFB)" — Part 4 of the WordPress Infrastructure from Scratch series. Deep-dive on four-layer WordPress caching stack with WooCommerce bypass rules. Label: infrastructure.

## [0.7.1] — 2026-04-13 — Blog: SaaS is dead narrative

### Added
- Blog post "Everyone Says SaaS Is Dead. Here's What They're Actually Observing." — 1900-word analysis separating the valid diagnosis from the wrong prognosis in the "SaaS is dead" narrative. SEO-optimized for primary keyword "saas is dead" (label: operator-notes).

## [0.7.0] — 2026-04-10 — Changelog

### Added
- Changelog timeline page at `/changelog/` with vertical timeline, colored release dots, and major/patch visual tiers
- Individual release detail pages at `/changelog/vX.Y.Z/` with categorized change lists and prev/next navigation
- CHANGELOG.md parser utility (`src/lib/changelog.ts`) — extracts structured release data at build time
- Version badge in footer brand column linking to changelog
- Changelog link in footer navigation
- Changelog sitemap at `/sitemap-changelog.xml` registered in sitemap index
- Release title convention in CHANGELOG.md headings (`## [x.y.z] — date — Title`)

## [0.6.1] — 2026-04-10 — Word Heatmap

### Added
- Word heatmap page at `/heat/` — interactive keyword cloud visualizing blog tag and label frequency with click-to-filter results, GA4 tracking (noindex, hidden from navigation)

## [0.6.0] — 2026-04-09 — Glossary

### Added
- Glossary content collection with term, seoTitle, definition, domain, relatedContent, relatedTerms fields
- Glossary index page at `/glossary` with alphabetical grouping and letter anchors
- Individual term pages at `/glossary/[term]` with DefinedTerm JSON-LD, domain badges, related content, and see-also cross-links
- Domain-to-color map utility (`src/lib/domains.ts`) for glossary visual theming
- Cover image generation for glossary terms with book/dictionary illustration
- Glossary sitemap (`sitemap-glossary.xml`) registered in sitemap index
- Glossary link in footer navigation

## [0.5.3] — 2026-04-09 — IndexNow Fix

### Fixed
- Replaced stale IndexNow API key with new key (`3a838b06f8a64c129f2d2c72f535b6b2`)
- Updated key file in `public/` and key reference in `scripts/indexnow.ts`

## [0.5.2] — 2026-04-06 — SEO Meta Titles

### Changed
- Optimized meta titles on About, Work, CV, Publications, and Blog pages for keyword-rich SEO
- Shortened homepage meta description from ~218 to ~166 chars with clearer value proposition
- Replaced generic contact page description with consulting-specific copy
- Updated HSE Career Quiz project description to include IRT/CTT methodology and specifics

### Added
- `metaTitle` optional field on companies and projects content collections
- metaTitle values for Digital Savages, Gyfted, Nerds.family, SWPS University, and HSE Career Quiz
- Company and project templates now prefer `metaTitle` over `name` for `<title>` tag while keeping `name` as the visible H1

## [0.5.1] — 2026-04-06 — WordPress Infrastructure Series

### Added
- "WordPress Infrastructure from Scratch" blog series (7 posts)
  - Part 1: Why I Ditched Managed Hosting (2026-04-01)
  - Part 2: Building the LEMP Stack (2026-04-06)
  - Part 3: Deploying WordPress (2026-04-13)
  - Part 4: Four Layers of Caching (2026-04-20)
  - Part 5: Locking It Down (2026-04-27)
  - Part 6: Automating the Boring Parts (2026-05-04)
  - Part 7: Watching Over It All (2026-05-11)
- Series navigation block at the end of each post
- All posts use `infrastructure` label

### Removed
- Test cover post (`test-cover-post.md`)

## [0.5.0] — 2026-04-06 — Blog Label System

### Added
- Blog label system with 7 topic categories (Infrastructure, AI & Automation, Product, Research, Systems Thinking, Operator Notes, Academic Work)
- `label` enum field on blog collection schema (optional, one per post)
- LabelFilter component with colored accent dots on `/blog` listing
- Label indicator on PostCard and BlogPost layout
- Programmatic cover image generation via satori + resvg at build time
- Per-label SVG illustrations: server rack, brain, scatter plot, wireframe, flowchart, terminal, research paper
- Cover images used as OG social cards (1200×630 PNG)
- Cover display on individual blog post pages
- Prebuild script (`scripts/generate-covers.ts`) hooked into `npm run build`
- Static Geist TTF fonts for satori rendering (requires TTF, not variable WOFF2)

## [0.4.0] — 2026-04-05 — Photography Gallery

### Added
- Travel photography gallery with album pages and inline photo expand
- `photography` content collection — folder-per-album with co-located images
- Album listing page at `/photography` with responsive card grid
- Individual album pages with cinematic hero image, narrative story, and 3-column photo grid
- Inline photo expand on click (vanilla JS, no lightbox library)
- ImageGallery JSON-LD structured data on album pages
- "Beyond Work" hobbies section on About page (photography + ultrarunning)
- Sample album for development/testing
- Astro `astro:assets` image optimization (WebP, responsive srcset, lazy loading)

## [0.3.0] — 2026-04-04 — RSS & Analytics

### Added
- RSS 2.0 feed at `/rss.xml` via `@astrojs/rss`
- Cookie consent banner with conditional GA4 loading
- Stats labels and enriched Work page and homepage service cards

## [0.2.0] — 2026-04-04 — Site Launch

### Added
- Homepage with newspaper grid layout, services, case studies, companies, writing, booking CTA
- Blog listing with client-side tag filtering and individual post pages
- Work/company pages with Organization JSON-LD and related projects
- Case Studies section with optional structured layout (challenge/approach/results)
- Publications page with APA-formatted citations from YAML data
- About page with Person JSON-LD (credentials, affiliations, expertise)
- CV page with PDF download
- Contact page with Netlify Forms (inline + full)
- Content collections: blog, companies, projects, pages

### Components
- PostCard, CompanyCard, ProjectCard, PublicationEntry, ContactForm
- TagFilter, JsonLd, SEO, CookieConsent
- Header with active-page highlighting, Footer with 3-column layout

## [0.1.0] — 2026-04-04 — Initial Setup

### Added
- Initial Astro project with Tailwind CSS, sitemap, Netlify config
- Base layout with SEO, header, footer, dark mode, scroll animations
- Geist font family (variable weight)
- OKLCH color system with light/dark themes
