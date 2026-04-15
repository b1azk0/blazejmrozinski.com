# Cloudflare Pages Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate hosting from Netlify to Cloudflare Pages, replace Netlify Forms with Web3Forms, with zero downtime and a one-week parallel-run safety net.

**Architecture:** Static Astro site (`npm run build` → `dist/`) deployed to Cloudflare Pages. DNS already on Cloudflare. Two contact forms move from Netlify Forms to Web3Forms with a placeholder access key the user replaces post-cutover. Netlify project stays alive (disconnected from custom domain) for one week as rollback.

**Tech Stack:** Astro 5, Cloudflare Pages, Cloudflare DNS, Web3Forms, GitHub.

**Note on TDD:** This plan is config and HTML changes for a static site with no test suite. There is nothing to unit-test here. "Verification" steps are: `npm run build` succeeds locally, `npm run preview` smoke test in the browser, and `curl -I` checks against the live URL post-cutover. The plan is structured around small, atomic edits + a single local verification before pushing.

---

## File map

**Created:**
- `public/_headers` — security headers, replaces `[[headers]]` in `netlify.toml`
- `public/_redirects` — sitemap redirect, replaces `[[redirects]]` in `netlify.toml`
- `src/pages/thanks.astro` — destination after Web3Forms submission

**Modified:**
- `src/pages/contact.astro` — large contact form → Web3Forms
- `src/components/ContactForm.astro` — inline homepage contact form → Web3Forms
- `CLAUDE.md` — Netlify → Cloudflare Pages, add Setup TODOs section
- `README.md` — remove Netlify badge, replace Netlify references
- `CHANGELOG.md` — migration entry

**Deleted:**
- `netlify.toml`

---

## Task 1: Add Cloudflare Pages headers and redirects

**Files:**
- Create: `public/_headers`
- Create: `public/_redirects`

- [ ] **Step 1: Create `public/_headers`**

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

- [ ] **Step 2: Create `public/_redirects`**

```
/sitemap.xml  /sitemap-index.xml  301
```

- [ ] **Step 3: Verify both files exist**

Run: `ls -la public/_headers public/_redirects`
Expected: both files listed, non-empty.

---

## Task 2: Add the thank-you page

**Files:**
- Create: `src/pages/thanks.astro`

- [ ] **Step 1: Create `src/pages/thanks.astro`**

```astro
---
import Base from '@/layouts/Base.astro';
---

<Base
  title="Thanks — message received"
  description="Your message has been received. Blazej will get back to you soon."
>
  <div class="container max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
    <h1 class="text-4xl font-bold tracking-tight mb-4">Thanks — got it.</h1>
    <p class="text-muted-foreground mb-8 leading-relaxed">
      Your message landed in my inbox. I'll get back to you within a few days.
    </p>
    <a
      href="/"
      class="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      Back to homepage
    </a>
  </div>
</Base>
```

- [ ] **Step 2: Verify the file follows existing layout convention**

Run: `head -5 src/pages/contact.astro`
Expected: shows the same `import Base from '@/layouts/Base.astro';` pattern. The thanks page uses the same import.

---

## Task 3: Migrate the large contact form to Web3Forms

**Files:**
- Modify: `src/pages/contact.astro:30-72`

- [ ] **Step 1: Replace the form element**

In `src/pages/contact.astro`, replace the entire `<form name="contact-full" ...>` block (currently lines 30-72) with:

```astro
        <form action="https://api.web3forms.com/submit" method="POST" class="space-y-4">
          <!-- TODO: replace placeholder with key from web3forms.com signup -->
          <input type="hidden" name="access_key" value="WEB3FORMS_ACCESS_KEY_PLACEHOLDER" />
          <input type="hidden" name="subject" value="New contact form submission — blazejmrozinski.com" />
          <input type="hidden" name="from_name" value="blazejmrozinski.com contact form" />
          <input type="hidden" name="redirect" value="https://blazejmrozinski.com/thanks" />
          <!-- honeypot: bots fill this, real users don't see it -->
          <input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off" />

          <div>
            <label for="name" class="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              class="w-full h-10 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              class="w-full h-10 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            />
          </div>

          <div>
            <label for="message" class="block text-sm font-medium mb-2">Message</label>
            <textarea
              id="message"
              name="message"
              rows="5"
              required
              class="w-full px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Send Message
          </button>
        </form>
```

