---
term: "Fail2ban"
seoTitle: "What Is Fail2ban? Automated Intrusion Prevention for Linux Servers"
description: "Fail2ban is an intrusion prevention tool for Linux servers that scans log files and bans IPs showing malicious behavior. Learn how jails, filters, and actions work, plus WordPress-specific protection."
definition: "Fail2ban is an intrusion prevention tool that monitors system log files for patterns of malicious activity and automatically bans offending IP addresses using firewall rules."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-01-why-i-ditched-managed-hosting"
relatedTerms:
  - "vps"
  - "lemp-stack"
  - "ssl-tls-certificate"
  - "php-fpm"
  - "opcache"
  - "fastcgi-cache"
  - "redis-object-cache"
status: published
date: 2026-04-09
---

Any public-facing Linux server attracts a constant background of automated brute-force traffic — botnets probing SSH with credential lists, scanning for vulnerable HTTP endpoints, hammering login pages with common passwords. A firewall blocks ports; it doesn't respond to behavior. Fail2ban bridges that gap by watching what actually happens in log files and blocking sources that show hostile patterns. It runs on any Linux distribution and protects any service that produces a log of authentication attempts — SSH, web servers, mail servers, [LEMP stack](/glossary/lemp-stack/) hosts, database front-ends, VPN gateways. WordPress and SSH are the two cases I cover in the most depth here, but they are examples, not the limit of what Fail2ban does.

## How Fail2ban Works

The core mechanism is simple: Fail2ban tails log files, applies regex filters to detect patterns of abuse, and when a source IP triggers enough matches within a time window, it inserts a ban rule into the firewall (UFW, iptables, or nftables) to drop all traffic from that IP.

The three main concepts:

**Jails** are the unit of configuration. Each jail ties together a log file, a filter, a ban time, and thresholds. You can have separate jails for SSH, Nginx 404s, WordPress login failures, and PHP errors — each with different sensitivity settings.

**Filters** are regex patterns that define what counts as a suspicious log line. Fail2ban ships with default filters for common services (sshd, nginx-http-auth, etc.). Custom filters for WordPress require writing patterns that match specific log formats.

**Actions** define what happens when a jail triggers. The default action writes a temporary DROP rule to iptables. You can also configure email notifications, though in practice the firewall action is what matters.

The typical flow: a bot hits `wp-login.php` six times in thirty seconds → each failed login is logged by Nginx → Fail2ban's filter matches those log lines → after the fifth match within `findtime`, Fail2ban runs the configured action → iptables blocks all traffic from that IP for `bantime` seconds.

## The SSH Jail

Fail2ban installs with an SSH jail enabled by default. This alone is worth running it — SSH brute force is the most common attack vector on any public-facing VPS. The default settings are reasonable: 5 failed attempts within 10 minutes triggers a 10-minute ban.

For production servers, I configure it more aggressively: 3 attempts, 1-hour ban. Combined with SSH key-only authentication (passwords disabled), the SSH jail becomes a last line of defense against misconfigured clients or leaked credentials.

Check current SSH bans:

```bash
fail2ban-client status sshd
```

## WordPress-Specific Jails

WordPress generates its own attack surface. The two most targeted endpoints are `wp-login.php` (credential brute force) and `xmlrpc.php` (amplification attacks that can make thousands of authentication attempts per request).

For `wp-login.php`, the jail watches Nginx access logs for POST requests to that endpoint. You need a custom filter since Fail2ban doesn't ship one. The filter matches log lines like:

```
POST /wp-login.php HTTP/1.1" 200
```

Note: HTTP 200 responses to `wp-login.php` are suspicious, not just 401s — a successful authentication or a displayed login form both return 200. Banning on repeated 200s from the same IP is more effective than waiting for explicit error codes.

For `xmlrpc.php`, the attack pattern is different. A single request to XML-RPC can contain hundreds of embedded authentication attempts. The right response is often to block the endpoint entirely at the Nginx level rather than relying on Fail2ban — but a Fail2ban jail for XML-RPC provides a fallback for anything that slips through.

## Integration With UFW and iptables

By default, Fail2ban writes rules directly to iptables. If you're using UFW, you need to configure Fail2ban to use UFW as its action backend — otherwise you'll have two separate rule sets that can conflict or produce unexpected behavior.

With the UFW action configured, Fail2ban's bans show up in `ufw status` and are properly integrated with your broader firewall policy. Ban rules are temporary by default (removed after `bantime` expires), and Fail2ban removes them cleanly on service restart or explicit unban.

## Checking and Managing Bans

The primary interface is `fail2ban-client`:

```bash
# Status for all jails
fail2ban-client status

# Detail on a specific jail
fail2ban-client status wordpress-login

# Unban an IP
fail2ban-client set sshd unbanip 1.2.3.4
```

The ban log lives at `/var/log/fail2ban.log`. It's worth reviewing periodically — you'll occasionally see legitimate traffic (monitoring services, staging environments) triggering bans and need to whitelist those IPs via `ignoreip` in the jail configuration.

## Layered Security

Fail2ban is one layer, not a complete solution. The approach that works:

1. **UFW firewall**: Restrict which ports are open at all. SSH, 80, 443 — nothing else.
2. **Fail2ban**: React to behavioral patterns across open ports.
3. **Nginx rate limiting**: Limit request rates per IP at the web server level, before application code runs.
4. **WordPress hardening**: Disable XML-RPC if unused, restrict access to `wp-admin` by IP where possible.

Each layer catches what the previous one misses. Fail2ban is particularly valuable because it's reactive to actual behavior rather than static rules — it adapts to attack patterns without requiring manual rule updates.

I cover the full setup in the [WordPress infrastructure series](/blog/wp-infra-01-why-i-ditched-managed-hosting).
