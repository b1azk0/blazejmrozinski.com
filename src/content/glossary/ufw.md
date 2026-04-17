---
term: "UFW (Uncomplicated Firewall)"
seoTitle: "What Is UFW? Uncomplicated Firewall on Linux Explained"
description: "UFW is a friendly front-end to iptables/nftables for managing Linux firewall rules. Learn default policies, common commands, and how UFW integrates with Fail2ban on WordPress servers."
definition: "UFW (Uncomplicated Firewall) is a user-friendly command-line front-end to Linux's iptables or nftables firewall, designed to make common firewall tasks simple without hiding the underlying ruleset."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-05-locking-it-down"
relatedTerms:
  - "fail2ban"
  - "vps"
  - "lemp-stack"
  - "ssl-tls-certificate"
status: published
date: 2026-04-17
---

UFW stands for Uncomplicated Firewall, and for once the name is accurate. It's a command-line wrapper around the Linux kernel's firewall machinery that replaces the intimidating iptables syntax with commands like `ufw allow 22/tcp`. The rules it generates are still real iptables (or nftables) rules — UFW isn't a separate firewall, it's a friendlier interface to the same kernel filtering layer. On a WordPress [VPS](/glossary/vps/), it's almost always the right first line of defense.

## What UFW Sits On Top Of

Linux firewalling happens inside the kernel, in the netfilter subsystem. The traditional userspace tool for configuring netfilter is `iptables`; the newer replacement is `nftables`. Both work, both are powerful, both have notoriously dense syntax that discourages casual use. UFW wraps either of them — on modern Ubuntu and Debian it generates nftables rules — and exposes a small vocabulary of commands that cover 95% of what a single-server admin actually needs.

UFW has been the default firewall front-end on Ubuntu since 8.04 and is preinstalled on most Debian-family distributions. On RHEL-family distributions the equivalent tool is `firewalld`, which solves the same problem with different syntax.

## Default Posture on a Fresh VPS

The baseline configuration for a public-facing server is "deny by default, allow what you need":

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw enable
```

Important detail, and one that has embarrassed everyone who runs UFW at least once: **allow SSH before you enable the firewall**. Running `ufw enable` over an SSH session without first allowing port 22 will kick you out of your own server. UFW helpfully prints a warning when it detects an active SSH session, but the warning is easy to miss.

`ufw status verbose` shows the active ruleset; `ufw disable` turns it off if something goes wrong and console access is available.

## Common Commands

The day-to-day vocabulary is small:

```bash
ufw allow 22/tcp           # allow SSH
ufw allow http             # shorthand for 80/tcp
ufw allow https            # shorthand for 443/tcp
ufw status numbered        # list rules with index numbers
ufw delete 3               # remove rule #3
ufw reload                 # reapply rules after manual config edits
```

Rules can also be scoped to source IPs — `ufw allow from 203.0.113.5 to any port 22` restricts SSH to a specific address, which is a cheap upgrade over "port 22 open to the world." For anything more complex (NAT, port forwarding, stateful chains), UFW gets out of your way: `/etc/ufw/before.rules` and `/etc/ufw/after.rules` let you drop raw iptables syntax in where needed.

## UFW and Fail2ban Integration

By default, [Fail2ban](/glossary/fail2ban/) writes its ban rules directly to iptables, bypassing UFW entirely. On a server running both tools with default settings, you end up with two parallel rule sets — UFW's and Fail2ban's — that don't know about each other. It works, but bans don't show up in `ufw status`, and debugging which tool blocked which IP gets harder than it should.

The fix is a one-line change in `/etc/fail2ban/jail.local`:

```
banaction = ufw
```

With that set, Fail2ban drives UFW instead of iptables directly. Bans appear in `ufw status` alongside your manually configured rules, and unbanning via `fail2ban-client set <jail> unbanip <ip>` removes the UFW entry correctly. The two tools then share a single view of the firewall, which is what you want.

## Typical WordPress VPS Ruleset

For a WordPress server behind Cloudflare or serving traffic directly, the working ruleset is usually three ports open and everything else denied:

- **22/tcp** — SSH, ideally scoped to an admin IP range
- **80/tcp** — HTTP, required for Let's Encrypt HTTP-01 challenges and redirects to HTTPS
- **443/tcp** — HTTPS, where actual traffic goes

Nothing else gets opened unless the server legitimately needs it. MariaDB binds to localhost; Redis binds to localhost or a Unix socket; PHP-FPM talks to Nginx over a socket. There's no reason for those ports to be reachable from the internet, and not opening them is the cheapest possible security measure.

UFW is one layer on a properly configured [LEMP stack](/glossary/lemp-stack/) — it blocks packets before they reach any application, but it can't see behavior (brute-force logins, scraping patterns) happening over ports that are legitimately open. Pair it with Fail2ban for behavioral bans and you have both static port control and reactive IP blocking. I walk through the complete setup in the [WordPress infrastructure series](/blog/wp-infra-05-locking-it-down).
