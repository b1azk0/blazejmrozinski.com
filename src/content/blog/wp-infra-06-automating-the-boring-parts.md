---
title: "Automating the Boring Parts: Backups, Maintenance, and Zero-Touch Operations"
date: 2026-05-04
series: "WordPress Infrastructure from Scratch"
series_part: 6
tags: [devops-reality, wordpress, hetzner, server-backend, automation, backups, woocommerce]
audience: [founders-operators, ai-practitioners]
format: deep-dive
description: "Building the nightly automation chain: WordPress backups, database maintenance, plugin distribution, 5-phase cache warming, and full server snapshots, all running unattended."
status: published
label: infrastructure
safety_review: false
---

> *This is Part 6 of "WordPress Infrastructure from Scratch," a hands-on guide to building production WordPress and WooCommerce hosting on Hetzner. Code and configs at the [companion repository](https://github.com/b1azk0/wordpress-infrastructure) under `06-automation/`.*

## Table of Contents

- [Infrastructure That Works While You Sleep](#infrastructure-that-works-while-you-sleep)
- [The Cron Chain](#the-cron-chain)
- [wp-backup: Site-Level Backups to Cloud Storage](#wp-backup-site-level-backups-to-cloud-storage)
- [wp-maintain v3: The Database Cleanup Beast](#wp-maintain-v3-the-database-cleanup-beast)
- [wp-plugin-sync: Cloud Storage as Plugin Distribution](#wp-plugin-sync-cloud-storage-as-plugin-distribution)
- [wp-cache-warm v3: Five-Phase Cache Warming](#wp-cache-warm-v3-five-phase-cache-warming)
- [server-snapshot: Full Server Backup with Restic](#server-snapshot-full-server-backup-with-restic)
- [Logging and Verification](#logging-and-verification)
- [What's Next](#whats-next)

## Infrastructure That Works While You Sleep

A server that works today but needs manual attention every morning is a chore, not infrastructure. I have 10 sites across 4 servers. If maintenance requires me to SSH in and run things by hand, something has already gone wrong.

This was the realization that changed my approach to the whole setup. The individual pieces I covered in earlier posts, the web server, the caching layers, the security hardening, all of it only works as infrastructure if it maintains itself. A well-tuned Nginx config means nothing if the database behind it is bloated with 50,000 expired transients and orphan metadata rows. A Redis object cache is useless if nobody primes it after the nightly cleanup flushes everything.

So I built an automation chain that handles everything between midnight and sunrise: site backups, database maintenance, plugin distribution, and cache warming. All orchestrated through cron, with each step depending on the previous one succeeding. By the time I check my phone in the morning, every site has been backed up, cleaned, potentially updated, and warmed to full operating temperature. Here is exactly how it works.

## The Cron Chain

The entire nightly operation is governed by a sequence of cron jobs that run in a specific order for specific reasons.

```
# /etc/cron.d/wp-backup
0 3 * * *  root  /usr/local/bin/wp-backup && /usr/local/bin/wp-maintain

# /etc/cron.d/wp-plugin-sync (staggered per server)
15 3 * * *  root  /usr/local/bin/wp-plugin-sync

# /etc/cron.d/wp-cache-warm
0 4 * * *  root  /usr/local/bin/wp-cache-warm --all

# /etc/cron.d/wp-healthcheck (covered in Post 7)
*/5 * * * *  root  /usr/local/bin/wp-healthcheck

# /etc/cron.d/server-snapshot (weekly, Sundays)
30 5 * * 0  root  /usr/local/bin/server-snapshot
```

The order matters. Backup runs first at 3:00 AM because you always want a clean backup before anything else touches the data. Maintenance is chained to backup with `&&`, which means it only runs if the backup completed without errors. If backup fails, the entire chain stops. I would rather skip a night of cleanup than run maintenance on a server where the backup just failed.

Plugin sync runs at 3:15 AM, giving backup and maintenance time to finish on most sites. Cache warming runs at 4:00 AM, after maintenance has flushed Redis and the FastCGI cache. There is no point warming caches before the cleanup script blows them away. The weekly server snapshot runs at 5:30 AM on Sundays, after everything else is done.

The health check runs every 5 minutes, all day, independent of the nightly chain. That one gets its own post.

## wp-backup: Site-Level Backups to Cloud Storage

The backup script auto-discovers every WordPress installation on the server by scanning for `wp-config.php` files under `/var/www/*/public`. No hardcoded site lists to maintain. Add a new site to the server, and it gets backed up automatically the next night.

For each discovered site, the script creates a `.wpress` backup using All-in-One WP Migration's CLI extension. The backup excludes things that don't need preserving: spam comments, post revisions, and plugin cache directories. This keeps the backup files significantly smaller without losing anything that matters.

```bash
# Core backup command per site (simplified from the full script)
sudo -u www-data wp ai1wm backup \
    --exclude-spam-comments \
    --exclude-post-revisions \
    --exclude-cache \
    --skip-plugins=wp-mail-smtp-pro \
    --path="$SITE_PATH"
```

That `--skip-plugins=wp-mail-smtp-pro` flag deserves explanation. WP Mail SMTP Pro, when loaded without a fully configured mailer, hangs the entire WP-CLI process. Every single script in the automation chain includes this flag. It took two nights of mysteriously stalled backups to figure out what was happening. The plugin tries to initialize its mailer transport on load, and if the transport configuration is incomplete or the mail server is unreachable, it just sits there. Indefinitely. Now every WP-CLI invocation across every script skips it.

After backup creation, the file gets renamed with a clear convention: `{sitename}_{date}_{daily|weekly}.wpress`. Sunday backups are tagged as `weekly`. Everything else is `daily`. The script then uploads via rclone to cloud storage, organized into per-site folders.

Retention is straightforward: 10 daily backups plus 4 weekly backups per site. The script handles cleanup after each upload, deleting dailies older than 10 days and weeklies older than 28 days from cloud storage. Local backup files are deleted after successful upload. If the upload fails, the local file stays, and the script logs an error and continues to the next site.

**The rclone version gotcha.** This one cost me hours. Debian's packaged rclone (version 1.60 in the repos) has write bugs with certain cloud storage providers. Uploads would silently fail or produce corrupted files. The fix is to install rclone from the official install script instead of using apt:

```bash
# Do NOT use: apt install rclone
# Instead:
curl -s https://rclone.org/install.sh | sudo bash
rclone version  # Verify you're on 1.70+
```

This is the kind of thing that makes server administration interesting. A backup system that runs perfectly in testing, then silently produces corrupt backups in production, all because the system package is two minor versions behind and has a known regression with your specific cloud provider's API.

## wp-maintain v3: The Database Cleanup Beast

This is the largest script in the chain, and the one that does the most work. WordPress databases accumulate an extraordinary amount of dead data over time. Expired transients pile up in the options table. Deleted posts leave orphan metadata behind. WooCommerce sessions expire but the rows stay. Action Scheduler logs completed tasks but never cleans them up. Every plugin has its own idea of what "cleanup" means, and most of them mean "never."

The maintenance script attacks this problem systematically, targeting 15 categories of waste data across every site on the server.

**Transient cleanup, the two-layer approach.** WP-CLI's `transient delete --expired` catches the obvious cases, but it misses a class of orphans that accumulate silently. WordPress stores transients as pairs of entries in the options table: `_transient_timeout_foo` holds the expiry timestamp, and `_transient_foo` holds the data. When WP-CLI deletes expired transients, it sometimes leaves behind orphan data entries where the timeout entry was already gone. The script runs a second pass via direct SQL, matching timeout entries against their data counterparts and cleaning up anything that was missed. It also handles site transients separately, because WordPress stores those as `_site_transient_timeout_*` with a different prefix pattern.

**Content cleanup.** Auto-drafts (created automatically every time someone clicks "New Post" in the admin), trashed posts, spam comments, trashed comments. All of these accumulate indefinitely by default. The script removes them all, every night.

**Orphan metadata.** This is one of the more interesting cleanup targets. When you delete a post, WordPress removes the post row but often leaves behind its `postmeta` entries. Same with comments and `commentmeta`. Over months, a WooCommerce site can accumulate thousands of metadata rows pointing to posts and comments that no longer exist. The script runs a foreign key reference check and deletes any metadata where the parent record is gone:

```sql
-- Orphan postmeta: metadata pointing to deleted posts
DELETE FROM wp_postmeta
WHERE post_id NOT IN (SELECT ID FROM wp_posts);

-- Orphan commentmeta: metadata pointing to deleted comments
DELETE FROM wp_commentmeta
WHERE comment_id NOT IN (SELECT comment_ID FROM wp_comments);
```

**Plugin-specific cleanup.** Before running any plugin-specific queries, the script checks `information_schema.tables` to verify the target table actually exists. This matters because not every site runs the same plugins. A WooCommerce cleanup query running against a site without WooCommerce installed would error out and break the chain. The script handles:

- **Action Scheduler:** Purges completed, canceled, and failed tasks older than 1 day, including their associated log entries. Action Scheduler is used by WooCommerce, Rank Math, and dozens of other plugins. On a busy WooCommerce store, it can generate thousands of completed task entries per day.
- **WooCommerce sessions:** Deletes expired shopping cart sessions. These pile up especially on stores with lots of browsing traffic.
- **Merchant plugin analytics and sales notifications:** Purges entries older than 7 days.
- **Rank Math 404 logs:** Purges entries older than 30 days.
- **WP Mail SMTP logs:** Purges email log entries older than 30 days.
- **WooCommerce logs:** Purges log entries older than 30 days.
- **Stale oEmbed cache:** WordPress caches embed HTML (YouTube videos, tweets, etc.) as postmeta. After 90 days, this data is stale and will be regenerated on next page view anyway. The script cleans up both the cached data and its associated timestamp entries.

**Weekly operations (Sundays only).** Some operations are too expensive or unnecessary to run daily. The script checks the day of week and runs three additional tasks on Sundays:

- **OPTIMIZE TABLES** on all database tables, which reclaims disk space after heavy DELETE operations and rebuilds indexes.
- **Revision trimming:** Keeps the 5 most recent revisions per post, deletes everything older. This uses a window function (`ROW_NUMBER() OVER (PARTITION BY post_parent ORDER BY post_date DESC)`) to rank revisions and trim the excess.
- **Elementor CSS cache rebuild:** If Elementor is active, it regenerates all compiled CSS files. This prevents stale styling from accumulating.

**Update reporting.** At the end of each site's cleanup, the script checks for available WordPress core and plugin updates. It reports them in the log but never auto-installs anything. Automated updates for WordPress core and plugins can break sites in ways that are hard to diagnose at 3 AM. The logs tell me what's available, and I decide when and how to apply updates. Plugin updates specifically go through a separate distribution system, which I'll cover next.

**Cache flush.** After all cleanup is done, the script flushes the Redis object cache for each site and reloads Nginx to clear the FastCGI page cache. This sets the stage for the cache warming script that runs an hour later.

The script reports before/after database sizes for each site, so I can see exactly how much dead data was removed. On a busy WooCommerce store, it's common to see 10 to 50 MB reclaimed per night.

## wp-plugin-sync: Cloud Storage as Plugin Distribution

Plugin management across multiple servers is one of those problems that sounds simple until you're actually doing it. I have 10 sites across 4 servers. When I buy a premium plugin update or need to deploy a specific version, I need it installed everywhere that plugin exists, and nowhere else.

The approach: cloud storage as a plugin drop folder. I upload a plugin zip file to a designated folder in cloud storage. Every server runs `wp-plugin-sync` after backup and maintenance, checks that folder, and processes any new zips.

The key design decisions were all about multi-server safety:

**Copy, never move.** Each server copies zip files from cloud storage rather than moving them. This prevents race conditions where one server grabs a file before others have seen it. A local state file per server (`/var/lib/wp-plugin-sync/processed.json`) tracks which zips have already been processed, keyed by filename and file size. Servers that run at staggered times (3:15, 3:25, 3:35, 3:45 across four servers) all see the same files and independently decide whether they've already handled them.

**Only update, never install.** The script identifies the plugin slug from the zip file structure, then checks every WordPress site on the server for that plugin. If the plugin is already installed, it gets updated. If it's not installed on a particular site, nothing happens. This is a deliberate safety constraint. I never want a script automatically installing new plugins on sites. That decision always requires human judgment.

**Designated cleanup server.** One server in the fleet is configured as the cleanup server (via an environment variable). After processing, only that server moves completed zips to a `done/` subfolder. The other servers just mark them as processed locally and move on.

**Inventory generation.** Before and after processing updates, the script generates a complete plugin inventory as JSON (`/var/www/plugin-inventory.json`). Every plugin on every site, with name, version, and active status. This gives me a single file I can check to see exactly what's running where.

After any updates are applied, the script flushes both Redis and FastCGI caches across all sites. The FastCGI cache flush uses an atomic rename pattern: rename the cache directory, create a new empty one, reload Nginx, then delete the old directory in the background. This avoids a window where Nginx has no cache directory and errors on requests.

## wp-cache-warm v3: Five-Phase Cache Warming

Cache warming is the step most people skip, and it's the step that makes the most difference to real-world user experience. After the maintenance script has flushed every cache on the server, your sites are running cold. The first visitor to each page pays the full cost of a cold PHP render, uncached database queries, and an empty object cache. That first pageview can easily take 3 to 5 seconds on a WooCommerce store. Multiply that across your most important pages, and you've got a window of terrible performance that lasts until organic traffic gradually warms things up.

The cache warming script eliminates that window by systematically warming every layer of the caching stack, in the right order, before any real user hits the site.

**Phase 1: Redis object cache priming.** This phase runs PHP via WP-CLI's `wp eval` to trigger WordPress to load and cache frequently-accessed options and data structures. It primes `alloptions` (the big batch of autoloaded options), active plugin list, theme and stylesheet data, rewrite rules, sidebar widgets, navigation menus, and theme mods. For WooCommerce sites, it additionally primes shop/cart/checkout page IDs, currency settings, price formatting, product category trees, attribute taxonomies, shipping zones, and payment gateway lists. Shipping zone queries are particularly expensive because they involve geographic lookups, and having them pre-cached in Redis means the first checkout visitor gets the same response time as the thousandth.

**Phase 2: Critical pages.** The script hits the homepage and a set of common landing page slugs. For WooCommerce sites, it also warms the shop page. This phase reports TTFB (time to first byte) for the homepage, giving me a performance baseline in the logs.

**Phase 3: Taxonomy archives.** Category pages, tag archives, and product category pages on WooCommerce stores. These are high-traffic landing pages that are expensive to render because they involve post queries with taxonomy joins. Up to 50 category archives and 20 tag archives get warmed per site.

**Phase 4: Full sitemap crawl.** The script downloads the XML sitemap (trying `/sitemap_index.xml`, `/sitemap.xml`, and `/wp-sitemap.xml` in order), follows any child sitemaps, and warms every URL found. If no sitemap exists, it falls back to WP-CLI to enumerate all published posts, pages, and products. The URL count is capped at 2,000 per site to prevent the warming process from taking unreasonably long on large sites.

**Phase 5: Feeds and REST API endpoints.** RSS feeds, Atom feeds, and the WP JSON API root. For WooCommerce sites, the store API cart and products endpoints. These get hit by bots, feed readers, and plugin integrations, and having them cached means those requests don't generate PHP work.

All URL warming runs with 10 concurrent requests via `xargs -P`, which provides good throughput without overwhelming the server. Each request has a 15-second timeout. At the end of each site's warming cycle, the script checks the FastCGI cache header on the homepage to verify that the page cache is actually working.

```bash
# Verify cache status after warming
curl -sI "$SITE_URL/" | grep -i "x-fastcgi-cache"
# Expected: X-FastCGI-Cache: HIT
```

The full warming cycle typically takes 2 to 5 minutes per site, depending on the number of pages. For 10 sites, the entire process finishes well within the hour window between 4:00 and 5:00 AM.

## server-snapshot: Full Server Backup with Restic

The WordPress backups cover site data. But a full disaster recovery requires more than database dumps and media files. You need the Nginx configs, the PHP-FPM pools, the SSL certificates, the cron entries, the firewall rules, everything that makes a bare Debian server into a functioning WordPress host. Rebuilding all of that from scratch, even with documentation, takes hours. Having a full filesystem snapshot means you can restore to a known-good state in minutes.

The server snapshot script uses restic for deduplicated, encrypted backups to cloud storage. Before running the backup, it creates a MariaDB dump of all databases using `--single-transaction` to ensure consistency without locking tables. Then it backs up the entire filesystem with targeted exclusions:

```bash
# Exclusions: virtual/temp/cache filesystems
--exclude=/proc
--exclude=/sys
--exclude=/dev
--exclude=/run
--exclude=/tmp
--exclude=/var/cache
--exclude=/var/log/journal
--exclude=/swap
--exclude=/swapfile
```

These exclusions strip out virtual filesystems, temporary data, and the systemd journal (which can be enormous and isn't needed for restore). Everything else, including `/var/www`, `/etc`, `/root`, `/usr/local`, gets captured.

Restic handles encryption (via a password in `/root/.restic-env`), deduplication (only changed blocks get uploaded), and compression automatically. The retention policy keeps 4 weekly snapshots, applied via `restic forget --keep-weekly 4 --prune`. Old snapshots are removed and deduplicated storage is reclaimed in a single operation.

The script runs weekly on Sundays at 5:30 AM, after the full nightly chain has completed. Auto-initialization handles the first run on a new server: if no restic repository exists at the configured remote path, the script creates one automatically.

## Logging and Verification

Every script in the chain writes to `/var/log/wp-backups/` (or `/var/log/server-snapshots/` for the server snapshot) with dated filenames:

```
/var/log/wp-backups/backup-2026-04-05.log
/var/log/wp-backups/maintain-2026-04-05.log
/var/log/wp-backups/plugin-sync-2026-04-05.log
/var/log/server-snapshots/snapshot-2026-04-05.log
```

All logs are retained for 30 days, then automatically cleaned up. The cron entries also redirect output to a `cron.log` file as a secondary capture.

My morning verification routine is simple. I check the maintenance log for any site where the cleanup count is unusually high (which might indicate a plugin misbehaving and generating excessive transients or action scheduler entries). I check the backup log for any upload failures. I check the plugin sync log if I dropped a new zip into cloud storage the day before. And I glance at the cache warm output to confirm TTFB numbers are in the expected range.

When things are running normally, this takes about 30 seconds. The logs are designed to be scannable: each section is clearly labeled per site, errors are prominently marked, and summary lines give you the high-level picture without requiring you to read every detail.

The maintenance script also serves as an early warning system for update availability. Every night, it logs which WordPress core versions and plugin updates are available. I don't get surprised by security patches. They show up in the logs the morning they're released, and I decide when to apply them.

## What's Next

The automation chain described here handles the routine. Backups protect against data loss. Maintenance keeps databases lean. Plugin sync handles distribution. Cache warming ensures first-visitor performance. Server snapshots enable full disaster recovery.

All of these scripts connect back to the infrastructure covered in earlier posts. The plugins being synced are the ones configured in [Part 3](/blog/wp-infra-03-deploying-wordpress). The caches being warmed are the FastCGI and Redis layers from [Part 4](/blog/wp-infra-04-four-layers-of-caching). The security hardening from [Part 5](/blog/wp-infra-05-locking-it-down) protects the server that all of this runs on.

What this chain doesn't handle is detection. If the server goes down at 3 AM, if Nginx stops responding, if a site starts returning 500 errors, if SSL certificates are about to expire, nothing in this automation chain will notice. The nightly chain assumes the server is healthy and keeps it clean. Knowing when the server stops being healthy is a different problem, and it's the subject of the final post.

---

## WordPress Infrastructure from Scratch — Full Series

1. [Why I Ditched Managed Hosting](/blog/wp-infra-01-why-i-ditched-managed-hosting)
2. [Building the LEMP Stack](/blog/wp-infra-02-building-the-lemp-stack)
3. [Deploying WordPress the Right Way](/blog/wp-infra-03-deploying-wordpress)
4. [Four Layers of Caching](/blog/wp-infra-04-four-layers-of-caching)
5. [Locking It Down](/blog/wp-infra-05-locking-it-down)
6. [Automating the Boring Parts](/blog/wp-infra-06-automating-the-boring-parts)
7. [Watching Over It All](/blog/wp-infra-07-watching-over-it-all)