Key differences from the original:
- `action="https://api.web3forms.com/submit"` (was implicit same-page)
- `data-netlify="true"` removed
- `<input type="hidden" name="form-name" value="contact-full" />` removed
- 5 new hidden fields (access_key, subject, from_name, redirect, botcheck)
- All visible fields and styling are identical

- [ ] **Step 2: Verify no `data-netlify` remains in the file**

Run: `grep -n "data-netlify\|form-name" src/pages/contact.astro`
Expected: no output.

---

## Task 4: Migrate the inline homepage contact form to Web3Forms

**Files:**
- Modify: `src/components/ContactForm.astro:3-21`

- [ ] **Step 1: Replace the form element**

Replace the entire content of `src/components/ContactForm.astro` with:

```astro
---
---
<form action="https://api.web3forms.com/submit" method="POST" class="flex gap-2 items-center max-w-lg">
  <!-- TODO: replace placeholder with key from web3forms.com signup -->
  <input type="hidden" name="access_key" value="WEB3FORMS_ACCESS_KEY_PLACEHOLDER" />
  <input type="hidden" name="subject" value="Newsletter signup — blazejmrozinski.com homepage" />
  <input type="hidden" name="from_name" value="blazejmrozinski.com homepage form" />
  <input type="hidden" name="redirect" value="https://blazejmrozinski.com/thanks" />
  <input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off" />
  <label for="contact-email" class="sr-only">Email address</label>
  <input
    type="email"
    id="contact-email"
    name="email"
    required
    placeholder="your@email.com"
    aria-label="Email address"
    class="flex-1 h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
  />
  <button
    type="submit"
    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
  >
    Send
  </button>
</form>
```

Key differences from the original:
- `action="https://api.web3forms.com/submit"` added
- `data-netlify="true"` removed
- `<input type="hidden" name="form-name" value="contact" />` removed
- 5 new hidden fields
- Visible fields, label, button, and styling are identical

- [ ] **Step 2: Verify no `data-netlify` remains anywhere in the repo**

Run: `grep -rn "data-netlify\|form-name" src/`
Expected: no output.

---

## Task 5: Delete `netlify.toml`

**Files:**
- Delete: `netlify.toml`

- [ ] **Step 1: Delete the file**

Run: `rm netlify.toml`

- [ ] **Step 2: Verify it's gone**

Run: `ls netlify.toml 2>&1`
Expected: `ls: netlify.toml: No such file or directory`

---

## Task 6: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the deployment description**

Find the line:
```
Personal brand site for Blazej Mrozinski. Astro static site deployed on Netlify.
```

Replace with:
```
Personal brand site for Blazej Mrozinski. Astro static site deployed on Cloudflare Pages.
```

- [ ] **Step 2: Add a Setup TODOs section**

Add a new section near the top of `CLAUDE.md`, right after the "Key Context" section:

```markdown
## Setup TODOs

- **Web3Forms access key:** Both contact forms (`src/pages/contact.astro`, `src/components/ContactForm.astro`) use the placeholder `WEB3FORMS_ACCESS_KEY_PLACEHOLDER`. After signing up at https://web3forms.com, replace both occurrences with the real key. Run: `grep -rn WEB3FORMS_ACCESS_KEY_PLACEHOLDER src/` to find them. Until replaced, form submissions will fail.
```

- [ ] **Step 3: Verify the changes**

Run: `grep -n "Cloudflare Pages\|Setup TODOs\|WEB3FORMS_ACCESS_KEY_PLACEHOLDER" CLAUDE.md`
Expected: at least 3 lines matching.

---

## Task 7: Update README.md

**Files:**
- Modify: `README.md` (lines 3, 11, 56, 65, 139, 179, 183 — Netlify references)

- [ ] **Step 1: Remove the Netlify status badge (line 3)**

