---
term: "VPS (Virtual Private Server)"
seoTitle: "What Is a VPS? Virtual Private Servers Explained for WordPress Hosting"
description: "A VPS gives you dedicated resources on a virtualized server. Learn how VPS hosting compares to shared and managed hosting, and when to make the switch."
definition: "A Virtual Private Server (VPS) is a virtualized server environment that provides dedicated CPU, RAM, and storage resources within a shared physical machine."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-01-why-i-ditched-managed-hosting"
relatedTerms:
  - "lemp-stack"
status: draft
date: 2026-04-09
---

A Virtual Private Server is a virtualized machine running on shared physical hardware. You get a fixed allocation of CPU, RAM, and storage that behaves like a dedicated server — root access, your own OS, your own processes — but shares the physical host with other VPS instances via a hypervisor.

It's the standard infrastructure choice for anyone who has outgrown managed hosting and doesn't need (or want to pay for) a dedicated physical server.

## What Virtualization Means in Practice

The physical machine running your VPS might have 64 CPU cores, 256 GB of RAM, and several terabytes of NVMe storage. The hypervisor — software like KVM or VMware — partitions these resources into isolated virtual machines. Your VPS might get 4 vCPU cores, 8 GB of RAM, and 160 GB SSD.

From inside your VPS, it looks and behaves like a dedicated server. You boot Linux, get a kernel, manage processes, configure networking. The hypervisor enforces that you can't exceed your allocation and can't see other customers' data.

The "virtual" part does introduce some overhead — CPU-intensive workloads may behave slightly differently than on bare metal, and you're subject to "noisy neighbor" effects on some providers (other VPS instances on the same host consuming unusual resources). Good providers like Hetzner manage host density carefully enough that this is rarely a real problem.

## VPS vs Shared Hosting

Shared hosting puts multiple websites on a single server, sharing everything: the same OS instance, the same PHP interpreter, the same web server configuration, and the same resource pool. If one site on the server gets traffic, it can affect yours. You can't install software, change configuration, or tune anything that affects the server globally.

A VPS gives you a full isolated OS. You install the software you want, configure it however you want, and your resource allocation is yours — other customers' workloads can't eat into your CPU or RAM. The tradeoff is responsibility: you manage the server, handle updates, configure the firewall, and respond when things break.

## VPS vs Managed WordPress Hosting

Managed hosting (WP Engine, Kinsta, Pressable, and others in the mid-range, plus premium tiers of Cloudways) sits between shared hosting and a VPS. You get a WordPress-optimized environment without managing the underlying server. They handle OS updates, security patches, backups, and often include a CDN and page caching out of the box.

The limitations that eventually push people toward a VPS:

- **Cost at scale** — managed hosting per-site fees add up fast when you're running four, six, or ten WordPress sites
- **Configuration constraints** — you can't modify PHP-FPM settings, Nginx configuration, or server-level caching behavior beyond what the platform exposes
- **Plugin restrictions** — some managed hosts blocklist plugins that conflict with their caching or security layers
- **Resource limits** — visit limits, storage quotas, and bandwidth caps can constrain growing sites without obvious upgrade paths that make economic sense

None of these are deal-breakers if managed hosting fits your situation. They were for mine.

## VPS vs Dedicated Server

A dedicated server gives you an entire physical machine to yourself — no virtualization, no shared hardware. The performance ceiling is higher, and there's no theoretical noisy-neighbor risk. It also costs 5–10x more than a comparable VPS.

For most WordPress workloads — even high-traffic sites with WooCommerce — a well-configured VPS is sufficient. The bottleneck is almost never raw compute. It's database query efficiency, caching configuration, and PHP worker tuning. A Hetzner CX32 (4 vCPU, 8 GB RAM, ~€12/month) can handle traffic volumes that would cost hundreds per month on a managed platform.

Dedicated servers make sense at a scale where VPS resource limits are genuinely binding, or where compliance requirements prohibit shared hardware.

## When to Switch from Managed Hosting

The decision to move to a VPS usually isn't triggered by a single problem — it's an accumulation of friction. In my case, the triggers were:

- Running multiple WordPress sites, where per-site managed hosting fees became difficult to justify
- Wanting control over PHP version, PHP-FPM pool configuration, and Nginx behavior that the platform didn't expose
- Needing server-level FastCGI cache configuration that managed hosts either don't offer or charge a premium tier to unlock
- The realization that the complexity of managing a VPS wasn't significantly greater than debugging the quirks of managed hosting platforms

The prerequisite for moving to a VPS is comfort with Linux administration — or willingness to learn it. You need to be able to harden SSH, configure a firewall, install and update software, read logs, and diagnose problems. That's a real skill requirement, not a trivial one.

## Choosing a Provider

Hetzner is my provider of choice. The value-per-euro is genuinely exceptional — a CX22 (2 vCPU, 4 GB RAM) costs under €5/month. Their data centers are in Nuremberg, Falkenstein, Helsinki, and Ashburn (US East). Network performance is solid, and the Hetzner Cloud console and API are clean and reliable.

For European-hosted sites, Hetzner is hard to beat. For US-primary traffic, check whether their Ashburn location serves your latency requirements, or consider alternatives like DigitalOcean or Vultr at comparable price points.

The full story of why I moved away from managed hosting is in [Part 1 of the WordPress Infrastructure series](/blog/wp-infra-01-why-i-ditched-managed-hosting).
