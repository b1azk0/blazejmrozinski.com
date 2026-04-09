---
term: "SSL/TLS Certificate"
seoTitle: "SSL/TLS Certificates Explained: HTTPS, Let's Encrypt & Cloudflare for Web Security"
description: "SSL/TLS certificates encrypt web traffic and verify server identity. Learn how HTTPS works, certificate types, Let's Encrypt automation, and Cloudflare integration."
definition: "An SSL/TLS certificate is a digital credential that enables encrypted HTTPS connections between a web browser and server, verifying the server's identity and protecting data in transit."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-03-deploying-wordpress"
relatedTerms:
  - "vps"
  - "fail2ban"
status: published
date: 2026-04-09
---

Every website that handles user data — including logins, contact forms, and anything transactional — needs HTTPS. SSL/TLS certificates are the mechanism that makes HTTPS work. They do two things: establish an encrypted channel between browser and server so data can't be read in transit, and verify that the server you're talking to is actually who it claims to be.

SSL (Secure Sockets Layer) is technically obsolete — TLS (Transport Layer Security) replaced it, with TLS 1.3 being the current standard. The term "SSL certificate" persists out of habit, and you'll see both used interchangeably in documentation and tooling. When people say SSL, they mean TLS.

## The TLS Handshake (Simplified)

When a browser connects to an HTTPS site, a brief negotiation happens before any content is exchanged:

1. The browser says hello and lists the cipher suites it supports
2. The server responds with its certificate and selects a cipher suite
3. The browser verifies the certificate against trusted Certificate Authorities (CAs)
4. Both sides derive a shared session key without transmitting it directly (using asymmetric cryptography)
5. Everything from that point forward is encrypted with symmetric encryption using that session key

The certificate itself contains the server's public key, the domain name it's valid for, an expiry date, and a digital signature from a CA. The CA's signature is what allows browsers to trust the certificate — they come pre-loaded with a list of trusted CAs.

## Certificate Types

Certificates are issued at three validation levels:

**Domain Validation (DV):** The CA verifies you control the domain, nothing more. No identity verification, no organizational checks. This is what Let's Encrypt issues. For the vast majority of sites, DV is entirely appropriate — it provides the same cryptographic protection as more expensive options.

**Organization Validation (OV):** The CA verifies the organization behind the domain actually exists. Takes more time and costs money. The extra validation is visible to technically sophisticated users who check the certificate details, but not to typical visitors.

**Extended Validation (EV):** The most rigorous verification. EV certificates previously triggered a green address bar with the organization name in browsers. That visual indicator was quietly removed by major browsers in 2019 because research showed users didn't notice or rely on it. The cryptographic protection is identical to DV. EV's extra cost and complexity is hard to justify for most sites.

The short version: use DV unless you have a compliance or regulatory reason not to.

## Let's Encrypt and Certbot

Let's Encrypt is a free, automated, open Certificate Authority run by the Internet Security Research Group. It changed the economics of TLS by making certificate issuance free and automatable. Before Let's Encrypt, a certificate cost $50–$300/year and required manual renewal. Now they're free and can renew automatically.

Certbot is the official Let's Encrypt client. On a LEMP stack running Debian, the workflow is straightforward:

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d example.com -d www.example.com
```

Certbot handles domain validation (via an ACME HTTP challenge), downloads the certificate, and configures Nginx to use it. Let's Encrypt certificates expire after 90 days — short by design, to encourage automation. Certbot installs a systemd timer that attempts renewal twice daily, renewing automatically when certificates are within 30 days of expiry.

## Cloudflare SSL Modes

If you're running traffic through Cloudflare (which I do for all production sites), the certificate situation is more complex because there are now two TLS connections: browser to Cloudflare, and Cloudflare to your origin server. Cloudflare's SSL mode controls the second leg.

**Flexible:** Cloudflare connects to your origin over plain HTTP. Never use this. Data between Cloudflare and your server is unencrypted, and it creates the conditions for a well-known redirect loop: your origin redirects HTTP to HTTPS, Cloudflare sends HTTP, redirect triggers, infinite loop.

**Full:** Cloudflare connects to your origin over HTTPS but doesn't validate the certificate. Self-signed certificates work. Better than Flexible, but you're not protected against a man-in-the-middle between Cloudflare and your server.

**Full (Strict):** Cloudflare connects to your origin over HTTPS and validates the certificate. This is the only correct choice. It requires a valid certificate on your origin — which means either a Let's Encrypt certificate or Cloudflare's own Origin Certificate.

Set your SSL mode to Full (Strict) before anything else. The performance and security difference between Flexible and Full Strict is the difference between security theater and actual security.

## The Cloudflare + Let's Encrypt Workflow

When issuing a Let's Encrypt certificate with your domain proxied through Cloudflare, there's a sequencing issue. Certbot's HTTP challenge requires your domain to resolve directly to your origin server. If Cloudflare is proxying the request (orange cloud), the challenge traffic hits Cloudflare, not your server, and verification fails.

The solution: temporarily switch the DNS record from proxied (orange cloud) to DNS-only (grey cloud) during certificate issuance. Once Certbot has the certificate, switch back to orange cloud. This is a one-time setup step, not an ongoing concern — Certbot renews via the same mechanism, so you'll need to grey-cloud during renewal too, or use Certbot's Cloudflare DNS plugin which handles this automatically via API.

## Common Pitfalls

**Redirect loops with Flexible mode:** Symptoms are an infinite redirect or an ERR_TOO_MANY_REDIRECTS error. Fix: set SSL mode to Full Strict, ensure your origin has a valid certificate.

**CNAME vs A record for www:** Pointing `www` at your origin IP with an A record works, but a CNAME pointing `www` to your apex domain is cleaner — one place to update when IP addresses change. Both work; CNAME is easier to maintain.

**Certificate for wrong domain:** Certbot issues certificates tied to specific domain names. If you're adding `www` after the fact, you need to reissue — `certbot --expand` handles this.

**Expired certificates:** With Certbot's auto-renewal, expiry shouldn't happen. If it does, check the systemd timer status (`systemctl status certbot.timer`) and review `/var/log/letsencrypt/letsencrypt.log` for renewal errors.

The certificate setup for production WordPress is covered in the [deployment walkthrough](/blog/wp-infra-03-deploying-wordpress).
