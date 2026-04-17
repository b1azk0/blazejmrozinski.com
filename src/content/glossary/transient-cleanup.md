---
term: "Transient Cleanup"
seoTitle: "What Are WordPress Transients and How to Clean Them Up"
description: "WordPress transients are short-lived cached values stored in wp_options. Learn how orphaned transients accumulate, slow the database, and how to clean them on a schedule."
definition: "Transient cleanup is the periodic removal of expired and orphaned WordPress transients — short-lived cached values stored in the wp_options table that persist past their expiry and bloat the database."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-06-automating-the-boring-parts"
  - "blog/wp-infra-04-four-layers-of-caching"
relatedTerms:
  - "redis-object-cache"
  - "cache-warming"
  - "cron"
status: published
date: 2026-04-17
---

WordPress transients are a built-in short-term cache API — a simple way for plugins and themes to stash a value for a few minutes or hours without needing their own storage. The problem is that the default backing store is the `wp_options` table, and WordPress doesn't reliably delete transients when they expire. Over months, a busy site accumulates thousands of stale rows, many flagged as autoloaded, which means they get pulled into memory on every single page load. Transient cleanup is the maintenance job that removes them.

## What Transients Are

The API is intentionally simple: `set_transient($key, $value, $expiration)` writes a value with a TTL, and `get_transient($key)` reads it back if it hasn't expired. Plugins use transients for anything too expensive to recompute per request but too ephemeral to store permanently — API response caches, dashboard widget data, menu hierarchies, oEmbed lookups.

By default, transients live in `wp_options` as two rows per transient: one for the value (`_transient_<key>`) and one for the expiry timestamp (`_transient_timeout_<key>`). When an object cache is configured — [Redis object cache](/glossary/redis-object-cache/) being the typical choice — transients are transparently redirected there instead, with actual TTL enforcement handled by Redis. That difference matters: Redis expires keys on its own; the database does not.

## Why They Leak

Three common failure modes produce orphaned transients:

1. **Plugin deactivation without cleanup.** A plugin sets transients while active, gets deactivated or deleted, and leaves its rows behind. The keys still exist; nothing reads them; nothing deletes them.
2. **No automatic GC on the database backend.** WordPress's contract for transients is "may be deleted at any time" — but in practice, the DB-backed implementation only purges a transient when code asks for it and finds it expired. Transients that are written and never read again sit there forever.
3. **Autoloaded transients.** Some plugins set transients with `autoload=yes` so they load with every page request. When those transients go stale but aren't cleaned up, every page load pulls megabytes of useless data out of MariaDB into PHP memory.

## How to Detect Bloat

Two queries give you the picture quickly. First, row count:

```sql
SELECT COUNT(*) FROM wp_options WHERE option_name LIKE '%_transient_%';
```

Then the autoloaded payload size — the number that actually affects every request:

```sql
SELECT SUM(LENGTH(option_value)) FROM wp_options WHERE autoload='yes';
```

On a healthy site, autoloaded options total a few hundred kilobytes. Over 1 MB is a red flag; over 5 MB means every request is dragging a small novel through PHP before rendering anything. Transients are frequent offenders, but not the only ones — any autoloaded option that grows unchecked has the same effect.

## Cleanup Patterns

The standard tool is WP-CLI. The command `wp transient delete --expired` walks the transient list and removes anything past its expiry timestamp. For a more aggressive sweep on a sufficiently broken installation, `wp transient delete --all` drops everything, accepting that the next few requests will repopulate what's actually in use.

The job goes on a [cron](/glossary/cron/) schedule, typically daily or weekly depending on how fast the site accumulates cruft:

```
30 3 * * * cd /var/www/example.com && wp transient delete --expired >> /var/log/wp-maintenance.log 2>&1
```

On a Redis-backed site, DB transients still exist for anything written before Redis was enabled, but new writes bypass the database. Running the cleanup once after enabling Redis clears the historical backlog; after that, the TTL-based expiry in Redis handles everything and the DB stays clean.

One caveat: `wp transient delete --expired` only sees rows that correctly match the timeout pattern. Plugins that set transients incorrectly — missing the timeout row, or using non-standard naming — won't get caught. For those, a targeted SQL `DELETE` by option name prefix is the fallback, once you've confirmed the offending plugin and checked that nothing legitimate matches. Combined with [cache warming](/glossary/cache-warming/) after cleanup, the site stays fast and the database stays lean. I walk through the full automation setup in the [WordPress infrastructure series](/blog/wp-infra-06-automating-the-boring-parts).
