---
term: "Redis Object Cache"
seoTitle: "Redis Object Cache for WordPress: How In-Memory Caching Speeds Up Database Queries"
description: "Redis object cache stores WordPress database query results in memory. Learn how Redis, Object Cache Pro, and key features like prefetching and split alloptions work."
definition: "Redis object cache is an in-memory data store used by WordPress to cache database query results, reducing the number of MySQL queries needed to generate each page."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-03-deploying-wordpress"
relatedTerms:
  - "fastcgi-cache"
  - "lemp-stack"
status: draft
date: 2026-04-09
---

Redis is an in-memory key-value store. In the context of WordPress, it functions as a persistent object cache — holding the results of database queries in RAM so WordPress doesn't have to re-run those queries on the next request.

FastCGI cache eliminates PHP and database work for entire pages. Redis object cache works at a finer granularity, reducing database load for requests that can't be fully cached — logged-in users, WooCommerce sessions, AJAX requests, and admin operations.

## What Redis Is

Redis stores data in memory (RAM), which makes reads and writes orders of magnitude faster than a relational database. It supports various data structures — strings, hashes, lists, sorted sets — and can persist data to disk for durability.

For WordPress, the relevant capability is simple key-value storage: store the result of a database query under a key derived from the query parameters, retrieve it in microseconds on subsequent requests.

Redis runs as a separate daemon (`redis-server`) and communicates over a Unix socket or TCP port. WordPress connects to it via a drop-in file that replaces the default in-memory object cache with Redis-backed storage.

## How WordPress Uses Redis

WordPress has a built-in object cache API: `wp_cache_set()`, `wp_cache_get()`, `wp_cache_delete()`. By default, this cache is per-request only — it lives in memory during a single PHP execution and disappears when the request ends. A page that makes 40 database queries still makes 40 queries on the next request.

A Redis drop-in replaces the storage backend for that same API. Now when WordPress calls `wp_cache_set()`, the data goes to Redis instead of PHP memory. `wp_cache_get()` retrieves it from Redis on the next request — including the next request by a different PHP-FPM worker. The cache persists across requests and across workers.

The drop-in is a file named `object-cache.php` placed in `wp-content/`. WordPress detects it automatically. No code changes required in WordPress core or plugins — everything that uses the standard cache API benefits transparently.

## Object Cache Pro vs the Free Plugin

Two main options exist for Redis integration:

The free **Redis Object Cache** plugin (Till Krüss) is widely used, well-maintained, and gets the job done. It installs the drop-in, handles cache invalidation, and provides basic diagnostics. For most WordPress sites, it's sufficient.

**Object Cache Pro** is a paid plugin (~$95/site/year) built for production and high-traffic environments. The performance difference on a simple content site is marginal. On WooCommerce or high-traffic sites, it matters.

Key Object Cache Pro features worth knowing:

**Prefetching** — OCP tracks which cache keys are read during a request and prefetches them all in a single Redis pipeline call at the start of the next request. Instead of 40 serial Redis round-trips, you get one batch fetch. This matters when Redis latency is measurable (network-attached Redis, high-traffic servers).

**Split alloptions** — WordPress stores all plugin options in a single `wp_options` row called `alloptions`. On sites with many plugins, this single row can grow to hundreds of kilobytes. Reading and writing it on every request is expensive, and any change to any plugin option invalidates the entire cached blob. OCP splits `alloptions` into individual cache keys per option, so changing one option only invalidates that one key.

**igbinary serialization** — PHP's default serialization format is text-based and slow. igbinary uses a binary format that's faster to serialize/deserialize and produces smaller data. Smaller Redis values mean lower memory usage and faster network transfers.

**LZF compression** — compresses cached values before storing them in Redis. Reduces Redis memory usage at the cost of minimal CPU overhead. Worthwhile when RAM is the constraint.

## Multi-Site Isolation

On a server running multiple WordPress sites, Redis needs to keep each site's cache isolated. Two mechanisms ensure this:

**Database number** — Redis supports 16 logical databases (0–15) by default. Assigning a different database number to each site creates hard isolation between their caches.

**Key prefix** — Even within the same Redis database, a unique prefix per site (e.g., `site1:` and `site2:`) prevents key collisions. OCP and the free plugin both support this via `WP_CACHE_KEY_SALT` or plugin settings.

## The wp-config.php Ordering Gotcha

Object Cache Pro (and the free plugin in some configurations) requires its configuration constants to be defined in `wp-config.php` before the line that loads `wp-settings.php`. This seems obvious but catches people out when they add Redis constants at the bottom of `wp-config.php` after the `require_once` for settings.

The drop-in file is loaded early in WordPress's bootstrap process. If the Redis connection parameters aren't defined yet when `object-cache.php` is included, the drop-in fails silently and falls back to the default in-memory cache. Verify Redis is actually active by checking the plugin dashboard or using `wp cache status` via WP-CLI.

Full Redis and Object Cache Pro configuration for my WordPress setup is in [Part 3 of the WordPress Infrastructure series](/blog/wp-infra-03-deploying-wordpress).
