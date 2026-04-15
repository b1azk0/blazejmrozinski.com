# Cloudflare Pages Migration — Design

**Date:** 2026-04-15
**Status:** Approved
**Author:** Blazej Mrozinski (with Claude)

## Why

Netlify's edge has been failing to serve TLS for `blazejmrozinski.com` and `www.blazejmrozinski.com` repeatedly — most recently on 2026-04-15, when both apex and www started returning `Connection reset by peer` during the TLS Client Hello despite:

- Netlify API reporting the site state as `current` and `ssl: true`
- The TLS certificate record showing as `issued`, covering both domains, expiring 2026-07-05
- The site building cleanly and serving correctly on the default `blazejmrozinski.netlify.app` URL
- DNS records pointing correctly at Netlify's load balancer (`75.2.60.5`, `99.83.231.61`)
- Forcing a fresh deploy (which completed `ready`) failing to restore TLS at the edge

Self-serve recovery options were exhausted: `provisionSiteTLSCertificate` rejected the request because a cert already existed in Netlify's records, and a redeploy did not refresh the edge cert mapping. The remaining options were a Netlify support ticket or migrating off the platform.

This pattern of edge instability has now occurred multiple times. The decision is to migrate off Netlify entirely rather than paper over a flaky vendor.

## What

Migrate hosting for `blazejmrozinski.com` from Netlify to Cloudflare Pages, using the existing Cloudflare DNS authority. Replace Netlify Forms with Web3Forms.

## Constraints and inputs

- DNS is already authoritative on Cloudflare (`lovisa.ns.cloudflare.com`, `garret.ns.cloudflare.com`) — no nameserver migration needed
- Build is `npm run build` → `dist/`, Node 22 — drops directly into Cloudflare Pages
- The only Netlify environment variable in use is `PUBLIC_GA4_ID = G-FLKVTLL23M` (verified via Netlify API)
- ContentForge's `scripts/publish.sh` does not touch Netlify, build hooks, or webhooks — it pushes to `main` via plain `git`. Cloudflare Pages will pick up commits identically. **No ContentForge changes required.**
- Two forms in this repo use Netlify Forms (`data-netlify="true"`):
  - `src/pages/contact.astro` — form `name="contact-full"`
  - `src/components/ContactForm.astro` — form `name="contact"`
- Site uses no other Netlify-specific features: no Functions, no Edge Functions, no Identity, no Image CDN, no Analytics, no add-ons (verified by inspection of `netlify.toml` and a grep of `src/`)

## Architecture

```
GitHub repo (main branch)
        │
        ▼  (push triggers build)
Cloudflare Pages
   project: blazejmrozinski-com
   build: npm run build → dist/
   env:   PUBLIC_GA4_ID = G-FLKVTLL23M
   node:  22
        │
        ▼  (serves)
Cloudflare Edge + Universal SSL
        │
        ▼
Cloudflare DNS (already authoritative)
   blazejmrozinski.com  → CNAME flatten → Pages project
   www.blazejmrozinski.com → CNAME → Pages project
```

ContentForge stays a black box that `git push`es content. Manual edits also work — anything that lands in `main` builds and ships.

## Repo changes

### Files added

| Path | Purpose |
|---|---|
| `public/_headers` | Ports the 3 security headers from `netlify.toml` to Cloudflare Pages syntax |
| `public/_redirects` | Ports the single sitemap redirect from `netlify.toml` |
| `src/pages/thanks.astro` | Thank-you page that Web3Forms redirects to after a successful submission |

**`public/_headers` content:**

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

**`public/_redirects` content:**

```
/sitemap.xml  /sitemap-index.xml  301
```

### Files modified

| Path | Change |
|---|---|
| `src/pages/contact.astro` | Replace Netlify form with Web3Forms POST. Add hidden fields for access key (placeholder), subject, from_name, redirect, honeypot. Remove `data-netlify="true"` and `<input type="hidden" name="form-name">`. Existing visible fields (name, email, message) and styling unchanged. |
| `src/components/ContactForm.astro` | Same Web3Forms migration with the same access key placeholder. |
| `CLAUDE.md` | Update "Astro static site deployed on Netlify" → "Astro static site deployed on Cloudflare Pages". Add a "Setup TODOs" section noting `WEB3FORMS_ACCESS_KEY_PLACEHOLDER` needs to be replaced after Web3Forms signup. |
| `README.md` | If it mentions Netlify, update to Cloudflare Pages. |
| `CHANGELOG.md` | Entry for the migration. |

### Files deleted

| Path | Reason |
|---|---|
| `netlify.toml` | No longer the source of truth. Cloudflare Pages reads `public/_headers` and `public/_redirects` instead. |

### Form migration shape (both forms)

```html
<form action="https://api.web3forms.com/submit" method="POST" class="...">
  <!-- TODO: replace placeholder with key from web3forms.com signup -->
  <input type="hidden" name="access_key" value="WEB3FORMS_ACCESS_KEY_PLACEHOLDER" />
  <input type="hidden" name="subject" value="New contact form submission — blazejmrozinski.com" />
  <input type="hidden" name="from_name" value="blazejmrozinski.com contact form" />
  <input type="hidden" name="redirect" value="https://blazejmrozinski.com/thanks" />
  <!-- honeypot: bots fill this, real users don't see it -->
  <input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off" />

  <!-- existing visible fields: name, email, message — unchanged -->
</form>
```

**Form decisions:**