Delete this line entirely:
```
[![Netlify Status](https://api.netlify.com/api/v1/badges/8c12de62-7e86-47a7-b671-71f5639d7acf/deploy-status)](https://app.netlify.com/projects/blazejmrozinski/deploys)
```

- [ ] **Step 2: Update the tech stack list (line 11)**

Find: `- Netlify (deployment)`
Replace with: `- Cloudflare Pages (deployment)`

- [ ] **Step 3: Update the contact form description (line 56)**

Find: `| `/contact` | `src/pages/contact.astro` | Full contact form (Netlify Forms) with social links |`
Replace with: `| `/contact` | `src/pages/contact.astro` | Full contact form (Web3Forms) with social links |`

- [ ] **Step 4: Update the ContactForm component description (line 65)**

Find: `| `ContactForm` | Inline Netlify Forms contact form |`
Replace with: `| `ContactForm` | Inline Web3Forms contact form |`

- [ ] **Step 5: Update the photography note (line 139)**

Find: `Netlify builds automatically.`
Replace with: `Cloudflare Pages builds automatically.`

- [ ] **Step 6: Update the GA4 environment variable note (line 179)**

Find: `Set it via Netlify environment variables to enable GA4 tracking with user consent.`
Replace with: `Set it via Cloudflare Pages environment variables to enable GA4 tracking with user consent.`

- [ ] **Step 7: Update the deploy instructions (line 183)**

Find: `Push to main → Netlify auto-deploys.`
Replace with: `Push to main → Cloudflare Pages auto-deploys.`

- [ ] **Step 8: Verify no Netlify references remain**

Run: `grep -n -i "netlify" README.md`
Expected: no output.

---

## Task 8: Add CHANGELOG entry

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Read the existing CHANGELOG to understand format**

Run: `head -30 CHANGELOG.md`

- [ ] **Step 2: Add a new entry at the top (under any title/lead, above the most recent existing entry)**

Use the existing CHANGELOG format. Entry text:

```markdown
## 2026-04-15 — Migrated hosting from Netlify to Cloudflare Pages

Netlify's edge has been failing TLS for the custom domain repeatedly despite a valid certificate in their records. Migrated to Cloudflare Pages, which terminates TLS at Cloudflare's edge using their Universal SSL. DNS was already on Cloudflare, so the cutover was a same-account record swap with zero downtime.

Replaced Netlify Forms (used by `/contact` and the homepage `ContactForm`) with [Web3Forms](https://web3forms.com), a hosted form-handling service. Submissions now redirect to a new `/thanks` page on the same domain. The `WEB3FORMS_ACCESS_KEY_PLACEHOLDER` token in both forms must be replaced with a real key from Web3Forms before submissions work.

Configuration ported from `netlify.toml` (now deleted) to Cloudflare Pages equivalents:
- 3 security headers → `public/_headers`
- 1 sitemap redirect → `public/_redirects`
- `PUBLIC_GA4_ID` env var → set in Cloudflare Pages dashboard
- Node 22 → set via `NODE_VERSION` env var in Cloudflare Pages dashboard

Netlify project remains built and deployable for a 1-week parallel-run window as rollback before being deleted.
```

- [ ] **Step 3: Verify the entry was added**

Run: `head -25 CHANGELOG.md`
Expected: shows the new 2026-04-15 entry near the top.

---

## Task 9: Local verification build + smoke test

**Files:** none

- [ ] **Step 1: Clean build**

Run: `rm -rf dist && npm run build`
Expected: build completes without errors. Look for `Server built in <X>ms` or equivalent Astro success message.

- [ ] **Step 2: Confirm built files are present**

Run: `ls dist/_headers dist/_redirects dist/thanks/index.html dist/contact/index.html dist/index.html`
Expected: all 5 paths exist.

- [ ] **Step 3: Confirm `_headers` and `_redirects` content was copied through**

Run: `cat dist/_headers && echo "---" && cat dist/_redirects`
Expected: matches the content from Task 1.

- [ ] **Step 4: Confirm forms reference Web3Forms in built HTML**

