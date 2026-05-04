# Pagefind Static Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working `/search` route powered by Pagefind plus a sitewide `SearchAction` JSON-LD entry, while keeping the Pagefind JS bundle off every page that isn't `/search`.

**Architecture:** Pagefind builds an index by walking `dist/` after `astro build`. The default Pagefind UI mounts on `/search` only. Content layouts opt into indexing via `data-pagefind-body`; chrome (header/footer) and listing pages are excluded by virtue of not opting in. `getWebSiteNode()` gains a `potentialAction: SearchAction` so Google can consider a sitelinks search box.

**Tech Stack:** Astro 6 (static output), Pagefind ^1.x (CLI + UI bundle), Node 22 test runner for verification, existing IndexNow postbuild script.

**Spec:** `docs/superpowers/specs/2026-05-04-pagefind-static-search-design.md`

**Branch:** `feat/seo-tier3-pagefind-search` (already cut off `main`)

---

### Task 1: Install Pagefind and chain it into postbuild

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (auto)

- [ ] **Step 1: Install pagefind as a dev dependency**

```bash
npm install --save-dev pagefind@^1.3.0
```

Expected: `pagefind` appears under `devDependencies` in `package.json`; `package-lock.json` updates.

- [ ] **Step 2: Edit the `postbuild` script in `package.json`**

Replace the current postbuild line:
```json
"postbuild": "node --import tsx scripts/indexnow.ts",
```
with:
```json
"postbuild": "pagefind --site dist && node --import tsx scripts/indexnow.ts",
```

Pagefind runs first because it walks `dist/` and writes `dist/pagefind/`. IndexNow runs second, unaffected by Pagefind output, so existing IndexNow ping behaviour stays intact.

- [ ] **Step 3: Run a full build to confirm Pagefind produces output**

```bash
npm run build
```

Expected output near the end:
```
Indexing files for pagefind
[Pagefind] ... pages indexed
```

- [ ] **Step 4: Verify the bundle landed in `dist/pagefind/`**

```bash
ls dist/pagefind/ | sort
```

Expected to contain at minimum:
- `pagefind.js`
- `pagefind-ui.js`
- `pagefind-ui.css`
- `pagefind-modular-ui.js` (default; harmless)
- `fragment/` directory
- `index/` directory

If Pagefind fails to find any pages to index, that's expected for this first run — we haven't added `data-pagefind-body` opt-in yet. The build should still succeed; the index will simply be empty until Task 3.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
build(pagefind): install pagefind ^1.x and chain into postbuild

Pagefind runs after astro build, before IndexNow. Output lands in
dist/pagefind/ for deploy by Cloudflare Pages.

Index is empty in this commit — content layouts opt in via
data-pagefind-body in a later task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add `SearchAction` to the sitewide WebSite JSON-LD (TDD)

**Files:**
- Create: `scripts/jsonld.test.mjs`
- Modify: `src/lib/jsonld.ts`

- [ ] **Step 1: Write the failing unit test**

Create `scripts/jsonld.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWebSiteNode, SITE_URL } from '../src/lib/jsonld.ts';

test('getWebSiteNode includes a SearchAction potentialAction', () => {
  const node = getWebSiteNode();

  assert.ok(node.potentialAction, 'WebSite node missing potentialAction');
  assert.equal(node.potentialAction['@type'], 'SearchAction');

  const target = node.potentialAction.target;
  assert.equal(target['@type'], 'EntryPoint');
  assert.equal(
    target.urlTemplate,
    `${SITE_URL}/search?q={search_term_string}`,
  );

  assert.equal(
    node.potentialAction['query-input'],
    'required name=search_term_string',
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --import tsx --test scripts/jsonld.test.mjs
```

Expected: test fails with `WebSite node missing potentialAction` (current `getWebSiteNode()` returns no `potentialAction`).

- [ ] **Step 3: Add `potentialAction` to `getWebSiteNode()`**

In `src/lib/jsonld.ts`, replace the existing `getWebSiteNode` body:

```ts
export function getWebSiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: 'Blazej Mrozinski',
    description:
      'Personal site of Blazej Mrozinski, PhD — psychologist, psychometrician, product leader.',
    inLanguage: 'en-US',
    publisher: { '@id': PERSON_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --import tsx --test scripts/jsonld.test.mjs
```

Expected: 1 test, 0 failed.

- [ ] **Step 5: Build and grep the rendered homepage to confirm sitewide emission**