- **No JavaScript.** Plain HTML form POST. Survives JS-disabled clients. JS-enhanced UX can come later as a separate task.
- **Custom thank-you page** at `/thanks` instead of Web3Forms' branded default. The page is short — confirms receipt, links back home.
- **Honeypot, not CAPTCHA.** `botcheck` hidden field per Web3Forms docs. No third-party CAPTCHA dependency.
- **Access key hardcoded in HTML, not env var.** Web3Forms keys are public-by-design (visible in HTML on every page either way). Hardcoding is the correct pattern. Putting it behind `import.meta.env` would be ceremony.
- **Placeholder, not real key.** Per user choice: `WEB3FORMS_ACCESS_KEY_PLACEHOLDER` appears in both forms verbatim; user signs up at web3forms.com afterward and replaces both occurrences. A note in `CLAUDE.md` flags the TODO so it isn't forgotten.

## Cloudflare Pages project setup (manual, dashboard)

| Setting | Value |
|---|---|
| Project name | `blazejmrozinski-com` |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | (empty) |
| Environment variable | `PUBLIC_GA4_ID = G-FLKVTLL23M` |
| Environment variable | `NODE_VERSION = 22` |

## Cutover plan

**Pre-flight (no user impact):**

1. All repo changes merged to `main`. Cloudflare Pages project created and connected to the GitHub repo.
2. Build #1 completes successfully. Smoke test `blazejmrozinski-com.pages.dev`:
   - Home page, blog index, two or three blog posts
   - Contact page (form will be visibly broken — placeholder access key, that is expected)
   - `/thanks` page
   - `sitemap-index.xml`, `robots.txt`
   - Inline blog images load (Astro image pipeline output)
   - GA4 fires in browser
3. Proceed only if smoke test is clean.

**Cutover:**

4. In Cloudflare Pages → project → Custom Domains → "Set up a custom domain" → enter `blazejmrozinski.com`. Cloudflare replaces the existing Netlify CNAME with a Pages-aware record automatically and provisions Universal SSL (typically <60 seconds).
5. Repeat for `www.blazejmrozinski.com`.
6. Within ~1 minute, `curl -I https://blazejmrozinski.com/` and `curl -I https://www.blazejmrozinski.com/` return 200 with `server: cloudflare` and `cf-ray:` headers (Netlify responses say `server: Netlify`).
7. In Netlify dashboard → Site → Domain management → remove both custom domains. This stops Netlify from holding/renewing a cert it no longer needs.

**Verification:**

8. `curl -I` on apex + www — confirm `server: cloudflare`.
9. Hit a few content URLs — confirm 200 + correct content.
10. Check GA4 realtime — confirm pageviews still arriving.
11. After replacing `WEB3FORMS_ACCESS_KEY_PLACEHOLDER` with the real key, submit a test message and confirm it lands in the user's email.

**Estimated downtime:** zero. Cloudflare Pages serves the site as soon as the custom domain is added, and the previous Netlify routing is replaced atomically at the DNS layer because the records are inside the same Cloudflare account. There is no DNS propagation lag.

## Rollback plan

**Week 1 (parallel run):** Netlify project stays built and deployable, just disconnected from the custom domain. If Cloudflare Pages fails for any reason in week 1, recovery is:

1. In Netlify → re-add `blazejmrozinski.com` and `www.blazejmrozinski.com` as custom domains. Netlify still has its issued cert in records.
2. In Cloudflare Pages → remove the same two custom domains.
3. ~2 minute total. No DNS propagation lag.

**After 1 week of clean operation on Cloudflare Pages:** delete the Netlify project as a separate cleanup task.

## Out of scope

Each of these is its own future task, not part of this migration:

- Adding CSP, HSTS, or Permissions-Policy headers
- JS-enhanced form UX (inline success state instead of full-page redirect)
- Cloudflare Web Analytics replacing or augmenting GA4
- Cloudflare cache rules tuning, page rules, image resizing
- The paused `feat/polish-i18n` branch (PR #1)
- Migrating any other repository

## Risks

| Risk | Mitigation |
|---|---|
| `_headers` syntax differs subtly between Netlify and CF Pages | Diff live response headers post-cutover with `curl -I` against both Netlify (default URL) and Cloudflare Pages. Confirm parity on the 3 ported headers. |
| Cloudflare Pages free tier limit: 500 builds/month | ContentForge + manual writes don't get close; flag if usage grows. |
| Web3Forms free tier limit: 250 submissions/month | Personal site contact form — well under the limit. Flag if it changes. |
| `redirect` field in Web3Forms requires destination on the same domain as the form | `/thanks` page is created in this same change; covered. |
| User forgets to replace `WEB3FORMS_ACCESS_KEY_PLACEHOLDER` | TODO note in `CLAUDE.md` under a "Setup TODOs" heading; form is visibly broken until replaced (forcing the issue). |
| GA4 pageviews appear from new IP ranges (Cloudflare edge instead of Netlify edge) | Expected and harmless — GA4 keys on `client_id`, not server IP. |

## Success criteria

- `https://blazejmrozinski.com/` and `https://www.blazejmrozinski.com/` both return 200 with `server: cloudflare`
- `curl -I https://blazejmrozinski.com/sitemap.xml` returns 301 → `/sitemap-index.xml` (port of the Netlify redirect)
- The 3 security headers are present in `curl -I` output for any page
- A manual contact form submission (after the access key is replaced) lands in the user's inbox via Web3Forms
- ContentForge's next `git push` triggers a Cloudflare Pages build with no changes to ContentForge
- Netlify project is still built and deployable for at least 7 days post-cutover
