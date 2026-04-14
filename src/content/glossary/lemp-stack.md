---
term: "LEMP Stack"
seoTitle: "What Is a LEMP Stack? Linux, Nginx, MariaDB & PHP Explained"
description: "A LEMP stack combines Linux, Nginx, MariaDB, and PHP to serve dynamic websites. Learn what each component does and why LEMP is the standard for WordPress hosting."
definition: "A LEMP stack is a software bundle of Linux, Nginx (Engine-X), MariaDB (or MySQL), and PHP used to serve dynamic web applications."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-02-building-the-lemp-stack"
  - "blog/wp-infra-01-why-i-ditched-managed-hosting"
relatedTerms:
  - "php-fpm"
  - "opcache"
  - "fastcgi-cache"
  - "redis-object-cache"
  - "fail2ban"
  - "vps"
status: published
date: 2026-04-09
---

A LEMP stack is the standard software combination for serving dynamic web applications on Linux. The name is an acronym: **L**inux, **E**nginx (pronounced "Engine-X"), **M**ariaDB (or MySQL), and **P**HP. Each layer handles a distinct job, and together they form a complete pipeline from HTTP request to rendered HTML response.

It's the foundation I use across all my Hetzner VPS servers for WordPress and WooCommerce hosting.

## What Each Letter Means

**Linux** is the operating system. It manages hardware resources, processes, networking, and file permissions. For WordPress hosting, Debian is a solid choice — stable, well-documented, and conservative with package updates. Linux isn't just the bottom layer; it's where most performance tuning actually happens: kernel TCP settings, file descriptor limits, memory overcommit behavior.

**Nginx** (the "E" comes from the pronunciation) is the web server. It listens on ports 80 and 443, handles TLS termination, serves static files directly from disk, and forwards PHP requests to [PHP-FPM](/glossary/php-fpm/). Nginx is event-driven and non-blocking — it can handle thousands of concurrent connections with minimal memory. This matters a lot for WordPress under real traffic.

**MariaDB** is the relational database. WordPress stores all content, settings, user data, and plugin configuration in MariaDB. Technically you can use MySQL instead — they share the same query syntax and wire protocol — but MariaDB has moved faster on performance improvements for InnoDB workloads and is the default in most modern Linux repositories. The database is usually the bottleneck in WordPress performance, which is why tuning InnoDB buffer pool size and query cache behavior matters.

**PHP** is the language WordPress is written in. When Nginx receives a request for a `.php` file, it passes that request to PHP-FPM, which executes the PHP code, queries the database, builds the HTML response, and returns it to Nginx. PHP 8.x brought significant performance improvements over 7.x through better JIT compilation and reduced memory overhead.

## Why Nginx Instead of Apache

Apache was the dominant web server for decades and is still widely used. But Apache's default threading model — one thread (or process) per connection — doesn't scale as well under WordPress's traffic patterns. WordPress generates a lot of concurrent requests: multiple assets per page, admin-bar pings, cron requests, plus any real users.

Nginx handles concurrency differently. Its worker processes use non-blocking I/O and can each handle thousands of simultaneous connections. For WordPress specifically, this means fewer memory spikes under load and more predictable behavior when traffic bursts.

The other reason I use Nginx: [FastCGI cache](/glossary/fastcgi-cache/). Nginx has a native page caching mechanism that stores complete PHP responses as static files and serves them without invoking PHP at all. This is one of the biggest single performance levers for WordPress, and it's built into Nginx rather than bolted on via a plugin. For finer-grained caching of database query results, the LEMP stack is typically extended with [Redis as an object cache](/glossary/redis-object-cache/).

## How the Components Interact

The request flow through a LEMP stack looks like this:

1. A browser sends an HTTP request to the server
2. Nginx receives the request and checks its FastCGI cache — if it's a cache hit, it returns the cached response immediately (PHP never runs)
3. On a cache miss, Nginx forwards the request to PHP-FPM via a Unix socket
4. PHP-FPM picks an available worker process from its pool and executes the PHP code
5. WordPress PHP code queries MariaDB for post content, settings, and plugin data
6. MariaDB returns query results; PHP assembles the HTML response
7. PHP-FPM returns the response to Nginx
8. Nginx caches the response (if caching is configured) and sends it to the browser

Static files — images, CSS, JavaScript — skip PHP entirely. Nginx serves them directly from disk, which is fast.

## When to Use a LEMP Stack

A LEMP stack is appropriate when:

- You're self-hosting WordPress or WooCommerce on a VPS
- You need more control over performance tuning than managed hosting allows
- You're running multiple sites and want to understand the resource tradeoffs between them
- You want to implement proper page caching at the web server level rather than relying entirely on WordPress plugins

It's not appropriate if you have no tolerance for server administration, need SLA-backed uptime guarantees, or are running a workload that genuinely requires a managed database service.

## Typical Deployment

On a Hetzner CX22 (2 vCPU, 4 GB RAM), a properly configured LEMP stack can serve a WordPress site with moderate traffic without breaking a sweat. The key is configuration — the defaults for every component in this stack are designed for maximum compatibility across all hardware, not for WordPress specifically. Getting the most out of LEMP means tuning [PHP-FPM](/glossary/php-fpm/) worker counts, [OPcache](/glossary/opcache/) memory allocation, MariaDB InnoDB buffer pool, and Nginx worker connections to match the actual hardware and workload. On the security side, [Fail2ban](/glossary/fail2ban/) handles automated intrusion prevention against the brute-force traffic any public LEMP server attracts.

I document that tuning process in detail in the [WordPress Infrastructure series](/blog/wp-infra-02-building-the-lemp-stack).
