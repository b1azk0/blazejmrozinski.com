---
title: "WordPress Performance Optimization: Nginx FastCGI, Redis, OPcache, and Cloudflare (Under 50ms TTFB)"
date: 2026-04-12
tags: [wordpress-performance-optimization, wordpress-caching, object-cache-pro, devops-reality, wordpress, hetzner, redis, nginx, woocommerce]
audience: [founders-operators, ai-practitioners]
format: deep-dive
description: "Four-layer WordPress caching stack for performance optimization: Cloudflare CDN, Nginx FastCGI page cache, Redis Object Cache Pro, and PHP OPcache with JIT. Sub-50ms TTFB with WooCommerce bypass rules."
status: published
safety_review: false
label: infrastructure
---

> *This is Part 4 of "WordPress Infrastructure from Scratch," a hands-on guide to building production WordPress and WooCommerce hosting on Hetzner. Code and configs at the [companion repository](https://github.com/b1azk0/wordpress-infrastructure) under `04-caching-layers/`.*

## Table of Contents

1. [Why WordPress Is Slow Without Caching](#why-wordpress-is-slow-without-caching)
2. [WordPress Cache Stack Architecture](#wordpress-cache-stack-architecture)
3. [Cloudflare CDN for WordPress: Configuration That Matters](#cloudflare-cdn-for-wordpress-configuration-that-matters)
4. [Nginx FastCGI Page Cache: From 500ms to Sub-50ms](#nginx-fastcgi-page-cache-from-500ms-to-sub-50ms)
5. [Redis Object Cache Pro: Database Query Caching](#redis-object-cache-pro-database-query-caching)
6. [PHP OPcache and JIT for WordPress](#php-opcache-and-jit-for-wordpress)
7. [Gzip Compression and Browser Cache Headers](#gzip-compression-and-browser-cache-headers)
8. [WordPress Performance Testing and TTFB Verification](#wordpress-performance-testing-and-ttfb-verification)
9. [WooCommerce Caching: Cart Fragments, Sessions, and Bypass Rules](#woocommerce-caching-cart-fragments-sessions-and-bypass-rules)
10. [What's Next](#whats-next)

---

## Why WordPress Is Slow Without Caching

WordPress, out of the box, is remarkably wasteful. Every single page request starts the PHP interpreter, loads the entire WordPress core, runs dozens of database queries, assembles the HTML from theme templates, and sends the result back to the browser. For a typical page on a WooCommerce site, that can mean 50 to 100 database queries, hundreds of milliseconds of PHP execution, and a time-to-first-byte well over 500ms.

Most caching guides address one layer. They tell you to install a caching plugin and move on. That helps, but it leaves performance on the table. The setup I built stacks four distinct caching layers, and the order they are applied matters as much as the layers themselves. The result: cached pages serve in under 50 milliseconds. Uncached pages, the ones that must bypass the cache for logged-in users and WooCommerce cart pages, still come in under 500ms.

This post covers all four layers, the configuration details that matter, and one critical bug that cost me hours of debugging.

## WordPress Cache Stack Architecture

A request to any of my WordPress sites passes through four caching layers in sequence. Most requests never make it past layer two.

**Layer 1: Cloudflare CDN.** The outermost layer. Handles HTTP/3, Brotli compression at the edge, and static asset caching. Sits in front of everything.

**Layer 2: [FastCGI page cache](/glossary/fastcgi-cache/) (Nginx).** This is the big one. Nginx stores the fully rendered HTML page on disk and serves it directly without ever touching PHP. If a visitor requests a page that is already cached, Nginx returns it in single-digit milliseconds.

**Layer 3: Object Cache Pro ([Redis](/glossary/redis-object-cache/)).** When the page cache is bypassed (logged-in users, cart pages, POST requests), PHP still has to run. Redis caches database query results, PHP objects, transients, and the options table so that individual queries resolve from memory instead of hitting MariaDB.

**Layer 4: [OPcache](/glossary/opcache/) + JIT.** PHP itself is cached. OPcache stores compiled bytecode so PHP files are parsed once and reused on every subsequent request. JIT compiles hot code paths to machine code.

For an anonymous visitor loading a blog post, the request hits Cloudflare (layer 1), which passes it to the origin server. Nginx checks its page cache (layer 2), finds a HIT, and returns the stored HTML. PHP never runs. Redis never gets queried. The database is untouched. Total time: under 50ms including network latency.

For a logged-in WooCommerce customer browsing their account page, layers 1 and 2 are bypassed. PHP runs, but layers 3 and 4 ensure that the PHP execution is fast, with most database queries resolved from Redis and the PHP bytecode already compiled. Total time: under 500ms.

## Cloudflare CDN for WordPress: Configuration That Matters

Cloudflare is the outermost layer. It sits between the visitor's browser and the Hetzner origin server, handling several things that the origin server should never have to deal with.

**What Cloudflare handles:**

- **HTTP/3 (QUIC).** Faster connection establishment, especially on mobile networks. This is enabled in Cloudflare's Network settings with a single toggle.
- **Brotli compression.** All text-based responses (HTML, CSS, JS) are compressed with Brotli at the edge before reaching the visitor. Brotli delivers 15 to 25 percent smaller files compared to gzip at equivalent CPU cost. Every modern browser supports it.
- **Static asset caching.** CSS, JavaScript, images, fonts, and other static files are cached at Cloudflare's edge network. A visitor in Frankfurt gets these files from Cloudflare's Frankfurt POP, not from the Hetzner server in Falkenstein.
- **TLS termination.** Cloudflare terminates the TLS connection at the edge. The connection between Cloudflare and the origin uses separate certificates (Let's Encrypt, configured in Post 3).

**Configuration that matters:**

SSL/TLS mode must be **Full (strict)**. This was covered in Post 3, but it bears repeating here because it interacts with caching. "Flexible" mode causes redirect loops. "Full" without "strict" is less secure than it should be. Full (strict) means end-to-end encryption with certificate validation at both ends.

**Bot Fight Mode: OFF.** Cloudflare's Bot Fight Mode sounds like something you want enabled, but on WordPress sites it creates real problems. It can block WordPress plugin update checks, theme license verification, REST API calls from third-party services, search engine crawlers, and uptime monitoring bots. I keep it OFF and handle bot protection at the Nginx level with rate limiting and specific block rules. The security tradeoff is minimal because the threats Bot Fight Mode targets are already handled by other layers.

**Cache Rules over Page Rules.** Cloudflare's newer Cache Rules system is more flexible than the legacy Page Rules. The essential rules for WordPress: bypass cache for anything under `/wp-admin` or `/wp-login.php`, and set extended cache (30 days) for static asset file extensions (css, js, png, jpg, jpeg, gif, ico, svg, webp, woff, woff2).

Early Hints, Tiered Cache, and Auto Minify are also enabled. These are smaller gains individually, but they compound. Early Hints lets browsers start loading resources before the full HTML response arrives. Tiered Cache improves edge cache hit ratios by routing through regional Cloudflare data centers.

## Nginx FastCGI Page Cache: From 500ms to Sub-50ms

This is the layer that turns WordPress from a 200 to 500ms application into a sub-50ms one. The concept is simple: when Nginx passes a request to PHP-FPM and gets back rendered HTML, it stores that HTML on disk. The next time someone requests the same URL, Nginx serves the stored HTML directly. PHP never runs. The database is never queried. Nginx is just handing back a file.

### Cache zone configuration

The cache zone is defined in the main `nginx.conf` inside the `http {}` block:

```nginx
fastcgi_cache_path /var/cache/nginx/fastcgi_cache levels=1:2 keys_zone=WP:200m inactive=120m max_size=2g;
fastcgi_cache_key "$scheme$request_method$host$request_uri";
```

Breaking this down: the cache lives on disk at `/var/cache/nginx/fastcgi_cache`. The `levels=1:2` sets a two-level directory hash to avoid having thousands of files in a single directory. The `keys_zone=WP:200m` allocates 200 megabytes of shared memory for cache keys (this is just the index, not the actual cached pages). The `inactive=120m` evicts entries that have not been accessed in 120 minutes. And `max_size=2g` caps the total disk usage at 2 gigabytes.

The cache key format is `$scheme$request_method$host$request_uri`. This means a cached page is uniquely identified by its protocol (http/https), method (GET/POST), hostname, and full URI including path and query string. Different URLs get different cache entries. Different hostnames on the same server get different cache entries.

### The critical bug

Here is the single most important thing in this entire post, and the one that cost me the most debugging time.

**The `fastcgi_cache_key` directive must be defined exactly once, in the `http {}` block of `nginx.conf`.** If you also define it in a vhost's `server {}` or `location {}` block, Nginx will silently use the wrong one. The symptom is that every page on your site returns identical content, specifically the homepage. Your blog post URLs return the homepage. Your about page returns the homepage. Everything is the homepage.

This happens because the duplicate cache key in the vhost context overrides the global one, and depending on how variables are evaluated at that scope, the key collapses to the same value for every request. There is no error in the Nginx error log. The syntax test (`nginx -t`) passes. The site appears to work, it just serves the wrong content on every URL except the actual homepage.

I found this by running `curl` against multiple URLs and comparing the response bodies. Once I identified the problem, the fix was deleting the duplicate `fastcgi_cache_key` line from the vhost. But finding it took hours because nothing in the logs indicated anything was wrong.

### Bypass rules

Not every request should be served from cache. The vhost configuration defines a `$skip_cache` variable that controls when Nginx should bypass the cache and pass the request through to PHP:

```nginx
set $skip_cache 0;

if ($request_method = POST) {
    set $skip_cache 1;
}

if ($query_string != "") {
    set $skip_cache 1;
}

if ($http_cookie ~* "wordpress_logged_in_|comment_author_|wp-postpass_|woocommerce_items_in_cart|woocommerce_cart_hash|wp_woocommerce_session_") {
    set $skip_cache 1;
}

if ($request_uri ~* "^/(cart|checkout|my-account)(/|$)") {
    set $skip_cache 1;
}

if ($request_uri ~* "^/wp-admin/|^/wp-login.php") {
    set $skip_cache 1;
}
```

The logic: POST requests are never cached (form submissions, AJAX calls). Requests with query strings are never cached (search results, filtered views, UTM parameters). Any request from a user with a WordPress login cookie, a WooCommerce cart cookie, or a WooCommerce session cookie bypasses the cache. The cart, checkout, and my-account URLs are always fresh. And anything under wp-admin or wp-login is never cached.

These bypass rules are critical for WooCommerce sites. Without the cookie checks, a customer could add something to their cart and then see another customer's cached cart page. Without the URL checks, the checkout page could serve stale data. I will come back to WooCommerce-specific gotchas at the end of this post.

In the PHP location block, the cache directives tie everything together:

```nginx
location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.4-fpm.sock;

    fastcgi_cache_bypass $skip_cache;
    fastcgi_no_cache     $skip_cache;
    fastcgi_cache        WP;
    fastcgi_cache_valid  200 301 302 60m;
    fastcgi_cache_use_stale error timeout invalid_header updating;

    add_header X-FastCGI-Cache $upstream_cache_status;
}
```

The `fastcgi_cache_use_stale` directive is worth noting. If the PHP backend is temporarily unavailable (during a restart, or under heavy load), Nginx will serve the stale cached version rather than returning an error. This provides resilience during PHP-FPM restarts and maintenance windows.

### Cache purging

When you publish or edit a post in WordPress, the cached version needs to be invalidated. The Nginx Helper plugin handles this automatically. On publish or edit, it purges the relevant cached pages so the next request regenerates them.

For manual purging, a simple command clears the entire cache:

```bash
sudo rm -rf /var/cache/nginx/fastcgi_cache/*
sudo systemctl reload nginx
```

This is part of the automated daily maintenance script that I will cover in Post 6.

## Redis Object Cache Pro: Database Query Caching

FastCGI page cache eliminates PHP entirely for anonymous visitors. But for logged-in users, WooCommerce customers, and admin pages, PHP still runs. This is where Redis object caching becomes important. I walked through the [Object Cache Pro setup](/blog/wp-infra-03-deploying-wordpress/) in Part 3 of this series; here I'll focus on why it makes such a measurable difference to the overall caching stack.

Object caching is fundamentally different from page caching. Page caching stores the final rendered HTML. Object caching stores the intermediate pieces: database query results, PHP objects, WordPress transients, and the options table. When WordPress needs to look up a setting or retrieve a post's metadata, the object cache intercepts the database query and returns the result from Redis (in-memory) instead of hitting MariaDB (on disk).

I use Object Cache Pro rather than the free Redis Object Cache plugin because the performance difference is measurable. OCP adds intelligent prefetching (batching multiple Redis calls into one round trip), split alloptions (which I will explain in a moment), igbinary serialization (faster and smaller than PHP's native serializer), and LZF compression.

### Configuration

The OCP configuration lives in `wp-config.php` and must be placed near the top of the file, right after the `<?php` opening tag, before `$table_prefix`:

```php
define( 'WP_CACHE', true );
define('WP_REDIS_CONFIG', [
    'host' => '127.0.0.1',
    'port' => 6379,
    'database' => 0,
    'prefix' => 'sitename:',
    'timeout' => 0.5,
    'read_timeout' => 0.5,
    'async_flush' => true,
    'split_alloptions' => true,
    'prefetch' => true,
    'serializer' => 'igbinary',
    'compression' => 'lzf',
]);
```

The placement matters. OCP's drop-in (`object-cache.php`) loads before WordPress processes the full config file. If these defines are placed at the bottom (which is where `wp config create` puts extra PHP by default), OCP fails with a cryptic error about `WP_REDIS_CONFIG` not being defined, even though it is clearly defined in the file. This cost me another round of debugging. The fix was simply moving the block to the top.

Each site on a shared server gets a unique `database` number and `prefix`. Redis supports 16 databases (0 through 15) by default, and the prefix ensures that even if two sites accidentally shared a database, their keys would not collide.

### Why split_alloptions matters

WordPress stores hundreds of settings in a single database row called `alloptions`. On every single page load, WordPress fetches this entire row. When any plugin updates any option, the entire `alloptions` cache entry is invalidated, which forces a full reload from the database on the next request.

On a WooCommerce site, this is expensive. WooCommerce has dozens of options, many of which change frequently (session data, transient counters, cart hashes). Without `split_alloptions`, every cart update invalidates the entire options cache, forcing a full database reload of every setting on the next page load.

OCP's `split_alloptions` feature breaks this single cache entry into individual keys. When one option changes, only that key is invalidated. Everything else stays cached. On WooCommerce sites, this single setting made a noticeable difference in uncached page load times.

### Monitoring

The target hit rate is 90 percent or higher. In practice, on sites with regular traffic, I see 95 percent and above.

OCP provides a dashboard in WordPress admin under Settings, Object Cache. The Analytics tab shows hit rate percentage, memory usage, slow queries, and cache misses. This is the easiest way to verify the cache is working.

From the command line:

```bash
redis-cli ping                    # Should return PONG
redis-cli INFO memory             # Check used_memory_human
redis-cli DBSIZE                  # Number of keys in current database
redis-cli INFO stats | grep hit   # keyspace_hits and keyspace_misses
```

Redis is configured with 256MB maximum memory and an `allkeys-lru` eviction policy, meaning when memory is full, the least recently used keys are evicted automatically. For the WordPress workload, this is the right policy. Keys that are actively used stay warm. Keys that have not been accessed in a while get evicted to make room.

### WooCommerce and Redis

For WooCommerce specifically, Redis handles session storage. By default, WooCommerce stores sessions in the database, which means a database write on every page load for any visitor with something in their cart. With Redis, these sessions live in memory. Faster reads, faster writes, less database load.

Transient caching is also significant for WooCommerce. Product data, shipping calculations, and tax lookups all use transients. With Redis, these resolve from memory instead of requiring database queries.

## PHP OPcache and JIT for WordPress

The final layer operates at the PHP level. OPcache stores compiled bytecode so that PHP files do not need to be parsed and compiled on every request. JIT (Just-In-Time compilation) goes further, compiling frequently executed code paths to machine code.

### OPcache configuration

The base OPcache configuration lives in `/etc/php/8.4/fpm/conf.d/10-opcache.ini`:

```ini
opcache.enable=1
opcache.enable_cli=0
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.max_wasted_percentage=10
opcache.validate_timestamps=0
opcache.revalidate_freq=0
```

The important setting is `validate_timestamps=0`. This tells OPcache to never check whether PHP files have changed on disk. Once a file is compiled and cached, it stays cached until PHP-FPM is restarted. This is correct for production because WordPress files do not change between deployments. The tradeoff: after a plugin update or WordPress core update, you need to restart PHP-FPM for the changes to take effect. The daily maintenance script handles this automatically.

The `max_accelerated_files=20000` is generous, but WordPress with several plugins easily generates thousands of PHP files. A typical WordPress installation with WooCommerce, a page builder, and a handful of plugins has 5,000 to 10,000 PHP files. Setting this high enough avoids cache evictions from OPcache running out of file slots.

### JIT configuration

JIT is configured in a separate file (`/etc/php/8.4/fpm/conf.d/99-performance.ini`) with a buffer size that scales by server tier:

```ini
opcache.jit=1255
opcache.jit_buffer_size=64M    # 128M on larger (8GB) servers
```

The mode `1255` enables tracing JIT with all optimizations. The first digit (1) means CPU-specific optimizations. The second (2) means tracing mode, which watches code execution patterns and optimizes hot paths. The remaining digits enable specific optimization strategies.

The practical impact: the first request after a PHP-FPM restart is slower because PHP has to compile and JIT-compile everything. Subsequent requests skip parsing, compilation, and frequently skip interpretation too, executing native machine code directly. For WordPress workloads, JIT provides a modest but measurable improvement on top of OPcache, in the range of 5 to 15 percent faster PHP execution for warm requests.

### Verification

```bash
php -r "var_dump(opcache_get_status());"
```

This outputs the current OPcache state including number of cached scripts, memory usage, hit rate, and JIT status. The key values to check: `opcache_enabled` should be `true`, `num_cached_scripts` should be in the thousands (matching your WordPress installation size), and `jit.on` should be `true`.

## Gzip Compression and Browser Cache Headers

These are supporting layers, not primary cache layers, but they contribute meaningfully to the overall performance picture.

### Gzip compression

Nginx handles gzip compression for responses served from the origin. The configuration in `nginx.conf`:

```nginx
gzip on;
gzip_comp_level 5;
gzip_min_length 1024;
gzip_proxied any;
gzip_vary on;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml
    application/xml+rss
    image/svg+xml;
```

Level 5 is the sweet spot for compression ratio versus CPU cost. Going higher (6 through 9) gives diminishing returns on compression while increasing CPU usage significantly. The `min_length 1024` avoids compressing tiny responses where the overhead of compression exceeds the bytes saved.

Visitors behind Cloudflare get Brotli compression at the edge (15 to 25 percent better than gzip). The Nginx gzip configuration serves as a fallback for any requests that reach the origin directly, and it compresses the response that Cloudflare then re-compresses with Brotli for end users.

I do not install Brotli on the server. Server-side Brotli requires compiling a third-party Nginx module, and since Cloudflare handles Brotli at the edge for all proxied traffic, the added complexity provides zero benefit.

### Browser caching

Static assets (CSS, JS, images, fonts) get a 30-day browser cache expiry:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
    expires 30d;
    log_not_found off;
}
```

Once a visitor's browser downloads a CSS file, it will not request it again for 30 days. Combined with Cloudflare's edge caching, most static assets are served from the browser cache or the nearest Cloudflare POP. The origin server rarely has to serve a static file more than once per unique visitor per month.

## WordPress Performance Testing and TTFB Verification

Here are the targets and how I verify each one.

### Target metrics

| Metric | Target | What it measures |
|--------|--------|-----------------|
| TTFB | < 50ms cached, < 500ms uncached | Server response time |
| FCP | < 1.5s | When the first content appears |
| LCP | < 2.5s | When the largest content element renders |
| TBT | < 100ms | Main thread blocking time |
| CLS | < 0.1 | Visual stability |

TTFB is where the four cache layers have their impact. FCP, LCP, TBT, and CLS are influenced more by frontend optimization (Perfmatters, which handles JavaScript deferral, CSS optimization, and lazy loading, though that is a separate topic from server-side caching).

### Verifying each layer

**FastCGI cache.** Check the `X-FastCGI-Cache` response header:

```bash
# First request will be a MISS (generates the cache):
curl -sI https://example.com/ | grep -i x-fastcgi-cache

# Second request should be a HIT:
curl -sI https://example.com/ | grep -i x-fastcgi-cache
```

A HIT means Nginx served the page from cache without touching PHP. A MISS means PHP rendered it (and Nginx cached it for next time). A BYPASS means the request matched one of the skip_cache rules.

**Redis object cache.** From the server command line:

```bash
redis-cli ping                                              # PONG
redis-cli INFO memory | grep used_memory_human              # Memory in use
redis-cli INFO stats | grep keyspace                        # Hits vs misses
```

In WordPress admin, the OCP dashboard shows hit rate percentage, which should be above 90 percent on any site with regular traffic.

**OPcache.** Quick check from the command line:

```bash
php -i | grep 'opcache.enable'          # Should show On
php -i | grep 'opcache.memory'          # Should show 256
```

**End-to-end timing.** A curl command with timing information:

```bash
curl -o /dev/null -s -w "TTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" https://example.com/
```

For a cached page, `time_starttransfer` should be well under 100ms (often under 50ms). For a page that bypasses the FastCGI cache, it should be under 500ms.

### WooCommerce verification

For WooCommerce sites, I run additional checks:

1. Visit a product page as an anonymous visitor, confirm `X-FastCGI-Cache: HIT`.
2. Add a product to the cart, confirm `X-FastCGI-Cache: BYPASS` on the cart page.
3. Visit the checkout page, confirm BYPASS.
4. Log in, visit any page, confirm BYPASS (logged-in users always bypass).
5. Log out, visit the same page, confirm HIT.

If any of these return the wrong cache status, the bypass rules need adjustment.

## WooCommerce Caching: Cart Fragments, Sessions, and Bypass Rules

WooCommerce introduces several caching complications that basic WordPress installations do not have.

**Cart fragments.** WooCommerce uses an AJAX request (`wc-ajax=get_refreshed_fragments`) to update the mini-cart widget on every page load. This request runs PHP on every page, even for anonymous visitors, even on pages that are otherwise fully cached. It is a significant performance drain, roughly 0.5 seconds per request on typical configurations. I disable cart fragments entirely using Perfmatters and rely on a full page reload when the cart is updated. The user experience tradeoff is minimal: instead of the cart icon updating in real-time via AJAX, it updates on the next page navigation. For most stores, nobody notices.

**Dynamic pricing.** If your WooCommerce store uses dynamic pricing (prices that change based on user role, quantity, or time-based promotions), the page cache can serve stale prices. The bypass rules handle logged-in users, but anonymous users with cookie-based pricing rules need special attention. For the stores I manage, pricing is static for anonymous visitors, so the default bypass rules are sufficient.

**Session storage.** WooCommerce sessions track cart contents, recently viewed products, and checkout state. By default, these are stored in the `wp_options` or `wp_woocommerce_sessions` database table, which means a database write on every page load for any visitor with a session. With Redis, sessions are stored in memory. Reads and writes are faster, and the database is not burdened with session churn. The `wp_woocommerce_session_` cookie in the bypass rules ensures that visitors with active sessions always get fresh pages.

**The alloptions problem.** I mentioned this in the Object Cache Pro section, but it is worth reinforcing. WooCommerce's frequent option updates (transient counters, session metadata, cart hash tracking) cause constant invalidation of the `alloptions` cache. Without `split_alloptions`, this means a full database reload of all WordPress options on nearly every uncached request. With `split_alloptions` enabled in OCP, only the changed option is invalidated. In the config file it looks trivial. On a WooCommerce store with frequent cart activity, it cut uncached page load times noticeably.

**What to never cache.** Cart, checkout, and my-account pages must always bypass the page cache. The same applies to any page that displays user-specific content: wishlists, order history, account dashboards. The bypass rules in the Nginx configuration handle the standard WooCommerce pages. Custom pages that display user-specific content may need additional URI patterns added to the `$request_uri` bypass rule.

## What's Next

The caching layers covered here transform WordPress from an application that rebuilds every page from scratch into one that serves most requests as static files. The cache configuration files are in the companion repo under `04-caching-layers/`.

The configurations for the FastCGI cache zone and OPcache were first placed during the server setup in Post 2. Redis was installed and Object Cache Pro configured during Post 3. This post explains the how and why of each layer in depth, and the critical debugging lessons that came from getting them to work together.

Caching is great until the cache is stale. A plugin update, a PHP-FPM restart, or a server reboot clears the cache, and the next few hundred visitors all hit uncached pages. In Post 6, we build automated maintenance that includes [cache warming](/glossary/cache-warming/), running through the sitemap after every maintenance window so that visitors never see a cold cache.

Before that, Post 5 covers security hardening: rate limiting, fail2ban, firewall rules, and the principle that performance means nothing if the server is compromised.

---

## WordPress Infrastructure from Scratch — Full Series

1. [Why I Ditched Managed Hosting](/blog/wp-infra-01-why-i-ditched-managed-hosting)
2. [Building the LEMP Stack](/blog/wp-infra-02-building-the-lemp-stack)
3. [Deploying WordPress the Right Way](/blog/wp-infra-03-deploying-wordpress)
4. **Four Layers of Caching** *(you are here)*
5. Locking It Down *(stay tuned)*
6. Automating the Boring Parts *(stay tuned)*
7. Watching Over It All *(stay tuned)*
