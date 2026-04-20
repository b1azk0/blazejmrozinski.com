---
term: "Cron"
seoTitle: "What Is Cron? Scheduled Jobs on Linux Explained"
description: "Cron is the Linux scheduler for recurring jobs — backups, cache warming, healthchecks, cleanups. Learn crontab syntax, where jobs log, and why WP-Cron is different."
definition: "Cron is the time-based job scheduler built into Unix-like operating systems, used to run scripts or commands on a recurring schedule defined in a crontab file."
domain: "infrastructure"
relatedContent: []
relatedTerms:
  - "vps"
  - "lemp-stack"
  - "cache-warming"
  - "transient-cleanup"
  - "watchdog-monitoring"
status: published
date: 2026-04-17
---

Cron is the oldest scheduler on Linux and still the right tool for most recurring work on a server. It runs in the background, reads a simple schedule file, and executes commands when their time comes up. Backups, SSL certificate renewals, cache warming, log rotation, database cleanups, healthchecks — nearly every automated maintenance job on a [VPS](/glossary/vps/) is a cron job. The syntax is blunt but stable; the same crontab that worked in 1995 works today.

## How Cron Works

The cron daemon (`cron` on Debian-family systems, `crond` on RHEL-family) runs continuously and checks every minute whether any configured job is due. Jobs live in crontab files, which come in three main flavors:

- **User crontabs**, edited via `crontab -e`. Each user has their own, and jobs run as that user. The root crontab runs as root — useful for system tasks, dangerous for everything else.
- **System cron directories** like `/etc/cron.hourly/`, `/etc/cron.daily/`, `/etc/cron.weekly/`, and `/etc/cron.monthly/`. Drop an executable script in any of these and it runs on that cadence, as root, without a time field.
- **`/etc/cron.d/`**, which holds crontab-format files that also specify the user to run as. Packages often install their own cron definitions here (e.g. `certbot` for Let's Encrypt renewal).

Which one to use is a question of ownership. For application-level jobs (WordPress maintenance, per-site scripts), put them in the application user's crontab. For system-level tasks (certbot, fail2ban, unattended-upgrades), leave them wherever the package installed them.

## Crontab Syntax

The schedule format is five space-separated fields followed by the command:

```
* * * * * /path/to/command
│ │ │ │ │
│ │ │ │ └── day of week (0–6, 0 = Sunday)
│ │ │ └──── month (1–12)
│ │ └────── day of month (1–31)
│ └──────── hour (0–23)
└────────── minute (0–59)
```

A real example — run a backup every day at 3:00 AM:

```
0 3 * * * /usr/local/bin/backup.sh
```

Each field accepts lists (`1,15`), ranges (`1-5`), and step values (`*/5` = every 5 minutes). Getting the fields wrong is the most common cron mistake; tools like crontab.guru exist specifically to sanity-check schedules before saving them.

## Where Output Goes

By default, anything a cron job writes to stdout or stderr is mailed to the user running it — which, on a modern VPS without a mail server, means it disappears. Two things to configure:

1. **Set `MAILTO=""`** at the top of the crontab to silence attempted mail delivery, or `MAILTO="you@example.com"` if you actually have mail working.
2. **Redirect output to a log file** per job: `>> /var/log/my-job.log 2>&1`. Then add the file to `/etc/logrotate.d/` so it gets rotated.

Silent cron jobs that fail silently are the classic production footgun. Logging the output and monitoring the log (or the absence of expected output) is the difference between automation and a liability.

## WP-Cron vs System Cron

WordPress has its own scheduler called WP-Cron, which fires on page load rather than on a real timer. It works fine on small sites with steady traffic, but it has two production problems: jobs only run when someone visits the site, and every page load pays a small cost checking the cron queue — which wastes PHP-FPM workers under load.

The production pattern is to disable WP-Cron and drive it from system cron instead. In `wp-config.php`:

```php
define('DISABLE_WP_CRON', true);
```

Then in the system crontab, every 5 minutes:

```
*/5 * * * * cd /var/www/example.com && wp cron event run --due-now >/dev/null 2>&1
```

Now WordPress's scheduled hooks fire on a reliable cadence and the cost is paid once per interval, not per request.

## Typical Jobs on a WordPress Server

A working server crontab covers a handful of recurring tasks, all driven by cron:

- **certbot renew** (twice daily, per Let's Encrypt's guidance) — installed automatically by certbot's package
- **Database and file backups** to object storage — custom script, usually nightly
- **[Cache warming](/glossary/cache-warming/)** after deploys or on a regular schedule
- **[Transient cleanup](/glossary/transient-cleanup/)** via WP-CLI, daily or weekly
- **Healthchecks** via [watchdog monitoring](/glossary/watchdog-monitoring/), every 5 minutes
- **Log rotation** via logrotate's own cron entry — usually runs daily

Everything above is a one-line crontab entry calling a small shell script. Once it's in place, you stop touching the server for routine maintenance — which is exactly the point.
