---
term: "FastCGI Cache"
seoTitle: "Nginx FastCGI Cache for WordPress: How Page Caching Eliminates PHP Overhead"
description: "FastCGI cache stores complete PHP responses as static files in Nginx. Learn how it works, cache skip rules for WooCommerce, and cache warming strategies."
definition: "FastCGI cache is an Nginx feature that stores the complete HTML output of PHP requests as static files, serving subsequent requests directly from cache without invoking PHP."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-02-building-the-lemp-stack"
  - "blog/wp-infra-03-deploying-wordpress"
relatedTerms:
  - "redis-object-cache"
  - "opcache"
  - "php-fpm"
status: draft
date: 2026-04-09
---

FastCGI cache is Nginx's built-in page caching mechanism. When enabled, Nginx stores the complete HTML response from a PHP request as a static file on disk. The next request for that same URL gets the cached file served directly — no PHP execution, no database queries, no PHP-FPM involvement at all.

It's the single highest-impact caching layer for WordPress. A cached page can be served in under a millisecond. An uncached WordPress page might take 200–800ms depending on the server and plugin load. The difference is visible.

## How It Works

The basic mechanism:

1. A request arrives at Nginx for `/some-page/`
2. Nginx generates a cache key from the request (usually URL + scheme + host)
3. Nginx checks if a cached file exists for that key — a **cache hit** returns the file immediately
4. On a **cache miss**, Nginx forwards the request to PHP-FPM, WordPress executes, and the response comes back
5. Nginx writes the response to its cache directory and serves it to the client
6. Every subsequent request for the same URL hits the cache until it expires or is purged

The cache lives on disk (not in RAM like Redis), typically in `/tmp/nginx-cache/` or a dedicated partition. Even disk-cached pages are fast because the OS page cache keeps frequently accessed files in memory anyway.

## Cache Key Configuration

The cache key determines what makes a request unique. A basic WordPress configuration:

```nginx
fastcgi_cache_key "$scheme$request_method$host$request_uri";
```

This means two requests are considered identical only if they share the same scheme (http/https), method (GET/POST), host, and URI. Query strings are included in `$request_uri`, so `/?s=query` gets its own cache entry.

## Cache Skip Rules

This is where most FastCGI cache configurations for WordPress need care. You don't want to cache:

- **POST requests** — form submissions, login attempts, AJAX actions
- **Logged-in users** — they see personalized content (admin bar, drafts, private posts)
- **WooCommerce cart and checkout pages** — cart contents are per-user and change constantly
- **WooCommerce session cookies** — if a user has items in cart or is in checkout, cache bypass
- **wp-cron and admin requests** — never cache `/wp-admin/` or `/wp-cron.php`

A typical bypass configuration:

```nginx
set $skip_cache 0;

# Skip cache for POST requests
if ($request_method = POST) { set $skip_cache 1; }

# Skip cache for logged-in users
if ($http_cookie ~* "wordpress_logged_in") { set $skip_cache 1; }

# Skip cache for WooCommerce sessions
if ($http_cookie ~* "woocommerce_items_in_cart|wp_woocommerce_session") {
    set $skip_cache 1;
}

# Skip cache for admin and login pages
if ($request_uri ~* "wp-admin|wp-login") { set $skip_cache 1; }
```

These rules mean WooCommerce customers with items in their cart never get served a cached page — which is correct. The downside is that WooCommerce sites have a smaller percentage of cacheable traffic than pure content sites.

## The X-FastCGI-Cache Header

Nginx adds a response header that tells you what happened with the cache for each request:

- `X-FastCGI-Cache: HIT` — served from cache, PHP never ran
- `X-FastCGI-Cache: MISS` — cache miss, PHP executed and response was cached
- `X-FastCGI-Cache: BYPASS` — cache was intentionally skipped (logged-in user, POST, etc.)
- `X-FastCGI-Cache: EXPIRED` — cache entry existed but expired before this request

This header is invaluable for debugging cache behavior. Check it in browser DevTools or with `curl -I https://example.com` to verify your skip rules are working correctly.

## Cache Warming

A cold cache means every first visitor to each URL triggers a PHP execution. After a server restart, plugin update, or manual cache purge, the cache is empty. Cache warming is the process of proactively fetching pages to fill the cache before real users arrive.

A basic warm-up using a sitemap:

```bash
curl -s https://example.com/sitemap.xml \
  | grep -oP '(?<=<loc>)[^<]+' \
  | xargs -P4 -I{} curl -s -o /dev/null {}
```

More sophisticated setups use tools like `wp-cli` combined with sitemap crawlers. For large sites, warming in parallel with `-P4` (4 concurrent requests) is faster without overloading the server.

## Cache Purging with Nginx Helper

When content changes — a new post is published, a page is updated — the cached version is stale. Nginx doesn't know this automatically. You need a purge mechanism.

The Nginx Helper WordPress plugin handles this. When you publish or update content, it sends a PURGE request to Nginx for the affected URLs, including the home page, category pages, and any other pages that might show the updated content. Nginx deletes or invalidates the relevant cache files.

Nginx must have the `ngx_cache_purge` module compiled in for this to work (available in the `nginx-extras` package on Debian/Ubuntu, or via a custom build).

## Relationship to Cloudflare Edge Cache

FastCGI cache and Cloudflare cache operate at different layers. FastCGI cache lives on your origin server — it eliminates PHP execution for requests that reach your server. Cloudflare's edge cache intercepts requests before they reach your server — it serves responses from Cloudflare's CDN edge nodes.

The two are complementary. Cloudflare handles the volume of requests that never reach your origin. FastCGI cache handles requests that do reach your origin (cache misses at the Cloudflare layer, non-cacheable requests, assets that Cloudflare doesn't cache). A properly configured site benefits from both.

The main interaction to watch: if Cloudflare caches a page that should be bypassed (like a WooCommerce cart page), users get stale or wrong content. Cloudflare cache rules need to mirror your FastCGI cache bypass rules for consistency.

Full FastCGI cache configuration for WordPress and WooCommerce is covered in the [WordPress Infrastructure series](/blog/wp-infra-02-building-the-lemp-stack).
