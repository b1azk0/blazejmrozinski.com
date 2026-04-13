# Polish Translation (i18n) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-04-13-polish-translation-design.md`

**Goal:** Add a Polish (`/pl/*`) localized version of the Astro static site covering UI chrome, static pages, companies, and projects, with on-demand drift-detected translation by Claude in local sessions.

**Architecture:** A subpath-based bilingual site. Polish content lives as `.pl.md` siblings of English markdown files inside `src/content/{pages,companies,projects}/`. Shared components (Header, Footer, Base, SEO) become locale-aware via a `locale` prop. UI strings live in `src/i18n/{en,pl}.json` and are read via a `t()` helper. A `routes.json` map declares translated route prefixes (e.g. `work`→`praca`). Each Polish top-level page is its own thin shell at `src/pages/pl/<polish-slug>.astro` mirroring the EN shell. A drift-detection script (`npm run translate:check`) compares EN content hashes against `source_hash` frontmatter on the PL siblings.

**Tech Stack:** Astro 6, TypeScript, Tailwind v4, Node 22, custom XML sitemaps, no test framework currently — drift script tests use Node's built-in `node:test`.

---

## Notes for the Implementing Engineer

You probably don't know this codebase. Read these notes before starting Task 1.

### Project layout you need to know

- **Astro static site.** No SSR. `npm run build` produces a static `dist/`.
- **Content collections** (`src/content.config.ts`) define Zod schemas for markdown collections: `pages`, `companies`, `projects`, `blog`, `glossary`, `photography`. Each `.md` file in `src/content/<collection>/` becomes a typed entry.
- **Two case-study sections, not one.** `/work/*` is built from the `companies` collection. `/projects/*` is built from the `projects` collection. They are SEPARATE routes with SEPARATE dynamic-route files (`src/pages/work/[...slug].astro` and `src/pages/projects/[...slug].astro`). Don't conflate them.
- **Top-level static pages** like `/about`, `/cv`, `/work` (index), `/contact`, `/` are hand-built `.astro` files in `src/pages/`. Some of them (about, cv, work index) use the `pages` content collection to load their *body markdown* (`src/content/pages/about.md`), but the surrounding shell is custom-coded per page.
- **No test framework.** The repo has no vitest/jest. We will use Node's built-in `node:test` runner for the small amount of testable code (the drift script). Everything else is verified by `npm run build` succeeding plus a manual click-test on `npm run dev`.
- **Type checking:** `npx astro check` runs the Astro language tools and reports type errors. Use this as your "compile" gate.
- **Pre-build hook:** `npm run build` runs `prebuild` which runs `generate-covers.ts`. If that fails (it shouldn't, since it doesn't touch i18n), you can `npm run build -- --skip-prebuild` is NOT supported, but you can run `npx astro build` directly to bypass.

### Conventions to follow

