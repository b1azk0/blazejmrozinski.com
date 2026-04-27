---
title: "Production WordPress Deployment with Redis Object Cache Pro and Nginx"
date: 2026-04-09
tags: [object-cache-pro, wordpress-redis, wordpress-deployment, devops-reality, wordpress, hetzner, woocommerce]
audience: [founders-operators, ai-practitioners]
format: deep-dive
description: "Production WordPress deployment on a VPS: wp-config.php constants, Redis Object Cache Pro setup, Nginx vhosts, SSL via Cloudflare, and the wp-config ordering bug nobody warns you about."
status: published
label: infrastructure
safety_review: false
---

> *This is Part 3 of "WordPress Infrastructure from Scratch," a hands-on guide to building production WordPress and WooCommerce hosting on Hetzner. Code and configs at the [companion repository](https://github.com/b1azk0/wordpress-infrastructure).*

## Table of Contents

1. [Why the 5-Minute Install Isn't Enough](#why-the-5-minute-install-isnt-enough)
2. [Database Setup: One Database Per Site](#database-setup-one-database-per-site)
3. [WordPress Installation via WP-CLI](#wordpress-installation-via-wp-cli)
4. [wp-config.php Done Right](#wp-configphp-done-right)
5. [Redis and Object Cache Pro](#redis-and-object-cache-pro)
6. [Nginx Vhost Configuration](#nginx-vhost-configuration)
7. [SSL with Let's Encrypt and Cloudflare](#ssl-with-lets-encrypt-and-cloudflare)
8. [The Plugin Stack](#the-plugin-stack)
9. [WooCommerce Deployment Specifics](#woocommerce-deployment-specifics)
10. [Verification](#verification)
11. [What Comes Next](#what-comes-next)

---

## Why the 5-Minute Install Isn't Enough

Every WordPress tutorial starts the same way. Download, unzip, point your browser at the installer, click through three screens, done. Congratulations, you have a working WordPress site. You also have a site with no object caching, default memory limits that will choke under any real load, a wp-config.php full of placeholder values, and zero infrastructure for what happens when something goes wrong at 2 AM.

I learned this the specific way. After building the LEMP stack in [Part 2](/blog/wp-infra-02-building-the-lemp-stack), I installed WordPress and immediately activated Object Cache Pro, my Redis caching layer. Everything looked fine. The plugin showed as active, the settings page loaded, Redis was running. Two hours later I noticed the cache hit rate was exactly zero. Every single request was a miss. Object Cache Pro was silently failing because I had placed the `WP_REDIS_CONFIG` constant in the wrong location in wp-config.php. Not a wrong value. The wrong *line number*.

That experience shaped how I now deploy every WordPress site. The order of operations matters. The specific constants matter. The plugin installation sequence matters. This post walks through all of it.

All config references point to the `03-wordpress-deployment/` directory in the companion repository.

## Database Setup: One Database Per Site

Before WordPress exists on disk, it needs somewhere to store data. Each site gets its own MariaDB database and its own database user. No shared credentials, no shared databases, even when multiple sites live on the same server.

```bash
sudo mariadb -u root -p
```

```sql
CREATE DATABASE wp_sitename DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wp_sitename_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON wp_sitename.* TO 'wp_sitename_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

The naming convention I use: `wp_sitename` for the database, `wp_sitename_user` for the user. So for a site called `mystore.com`, that becomes `wp_mystore` and `wp_mystore_user`.

The per-site isolation matters for two reasons. First, if one site gets compromised, the attacker can't read every other site's data through the same credentials. Second, it makes migration clean. You can dump and restore a single site's database without touching anything else on the server.

## WordPress Installation via WP-CLI

The web installer is fine for a personal blog you're setting up once. For production, WP-CLI is the right tool. It's scriptable, requires no browser, and gives you precise control over every step.

First, create the directory structure:

```bash
sudo mkdir -p /var/www/yourdomain.com/public
sudo mkdir -p /var/www/yourdomain.com/logs
```

Every site follows the same layout: a `public` directory for WordPress files (this becomes the Nginx document root) and a `logs` directory for per-site access and error logs.

Download WordPress:

```bash
cd /tmp
wget https://wordpress.org/latest.tar.gz
tar xzf latest.tar.gz
sudo rsync -a /tmp/wordpress/ /var/www/yourdomain.com/public/
```

Set ownership so [PHP-FPM](/glossary/php-fpm/) can read and write the files:

```bash
sudo chown -R www-data:www-data /var/www/yourdomain.com
sudo find /var/www/yourdomain.com -type d -exec chmod 755 {} \;
sudo find /var/www/yourdomain.com -type f -exec chmod 644 {} \;
```

The `www-data` user matches what Nginx and PHP-FPM run as. Directories get 755 (readable and traversable by everyone, writable by owner), files get 644 (readable by everyone, writable by owner). This is the minimum permission set that lets WordPress function while keeping things locked down.

## wp-config.php Done Right

This is where most guides wave their hands. "Edit wp-config.php with your database credentials." That's technically correct but misses about 90% of what a production wp-config needs.

Start with the sample file:

```bash
cd /var/www/yourdomain.com/public
sudo -u www-data cp wp-config-sample.php wp-config.php
```

Now, the database credentials go in the obvious placeholders:

```php
define( 'DB_NAME', 'wp_sitename' );
define( 'DB_USER', 'wp_sitename_user' );
define( 'DB_PASSWORD', 'STRONG_PASSWORD_HERE' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
```

Then generate unique security keys by visiting `https://api.wordpress.org/secret-key/1.1/salt/` and pasting the output over the placeholder block. Every site needs unique keys. Copy-pasting the same keys across sites is a security hole.

Here are the production constants that go in the section between the salts and the "stop editing" comment:

```php
// Memory limits
define('WP_MEMORY_LIMIT', '256M');      // Small tier (CX22, 4GB RAM)
define('WP_MAX_MEMORY_LIMIT', '512M');  // Admin-side limit

// For large tier servers (CX32, 8GB RAM), use:
// define('WP_MEMORY_LIMIT', '512M');
// define('WP_MAX_MEMORY_LIMIT', '512M');

// Security
define('DISALLOW_FILE_EDIT', true);    // No editing PHP files from wp-admin
define('WP_POST_REVISIONS', 5);        // Keep 5 revisions, not unlimited
define('EMPTY_TRASH_DAYS', 14);

// Disable auto-updates (managed via WP-CLI and scripts)
define('AUTOMATIC_UPDATER_DISABLED', true);
define('WP_AUTO_UPDATE_CORE', false);

// Production debug settings
define('WP_DEBUG', false);
```

`DISALLOW_FILE_EDIT` removes the Theme Editor and Plugin Editor from the WordPress admin entirely. On a production server, nobody should be editing PHP through a web browser. `WP_POST_REVISIONS` set to 5 prevents the database from accumulating hundreds of revision rows per post. The memory limits match the server tier from [Part 2](/blog/wp-infra-02-building-the-lemp-stack). A small Hetzner CX22 with 4 GB RAM gets 256M per request, while a CX32 with 8 GB gets 512M.

I also set `AUTOMATIC_UPDATER_DISABLED` to true because updates are handled through WP-CLI and a plugin sync system that runs after nightly backups. Letting WordPress auto-update itself on a server you've carefully tuned is asking for surprises.

### The Critical Ordering Issue

Now the part that cost me two hours of debugging. The `WP_CACHE` and `WP_REDIS_CONFIG` constants that Object Cache Pro needs have a placement requirement that is easy to miss and produces no error message when you get it wrong.

These defines **must** go at the very top of wp-config.php, right after `<?php`, **before** `$table_prefix` and before the standard WordPress comment blocks. Here is the correct structure:

```php
<?php
define( 'WP_CACHE', true );
define('WP_REDIS_CONFIG', [
    'token' => 'YOUR_OCP_LICENSE_TOKEN',
    'host' => '127.0.0.1',
    'port' => 6379,
    'database' => 0,
    'prefix' => 'sitename:',
    'timeout' => 0.5,
    'read_timeout' => 0.5,
    'async_flush' => true,
    'split_alloptions' => true,
    'prefetch' => true,
    'serializer' => 'igbinary',
    'compression' => 'lzf',
]);

// ... rest of wp-config.php (DB credentials, salts, $table_prefix, etc.)
```

If you place `WP_REDIS_CONFIG` after `$table_prefix`, or in the "extra-php" section that `wp config create` appends to the bottom of the file, Object Cache Pro will report "WP_REDIS_CONFIG constant has not been defined" even though it clearly exists in the file. The reason: OCP's `object-cache.php` drop-in loads before WordPress processes the full config. By the time PHP reaches your constant definition at the bottom, OCP has already tried to read it and failed.

There is no warning in the WordPress admin. There is no PHP error. The plugin page simply shows the cache as inactive, and if you're not watching closely, you won't notice that every request is hitting the database instead of Redis.

I flag this because if you use `wp config create` with its `--extra-php` flag, your Redis config will end up in exactly the wrong place. Edit the file manually or use `wp config set` for these specific constants.

## Redis and Object Cache Pro

With the wp-config constants in the right place, the [Redis object cache](/glossary/redis-object-cache/) integration needs a few more components.

Object Cache Pro is a premium plugin that replaces the free Redis Object Cache with substantially better performance. The key improvements: prefetching (batches multiple Redis calls into one round trip), split alloptions (prevents WordPress from reloading the entire options table on every request), igbinary serialization (faster and smaller than PHP's native serializer), and LZF compression (reduces Redis memory usage).

### Required PHP Extensions

Before OCP can use igbinary and LZF, the extensions need to be installed:

```bash
sudo apt install -y php8.4-igbinary php8.4-msgpack
```

Without these, fall back to `'serializer' => 'php'` and `'compression' => 'none'` in the config array, but you lose meaningful performance.

### The WP_REDIS_CONFIG Array

Each setting in the array serves a specific purpose:

- **host** `127.0.0.1` and **port** `6379`: Redis is local, no network overhead.
- **database**: A number from 0 to 15. Each site on the same server must use a different number. Site one gets 0, site two gets 1, and so on. This prevents cache key collisions between sites.
- **prefix**: A short, unique string per site (like `seosav:` or `prawo:`). Adds another layer of key isolation and makes it easy to identify which site owns which keys when debugging.
- **serializer** `igbinary`: Binary serialization that's both faster to process and produces smaller output than PHP's default serializer.
- **compression** `lzf`: Compresses cached values in Redis, reducing memory consumption.
- **prefetch** `true`: OCP analyzes which cache keys are typically requested together and fetches them in a single Redis call instead of one-at-a-time.
- **split_alloptions** `true`: WordPress stores all autoloaded options in a single cache key called `alloptions`. On a site with many plugins, this blob can be enormous, and changing any single option invalidates the entire thing. Split alloptions breaks it into individual keys.
- **async_flush** `true`: Cache flushes happen asynchronously instead of blocking the request.

### Installing Object Cache Pro

OCP is a premium plugin. The typical installation is to copy it from an existing site on the same server:

```bash
cd /var/www/yourdomain.com/public
sudo cp -r /var/www/existing-site.com/public/wp-content/plugins/object-cache-pro wp-content/plugins/
sudo chown -R www-data:www-data wp-content/plugins/object-cache-pro
sudo -u www-data wp plugin activate object-cache-pro
sudo -u www-data wp redis enable
```

The `wp redis enable` command drops the `object-cache.php` file into `wp-content/`, which is the drop-in that intercepts all cache operations.

### A Note on Relay

Relay is a PHP extension that promises 2-5x faster Redis reads by adding a shared-memory cache layer. I tested Relay 0.12.1 on all servers and removed it. On PHP 8.4, it caused repeated SIGSEGV crashes in PHP-FPM workers, crashing every 30 seconds or so. It also requires a paid license for the in-memory cache to actually activate. Without the license, Relay acts as a plain PhpRedis replacement with zero benefit. If Relay stabilizes in a future version, it might be worth revisiting. For now, PhpRedis plus OCP's own optimizations provide excellent performance without the instability.

## Nginx Vhost Configuration

The Nginx vhost defines how requests reach WordPress. A production configuration needs four server blocks: HTTP non-www redirecting to HTTPS www, HTTPS non-www redirecting to HTTPS www, HTTP www redirecting to HTTPS www, and the main HTTPS www block that actually serves the site.

Here is the main block (the three redirect blocks are straightforward 301s):

```nginx
server {
    listen 443 ssl;
    server_name www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/yourdomain.com/public;
    index index.php index.html;

    include snippets/wp-security.conf;

    access_log /var/www/yourdomain.com/logs/access.log;
    error_log  /var/www/yourdomain.com/logs/error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # FastCGI cache skip rules
    set $skip_cache 0;

    if ($request_method = POST) { set $skip_cache 1; }
    if ($query_string != "") { set $skip_cache 1; }
    if ($http_cookie ~* "wordpress_logged_in_|comment_author_|wp-postpass_|woocommerce_items_in_cart|woocommerce_cart_hash|wp_woocommerce_session_") {
        set $skip_cache 1;
    }
    if ($request_uri ~* "^/(cart|checkout|my-account)(/|$)") { set $skip_cache 1; }
    if ($request_uri ~* "^/wp-admin/|^/wp-login.php") { set $skip_cache 1; }

    # WordPress permalinks
    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    # PHP processing with FastCGI cache
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;

        fastcgi_cache_bypass $skip_cache;
        fastcgi_no_cache     $skip_cache;
        fastcgi_cache        WP;
        fastcgi_cache_valid  200 301 302 60m;
        fastcgi_cache_use_stale error timeout invalid_header updating;
        add_header X-FastCGI-Cache $upstream_cache_status;
        add_header X-Cache-Status $upstream_cache_status always;
        add_header Cache-Control "public, max-age=600" always;
    }

    # WooCommerce sensitive pages: no browser caching
    location ~* ^/(cart|checkout|my-account|wp-admin|wp-login\.php) {
        try_files $uri $uri/ /index.php?$args;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/run/php/php8.4-fpm.sock;
            add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
        }
    }

    # Static assets with long expiry
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 30d;
        log_not_found off;
    }

    # Block access to hidden files
    location ~ /\.ht {
        deny all;
    }
}
```

Several things to note. The `fastcgi_cache WP` directive references the cache zone named `WP` that was defined in `nginx.conf` during the [LEMP stack setup (Part 2)](/blog/wp-infra-02-building-the-lemp-stack). That zone was configured as:

```nginx
fastcgi_cache_path /var/cache/nginx/fastcgi_cache levels=1:2 keys_zone=WP:200m inactive=120m max_size=2g;
```

The skip rules are WooCommerce-aware: POST requests, query strings, logged-in users, and WooCommerce session cookies all bypass the cache. Cart, checkout, and my-account pages get explicit `no-store` headers to prevent browsers from caching sensitive user data.

The `wp-security.conf` snippet that gets included blocks common attack vectors: PHP execution in the uploads directory, Duplicator installer probes, root-level PHP files that don't belong to WordPress core, and PHP execution in theme directories that scanners target. These blocks use Nginx's 444 status code, which drops the connection entirely without sending a response, saving server resources.

After creating the vhost, enable it:

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

The FastCGI cache is wired into the vhost but won't do much yet. Part 4 covers the full caching strategy, including cache warming, purging, and the four layers that work together.

## SSL with Let's Encrypt and Cloudflare

SSL certificates come from Let's Encrypt via Certbot. The process is straightforward until Cloudflare is involved, at which point there's a specific dance to follow.

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Issue the certificate:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Here is where the Cloudflare interaction gets tricky. If your domain is already proxied through Cloudflare (orange cloud icon), Certbot can't verify domain ownership because it sees Cloudflare's IP instead of your server. You need to temporarily switch DNS to "DNS only" (grey cloud) during certificate issuance.

The DNS records themselves also matter. Use A records for both `@` and `www`, both pointing to your Hetzner server IP. The tempting shortcut is to set `www` as a CNAME pointing to `@`. Don't do this. When proxied through Cloudflare, a CNAME for `www` can cause 525 SSL handshake errors. The fix is simple: use A records for both.

The full sequence:

1. In Cloudflare DNS, set both `@` and `www` as A records pointing to your server IP.
2. Set both to "DNS only" (grey cloud).
3. Run `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`.
4. After the certificate is issued, switch both records back to "Proxied" (orange cloud).
5. In Cloudflare SSL/TLS settings, set the mode to **Full (strict)**.

Full (strict) means Cloudflare validates that your origin server has a legitimate certificate, not just any certificate. Since you now have a proper Let's Encrypt cert, this works. Do not use "Flexible" (causes redirect loops) or plain "Full" (less secure than strict).

Also enable Always Use HTTPS, Brotli compression, and HTTP/3 in the Cloudflare dashboard. Note that you do not need server-side Brotli: Cloudflare handles Brotli compression at the edge, and the server-side Gzip configured in `nginx.conf` handles the origin-to-Cloudflare connection.

## The Plugin Stack

A bare WordPress installation is missing several pieces that a production site needs. Here are the six plugins I install on every site, in the order I install them, and why each one matters.

**Object Cache Pro** is the Redis caching layer covered above. It transforms database query performance by caching results in Redis and serving them in microseconds instead of milliseconds. On a site with 50+ plugins, the difference between cached and uncached page generation can be 200ms versus 1500ms.

**All-in-One WP Migration with the Unlimited Extension** handles backups. The free version has a size limit. The Unlimited Extension removes it. This pair is what the nightly `wp-backup` script uses to create `.wpress` archives that get uploaded to OneDrive. Without this plugin installed and active, the automated backup system skips the site entirely.

**Nginx Helper** solves the cache staleness problem. When you publish or edit a post, the FastCGI cache still holds the old version for up to 60 minutes (the TTL from the vhost config). Nginx Helper detects content changes in WordPress and purges the corresponding cache files immediately. Configure it for FastCGI cache mode with "delete local server cache files" as the purge method. Enable purging on homepage, posts, pages, archives, and trashed content.

**Rank Math SEO** provides structured data, sitemaps, and on-page SEO analysis. It's a premium plugin installed from OneDrive via the plugin sync system. Future updates are automatic.

**Smush Pro** handles image optimization. It auto-compresses uploads, strips EXIF metadata, resizes originals to a 2560px maximum, enables lazy loading, and generates WebP versions with automatic fallback. The "Super Smush" compression level is lossy but visually identical to the original. On image-heavy sites, this plugin alone can cut page weight by 40-60%.

**Perfmatters** is the frontend optimization layer. It removes unnecessary WordPress scripts (emoji support, embeds, dashicons on the frontend), delays JavaScript loading until user interaction, minifies CSS and JS, removes unused CSS, and adds speculative prerendering on link hover. For WooCommerce sites specifically, it disables cart fragments, which is a major performance drain. The default WooCommerce cart fragment AJAX call fires on every single page load and costs about 500ms per request.

## WooCommerce Deployment Specifics

For stores, there are additional considerations beyond a standard WordPress site.

WooCommerce sessions need Redis. By default, WooCommerce stores shopping cart sessions in the database, which means a database write on every page a customer visits while shopping. With Object Cache Pro active and Redis configured, WooCommerce sessions get cached in Redis automatically. The automated maintenance script handles cleanup of expired sessions older than 48 hours.

The wp-config.php constants mentioned earlier apply to WooCommerce equally, but memory limits become more important. WooCommerce with a product catalog, payment gateway plugins, and shipping calculators can easily exceed 256M per request. Use 512M for `WP_MEMORY_LIMIT` on any server running a store.

The Nginx vhost config already includes WooCommerce-aware cache skip rules for cart, checkout, and my-account pages, plus detection of WooCommerce session cookies (`woocommerce_items_in_cart`, `woocommerce_cart_hash`, `wp_woocommerce_session_`). This is critical: you never want Cloudflare or FastCGI serving a cached cart page to the wrong customer.

One Nginx Helper setting that matters for WooCommerce: do not enable "purge on every comment." In WooCommerce, order status changes can trigger comment-like events internally, and purging the entire cache on every order status transition will destroy your cache hit rate during busy periods.

## Verification

After everything is in place, verify the stack works end to end.

Check that the site loads:

```bash
curl -I https://www.yourdomain.com
# Should return 200 OK
```

Check the FastCGI cache:

```bash
curl -sI https://www.yourdomain.com | grep X-FastCGI-Cache
# First request: MISS
# Second request: HIT
```

Check Redis and Object Cache Pro:

```bash
cd /var/www/yourdomain.com/public
sudo -u www-data wp redis status
```

Expected output:

```
Status: Connected
Drop-in: Valid
```

If the status shows "Not connected" or the drop-in shows "Invalid," go back to the wp-config.php section and verify the `WP_REDIS_CONFIG` placement. If the license shows as invalid, confirm the token is exactly 60 characters.

Test that WordPress admin works:

```bash
curl -I https://www.yourdomain.com/wp-admin/
# Should redirect to wp-login.php, then show 200 after login
```

Verify cache headers on WooCommerce pages (if applicable):

```bash
curl -sI https://www.yourdomain.com/cart/ | grep Cache-Control
# Should show: no-store, no-cache, must-revalidate, max-age=0
```

## What Comes Next

WordPress is running. SSL is active. Redis is caching database queries. The plugin stack is installed. But right now, every first visit to every page on the site triggers a full PHP execution cycle: WordPress boots, loads plugins, queries the database, assembles the HTML, and sends it to the browser. The FastCGI cache zone is defined in the vhost, and it will start caching responses after the first hit, but there is no strategy around warming it, no purging workflow beyond Nginx Helper, and no understanding of how the four caching layers (OPcache, Redis object cache, FastCGI page cache, Cloudflare edge cache) interact.

Part 4 covers exactly that: the full caching strategy, from why OPcache's JIT compiler matters for WordPress to how a cache warming script pre-generates pages before real visitors arrive.

For a personal account of what happens when production security measures work too well, including against you, I wrote about that separately.

---

## WordPress Infrastructure from Scratch — Full Series

1. [Why I Ditched Managed Hosting](/blog/wp-infra-01-why-i-ditched-managed-hosting)
2. [Building the LEMP Stack](/blog/wp-infra-02-building-the-lemp-stack)
3. **Deploying WordPress the Right Way** *(you are here)*
4. [Four Layers of Caching](/blog/wp-infra-04-four-layers-of-caching)
5. [Locking It Down](/blog/wp-infra-05-locking-it-down)
6. [Automating the Boring Parts](/blog/wp-infra-06-automating-the-boring-parts)
7. [Watching Over It All](/blog/wp-infra-07-watching-over-it-all)
