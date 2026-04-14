---
title: "LEMP Stack for WordPress: Nginx, MariaDB 11.8, and PHP 8.4 on Debian 13"
date: 2026-04-06
tags: [devops-reality, wordpress, hetzner, server-backend, nginx, mariadb, php]
audience: [founders-operators, ai-practitioners]
format: deep-dive
description: "Step-by-step LEMP stack setup for WordPress on Hetzner VPS. Nginx tuning, MariaDB 11.8 InnoDB configuration, PHP 8.4 FPM static pools, OPcache JIT, and kernel optimization."
status: published
label: infrastructure
safety_review: false
---

> *This is Part 2 of "WordPress Infrastructure from Scratch," a hands-on guide to building production WordPress and WooCommerce hosting on Hetzner. Code and configs at the [companion repository](https://github.com/b1azk0/wordpress-infrastructure).*

## Table of Contents

- [Nginx Configuration for WordPress Performance](#nginx-configuration-for-wordpress-performance)
- [MariaDB 11.8 InnoDB Tuning for WordPress](#mariadb-118-innodb-tuning-for-wordpress)
- [PHP 8.4 FPM: Static Pool Configuration](#php-84-fpm-static-pool-configuration)
- [PHP OPcache and JIT Compilation Settings](#php-opcache-and-jit-compilation-settings)
- [Linux Kernel Tuning for Web Servers](#linux-kernel-tuning-for-web-servers)
- [WordPress Directory Structure on VPS](#wordpress-directory-structure-on-vps)
- [Verifying the LEMP Stack Installation](#verifying-the-lemp-stack-installation)

At the end of Part 1, you have a locked-down Debian 13 server sitting on Hetzner. UFW is configured, SSH is hardened, root login is disabled. The server is secure. It also can't serve a single web page.

Every decision in this post has downstream consequences that won't show up until you're running four sites with a WooCommerce store processing orders at 2 AM. The guides online say `apt install nginx mysql php` and move on. That gets you a working server. It doesn't get you a fast one. The defaults for Nginx, MariaDB, and PHP are designed for the broadest possible compatibility across every use case from a Raspberry Pi to a 256-core database server. WordPress is none of those things. It's a specific workload with specific resource patterns, and the stack should be configured to match.

I run four Hetzner servers across two tiers: small (CX22, 2 vCPU, 4 GB RAM) and large (CX32/CPX32, 4 vCPU, 8 GB RAM). Where config values differ by tier, I'll show both. If I show only one value, it applies to both.

## Nginx Configuration for WordPress Performance

Installation is the easy part:

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

Verify it's running:

```bash
systemctl status nginx --no-pager
curl -I http://127.0.0.1
```

You should see the default Nginx welcome page. Now replace the entire default `nginx.conf` with something that actually understands what it's about to serve. Full config file in the [companion repository](https://github.com/b1azk0/wordpress-infrastructure) under `02-lemp-stack/`.

Here's the complete `/etc/nginx/nginx.conf`:

```nginx
user www-data;
worker_processes auto;
worker_cpu_affinity auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    # Rate limiting for wp-login brute force protection
    limit_req_zone $binary_remote_addr zone=wp_login:10m rate=5r/m;
    limit_req_status 429;

    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    types_hash_max_size 2048;
    server_tokens off;

    # Upload limit
    client_max_body_size 128M;

    # Keepalive
    keepalive_timeout 30;
    keepalive_requests 1000;

    # FastCGI buffer tuning
    fastcgi_buffer_size 32k;
    fastcgi_buffers 16 16k;
    fastcgi_busy_buffers_size 32k;

    # FastCGI page cache
    fastcgi_cache_path /var/cache/nginx/fastcgi_cache
        levels=1:2
        keys_zone=WP:200m
        inactive=120m
        max_size=2g;
    fastcgi_cache_key "$scheme$request_method$host$request_uri";

    # Open file cache
    open_file_cache max=10000 inactive=60s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Gzip
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_vary on;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml
        application/xml+rss
        image/svg+xml;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # TLS Performance
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;
    ssl_buffer_size 4k;

    # Logging
    access_log /var/log/nginx/access.log;

    # Virtual Hosts
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

Let me walk through what each non-default setting does and why it matters for WordPress specifically.

### Worker and Connection Settings

`worker_processes auto` tells Nginx to spawn one worker per CPU core. On a CX22 that's 2 workers, on a CX32 it's 4. Each worker is an independent event loop that handles connections without blocking the others. `worker_cpu_affinity auto` pins each worker to a specific core, reducing CPU cache thrashing.

`worker_rlimit_nofile 65535` raises the per-worker file descriptor limit. The kernel default is 1024. When Nginx serves a cached response, it opens the cache file, the response body, and the socket to the client. Static assets multiply this further. Running out of file descriptors under load kills connections silently. Raise it once and never think about it again.

`worker_connections 4096` sets the maximum simultaneous connections per worker. With 2 workers, that's 8,192 concurrent connections. With 4 workers, it's 16,384. This sounds like overkill for a WordPress server, and it is for normal traffic. The headroom matters during traffic spikes and when Nginx is serving cached responses at line speed.

`multi_accept on` lets each worker accept multiple connections per event loop iteration instead of one at a time. `use epoll` selects Linux's most efficient event notification mechanism.

### HTTP Settings

`sendfile on` tells Nginx to use the kernel's sendfile() syscall, which transfers files directly from disk to network socket without copying through userspace. For static assets like images and CSS, this is significantly faster. `tcp_nopush on` batches response headers with the first chunk of body data into a single TCP packet. `tcp_nodelay on` disables Nagle's algorithm to send small packets immediately. These three settings together optimize the kernel's handling of HTTP responses.

`server_tokens off` hides the Nginx version from response headers. No need to advertise your exact software version to vulnerability scanners.

`keepalive_timeout 30` with `keepalive_requests 1000` keeps connections alive for 30 seconds and allows up to 1,000 requests per connection. A WordPress page load triggers dozens of subsequent requests for CSS, JS, images, and fonts. Reusing the TCP connection for all of those eliminates repeated handshake overhead.

### FastCGI Buffer Tuning

```nginx
fastcgi_buffer_size 32k;
fastcgi_buffers 16 16k;
fastcgi_busy_buffers_size 32k;
```

These control how Nginx buffers responses from [PHP-FPM](/glossary/php-fpm/). `fastcgi_buffer_size 32k` handles the response headers. WordPress generates large headers, especially with plugins adding cookies and custom headers. The default 4k or 8k frequently causes "upstream sent too big header" warnings in the error log.

`fastcgi_buffers 16 16k` allocates 16 buffers of 16 KB each (256 KB total) for the response body. WordPress pages with lots of content, WooCommerce product listings, or admin dashboard pages regularly exceed the default buffer size. When the buffer overflows, Nginx spills to disk, which is slow. 256 KB keeps most WordPress responses entirely in memory.

### FastCGI Cache Zone

```nginx
fastcgi_cache_path /var/cache/nginx/fastcgi_cache
    levels=1:2
    keys_zone=WP:200m
    inactive=120m
    max_size=2g;
fastcgi_cache_key "$scheme$request_method$host$request_uri";
```

I'm defining the [FastCGI cache](/glossary/fastcgi-cache/) zone now even though we won't wire it into vhosts until Post 4. The `fastcgi_cache_path` directive must live in the `http{}` block. It defines a shared memory zone called `WP` with 200 MB for cache keys, a maximum disk footprint of 2 GB, and a 120-minute inactivity timeout. The `fastcgi_cache_key` is also defined here at the `http{}` level. This is critical. If you define the cache key in a `location` block inside a vhost, Nginx will silently use the wrong key, and every URL will serve the same cached page. I learned this one the hard way. All pages returning the homepage content. Took longer than I'd like to admit to trace it back to a duplicate `fastcgi_cache_key` directive in a vhost file.

Create the cache directory now:

```bash
sudo mkdir -p /var/cache/nginx/fastcgi_cache
sudo chown -R www-data:www-data /var/cache/nginx
```

### Open File Cache

```nginx
open_file_cache max=10000 inactive=60s;
open_file_cache_valid 60s;
open_file_cache_min_uses 2;
open_file_cache_errors on;
```

Every time Nginx serves a static file, it calls `stat()` to check if the file exists and get its metadata. On a WordPress site with dozens of static assets per page, that's dozens of system calls per request. The open file cache stores file descriptors and metadata for up to 10,000 files, revalidates them every 60 seconds, and requires a file to be accessed at least twice before caching it. `open_file_cache_errors on` caches negative lookups too, so Nginx won't repeatedly check for files that don't exist (bots love requesting random paths).

### Gzip Compression

```nginx
gzip on;
gzip_comp_level 5;
gzip_min_length 1024;
gzip_proxied any;
gzip_vary on;
```

`gzip_comp_level 5` is the sweet spot. Level 1 barely compresses. Level 9 burns CPU for diminishing returns. Level 5 achieves roughly 80% of maximum compression at a fraction of the CPU cost. `gzip_min_length 1024` skips files under 1 KB since compression overhead exceeds the savings at that size. `gzip_proxied any` compresses responses even when the request came through a proxy, which matters when Cloudflare sits in front.

A note on Brotli: don't install it on the server. Cloudflare handles Brotli compression at the edge. Server-side Brotli adds compile-from-source complexity for zero benefit behind a CDN.

## MariaDB 11.8 InnoDB Tuning for WordPress

Debian 13 ships MariaDB 11.8, which is a meaningful upgrade from 10.x. It's also where two specific configuration gotchas will waste your afternoon if you follow older tutorials.

### Installation

```bash
sudo apt install -y mariadb-server mariadb-client
sudo systemctl enable --now mariadb
```

Secure the installation. On Debian 13, the command is `mariadb-secure-installation`, not the old MySQL-era name:

```bash
sudo mariadb-secure-installation
```

Set a strong root password, remove anonymous users, disallow remote root login, remove the test database. Standard procedure.

### InnoDB Configuration

Edit `/etc/mysql/mariadb.conf.d/50-server.cnf`. Under the `[mysqld]` section:

**Small tier (2 vCPU / 4 GB RAM):**

```ini
innodb_buffer_pool_size = 512M
innodb_buffer_pool_size_max = 1G
innodb_log_file_size = 128M
innodb_io_capacity = 2000
innodb_io_capacity_max = 4000
max_connections = 50
```

**Large tier (4 vCPU / 8 GB RAM):**

```ini
innodb_buffer_pool_size = 1536M
innodb_buffer_pool_size_max = 2G
innodb_log_file_size = 256M
innodb_io_capacity = 2000
innodb_io_capacity_max = 4000
max_connections = 50
```

Under the `[mariadb-11.8]` section, add the additional tuning:

```ini
skip-name-resolve
tmp_table_size = 64M
max_heap_table_size = 64M
sort_buffer_size = 4M
join_buffer_size = 4M
```

Let me explain the reasoning behind these values.

`innodb_buffer_pool_size` is the single most important MariaDB setting. It determines how much data InnoDB keeps in RAM. WordPress reads from the database constantly: every page load, every admin action, every WooCommerce cart update. If the data isn't in the buffer pool, it comes from disk. On a 4 GB server, 512 MB is roughly 12% of total RAM. On an 8 GB server, 1536 MB is about 19%. These numbers leave enough headroom for PHP-FPM, Nginx, Redis, and the OS.

`innodb_log_file_size` controls the redo log. Larger logs mean fewer checkpoints, which means fewer I/O stalls during heavy write activity. 128 MB on small, 256 MB on large. WordPress isn't write-heavy under normal operation, but WooCommerce order processing, plugin updates, and migrations generate significant write traffic.

`innodb_io_capacity` and `innodb_io_capacity_max` at 2000/4000 tell InnoDB how fast the underlying storage is. Hetzner uses NVMe SSDs, which can handle thousands of IOPS. The default values (200/2000) assume spinning disks and throttle InnoDB's background flushing unnecessarily.

`max_connections = 50` sounds low. It's intentional. Each PHP-FPM worker holds one database connection. With 6 workers on a small server or 12 on a large one, you need at most 12 connections for PHP, plus a few for WP-CLI, cron jobs, and your admin session. Setting this to the MySQL default of 151 wastes memory on connection buffers that will never be used. Each idle connection consumes roughly 1 MB of RAM.

`skip-name-resolve` prevents MariaDB from doing DNS lookups for connecting clients. Since everything connects via localhost, DNS resolution adds latency for no reason.

### The MariaDB 11.8 Gotchas

These two cost me real hours. If you're coming from any MariaDB 10.x tutorial, pay attention.

**First: `innodb_buffer_pool_instances` has been removed.** Completely gone from MariaDB 11.8. If you include it in your config, MariaDB will either fail to start or silently ignore it depending on context. Every older tuning guide recommends setting this to match your CPU count. Don't. MariaDB 11.8 manages buffer pool concurrency internally. Remove the line entirely.

**Second: `innodb_buffer_pool_size_max` must be set explicitly.** In 11.8, this setting defaults to whatever you set `innodb_buffer_pool_size` to. That means dynamic resizing is effectively disabled by default. If a monitoring tool or your own judgment says the buffer pool should grow, MariaDB can't do it unless `innodb_buffer_pool_size_max` gives it room. Set it to double your initial pool size or whatever fits your available RAM.

Restart and verify:

```bash
sudo systemctl restart mariadb
sudo mysql -e "SELECT @@innodb_buffer_pool_size / 1024 / 1024 AS 'pool_MB';"
```

The query should return 512 or 1536 depending on your tier.

## PHP 8.4 FPM: Static Pool Configuration

Debian 13 includes PHP 8.4 in its default repositories. Install the base package plus every extension WordPress and its plugin ecosystem commonly need:

```bash
sudo apt install -y php-fpm php-mysql php-cli php-curl php-gd \
    php-mbstring php-xml php-zip php-intl php-soap
sudo apt install -y imagemagick php-imagick php-redis
```

Enable and start the versioned service:

```bash
sudo systemctl enable --now php8.4-fpm
```

Verify the installed extensions:

```bash
php -v
php -m | egrep -i 'curl|gd|mbstring|mysqli|xml|zip|intl|imagick|redis'
```

The extension list matters. `php-mysql` provides the MySQLi and PDO drivers. `php-gd` and `php-imagick` handle image processing (thumbnails, media uploads). `php-mbstring` is required for multibyte string handling, especially important for multilingual sites. `php-xml` is needed by the WordPress importer and most SEO plugins. `php-zip` is required for plugin/theme installation from ZIP files. `php-intl` handles internationalization. `php-redis` connects PHP to the Redis object cache. `php-soap` is needed by some WooCommerce payment gateways and shipping integrations.

### PHP Limits

Edit `/etc/php/8.4/fpm/php.ini`:

```ini
upload_max_filesize = 128M
post_max_size = 128M
memory_limit = 256M
max_execution_time = 300
max_input_time = 300
```

The `128M` upload limit matches the `client_max_body_size` we set in Nginx. Both limits must agree. If Nginx allows 128 MB but PHP allows 2 MB (the default), uploads fail at the PHP level. If PHP allows 128 MB but Nginx allows 1 MB, uploads fail at the Nginx level. Either way, the error messages are unhelpful.

### FPM Pool Configuration

Edit `/etc/php/8.4/fpm/pool.d/www.conf`. The critical settings:

```ini
[www]
user = www-data
group = www-data

listen = /run/php/php8.4-fpm.sock
listen.owner = www-data
listen.group = www-data

pm = static
pm.max_children = 6    ; Small tier: 6, Large tier: 12
pm.max_requests = 500
```

The choice of `pm = static` over `pm = dynamic` or `pm = ondemand` deserves explanation because most guides recommend `dynamic`.

With `dynamic`, PHP-FPM spawns and kills worker processes based on demand. Workers that sit idle get killed. When a burst of traffic arrives, new workers have to be spawned. Spawning a PHP worker means forking the process, loading all extensions, warming the OPcache for that worker, and allocating memory. On a 2-vCPU server, that costs tens of milliseconds per worker. During a traffic spike, you're spawning workers exactly when you can least afford the overhead.

With `static`, all workers are running all the time. They're warm, their OPcache is hot, and they're ready to handle requests immediately. The tradeoff is memory: 6 workers consume roughly 200-300 MB per worker under WordPress, so that's 1.2 to 1.8 GB dedicated to PHP at all times. On a 4 GB server, that's a deliberate allocation. On an 8 GB server with 12 workers, it's 2.4 to 3.6 GB. The math works because I've already budgeted the rest of the RAM across MariaDB, Redis, Nginx, and the OS.

To calculate `max_children` for your own setup: run `ps -ylC php-fpm8.4 --sort:rss` under normal WordPress load, note the average RSS per worker, and divide your PHP memory budget by that number.

`pm.max_requests = 500` recycles each worker after 500 requests. Some WordPress plugins leak memory. The amounts are small, 1-2 MB per request, and they add up. After 500 requests, the worker is replaced with a fresh one. This prevents slow memory creep from eventually triggering the OOM killer.

### Install WP-CLI

WP-CLI is the WordPress command-line interface. It handles everything from installing WordPress to managing plugins, running database operations, and clearing caches, all without a browser.

```bash
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp
wp --info
```

## PHP OPcache and JIT Compilation Settings

[OPcache](/glossary/opcache/) is PHP's built-in opcode cache. Without it, every PHP request means parsing every PHP file from source, compiling it to opcodes, executing the opcodes, then throwing the compiled result away. WordPress loads hundreds of PHP files per request across core, theme, and plugins. OPcache compiles each file once and stores the result in shared memory. Subsequent requests use the cached opcodes directly.

Edit `/etc/php/8.4/fpm/conf.d/10-opcache.ini`:

```ini
zend_extension=opcache.so
opcache.enable=1
opcache.enable_cli=0
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.max_wasted_percentage=10
opcache.validate_timestamps=0
opcache.revalidate_freq=0
```

`opcache.memory_consumption=256` allocates 256 MB for cached opcodes. A typical WordPress site with 20-30 plugins compiles to 40-60 MB of opcodes. With multiple sites per server, 256 MB provides comfortable headroom.

`opcache.max_accelerated_files=20000` is the maximum number of PHP files OPcache will track. WordPress core alone is around 1,500 files. Add WooCommerce, a theme, and a dozen plugins and you're easily past 5,000. The 20,000 limit handles even the most plugin-heavy installations.

`opcache.validate_timestamps=0` is the aggressive setting. It tells OPcache to never check if the source file has changed. Once a file is compiled, the cached version is used until PHP-FPM is restarted. This eliminates `stat()` calls on every request for every PHP file. The downside: after updating a plugin or WordPress core, you must restart PHP-FPM for changes to take effect. For production servers where updates happen through a controlled process, this is the right tradeoff.

### JIT Configuration

Create or edit `/etc/php/8.4/fpm/conf.d/99-performance.ini`:

**Small tier:**

```ini
opcache.jit=1255
opcache.jit_buffer_size=64M
```

**Large tier:**

```ini
opcache.jit=1255
opcache.jit_buffer_size=128M
```

JIT (Just-In-Time) compilation takes the cached opcodes and compiles them further into native machine code. The `1255` mode enables all optimization levels: CPU-specific optimizations, function-level JIT, tracing JIT for hot loops, and all opcodes compiled. For WordPress specifically, JIT benefits are modest on cached page loads (those hit Nginx's FastCGI cache anyway) but meaningful for admin operations, WooCommerce order processing, and any PHP-heavy operation that can't be cached.

The JIT buffer size determines how much native code can be stored. 64 MB is enough for 2-3 WordPress sites, 128 MB for 4-5 with WooCommerce.

Restart PHP-FPM after all changes:

```bash
sudo systemctl restart php8.4-fpm
```

## Linux Kernel Tuning for Web Servers

The kernel defaults are conservative. For a web server handling concurrent connections, several settings need to change.

### Sysctl (TCP and File Descriptors)

Create `/etc/sysctl.d/99-wordpress-perf.conf`:

```ini
# File descriptors
fs.file-max = 65535

# TCP performance
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# Reuse TIME_WAIT sockets
net.ipv4.tcp_tw_reuse = 1

# Faster keepalive detection
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 5

# Larger TCP buffers
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Swap preference
vm.swappiness = 10
```

Apply:

```bash
sudo sysctl -p /etc/sysctl.d/99-wordpress-perf.conf
```

`net.core.somaxconn = 65535` raises the socket listen backlog. When Nginx's `worker_connections` is set to 4096, the kernel needs to queue incoming connections at least that deep. The default of 128 is a bottleneck under any real load.

`net.ipv4.tcp_tw_reuse = 1` allows the kernel to reuse sockets in TIME_WAIT state for new outgoing connections. After a TCP connection closes, it enters a 60-second TIME_WAIT period by default. On a busy server, thousands of sockets can pile up in TIME_WAIT, eventually exhausting the available port range. This is safe for single-server setups where you control both sides of the connection.

`net.ipv4.tcp_keepalive_time = 300` reduces the idle time before the kernel sends keepalive probes from the default 7200 seconds (2 hours) to 300 seconds. Dead connections get detected and cleaned up faster.

`vm.swappiness = 10` tells the kernel to strongly prefer RAM over swap. The default of 60 means the kernel starts swapping relatively early. With a web server workload where latency matters, you want data in RAM as long as possible. The swap exists as an emergency safety net, not as a performance tier.

### File Descriptor Limits

Create `/etc/security/limits.d/99-wordpress.conf`:

```
www-data    soft    nofile    65535
www-data    hard    nofile    65535
root        soft    nofile    65535
root        hard    nofile    65535
```

This matches the `worker_rlimit_nofile 65535` we set in Nginx. The kernel limit (`fs.file-max`), the user limit (`nofile`), and the Nginx directive all need to agree.

### Swap Configuration

Check if swap exists:

```bash
sudo swapon --show
```

If no swap is configured, create it.

**Small tier (2 GB):**

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Large tier (4 GB):**

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Swap prevents the OOM killer from terminating MariaDB or PHP-FPM during traffic spikes, large migration imports, or that moment when a WooCommerce sale drives unexpected traffic. With `vm.swappiness = 10`, the system will use RAM almost exclusively under normal operation. Swap only activates when RAM is genuinely exhausted.

If your Hetzner plan supports it, ZRAM is worth considering as a complement. ZRAM creates a compressed swap device in RAM, giving you a middle tier between fast RAM and slow disk swap. On a 4 GB server, a 1 GB ZRAM device at 2:1 compression effectively gives you 2 GB of extra memory capacity before hitting disk. It's not required and I won't cover the setup here, but it's a good optimization for memory-constrained tiers.

## WordPress Directory Structure on VPS

WordPress sites follow a consistent layout:

```bash
sudo mkdir -p /var/www/example.com/{public,logs}
sudo chown -R www-data:www-data /var/www/example.com
sudo chmod -R 755 /var/www/example.com
```

Replace `example.com` with your actual domain. Each site gets its own directory under `/var/www/` with two subdirectories. `public` holds the WordPress installation. `logs` holds per-site access and error logs.

This layout keeps sites isolated. Each Nginx vhost points `root` to `/var/www/<domain>/public` and directs `access_log` and `error_log` to `/var/www/<domain>/logs/`. When something goes wrong with one site, you check that site's logs without wading through a combined log file.

Repeat this for each domain you plan to host. The structure will be referenced in Post 3 when we deploy WordPress and in Post 4 when we configure individual vhost files.

## Verifying the LEMP Stack Installation

Test every service before moving on. A misconfiguration caught now saves hours of debugging later.

### Nginx

```bash
sudo nginx -t
systemctl status nginx --no-pager
```

`nginx -t` validates the configuration syntax. You should see `syntax is ok` and `test is successful`. If it complains about the `fastcgi_cache_path`, make sure the cache directory exists and is owned by `www-data`.

### MariaDB

```bash
systemctl status mariadb --no-pager
mariadb -u root -p -e "SELECT VERSION();"
sudo mysql -e "SELECT @@innodb_buffer_pool_size / 1024 / 1024 AS 'pool_MB';"
```

The version query confirms MariaDB is running. The buffer pool query confirms your tier-specific tuning took effect. If it shows 128 (the default) instead of 512 or 1536, your config file isn't being read. Check for duplicate settings across multiple `.cnf` files in `/etc/mysql/mariadb.conf.d/`.

### PHP-FPM

```bash
systemctl status php8.4-fpm --no-pager
php -v
php -m | egrep -i 'curl|gd|mbstring|mysqli|xml|zip|intl|imagick|redis|opcache'
```

Confirm that PHP 8.4 is running, and that all extensions including `opcache` and `redis` appear in the module list.

### OPcache

```bash
php -r "var_dump(opcache_get_status());"
```

Look for `opcache_enabled: true` in the output. The CLI output won't show JIT status accurately since `opcache.enable_cli` is off. JIT status under FPM can be verified after deploying a site by creating a `phpinfo()` page (temporarily) or using the Object Cache Pro dashboard.

### Redis

```bash
systemctl status redis-server --no-pager
redis-cli ping
```

You should get `PONG`. Redis is configured to bind to `127.0.0.1` with `protected-mode yes`, `maxmemory 256mb`, and `maxmemory-policy allkeys-lru`. It's ready for the Object Cache Pro plugin we'll configure in Post 3.

### Stack Integration Test

This quick script verifies all components can talk to each other:

```bash
php -r "
\$mysqli = new mysqli('localhost', 'root', 'YOUR_ROOT_PASSWORD');
echo \$mysqli->connect_error ? 'DB FAIL' : 'DB OK: MariaDB ' . \$mysqli->server_info;
echo PHP_EOL;
\$redis = new Redis();
\$redis->connect('127.0.0.1', 6379);
echo 'Redis: ' . (\$redis->ping() ? 'OK' : 'FAIL');
echo PHP_EOL;
\$mysqli->close();
"
```

Expected output:

```
DB OK: MariaDB 11.8.x
Redis: OK
```

Delete any test scripts when you're done.

---

The stack is running. Nginx is configured for WordPress workloads with proper buffering, caching zones, and compression. MariaDB has InnoDB tuned for your tier with the 11.8-specific settings that older guides get wrong. PHP 8.4 FPM is running in static mode with OPcache and JIT compiled. The kernel is tuned for high-connection web serving. Redis is standing by for object caching.

In Part 3, we deploy WordPress itself: `wp-config.php` configuration, database creation, the Nginx vhost with FastCGI cache wiring, SSL certificates via Certbot, and the essential plugin stack including Object Cache Pro and Nginx Helper.

---

## WordPress Infrastructure from Scratch — Full Series

1. [Why I Ditched Managed Hosting](/blog/wp-infra-01-why-i-ditched-managed-hosting)
2. **Building the LEMP Stack** *(you are here)*
3. [Deploying WordPress the Right Way](/blog/wp-infra-03-deploying-wordpress)
4. [Four Layers of Caching](/blog/wp-infra-04-four-layers-of-caching)
5. Locking It Down *(stay tuned)*
6. Automating the Boring Parts *(stay tuned)*
7. Watching Over It All *(stay tuned)*