Run: `grep -c "api.web3forms.com" dist/contact/index.html dist/index.html`
Expected: `dist/contact/index.html:1` and `dist/index.html:1` (one form per page).

- [ ] **Step 5: Confirm no `data-netlify` survived in built HTML**

Run: `grep -rn "data-netlify\|form-name" dist/`
Expected: no output.

- [ ] **Step 6: Start preview server**

Run: `npm run preview &`
Wait ~3 seconds, then in a browser, manually verify:
- http://localhost:4321/ — homepage loads, inline contact form renders
- http://localhost:4321/contact — full form renders, has 3 visible fields
- http://localhost:4321/thanks — thanks page renders with "Back to homepage" button
- View source on /contact, confirm `action="https://api.web3forms.com/submit"` and `WEB3FORMS_ACCESS_KEY_PLACEHOLDER`

- [ ] **Step 7: Stop preview server**

Run: `kill %1` (or Ctrl+C the foregrounded process).

---

## Task 10: Commit and push

**Files:** all of the above

- [ ] **Step 1: Stage all changes**

Run: `git add public/_headers public/_redirects src/pages/thanks.astro src/pages/contact.astro src/components/ContactForm.astro CLAUDE.md README.md CHANGELOG.md && git rm netlify.toml`

- [ ] **Step 2: Verify the staged set**

Run: `git status`
Expected: 8 files modified/added/deleted, nothing else.

- [ ] **Step 3: Commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
feat: migrate hosting from Netlify to Cloudflare Pages

Netlify's edge has been failing TLS for the custom domain
repeatedly despite valid cert records. Moves the site to
Cloudflare Pages with same-account DNS cutover, replaces
Netlify Forms with Web3Forms, and ports headers/redirects
to public/_headers and public/_redirects.

Both contact forms ship with a WEB3FORMS_ACCESS_KEY_PLACEHOLDER
that must be replaced after Web3Forms signup before
submissions will work. Tracked in CLAUDE.md Setup TODOs.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Push to origin**

Run: `git push origin main`
Expected: clean push, no errors.

---

## Task 11 (manual, user): Create Cloudflare Pages project

This is **manual dashboard work in Cloudflare**. The agent cannot do this — only the user can.

- [ ] **Step 1: Open the Cloudflare dashboard**

Go to https://dash.cloudflare.com/ → select the account that owns `blazejmrozinski.com` → Workers & Pages → Create → Pages → Connect to Git.

- [ ] **Step 2: Connect the GitHub repo**

