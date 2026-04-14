---
title: "WordPress on Hetzner VPS: Why I Left Managed Hosting and Built My Own Server"
date: 2026-04-01
tags: [devops-reality, wordpress, hetzner, server-backend]
audience: [founders-operators, ai-practitioners]
format: deep-dive
description: "I moved my WordPress and WooCommerce sites from managed hosting to a Hetzner VPS. Full walkthrough of server provisioning, SSH hardening, and firewall setup on Debian 13."
status: published
label: infrastructure
safety_review: false
---

> *This is Part 1 of "WordPress Infrastructure from Scratch," a hands-on guide to building production WordPress and WooCommerce hosting on Hetzner. Code and configs at the [companion repository](https://github.com/b1azk0/wordpress-infrastructure).*

## Table of Contents

- [The Real Cost of Managed WordPress Hosting](#the-real-cost-of-managed-wordpress-hosting)
- [Why Hetzner Cloud for WordPress Hosting](#why-hetzner-cloud-for-wordpress-hosting)
- [Using AI to Learn Server Administration](#using-ai-to-learn-server-administration)
- [Provisioning a Hetzner VPS for WordPress](#provisioning-a-hetzner-vps-for-wordpress)
- [Initial Server Hardening: SSH, Firewall, and Fail2ban](#initial-server-hardening-ssh-firewall-and-fail2ban)
- [Verifying Your Server Security Configuration](#verifying-your-server-security-configuration)
- [What's Next](#whats-next)

I run WordPress sites for clients. Heavy Elementor builds, WooCommerce stores, dozens of plugins, the full stack of complexity that WordPress accumulates when real businesses depend on it. For years, I paid for managed hosting because the pitch made sense: someone else handles the server, you focus on the product. The pitch stopped making sense once I started looking at what I was actually getting.

The breaking point wasn't dramatic. No catastrophic outage, no billing shock. It was slower than that. A WooCommerce checkout that lagged during modest traffic. A cache I couldn't configure because the hosting panel didn't expose the right settings. A support ticket that took three days to confirm what I already suspected: the PHP worker limit on my "premium" plan was capped at a number that couldn't sustain concurrent WooCommerce sessions. I was paying for a shared server with a polished dashboard, and the dashboard was the most expensive part.

I started wondering what it would take to build the infrastructure myself. I'm a psychologist and product person, not a sysadmin. But I'm comfortable in a terminal, I can read documentation, and I had a hypothesis: with AI as a technical consultant, the gap between "knows enough to be dangerous" and "runs production servers" might be crossable. This series documents what happened when I tested that hypothesis.

## The Real Cost of Managed WordPress Hosting

Managed WordPress hosting sells you convenience. The actual product is a pre-configured [LEMP stack](/glossary/lemp-stack/) (Linux, Nginx or Apache, MySQL/MariaDB, PHP) with a control panel on top. You get automated backups, one-click SSL, maybe a CDN integration. For a simple blog, this is perfectly adequate.

The problems start when your sites are doing real work.

WooCommerce is where managed hosting falls apart fastest. Every checkout session requires PHP to maintain state. Every cart update is a server-side operation. Every background job, whether it's processing an order, sending an email, or syncing inventory, competes for the same limited pool of PHP workers. On a managed plan, that pool is small and you can't change it. You might get 4 or 6 workers, shared with every other tenant on the same machine. During a sale or a traffic spike, you're watching your checkout page time out because some other tenant's cron jobs are eating your allocation.

Caching is the other pain point. Managed hosts typically run a page cache that works well for static content. But WooCommerce pages with cart data, logged-in user states, and dynamic pricing can't be aggressively cached without breaking functionality. You need fine-grained control over what gets cached, what gets bypassed, and how cache invalidation works. Managed hosting gives you a toggle: cache on or cache off. The nuance lives in server configs you don't have access to.

Then there's the value ratio. A decent managed WordPress plan, the kind that gives you enough resources for WooCommerce, runs somewhere in the range of 5 to 15 times what equivalent raw compute costs. Some of that premium pays for support, automated updates, and the convenience layer. Fair enough. But when the support can't solve your actual problems and the convenience layer is the thing preventing you from solving them yourself, the ratio stops making sense.

I'm not arguing managed hosting is bad. For a lot of use cases, it's the right call. I'm arguing that once your sites are complex enough to hit the constraints, the only options are to pay dramatically more for a higher tier (which often just means slightly less shared resources) or to own the stack yourself.

## Why Hetzner Cloud for WordPress Hosting

I evaluated several VPS providers before settling on Hetzner. The decision came down to three things: price-to-performance ratio, European data centers, and image quality.

The numbers are hard to argue with. A CX22 instance, 2 shared vCPUs and 4 GB of RAM, costs roughly 4 to 5 euros per month. A CX32, 4 vCPUs and 8 GB of RAM, runs about 8 to 9 euros. These are dedicated resources on your own virtual machine. No shared PHP worker pools, no mystery neighbors. For the price of one mid-tier managed hosting plan, you can run multiple servers with more raw compute than the managed plan ever gave you.

The European data center locations mattered for my use case. I run sites serving European audiences, and GDPR compliance is simpler when your data lives in the EU. Hetzner operates data centers in Germany, Finland, and the US, with the European options being particularly well-connected.

Hetzner's Debian images are clean. You get a minimal OS with nothing pre-installed, which is exactly what you want for a server you're going to configure from scratch. Their API is solid if you ever want to automate provisioning, and the cloud console is straightforward without trying to be clever.

The tradeoff is real, though. Hetzner gives you a blank machine and nothing else. No control panel, no managed backups, no one-click anything. If you break your SSH config at 2 AM, you're using the rescue console, not calling support. Every layer of the stack is your responsibility: the firewall, the web server, the database, PHP, caching, SSL, backups, monitoring, all of it. That's the exchange. You get full control and dramatically better value, but you take on operational responsibility for everything.

For me, the economics made the decision obvious. The question was whether I could actually handle the operational side.

## Using AI to Learn Server Administration

I need to be clear about something: I did not know how to administer a Linux server when I started this project. I understood the concepts. I could SSH into a machine, navigate the filesystem, edit a config file. But "configure a production LEMP stack with proper security hardening" was not in my skill set. The gap between editing a config file and knowing which values to put in it, and why, was significant.

This is where AI changed the equation. I used Claude as my primary technical consultant throughout this entire build. The workflow looked like this: I would describe what I wanted to accomplish at a high level, ask for the implementation approach, evaluate the response against my understanding, then execute. When something didn't work or didn't make sense, I would push back, ask for alternatives, or request deeper explanation.

Where AI proved genuinely excellent was in generating configurations and explaining the reasoning behind each setting. When I needed a sysctl config for TCP performance tuning, the model didn't just hand me a file. It explained what `net.core.somaxconn` does, why `vm.swappiness = 10` is appropriate for a database server, what the tradeoffs are. I could evaluate those explanations against documentation and decide whether they made sense for my specific setup.

Where AI needed verification was security advice and version-specific details. Security configuration is a domain where being 90% right and 10% wrong is worse than doing nothing, because the 10% creates false confidence. I verified every security-related recommendation against official documentation. I tested every firewall rule. I confirmed every SSH config change in a separate terminal before closing my existing session. AI gave me the starting point and the conceptual framework, but the verification discipline was mine.

The other critical pattern was iterative refinement. My initial configurations, even the AI-suggested ones, were rarely optimal on the first pass. Running a site under real load exposed issues that neither I nor the model anticipated. The value wasn't in getting a perfect config upfront. It was in having a consultant available at any hour to help me diagnose a performance issue, understand a log message, or evaluate competing approaches to a problem.

This is the only post in the series where AI takes center stage. From here on, I'll show the commands and configs directly. But I want to be honest about the foundation: everything in this series was built by someone who learned server administration through a conversation with an AI model, verified against real documentation, and refined against real production traffic.

## Provisioning a Hetzner VPS for WordPress

The architecture we're building across this series looks like this:

```
Browser -> Cloudflare (SSL termination, edge cache, Brotli)
        -> Hetzner VPS (Nginx + FastCGI cache + PHP-FPM + MariaDB + Redis)
```

A single server hosting multiple WordPress sites. One Nginx instance with a virtual host per domain. One PHP-FPM process pool shared across sites. One MariaDB instance with a separate database per site. Redis for object caching. Let's Encrypt for SSL certificates. Cloudflare in front for DNS, DDoS protection, and edge caching.

For this first post, we're getting the server provisioned and locked down. Everything after that, the LEMP stack, tuning, WordPress setup, comes in subsequent posts.

### Create the Server

Sign up for Hetzner Cloud at console.hetzner.cloud. Create a new project (name it whatever makes sense for your use case), then create a server with these settings:

- **Image:** Debian 13 (trixie)
- **Location:** Pick the data center closest to your audience. For European sites, Helsinki (`hel1`) or Falkenstein (`fsn1`) are solid choices.
- **Type:** CX22 (2 vCPU, 4 GB RAM) for 1 to 3 low-traffic sites, or CX32 (4 vCPU, 8 GB RAM) if you're running WooCommerce or more than a couple of sites.
- **SSH Key:** Add your public key during creation. If you don't have one yet, generate it first:

```bash
ssh-keygen -t ed25519 -C "yourname@yourdomain"
```

Use `ed25519` over RSA. It's modern, secure, and produces smaller keys. Copy the contents of `~/.ssh/id_ed25519.pub` and paste it into the Hetzner SSH key field.

Once the server is created, note the public IPv4 address. You'll need it for everything that follows.

### First Connection

```bash
ssh root@203.0.113.10
```

Verify you're on the right OS:

```bash
hostnamectl
cat /etc/os-release
```

You should see `Debian GNU/Linux 13 (trixie)`. If you see something else, you selected the wrong image during creation.

### Update and Install Essentials

First things first: update the system and install the packages you'll need for the hardening steps.

```bash
apt update && apt upgrade -y
apt install -y sudo curl wget unzip ca-certificates gnupg lsb-release ufw fail2ban
```

### Set the Timezone

```bash
timedatectl set-timezone Europe/Warsaw
timedatectl
```

Replace `Europe/Warsaw` with your preferred timezone. This affects log timestamps, cron job scheduling, and your sanity when reading logs at odd hours.

## Initial Server Hardening: SSH, Firewall, and Fail2ban

A fresh server connected to the internet starts receiving automated attacks within minutes. SSH brute force attempts, port scans, the usual noise. Hardening is the first thing you do, before installing any services.

### Create an Operations User

Never run your server as root for daily operations. Create a dedicated user with sudo access:

```bash
adduser ops
usermod -aG sudo ops
```

Copy your SSH keys from root so the new user can authenticate the same way:

```bash
rsync --archive --chown=ops:ops /root/.ssh /home/ops/
```

This copies the `authorized_keys` file to the `ops` user's home directory with correct ownership. Now open a new terminal and verify the connection works before you change anything else:

```bash
ssh ops@203.0.113.10
sudo whoami
```

That `sudo whoami` should print `root`. If it doesn't, fix the user setup before proceeding. The reason I emphasize testing in a separate terminal is that you're about to disable root login. If you lock yourself out because the `ops` user isn't set up correctly, your only recovery option is Hetzner's rescue console. I learned this lesson the hard way.

### Disable Root SSH and Password Authentication

Once you've confirmed the `ops` user works, lock down SSH. Edit the SSH daemon config:

```bash
sudo nano /etc/ssh/sshd_config
```

Find and set these two directives:

```
PermitRootLogin no
PasswordAuthentication no
```

The first prevents anyone from logging in as root over SSH. The second disables password-based authentication entirely, meaning only SSH key holders can connect. This eliminates the entire category of brute force password attacks.

Apply the changes:

```bash
sudo systemctl restart ssh
```

Keep your current terminal open while you test in another:

```bash
ssh root@203.0.113.10
```

This should now be rejected. If it is, the hardening is working. If it isn't, re-check your `sshd_config`.

### Configure the Firewall

UFW (Uncomplicated Firewall) is the simplest way to manage iptables rules on Debian. The goal is to allow only the traffic we need and drop everything else.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

When you run `ufw enable`, it will warn you that this may disrupt existing SSH connections. Since you already allowed OpenSSH, your connection is safe. Say yes.

A note on Hetzner's cloud firewall: Hetzner also offers a network-level firewall in their cloud console. If you've attached one to your server, make sure inbound TCP on ports 22, 80, and 443 is allowed there too. UFW operates at the OS level. Hetzner's cloud firewall operates at the network level. Both need to permit the traffic.

### Install and Configure Fail2ban

UFW blocks unauthorized ports. [Fail2ban](/glossary/fail2ban/) blocks unauthorized behavior on permitted ports. Specifically, it monitors log files for patterns that indicate abuse (like repeated failed SSH login attempts) and automatically bans the offending IP at the firewall level.

Fail2ban was installed in the essentials step earlier. Enable and start it:

```bash
sudo systemctl enable --now fail2ban
```

The default Debian configuration includes an SSH jail out of the box, which monitors `/var/log/auth.log` for failed SSH authentication attempts. After a configurable number of failures within a time window, the source IP gets banned via iptables.

For this initial setup, the default SSH jail is sufficient. In later posts, when we have Nginx and WordPress running, we'll add custom jails that monitor web access logs for brute force attacks on `wp-login.php` and automated vulnerability scanners. The layered approach matters: Nginx rate-limiting slows attackers down, and fail2ban bans them entirely once they cross a threshold.

Check that fail2ban is running:

```bash
sudo systemctl status fail2ban --no-pager
```

You should see `active (running)` in the output.

## Verifying Your Server Security Configuration

Before calling this server ready, confirm every hardening measure is in place. Run through each check and make sure the output matches what you expect.

### SSH Access

From a new terminal, confirm you can connect as the `ops` user:

```bash
ssh ops@203.0.113.10
```

Then confirm root is blocked:

```bash
ssh root@203.0.113.10
```

This should fail with `Permission denied (publickey)`.

### Firewall Status

```bash
sudo ufw status verbose
```

Expected output should show:

```
Status: active
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
22/tcp (v6)                ALLOW IN    Anywhere (v6)
80/tcp (v6)                ALLOW IN    Anywhere (v6)
443/tcp (v6)               ALLOW IN    Anywhere (v6)
```

The important line is `Default: deny (incoming)`. Everything not explicitly allowed is dropped.

### Fail2ban Status

```bash
sudo fail2ban-client status
```

You should see at least one jail listed (the default `sshd` jail). Check its details:

```bash
sudo fail2ban-client status sshd
```

This shows the number of currently banned IPs and total bans since the service started. On a fresh server, give it a few hours and you'll be surprised how many IPs it catches. Automated SSH scanners are relentless.

### Summary Checklist

At this point, your server should have:

- Debian 13 fully updated
- A non-root `ops` user with sudo access and SSH key authentication
- Root SSH login disabled
- Password authentication disabled
- UFW firewall active, permitting only ports 22, 80, and 443
- Fail2ban running with SSH brute force protection

That's six layers of security on a server that doesn't even have a web server installed yet. Each layer addresses a different attack vector, and together they represent a baseline that's more secure than what most managed hosting providers configure for you.

Full configs for everything in this post are in the [companion repository](https://github.com/b1azk0/wordpress-infrastructure) under `01-server-provisioning/`.

## What's Next

You now have a secured Debian server on Hetzner, hardened against the most common attack vectors, running on better hardware than your managed hosting plan provided, for a fraction of the cost. It does absolutely nothing useful yet. That changes in the next post, where we install and configure the full LEMP stack: Nginx, MariaDB, PHP-FPM, and Redis.

The server tuning is where things get interesting. Managed hosting hides these decisions from you, and that's exactly the problem. The difference between a WordPress server that handles 50 concurrent users and one that handles 500 lives in configuration details like PHP-FPM worker counts, MariaDB buffer pool sizes, and OPcache settings. Knowing what those are and why they matter is worth more than any hosting dashboard.

---

## WordPress Infrastructure from Scratch — Full Series

1. **Why I Ditched Managed Hosting** *(you are here)*
2. [Building the LEMP Stack](/blog/wp-infra-02-building-the-lemp-stack)
3. [Deploying WordPress the Right Way](/blog/wp-infra-03-deploying-wordpress)
4. [Four Layers of Caching](/blog/wp-infra-04-four-layers-of-caching)
5. Locking It Down *(stay tuned)*
6. Automating the Boring Parts *(stay tuned)*
7. Watching Over It All *(stay tuned)*