- **Component imports use `@/` alias** for `src/`. Example: `import Base from '@/layouts/Base.astro'`. Don't use relative imports for cross-directory imports.
- **Tailwind v4** with `@tailwindcss/vite`. Class names follow the existing patterns — see Header.astro for examples.
- **No comments in code** unless they explain a non-obvious WHY. Don't add docstrings.
- **Frequent commits** — each task ends with a commit. The conventional prefix used in the repo is `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, etc.

### The "drift detection" mental model

The script never translates anything. It only reports what's stale. The actual translation work (filling in `pl.json` and writing `.pl.md` bodies) is done by Claude reading files in a Claude Code session — that work is NOT executed by this plan. The plan only builds the *machinery* and creates the *empty PL file shells*. Filling in real Polish content is its own session, done by Claude after this plan completes.

### Scope of this plan

This plan delivers:
1. The i18n machinery (routes, dictionaries, helper, schema, drift script).
2. Locale-aware shared components (Header, Footer, Base, SEO, LanguageSwitcher).
3. The Astro routing structure for `/pl/*`.
4. Empty `.pl.md` sibling files for all in-scope content (correct frontmatter, empty body — placeholders for Claude to fill).
5. Sitemap updates with hreflang annotations.
6. A passing `npm run build` and a manually-verified click-test on the dev server.

This plan does NOT:
- Translate the actual content (`pl.json` strings or `.pl.md` bodies). Those will be filled by Claude in a follow-up session — see the spec's "Translation workflow" section.
- Set up any CI/GitHub Action.
- Touch blog, publications, glossary, photography, or changelog files.

---

## File Map

### New files

| Path | Purpose |
|---|---|
| `src/i18n/routes.json` | EN→PL route prefix map; single source of truth for section URLs |
| `src/i18n/en.json` | English UI strings dictionary |
| `src/i18n/pl.json` | Polish UI strings dictionary (created with same key shape; values empty until translated) |
| `src/i18n/t.ts` | `t(key, locale)` helper with EN fallback and key-surfacing on miss |
| `src/i18n/locale.ts` | `Locale` type and small helpers (e.g. `localizedHref`) |
| `src/components/LanguageSwitcher.astro` | EN/PL switcher with smart fallback |
| `scripts/translate-check.mjs` | Drift detection script (no deps, exits 0 always) |
| `scripts/translate-check.test.mjs` | Tests for the drift script using Node's `node:test` |
| `scripts/hooks/post-commit` | Optional reminder hook (installed via `npm run install-hooks`) |
| `scripts/install-hooks.mjs` | Installs the post-commit hook into `.git/hooks/` |
| `src/pages/pl/index.astro` | Polish homepage shell (mirrors `src/pages/index.astro`) |
| `src/pages/pl/o-mnie.astro` | Polish about shell |
| `src/pages/pl/cv.astro` | Polish CV shell |
| `src/pages/pl/kontakt.astro` | Polish contact shell |
| `src/pages/pl/404.astro` | Polish 404 shell |
| `src/pages/pl/praca/index.astro` | Polish work index shell |
| `src/pages/pl/praca/[...slug].astro` | Polish company page dynamic route |
| `src/pages/pl/projekty/index.astro` | Polish projects index shell |
| `src/pages/pl/projekty/[...slug].astro` | Polish project page dynamic route |
| `src/content/pages/about.pl.md` | Empty Polish about (frontmatter only) |
| `src/content/pages/cv.pl.md` | Empty Polish CV |
| `src/content/pages/work.pl.md` | Empty Polish work intro |
| `src/content/companies/gyfted.pl.md` | Empty PL sibling |
| `src/content/companies/nerds-family.pl.md` | Empty PL sibling |
| `src/content/companies/digital-savages.pl.md` | Empty PL sibling |
| `src/content/companies/swps-university.pl.md` | Empty PL sibling |
| `src/content/projects/contentforge.pl.md` | Empty PL sibling |
| `src/content/projects/hse-career-quiz.pl.md` | Empty PL sibling |
| `src/content/projects/kryptotracker.pl.md` | Empty PL sibling |
| `src/content/projects/new-aggregator.pl.md` | Empty PL sibling |
| `src/content/projects/prawomat.pl.md` | Empty PL sibling |
| `src/content/projects/ssm.pl.md` | Empty PL sibling |

### Modified files

| Path | Change |
|---|---|
| `src/content.config.ts` | Add `lang`, `source_hash`, `slug` optional fields to `pages`, `companies`, `projects` schemas |
| `src/layouts/Base.astro` | Accept `locale` prop, set `<html lang>`, pass to Header/Footer/SEO, accept `alternateUrl` for hreflang |
| `src/components/Header.astro` | Accept `locale` prop; translate nav labels via `t()`; route via `routes.json`; mount LanguageSwitcher |
| `src/components/Footer.astro` | Accept `locale` prop; translate labels via `t()`; route via `routes.json` |
| `src/components/SEO.astro` | Accept `locale` and `alternateUrl` props; emit canonical, hreflang en/pl/x-default, og:locale |
| `src/pages/sitemap-pages.xml.ts` | Emit hreflang annotations for translated pages |
| `src/pages/sitemap-work.xml.ts` | Emit hreflang annotations for `/work` and `/projects` (which both live in this file) |
| `package.json` | Add `translate:check`, `translate:check:test`, `install-hooks` scripts |
| `CHANGELOG.md` | Add entry per the user's global rule |
| `README.md` | Add a brief i18n section if it makes sense |

---

## Phase 1: Worktree Setup

### Task 1: Create the worktree and feature branch

**Files:** None modified; only git state.

- [ ] **Step 1: Verify clean main**

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com
git status
```
Expected: `working tree clean` on `main`. If not, stop and ask the user.

- [ ] **Step 2: Create the worktree and branch**

```bash
git worktree add ../blazejmrozinski.com-pl -b feat/polish-i18n
```
Expected: `Preparing worktree (new branch 'feat/polish-i18n')` and `HEAD is now at <sha>`.

- [ ] **Step 3: cd into the worktree for all subsequent work**

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com-pl
pwd
```
Expected: prints the worktree path. Every subsequent command in this plan runs from this directory.

- [ ] **Step 4: Install dependencies in the worktree**

```bash
npm install
```
Expected: clean install, no errors. The worktree shares the git history but has its own `node_modules`.

- [ ] **Step 5: Verify the baseline build works**

```bash
npm run build
```
Expected: build succeeds. If it fails on `main` it will fail in the worktree too — stop and investigate before adding any changes.

- [ ] **Step 6: No commit needed for this task** — git state changes only.

---

## Phase 2: i18n Foundation

### Task 2: Create the routes map

**Files:**
- Create: `src/i18n/routes.json`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/i18n
```

- [ ] **Step 2: Write `src/i18n/routes.json`**

```json
{
  "en": {
    "about": "about",
    "work": "work",
    "projects": "projects",
    "contact": "contact",
    "cv": "cv"
  },
  "pl": {
    "about": "o-mnie",
    "work": "praca",
    "projects": "projekty",
    "contact": "kontakt",
    "cv": "cv"
  }
}
```

- [ ] **Step 3: Verify the file is valid JSON**

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('src/i18n/routes.json','utf8')))"
```
Expected: prints the parsed object. Any error means the JSON is malformed.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/routes.json
git commit -m "feat(i18n): add EN/PL route prefix map"
```

### Task 3: Create the English UI dictionary

**Files:**
- Create: `src/i18n/en.json`

This is the initial seed. Strings will be added as components are refactored in later tasks. Keep it greppable, one level of namespacing.

- [ ] **Step 1: Write `src/i18n/en.json`**

```json
{
  "nav": {
    "work": "Work",
    "projects": "Case Studies",
    "blog": "Blog",
    "publications": "Publications",
    "about": "About",
    "cv": "CV",
    "contact": "Contact"
  },
  "footer": {
    "section_pages": "Pages",
    "section_connect": "Connect",
    "section_get_in_touch": "Get in Touch",
    "tagline": "Psychologist, psychometrician, product builder. Building at the intersection of cognitive science, AI, and growth engineering.",
    "interested": "Interested in working together?",
    "contact_me": "Contact me",
    "view_changelog": "view changelog",
    "rights": "All rights reserved"
  },
  "base": {
    "skip_to_content": "Skip to content"
  },
  "lang_switcher": {
    "switch_to_pl": "Przełącz na polski",
    "switch_to_en": "Switch to English"
  },
  "404": {
    "title": "Page not found",
    "body": "The page you're looking for doesn't exist.",
    "back_home": "Back to home"
  },
  "header": {
    "home_title": "Blazej Mrozinski — Home",
    "main_nav": "Main navigation",
    "mobile_nav": "Mobile navigation",
    "toggle_menu": "Toggle navigation menu",
    "close_menu": "Close menu"
  }
}
```

Note: `lang_switcher.switch_to_pl` is the Polish phrase used as the `aria-label` on the EN page's switcher (a Polish speaker hovering over it sees Polish). This is intentional and matches the spec.

- [ ] **Step 2: Validate JSON**

```bash
node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('src/i18n/en.json','utf8'))))"
```
Expected: `[ 'nav', 'footer', 'base', 'lang_switcher', '404', 'header' ]`.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/en.json
git commit -m "feat(i18n): seed English UI dictionary"
```

### Task 4: Create the Polish UI dictionary skeleton

**Files:**
- Create: `src/i18n/pl.json`

This file is created with the same key structure but with empty string values. Claude will fill it in during the translation phase after this plan completes. Empty strings will trigger the `t()` helper's EN fallback so the build doesn't break.

- [ ] **Step 1: Write `src/i18n/pl.json`**

```json
{
  "nav": {
    "work": "",
    "projects": "",
    "blog": "",
    "publications": "",
    "about": "",
    "cv": "",
    "contact": ""
  },
  "footer": {
    "section_pages": "",
    "section_connect": "",
    "section_get_in_touch": "",
    "tagline": "",
    "interested": "",
    "contact_me": "",
    "view_changelog": "",
    "rights": ""
  },
  "base": {
    "skip_to_content": ""
  },
  "lang_switcher": {
    "switch_to_pl": "",
    "switch_to_en": ""
  },
  "404": {
    "title": "",
    "body": "",
    "back_home": ""
  },
  "header": {
    "home_title": "",
    "main_nav": "",
    "mobile_nav": "",
    "toggle_menu": "",
    "close_menu": ""
  }
}
```

- [ ] **Step 2: Validate JSON**

```bash
node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('src/i18n/pl.json','utf8'))))"
```
Expected: same six keys as `en.json`.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/pl.json
git commit -m "feat(i18n): add Polish dictionary skeleton (empty strings)"
```

### Task 5: Create the locale type and `t()` helper

**Files:**
- Create: `src/i18n/locale.ts`
- Create: `src/i18n/t.ts`

- [ ] **Step 1: Write `src/i18n/locale.ts`**

```typescript
import routes from './routes.json';

export type Locale = 'en' | 'pl';

export const LOCALES: Locale[] = ['en', 'pl'];

export function isLocale(value: string): value is Locale {
  return value === 'en' || value === 'pl';
}

export function localePrefix(locale: Locale): string {
  return locale === 'en' ? '' : '/pl';
}

export function localizedHref(key: keyof typeof routes.en, locale: Locale): string {
  const slug = routes[locale][key];
  return `${localePrefix(locale)}/${slug}`;
}
```

- [ ] **Step 2: Write `src/i18n/t.ts`**

```typescript
import en from './en.json';
import pl from './pl.json';
import type { Locale } from './locale';

const dictionaries = { en, pl } as const;

export function t(key: string, locale: Locale = 'en'): string {
  const parts = key.split('.');

  function lookup(dict: unknown): string | undefined {
    let value: unknown = dict;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return typeof value === 'string' ? value : undefined;
  }

  const direct = lookup(dictionaries[locale]);
  if (direct !== undefined && direct !== '') return direct;

  if (locale !== 'en') {
    const fallback = lookup(dictionaries.en);
    if (fallback !== undefined && fallback !== '') return fallback;
  }

  return key;
}
```

Two important properties:
1. Empty strings (the placeholder values in `pl.json`) trigger the EN fallback. This lets us ship the skeleton `pl.json` without breaking pages.
2. A missing key surfaces the literal key string in the rendered HTML, making typos obvious.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx astro check
```
Expected: `0 errors`. Existing warnings (if any) are unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locale.ts src/i18n/t.ts
git commit -m "feat(i18n): add Locale type and t() helper with EN fallback"
```

### Task 6: Extend content schema with `lang`, `source_hash`, and `slug` fields

**Files:**
- Modify: `src/content.config.ts`

Add three optional fields to the `pages`, `companies`, and `projects` collection schemas. Existing EN files (which won't have these fields) keep working because the fields are optional with defaults.

- [ ] **Step 1: Read the current schema**

```bash
cat src/content.config.ts
```
Expected: shows the existing collection definitions (pages, companies, projects, blog, glossary, photography).

- [ ] **Step 2: Edit `src/content.config.ts`**

In the `pages` collection schema, change:

```ts
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});
```

to:

```ts
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(['en', 'pl']).default('en'),
    source_hash: z.string().optional(),
    slug: z.string().optional(),
  }),
});
```

In the `companies` collection schema, add the same three fields (`lang`, `source_hash`, `slug`) at the end of the schema object.

In the `projects` collection schema, add the same three fields at the end.

- [ ] **Step 3: Verify the schema typechecks**

```bash
npx astro check
```
Expected: `0 errors`. The default value of `lang: 'en'` means existing EN files have `lang === 'en'` after load without any file edits.

- [ ] **Step 4: Verify the build still works**

```bash
npm run build
```
Expected: clean build. URLs unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts
git commit -m "feat(i18n): add lang/source_hash/slug fields to content schemas"
```

---

## Phase 3: Drift Detection Script

### Task 7: Write tests for the drift script (TDD)

**Files:**
- Create: `scripts/translate-check.test.mjs`

We use Node's built-in `node:test` runner — no new dev deps. The script under test will be created in Task 8.

- [ ] **Step 1: Write `scripts/translate-check.test.mjs`**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { computeHash, scanCollection, compareDictionaries } from './translate-check.lib.mjs';

function makeTempContentDir() {
  const dir = mkdtempSync(join(tmpdir(), 'translate-check-'));
  return dir;
}

test('computeHash returns the same hash for whitespace-equivalent files', () => {
  const a = '---\ntitle: Hello\n---\n\nBody text\n';
  const b = '---\ntitle: Hello\n---\n\nBody text   \n\n\n';  // trailing spaces + extra newlines
  assert.equal(computeHash(a), computeHash(b));
});

test('computeHash returns different hashes for substantively different files', () => {
  const a = '---\ntitle: Hello\n---\n\nBody A\n';
  const b = '---\ntitle: Hello\n---\n\nBody B\n';
  assert.notEqual(computeHash(a), computeHash(b));
});

test('computeHash is stable when frontmatter key order changes', () => {
  const a = '---\ntitle: T\ndescription: D\n---\n\nBody\n';
  const b = '---\ndescription: D\ntitle: T\n---\n\nBody\n';
  assert.equal(computeHash(a), computeHash(b));
});

test('computeHash returns a 12-char hex string', () => {
  const hash = computeHash('---\ntitle: T\n---\nbody\n');
  assert.match(hash, /^[a-f0-9]{12}$/);
});

test('scanCollection reports MISSING when no .pl.md sibling exists', () => {
  const dir = makeTempContentDir();
  writeFileSync(join(dir, 'about.md'), '---\ntitle: About\n---\nBody\n');
  const result = scanCollection(dir);
  assert.equal(result.missing.length, 1);
  assert.equal(result.missing[0], join(dir, 'about.md'));
  assert.equal(result.drifted.length, 0);
  assert.equal(result.upToDate.length, 0);
  rmSync(dir, { recursive: true, force: true });
});

test('scanCollection reports UP TO DATE when source_hash matches', () => {
  const dir = makeTempContentDir();
  const enContent = '---\ntitle: About\n---\nBody\n';
  writeFileSync(join(dir, 'about.md'), enContent);
  const expectedHash = computeHash(enContent);
  writeFileSync(
    join(dir, 'about.pl.md'),
    `---\ntitle: O mnie\nlang: pl\nsource_hash: ${expectedHash}\n---\nTresc\n`,
  );
  const result = scanCollection(dir);
  assert.equal(result.upToDate.length, 1);
  assert.equal(result.missing.length, 0);
  assert.equal(result.drifted.length, 0);
  rmSync(dir, { recursive: true, force: true });
});

test('scanCollection reports DRIFTED when source_hash mismatches', () => {
  const dir = makeTempContentDir();
  writeFileSync(join(dir, 'about.md'), '---\ntitle: About\n---\nNew body\n');
  writeFileSync(
    join(dir, 'about.pl.md'),
    '---\ntitle: O mnie\nlang: pl\nsource_hash: stale1234567\n---\nTresc\n',
  );
  const result = scanCollection(dir);
  assert.equal(result.drifted.length, 1);
  assert.equal(result.drifted[0].file, join(dir, 'about.md'));
  assert.equal(result.drifted[0].plHash, 'stale1234567');
  assert.notEqual(result.drifted[0].enHash, 'stale1234567');
  rmSync(dir, { recursive: true, force: true });
});

test('scanCollection ignores .pl.md files as primary entries', () => {
  const dir = makeTempContentDir();
  writeFileSync(join(dir, 'about.md'), '---\ntitle: About\n---\nBody\n');
  const enHash = computeHash('---\ntitle: About\n---\nBody\n');
  writeFileSync(join(dir, 'about.pl.md'), `---\ntitle: O mnie\nlang: pl\nsource_hash: ${enHash}\n---\n\n`);
  const result = scanCollection(dir);
  // about.pl.md should NOT itself be reported as missing/drifted/upToDate
  const allFiles = [
    ...result.missing,
    ...result.drifted.map((d) => d.file),
    ...result.upToDate,
  ];
  assert.equal(allFiles.filter((f) => f.endsWith('.pl.md')).length, 0);
  rmSync(dir, { recursive: true, force: true });
});

test('compareDictionaries reports missing keys in PL', () => {
  const en = { nav: { about: 'About', work: 'Work' }, footer: { rights: 'All rights' } };
  const pl = { nav: { about: 'O mnie' }, footer: { rights: 'Wszystkie prawa' } };
  const result = compareDictionaries(en, pl);
  assert.deepEqual(result.missingInPl, ['nav.work']);
  assert.deepEqual(result.driftedInPl, []);
});

test('compareDictionaries reports empty PL values as drifted', () => {
  const en = { nav: { about: 'About' } };
  const pl = { nav: { about: '' } };
  const result = compareDictionaries(en, pl);
  // Empty string in PL means "not yet translated" — counts as drift, not missing
  assert.deepEqual(result.driftedInPl, ['nav.about']);
  assert.deepEqual(result.missingInPl, []);
});

test('compareDictionaries handles nested objects correctly', () => {
  const en = { a: { b: { c: 'deep' } } };
  const pl = { a: { b: {} } };
  const result = compareDictionaries(en, pl);
  assert.deepEqual(result.missingInPl, ['a.b.c']);
});
```

- [ ] **Step 2: Run the tests — they should fail because the lib file doesn't exist yet**

```bash
node --test scripts/translate-check.test.mjs
```
Expected: failures with `Cannot find module './translate-check.lib.mjs'` or similar.

- [ ] **Step 3: Commit the failing tests**

```bash
git add scripts/translate-check.test.mjs
git commit -m "test(i18n): add tests for translate-check drift script"
```

### Task 8: Implement the drift script library

**Files:**
- Create: `scripts/translate-check.lib.mjs`

The library exposes the testable functions. The CLI in Task 9 imports from this lib.

- [ ] **Step 1: Write `scripts/translate-check.lib.mjs`**

```javascript
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function normalize(content) {
  // Split frontmatter from body; sort frontmatter keys; strip trailing whitespace; collapse final newlines.
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  let frontmatterNorm = '';
  let body = content;
  if (fmMatch) {
    const lines = fmMatch[1].split('\n').filter((l) => l.trim() !== '');
    const sorted = [...lines].sort();
    frontmatterNorm = sorted.join('\n');
    body = fmMatch[2];
  }
  const bodyNorm = body
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '\n');
  return `${frontmatterNorm}\n---\n${bodyNorm}`;
}

export function computeHash(content) {
  return createHash('sha256').update(normalize(content)).digest('hex').slice(0, 12);
}

function readPlFrontmatterHash(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const match = fmMatch[1].match(/^source_hash:\s*([a-f0-9]+)\s*$/m);
  return match ? match[1] : null;
}

export function scanCollection(dir) {
  const result = { missing: [], drifted: [], upToDate: [] };
  if (!existsSync(dir)) return result;
  const entries = readdirSync(dir);
  for (const name of entries) {
    if (!name.endsWith('.md')) continue;
    if (name.endsWith('.pl.md')) continue;
    const enPath = join(dir, name);
    if (!statSync(enPath).isFile()) continue;
    const plName = name.replace(/\.md$/, '.pl.md');
    const plPath = join(dir, plName);
    const enContent = readFileSync(enPath, 'utf8');
    const enHash = computeHash(enContent);
    if (!existsSync(plPath)) {
      result.missing.push(enPath);
      continue;
    }
    const plContent = readFileSync(plPath, 'utf8');
    const plHash = readPlFrontmatterHash(plContent);
    if (plHash === enHash) {
      result.upToDate.push(enPath);
    } else {
      result.drifted.push({ file: enPath, enHash, plHash: plHash || '(missing)' });
    }
  }
  return result;
}

function* flatten(obj, prefix = '') {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      yield* flatten(value, path);
    } else {
      yield [path, value];
    }
  }
}

export function compareDictionaries(en, pl) {
  const result = { missingInPl: [], driftedInPl: [] };
  const plMap = new Map([...flatten(pl)]);
  for (const [key, enValue] of flatten(en)) {
    if (!plMap.has(key)) {
      result.missingInPl.push(key);
      continue;
    }
    const plValue = plMap.get(key);
    if (typeof plValue === 'string' && plValue === '' && typeof enValue === 'string' && enValue !== '') {
      result.driftedInPl.push(key);
    }
  }
  return result;
}
```

- [ ] **Step 2: Run the tests**

```bash
node --test scripts/translate-check.test.mjs
```
Expected: all 11 tests pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/translate-check.lib.mjs
git commit -m "feat(i18n): implement drift detection lib (computeHash, scanCollection, compareDictionaries)"
```

### Task 9: Implement the drift script CLI

**Files:**
- Create: `scripts/translate-check.mjs`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Write `scripts/translate-check.mjs`**

```javascript
#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { scanCollection, compareDictionaries } from './translate-check.lib.mjs';

const repoRoot = process.cwd();
const collections = [
  join(repoRoot, 'src/content/pages'),
  join(repoRoot, 'src/content/companies'),
  join(repoRoot, 'src/content/projects'),
];

const allMissing = [];
const allDrifted = [];
const allUpToDate = [];

for (const dir of collections) {
  const result = scanCollection(dir);
  allMissing.push(...result.missing);
  allDrifted.push(...result.drifted);
  allUpToDate.push(...result.upToDate);
}

const en = JSON.parse(readFileSync(join(repoRoot, 'src/i18n/en.json'), 'utf8'));
const pl = JSON.parse(readFileSync(join(repoRoot, 'src/i18n/pl.json'), 'utf8'));
const dictDiff = compareDictionaries(en, pl);

function rel(p) {
  return relative(repoRoot, p);
}

console.log('Polish translation drift report');
console.log('================================\n');

console.log(`MISSING (no Polish version yet): ${allMissing.length}`);
for (const f of allMissing) console.log(`  ${rel(f)}`);
console.log();

console.log(`DRIFTED (source changed since last translation): ${allDrifted.length}`);
for (const d of allDrifted) {
  console.log(`  ${rel(d.file)}`);
  console.log(`    PL hash: ${d.plHash}`);
  console.log(`    EN hash: ${d.enHash}`);
}
console.log();

console.log('UI DICTIONARY:');
console.log(`  Missing in pl.json: ${dictDiff.missingInPl.length} keys`);
for (const k of dictDiff.missingInPl) console.log(`    ${k}`);
console.log(`  Empty/drifted in pl.json: ${dictDiff.driftedInPl.length} keys`);
for (const k of dictDiff.driftedInPl) console.log(`    ${k}`);
console.log();

console.log(`UP TO DATE: ${allUpToDate.length}`);
for (const f of allUpToDate) console.log(`  ${rel(f)}`);
console.log();

console.log(
  `Summary: ${allMissing.length} missing, ${allDrifted.length} drifted, ${allUpToDate.length} up to date, ` +
    `${dictDiff.missingInPl.length + dictDiff.driftedInPl.length} dictionary changes`,
);

process.exit(0);
```

- [ ] **Step 2: Add npm scripts to `package.json`**

In the `scripts` block of `package.json`, add (preserving existing scripts):

```json
"translate:check": "node scripts/translate-check.mjs",
"translate:check:test": "node --test scripts/translate-check.test.mjs"
```

So the resulting block looks like:

```json
"scripts": {
  "dev": "astro dev",
  "generate-covers": "node --import tsx scripts/generate-covers.ts",
  "prebuild": "npm run generate-covers",
  "build": "astro build",
  "postbuild": "node --import tsx scripts/indexnow.ts",
  "preview": "astro preview",
  "astro": "astro",
  "translate:check": "node scripts/translate-check.mjs",
  "translate:check:test": "node --test scripts/translate-check.test.mjs"
}
```

- [ ] **Step 3: Run the script against the current state**

```bash
npm run translate:check
```
Expected: prints a report showing every EN file in `pages`, `companies`, `projects` as MISSING (since no `.pl.md` siblings exist yet), and the dictionary section showing all PL values as drifted (since `pl.json` is empty strings). Summary line shows non-zero counts. Exit code 0.

- [ ] **Step 4: Run the test suite via npm**

```bash
npm run translate:check:test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/translate-check.mjs package.json
git commit -m "feat(i18n): add translate:check CLI and npm scripts"
```

---

## Phase 4: Locale-Aware Shared Components

### Task 10: Make `Base.astro` locale-aware

**Files:**
- Modify: `src/layouts/Base.astro`

Add `locale` and `alternateUrl` props. Set the `<html lang>` attribute. Forward them to Header, Footer, and SEO.

- [ ] **Step 1: Replace the contents of `src/layouts/Base.astro`**

```astro
---
import { ClientRouter } from "astro:transitions";
import "@/styles/global.css";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import SEO from "@/components/SEO.astro";
import FontPreload from "@/components/FontPreload.astro";
import ThemeScript from "@/components/ThemeScript.astro";
import CookieConsent from "@/components/CookieConsent.astro";
import AnimationObserver from "@/components/AnimationObserver.astro";
import { t } from "@/i18n/t";
import type { Locale } from "@/i18n/locale";

interface Props {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  robots?: string;
  author?: string;
  keywords?: string;
  fullWidth?: boolean;
  locale?: Locale;
  alternateUrl?: string;
}

const {
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  robots,
  author,
  keywords,
  fullWidth = false,
  locale = 'en',
  alternateUrl,
} = Astro.props;
---

<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <FontPreload />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <SEO
      title={title}
      description={description}
      canonical={canonical}
      ogImage={ogImage}
      ogType={ogType}
      robots={robots}
      author={author}
      keywords={keywords}
      locale={locale}
      alternateUrl={alternateUrl}
    />
    <ClientRouter />
    <ThemeScript />
    <slot name="head" />
  </head>
  <body class="min-h-screen flex flex-col antialiased">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium">
      {t('base.skip_to_content', locale)}
    </a>
    <Header locale={locale} alternateUrl={alternateUrl} />
    <main id="main-content" class:list={["flex-1", fullWidth ? "w-full" : ""]}>
      <slot />
    </main>
    <Footer locale={locale} />
    <CookieConsent />
    <AnimationObserver />
  </body>
</html>
```

- [ ] **Step 2: Verify the build still works**

```bash
npm run build
```
Expected: build succeeds. Existing EN pages render unchanged because `locale` defaults to `'en'`. Header/Footer/SEO will fail to compile if they don't accept the new props yet — that's expected and gets fixed in the next tasks. If the build fails, proceed anyway and let the next tasks fix it.

If the build *does* fail at this point with prop-related errors on Header/Footer/SEO, that's fine — Tasks 11/12/13 will fix it. Skip to commit.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat(i18n): make Base layout locale-aware"
```

### Task 11: Make `Header.astro` locale-aware

**Files:**
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Replace the contents of `src/components/Header.astro`**

```astro
---
import ThemeToggle from './ThemeToggle.astro';
import LanguageSwitcher from './LanguageSwitcher.astro';
import { Image } from 'astro:assets';
import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';
import routes from '@/i18n/routes.json';
import { t } from '@/i18n/t';
import type { Locale } from '@/i18n/locale';

interface Props {
  locale?: Locale;
  alternateUrl?: string;
}

const { locale = 'en', alternateUrl } = Astro.props;

const prefix = locale === 'pl' ? '/pl' : '';
const r = routes[locale];

const navItems = [
  { href: `${prefix}/${r.work}`,    label: t('nav.work', locale) },
  { href: `${prefix}/${r.projects}`, label: t('nav.projects', locale) },
  { href: `${prefix}/blog`,         label: t('nav.blog', locale) },
  { href: `${prefix}/publications`, label: t('nav.publications', locale) },
  { href: `${prefix}/${r.about}`,   label: t('nav.about', locale) },
  { href: `${prefix}/${r.cv}`,      label: t('nav.cv', locale) },
  { href: `${prefix}/${r.contact}`, label: t('nav.contact', locale) },
];

const homeHref = locale === 'pl' ? '/pl/' : '/';
const currentPath = Astro.url.pathname;
---

<header
  class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div class="container max-w-5xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
    <a href={homeHref} title={t('header.home_title', locale)} class="hover:opacity-80 transition-opacity shrink-0">
      <Image
        src={logoLight}
        alt="Blazej Mrozinski"
        height={40}
        width={Math.round(logoLight.width * (40 / logoLight.height))}
        class="block dark:hidden"
      />
      <Image
        src={logoDark}
        alt="Blazej Mrozinski"
        height={40}
        width={Math.round(logoDark.width * (40 / logoDark.height))}
        class="hidden dark:block"
      />
    </a>

    <nav class="hidden md:flex items-center gap-6 text-sm" aria-label={t('header.main_nav', locale)}>
      {navItems.map((item) => {
        const isActive = item.href === '/'
          ? currentPath === '/'
          : currentPath.startsWith(item.href);
        return (
          <a
            href={item.href}
            title={item.label}
            class:list={[
              'transition-colors',
              isActive
                ? 'text-foreground font-medium'
                : 'text-foreground/60 hover:text-foreground/80',
            ]}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </a>
        );
      })}
    </nav>

    <div class="hidden md:flex items-center space-x-2">
      <LanguageSwitcher currentLocale={locale} alternateUrl={alternateUrl} />
      <ThemeToggle />
    </div>

    <div class="flex md:hidden items-center space-x-2">
      <LanguageSwitcher currentLocale={locale} alternateUrl={alternateUrl} />
      <ThemeToggle />
      <button
        id="mobile-menu-button"
        class="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
        aria-expanded="false"
        aria-label={t('header.toggle_menu', locale)}
      >
        <div class="w-6 h-6 relative flex flex-col justify-center items-center">
          <span id="hamburger-top" class="block w-5 h-0.5 bg-current transform transition-all duration-300 absolute -translate-y-1.5"></span>
          <span id="hamburger-middle" class="block w-5 h-0.5 bg-current transform transition-all duration-300"></span>
          <span id="hamburger-bottom" class="block w-5 h-0.5 bg-current transform transition-all duration-300 absolute translate-y-1.5"></span>
        </div>
      </button>
    </div>
  </div>

  <nav id="mobile-menu" class="hidden md:hidden border-t bg-background" aria-label={t('header.mobile_nav', locale)}>
    <div class="container max-w-5xl mx-auto px-4 py-4 space-y-1">
      {navItems.map((item) => {
        const isActive = item.href === '/'
          ? currentPath === '/'
          : currentPath.startsWith(item.href);
        return (
          <a
            href={item.href}
            title={item.label}
            class:list={[
              'block px-3 py-2 rounded-md text-base font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground',
            ]}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </a>
        );
      })}
      <button
        id="mobile-menu-close"
        class="block w-full text-center px-3 py-2 mt-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border"
      >
        {t('header.close_menu', locale)}
      </button>
    </div>
  </nav>
</header>

<script>
  function initMobileMenu() {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburgerTop = document.getElementById('hamburger-top');
    const hamburgerMiddle = document.getElementById('hamburger-middle');
    const hamburgerBottom = document.getElementById('hamburger-bottom');

    function toggleHamburger(isOpen: boolean) {
      if (isOpen) {
        hamburgerTop?.classList.add('rotate-45', 'translate-y-0');
        hamburgerTop?.classList.remove('-translate-y-1.5');
        hamburgerMiddle?.classList.add('opacity-0', 'scale-0');
        hamburgerBottom?.classList.add('-rotate-45', 'translate-y-0');
        hamburgerBottom?.classList.remove('translate-y-1.5');
      } else {
        hamburgerTop?.classList.remove('rotate-45', 'translate-y-0');
        hamburgerTop?.classList.add('-translate-y-1.5');
        hamburgerMiddle?.classList.remove('opacity-0', 'scale-0');
        hamburgerBottom?.classList.remove('-rotate-45', 'translate-y-0');
        hamburgerBottom?.classList.add('translate-y-1.5');
      }
    }

    menuButton?.addEventListener('click', () => {
      const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
      mobileMenu?.classList.toggle('hidden');
      toggleHamburger(!isExpanded);
      menuButton.setAttribute('aria-expanded', String(!isExpanded));
    });

    const mobileMenuLinks = mobileMenu?.querySelectorAll('a');
    mobileMenuLinks?.forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu?.classList.add('hidden');
        toggleHamburger(false);
        menuButton?.setAttribute('aria-expanded', 'false');
      });
    });

    const closeButton = document.getElementById('mobile-menu-close');
    closeButton?.addEventListener('click', () => {
      mobileMenu?.classList.add('hidden');
      toggleHamburger(false);
      menuButton?.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
        mobileMenu?.classList.add('hidden');
        toggleHamburger(false);
        menuButton?.setAttribute('aria-expanded', 'false');
        menuButton?.focus();
      }
    });
  }

  initMobileMenu();
  document.addEventListener('astro:after-swap', initMobileMenu);
</script>
```

Note: `LanguageSwitcher` is imported but doesn't exist yet — Task 14 creates it. Build will fail until then. Continue.

- [ ] **Step 2: Commit (deferred verification)**

```bash
git add src/components/Header.astro
git commit -m "feat(i18n): make Header locale-aware (translated nav + lang switcher)"
```

### Task 12: Make `Footer.astro` locale-aware

**Files:**
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Replace `src/components/Footer.astro`**

```astro
---
import { Image } from 'astro:assets';
import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';
import { getLatestVersion } from '@/lib/changelog';
import routes from '@/i18n/routes.json';
import { t } from '@/i18n/t';
import type { Locale } from '@/i18n/locale';

interface Props {
  locale?: Locale;
}

const { locale = 'en' } = Astro.props;
const latestVersion = getLatestVersion();

const prefix = locale === 'pl' ? '/pl' : '';
const r = routes[locale];

const footerLinks = {
  pages: [
    { href: `${prefix}/${r.work}`,    label: t('nav.work', locale) },
    { href: `${prefix}/${r.projects}`, label: t('nav.projects', locale) },
    { href: `${prefix}/blog`,         label: t('nav.blog', locale) },
    { href: `${prefix}/publications`, label: t('nav.publications', locale) },
    { href: '/glossary',              label: 'Glossary' },
    { href: `${prefix}/${r.about}`,   label: t('nav.about', locale) },
    { href: `${prefix}/${r.cv}`,      label: t('nav.cv', locale) },
    { href: '/changelog',             label: 'Changelog' },
  ],
  connect: [
    { href: 'https://linkedin.com/in/blazejmrozinski', label: 'LinkedIn' },
    { href: 'https://github.com/b1azk0', label: 'GitHub' },
    { href: 'https://scholar.google.com/citations?user=blazejmrozinski', label: 'Google Scholar' },
    { href: 'https://orcid.org/0000-0002-5423-2291', label: 'ORCID' },
  ],
};

const homeHref = locale === 'pl' ? '/pl/' : '/';
const contactHref = `${prefix}/${r.contact}`;
---

<footer class="border-t bg-background">
  <div class="container max-w-5xl mx-auto px-4 sm:px-6 py-12">
    <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
      <div class="col-span-2 md:col-span-1">
        <a href={homeHref} title={t('header.home_title', locale)} class="inline-block hover:opacity-80 transition-opacity">
          <Image
            src={logoLight}
            alt="Blazej Mrozinski"
            height={80}
            width={Math.round(logoLight.width * (80 / logoLight.height))}
            class="block dark:hidden"
          />
          <Image
            src={logoDark}
            alt="Blazej Mrozinski"
            height={80}
            width={Math.round(logoDark.width * (80 / logoDark.height))}
            class="hidden dark:block"
          />
        </a>
        <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
          {t('footer.tagline', locale)}
        </p>
        <a
          href="/changelog"
          class="inline-block mt-2 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          v{latestVersion} · <span class="underline underline-offset-2">{t('footer.view_changelog', locale)}</span>
        </a>
      </div>

      <nav aria-label="Footer navigation">
        <p class="font-semibold mb-4 text-sm">{t('footer.section_pages', locale)}</p>
        <ul class="space-y-2">
          {footerLinks.pages.map((link) => (
            <li>
              <a
                href={link.href}
                title={link.label}
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div>
        <p class="font-semibold mb-4 text-sm">{t('footer.section_connect', locale)}</p>
        <ul class="space-y-2">
          {footerLinks.connect.map((link) => (
            <li>
              <a
                href={link.href}
                title={link.label}
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                {link.label}
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p class="font-semibold mb-4 text-sm">{t('footer.section_get_in_touch', locale)}</p>
        <p class="text-sm text-muted-foreground">
          {t('footer.interested', locale)}
        </p>
        <a
          href={contactHref}
          title={t('footer.contact_me', locale)}
          class="inline-flex items-center gap-2 mt-3 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {t('footer.contact_me', locale)}
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>

    <div class="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} Blazej Mrozinski. {t('footer.rights', locale)}.</p>
    </div>
  </div>
</footer>
```

Note: `Glossary` and `Changelog` footer links remain hardcoded English because those sections are out of scope and have no PL equivalent.

- [ ] **Step 2: Commit (deferred verification)**

```bash
git add src/components/Footer.astro
git commit -m "feat(i18n): make Footer locale-aware"
```

### Task 13: Make `SEO.astro` emit hreflang and locale-aware metadata

**Files:**
- Modify: `src/components/SEO.astro`

- [ ] **Step 1: Replace `src/components/SEO.astro`**

```astro
---
import type { Locale } from '@/i18n/locale';

interface Props {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  robots?: string;
  author?: string;
  keywords?: string;
  locale?: Locale;
  alternateUrl?: string;
}

const siteUrl = Astro.site ?? new URL('https://www.blazejmrozinski.com');

const {
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  robots = 'index, follow',
  author = 'Blazej Mrozinski',
  keywords,
  locale = 'en',
  alternateUrl,
} = Astro.props;

const fullTitle = `${title} — Blazej Mrozinski`;
const canonicalUrl = canonical ?? new URL(Astro.url.pathname, siteUrl).toString();
const socialImageURL = new URL(ogImage || '/og-default.png', siteUrl).toString();

const ogLocale = locale === 'pl' ? 'pl_PL' : 'en_US';
const ogLocaleAlternate = locale === 'pl' ? 'en_US' : 'pl_PL';

const enUrl = locale === 'en'
  ? canonicalUrl
  : (alternateUrl ? new URL(alternateUrl, siteUrl).toString() : null);
const plUrl = locale === 'pl'
  ? canonicalUrl
  : (alternateUrl ? new URL(alternateUrl, siteUrl).toString() : null);
const xDefaultUrl = enUrl ?? canonicalUrl;
---

<title>{fullTitle}</title>
<meta name="title" content={fullTitle} />
<meta name="description" content={description} />
<meta name="robots" content={robots} />
<meta name="author" content={author} />
<meta name="publisher" content="Blazej Mrozinski" />
{keywords && <meta name="keywords" content={keywords} />}

<link rel="canonical" href={canonicalUrl} />

{enUrl && <link rel="alternate" hreflang="en" href={enUrl} />}
{plUrl && <link rel="alternate" hreflang="pl" href={plUrl} />}
<link rel="alternate" hreflang="x-default" href={xDefaultUrl} />

<!-- Open Graph -->
<meta property="og:type" content={ogType} />
<meta property="og:url" content={canonicalUrl} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image" content={socialImageURL} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Blazej Mrozinski" />
<meta property="og:locale" content={ogLocale} />
{alternateUrl && <meta property="og:locale:alternate" content={ogLocaleAlternate} />}

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content={canonicalUrl} />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={socialImageURL} />

<!-- Sitemap & RSS -->
<link rel="sitemap" href="/sitemap-index.xml" />
<link rel="alternate" type="application/rss+xml" title="Blazej Mrozinski Blog" href="/rss.xml" />
```

Three rules baked in:
1. **Self-canonical** — every page is canonical to itself, regardless of locale.
2. **Bidirectional hreflang only when an alternate exists.** Pages without a translated equivalent (blog posts) emit `hreflang="en"` (themselves) and `hreflang="x-default"` (themselves) — no PL alternate.
3. **`x-default` always points to the EN version** when there is one, otherwise to the current page (which is always EN for untranslated pages).

- [ ] **Step 2: Commit (deferred verification)**

```bash
git add src/components/SEO.astro
git commit -m "feat(i18n): emit hreflang en/pl/x-default and og:locale in SEO"
```

### Task 14: Create the LanguageSwitcher component

**Files:**
- Create: `src/components/LanguageSwitcher.astro`

- [ ] **Step 1: Write `src/components/LanguageSwitcher.astro`**

```astro
---
import { t } from '@/i18n/t';
import type { Locale } from '@/i18n/locale';

interface Props {
  currentLocale: Locale;
  alternateUrl?: string;
}

const { currentLocale, alternateUrl } = Astro.props;

function deriveAlternate(): string {
  if (alternateUrl) return alternateUrl;
  return currentLocale === 'en' ? '/pl/' : '/';
}

const targetHref = deriveAlternate();
const isShowingEn = currentLocale === 'pl';
const labelKey = isShowingEn ? 'lang_switcher.switch_to_en' : 'lang_switcher.switch_to_pl';
const buttonText = isShowingEn ? 'EN' : 'PL';
const buttonLang = isShowingEn ? 'en' : 'pl';
const buttonHreflang = isShowingEn ? 'en' : 'pl';
---

<a
  href={targetHref}
  hreflang={buttonHreflang}
  lang={buttonLang}
  aria-label={t(labelKey, currentLocale)}
  title={t(labelKey, currentLocale)}
  class="inline-flex items-center justify-center rounded-md px-2.5 h-8 text-xs font-medium border text-foreground/70 hover:text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
>
  {buttonText}
</a>
```

- [ ] **Step 2: Run a build to check that all locale-aware components compile together**

```bash
npm run build
```
Expected: build succeeds. The English site renders unchanged because every refactored component defaults to `locale='en'`. If the build fails:
- Re-read the error. Common causes: typo in a `t()` key, missing import, JSON parse error.
- The English EN-only build doesn't yet hit any `/pl/` route — those don't exist until Phase 6.

- [ ] **Step 3: Run the dev server and visually confirm the EN site is unchanged**

```bash
npm run dev
```
Open `http://localhost:4321/` in a browser. Check:
- Header renders, all nav links work
- Footer renders, all links work
- About page loads
- Work page loads
- An individual company page loads (e.g. `/work/gyfted`)
- A blog post loads
- The new `EN/PL` switcher appears in the header. On any page click it — should navigate to `/pl/` (which 404s for now since `/pl/` routes don't exist yet — that's expected).

Stop the dev server (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add src/components/LanguageSwitcher.astro
git commit -m "feat(i18n): add LanguageSwitcher component with smart fallback"
```

---

## Phase 5: Sitemap Updates

### Task 15: Update `sitemap-pages.xml.ts` with hreflang annotations

**Files:**
- Modify: `src/pages/sitemap-pages.xml.ts`

- [ ] **Step 1: Replace `src/pages/sitemap-pages.xml.ts`**

```typescript
import type { APIRoute } from 'astro';
import routes from '@/i18n/routes.json';

const site = 'https://www.blazejmrozinski.com';

interface PageSpec {
  enLoc: string;
  plLoc: string | null;
  changefreq: string;
  priority: string;
}

const pages: PageSpec[] = [
  { enLoc: '/',                   plLoc: '/pl/',                   changefreq: 'weekly',  priority: '1.0' },
  { enLoc: `/${routes.en.about}/`,    plLoc: `/pl/${routes.pl.about}/`,    changefreq: 'monthly', priority: '0.8' },
  { enLoc: '/blog/',              plLoc: null,                     changefreq: 'weekly',  priority: '0.9' },
  { enLoc: `/${routes.en.contact}/`,  plLoc: `/pl/${routes.pl.contact}/`,  changefreq: 'yearly',  priority: '0.6' },
  { enLoc: `/${routes.en.cv}/`,       plLoc: `/pl/${routes.pl.cv}/`,       changefreq: 'monthly', priority: '0.5' },
  { enLoc: '/publications/',      plLoc: null,                     changefreq: 'monthly', priority: '0.6' },
];

function urlEntry(loc: string, alternates: { en?: string; pl?: string }): string {
  const links: string[] = [];
  if (alternates.en) {
    links.push(`    <xhtml:link rel="alternate" hreflang="en" href="${site}${alternates.en}"/>`);
  }
  if (alternates.pl) {
    links.push(`    <xhtml:link rel="alternate" hreflang="pl" href="${site}${alternates.pl}"/>`);
  }
  if (alternates.en) {
    links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${alternates.en}"/>`);
  }
  return `  <url>
    <loc>${site}${loc}</loc>
${links.join('\n')}
  </url>`;
}

export const GET: APIRoute = () => {
  const entries: string[] = [];
  for (const p of pages) {
    const alternates = { en: p.enLoc, pl: p.plLoc ?? undefined };
    entries.push(urlEntry(p.enLoc, alternates));
    if (p.plLoc) {
      entries.push(urlEntry(p.plLoc, alternates));
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
```

- [ ] **Step 2: Build and inspect the sitemap**

```bash
npm run build
```
Expected: clean build.

```bash
cat dist/sitemap-pages.xml
```
Expected: each translated page (`/`, `/about/`, `/contact/`, `/cv/`) appears twice — once as the EN URL and once as the PL URL — with cross-referencing `<xhtml:link>` annotations. Blog and publications appear once (EN only, no hreflang annotations).

- [ ] **Step 3: Commit**

```bash
git add src/pages/sitemap-pages.xml.ts
git commit -m "feat(i18n): emit hreflang annotations in sitemap-pages"
```

### Task 16: Update `sitemap-work.xml.ts` with hreflang annotations

**Files:**
- Modify: `src/pages/sitemap-work.xml.ts`

This file covers BOTH companies (`/work/*`) AND projects (`/projects/*`).

- [ ] **Step 1: Replace `src/pages/sitemap-work.xml.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import routes from '@/i18n/routes.json';

const site = 'https://www.blazejmrozinski.com';

interface UrlSpec {
  enLoc: string;
  plLoc: string | null;
  changefreq: string;
  priority: string;
}

function urlEntry(loc: string, alternates: { en?: string; pl?: string }): string {
  const links: string[] = [];
  if (alternates.en) {
    links.push(`    <xhtml:link rel="alternate" hreflang="en" href="${site}${alternates.en}"/>`);
  }
  if (alternates.pl) {
    links.push(`    <xhtml:link rel="alternate" hreflang="pl" href="${site}${alternates.pl}"/>`);
  }
  if (alternates.en) {
    links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${alternates.en}"/>`);
  }
  return `  <url>
    <loc>${site}${loc}</loc>
${links.join('\n')}
  </url>`;
}

export const GET: APIRoute = async () => {
  const allCompanies = await getCollection('companies');
  const allProjects = await getCollection('projects');

  // Filter to EN entries only (skip .pl.md siblings, which load with lang === 'pl')
  const companiesEn = allCompanies.filter((c) => c.data.lang === 'en');
  const projectsEn = allProjects.filter((p) => p.data.lang === 'en');

  // EN ids that have a PL sibling
  const companiesWithPl = new Set(
    allCompanies.filter((c) => c.data.lang === 'pl').map((c) => c.id.replace(/\.pl$/, '')),
  );
  const projectsWithPl = new Set(
    allProjects.filter((p) => p.data.lang === 'pl').map((p) => p.id.replace(/\.pl$/, '')),
  );

  const urls: UrlSpec[] = [
    { enLoc: `/${routes.en.work}/`,    plLoc: `/pl/${routes.pl.work}/`,    changefreq: 'monthly', priority: '0.8' },
    { enLoc: `/${routes.en.projects}/`, plLoc: `/pl/${routes.pl.projects}/`, changefreq: 'monthly', priority: '0.7' },
    ...companiesEn.map<UrlSpec>((c) => ({
      enLoc: `/${routes.en.work}/${c.id}/`,
      plLoc: companiesWithPl.has(c.id) ? `/pl/${routes.pl.work}/${c.id}/` : null,
      changefreq: 'monthly',
      priority: '0.7',
    })),
    ...projectsEn.map<UrlSpec>((p) => ({
      enLoc: `/${routes.en.projects}/${p.id}/`,
      plLoc: projectsWithPl.has(p.id) ? `/pl/${routes.pl.projects}/${p.id}/` : null,
      changefreq: 'monthly',
      priority: '0.6',
    })),
  ];

  const entries: string[] = [];
  for (const u of urls) {
    const alternates = { en: u.enLoc, pl: u.plLoc ?? undefined };
    entries.push(urlEntry(u.enLoc, alternates));
    if (u.plLoc) {
      entries.push(urlEntry(u.plLoc, alternates));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
```

Note: PL siblings won't exist yet at this point in the plan, so the build will produce a sitemap with no PL entries. That's correct — the sitemap tracks reality. After Phase 7 (creating PL skeleton files), re-building this sitemap will include them automatically.

- [ ] **Step 2: Build and verify the sitemap parses**

```bash
npm run build
cat dist/sitemap-work.xml
```
Expected: companies and projects appear with their EN URLs and no PL annotations (since no PL siblings exist yet).

- [ ] **Step 3: Commit**

```bash
git add src/pages/sitemap-work.xml.ts
git commit -m "feat(i18n): emit hreflang annotations in sitemap-work"
```

---

## Phase 6: Polish Content Skeletons

These are placeholder `.pl.md` files with frontmatter only. Their bodies are empty until Claude fills them in a follow-up session. Creating them now unblocks the routing in Phase 7 (dynamic routes need the entries to exist) and makes the drift script's "missing" count go to zero.

The `source_hash` field is intentionally OMITTED (not set to a fake value). This means the drift script will report these files as DRIFTED, which is the correct semantic state: "PL exists but is not synced with EN." Claude's translation session will set `source_hash` when it actually translates the body.

### Task 17: Create empty PL siblings for `pages` collection

**Files:**
- Create: `src/content/pages/about.pl.md`
- Create: `src/content/pages/cv.pl.md`
- Create: `src/content/pages/work.pl.md`

- [ ] **Step 1: Write `src/content/pages/about.pl.md`**

```markdown
---
title: O mnie
description: Blazej Mrozinski — psycholog, psychometra, product builder.
lang: pl
slug: o-mnie
---

(Polish translation pending — will be filled by Claude in the translation session.)
```

- [ ] **Step 2: Write `src/content/pages/cv.pl.md`**

```markdown
---
title: CV
description: Curriculum Vitae — Blazej Mrozinski.
lang: pl
slug: cv
---

(Polish translation pending — will be filled by Claude in the translation session.)
```

- [ ] **Step 3: Write `src/content/pages/work.pl.md`**

```markdown
---
title: Praca
description: Czym zajmuje sie Blazej Mrozinski.
lang: pl
slug: praca
---

(Polish translation pending — will be filled by Claude in the translation session.)
```

- [ ] **Step 4: Verify the schema accepts them**

```bash
npx astro check
```
Expected: `0 errors`.

- [ ] **Step 5: Commit**

```bash
git add src/content/pages/about.pl.md src/content/pages/cv.pl.md src/content/pages/work.pl.md
git commit -m "feat(i18n): scaffold empty PL siblings for pages collection"
```

### Task 18: Create empty PL siblings for `companies` collection

**Files:**
- Create: `src/content/companies/gyfted.pl.md`
- Create: `src/content/companies/nerds-family.pl.md`
- Create: `src/content/companies/digital-savages.pl.md`
- Create: `src/content/companies/swps-university.pl.md`

The `companies` schema requires `name`, `role`, `description`, `domain`. We use placeholder values that match the EN file's required fields; they'll be replaced during translation.

- [ ] **Step 1: For each EN company file, read its frontmatter, then write a `.pl.md` sibling with the same required fields and `lang: pl`**

`src/content/companies/gyfted.pl.md`:

```markdown
---
name: Gyfted
role: Wspolzalozyciel i CTO
description: Platforma psychometryczna dla rekrutacji i rozwoju.
domain: psychometria
order: 1
lang: pl
---

(Polish translation pending.)
```

`src/content/companies/nerds-family.pl.md`:

```markdown
---
name: Nerds Family
role: Wspolzalozyciel
description: Studio produktowe dla AI i workflow automation.
domain: ai-automation
order: 2
lang: pl
---

(Polish translation pending.)
```

`src/content/companies/digital-savages.pl.md`:

```markdown
---
name: Digital Savages LLC
role: Zalozyciel
description: Konsulting w zakresie wzrostu, SEO i AI.
domain: growth-seo
order: 3
lang: pl
---

(Polish translation pending.)
```

`src/content/companies/swps-university.pl.md`:

```markdown
---
name: SWPS Uniwersytet
role: Doktor psychologii
description: Doktorat z psychologii i badania psychometryczne.
domain: badania
order: 4
lang: pl
---

(Polish translation pending.)
```

Note on placeholder accuracy: do NOT worry about getting these placeholder strings perfect. Claude's translation session will overwrite them. The only constraint is that the schema validates — required fields present, types correct.

If any company file has additional required fields beyond `name`/`role`/`description`/`domain`/`order`, read the EN file first to check, and add them to the PL sibling with placeholder values.

- [ ] **Step 2: Verify the schema accepts them**

```bash
npx astro check
```
Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/content/companies/*.pl.md
git commit -m "feat(i18n): scaffold empty PL siblings for companies collection"
```

### Task 19: Create empty PL siblings for `projects` collection

**Files:**
- Create: `src/content/projects/contentforge.pl.md`
- Create: `src/content/projects/hse-career-quiz.pl.md`
- Create: `src/content/projects/kryptotracker.pl.md`
- Create: `src/content/projects/new-aggregator.pl.md`
- Create: `src/content/projects/prawomat.pl.md`
- Create: `src/content/projects/ssm.pl.md`

The `projects` schema requires `name`, `description`, `domain`. Some have optional case-study fields (`challenge`, `approach`, `results`, `tools`).

- [ ] **Step 1: For each EN project file, read it first to know what fields it has, then write a sibling**

For each of the six projects, create a `.pl.md` file with at minimum:

```markdown
---
name: <copy from EN file or transliterate proper noun>
description: (Polish placeholder)
domain: <copy from EN file>
order: <copy from EN file>
lang: pl
---

(Polish translation pending.)
```

Read each EN file with `cat src/content/projects/<file>.md` to confirm the schema and copy required scalar fields (especially `domain` and `order`).

For case-study projects (those with `challenge`/`approach`/`results`/`tools` in the EN frontmatter), include placeholder Polish strings for those fields too — Astro's schema is structural, so omitting them is fine since they're optional, but the translation session will fill them in.

- [ ] **Step 2: Verify the schema accepts them**

```bash
npx astro check
```
Expected: `0 errors`.

- [ ] **Step 3: Run the drift script — every PL file should now be DRIFTED (not MISSING)**

```bash
npm run translate:check
```
Expected: `MISSING: 0`. `DRIFTED: 13` (3 pages + 4 companies + 6 projects). Dictionary section still shows the empty PL keys as drifted.

- [ ] **Step 4: Commit**

```bash
git add src/content/projects/*.pl.md
git commit -m "feat(i18n): scaffold empty PL siblings for projects collection"
```

---

## Phase 7: Polish Routing

Each Polish top-level page is a thin shell that mirrors its EN counterpart. The shell loads the matching `.pl.md` from the content collection (using the `.pl` id suffix) and renders it with locale-aware components.

### Task 20: Create the Polish homepage shell

**Files:**
- Create: `src/pages/pl/index.astro`

- [ ] **Step 1: Read the EN homepage to understand its shape**

```bash
cat src/pages/index.astro
```
Note: the homepage is large and uses many components. The PL homepage will be a simpler placeholder for now — full structural mirror is unnecessary because the homepage's main content blocks (recent blog posts, publications) are EN-only sections that won't appear on the PL home.

- [ ] **Step 2: Write `src/pages/pl/index.astro` as a minimal shell**

```astro
---
import Base from '@/layouts/Base.astro';
import { Image } from 'astro:assets';
import headshot from '@/assets/headshot.png';
import { getCollection } from 'astro:content';
import CompanyCard from '@/components/CompanyCard.astro';
import ProjectCard from '@/components/ProjectCard.astro';
import { t } from '@/i18n/t';
import routes from '@/i18n/routes.json';

const companies = (await getCollection('companies'))
  .filter((c) => c.data.lang === 'pl')
  .sort((a, b) => a.data.order - b.data.order);

const projects = (await getCollection('projects'))
  .filter((p) => p.data.lang === 'pl')
  .sort((a, b) => a.data.order - b.data.order);

const caseStudies = projects.filter((p) => p.data.challenge || p.data.results);
---

<Base
  title="Blazej Mrozinski"
  description="Psycholog, psychometra, product builder."
  locale="pl"
  alternateUrl="/"
>
  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <div class="flex items-center gap-6 mb-8" data-animate>
      <Image
        src={headshot}
        alt="Blazej Mrozinski"
        width={160}
        height={160}
        class="rounded-full shrink-0 opacity-90"
      />
      <div>
        <h1 class="text-4xl font-bold tracking-tight">Blazej Mrozinski</h1>
        <p class="text-muted-foreground mt-2">Psycholog, psychometra, product builder.</p>
      </div>
    </div>

    <section class="mb-12" data-animate>
      <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('nav.work', 'pl')}</h2>
      <div class="grid gap-4">
        {companies.map((company) => (
          <CompanyCard
            name={company.data.name}
            domain={company.data.domain}
            role={company.data.role}
            slug={company.id.replace(/\.pl$/, '')}
          />
        ))}
      </div>
    </section>

    {caseStudies.length > 0 && (
      <section data-animate>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('nav.projects', 'pl')}</h2>
        <div class="grid gap-4">
          {caseStudies.map((project) => (
            <ProjectCard
              name={project.data.name}
              description={project.data.description}
              domain={project.data.domain}
              slug={project.id.replace(/\.pl$/, '')}
              isCaseStudy={true}
            />
          ))}
        </div>
      </section>
    )}
  </div>
</Base>
```

Note: `CompanyCard` and `ProjectCard` build their internal links from the `slug` prop. They currently assume the `/work/<slug>` and `/projects/<slug>` URL structure. To produce Polish URLs (`/pl/praca/<slug>`, `/pl/projekty/<slug>`), we'll need to make those cards locale-aware in Task 25. For now, this shell will produce links pointing to EN pages — that's a known issue we fix later in this phase.

- [ ] **Step 3: Build and test**

```bash
npm run build
```
Expected: build succeeds. Visit `http://localhost:4321/pl/` after `npm run dev` to see the Polish home (with placeholder content from the empty `.pl.md` siblings).

- [ ] **Step 4: Commit**

```bash
git add src/pages/pl/index.astro
git commit -m "feat(i18n): add Polish homepage shell"
```

### Task 21: Create the Polish about page shell

**Files:**
- Create: `src/pages/pl/o-mnie.astro`

- [ ] **Step 1: Write `src/pages/pl/o-mnie.astro`**

```astro
---
import Base from '@/layouts/Base.astro';
import JsonLd from '@/components/JsonLd.astro';
import HobbiesSection from '@/components/HobbiesSection.astro';
import SectionDots from '@/components/SectionDots.astro';
import { Image } from 'astro:assets';
import headshot from '@/assets/headshot.png';
import { getCollection, render } from 'astro:content';

const aboutPage = (await getCollection('pages')).find((p) => p.id === 'about.pl');
let AboutContent: any = null;
let aboutHeadings: { depth: number; slug: string; text: string }[] = [];
if (aboutPage) {
  const rendered = await render(aboutPage);
  AboutContent = rendered.Content;
  aboutHeadings = rendered.headings;
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@language': 'pl',
  name: 'Blazej Mrozinski',
  url: 'https://www.blazejmrozinski.com/pl/o-mnie',
  jobTitle: 'Psycholog, psychometra, product leader, data scientist',
  image: 'https://www.blazejmrozinski.com/headshot.png',
  sameAs: [
    'https://linkedin.com/in/blazejmrozinski',
    'https://github.com/b1azk0',
    'https://scholar.google.com/citations?user=blazejmrozinski',
    'https://orcid.org/0000-0002-5423-2291',
  ],
};
---

<Base
  title={aboutPage?.data.title ?? 'O mnie'}
  description={aboutPage?.data.description ?? ''}
  locale="pl"
  alternateUrl="/about"
>
  <JsonLd data={personJsonLd} />
  <SectionDots headings={aboutHeadings} />

  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <div class="flex items-center gap-6 mb-8" data-animate>
      <Image
        src={headshot}
        alt="Blazej Mrozinski"
        width={160}
        height={160}
        class="rounded-full shrink-0 opacity-90"
      />
      <div>
        <h1 class="text-4xl font-bold tracking-tight">{aboutPage?.data.title ?? 'O mnie'}</h1>
      </div>
    </div>

    {AboutContent && (
      <div class="prose prose-neutral dark:prose-invert max-w-none" data-animate>
        <AboutContent />
      </div>
    )}

    <HobbiesSection />
  </div>
</Base>
```

The key trick: `getCollection('pages')` returns entries with id `about` (for `about.md`) and `about.pl` (for `about.pl.md`). We find the PL entry by id `about.pl`.

- [ ] **Step 2: Build and verify**

```bash
npm run build
```
Expected: build succeeds. Visit `http://localhost:4321/pl/o-mnie` after `npm run dev`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/pl/o-mnie.astro
git commit -m "feat(i18n): add Polish about page shell"
```

### Task 22: Create the Polish CV page shell

**Files:**
- Create: `src/pages/pl/cv.astro`

- [ ] **Step 1: Write `src/pages/pl/cv.astro`**

```astro
---
import Base from '@/layouts/Base.astro';
import SectionDots from '@/components/SectionDots.astro';
import { getCollection, render } from 'astro:content';

const cvPage = (await getCollection('pages')).find((p) => p.id === 'cv.pl');
let CvContent: any = null;
let cvHeadings: { depth: number; slug: string; text: string }[] = [];
if (cvPage) {
  const rendered = await render(cvPage);
  CvContent = rendered.Content;
  cvHeadings = rendered.headings;
}
---

<Base
  title={cvPage?.data.title ?? 'CV'}
  description={cvPage?.data.description ?? ''}
  locale="pl"
  alternateUrl="/cv"
>
  <SectionDots headings={cvHeadings} />

  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <div class="flex items-center justify-between mb-8" data-animate>
      <h1 class="text-4xl font-bold tracking-tight">CV</h1>
      <a
        href="/publications/CV_BlazejMrozinski.pdf"
        class="inline-flex items-center gap-2 rounded-md text-sm font-medium h-10 px-4 border hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Pobierz PDF
      </a>
    </div>

    {CvContent && (
      <div class="prose prose-neutral dark:prose-invert max-w-none" data-animate>
        <CvContent />
      </div>
    )}
  </div>
</Base>
```

- [ ] **Step 2: Build, verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/pl/cv.astro
git commit -m "feat(i18n): add Polish CV page shell"
```

### Task 23: Create the Polish contact page shell

**Files:**
- Create: `src/pages/pl/kontakt.astro`

- [ ] **Step 1: Read the EN contact page first to understand the form structure**

```bash
cat src/pages/contact.astro
```
The contact page contains a Netlify form. The form's `name` attribute matters for Netlify form submission — we'll create a separate form name (`contact-pl`) so Netlify doesn't conflate submissions.

- [ ] **Step 2: Write `src/pages/pl/kontakt.astro`**

Mirror the EN contact page structure with Polish placeholder labels (which will be retranslated by Claude in the translation session). Use form name `contact-pl` to keep PL submissions separate. The static labels (`Imie`, `Email`, `Wiadomosc`, `Wyslij`) are placeholders.

```astro
---
import Base from '@/layouts/Base.astro';
---

<Base
  title="Kontakt"
  description="Skontaktuj sie ze mna."
  locale="pl"
  alternateUrl="/contact"
>
  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <h1 class="text-4xl font-bold tracking-tight mb-4" data-animate>Kontakt</h1>

    <p class="text-muted-foreground mb-8 max-w-xl leading-relaxed" data-animate>
      (Polish placeholder — to be filled.)
    </p>

    <div class="mb-12" data-animate>
      <a
        href="https://app.reclaim.ai/m/blazej/virtual-coffee"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors gap-2"
      >
        Umow rozmowe
      </a>
    </div>

    <form name="contact-pl" method="POST" data-netlify="true" class="space-y-4 max-w-xl">
      <input type="hidden" name="form-name" value="contact-pl" />
      <div>
        <label for="pl-name" class="block text-sm font-medium mb-2">Imie</label>
        <input type="text" id="pl-name" name="name" required class="w-full h-10 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background" />
      </div>
      <div>
        <label for="pl-email" class="block text-sm font-medium mb-2">Email</label>
        <input type="email" id="pl-email" name="email" required class="w-full h-10 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background" />
      </div>
      <div>
        <label for="pl-message" class="block text-sm font-medium mb-2">Wiadomosc</label>
        <textarea id="pl-message" name="message" required rows={5} class="w-full px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"></textarea>
      </div>
      <button type="submit" class="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        Wyslij
      </button>
    </form>
  </div>
</Base>
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/pl/kontakt.astro
git commit -m "feat(i18n): add Polish contact page shell"
```

### Task 24: Create the Polish 404 page shell

**Files:**
- Create: `src/pages/pl/404.astro`

- [ ] **Step 1: Read the EN 404 page if it exists**

```bash
ls src/pages/404.astro 2>/dev/null && cat src/pages/404.astro || echo "no EN 404 page"
```

- [ ] **Step 2: Write `src/pages/pl/404.astro`**

If the EN 404 exists, mirror it. If not, create a simple one:

```astro
---
import Base from '@/layouts/Base.astro';
import { t } from '@/i18n/t';
---

<Base
  title={t('404.title', 'pl')}
  description={t('404.body', 'pl')}
  locale="pl"
  alternateUrl="/404"
>
  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
    <h1 class="text-6xl font-bold tracking-tight mb-4">404</h1>
    <p class="text-2xl mb-2">{t('404.title', 'pl')}</p>
    <p class="text-muted-foreground mb-8">{t('404.body', 'pl')}</p>
    <a href="/pl/" class="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 border hover:bg-accent transition-colors">
      {t('404.back_home', 'pl')}
    </a>
  </div>
</Base>
```

- [ ] **Step 3: Build, verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/pl/404.astro
git commit -m "feat(i18n): add Polish 404 page"
```

### Task 25: Make `CompanyCard` and `ProjectCard` locale-aware

**Files:**
- Modify: `src/components/CompanyCard.astro`
- Modify: `src/components/ProjectCard.astro`

These cards build internal links that need to respect the current locale.

- [ ] **Step 1: Read both files**

```bash
cat src/components/CompanyCard.astro
cat src/components/ProjectCard.astro
```

- [ ] **Step 2: For each card, add a `locale` prop and use `routes.json` for the section prefix**

For `CompanyCard.astro`, find the `href` that points to `/work/${slug}` and replace it. Add to the frontmatter:

```typescript
import routes from '@/i18n/routes.json';
import type { Locale } from '@/i18n/locale';

interface Props {
  name: string;
  domain: string;
  role: string;
  slug: string;
  locale?: Locale;
}

const { name, domain, role, slug, locale = 'en' } = Astro.props;
const prefix = locale === 'pl' ? '/pl' : '';
const href = `${prefix}/${routes[locale].work}/${slug}`;
```

Then use `href` in the `<a>` element.

For `ProjectCard.astro`, do the same but with `routes[locale].projects`:

```typescript
const href = `${prefix}/${routes[locale].projects}/${slug}`;
```

- [ ] **Step 3: Update the Polish homepage to pass `locale="pl"` to the cards**

In `src/pages/pl/index.astro`, change:

```astro
<CompanyCard
  name={company.data.name}
  domain={company.data.domain}
  role={company.data.role}
  slug={company.id.replace(/\.pl$/, '')}
/>
```

to:

```astro
<CompanyCard
  name={company.data.name}
  domain={company.data.domain}
  role={company.data.role}
  slug={company.id.replace(/\.pl$/, '')}
  locale="pl"
/>
```

Same for `ProjectCard` invocations in the same file.

- [ ] **Step 4: Build and verify**

```bash
npm run build
```
Expected: clean build. EN cards still link to EN URLs (defaulting `locale='en'`), PL homepage cards now link to `/pl/praca/...` and `/pl/projekty/...`.

- [ ] **Step 5: Commit**

```bash
git add src/components/CompanyCard.astro src/components/ProjectCard.astro src/pages/pl/index.astro
git commit -m "feat(i18n): make CompanyCard and ProjectCard locale-aware"
```

### Task 26: Create the Polish work index and dynamic route

**Files:**
- Create: `src/pages/pl/praca/index.astro`
- Create: `src/pages/pl/praca/[...slug].astro`

- [ ] **Step 1: Write `src/pages/pl/praca/index.astro`**

Mirror the EN `src/pages/work/index.astro` structure but read the PL content collection entries:

```astro
---
import Base from '@/layouts/Base.astro';
import CompanyCard from '@/components/CompanyCard.astro';
import SectionDots from '@/components/SectionDots.astro';
import { getCollection, render } from 'astro:content';

const workPage = (await getCollection('pages')).find((p) => p.id === 'work.pl');
let WorkContent: any = null;
let workHeadings: { depth: number; slug: string; text: string }[] = [];
if (workPage) {
  const rendered = await render(workPage);
  WorkContent = rendered.Content;
  workHeadings = rendered.headings;
}
workHeadings = [...workHeadings.filter((h) => h.depth <= 3), { depth: 2, slug: 'companies', text: 'Firmy' }];

const companies = (await getCollection('companies'))
  .filter((c) => c.data.lang === 'pl')
  .sort((a, b) => a.data.order - b.data.order);
---

<Base
  title={workPage?.data.title ?? 'Praca'}
  description={workPage?.data.description ?? ''}
  locale="pl"
  alternateUrl="/work"
>
  <SectionDots headings={workHeadings} />

  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <h1 class="text-4xl font-bold tracking-tight mb-8" data-animate>{workPage?.data.title ?? 'Praca'}</h1>

    {WorkContent && (
      <div class="prose prose-neutral dark:prose-invert max-w-none mb-12" data-animate>
        <WorkContent />
      </div>
    )}

    <section id="companies" data-animate>
      <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Firmy</h2>
      <div class="grid gap-4">
        {companies.map((company, i) => (
          <div data-animate data-delay={String(Math.min(i + 1, 5))}>
            <CompanyCard
              name={company.data.name}
              domain={company.data.domain}
              role={company.data.role}
              slug={company.id.replace(/\.pl$/, '')}
              locale="pl"
            />
          </div>
        ))}
      </div>
    </section>
  </div>
</Base>
```

- [ ] **Step 2: Write `src/pages/pl/praca/[...slug].astro`**

Mirror the EN dynamic route, but filter to PL entries and pass `locale="pl"`:

```astro
---
import Base from '@/layouts/Base.astro';
import ProjectCard from '@/components/ProjectCard.astro';
import JsonLd from '@/components/JsonLd.astro';
import Breadcrumb from '@/components/Breadcrumb.astro';
import SectionDots from '@/components/SectionDots.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const companies = await getCollection('companies');
  return companies
    .filter((c) => c.data.lang === 'pl')
    .map((entry) => ({
      params: { slug: entry.id.replace(/\.pl$/, '') },
      props: { entry },
    }));
}

const { entry } = Astro.props;
const { Content, headings } = await render(entry);

const allProjects = await getCollection('projects');
const relatedProjects = allProjects
  .filter((p) => p.data.lang === 'pl')
  .filter((p) => p.data.company === entry.id.replace(/\.pl$/, ''))
  .sort((a, b) => a.data.order - b.data.order);

const enSlug = entry.id.replace(/\.pl$/, '');
const alternateUrl = `/work/${enSlug}`;

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@language': 'pl',
  name: entry.data.name,
  ...(entry.data.url ? { url: entry.data.url } : {}),
  description: entry.data.description,
};
---

<Base
  title={entry.data.metaTitle || entry.data.name}
  description={entry.data.description}
  locale="pl"
  alternateUrl={alternateUrl}
>
  <JsonLd data={orgJsonLd} />
  <SectionDots headings={headings} />

  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <Breadcrumb crumbs={[
      { label: 'Strona glowna', href: '/pl/' },
      { label: 'Praca', href: '/pl/praca' },
      { label: entry.data.name },
    ]} />

    <div class="mt-6 mb-8" data-animate>
      <h1 class="text-4xl font-bold tracking-tight">{entry.data.name}</h1>
      <div class="flex items-center gap-3 mt-3 flex-wrap">
        <span class="text-sm text-muted-foreground">{entry.data.role}</span>
        <span class="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{entry.data.domain}</span>
        {entry.data.url && (
          <a href={entry.data.url} target="_blank" rel="noopener noreferrer" class="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            {new URL(entry.data.url).hostname}
          </a>
        )}
      </div>
    </div>

    <div class="prose prose-neutral dark:prose-invert max-w-none mb-12" data-animate>
      <Content />
    </div>

    {relatedProjects.length > 0 && (
      <section data-animate>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Projekty</h2>
        <div class="grid gap-4">
          {relatedProjects.map((project) => (
            <ProjectCard
              name={project.data.name}
              description={project.data.description}
              domain={project.data.domain}
              slug={project.id.replace(/\.pl$/, '')}
              locale="pl"
            />
          ))}
        </div>
      </section>
    )}
  </div>
</Base>
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```
Expected: build succeeds. After `npm run dev`, visit `/pl/praca` and `/pl/praca/gyfted` — both render with placeholder content.

- [ ] **Step 4: Commit**

```bash
git add src/pages/pl/praca/index.astro src/pages/pl/praca/[...slug].astro
git commit -m "feat(i18n): add Polish work index and dynamic route"
```

### Task 27: Create the Polish projects index and dynamic route

**Files:**
- Create: `src/pages/pl/projekty/index.astro`
- Create: `src/pages/pl/projekty/[...slug].astro`

- [ ] **Step 1: Write `src/pages/pl/projekty/index.astro`**

Mirror `src/pages/projects/index.astro` structure with PL filtering:

```astro
---
import Base from '@/layouts/Base.astro';
import ProjectCard from '@/components/ProjectCard.astro';
import { getCollection } from 'astro:content';

const projects = (await getCollection('projects'))
  .filter((p) => p.data.lang === 'pl')
  .sort((a, b) => a.data.order - b.data.order);

const caseStudies = projects.filter((p) => p.data.challenge || p.data.results);
const otherProjects = projects.filter((p) => !p.data.challenge && !p.data.results);
---

<Base
  title="Projekty"
  description="Studia przypadkow Blazeja Mrozinskiego."
  locale="pl"
  alternateUrl="/projects"
>
  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <h1 class="text-4xl font-bold tracking-tight mb-2" data-animate>Projekty</h1>
    <p class="text-muted-foreground mb-8" data-animate>(Polish placeholder — to be filled.)</p>

    {caseStudies.length > 0 && (
      <div class="grid gap-4 mb-12">
        {caseStudies.map((project, i) => (
          <div data-animate data-delay={String(Math.min(i + 1, 5))}>
            <ProjectCard
              name={project.data.name}
              description={project.data.description}
              domain={project.data.domain}
              slug={project.id.replace(/\.pl$/, '')}
              isCaseStudy={true}
              locale="pl"
            />
          </div>
        ))}
      </div>
    )}

    {otherProjects.length > 0 && (
      <>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4" data-animate>Inne projekty</h2>
        <div class="grid gap-4">
          {otherProjects.map((project, i) => (
            <div data-animate data-delay={String(Math.min(i + 1, 5))}>
              <ProjectCard
                name={project.data.name}
                description={project.data.description}
                domain={project.data.domain}
                slug={project.id.replace(/\.pl$/, '')}
                locale="pl"
              />
            </div>
          ))}
        </div>
      </>
    )}
  </div>
</Base>
```

- [ ] **Step 2: Write `src/pages/pl/projekty/[...slug].astro`**

```astro
---
import Base from '@/layouts/Base.astro';
import JsonLd from '@/components/JsonLd.astro';
import Breadcrumb from '@/components/Breadcrumb.astro';
import SectionDots from '@/components/SectionDots.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects
    .filter((p) => p.data.lang === 'pl')
    .map((entry) => ({
      params: { slug: entry.id.replace(/\.pl$/, '') },
      props: { entry },
    }));
}

const { entry } = Astro.props;
const { Content, headings } = await render(entry);

const allCompanies = await getCollection('companies');
const relatedCompany = entry.data.company
  ? allCompanies.find((c) => c.data.lang === 'pl' && c.id.replace(/\.pl$/, '') === entry.data.company)
  : null;

const isCaseStudy = !!(entry.data.challenge || entry.data.results);
const enSlug = entry.id.replace(/\.pl$/, '');
const alternateUrl = `/projects/${enSlug}`;

const projectJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  '@language': 'pl',
  name: entry.data.name,
  description: entry.data.description,
};
---

<Base
  title={entry.data.metaTitle || entry.data.name}
  description={entry.data.description}
  locale="pl"
  alternateUrl={alternateUrl}
>
  <JsonLd data={projectJsonLd} />
  <SectionDots headings={headings} />

  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <Breadcrumb crumbs={[
      { label: 'Strona glowna', href: '/pl/' },
      { label: 'Projekty', href: '/pl/projekty' },
      { label: entry.data.name },
    ]} />

    <div class="mt-6 mb-8" data-animate>
      <h1 class="text-4xl font-bold tracking-tight">{entry.data.name}</h1>
      <p class="text-muted-foreground mt-2">{entry.data.description}</p>
    </div>

    <div class="prose prose-neutral dark:prose-invert max-w-none mb-12" data-animate>
      <Content />
    </div>
  </div>
</Base>
```

Note: this is intentionally simpler than the EN `[...slug].astro` for projects, because that one has case-study-specific layout sections (`challenge`, `approach`, `results`, `tools`) which would need their own translation. To keep this task focused, the PL project page renders only the title, description, and rendered markdown body. Claude can enrich it during translation if needed; for now this gets us a working PL project route.

- [ ] **Step 3: Build and verify**

```bash
npm run build
```
Expected: clean build. Visit `/pl/projekty` and `/pl/projekty/contentforge`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/pl/projekty/index.astro src/pages/pl/projekty/[...slug].astro
git commit -m "feat(i18n): add Polish projects index and dynamic route"
```

---

## Phase 8: Optional Post-Commit Hook

### Task 28: Create the post-commit drift reminder hook

**Files:**
- Create: `scripts/hooks/post-commit`
- Create: `scripts/install-hooks.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write `scripts/hooks/post-commit`**

```bash
#!/bin/sh
# Post-commit hook: prints a reminder if Polish translations have drifted.
# Installed by `npm run install-hooks`.

if [ ! -f scripts/translate-check.mjs ]; then
  exit 0
fi

OUTPUT=$(node scripts/translate-check.mjs 2>/dev/null)
SUMMARY=$(echo "$OUTPUT" | grep "^Summary:")

# Parse counts from the summary line. If anything is non-zero, print a one-liner.
MISSING=$(echo "$SUMMARY" | grep -oE '[0-9]+ missing' | grep -oE '[0-9]+')
DRIFTED=$(echo "$SUMMARY" | grep -oE '[0-9]+ drifted' | grep -oE '[0-9]+')

if [ "${MISSING:-0}" != "0" ] || [ "${DRIFTED:-0}" != "0" ]; then
  echo "[i18n] Polish translation drift: ${MISSING:-0} missing, ${DRIFTED:-0} drifted. Run \"sync polish translations\" in Claude Code to update."
fi

exit 0
```

- [ ] **Step 2: Write `scripts/install-hooks.mjs`**

```javascript
#!/usr/bin/env node
import { copyFileSync, chmodSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const source = join(repoRoot, 'scripts/hooks/post-commit');
const gitHooksDir = join(repoRoot, '.git/hooks');
const dest = join(gitHooksDir, 'post-commit');

if (!existsSync(source)) {
  console.error(`Source hook not found at ${source}`);
  process.exit(1);
}

if (!existsSync(gitHooksDir)) {
  mkdirSync(gitHooksDir, { recursive: true });
}

copyFileSync(source, dest);
chmodSync(dest, 0o755);
console.log(`Installed post-commit hook to ${dest}`);
```

- [ ] **Step 3: Add the npm script to `package.json`**

In the `scripts` block, add:

```json
"install-hooks": "node scripts/install-hooks.mjs"
```

- [ ] **Step 4: Test the hook installation**

```bash
npm run install-hooks
```
Expected: `Installed post-commit hook to .../.git/hooks/post-commit`.

- [ ] **Step 5: Test the hook fires on a commit**

Make a no-op commit to test:

```bash
echo "" >> CHANGELOG.md  # any small change
git add CHANGELOG.md
git commit -m "chore: test post-commit hook"
```
Expected: after the commit message, you see `[i18n] Polish translation drift: ...` printed. If you don't, check that the hook file is executable and the script ran without errors.

Then revert the test change:

```bash
git reset --hard HEAD~1
```

Actually wait — `git reset --hard` is destructive and we agreed not to run such commands without explicit user permission. Skip the reset. Leave the test commit. The hook test verified it works; the test commit is fine and can be cleaned up later or kept.

- [ ] **Step 6: Commit the hook scripts**

```bash
git add scripts/hooks/post-commit scripts/install-hooks.mjs package.json
git commit -m "feat(i18n): add optional post-commit drift reminder hook"
```

---

## Phase 9: Verification & Click-Test

### Task 29: Full build + Astro check

**Files:** None modified.

- [ ] **Step 1: Run a clean build**

```bash
rm -rf dist
npm run build
```
Expected: clean build. No errors. Output includes both EN routes and the new `/pl/*` routes.

- [ ] **Step 2: Run Astro check**

```bash
npx astro check
```
Expected: `0 errors`. Warnings are tolerated only if they were already present before this branch.

- [ ] **Step 3: Run the drift script**

```bash
npm run translate:check
```
Expected output structure:
- `MISSING: 0` (all PL siblings exist)
- `DRIFTED: 13` (3 pages + 4 companies + 6 projects, none have `source_hash` set)
- Dictionary section: shows ~25 keys missing/drifted in PL
- Summary line: non-zero counts as expected

- [ ] **Step 4: Run the drift script tests**

```bash
npm run translate:check:test
```
Expected: all tests pass.

- [ ] **Step 5: No commit needed.**

### Task 30: Manual click-test on the dev server

**Files:** None modified.

This is a manual checklist. Run `npm run dev` and walk through every item.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```
Open `http://localhost:4321/` in a browser.

- [ ] **Step 2: EN site regression check**

For each of the following URLs, verify the page renders without errors and the layout looks unchanged from main:

- `/` (homepage)
- `/about`
- `/cv`
- `/work`
- `/work/gyfted`
- `/projects`
- `/projects/contentforge`
- `/contact`
- `/blog`
- pick any blog post
- `/publications`
- `/glossary`

For each: verify the EN/PL switcher is visible in the header.

- [ ] **Step 3: Language switcher fallback test**

Click the `PL` switcher on:
- `/about` → should land on `/pl/o-mnie`
- `/cv` → should land on `/pl/cv`
- `/work` → should land on `/pl/praca`
- `/work/gyfted` → should land on `/pl/praca/gyfted`
- `/projects` → should land on `/pl/projekty`
- `/projects/contentforge` → should land on `/pl/projekty/contentforge`
- `/contact` → should land on `/pl/kontakt`
- a blog post → should land on `/pl/` (the smart fallback)
- `/publications` → should land on `/pl/`
- `/glossary` → should land on `/pl/`

- [ ] **Step 4: PL site basic check**

Walk every PL URL:
- `/pl/`
- `/pl/o-mnie`
- `/pl/cv`
- `/pl/kontakt`
- `/pl/praca`
- `/pl/praca/gyfted`
- `/pl/praca/nerds-family`
- `/pl/praca/digital-savages`
- `/pl/praca/swps-university`
- `/pl/projekty`
- `/pl/projekty/contentforge`
- `/pl/projekty/hse-career-quiz`
- `/pl/projekty/kryptotracker`
- `/pl/projekty/new-aggregator`
- `/pl/projekty/prawomat`
- `/pl/projekty/ssm`

For each: verify it renders, the switcher shows `EN`, clicking `EN` returns to the corresponding EN page.

- [ ] **Step 5: HTML lang attribute check**

In the browser DevTools, on a PL page, run:

```js
document.documentElement.lang
```
Expected: `'pl'`.

On an EN page: `'en'`.

- [ ] **Step 6: Hreflang check**

In DevTools, on `/about`, run:

```js
[...document.querySelectorAll('link[rel="alternate"]')].map(l => `${l.hreflang}: ${l.href}`)
```
Expected: includes `en: .../about`, `pl: .../pl/o-mnie`, `x-default: .../about`. Plus the existing RSS link.

On `/pl/o-mnie`: same three hreflang entries.

On a blog post: only `en: ...` and `x-default: ...` (no `pl`).

- [ ] **Step 7: Sitemap check**

Visit `http://localhost:4321/sitemap-pages.xml` and `http://localhost:4321/sitemap-work.xml`. Both should be valid XML (no parse errors in the browser) and contain `xhtml:link` annotations for translated pages.

- [ ] **Step 8: Stop the dev server**

Ctrl+C.

- [ ] **Step 9: No commit needed.** Note any issues found and create a follow-up task before proceeding.

### Task 31: Update CHANGELOG and README

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `src/content/changelog/` (if changelog entries are file-based — check first)

- [ ] **Step 1: Check how the changelog is structured**

```bash
ls src/content/changelog 2>/dev/null
cat CHANGELOG.md | head -30
```

The repo has both a top-level `CHANGELOG.md` and a `src/content/changelog/` collection (the on-site changelog page). Update both per the user's global rule: "Always add a CHANGELOG.md entry for every meaningful commit."

- [ ] **Step 2: Add an entry to `CHANGELOG.md`**

Add a new entry at the top of the unreleased / latest section noting the i18n machinery. Match the existing style. Example wording:

```markdown
## v0.8.0 — 2026-04-13

### Added
- Polish translation (i18n) machinery: `/pl/*` routing, locale-aware Header/Footer/Base/SEO components, `t()` helper, `routes.json` map, drift detection script, hreflang annotations in sitemaps. Polish content scaffolds in place; bodies pending translation.
```

(Pick an actual version number — check the latest entry first to know what to bump.)

- [ ] **Step 3: If `src/content/changelog/` is file-based, add a matching entry there following the same format as existing entries**

```bash
ls src/content/changelog | tail -5
cat src/content/changelog/$(ls src/content/changelog | tail -1)
```
Then create a new file matching that structure, with the same description as the CHANGELOG.md entry.

- [ ] **Step 4: Update `README.md` with a brief i18n note if appropriate**

Read the README first. If it has a "Content Collections" or "Architecture" section, add 2-3 lines there. Don't create new sections unless the existing structure demands it. Example addition:

```markdown
### Internationalization

The site has Polish (`/pl/*`) versions of the marketing surface (homepage, about, CV, work, projects, contact). Translations are produced on demand by Claude in local sessions and tracked via `npm run translate:check`. See `docs/superpowers/specs/2026-04-13-polish-translation-design.md` for details.
```

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md README.md src/content/changelog/
git commit -m "docs: update CHANGELOG and README for Polish i18n machinery"
```

---

## Phase 10: Branch Push & PR

### Task 32: Push branch and open draft PR

**Files:** None modified.

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/polish-i18n
```
Expected: branch pushes to remote.

- [ ] **Step 2: Open a draft PR**

```bash
gh pr create --draft --title "feat: Polish (i18n) machinery and routing" --body "$(cat <<'EOF'
## Summary
- Adds `/pl/*` localized routing, locale-aware shared components, and a `t()` UI dictionary helper.
- Adds `routes.json` map, content schema fields (`lang`, `source_hash`, `slug`), Polish content scaffolds (frontmatter only), Polish dynamic routes for companies and projects.
- Adds `npm run translate:check` drift detection script with tests, optional post-commit drift reminder hook.
- Updates `sitemap-pages.xml.ts` and `sitemap-work.xml.ts` with hreflang annotations.
- Polish content bodies and dictionary values are intentionally placeholder — they will be filled in a follow-up Claude session, not in this PR.

## Spec
`docs/superpowers/specs/2026-04-13-polish-translation-design.md`

## Test plan
- [ ] Netlify deploy preview builds successfully
- [ ] EN routes unchanged: visit /, /about, /work, /work/gyfted, /projects, /projects/contentforge, a blog post, /publications, /glossary
- [ ] PL routes render: /pl/, /pl/o-mnie, /pl/cv, /pl/kontakt, /pl/praca, /pl/praca/gyfted, /pl/projekty, /pl/projekty/contentforge
- [ ] Language switcher visible in header on every page
- [ ] Switcher fallback: clicking PL on a blog post lands on /pl/
- [ ] HTML `lang` attribute is `pl` on Polish pages
- [ ] Hreflang tags present on translated pages (verify via DevTools or view source)
- [ ] Sitemap files contain hreflang annotations
- [ ] `npm run translate:check` reports the expected drift (placeholder PL content)
- [ ] `npm run translate:check:test` all tests pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Expected: PR is created and the URL is printed.

- [ ] **Step 3: Note the PR URL for the user**

Print the URL so the user can open it. Wait for Netlify to build the deploy preview (~1-3 minutes), then proceed to Task 33.

### Task 33: Click-test the Netlify deploy preview

**Files:** None.

- [ ] **Step 1: Find the deploy preview URL**

```bash
gh pr checks
```
Or open the PR in a browser and look for the Netlify deploy preview link in the checks section. The URL pattern is `deploy-preview-N--<sitename>.netlify.app`.

- [ ] **Step 2: Re-run the manual click-test from Task 30 against the deploy preview URL instead of localhost**

Same checklist. Verify everything that worked locally also works on the deploy preview. If anything diverges (e.g., a build optimization breaks something), capture it as a follow-up task before merging.

- [ ] **Step 3: No commit needed.** Report findings.

---

## Phase 11: Closing Out

### Task 34: Decide whether to merge or hand back to the user

**Files:** None.

This task is intentionally not "merge the PR." Per the spec, the user reviews and merges. This plan stops at "PR ready for user merge."

- [ ] **Step 1: Summarize the state for the user**

Tell the user:
- The plan completed.
- The PR is at `<URL>`, draft status, with deploy preview at `<URL>`.
- The placeholder Polish content (skeleton `.pl.md` files and empty `pl.json` strings) is ready for Claude to fill in via the translation workflow described in the spec.
- Recommended next step: run a separate Claude Code session in the worktree, say "sync polish translations", and Claude will fill in real content. THEN review the diff, then mark the PR ready for review and merge.

- [ ] **Step 2: Leave the worktree intact.**

Do NOT remove the worktree. The user will use it for the translation session and the merge. Worktree cleanup is the user's call after merge, not the implementor's.

---

## Self-Review Checklist (run after writing the plan)

This was completed when the plan was written:

- **Spec coverage:** Every section of the spec is mapped to one or more tasks above. The architecture (3 moving parts) → Phases 2/3/6/7. Routing → Phases 6/7. UI dictionary → Phase 2/4. Drift detection → Phase 3. Language switcher → Phase 4. SEO/hreflang → Phase 4 (SEO) and Phase 5 (sitemaps). Rollout (worktree, branch, PR, deploy preview) → Phases 1, 10. Post-commit hook → Phase 8.
- **Placeholder scan:** No "TBD" / "TODO" / "implement later" in the steps. Some Polish placeholder strings exist in the scaffold files (e.g. "Polish translation pending"), but those are the *intentional* output of the plan — they're filler for files Claude will overwrite during the follow-up translation session.
- **Type consistency:** The `Locale` type, `t()` helper signature, `routes.json` shape, and component prop names (`locale`, `alternateUrl`, `currentLocale`) are consistent across all tasks.
- **Known limitation accepted:** The PL project pages (Task 27) deliberately render a simpler layout than the EN equivalents (no case-study `challenge`/`approach`/`results` sections). The translation session can enrich them after the machinery is in place. This trade-off keeps the plan focused on machinery, not content design.
