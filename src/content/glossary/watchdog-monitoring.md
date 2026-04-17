---
term: "Watchdog Monitoring"
seoTitle: "What Is Watchdog Monitoring? External Health Checks Explained"
description: "Watchdog monitoring runs health checks from a separate machine, so it still works when the primary server has locked up. Learn the pattern, tradeoffs, and a minimal Telegram-alert setup."
definition: "Watchdog monitoring is the practice of running health checks from an external machine, independent of the server being monitored, so total outages are detected even when the primary host cannot report its own state."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-07-watching-over-it-all"
relatedTerms:
  - "vps"
  - "cron"
  - "fail2ban"
status: published
date: 2026-04-17
---

A watchdog is the thing that watches the thing. Monitoring that runs on the same server it's monitoring has a blind spot: if the server is down hard — kernel panic, disk full, network off, provider-level outage — the monitoring can't report anything, because it's also down. Watchdog monitoring sidesteps that by running the health checks from a separate machine, in a separate network, with no shared fate. When the production box goes dark, the watchdog notices and tells you. It's one of the cheapest reliability upgrades available to a single-server operator.

## Why Internal Healthchecks Aren't Enough

On-host monitoring is fine for the things on-host monitoring can actually detect: slow queries, filling disks, rising memory usage, failed cron jobs. Prometheus, Netdata, or a handful of shell scripts can report on all of that, and they should. But those tools share a fate with the server they run on. A crashed kernel doesn't push metrics; a machine that's lost network connectivity can't send an email; a VPS that's been stop-the-worlded by its provider has nothing to say.

The failure modes that matter most to a small site operator — "is the site responding at all?" — are the exact ones that on-host monitoring can't see. Self-report loops are structurally unable to report "I am completely offline."

## The Watchdog Pattern

The minimal watchdog is another [VPS](/glossary/vps/), ideally in a different region from the production server, running a small script on a [cron](/glossary/cron/) schedule. Two checks are usually enough:

- **HTTP ping** to the site's public URL, every 1–5 minutes. Record success on 200 OK, failure on anything else (5xx, timeout, TLS error, connection refused). Alert after N consecutive failures — two or three, tuned against false positives from transient network issues.
- **SSH reachability probe** on a longer cadence — every 15–60 minutes. A site can be serving a static error page while the underlying server is unreachable for administration; catching that early matters.

Separation matters more than sophistication. The watchdog and the monitored server should share nothing: different providers if possible, different geographic regions, different everything. A Hetzner server monitored by another Hetzner server in the same Nuremberg datacenter is better than nothing, but a Hetzner server monitored by a cheap DigitalOcean droplet in Frankfurt is better still. The point is to survive correlated failures.

## Alert Channels

Choice of alert channel depends on urgency and human availability:

- **Telegram bot** is fast, cheap, and reliable. A bot token, a chat ID, and a `curl` call is the whole integration. For a single-operator site, this is usually enough.
- **Email** is fine for lower-urgency alerts or as a secondary channel. It's slower and easier to miss, but it leaves a paper trail.
- **PagerDuty, Opsgenie, or a dedicated on-call tool** is appropriate for teams with real on-call rotations. Overkill for a personal site or small business operation.

The tradeoff to get right is alert latency versus alert fatigue. Checking every 30 seconds gives you a fast signal but generates noise on any flaky network; checking every 5 minutes gives you breathing room but extends the worst-case outage window. For most small sites, 2–5 minute intervals with a "fail 2 out of 3" rule hit the right balance.

## Keeping the Watchdog Boring

The trap is turning the watchdog into a second production system. Every feature added to it is something else that can break — and when the watchdog breaks, you don't find out until the next real outage reveals that it hasn't been watching. The best watchdog is one you haven't touched in six months because nothing has demanded attention.

A few rules that keep it boring:

- **No shared dependencies.** If it needs the same DNS server, the same CDN, the same load balancer as the production site, it's not really independent. Use a different DNS, different network egress, different everything.
- **Minimal surface area.** Cron plus `curl` plus a 30-line shell script. One Telegram bot token stored in an environment variable. Resist adding a web dashboard, a metrics database, or alert deduplication logic.
- **One thing per script.** If you're adding a second check, add a second script; don't grow one giant monitoring binary. Debugging a tiny script at 2 AM is much easier than debugging a framework.
- **Test the alert path.** Temporarily break something every few months to confirm alerts still arrive. An untested alert channel is not an alert channel — it's a hope.

The production site uses [Fail2ban](/glossary/fail2ban/) and every other on-host defense, and the watchdog does the one thing on-host defenses can't: confirm the server is still there at all. I cover the full setup — bot, scripts, thresholds — in the [WordPress infrastructure series](/blog/wp-infra-07-watching-over-it-all).
