---
term: "IndexNow"
seoTitle: "What Is IndexNow? Instant Search Engine Indexing for New Content"
description: "IndexNow is a protocol that notifies search engines about new or updated URLs instantly. Learn how it works, which engines support it, and how to implement it."
definition: "IndexNow is an open protocol that allows websites to notify participating search engines (Bing, Yandex, others) immediately when content is created, updated, or deleted."
domain: "product"
relatedContent:
  - "blog/seo-architecture-before-first-visitor"
relatedTerms:
  - "structured-data-json-ld"
  - "internal-linking"
  - "e-e-a-t"
  - "content-model"
status: published
date: 2026-04-09
---

Traditional search indexing is a pull model. Search engine crawlers decide when to visit your site, based on crawl budgets, link discovery, and signals about how frequently your content changes. If you publish something today, it might get indexed in a few hours or a few weeks. You have no direct control over that timeline.

IndexNow changes the model. Instead of waiting for crawlers to discover your content, you push a notification to the search engine directly: "These URLs have changed. Come get them."

## How IndexNow Works

The protocol is simple. You generate an API key, host a text file with that key on your site (at `yourdomain.com/{key}.txt`), and then submit URLs via a POST request to the IndexNow endpoint. The request includes your key, your host, and a list of URLs to index.

The search engine verifies the key by checking that the hosted file matches, then queues the submitted URLs for crawling. The crawl still has to happen — IndexNow doesn't bypass it — but the prioritization changes. Instead of waiting in the general crawl queue, your submitted URLs move to the front.

For fresh content, this can mean the difference between indexing in hours versus days.

## Which Engines Support It

IndexNow is backed by Microsoft and Yandex, and is supported by Bing, Yandex, Naver, Seznam, and other participating engines. Google does not participate in IndexNow. Google has its own mechanism (the Indexing API) for structured content types, but IndexNow is not it.

This matters for realistic expectations. If your primary traffic source is Google, IndexNow doesn't accelerate Google indexing. But Bing's market share is real, Bing powers many third-party search surfaces, and Yandex matters in certain geographies. Submitting to IndexNow reaches those audiences faster.

Also: what gets submitted to one IndexNow endpoint is shared across all participating engines. One POST request notifies the full network.

## Bulk Submission and Deduplication

The IndexNow API accepts up to 10,000 URLs per request. For a site with hundreds or thousands of pages, a full-site submission on deploy is feasible in a single call.

This brings up a reasonable concern: is it wasteful or risky to submit all URLs on every deploy, even when most pages haven't changed? The answer is no. IndexNow documentation explicitly states that resubmitting unchanged URLs is safe — the engine handles deduplication and won't penalize you for it. The notification is additive, not authoritative.

This makes implementation straightforward: generate a complete URL list at build time, POST it to the IndexNow endpoint in a postbuild script, done.

## When IndexNow Matters Most

The benefit is proportional to how frequently you publish and how time-sensitive your content is.

For a blog publishing weekly, the difference between same-day and same-week Bing indexing probably doesn't move metrics. For a news site publishing dozens of articles per day, fast indexing is directly tied to traffic for time-sensitive queries.

For this site, IndexNow fits a simple engineering principle: it's low cost to implement, zero cost to maintain, and occasionally provides real value when new posts go out. There's no downside case. It pairs naturally with a clean [content model](/glossary/content-model/) (which makes the canonical URL list trivial to generate at build time) and with a deliberate [internal linking](/glossary/internal-linking/) structure that gives the freshly indexed pages somewhere meaningful to sit in the site graph. From an [E-E-A-T](/glossary/e-e-a-t/) perspective, faster indexing means new credibility signals start counting sooner.

## Implementation on a Static Site

On a Netlify-deployed Astro site, the pattern is:

1. API key file lives in `public/` — it gets deployed as a static file at the root domain
2. A postbuild script generates the full URL list from the content collections
3. A POST request goes to `https://api.indexnow.org/indexnow` with the URL list
4. The script runs as part of the Netlify build pipeline after the static files are generated

The whole thing is a small Node script that runs in under a second. Once set up, it's invisible infrastructure — it just runs on every deploy.

For sites that want more control, you can scope submissions to only changed URLs by comparing against a previous sitemap or using a deploy-time diff. But for most sites, submitting everything and letting the engine deduplicate is simpler and equally effective.
