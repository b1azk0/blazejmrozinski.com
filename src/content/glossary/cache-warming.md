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
status: published
date: 2026-04-17
---

Every cache has a cold state. After a deploy, a plugin update, a scheduled flush, or a server restart, the cache is empty — and the first visitor to each URL pays the full cost of generating the response from scratch. Cache warming is the practice of walking through those URLs yourself, before real traffic does, so the cache is already populated when the first human arrives. It's the difference between a site that feels consistently fast and one that has a noticeable stutter every time something gets deployed.

## Why Caches Need Warming

On a WordPress server with [FastCGI cache](/glossary/fastcgi-cache/) and [Redis object cache](/glossary/redis-object-cache/) configured, most requests never touch PHP. A cache hit is served as a static file in a few milliseconds. A cache miss, by contrast, runs the full stack: Nginx forwards to PHP-FPM, WordPress boots, plugins load, MariaDB is queried dozens of times, and the HTML is assembled and returned. On a modestly configured VPS, that's the difference between 5 ms and 500 ms.

After any cache flush — a plugin deploy, a permalink change, or a scheduled nightly purge — every URL is a cache miss. If real traffic arrives during the cold window, p99 response times spike until the cache refills naturally. Warming collapses that window to a few minutes of controlled load instead of an unpredictable period of slow first visits.

## What Warming Actually Does

Different cache layers need different warming strategies:

- **FastCGI page cache** is populated by making HTTP requests to the URLs you want cached. A GET against a page triggers Nginx to generate and store the response. The practical tool is the XML sitemap — it lists every URL you care about, and iterating through it covers the site.
- **Redis object cache** is populated by running the queries WordPress will later need. Hitting the home page and a handful of deep pages exercises most of the common object cache keys (options, post meta, taxonomy terms). You don't need a separate loop for this; the HTTP crawl above warms Redis as a side effect.
- **[OPcache](/glossary/opcache/)** caches compiled PHP bytecode. It's warmed either by the first request that executes each PHP file, or preemptively via the `opcache.preload` directive in PHP 7.4+, which compiles a specified set of files at FPM startup.

## Automating It

The standard pattern is a bash script that fetches the sitemap, extracts URLs, and curls them in parallel. Triggered from [cron](/glossary/cron/) after every deploy, or on a fixed schedule if the cache TTL is short.

A minimal version:

```bash
#!/bin/bash
curl -s https://example.com/sitemap.xml \
  | grep -oP '(?<=<loc>)[^<]+' \
  | xargs -n 1 -P 8 curl -s -o /dev/null
```

Runtime on a site with a few hundred URLs is typically 2–5 minutes with parallelism of 8. The script lives at `/usr/local/bin/warm-cache.sh` and gets invoked from the root crontab — either on a timer or via a deploy hook.

Two details worth getting right. First, warm through the public URL, not localhost — you want the request to pass through Nginx and populate the same cache keys a real visitor would hit. Second, don't confuse warming with a real load test: a warmer sends one request per URL, not traffic that reflects production patterns.

## When It Matters vs When It Doesn't

Warming is worth the setup effort when cache flushes are frequent (regular deploys, active content editing, short TTLs) or when cold-cache response times are user-visible (high-traffic pages, paid traffic, SEO-sensitive sites where Core Web Vitals matter). On a small blog with stable content and a 24-hour TTL, the cache will warm itself organically as pages get traffic and the cost of a few slow first requests is invisible.

On a WooCommerce site deploying twice a week, or a WordPress install behind a CDN that purges on every publish, skipping cache warming is visible in the P99 metrics. It's one of the cheaper wins in the automation stack — I walk through the full script and cron setup in the [WordPress infrastructure series](/blog/wp-infra-06-automating-the-boring-parts).