```bash
npm run build
grep -o 'SearchAction' dist/index.html | head -3
grep -o 'search?q={search_term_string}' dist/index.html | head -3
```

Expected: both grep commands return at least one match.

- [ ] **Step 6: Commit**

```bash
git add scripts/jsonld.test.mjs src/lib/jsonld.ts
git commit -m "$(cat <<'EOF'
feat(seo): add SearchAction to sitewide WebSite JSON-LD

Emits potentialAction.target.urlTemplate pointing at /search?q={...} on
every page (via Base.astro's @graph). Required for Google to consider a
sitelinks search box on brand SERP. The /search route itself ships in a
later task — Google will validate the action against a real working URL.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Opt content layouts into Pagefind indexing via `data-pagefind-body`

**Files:**
- Modify: `src/layouts/BlogPost.astro`
- Modify: `src/pages/glossary/[term].astro`
- Modify: `src/pages/work/[slug].astro`
- Modify: `src/pages/projects/[slug].astro`
- Modify: `src/pages/publications.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/cv.astro`

For each file, find the outermost content wrapper (`<article>` for `BlogPost.astro`, `<main>` for the others) and add the attribute. Also add `data-pagefind-meta` so each result carries a `kind` (and `date` for blog posts).

- [ ] **Step 1: Edit `src/layouts/BlogPost.astro`**

Find the `<article>` element that wraps the post content. Add attributes:

```astro
<article
  data-pagefind-body
  data-pagefind-meta="kind:blog"
  data-pagefind-meta:date={post.data.date.toISOString()}
  ...existing attributes
