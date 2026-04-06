---
title: "Locking It Down: Security Hardening for WordPress on a VPS"
date: 2026-04-27
tags: [devops-reality, wordpress, hetzner, server-backend, security, fail2ban, nginx]
audience: [founders-operators, ai-practitioners]
format: deep-dive
description: "Two-layer WordPress security: Nginx drops bad requests before PHP runs, fail2ban catches everything else. Rate limiting, scanner protection, SSL hardening, and WooCommerce security."
status: draft
label: infrastructure
safety_review: false
---

> *This is Part 5 of "WordPress Infrastructure from Scratch," a hands-on guide to building production WordPress and WooCommerce hosting on Hetzner. Code and configs at the [companion repository](https://github.com/b1azk0/wordpress-infrastructure) under `05-security-hardening/`.*

## Table of Contents

- [The Attack Surface Is Immediate](#the-attack-surface-is-immediate)
- [The Two-Layer Defense Model](#the-two-layer-defense-model)
- [Nginx Hardening](#nginx-hardening)
- [Fail2ban: WordPress Login Jail](#fail2ban-wordpress-login-jail)
- [Fail2ban: Vulnerability Scanner Jail](#fail2ban-vulnerability-scanner-jail)
- [SSL/TLS Hardening](#ssltls-hardening)
- [WordPress Application Security](#wordpress-application-security)
- [WooCommerce Security](#woocommerce-security)
- [Monitoring What Gets Blocked](#monitoring-what-gets-blocked)
- [What's Next](#whats-next)

## The Attack Surface Is Immediate

Within minutes of a WordPress server going live, bots find it. I don't mean hours or days. Minutes. They scan for `wp-login.php`, probe `xmlrpc.php`, test for known vulnerable plugins. The first time I checked my access logs after deploying a fresh site, I found POST requests to `wp-login.php` from IP ranges I'd never seen, hitting the server faster than any human could type. My fail2ban logs started filling up on day one.

This shouldn't be surprising. Automated scanners sweep entire IP ranges continuously, looking for any machine that responds on port 80 or 443 with WordPress signatures. They don't care what your site is about. They care that WordPress powers a significant percentage of the web, that a meaningful fraction of those installations have weak credentials or unpatched plugins, and that one successful compromise can be leveraged into a spam network, a cryptominer, or a botnet node.

In Part 1, we covered the foundation: SSH key-only authentication, root login disabled, UFW firewall allowing only ports 22, 80, and 443, and fail2ban watching for SSH brute force. That handled the server-level attack surface. This post is about the WordPress-specific attack surface, and the layered defense that handles it automatically so you're not reading logs at 2 AM.

## The Two-Layer Defense Model

The architecture is simple and worth understanding before we dive into configuration.

**Layer 1: Nginx.** Nginx sits in front of PHP-FPM and inspects every incoming request before PHP sees it. For requests that match known attack patterns, Nginx drops them immediately. No PHP execution, no database queries, no WordPress code runs at all. This is the cheapest possible rejection: a web server returning a status code or silently closing the connection.

**Layer 2: Fail2ban.** Fail2ban monitors Nginx log files for patterns that indicate abuse. When an IP crosses a threshold, fail2ban adds it to an iptables rule that drops all traffic from that IP at the kernel level. Subsequent requests from that IP never reach Nginx, let alone PHP.

The layering is what makes this effective. Nginx handles the per-request filtering: is this specific request something we should allow? Fail2ban handles the behavioral pattern: is this IP doing something suspicious across multiple requests? Together, they mean that most attack traffic costs your server essentially zero PHP resources.

```
Request → Nginx (known bad pattern?) → drop/reject (no PHP cost)
                 ↓ (allowed through)
          PHP-FPM processes the request
                 ↓ (logged in access/error log)
          Fail2ban (pattern across requests?) → iptables DROP
                 ↓
          Next request from that IP → blocked at kernel level
```

## Nginx Hardening

Each of these rules goes into your vhost's `server{}` block. I keep them in the main SSL server block, after the `root` directive. Some are included as a separate snippet file for reuse across sites.

### Rate-Limit wp-login.php

This is the single most impactful rule. Brute force attacks against `wp-login.php` are the most common automated attack on WordPress. The rate limit goes in two places.

First, define the zone in your `nginx.conf` inside the `http{}` block (once per server):

```nginx
limit_req_zone $binary_remote_addr zone=wp_login:10m rate=5r/m;
limit_req_status 429;
```

This creates a shared memory zone that tracks request rates per IP address. The `10m` allocation handles roughly 160,000 unique IP addresses. The rate is 5 requests per minute per IP.

Then, in each vhost, add a location block **before** the generic `location ~ \.php$` block:

```nginx
location = /wp-login.php {
    limit_req zone=wp_login burst=3 nodelay;
    limit_req_status 429;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_pass unix:/run/php/php8.4-fpm.sock;
}
```

The `burst=3` allows a small burst (a real user might submit a login form, get redirected, and hit the page again quickly). The `nodelay` means burst requests are processed immediately rather than queued. After the burst is exhausted, additional requests get a 429 Too Many Requests response. PHP never executes for the rejected requests.

### Block XML-RPC

XML-RPC is a legacy WordPress API that allows remote publishing, pingbacks, and a handful of other operations. It's also a brute force amplification vector, because a single XML-RPC request can attempt multiple username/password combinations. Unless you specifically need a tool that uses XML-RPC (the WordPress mobile app used to, though it now uses the REST API), block it entirely:

```nginx
location = /xmlrpc.php {
    return 403;
    access_log off;
}
```

The `access_log off` prevents these probe requests from cluttering your logs. There will be many of them.

### Block REST API User Enumeration

WordPress exposes a REST API endpoint at `/wp-json/wp/v2/users` that lists user accounts. This is useful for headless WordPress setups. For a standard site, it's an information leak that tells attackers exactly which usernames to target:

```nginx
location ~* ^/wp-json/wp/v2/users {
    return 403;
}
```

Logged-in administrators can still manage users through wp-admin. This only blocks the public-facing API endpoint.

### Hide Sensitive Files

WordPress ships with `readme.html` and `license.txt` in the root directory. These files disclose the exact WordPress version running on your server:

```nginx
location ~* /(readme\.html|license\.txt) {
    return 403;
    access_log off;
}
```

This is defense in depth. Knowing your WordPress version alone isn't a vulnerability, but it helps attackers narrow down which exploits to try. Remove the information.

### Strip X-Powered-By Header

PHP by default sends an `X-Powered-By` header that discloses the PHP version. Add this inside your `location ~ \.php$` block:

```nginx
fastcgi_hide_header X-Powered-By;
```

Same reasoning as hiding version files. Don't volunteer information about your stack.

### Block PHP Execution in Uploads

This is critical. The `wp-content/uploads/` directory is writable by WordPress (it needs to be, for media uploads). If an attacker can upload a PHP file to this directory through a vulnerable plugin, and that PHP file can execute, they have a web shell on your server. Block it at Nginx:

```nginx
location ~* /wp-content/uploads/.*\.php$ {
    return 444;
}
```

The `444` status code is Nginx-specific. It closes the connection without sending any response at all. No headers, no body, nothing. The client's request disappears into a void. I use `444` for rules where I want to waste as little of my server's bandwidth as possible and give the attacker zero information about whether the path even exists.

### Security Headers

These go in the main `server{}` block and apply to all responses:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

`X-Frame-Options` prevents your site from being embedded in iframes on other domains (clickjacking protection). `X-Content-Type-Options` prevents browsers from MIME-sniffing a response away from the declared content type. `Referrer-Policy` controls what referrer information is sent with outbound requests. `Permissions-Policy` disables browser APIs your site doesn't need.

### The Complete Security Snippet

For vulnerability scanner protection, I use a separate snippet file included in each vhost. This file handles the broad category of bots probing for PHP files that don't exist on a WordPress installation:

```nginx
# wp-security.conf — Block vulnerability scanner probes
# Returns 444 (drop connection) to save resources

# Block PHP execution in uploads (never legitimate)
location ~* /wp-content/uploads/.*\.php$ {
    return 444;
}

# Block PHP execution in themes (admin.php probes)
location ~* /wp-content/themes/.*/admin\.php$ {
    return 444;
}

# Block PHP execution in wp-includes subdirectories
location ~* /wp-includes/.*/index\.php$ {
    return 444;
}

# Block Duplicator installer probes
location ~* /dup-installer/ {
    return 444;
}

# Block root-level PHP files that are NOT WordPress core
# WordPress only needs: index.php, wp-*.php, xmlrpc.php (already blocked elsewhere)
# Everything else at root level (random.php, radio.php, etc.) is a scanner
location ~* ^/(?!wp-|index\.php|xmlrpc\.php)[a-z0-9_-]+\.php$ {
    return 444;
}
```

Include it in each vhost's main SSL server block:

```nginx
include snippets/wp-security.conf;
```

One important placement note: this snippet goes in the main SSL server block that has the `root` directive. Do not include it in redirect blocks (the www-to-non-www or HTTP-to-HTTPS redirect server blocks). Those blocks don't serve files and the location rules won't match correctly.

That last regex rule deserves explanation. WordPress core only uses PHP files at the root level that start with `wp-` (like `wp-cron.php`, `wp-comments-post.php`), plus `index.php` and `xmlrpc.php`. Any other PHP file at the root level, things like `radio.php`, `content.php`, `about.php`, or `new.php`, is guaranteed to be a scanner probing for a known vulnerable script. The regex matches any root-level PHP file that doesn't match WordPress core patterns and drops the connection silently. This single rule eliminates the largest category of scanner noise I see in my logs.

## Fail2ban: WordPress Login Jail

Nginx rate limiting handles the per-request throttle. Fail2ban handles the longer pattern: an IP that keeps coming back after being rate-limited is not a user who forgot their password. It's a bot.

### The Filter

Create the filter file at `/etc/fail2ban/filter.d/wordpress-login.conf`:

```ini
[Definition]
failregex = ^<HOST> .* "POST /wp-login\.php.*" (200|429)
            ^<HOST> .* "POST /xmlrpc\.php.*" (200|403)
ignoreregex =
```

This matches two patterns in the Nginx access log. The first catches POST requests to `wp-login.php` that return either 200 (WordPress returns 200 even on failed logins, which is a design choice I have opinions about) or 429 (our rate limit kicked in). The second catches POST requests to `xmlrpc.php` that return 200 or 403 (our block rule).

### The Jail

Create the jail configuration at `/etc/fail2ban/jail.d/wordpress.conf`:

```ini
[wordpress-login]
enabled  = true
port     = http,https
filter   = wordpress-login
logpath  = /var/www/*/logs/access.log
maxretry = 5
findtime = 300
bantime  = 3600
action   = iptables-multiport[name=wordpress, port="http,https", protocol=tcp]
```

The parameters:

| Setting | Value | What it means |
|---------|-------|---------------|
| `maxretry` | 5 | Failed attempts before ban triggers |
| `findtime` | 300 | Time window: 5 minutes |
| `bantime` | 3600 | Ban duration: 1 hour |
| `logpath` | `/var/www/*/logs/access.log` | Wildcard covers all sites on the server |

The `logpath` wildcard is important if you run multiple sites. Each site has its own access log under `/var/www/<site>/logs/`, and the wildcard means one jail covers all of them.

### How It Works Together

```
Attacker → Nginx (rate-limit: 5r/m, burst 3) → 429 after burst
                ↓ (logged in access.log)
         Fail2ban (reads log) → 5 POSTs in 5min → iptables DROP
                ↓
         Next request → blocked at kernel level (never reaches Nginx)
```

Layer 1 slows attackers down. Layer 2 bans them entirely. The ban happens at the iptables level, which means the kernel drops the packets before any userspace process sees them. It's the cheapest possible rejection.

### Testing

You can dry-run the filter against existing logs to verify it matches:

```bash
sudo fail2ban-regex /var/www/example.com/logs/access.log \
    /etc/fail2ban/filter.d/wordpress-login.conf
```

This shows how many lines match the regex without actually banning anyone. Run it after the filter is in place to confirm it's catching what you expect.

Activate the jail:

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status wordpress-login
```

## Fail2ban: Vulnerability Scanner Jail

This is the more sophisticated jail, and the one that made the biggest difference to my server's noise level. Automated bots don't just try to log in. They also probe for known-vulnerable PHP files: things like `radio.php`, `content.php`, `admin.php` in various directories. These scanners hit non-existent PHP files, and PHP-FPM logs "Primary script unknown" errors for each one.

### The Two-Layer Defense

**Layer 1** is the Nginx snippet we already configured above. Known scanner paths get a `444` connection drop. No response, no log entry in most cases, no PHP involvement. This handles the known patterns.

**Layer 2** catches everything else. When a scanner hits a PHP file that isn't covered by the snippet, the request reaches PHP-FPM, which can't find the file and logs a "Primary script unknown" error. Fail2ban watches for these errors.

### The Filter

Create `/etc/fail2ban/filter.d/nginx-wp-scan.conf`:

```ini
[Definition]
failregex = ^.*FastCGI sent in stderr: "Primary script unknown".*client: <HOST>.*$
ignoreregex =
```

### The Jail

Create `/etc/fail2ban/jail.d/nginx-wp-scan.conf`:

```ini
[nginx-wp-scan]
enabled = true
filter = nginx-wp-scan
action = iptables-multiport[name=wp-scan, port="http,https", protocol=tcp]
logpath = /var/www/*/logs/error.log
maxretry = 5
findtime = 60
bantime = 86400
```

| Setting | Value | What it means |
|---------|-------|---------------|
| `maxretry` | 5 | Scan attempts before ban |
| `findtime` | 60 | Time window: 1 minute |
| `bantime` | 86400 | Ban duration: 24 hours |
| `logpath` | `/var/www/*/logs/error.log` | Error logs where "Primary script unknown" appears |

Notice the ban duration: 24 hours, compared to 1 hour for the login jail. The reasoning is different. A legitimate user might trigger the login jail by genuinely forgetting their password. Nobody legitimately requests `radio.php` five times in one minute. A 24-hour ban is appropriate because the only traffic matching this pattern is automated scanning.

### How It Works

```
Scanner → Nginx (snippet match?) → 444 drop (no log, no PHP, no cost)
               ↓ (no match)
        PHP-FPM → "Primary script unknown" → logged in error.log
               ↓
        Fail2ban (reads error.log) → 5 hits in 1min → iptables DROP for 24h
```

The snippet handles the known paths. The jail catches the novel ones. Over time, when I see new paths appearing in my error logs before fail2ban catches them, I add those paths to the Nginx snippet so they get dropped at the first layer instead of the second. The defense improves itself.

### Why 444 Instead of 403

A 403 Forbidden response tells the scanner "this path exists but you're not allowed." A 444 tells the scanner nothing. Nginx closes the TCP connection without sending any HTTP response. The scanner's client gets a connection reset. From the attacker's perspective, it looks like the server might be down, or the port might be firewalled, or the path might not exist. There's no information to work with.

It also saves bandwidth. A 403 response includes HTTP headers, maybe a response body. Multiply that by thousands of scanner requests per day and the savings are real. A 444 sends zero bytes.

## SSL/TLS Hardening

SSL is handled at two levels in this stack: Cloudflare terminates the public-facing SSL connection, and Nginx handles the origin connection between Cloudflare and the server. Even though Cloudflare sits in front, the origin SSL configuration matters because it protects the connection between Cloudflare's edge and your server.

The SSL parameters live in a file that Certbot manages, included in each vhost:

```nginx
include /etc/letsencrypt/options-ssl-nginx.conf;
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
```

The contents of `options-ssl-nginx.conf`:

```nginx
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets on;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
```

The critical settings:

**TLS 1.2 and 1.3 only.** TLS 1.0 and 1.1 are disabled. They have known vulnerabilities and no modern browser needs them. If a client can't speak TLS 1.2 or higher, it can't connect. This is the right tradeoff in 2026.

**OCSP stapling** is enabled in the main `nginx.conf`:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;
```

OCSP stapling means Nginx fetches the certificate revocation status from the CA and includes it in the TLS handshake. Without stapling, the client's browser has to make a separate request to the CA to check if your certificate is revoked. Stapling is faster for the client and more reliable (if the CA's OCSP responder is slow or down, your site still works).

**SSL session cache and tickets** are enabled for performance. The `shared:le_nginx_SSL:10m` session cache stores TLS session parameters so that returning clients can resume their session without a full handshake. The 1440-minute timeout means sessions are cached for 24 hours. `ssl_session_tickets on` enables TLS session tickets, which serve a similar purpose for clients that support them.

**HSTS** (HTTP Strict Transport Security) is handled at the Cloudflare level in this setup, which means Cloudflare adds the `Strict-Transport-Security` header to all responses. If you're not using Cloudflare, add it in Nginx:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

The `server_tokens off` directive in `nginx.conf` hides the Nginx version from response headers and error pages. Combined with `fastcgi_hide_header X-Powered-By`, the server gives away minimal information about its software stack.

## WordPress Application Security

Beyond server-level protections, there are WordPress configuration settings that reduce the attack surface from within the application.

### DISALLOW_FILE_EDIT

This was covered in Part 3, but it belongs in a security discussion. Adding this constant to `wp-config.php` disables the built-in theme and plugin editor in wp-admin:

```php
define('DISALLOW_FILE_EDIT', true);
```

The built-in editor lets any admin user modify PHP files directly through the browser. If an attacker gains admin access, the editor gives them the ability to inject arbitrary PHP code into your theme files. With the editor disabled, compromising an admin account is still bad, but the attacker can't immediately escalate to server-level code execution through the WordPress interface.

### Admin Account Practices

The security audit script checks for a user named `admin` and flags it as a warning. The reason: `admin` is the first username every brute force tool tries. Use a different username for your administrator account. This isn't security through obscurity in the pejorative sense. It's eliminating the most commonly guessed credential. Combined with the rate limiting and fail2ban jails, it makes brute force attacks significantly more expensive for the attacker.

Keep the number of administrator accounts minimal. Every admin account is a potential entry point. The audit script flags when there are more than three. For most setups, one or two is sufficient.

Strong passwords should go without saying, but I'll say it anyway. A 20+ character password generated by a password manager is non-negotiable for any account with administrative access.

### Limited Revisions

WordPress stores every revision of every post in the database forever by default. This isn't a security risk directly, but an unbounded database growth vector can become a denial-of-service issue if the database grows large enough to slow down queries. Limit it:

```php
define('WP_POST_REVISIONS', 10);
```

### Automatic Updates

In this setup, automatic updates for WordPress core, themes, and plugins are disabled. Updates are handled through a controlled plugin sync process, which is covered in Part 6. The reasoning: automatic updates on a production server can break functionality without warning. A plugin update that introduces a PHP error can take your site down. Controlled updates let you verify compatibility before deploying.

This is a tradeoff. Disabling automatic updates means you're responsible for applying security patches promptly. The monitoring and audit tools covered later in this post help catch when updates are available.

## WooCommerce Security

If you're running WooCommerce, the stakes are higher because you're handling customer data and payment flows. The good news: most WooCommerce security follows from the infrastructure already in place. But there are additional considerations.

### Payment Page Protection

WooCommerce checkout pages must be served over HTTPS. With the SSL configuration we've built, every page is served over HTTPS, so this is handled by default. But verify it explicitly. Force SSL on checkout in WooCommerce settings, and confirm that your `wp_options` table has `siteurl` and `home` set to `https://` URLs. Mixed content on a checkout page (loading any resource over HTTP) will trigger browser security warnings that destroy customer trust and can prevent payment processing.

### Session Security via Redis

In Part 3, we configured Redis as the WordPress object cache. WooCommerce uses sessions extensively, tracking cart contents, customer data, and checkout state. With Redis handling sessions, the data lives in memory rather than the database, which is both faster and reduces the database attack surface. Session data in Redis also benefits from Redis's built-in key expiration, so stale sessions are automatically cleaned up rather than accumulating in the database.

Ensure Redis is bound to `127.0.0.1` only (which it is by default in our setup). Redis should never be accessible from the network. It has no authentication mechanism enabled in the default configuration, and exposing it to the internet is one of the most common server misconfigurations that leads to data breaches.

### Customer Data Considerations

WooCommerce stores customer names, addresses, email addresses, and order history in the WordPress database. The database security measures from earlier in this series (MariaDB bound to localhost, strong root password, dedicated per-site database users with minimal privileges) provide the infrastructure-level protection. At the application level, limit which WordPress users have access to customer data. Shop Manager and Administrator roles can see order details. Keep the number of users with these roles to what's actually needed.

### PCI Compliance Basics

If you're using a hosted payment gateway like Stripe or PayPal, the payment data (card numbers, CVVs) never touches your server. The customer enters their payment details on the gateway's domain or in an embedded iframe, and the gateway handles the PCI-sensitive processing. Your server handles the order data and the gateway's confirmation, but not the actual card data.

This significantly reduces your PCI compliance burden. You still need to maintain a secure server (which this entire post is about), use HTTPS on all pages that handle customer data, and keep your software updated. But you don't need the full PCI DSS audit that would be required if card data passed through your server.

## Monitoring What Gets Blocked

Security that you can't observe is security you can't trust. There are three ways to monitor the protections we've built.

### Fail2ban Jail Status

Check the status of each jail to see how many IPs are currently banned and how many have been banned total:

```bash
sudo fail2ban-client status wordpress-login
sudo fail2ban-client status nginx-wp-scan
```

The output shows currently banned IPs, total banned count, and the log file being monitored. On an active server, the `nginx-wp-scan` jail will consistently show more bans than the login jail, because scanner traffic vastly outweighs login brute force traffic.

To unban a specific IP (if you accidentally trigger your own rules during testing):

```bash
sudo fail2ban-client set wordpress-login unbanip 1.2.3.4
```

### Access Log Analysis

The Nginx access logs show the raw traffic hitting your server, including the blocked requests. Looking at patterns in these logs over time tells you what's being targeted. Common patterns I see: waves of POST requests to `wp-login.php` (brute force), GET requests to `xmlrpc.php` (probing), and GET requests to random PHP filenames at the root level (vulnerability scanning).

### The Security Audit Script

The `wp-security-check` script performs a comprehensive, read-only scan across three levels: the server, each WordPress instance, and the Nginx logs. It's safe to run anytime and makes no modifications.

At the server level, it checks for available OS updates (flagging security patches as critical), verifies SSH configuration (root login disabled, password auth disabled), confirms the firewall is active, counts failed SSH login attempts in the last 24 hours, verifies fail2ban is running and reports banned IP counts, lists open ports, and checks disk usage.

Per WordPress instance, it runs a thorough set of checks. Core file integrity verification uses `wp core verify-checksums` to detect any modified or injected core files. Plugin update availability is checked and listed. The script scans for nulled or pirated plugins by searching for known indicators like `wordpressnull`, `gpldl`, or `warez` strings in plugin files. It searches the uploads directory for PHP files, which should never exist there, and scans `wp-content/` for common backdoor patterns: `eval(base64_decode`, `shell_exec($_`, `passthru($_`, and similar constructs. Configuration checks verify that `WP_DEBUG` is disabled, `DISALLOW_FILE_EDIT` is set, the database prefix isn't the default `wp_`, and `wp-config.php` has appropriate file permissions. It lists administrator accounts and flags the `admin` username if it exists. It checks for PHP files modified in the last 24 hours (excluding cache and backup directories). And it verifies that XML-RPC is blocked.

The Nginx log analysis section checks for brute force patterns (more than 100 POST requests to `wp-login.php` triggers a critical alert), XML-RPC abuse (more than 50 POST requests), scanner probe activity (path traversal attempts, `.env` access, `.git` probes), and overall error rates (flagging when 4xx/5xx responses exceed 30% of total traffic).

Output is color-coded: critical issues that need immediate attention, warnings that should be addressed, and OK checks that passed. The exit code equals the number of critical issues found, so a clean scan returns 0.

```bash
sudo /usr/local/bin/wp-security-check
```

Reports are saved to `/var/log/wp-backups/security-YYYY-MM-DD.log`. I run this weekly via cron on Monday mornings:

```bash
0 7 * * 1 /usr/local/bin/wp-security-check 2>&1 | \
    sed 's/\x1b\[[0-9;]*m//g' >> /var/log/wp-security-check.log
```

The `sed` command strips ANSI color codes so the log file is readable as plain text.

## What's Next

Everything in this post builds on the foundation from Part 1. SSH hardening, the UFW firewall, and the basic fail2ban SSH jail were the server-level baseline. This post added the WordPress-specific layers: Nginx request filtering, fail2ban login and scanner jails, SSL hardening, application configuration, and monitoring.

The defense is layered and largely automatic. Nginx drops known-bad requests before they cost anything. Fail2ban catches behavioral patterns and bans offending IPs at the kernel level. The security audit script verifies everything is working and catches issues that automated defenses don't cover, like outdated plugins or modified core files.

For a personal account of what happens when you get security right but lock yourself out in the process, I wrote about that separately. TOTP two-factor authentication is excellent security practice until you lose access to your authenticator app while sitting at a terminal with no backup codes.

Full configs for everything in this post are in the [companion repository](https://github.com/b1azk0/wordpress-infrastructure) under `05-security-hardening/`.

*Previous: Part 4, "Four Layers of Caching"*

*Next: Part 6, "Automating the Boring Parts"*


---

## WordPress Infrastructure from Scratch — Full Series

1. [Why I Ditched Managed Hosting](/blog/wp-infra-01-why-i-ditched-managed-hosting)
2. [Building the LEMP Stack](/blog/wp-infra-02-building-the-lemp-stack)
3. [Deploying WordPress the Right Way](/blog/wp-infra-03-deploying-wordpress)
4. [Four Layers of Caching](/blog/wp-infra-04-four-layers-of-caching)
5. [Locking It Down](/blog/wp-infra-05-locking-it-down)
6. [Automating the Boring Parts](/blog/wp-infra-06-automating-the-boring-parts)
7. [Watching Over It All](/blog/wp-infra-07-watching-over-it-all)
