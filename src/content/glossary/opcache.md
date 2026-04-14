---
term: "OPcache"
seoTitle: "PHP OPcache Explained: Opcode Caching, JIT Compilation & WordPress Speed"
description: "OPcache compiles PHP files once and caches the opcodes in memory. Learn how OPcache and JIT compilation dramatically speed up WordPress page generation."
definition: "OPcache is PHP's built-in opcode cache that stores pre-compiled script bytecode in shared memory, eliminating the need to parse and compile PHP files on every request."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-02-building-the-lemp-stack"
relatedTerms:
  - "php-fpm"
  - "lemp-stack"
  - "fastcgi-cache"
  - "redis-object-cache"
  - "fail2ban"
status: published
date: 2026-04-09
---

OPcache is one of the easiest performance wins in a PHP stack, and it ships with PHP 8.x by default. Without OPcache, PHP parses and compiles every script on every request. With OPcache, that work happens once and the result lives in shared memory. Every subsequent request gets the pre-compiled version for free.

For WordPress — which loads dozens to hundreds of PHP files per request — this matters.

## What PHP Does Without OPcache

PHP is an interpreted language, which means it goes through several steps before executing code:

1. **Parse** — read the raw `.php` file from disk and build a token stream
2. **Compile** — convert tokens into opcodes (machine-readable bytecode instructions)
3. **Execute** — run the opcodes

Without OPcache, steps 1 and 2 happen on every single request, for every PHP file loaded. A typical WordPress page request loads `wp-load.php`, the active theme, and potentially 30–50 plugin files. Parse and compile those on every pageview and you're burning CPU cycles on work that produces the same result every time.

OPcache eliminates steps 1 and 2 for all scripts that haven't changed. The compiled opcodes are stored in shared memory accessible by all [PHP-FPM](/glossary/php-fpm/) worker processes. Worker A compiles `wp-settings.php` once; every other worker reads the cached opcodes directly.

## Key Configuration Settings

**`opcache.memory_consumption`** — how much shared memory OPcache is allowed to use, in megabytes. WordPress core plus plugins can easily consume 128–256 MB of compiled opcodes. If this is set too low, OPcache starts evicting entries, and you lose the cache benefit for some scripts. I set this to 256 MB on production servers.

**`opcache.max_accelerated_files`** — the maximum number of files OPcache will cache. WordPress with a dozen plugins can easily exceed 10,000 files. Check the actual count with `find /var/www -name "*.php" | wc -l` and set this comfortably above it. Common safe value: 20000.

**`opcache.validate_timestamps`** — when enabled (the default), PHP checks whether each cached file has been modified on disk before using the cached version. This is safe and necessary during active development. In production where the codebase doesn't change mid-request, you can set this to `0` to eliminate the file stat calls entirely. When you deploy new code, restart PHP-FPM to flush the cache.

**`opcache.revalidate_freq`** — if `validate_timestamps` is on, this controls how often PHP checks for file changes (in seconds). Setting it to `0` means "check every request." Setting it to `60` means "check once per minute." In production with `validate_timestamps=1`, a higher value reduces filesystem overhead.

## JIT Compilation in PHP 8.x

PHP 8.0 introduced JIT (Just-In-Time) compilation. JIT goes beyond opcode caching — instead of interpreting opcodes at runtime, it compiles them further down into native machine code the CPU can execute directly.

OPcache and JIT are configured together. The key setting is `opcache.jit_buffer_size` and `opcache.jit`.

The JIT mode value that matters most is `1255`. This is a four-digit code that controls JIT behavior:

- First digit (1): use tracing JIT
- Second digit (2): profile hot functions
- Third digit (5): compile hot functions aggressively
- Fourth digit (5): maximum optimization level

```ini
opcache.jit = 1255
opcache.jit_buffer_size = 128M
```

JIT delivers the most significant gains for compute-heavy PHP code — number crunching, complex loops, mathematical operations. WordPress is relatively I/O-bound (database queries dominate), so the gains from JIT alone are more modest than for pure computation. But they're real, and the cost of enabling it is just reserved memory.

## OPcache + JIT: The Relationship

OPcache is a prerequisite for JIT. JIT works on the opcodes that OPcache already compiled and cached. The flow with both enabled:

1. First request: PHP parses and compiles the file → opcodes stored in OPcache
2. JIT identifies "hot" code paths (frequently executed)
3. Hot paths get compiled to native machine code, stored in the JIT buffer
4. Subsequent requests: hot paths execute as native machine code, cold paths use cached opcodes

You can't have JIT without OPcache. You can have OPcache without JIT — and that alone is a substantial win.

## Impact on WordPress

A properly configured OPcache typically cuts PHP execution time by 30–50% on a fresh server compared to no caching. The gain is most visible on first-request-per-worker-process startup and on admin pages where [FastCGI cache](/glossary/fastcgi-cache/) doesn't apply (logged-in users bypass FastCGI cache by design).

For front-end visitors hitting a warm FastCGI cache, OPcache's contribution is secondary — PHP might not run at all. But for cache misses, admin users, WooCommerce checkout, and AJAX requests, OPcache is directly in the critical path. It works well alongside [Redis object cache](/glossary/redis-object-cache/), which handles the database-query side of the same problem.

Full OPcache and JIT configuration for my Hetzner WordPress setup is in [Part 2 of the WordPress Infrastructure series](/blog/wp-infra-02-building-the-lemp-stack).