>
```

Reuse the existing destructured `post` variable. If the file uses `frontmatter` or similar, map the date access accordingly. Keep all other attributes intact.

- [ ] **Step 2: Edit `src/pages/glossary/[term].astro`**

Find the `<main>` element. Add attributes:

```astro
<main data-pagefind-body data-pagefind-meta="kind:glossary" ...>
```

- [ ] **Step 3: Edit `src/pages/work/[slug].astro`**

Find the `<main>` element. Add:

```astro
<main data-pagefind-body data-pagefind-meta="kind:company" ...>
```

- [ ] **Step 4: Edit `src/pages/projects/[slug].astro`**

Find the `<main>` element. Add:

```astro
<main data-pagefind-body data-pagefind-meta="kind:project" ...>
```

- [ ] **Step 5: Edit `src/pages/publications.astro`**

Find the `<main>` element. Add:

```astro
<main data-pagefind-body data-pagefind-meta="kind:publication" ...>
```

- [ ] **Step 6: Edit `src/pages/about.astro`**

Find the `<main>` element. Add:

```astro
<main data-pagefind-body data-pagefind-meta="kind:page" ...>
```

- [ ] **Step 7: Edit `src/pages/cv.astro`**

Find the `<main>` element. Add:

```astro
<main data-pagefind-body data-pagefind-meta="kind:page" ...>
```

- [ ] **Step 8: Build and verify each layout's rendered HTML carries the attribute**

```bash
npm run build
echo "--- BlogPost (sample) ---"
grep -l 'data-pagefind-body' dist/blog/*/index.html | head -3
grep -o 'data-pagefind-meta="kind:blog"' dist/blog/wp-infra-04-four-layers-of-caching/index.html
grep -o 'data-pagefind-meta:date' dist/blog/wp-infra-04-four-layers-of-caching/index.html
echo "--- Glossary ---"
grep -l 'data-pagefind-body' dist/glossary/*/index.html | head -3
grep -o 'data-pagefind-meta="kind:glossary"' dist/glossary/*/index.html | head -1
echo "--- Work ---"
grep -l 'data-pagefind-body' dist/work/*/index.html | head -3
echo "--- Projects ---"
grep -l 'data-pagefind-body' dist/projects/*/index.html | head -3
echo "--- Publications ---"
grep -o 'data-pagefind-body' dist/publications/index.html
echo "--- About / CV ---"
grep -o 'data-pagefind-body' dist/about/index.html
grep -o 'data-pagefind-body' dist/cv/index.html
echo "--- Listings should NOT have the attribute ---"
grep -L 'data-pagefind-body' dist/blog/index.html
grep -L 'data-pagefind-body' dist/blog/topic/wordpress-infrastructure/index.html
grep -L 'data-pagefind-body' dist/blog/series/wp-infrastructure/index.html
```

Expected: every layout-listed file shows the attribute; the three listing files print their path back (meaning grep -L found no match).

- [ ] **Step 9: Verify Pagefind index reports a non-zero document count**

The end of `npm run build` output now reports something like:
```
[Pagefind] Indexed N pages
```

Expected: `N` is between roughly 60 and 80 (blog posts + glossary terms + companies + projects + publications + about + cv). If `N == 0` or wildly off, re-check the attribute placements.

- [ ] **Step 10: Commit**

```bash
git add src/layouts/BlogPost.astro src/pages/glossary/[term].astro src/pages/work/[slug].astro src/pages/projects/[slug].astro src/pages/publications.astro src/pages/about.astro src/pages/cv.astro
git commit -m "$(cat <<'EOF'
feat(pagefind): opt content layouts into Pagefind index

Adds data-pagefind-body to BlogPost, glossary terms, companies, projects,
publications, about, and cv. Each layout also emits data-pagefind-meta
"kind:<type>" so the search UI can label results. BlogPost additionally
emits data-pagefind-meta:date for relevance/sort use later.

Listing pages (/blog, /blog/topic/, /blog/series/, /work, /projects),
photography, changelog, and PL routes are deliberately excluded — they
don't opt in, so Pagefind ignores them.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Exclude chrome and per-element noise via `data-pagefind-ignore`

**Scope expanded after Task 3 code review:** Task 3 placed `data-pagefind-body` on the page-level `<div class="container ...">` of 5 of 7 layouts (because `Base.astro` already provides a shared `<main>`). That choice is functionally correct but means Breadcrumb, YearFilter, the CV "Download PDF" anchor, and the work-page `relatedProjects` ProjectCard grid currently sit inside indexed wrappers. Task 4 closes those leaks. (`HobbiesSection` on `/about` is bio content — left indexed deliberately.)

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`
- Modify: `src/components/Breadcrumb.astro` *(scope expansion — affects all callers in one shot)*
- Modify: `src/components/YearFilter.astro` *(scope expansion)*
- Modify: `src/layouts/BlogPost.astro` *(SeriesNav, RelatedPosts, "Filed under")*
- Modify: `src/pages/cv.astro` *(scope expansion — "Download PDF" anchor)*
- Modify: `src/pages/work/[...slug].astro` *(scope expansion — relatedProjects section)*

- [ ] **Step 1: Edit `src/components/Header.astro` line 20**

Change:
```astro
<header
```
to:
```astro
<header
  data-pagefind-ignore
```

Keep all existing attributes after the new one.

- [ ] **Step 2: Edit `src/components/Footer.astro` line 29**

Change:
```astro
<footer class="border-t bg-background">
```
to:
```astro
<footer class="border-t bg-background" data-pagefind-ignore>
```

- [ ] **Step 3: Edit `src/layouts/BlogPost.astro` — exclude SeriesNav, RelatedPosts, and "Filed under" line from indexed body**

Find each of:
- The `<SeriesNav ... />` component (top + bottom on series posts).
- The `<RelatedPosts ... />` component.
- The "Filed under" `<p>` or `<div>` near the byline that lists topic links.

Wrap each with `<div data-pagefind-ignore>` (or add the attribute to the existing element if it has its own wrapper). Example pattern:

```astro
<div data-pagefind-ignore>
  <SeriesNav ... />
</div>
```

Repeat for `RelatedPosts` and the "Filed under" element.

If `SeriesNav.astro` or `RelatedPosts.astro` already render a single root element, add the attribute directly on that element inside the component file. Pick the cleaner option for each — consistency within `BlogPost.astro` is fine but not required.

- [ ] **Step 4: Build and verify the attributes land in rendered HTML**

```bash
npm run build
echo "--- Header / Footer ---"
grep -c 'data-pagefind-ignore' dist/index.html
grep -c 'data-pagefind-ignore' dist/blog/index.html
echo "--- BlogPost SeriesNav / RelatedPosts ---"
grep -c 'data-pagefind-ignore' dist/blog/wp-infra-04-four-layers-of-caching/index.html
```

Expected: every page shows at least 2 ignore markers (header + footer), blog posts show 3+ (chrome + SeriesNav and/or RelatedPosts and/or "Filed under").

- [ ] **Step 5: Verify search results don't contain header/footer text**

Spot-check by running:
```bash
npm run preview
```
Then in the browser navigate to `http://localhost:4321/search` (route doesn't exist yet — comes in Task 5). Skip browser check at this stage; the dist HTML grep above is sufficient verification for this task.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.astro src/components/Footer.astro src/layouts/BlogPost.astro
git commit -m "$(cat <<'EOF'
feat(pagefind): exclude chrome and per-post nav from search index

Adds data-pagefind-ignore on the sticky header, the site footer, and on
SeriesNav / RelatedPosts / "Filed under" blocks inside BlogPost so search
result snippets aren't polluted with navigation text.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Build the `/search` route with default Pagefind UI

**Files:**
- Create: `src/pages/search.astro`

- [ ] **Step 1: Create `src/pages/search.astro`**

```astro
---
import Base from '@/layouts/Base.astro';

const title = 'Search';
const description = 'Search across the blog, glossary, work, and writing.';
---

<Base title={title} description={description} robots="noindex">
  <main class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <header class="mb-8">
      <h1 class="text-4xl font-bold tracking-tight mb-2">Search</h1>
      <p class="text-muted-foreground">
        {description}
      </p>
    </header>

    <div id="search"></div>
  </main>

  <link rel="stylesheet" href="/pagefind/pagefind-ui.css" />
  <style is:global>
    /* Theme Pagefind UI to site palette. The site uses CSS-variable-based
       Tailwind tokens — map Pagefind variables to those tokens so light/dark
       mode tracks automatically. */
    :root {
      --pagefind-ui-primary: var(--color-primary, hsl(220 90% 56%));
      --pagefind-ui-text: hsl(var(--foreground));
      --pagefind-ui-background: hsl(var(--background));
      --pagefind-ui-border: hsl(var(--border));
      --pagefind-ui-tag: hsl(var(--muted));
      --pagefind-ui-border-width: 1px;
      --pagefind-ui-border-radius: 0.5rem;
      --pagefind-ui-font: var(--font-sans, system-ui, sans-serif);
    }
    .pagefind-ui__result-title {
      font-family: var(--font-serif, Georgia, serif);
    }
  </style>

  <script>
    import { PagefindUI } from '/pagefind/pagefind-ui.js';

    const ui = new PagefindUI({
      element: '#search',
      showImages: false,
      showSubResults: true,
      resetStyles: false,
      processResult: (result) => {
        // Add a small "kind" label in front of each result title using
        // the data-pagefind-meta="kind:..." attribute we set per layout.
        const kind = result.meta?.kind;
        if (kind && result.meta) {
          result.meta.title = `[${kind}] ${result.meta.title ?? ''}`.trim();
        }
        return result;
      },
    });

    // Seed search input from ?q= so the SearchAction JSON-LD URL works.
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('q');
    if (initial) {
      ui.triggerSearch(initial);
    }
  </script>