Authorize Cloudflare to access `b1azk0/blazejmrozinski.com` (or whatever the user's GitHub org is). Select the repository.

- [ ] **Step 3: Configure the build**

| Setting | Value |
|---|---|
| Project name | `blazejmrozinski-com` |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | (leave empty) |

Add environment variables (under "Environment variables (advanced)"):

| Variable | Value |
|---|---|
| `PUBLIC_GA4_ID` | `G-FLKVTLL23M` |
| `NODE_VERSION` | `22` |

- [ ] **Step 4: Save and Deploy**

Click "Save and Deploy". Wait for the first build to complete (typically 1-3 minutes for this size of site).

- [ ] **Step 5: Note the *.pages.dev URL**

Cloudflare assigns a URL like `blazejmrozinski-com.pages.dev`. Note it down — needed for the smoke test.

---

## Task 12 (manual, user): Smoke test on `*.pages.dev`

- [ ] **Step 1: Open the Pages URL in a browser**

Navigate to `https://blazejmrozinski-com.pages.dev/`.

- [ ] **Step 2: Manually verify each surface**

Click through:
- Homepage — full layout, header, fonts, GA4 cookie banner if applicable
- Blog index — list of posts loads
- Two or three blog posts — content + inline images + breadcrumbs render
- `/contact` — full form renders (form will not submit cleanly — placeholder access key — that is expected at this stage)
- `/thanks` — thanks page renders
- `/sitemap-index.xml` — XML loads
- `/sitemap.xml` — should redirect (301) to `/sitemap-index.xml` (Cloudflare may follow the redirect transparently in the browser; check in DevTools Network tab)
- `/robots.txt` — loads

- [ ] **Step 3: Verify security headers via curl**

Run:
```bash
curl -sI https://blazejmrozinski-com.pages.dev/ | grep -i "x-frame\|x-content\|referrer-policy"
```
Expected: 3 lines, matching the values in `public/_headers`.

- [ ] **Step 4: Verify GA4 fires**

Open browser DevTools → Network tab → reload homepage → filter for `google-analytics` or `gtag`. Confirm at least one request fires (after accepting the cookie banner if shown).

- [ ] **STOP. Do not proceed to Task 13 until smoke test is fully clean.** If anything fails, fix in code, push, wait for the next build, re-test.

---

## Task 13 (manual, user): Add custom domains in Cloudflare Pages

- [ ] **Step 1: Add the apex domain**

In Cloudflare Pages → `blazejmrozinski-com` project → Custom domains → "Set up a custom domain" → enter `blazejmrozinski.com` → Continue.

Cloudflare detects the domain is already in your CF account. It offers to update the existing DNS record automatically. Accept.

Wait ~30-60 seconds for the Universal SSL certificate to provision (status changes from "Verifying" to "Active").

- [ ] **Step 2: Add the www subdomain**

Repeat with `www.blazejmrozinski.com`.

- [ ] **Step 3: Confirm both show as Active**

Both custom domains should display "Active" status with a valid SSL certificate.

---

## Task 14 (manual, user): Verify the live cutover with curl

- [ ] **Step 1: Verify apex returns 200 from Cloudflare**

Run:
```bash
curl -sI https://blazejmrozinski.com/ | head -20
```
Expected: `HTTP/2 200`, headers include `server: cloudflare` and `cf-ray: ...`. **Critical check:** if it still says `server: Netlify`, DNS hasn't propagated — wait 30 seconds and retry.

- [ ] **Step 2: Verify www returns 200 from Cloudflare**

Run:
```bash
curl -sI https://www.blazejmrozinski.com/ | head -20
```
Expected: same as above.

- [ ] **Step 3: Verify the sitemap redirect**

Run:
```bash
curl -sI https://blazejmrozinski.com/sitemap.xml
```
Expected: `HTTP/2 301` with `location: /sitemap-index.xml`.

- [ ] **Step 4: Verify security headers are live**

Run:
```bash
curl -sI https://blazejmrozinski.com/ | grep -i "x-frame\|x-content\|referrer-policy"
```
Expected: 3 lines matching `public/_headers` values.

- [ ] **Step 5: Hit a few content URLs**

Run:
```bash
for url in / /contact /thanks /blog /sitemap-index.xml /robots.txt; do
  printf "%-25s " "$url"
  curl -s -o /dev/null -w "%{http_code}\n" "https://blazejmrozinski.com$url"
done
```
Expected: all 200 (or 301 for `/sitemap.xml` which we already tested).

- [ ] **Step 6: Confirm GA4 still firing in browser**

Open `https://blazejmrozinski.com/` in a fresh browser tab → DevTools → Network → look for the gtag request → confirm 200.

---

## Task 15 (manual, user): Remove custom domains from Netlify

- [ ] **Step 1: Open the Netlify dashboard**

Go to https://app.netlify.com/projects/blazejmrozinski → Domain management.

- [ ] **Step 2: Remove `blazejmrozinski.com` and `www.blazejmrozinski.com`**

Under "Custom domains", remove both entries. Netlify keeps the project + its `*.netlify.app` URL alive. Do NOT delete the project itself.

- [ ] **Step 3: Confirm the domains are gone**

The site should now only be reachable on `blazejmrozinski.netlify.app` from Netlify's side. The custom domain is fully owned by Cloudflare Pages.

- [ ] **Step 4: Re-test live URLs to confirm nothing changed**

Run again:
```bash
curl -sI https://blazejmrozinski.com/ | grep -i "server\|cf-ray"
```
Expected: still `server: cloudflare`. Removing the domain from Netlify should have zero effect on live traffic — that's the proof the cutover is complete.

---

## Task 16 (manual, user): Sign up for Web3Forms and replace the placeholder

This can happen any time after Task 14 is verified — the form is the only piece still broken on the live site.

- [ ] **Step 1: Sign up at Web3Forms**

Go to https://web3forms.com → enter the email address where form submissions should be delivered → confirm via the email Web3Forms sends → copy the generated access key (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

- [ ] **Step 2: Find both placeholder occurrences**

Run: `grep -rn WEB3FORMS_ACCESS_KEY_PLACEHOLDER src/`
Expected: 2 lines — one in `src/pages/contact.astro`, one in `src/components/ContactForm.astro`.

- [ ] **Step 3: Replace both occurrences with the real key**

Run (replace `<KEY>` with your actual access key):
```bash
sed -i '' 's/WEB3FORMS_ACCESS_KEY_PLACEHOLDER/<KEY>/g' src/pages/contact.astro src/components/ContactForm.astro
```

(On Linux, omit the empty `''` after `-i`.)

- [ ] **Step 4: Verify no placeholder remains**

Run: `grep -rn WEB3FORMS_ACCESS_KEY_PLACEHOLDER src/`
Expected: no output.

- [ ] **Step 5: Remove the Setup TODO from `CLAUDE.md`**

Delete the entire "Setup TODOs" section from `CLAUDE.md` (added in Task 6).

- [ ] **Step 6: Commit and push**

Run:
```bash
git add src/pages/contact.astro src/components/ContactForm.astro CLAUDE.md
git commit -m "$(cat <<'EOF'
feat: enable Web3Forms with real access key

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

- [ ] **Step 7: Wait for Cloudflare Pages build to complete**

Watch the Pages dashboard or check `https://blazejmrozinski.com/contact` after ~1 minute.

- [ ] **Step 8: End-to-end test the form**

Submit a real test message via `https://blazejmrozinski.com/contact`. Expected:
- Browser navigates to `https://blazejmrozinski.com/thanks`
- The thank-you page renders
- Within ~1 minute, the test message arrives in the email inbox configured at Web3Forms signup

- [ ] **Step 9: End-to-end test the homepage form**

Repeat with the inline form on `https://blazejmrozinski.com/`. Same expected outcome.

---

## Task 17 (manual, user, +7 days): Delete the Netlify project

Schedule this for ~2026-04-22 (7 days post-cutover). Only proceed if no rollback was needed in week 1.

- [ ] **Step 1: Confirm one full week of clean operation on Cloudflare Pages**

Run a final check:
```bash
curl -sI https://blazejmrozinski.com/ | grep -i "server"
```
Expected: `server: cloudflare`.

- [ ] **Step 2: Delete the Netlify project**

Netlify dashboard → `blazejmrozinski` project → Site configuration → General → Delete this site → confirm.

- [ ] **Step 3: (Optional) Revoke the local Netlify CLI token**

If no other Netlify projects need it, remove the token from `~/Library/Preferences/netlify/config.json` or run `netlify logout`.

---

## Rollback procedure (week 1 only)

If anything breaks on Cloudflare Pages within the first 7 days:

1. Netlify dashboard → `blazejmrozinski` project → Domain management → re-add `blazejmrozinski.com` and `www.blazejmrozinski.com` as custom domains.
2. Cloudflare Pages dashboard → `blazejmrozinski-com` project → Custom domains → remove both.
3. Within ~1 minute, traffic is back on Netlify (its issued cert is still in records).
4. Total recovery time: ~2 minutes. No DNS propagation lag (same Cloudflare account).
5. Triage what broke on Cloudflare Pages, fix, re-cut over.

---

## Success criteria (from spec)

- [ ] `https://blazejmrozinski.com/` and `https://www.blazejmrozinski.com/` both return 200 with `server: cloudflare`
- [ ] `curl -I https://blazejmrozinski.com/sitemap.xml` returns 301 → `/sitemap-index.xml`
- [ ] The 3 security headers are present in `curl -I` output
- [ ] A manual contact form submission lands in the user's inbox via Web3Forms
- [ ] ContentForge's next `git push` triggers a Cloudflare Pages build with no ContentForge changes
- [ ] Netlify project is still built and deployable for at least 7 days post-cutover
