---
title: "WordPress Server Monitoring: Self-Healing Healthchecks, Status Dashboards, and Telegram Alerts"
date: 2026-04-27
tags: [devops-reality, wordpress, hetzner, server-backend, monitoring, automation, woocommerce]
audience: [founders-operators, ai-practitioners]
format: deep-dive
topics: [devops, wordpress-infrastructure]
series: wp-infrastructure
seriesIndex: 7
description: "Three-layer WordPress server monitoring: a self-healing cron healthcheck that auto-restarts services, a diagnostic status dashboard, and an external Telegram bot for downtime alerts and disaster recovery."
status: published
label: infrastructure
safety_review: false
---

> *This is Part 7 of "WordPress Infrastructure from Scratch," a hands-on guide to building production WordPress and WooCommerce hosting on Hetzner. Code and configs at the [companion repository](https://github.com/b1azk0/wordpress-infrastructure).*

## Table of Contents

- [Why WordPress Servers Need Monitoring](#why-wordpress-servers-need-monitoring)
- [Self-Healing Healthcheck Script for WordPress Services](#self-healing-healthcheck-script-for-wordpress-services)
- [WordPress Server Status Dashboard](#wordpress-server-status-dashboard)
- [Automated WordPress Diagnostics and Repair Tool](#automated-wordpress-diagnostics-and-repair-tool)
- [Telegram Bot for External WordPress Uptime Monitoring](#telegram-bot-for-external-wordpress-uptime-monitoring)
- [WordPress Server Log Analysis and Resource Planning](#wordpress-server-log-analysis-and-resource-planning)
- [WordPress Security and SEO Audit Scripts](#wordpress-security-and-seo-audit-scripts)
- [WordPress Disaster Recovery from Backups](#wordpress-disaster-recovery-from-backups)
- [Scaling WordPress Across Multiple Hetzner Servers](#scaling-wordpress-across-multiple-hetzner-servers)
- [WordPress Infrastructure from Scratch: Series Summary](#wordpress-infrastructure-from-scratch-series-summary)

## Why WordPress Servers Need Monitoring

Seven posts ago, this was a blank terminal with a Hetzner IP address. The infrastructure is built now. The LEMP stack is tuned (Post 3), the sites are migrated (Post 4), security is layered and tested (Post 5), and nightly maintenance runs itself (Post 6). Everything works. The question becomes: how do you know when it stops working?

The honest answer, for the first few weeks, was constant checking. I'd SSH into servers at odd hours to run `systemctl status` commands, refresh access logs, watch memory usage. That doesn't scale, and it doesn't let you sleep. The whole point of automation is to stop babysitting, so I built three monitoring layers that together cover the full range of problems I care about. A self-healing script handles routine service failures automatically. An on-demand dashboard gives me deep inspection when I want it. And a Telegram bot watches everything from a separate server, sending alerts only when something genuinely needs my attention.

The goal is specific: sleep through the night and trust that problems either fix themselves or wake me up.

## Self-Healing Healthcheck Script for WordPress Services

The healthcheck script runs every 5 minutes via cron on every server. Its job is simple: check the critical services, restart anything that has died, and log what happened. If everything is fine, it logs a clean run and exits 0. If something needed fixing, it logs the fix and still exits 0 (because the fix worked). If something is genuinely broken and the script can't heal it, that's a different problem, and the Telegram bot will catch it from the outside.

The checks run in sequence: PHP-FPM, Nginx, fail2ban, MariaDB, Redis, disk space, memory, and log sizes. Each check follows the same pattern. Is the service running? If not, restart it. Is it responding to a basic probe? If not, restart it. Log the outcome either way.

Here's what the PHP-FPM check actually does, because it's the most nuanced one:

```bash
# 1. Is the service running?
if ! systemctl is-active --quiet "php8.4-fpm"; then
    systemctl restart "php8.4-fpm"
    return
fi

# 2. Does the socket exist?
if [ ! -S "/run/php/php8.4-fpm.sock" ]; then
    systemctl restart "php8.4-fpm"
    return
fi

# 3. Can PHP actually execute code?
TEST_RESULT=$(php -r 'echo "OK";' 2>/dev/null || echo "FAIL")
if [ "$TEST_RESULT" != "OK" ]; then
    systemctl restart "php8.4-fpm"
    return
fi

# 4. Are there too many genuine upstream errors?
# Only counts real failures: timed out, refused, reset, prematurely closed
# Ignores "Primary script unknown" (scanner probes, covered in Post 5)
ERROR_COUNT=$(... grep upstream errors from last 5 minutes ...)
if [ "$ERROR_COUNT" -gt 20 ]; then
    systemctl restart "php8.4-fpm"
fi
```

That last check is the one I'm proudest of. Nginx error logs fill up with "Primary script unknown" entries from bots probing random PHP files that don't exist. These are the scanner probes I described in Post 5. They look alarming but they're completely harmless. The healthcheck specifically filters those out and only counts genuine upstream failures: timeouts, refused connections, connection resets, prematurely closed connections. If more than 20 of those accumulate in a 5-minute window, PHP-FPM is actually struggling and gets a restart.

The other checks are more straightforward. Nginx gets tested with a quick HTTP request to localhost. MariaDB gets a `mysqladmin ping`. Redis gets a `PING`/`PONG` exchange. fail2ban has a particular quirk where the socket file can survive after a crash while the daemon is gone, so the script checks both the systemd status and the socket responsiveness, and if the socket is stale, it removes it before restarting.

Disk and memory checks use hard thresholds:

| Resource | Warning | Critical | Auto-fix |
|----------|---------|----------|----------|
| Disk | >80% | >90% | Vacuum journalctl, purge /tmp, apt clean |
| Memory | <256MB available | <100MB available | Drop page caches |
| Log files | -- | >100MB | Truncate to last 10,000 lines |

The memory fix deserves a note. When available RAM drops below 100MB, the script writes to `/proc/sys/vm/drop_caches`, which tells Linux to release cached memory back to the available pool. This is safe and non-destructive. The kernel will re-populate its caches as needed. It buys time for a WooCommerce traffic spike to pass without triggering the OOM killer.

A healthy output looks like this:

```
[2026-03-15 04:10:00] --- Health check start ---
[2026-03-15 04:10:00] OK PHP-FPM (php8.4-fpm)
[2026-03-15 04:10:00] OK Nginx (HTTP 301)
[2026-03-15 04:10:00] OK fail2ban
[2026-03-15 04:10:00] OK MariaDB
[2026-03-15 04:10:00] OK Redis
[2026-03-15 04:10:00] OK Disk: 20% used
[2026-03-15 04:10:00] OK Memory: 2287MB available
[2026-03-15 04:10:00] All OK
[2026-03-15 04:10:00] --- Health check end ---
```

Most of the time, that's all you see. Pages and pages of clean runs, 288 per day, per server. When something does break, you get a different story:

```
[2026-03-15 04:15:00] --- Health check start ---
[2026-03-15 04:15:00] WARN fail2ban is not running
[2026-03-15 04:15:00] FIX Restarted fail2ban (stale socket)
[2026-03-15 04:15:00] OK PHP-FPM (php8.4-fpm)
...
[2026-03-15 04:15:00] Found 1 issues, auto-fixed 1
[2026-03-15 04:15:00] --- Health check end ---
```

That fail2ban restart happens maybe once a month. Without the healthcheck, I wouldn't notice until the next time I logged in, which could be days. Meanwhile the server would be running without brute force protection.

## WordPress Server Status Dashboard

The healthcheck handles emergencies. The status dashboard handles curiosity. When I want a complete picture of a server, I run `wp-status` and get an 11-section report covering everything from uptime to SEO configuration.

The sections break down like this:

| Section | What It Reports |
|---------|-----------------|
| System | Uptime, load averages, memory/swap usage, ZRAM compression, disk |
| Services | Status and restart count for Nginx, PHP-FPM, MariaDB, Redis, fail2ban |
| Sites | Per-site: HTTP status, TTFB, SSL certificate expiry, canonical URL |
| Plugins | Active count, pending updates, key plugin status (Object Cache Pro, Perfmatters, RankMath) |
| Backups | Last OneDrive backup age per site |
| Maintenance | Last wp-maintain and wp-plugin-sync run times |
| Cache | FastCGI cache size, Redis hit rate + memory + key count, OPcache config |
| Security | Fail2ban jail stats, login attempt counts |
| Errors | PHP-FPM errors, Nginx errors (separating real errors from bot probes), MariaDB warnings |
| Updates | Available OS package upgrades, stack version numbers |
| SEO | robots.txt, sitemap, and llms.txt status per site |

The thresholds are calibrated to match what I actually care about. SSL certificates below 7 days trigger a critical alert. Below 30 days, a warning. Memory above 90% is critical. Disk above 80% is a warning. Redis hit rate below 80% is a warning, because that usually means the cache is either misconfigured or starved for memory.

The error section is worth explaining because it applies the same filtering logic as the healthcheck. Nginx error counts split into total errors and "non-bot" errors. A server might show 400 total Nginx errors in a day, but when you subtract the "access forbidden" and "Primary script unknown" entries, the real error count drops to 3 or 4. Those are the ones worth investigating.

The dashboard ends with a summary line: `X OK | Y warnings | Z critical`. Exit code 0 means healthy, 1 means warnings present, 2 means something needs immediate attention. You can filter to a single site with `wp-status sitename`, or run it with `--no-color` for piping into logs or cron email reports.

## Automated WordPress Diagnostics and Repair Tool

The status dashboard tells you what's wrong. The diagnostic companion, `wp-status-fix`, tells you why and offers to fix it. It runs in safe mode by default, showing what it would do without actually doing it. You add `--fix` only when you're ready to apply the suggestions.

The command structure is modular:

```bash
wp-status-fix all           # Run all checks (read-only)
wp-status-fix nginx         # Diagnose Nginx errors
wp-status-fix nginx --fix   # Diagnose AND apply fixes
wp-status-fix fpm           # Diagnose PHP-FPM issues
wp-status-fix mariadb       # Diagnose database warnings
wp-status-fix disk          # Diagnose disk usage
wp-status-fix login         # Diagnose brute force activity
wp-status-fix redis         # Diagnose cache issues
wp-status-fix ssl           # Diagnose certificate problems
wp-status-fix services      # Diagnose stopped services
wp-status-fix updates       # Check OS/plugin updates
```

The Nginx diagnostics are the most detailed. The script categorizes today's errors into missing files, access forbidden (bot probes), "Primary script unknown" (scanner noise), and genuine upstream errors. It shows the top missing file paths so you can decide whether they matter (a renamed image versus a bot looking for `wp-config.php.bak`). It checks whether Cloudflare real IP headers are working, because if they aren't, fail2ban will be banning Cloudflare proxy IPs instead of actual attackers.

The MariaDB diagnostics dig into aborted connections, grouping them by database name so you can tell whether it's a WordPress plugin holding stale connections or something else. It checks `wait_timeout` and suggests tuning it if connections are lingering too long.

The safe-by-default approach matters. I can run `wp-status-fix all` anytime, on any server, without worrying about side effects. The `--fix` flag is a deliberate opt-in for each subsystem.

## Telegram Bot for External WordPress Uptime Monitoring

The healthcheck runs on each server and can fix local problems. The dashboard runs on each server and gives me detailed reports. Neither of them can tell me if the entire server is unreachable.

This is why the third layer runs on a different server. A Python bot lives on a separate machine and monitors all the others from the outside. It can't see process internals, but it can answer the question that matters most: can a real user reach your sites right now?

**Architecture:**

The bot runs two monitoring loops. The first is HTTP pings every 15 minutes to every site. A standard GET request with a 10-second timeout. If the response comes back with a 200 status code, the site is up. If it comes back with a 500+, the site has a server error. If it times out, the site is unreachable. The bot tracks state between checks, so it knows whether a problem is new (alert needed) or ongoing (already alerted, don't spam).

The second loop is SSH diagnostics every hour. The bot connects to each server using a dedicated read-only user and checks system resources and service status. The SSH user runs through a restricted shell that only allows specific read-only commands: `uptime`, `free -h`, `df -h`, `systemctl is-active`, `redis-cli ping`, log reading. No `sudo`, no `systemctl restart`, no write access to anything. This is a critical design choice. The monitoring system can observe but never modify.

**What it checks:**

| Mode | Interval | Checks |
|------|----------|--------|
| HTTP Ping | 15 min | Status code, response time, SSL certificate expiry |
| SSH Diagnostic | 1 hour | Uptime, memory, disk, load, PHP-FPM, Nginx, MariaDB, Redis |

**Alert behavior:**

When a site goes down, the bot doesn't just report the HTTP failure. It immediately runs an SSH diagnostic on the affected server to provide context. A typical down alert looks like this:

```
ALERT: example-site.com DOWN (502)
Server: .159
Response time: timeout (>10s)

Diagnostics:
  PHP-FPM: inactive (dead)
  MariaDB: OK | Redis: OK | Nginx: OK
  Disk: 15% | RAM: 5.4/7.6 GB

Suggested fix:
  sudo systemctl restart php8.4-fpm
```

The suggested fix is a read-only suggestion. The bot never executes it. I read the alert on my phone, SSH into the server, and decide what to do. When the site comes back up, the bot sends a recovery alert with the downtime duration.

Slow sites get flagged too. Any response over 5 seconds triggers a slow alert. SSL certificates approaching expiry get a warning at 14 days.

**Daily summary:**

At 8 PM CET every day, the bot sends a full summary. Server-by-server snapshots including load, RAM, disk, service status, Redis memory and key count, fail2ban banned IPs, error log line counts, and per-site response times. Incident count for the day. Active alert count. If everything is clean, the summary is a quick confirmation that all systems are healthy. If there were issues, you can see exactly when they happened and how long they lasted.

**Telegram commands:**

The bot accepts commands for on-demand checks:

| Command | What It Does |
|---------|-------------|
| `/status` | Full overview of all servers and sites |
| `/check .159` | Run diagnostics on a specific server |
| `/sites` | All sites with current response times |
| `/alerts` | Show unresolved alerts |
| `/mute 2h` | Silence alerts for a maintenance window |
| `/unmute` | Resume alerts |

The `/mute` command is essential for planned maintenance. If I'm doing a PHP version upgrade (Post 3) or running manual backups, I don't want to be flooded with alerts for expected downtime.

## WordPress Server Log Analysis and Resource Planning

Beyond real-time monitoring, two scripts handle the operational intelligence side of things.

**Log summary** (`wp-log-summary`) reads through access and error logs for all sites and produces a human-readable traffic report. Total requests, status code breakdown, top pages, top IPs, bot traffic volume, wp-login brute force attempts, cache hit rates. This is the script I run when I want to understand traffic patterns or investigate something specific. It's not automated because the output is meant for human reading and pattern recognition.

**Resource analysis** (`wp-usage`) is the planning tool. It analyzes CPU (load ratios, steal detection, SAR historical data if available), RAM (breakdown by service: PHP-FPM workers, MariaDB, Redis, Nginx), disk (per-directory sizes including wp-content and database), PHP-FPM worker utilization (active vs. max, listen queue depth), MariaDB buffer pool efficiency, Redis hit rate and evictions, and traffic volume.

The part I find most useful is the recommendation engine. The script knows the Hetzner Cloud plan lineup with prices, compares the server's actual resource usage against what each plan offers, and tells you whether your current plan is right, whether you can downgrade to save money, or whether you need to upgrade.

The logic is straightforward. If the 15-minute load average consistently exceeds 80% of the CPU count, it recommends more vCPUs. If RAM usage is above 85% or OOM kills have occurred, it recommends more memory. If disk usage is above 70%, it recommends more storage. If everything is running under 40% utilization, it suggests a cheaper plan.

```
Recommendation:
  Current plan is optimal: CX32 (4vCPU/8GB/80GB) - EUR 6.99/mo
```

Or, when it's time to think about changes:

```
Recommendation:
  UPGRADE recommended: CPX31 (4vCPU/8GB/160GB) - EUR 9.49/mo
  Bottleneck: Disk 72% full - expand volume or clean up
```

I run `wp-usage` monthly or whenever I'm considering adding a new site to a server. Before this, capacity decisions were based on gut feel and whatever I remembered from the last time I checked `htop`. Now I have actual utilization numbers, historical trends, and cost comparisons in one output.

## WordPress Security and SEO Audit Scripts

Two additional on-demand scripts round out the monitoring toolkit.

**Security check** (`wp-security-check`) runs a comprehensive audit across all sites. At the server level: OS update status, SSH configuration, firewall rules, failed SSH login counts, fail2ban status. Per site: WordPress core file integrity verification (via `wp core verify-checksums`), plugin update status, nulled/pirated plugin detection (scans for known indicators like "gpldl" or "warez" in plugin files), PHP files in the uploads directory (a common backdoor vector), suspicious code patterns like `eval(base64_decode())`, debug mode status, file editor status, wp-config.php permissions, admin user audit, XML-RPC accessibility, and recently modified PHP files. It also scans Nginx access logs for brute force patterns, XML-RPC abuse, and scanner probe activity.

**SEO check** (`wp-seo-check`) validates the SEO configuration that matters for WordPress sites. Indexability (blog_public setting, meta noindex tags, X-Robots-Tag headers), robots.txt presence and content (including whether it blocks LLM bots like GPTBot and ClaudeBot), XML sitemap validation, canonical URLs and meta tags (title length, description length, Open Graph, Twitter Cards), structured data (JSON-LD), SSL and mixed content, analytics and Search Console verification, TTFB measurement, and PageSpeed Insights scores via Google's API.

I run these periodically, maybe weekly for security, monthly for SEO. They're not automated because the output requires judgment. A "PHP files in uploads" finding could be a backdoor or a legitimate plugin writing temporary files. An SEO warning about missing meta descriptions matters for a content site but not for a staging environment.

## WordPress Disaster Recovery from Backups

Monitoring tells you when things break. You also need a plan for when things break badly enough that monitoring is the least of your concerns.

The infrastructure uses two layers of backups. The first is All-in-One WP Migration `.wpress` files, which are single-file WordPress backups containing the database, uploads, themes, and plugins. These get created nightly by `wp-backup` (Post 6) and uploaded to cloud storage. The second is [restic](/glossary/restic/) server snapshots, which capture the entire filesystem including all server configuration, the LEMP stack setup, and the database data directory.

Restoration from a `.wpress` backup is straightforward: install WordPress fresh, install the All-in-One WP Migration plugin, import the backup file, done. This is the faster option for single-site problems. Restoration from a restic snapshot is the nuclear option: you get back the entire server state as of the snapshot time.

Either way, the rule is always test on staging before production. Restore the backup to a staging environment first, verify everything works, then apply to production. After any restore operation, flush all caches. Redis, FastCGI, OPcache. Stale cache entries after a database restoration are a reliable source of confusing behavior.

I got to test this process for real after locking myself out of a production server with a TOTP misconfiguration. That incident, which I wrote about in a [standalone post](../2026-04-04-server-hardening-after-lockout.md), was the best possible validation of the backup and recovery workflow. The system worked. The recovery was clean. The incident led to better hardening across all servers.

## Scaling WordPress Across Multiple Hetzner Servers

Running 10 sites across 4 servers means regularly thinking about capacity and when to make changes.

**When to upgrade a server:** The `wp-usage` script provides the data, but the decision framework is simple. If memory pressure is causing swap usage or OOM events, upgrade RAM immediately. If CPU load consistently exceeds 70% of capacity, consider more vCPUs or splitting sites across servers. If disk usage crosses 70%, either clean up or provision more storage. These thresholds are conservative. I'd rather have headroom than optimize for cost at the expense of reliability.

**When to split sites across servers:** WooCommerce sites are the primary driver. A WooCommerce store during a sale can consume significantly more PHP workers and database connections than a content site. When I notice that one WooCommerce site's traffic is degrading performance for other sites on the same server, it's time to give it dedicated resources.

**Adding a new site to the infrastructure:**

This is the checklist that ties the whole series together:

1. Provision or select a server (Post 1 and 2)
2. Set up the LEMP stack if the server is new (Post 3)
3. Create the site directory structure, Nginx vhost, PHP-FPM pool, database (Post 4)
4. Migrate WordPress via All-in-One WP Migration (Post 4)
5. Configure Cloudflare DNS and SSL (Post 4)
6. Apply security hardening: fail2ban jails, Nginx blocklists, header configuration (Post 5)
7. Add the site to nightly backup, maintenance, and plugin sync crons (Post 6)
8. Add the site to the Watchdog bot configuration (this post)
9. Run `wp-status` and `wp-seo-check` to verify the full stack

**SSH changes on server upgrade:** One thing that catches people off guard with Hetzner: when you upgrade a server tier, the IP address can change. This means updating DNS records, updating the Watchdog config, and removing the old entry from `~/.ssh/known_hosts` to avoid SSH host key warnings. It's a 5-minute task, but you need to remember to do it, and doing it during or immediately after the upgrade prevents confusion.

**The tier configuration reference** helps make tuning decisions after an upgrade. A server moving from 2 vCPUs / 4 GB to 4 vCPUs / 8 GB needs its PHP-FPM `pm.max_children` increased (from 6 to 12), its MariaDB `innodb_buffer_pool_size` increased (from 512MB to 1536MB), and its OPcache JIT buffer doubled. These aren't arbitrary numbers. They're derived from watching actual resource consumption across servers and finding the configurations that keep services well-fed without overcommitting.

## WordPress Infrastructure from Scratch: Series Summary

This series started as an experiment. I had a Hetzner account, some WordPress sites that needed better hosting, and a hypothesis that AI could close the expertise gap between "comfortable in a terminal" and "running production infrastructure."

Seven posts later, I'm running 10 sites across 4 servers. Nightly backups run to cloud storage. Maintenance scripts handle database optimization, cache warming, and plugin management. Security is layered from the firewall through WordPress. Monitoring watches the whole thing from multiple angles, and most problems fix themselves before I know they occurred.

Every choice in this series, from PHP-FPM's static process management mode to the fail2ban jail configurations to the Watchdog's restricted SSH shell, started as a conversation where I described the problem and AI proposed the solution. Sometimes the first proposal was wrong, and I iterated. Sometimes it was right and I didn't understand why until I read the documentation it pointed me toward.

What I didn't expect was how much understanding would accumulate through the process. The difference between reading a tutorial about Nginx caching and actually configuring FastCGI cache for 10 sites with different caching requirements is enormous. The tutorial gives you syntax. Running it yourself gives you judgment. You learn which error messages are noise and which demand attention. You learn what disk usage patterns look like before they become problems. You learn that monitoring is three layers because no single layer covers all the failure modes.

The gap I crossed was from "I can follow instructions" to "I understand my infrastructure." That second state only comes from running the systems yourself, debugging the failures, and building the operational intuition that no tutorial transfers.

The companion repository has everything: the monitoring scripts, the Watchdog configuration templates, the server tier reference, the full set of maintenance automation from Posts 6 and 7. If you're running WordPress on your own servers, or thinking about it, the repository is the practical starting point. The blog series is the reasoning behind the choices.

*This is the final post in the "WordPress Infrastructure from Scratch" series. The complete code is in the [companion repository](https://github.com/b1azk0/wordpress-infrastructure).*