</Base>
```

If `Base.astro` does not currently accept a `robots` prop, the script needs `<meta name="robots" content="noindex" />` emitted explicitly. Check `src/layouts/Base.astro` first; if no `robots` prop, replace the `<Base>` opening line with:

```astro
<Base title={title} description={description}>
  <Fragment slot="head">
    <meta name="robots" content="noindex" />
  </Fragment>
```

Use whichever pattern the codebase already supports for noindex (e.g., `/changelog` pages are noindex'd per CHANGELOG v0.11.4 — copy that approach).

- [ ] **Step 2: Build and confirm the route renders**

```bash
npm run build
ls dist/search/index.html
grep -o 'noindex' dist/search/index.html
grep -o 'pagefind-ui.js' dist/search/index.html
grep -o 'pagefind-ui.css' dist/search/index.html
```

Expected: file exists; `noindex`, `pagefind-ui.js`, and `pagefind-ui.css` all present.

- [ ] **Step 3: Preview and exercise search manually**

```bash
npm run preview
```

Open `http://localhost:4321/search`. Type "wordpress" — expect blog post results. Type "irt" — expect glossary terms and at least one blog post. Type "gyfted" — expect the company page. Type "pagefind" — expect zero results (we haven't published anything about it yet).

Test the URL-param seeding: navigate to `http://localhost:4321/search?q=wordpress` — search input should be pre-populated and results should already be visible.

- [ ] **Step 4: Verify View Transitions don't break the mount**

