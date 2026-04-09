---
term: "PHP-FPM (FastCGI Process Manager)"
seoTitle: "PHP-FPM Explained: Process Modes, Worker Tuning & WordPress Performance"
description: "PHP-FPM manages PHP worker processes for web servers. Learn about static vs dynamic modes, worker tuning for WordPress, and why pm.max_children matters."
definition: "PHP-FPM (FastCGI Process Manager) is a PHP implementation that manages a pool of worker processes to handle PHP requests from a web server like Nginx."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-02-building-the-lemp-stack"
relatedTerms:
  - "lemp-stack"
  - "opcache"
  - "fastcgi-cache"
status: published
date: 2026-04-09
---

PHP-FPM is how Nginx actually runs PHP. Without it, Nginx has no idea what to do with a `.php` file — it can only serve static content. PHP-FPM sits alongside Nginx as a separate process, maintains a pool of PHP workers ready to execute code, and communicates with Nginx via a Unix socket or TCP port.

Understanding PHP-FPM configuration is essential for WordPress performance and stability. Get it wrong, and you'll either exhaust server memory or starve yourself of capacity to handle concurrent requests.

## What PHP-FPM Does

When Nginx receives a request for a PHP file, it doesn't execute PHP directly. Instead, it passes the request over to PHP-FPM using the FastCGI protocol. PHP-FPM takes that request, assigns it to an available worker process, executes the PHP code, and returns the response to Nginx.

Each worker process is a full PHP interpreter that can handle one request at a time. If five requests arrive simultaneously, you need at least five available workers. If all workers are busy, incoming requests queue up and wait — or fail if the queue fills.

The Unix socket connection between Nginx and PHP-FPM (`/run/php/php8.4-fpm.sock` on a typical Debian setup) is faster than TCP loopback because it skips the network stack entirely.

## Process Management Modes

PHP-FPM offers three process management modes, and the choice matters significantly for WordPress.

**Static** mode starts a fixed number of worker processes at boot and keeps them running regardless of traffic. If you configure 10 workers, you always have 10 workers — no more, no less. Memory consumption is constant and predictable. Workers are always warm and ready.

**Dynamic** mode starts with a minimum number of workers and spawns additional ones under load, up to a configured maximum. Workers that have been idle for a while are killed. It sounds efficient, but spawning PHP workers under load adds latency at exactly the wrong moment. On a dedicated WordPress VPS, the "savings" from idle workers don't offset the cost of slow responses during traffic spikes.

**Ondemand** mode starts with zero workers and only spawns them when requests arrive. Maximum memory efficiency, maximum latency. Only makes sense for infrequently accessed sites where you're trying to fit many sites on one small server.

For production WordPress on a VPS with enough RAM, **static mode is the right choice**. You know your traffic patterns, you can calculate how many workers your RAM supports, and you want every request handled immediately without spawn delay.

## Calculating pm.max_children

The most important PHP-FPM setting is `pm.max_children` — the maximum number of worker processes. Setting it too low creates request queuing and timeouts under load. Setting it too high exhausts RAM, causing the OOM killer to terminate processes at the worst possible time.

The formula:

```
pm.max_children = (Available RAM for PHP) / (Average PHP process size)
```

Measure actual PHP process memory usage while the site is under load:

```bash
ps --no-headers -o rss -C php-fpm8.4 | awk '{ sum+=$1 } END { print sum/NR/1024 " MB average" }'
```

Typical WordPress PHP-FPM workers consume 30–80 MB each. A site with many plugins, WooCommerce, and page builders trends toward the high end. A lean WordPress install with few plugins can sit well under 40 MB.

On a 4 GB server running Nginx, MariaDB, Redis, and the OS, you might have 2.5 GB available for PHP. At 60 MB per worker, that gives you roughly 40 workers. I typically leave headroom and set something like 30 for a server running two or three WordPress sites.

## pm.max_requests: Memory Leak Protection

PHP processes accumulate memory over time, especially in complex WordPress installations with plugins that have memory leaks. `pm.max_requests` tells PHP-FPM to gracefully recycle a worker after it has handled a certain number of requests.

```ini
pm.max_requests = 500
```

When a worker hits its request limit, PHP-FPM retires it and spawns a fresh replacement. This prevents slow memory creep from ever accumulating into a problem. The recycling happens gracefully — the worker finishes its current request before exiting — so there's no impact on active requests.

## How Nginx Communicates with PHP-FPM

In Nginx site configuration, the FastCGI handoff looks like this:

```nginx
location ~ \.php$ {
    fastcgi_pass unix:/run/php/php8.4-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}
```

The `fastcgi_pass` directive points to the Unix socket. Nginx passes the request path, headers, and query parameters to PHP-FPM via the FastCGI protocol. PHP-FPM executes the script and streams the response back.

Unix sockets outperform TCP loopback (127.0.0.1:9000) on the same machine because they bypass the kernel's networking stack entirely.

## Worker Memory Profiling

Before setting `pm.max_children` in production, spend time profiling actual memory use. Workers during WordPress admin operations (plugin updates, bulk actions, import/export) use significantly more memory than workers serving cached front-end pages. Size your pool for the realistic peak, not just the happy path.

Monitoring PHP-FPM status is straightforward — enable the status page in the pool configuration and scrape it with a monitoring tool or query it directly. It reports active workers, idle workers, accepted connections, and queue depth. Queue depth above zero under normal load means your worker count is too low.

The full configuration I use for WordPress on Hetzner is documented in [Part 2 of the WordPress Infrastructure series](/blog/wp-infra-02-building-the-lemp-stack).