Still in `npm run preview`, navigate from `/` → click any other nav link → click into `/search` (if there's a link; otherwise URL-bar it). Confirm Pagefind UI re-mounts cleanly. If it shows a blank `<div id="search">` on second visit, add the `data-astro-reload` mitigation in Task 6.

- [ ] **Step 5: Commit**

```bash
git add src/pages/search.astro
git commit -m "$(cat <<'EOF'
feat(pagefind): add /search route with default Pagefind UI

Themed via CSS variables to match the site's tokens (light/dark mode
follows automatically). Seeds the search input from ?q= so the sitewide
SearchAction JSON-LD points at a URL that actually works. The route is
noindex — search pages aren't useful organic landings.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Footer "Search" link, robots.txt disallow, sitemap exclusion

**Files:**
- Modify: `src/components/Footer.astro`
- Modify: `public/robots.txt`
- Modify: `src/pages/sitemap-pages.xml.ts`

- [ ] **Step 1: Add the "Search" link to `Footer.astro`'s `pages` array**

Edit lines 9-18 of `src/components/Footer.astro`. Insert `Search` after `Glossary`:

```ts
const footerLinks = {
  pages: [
    { href: '/work', label: 'Work' },
    { href: '/projects', label: 'Case Studies' },
    { href: '/blog', label: 'Blog' },
    { href: '/publications', label: 'Publications' },
    { href: '/glossary', label: 'Glossary' },
    { href: '/search', label: 'Search' },
    { href: '/about', label: 'About' },
    { href: '/cv', label: 'CV' },
    { href: '/changelog', label: 'Changelog' },
  ],
  ...
```

Keep the rest of the file unchanged.

- [ ] **Step 2: If Task 5 Step 4 showed a View Transitions issue, add `data-astro-reload`**

Find where `Footer.astro` renders the link template (around the existing `<a href={link.href}>` line). If View Transitions cause Pagefind UI to fail to mount on subsequent navigations, add `data-astro-reload` only to the Search link — easiest done by special-casing in the render:

```astro
<a
  href={link.href}
  data-astro-reload={link.href === '/search' ? '' : undefined}
  class="..."
>{link.label}</a>
```

Skip this step if Task 5 Step 4 worked without it.

- [ ] **Step 3: Edit `public/robots.txt`**

Replace contents with:

```
User-agent: *
Allow: /
Disallow: /pagefind/

Sitemap: https://www.blazejmrozinski.com/sitemap-index.xml
```

The disallow is for the Pagefind bundle assets (`/pagefind/pagefind.js`, the index chunks, etc.) — they shouldn't be indexed as if they were content. The `/search` route is allowed to be crawled (it's `noindex`'d at the page level instead).

- [ ] **Step 4: Exclude `/search` from the pages sitemap**

Open `src/pages/sitemap-pages.xml.ts`. Find where the page list is built (likely a static array of paths like `['', 'about', 'cv', ...]` or a glob over `src/pages/*.astro`). Whichever it is:

- If a static array: do NOT add `'search'` to it. (No-op — just confirm the file doesn't include it.)
- If glob-derived: filter out `'search'` explicitly. Example pattern:

```ts
const excludedFromSitemap = new Set(['404', 'search']);
const pages = allPages.filter((p) => !excludedFromSitemap.has(p));
```

Use whichever sitemap approach the file already uses; just ensure `/search` is not in the resulting `<url>` list.

- [ ] **Step 5: Build and verify all three changes**

```bash
npm run build
echo "--- Footer Search link ---"
grep -o '/search' dist/index.html | head -3
echo "--- robots.txt disallow ---"
cat dist/robots.txt
echo "--- Sitemap excludes /search ---"
grep -c '/search' dist/sitemap-pages.xml || echo "0 (correct)"
```

Expected:
- `/search` appears in `dist/index.html` (footer link rendered).
- `dist/robots.txt` includes `Disallow: /pagefind/`.
- `dist/sitemap-pages.xml` does NOT contain `/search` (grep -c returns 0).

- [ ] **Step 6: Commit**

```bash
git add src/components/Footer.astro public/robots.txt src/pages/sitemap-pages.xml.ts
git commit -m "$(cat <<'EOF'
feat(pagefind): footer link, robots disallow, sitemap exclusion

Adds a "Search" link to the footer nav (between Glossary and About).
robots.txt now disallows /pagefind/ asset paths so the Pagefind bundle
doesn't get crawled as content. /search is excluded from
sitemap-pages.xml — the route is interactive/noindex and not a useful
organic landing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Build-artifact verification harness (TDD)

**Files:**
- Create: `scripts/pagefind-check.test.mjs`
- Modify: `package.json` (add npm script)

- [ ] **Step 1: Write the verification test suite**

Create `scripts/pagefind-check.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');

async function readDist(relPath) {
  return await readFile(join(DIST, relPath), 'utf8');
}

test('dist/ exists (run npm run build first)', () => {
  assert.ok(existsSync(DIST), 'dist/ missing — run npm run build');
});

test('Pagefind bundle assets shipped to dist/pagefind/', async () => {
  const required = [
    'pagefind/pagefind.js',
    'pagefind/pagefind-ui.js',
    'pagefind/pagefind-ui.css',
  ];
  for (const path of required) {
    const full = join(DIST, path);
    assert.ok(existsSync(full), `missing: ${path}`);
    const s = await stat(full);
    assert.ok(s.size > 0, `empty: ${path}`);
  }
});

test('homepage emits SearchAction in WebSite JSON-LD', async () => {
  const html = await readDist('index.html');
  assert.match(html, /"@type":\s*"SearchAction"/);
  assert.match(html, /"urlTemplate":\s*"[^"]*\/search\?q=\{search_term_string\}"/);
  assert.match(html, /"query-input":\s*"required name=search_term_string"/);
});

test('a deep blog post also emits the SearchAction (sitewide)', async () => {
  const html = await readDist('blog/wp-infra-04-four-layers-of-caching/index.html');
  assert.match(html, /"@type":\s*"SearchAction"/);
});

test('blog post has data-pagefind-body and kind:blog meta', async () => {
  const html = await readDist('blog/wp-infra-04-four-layers-of-caching/index.html');
  assert.match(html, /data-pagefind-body/);
  assert.match(html, /data-pagefind-meta="kind:blog"/);
});

test('glossary term has data-pagefind-body and kind:glossary meta', async () => {
  // Pick any glossary slug that exists; falls back to scanning the dir.
  const { readdir } = await import('node:fs/promises');
  const slugs = await readdir(join(DIST, 'glossary')).catch(() => []);
  const sample = slugs.find((s) => s !== 'index.html');
  assert.ok(sample, 'no glossary terms found in dist');
  const html = await readDist(`glossary/${sample}/index.html`);
  assert.match(html, /data-pagefind-body/);
  assert.match(html, /data-pagefind-meta="kind:glossary"/);
});

test('about, cv, publications opted in', async () => {
  for (const path of ['about/index.html', 'cv/index.html', 'publications/index.html']) {
    const html = await readDist(path);
    assert.match(html, /data-pagefind-body/, `missing on ${path}`);
  }
});

test('listing pages NOT opted in', async () => {
  const listings = [
    'blog/index.html',
    'blog/topic/wordpress-infrastructure/index.html',
    'blog/series/wp-infrastructure/index.html',
  ];
  for (const path of listings) {
    if (!existsSync(join(DIST, path))) continue;
    const html = await readDist(path);
    assert.doesNotMatch(html, /data-pagefind-body/, `unexpected on ${path}`);
  }
});

test('header and footer carry data-pagefind-ignore on every page', async () => {
  const samples = ['index.html', 'about/index.html', 'blog/index.html'];
  for (const path of samples) {
    const html = await readDist(path);
    const ignoreCount = (html.match(/data-pagefind-ignore/g) ?? []).length;
    assert.ok(ignoreCount >= 2, `expected ≥2 ignore markers on ${path}, got ${ignoreCount}`);
  }
});

test('/search route exists and is noindex', async () => {
  const html = await readDist('search/index.html');
  assert.match(html, /<meta\s+name="robots"\s+content="noindex"/);
  assert.match(html, /pagefind-ui\.js/);
  assert.match(html, /pagefind-ui\.css/);
  assert.match(html, /id="search"/);
});

test('robots.txt disallows /pagefind/', async () => {
  const txt = await readDist('robots.txt');
  assert.match(txt, /Disallow:\s*\/pagefind\//);
});

test('/search NOT in sitemap-pages.xml', async () => {
  const xml = await readDist('sitemap-pages.xml');
  assert.doesNotMatch(xml, /\/search<\/loc>/);
});

test('footer "Search" nav link rendered on homepage', async () => {
  const html = await readDist('index.html');
  // Loose match — link could be <a href="/search">Search</a> or similar.
  assert.match(html, /href="\/search"/);
});
```

- [ ] **Step 2: Add an npm script to run it**

In `package.json`, add to `"scripts"`:

```json
"pagefind:check": "node --import tsx --test scripts/pagefind-check.test.mjs"
```

- [ ] **Step 3: Run the harness against an already-built `dist/`**

```bash
npm run build
npm run pagefind:check
```

Expected: all tests pass. If any fail, fix the underlying file (Tasks 1-6) and re-run.

- [ ] **Step 4: Commit**

```bash
git add scripts/pagefind-check.test.mjs package.json
git commit -m "$(cat <<'EOF'
test(pagefind): build-artifact verification harness

Asserts every requirement from the design spec: bundle ships, SearchAction
emits sitewide, opt-in attribute lands on content layouts, listings stay
out, chrome carries ignore markers, /search is noindex, robots.txt
disallows /pagefind/, /search is not in the sitemap.

Run: npm run pagefind:check (after npm run build).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Lighthouse regression check, CHANGELOG, README

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`

- [ ] **Step 1: Re-run Lighthouse on `/` and `/search`**

Site is not yet deployed — run against the local preview:

```bash
npm run preview &
PREV_PID=$!
sleep 3
mkdir -p /tmp/lh-pagefind
npx -y lighthouse http://localhost:4321/ \
  --quiet --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
  --form-factor=mobile --throttling-method=simulate \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=/tmp/lh-pagefind/home.json
npx -y lighthouse http://localhost:4321/search \
  --quiet --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
  --form-factor=mobile --throttling-method=simulate \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=/tmp/lh-pagefind/search.json
kill $PREV_PID 2>/dev/null || true

for f in /tmp/lh-pagefind/home.json /tmp/lh-pagefind/search.json; do
  echo "=== ${f} ==="
  jq -r '
    {
      perf: (.categories.performance.score * 100 | floor),
      a11y: (.categories.accessibility.score * 100 | floor),
      bp: (.categories["best-practices"].score * 100 | floor),
      seo: (.categories.seo.score * 100 | floor),
      LCP_ms: .audits["largest-contentful-paint"].numericValue,
      TBT_ms: .audits["total-blocking-time"].numericValue
    } | to_entries | map("\(.key): \(.value)") | join(", ")
  ' "$f"
done
```

Expected:
- `/` Performance ≥ 86 (must not regress vs. 2026-05-04 audit baseline; sitewide JSON-LD `SearchAction` adds a few hundred bytes but no JS).
- `/search` Performance ≥ 80 (it loads ~100 KB of Pagefind UI + Pagefind core; expected to be lower than chrome-only routes but still healthy).

If `/` regressed below 86: investigate. Most likely culprit is SearchAction adding measurable HTML weight or the `Search` footer link triggering an unexpected re-paint. Both would be small enough to chase down.

- [ ] **Step 2: Add a CHANGELOG entry**

Open `CHANGELOG.md`. Insert at the top (above `## [0.13.0]`):

```markdown
## [0.14.0] — 2026-05-04 — Pagefind static search + sitewide SearchAction

### Added
- **`/search` route** powered by Pagefind v1.x default UI, themed via CSS variables to match the site's palette and font stack. Reads `?q=` query param so deep-linking to a search query works.
- **Sitewide `SearchAction`** in the WebSite JSON-LD (`getWebSiteNode()` → `potentialAction`). Required for Google to consider showing a sitelinks search box on brand SERP. URL template: `https://www.blazejmrozinski.com/search?q={search_term_string}`.
- **`data-pagefind-body` opt-in** on content layouts: BlogPost, glossary terms, companies, projects, publications, about, cv. Each result carries `data-pagefind-meta` `kind:<type>` and (on blog posts) `date:<iso>` for future relevance/sort use.
- **`data-pagefind-ignore`** on Header, Footer, SeriesNav, RelatedPosts, and the "Filed under" line so search snippets aren't polluted with chrome.
- **Footer "Search" link** between Glossary and About.
- **Build-artifact verification harness** (`scripts/pagefind-check.test.mjs`, `npm run pagefind:check`): asserts every spec requirement against the rendered `dist/`.

### Changed
- **`postbuild` script** now runs `pagefind --site dist` before the existing IndexNow ping. CF Pages publishes `dist/pagefind/` alongside the site; no CDN change needed.
- **`robots.txt`** adds `Disallow: /pagefind/` so the Pagefind bundle assets aren't crawled as if they were content. `/search` is allowed to be crawled but is `noindex` at the page level.

### Why
- The Tier 1 entity graph (v0.12.0) declared `WebSite` sitewide but had no `potentialAction` — Google can't surface a sitelinks search box without a real, working search URL. Pagefind is the smallest path to a legitimate `/search?q=` that lets the action count.
- Listing pages (`/blog`, topic hubs, series landings, work index, projects index) and the photography gallery are deliberately not indexed: they're navigation, not search destinations. A reader searching "wordpress" should land on a post, not on a hub. PL routes excluded for now and will get a separate per-locale index when i18n unpauses.
- Bundle scope: Pagefind UI loads only on `/search`. Sitewide JS would add ~100 KB to every page on a site whose Lighthouse audit (2026-05-04) just put LCP into the "Needs Improvement" band. Keeping the bundle off the long-form pages preserves headroom for the perf fixes coming next.
```

- [ ] **Step 3: Update `README.md` to mention search**

Add a short bullet under whatever section lists site features (or "Site map" / "What's here" / similar). One bullet:

```markdown
- **Search** at [/search/](https://www.blazejmrozinski.com/search/) — Pagefind static search across the blog, glossary, work, projects, publications, about, and cv pages.
```

If the README has no such section, skip this step.

- [ ] **Step 4: Final pre-merge verification**

```bash
npm run build
npm run pagefind:check
npm run translate:check 2>/dev/null || echo "(translate:check not on this branch — fine)"
node --import tsx --test scripts/jsonld.test.mjs
```

All commands must exit 0.

- [ ] **Step 5: Commit and push**

```bash
git add CHANGELOG.md README.md
git commit -m "$(cat <<'EOF'
docs: CHANGELOG v0.14.0 and README sync for Pagefind search

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git push -u origin feat/seo-tier3-pagefind-search
```

- [ ] **Step 6: Open a PR (only if user asks)**

Per CLAUDE.md, do not push or open PRs without explicit user request. The push step above happens only when Blazej says "push" or "open PR". If they do:

```bash
gh pr create --title "feat(seo-tier3): Pagefind static search + sitewide SearchAction" --body "$(cat <<'EOF'
## Summary
- New `/search` route with default Pagefind UI themed to the site palette.
- Sitewide `SearchAction` JSON-LD on every page (via `getWebSiteNode()`).
- Opt-in indexing on content layouts (blog, glossary, companies, projects, publications, about, cv); chrome and listings excluded.
- New `npm run pagefind:check` harness asserting all spec requirements.

Spec: `docs/superpowers/specs/2026-05-04-pagefind-static-search-design.md`
Plan: `docs/superpowers/plans/2026-05-04-pagefind-static-search.md`

## Test plan
- [ ] `npm run build` succeeds
- [ ] `npm run pagefind:check` passes
- [ ] `node --import tsx --test scripts/jsonld.test.mjs` passes
- [ ] `npm run preview` → `/search` returns results for "wordpress", "irt", "gyfted"
- [ ] `/search?q=wordpress` direct-link shows pre-populated results
- [ ] Lighthouse mobile on `/` ≥ 86 Performance (no regression vs. 2026-05-04 baseline)
- [ ] Lighthouse mobile on `/search` ≥ 80 Performance

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** every "In scope" item in the spec maps to a task (Task 1: dep + postbuild; Task 2: SearchAction; Task 3: opt-in attributes; Task 4: ignore on chrome; Task 5: /search route; Task 6: footer link + robots + sitemap; Task 7-8: verification + docs).
- **Risks from spec covered:** font leak (Task 5 step 3 exercises `/search` UI), View Transitions (Task 5 step 4 + Task 6 step 2 fallback), trailingSlash (handled implicitly by `/search` matching how all other routes work; Task 8 lighthouse run on `/search` confirms no surprise redirect), index size (Task 3 step 9 reports doc count; Task 8 jq output gives bundle weight indirectly), SeriesNav/RelatedPosts pollution (Task 4 step 3), CI binary availability (Pagefind ships pre-built binaries for darwin and linux per the Pagefind docs — no separate task needed; if CF Pages build fails, fall back to running Pagefind in a CF Pages build hook config).
- **Type consistency:** `getWebSiteNode` is the single export point; `WEBSITE_ID`, `SITE_URL`, `PERSON_ID` already exist and are reused. `data-pagefind-body` and `data-pagefind-meta` attribute names match Pagefind v1 docs. The `kind:<type>` meta values are fixed strings used in both layouts and the harness.
- **No placeholders:** every step has the actual code or command. The only conditional is Task 5 step 1's `Base.astro` `robots` prop check, which gives the engineer the exact alternative pattern to use.
