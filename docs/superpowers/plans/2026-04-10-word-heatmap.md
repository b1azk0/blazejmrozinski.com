# Word Heatmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive keyword cloud page at `/heat/` that visualizes blog tag and label frequency, with click-to-filter results showing matching blog posts and related project/company landing pages.

**Architecture:** Single self-contained Astro page. Build-time data collection from blog, project, and company collections. Client-side vanilla JS for click filtering using pre-rendered hidden content with data attributes. URL query param (`?k=`) for shareable state. GA4 custom event on keyword clicks.

**Tech Stack:** Astro, Tailwind CSS, vanilla JavaScript, existing `labels.ts` and `domains.ts` color systems.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/pages/heat/index.astro` | The entire feature — data collection, cloud rendering, result cards, filter JS |

Single file. No new components, utilities, or dependencies.

**Key existing files referenced:**
- `src/layouts/Base.astro` — page wrapper (has `robots` prop for noindex)
- `src/lib/labels.ts` — `labels` record, `LabelSlug` type, accent colors
- `src/lib/domains.ts` — `getDomainConfig()` for domain accent colors
- `src/components/LabelFilter.astro` — reference for filter JS pattern
- `src/components/TagFilter.astro` — reference for tag data-attribute pattern

---

### Task 1: Page Scaffold with Noindex and Build-Time Data Collection

**Files:**
- Create: `src/pages/heat/index.astro`

- [ ] **Step 1: Create the page with layout, meta, and data collection**

Create `src/pages/heat/index.astro` with the following content:

```astro
---
import Base from '@/layouts/Base.astro';
import { getCollection } from 'astro:content';
import { labels, type LabelSlug } from '@/lib/labels';

// --- Collect published blog posts ---
const now = new Date();
const allPosts = await getCollection('blog', ({ data }) => data.status === 'published' && data.date <= now);
const posts = allPosts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

// --- Collect projects and companies ---
const allProjects = await getCollection('projects');
const allCompanies = await getCollection('companies');

// --- Count tag frequencies ---
const tagCounts = new Map<string, number>();
const tagLabelMap = new Map<string, Map<string, number>>(); // tag -> { label -> count }

for (const post of posts) {
  for (const tag of post.data.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    if (post.data.label) {
      if (!tagLabelMap.has(tag)) tagLabelMap.set(tag, new Map());
      const labelMap = tagLabelMap.get(tag)!;
      labelMap.set(post.data.label, (labelMap.get(post.data.label) || 0) + 1);
    }
  }
}

// --- Count label frequencies ---
const labelCounts = new Map<string, number>();
for (const post of posts) {
  if (post.data.label) {
    labelCounts.set(post.data.label, (labelCounts.get(post.data.label) || 0) + 1);
  }
}

// --- Determine tag color: most common co-occurring label, or neutral gray ---
function getTagColor(tag: string): string {
  const labelMap = tagLabelMap.get(tag);
  if (!labelMap || labelMap.size === 0) return '#a0a0a0';
  if (labelMap.size >= 3) {
    // Check if any label has a majority (> others individually)
    const sorted = [...labelMap.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] === sorted[1][1]) return '#a0a0a0';
  }
  const topLabel = [...labelMap.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return labels[topLabel as LabelSlug]?.accent ?? '#a0a0a0';
}

// --- Compute font sizes (14px to 48px) ---
const allCounts = [...tagCounts.values(), ...labelCounts.values()];
const maxCount = Math.max(...allCounts, 1);
const minCount = Math.min(...allCounts, 1);

function fontSize(count: number): number {
  if (maxCount === minCount) return 28;
  const ratio = (count - minCount) / (maxCount - minCount);
  return Math.round(14 + ratio * 34);
}

function fontWeight(count: number): number {
  if (maxCount === minCount) return 600;
  const ratio = (count - minCount) / (maxCount - minCount);
  return Math.round(400 + ratio * 400);
}

// --- Build keyword list for the cloud ---
interface CloudKeyword {
  text: string;
  type: 'tag' | 'label';
  count: number;
  color: string;
  size: number;
  weight: number;
  slug: string;
}

const keywords: CloudKeyword[] = [];

for (const [tag, count] of tagCounts) {
  keywords.push({
    text: tag,
    type: 'tag',
    count,
    color: getTagColor(tag),
    size: fontSize(count),
    weight: fontWeight(count),
    slug: tag,
  });
}

for (const [label, count] of labelCounts) {
  const config = labels[label as LabelSlug];
  if (!config) continue;
  keywords.push({
    text: config.name,
    type: 'label',
    count,
    color: config.accent,
    size: fontSize(count),
    weight: fontWeight(count),
    slug: label,
  });
}

// Shuffle for visual variety (deterministic shuffle using count as seed proxy)
keywords.sort((a, b) => {
  const hashA = a.text.length * 7 + a.count * 13;
  const hashB = b.text.length * 7 + b.count * 13;
  return hashA - hashB;
});

// --- Prepare post data for results ---
const postData = posts.map((post) => ({
  title: post.data.title,
  description: post.data.description,
  date: post.data.date,
  tags: post.data.tags,
  label: post.data.label || '',
  slug: post.id,
  labelName: post.data.label && labels[post.data.label as LabelSlug]?.name || '',
  labelColor: post.data.label && labels[post.data.label as LabelSlug]?.accent || '',
}));

// --- Prepare project/company data for results ---
const projectData = allProjects.map((p) => ({
  name: p.data.name,
  description: p.data.description,
  domain: p.data.domain,
  slug: p.id,
  relatedPosts: p.data.related_posts || [],
  type: 'project' as const,
}));

const companyData = allCompanies.map((c) => ({
  name: c.data.name,
  description: c.data.description,
  domain: c.data.domain,
  slug: c.id,
  relatedProjects: c.data.related_projects || [],
  type: 'company' as const,
}));
---

<Base
  title="Explore by Keyword"
  description="Interactive keyword cloud — explore blog posts, projects, and companies by topic."
  robots="noindex, nofollow"
>
  <div class="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
    <!-- Page title -->
    <div class="text-center mb-12">
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Explore by keyword</h1>
      <p class="text-muted-foreground text-sm">Click a keyword to see matching content</p>
    </div>

    <!-- Word Cloud -->
    <div
      id="word-cloud"
      class="flex flex-wrap justify-center items-baseline gap-x-4 gap-y-3 sm:gap-x-5 sm:gap-y-4 mb-12 px-2 sm:px-8"
    >
      {keywords.map((kw) => (
        <button
          class:list={[
            'keyword transition-all duration-200 cursor-pointer select-none',
            kw.type === 'label' ? 'keyword-label' : 'keyword-tag',
          ]}
          data-keyword={kw.slug}
          data-type={kw.type}
          style={
            kw.type === 'tag'
              ? `font-size:${kw.size}px;font-weight:${kw.weight};color:${kw.color};`
              : `font-size:${kw.size}px;font-weight:${kw.weight};border-color:${kw.color};color:${kw.color};`
          }
        >
          {kw.text}
        </button>
      ))}
    </div>

    <!-- Divider (hidden until click) -->
    <div id="results-divider" class="border-t border-border mb-8 hidden"></div>

    <!-- Result count -->
    <p id="result-count" class="text-sm text-muted-foreground mb-6 hidden"></p>

    <!-- Blog post results -->
    <div id="post-results" class="grid gap-4 mb-8 hidden">
      {postData.map((post) => (
        <article
          class="result-post rounded-lg border bg-card text-card-foreground p-5 transition-all"
          data-tags={post.tags.join(',')}
          data-label={post.label}
          style={post.labelColor ? `border-left: 3px solid ${post.labelColor};` : ''}
        >
          <a href={`/blog/${post.slug}`} class="block">
            <h3 class="font-bold text-lg tracking-tight hover:text-primary/80 transition-colors">
              {post.title}
            </h3>
          </a>
          <p class="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
            {post.description}
          </p>
          <div class="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <time datetime={post.date.toISOString()}>
              {post.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </time>
            {post.labelName && (
              <span class="inline-flex items-center gap-1.5">
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  style={`background-color:${post.labelColor};`}
                  aria-hidden="true"
                />
                {post.labelName}
              </span>
            )}
          </div>
        </article>
      ))}
    </div>

    <!-- Related Pages heading -->
    <h2 id="related-heading" class="text-lg font-semibold mb-4 hidden">Related Pages</h2>

    <!-- Project/Company results -->
    <div id="page-results" class="grid gap-4 mb-12 hidden">
      {projectData.map((p) => (
        <article
          class="result-page rounded-lg border border-dashed bg-card text-card-foreground p-5 transition-all"
          data-domain={p.domain}
          data-related-posts={p.relatedPosts.join(',')}
          data-page-type="project"
        >
          <a href={`/work/${p.slug}`} class="block">
            <h3 class="font-bold text-lg tracking-tight hover:text-primary/80 transition-colors">
              {p.name}
            </h3>
          </a>
          <p class="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
            {p.description}
          </p>
          <div class="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Project</span>
            <span class="opacity-40">·</span>
            <span>{p.domain}</span>
          </div>
        </article>
      ))}
      {companyData.map((c) => (
        <article
          class="result-page rounded-lg border border-dashed bg-card text-card-foreground p-5 transition-all"
          data-domain={c.domain}
          data-related-projects={c.relatedProjects.join(',')}
          data-page-type="company"
        >
          <a href={`/work/${c.slug}`} class="block">
            <h3 class="font-bold text-lg tracking-tight hover:text-primary/80 transition-colors">
              {c.name}
            </h3>
          </a>
          <p class="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
            {c.description}
          </p>
          <div class="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Company</span>
            <span class="opacity-40">·</span>
            <span>{c.domain}</span>
          </div>
        </article>
      ))}
    </div>
  </div>
</Base>

<style>
  .keyword-tag {
    background: none;
    border: none;
    padding: 2px 4px;
    line-height: 1.2;
  }

  .keyword-tag:hover {
    transform: scale(1.08);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .keyword-label {
    background: none;
    border: 2px solid;
    border-radius: 9999px;
    padding: 2px 12px;
    line-height: 1.4;
  }

  .keyword-label:hover {
    background-color: color-mix(in srgb, currentColor 12%, transparent);
  }

  .keyword.active.keyword-tag {
    background-color: color-mix(in srgb, currentColor 15%, transparent);
    border-radius: 4px;
    transform: scale(1.05);
  }

  .keyword.active.keyword-label {
    background-color: color-mix(in srgb, currentColor 15%, transparent);
    transform: scale(1.05);
  }

  @media (max-width: 640px) {
    .keyword-tag,
    .keyword-label {
      font-size: calc(var(--base-size, 14px) * 0.8) !important;
    }
  }
</style>
```

- [ ] **Step 2: Verify the page builds and renders**

Run: `npm run build`
Expected: Build succeeds with no errors. The page at `/heat/` is generated.

Run: `npm run preview` and visit `http://localhost:4321/heat/`
Expected: Page renders with the word cloud visible. No content in results area yet (it's hidden). Header/footer present. Check the page source for `<meta name="robots" content="noindex, nofollow">`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/heat/index.astro
git commit -m "feat(heat): scaffold word heatmap page with cloud rendering"
```

---

### Task 2: Client-Side Filter Logic and URL State

**Files:**
- Modify: `src/pages/heat/index.astro` (add `<script>` block)

- [ ] **Step 1: Add the filter script**

Add the following `<script>` block at the end of `src/pages/heat/index.astro`, after the closing `</style>` tag:

```astro
<script>
  function initHeatmap() {
    const cloud = document.getElementById('word-cloud');
    const divider = document.getElementById('results-divider');
    const resultCount = document.getElementById('result-count');
    const postResults = document.getElementById('post-results');
    const pageResults = document.getElementById('page-results');
    const relatedHeading = document.getElementById('related-heading');

    if (!cloud) return;

    const buttons = cloud.querySelectorAll<HTMLButtonElement>('.keyword');
    const postCards = document.querySelectorAll<HTMLElement>('.result-post');
    const pageCards = document.querySelectorAll<HTMLElement>('.result-page');

    function clearSelection() {
      buttons.forEach((btn) => btn.classList.remove('active'));
      divider?.classList.add('hidden');
      resultCount?.classList.add('hidden');
      postResults?.classList.add('hidden');
      pageResults?.classList.add('hidden');
      relatedHeading?.classList.add('hidden');
      postCards.forEach((card) => (card.style.display = 'none'));
      pageCards.forEach((card) => (card.style.display = 'none'));
    }

    function selectKeyword(keyword: string, type: string) {
      clearSelection();

      // Highlight active keyword
      const activeBtn = cloud!.querySelector<HTMLButtonElement>(
        `.keyword[data-keyword="${CSS.escape(keyword)}"]`
      );
      if (!activeBtn) return;
      activeBtn.classList.add('active');

      // Filter blog posts
      let postCount = 0;
      const matchedPostSlugs: string[] = [];

      postCards.forEach((card) => {
        let matches = false;
        if (type === 'tag') {
          const tags = (card.dataset.tags || '').split(',');
          matches = tags.includes(keyword);
        } else {
          matches = card.dataset.label === keyword;
        }
        card.style.display = matches ? '' : 'none';
        if (matches) {
          postCount++;
          // Extract slug from the card's link href
          const link = card.querySelector('a');
          if (link) {
            const href = link.getAttribute('href') || '';
            const slug = href.replace('/blog/', '');
            matchedPostSlugs.push(slug);
          }
        }
      });

      // Filter projects/companies
      let pageCount = 0;

      pageCards.forEach((card) => {
        let matches = false;
        const domain = (card.dataset.domain || '').toLowerCase();

        if (type === 'label') {
          // Domain match: check if the project/company domain contains the label keyword
          matches = domain.includes(keyword.replace('-', ' ')) ||
                    domain.includes(keyword);
        }

        // Related posts match: check if any of the card's related posts are in matched posts
        if (!matches) {
          const relatedPosts = (card.dataset.relatedPosts || '').split(',').filter(Boolean);
          matches = relatedPosts.some((rp) => matchedPostSlugs.includes(rp));
        }

        // For companies: check if any of their related projects matched
        if (!matches && card.dataset.pageType === 'company') {
          const relatedProjects = (card.dataset.relatedProjects || '').split(',').filter(Boolean);
          const matchedProjectSlugs: string[] = [];
          pageCards.forEach((pc) => {
            if (pc.dataset.pageType === 'project' && pc.style.display !== 'none') {
              const link = pc.querySelector('a');
              if (link) {
                const slug = (link.getAttribute('href') || '').replace('/work/', '');
                matchedProjectSlugs.push(slug);
              }
            }
          });
          matches = relatedProjects.some((rp) => matchedProjectSlugs.includes(rp));
        }

        card.style.display = matches ? '' : 'none';
        if (matches) pageCount++;
      });

      // Show results sections
      divider?.classList.remove('hidden');
      resultCount?.classList.remove('hidden');

      if (postCount > 0) {
        postResults?.classList.remove('hidden');
      }

      if (pageCount > 0) {
        pageResults?.classList.remove('hidden');
        relatedHeading?.classList.remove('hidden');
      }

      // Update count text
      const parts: string[] = [];
      if (postCount > 0) parts.push(`${postCount} post${postCount === 1 ? '' : 's'}`);
      if (pageCount > 0) parts.push(`${pageCount} page${pageCount === 1 ? '' : 's'}`);
      const displayName = activeBtn.textContent?.trim() || keyword;
      if (resultCount) {
        resultCount.innerHTML = parts.length > 0
          ? `${parts.join(' + ')} for <strong>${displayName}</strong>`
          : `No results for <strong>${displayName}</strong>`;
      }

      // Smooth scroll to results
      divider?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('k', keyword);
      window.history.replaceState({}, '', url.toString());
    }

    // Click handlers
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const keyword = btn.dataset.keyword || '';
        const type = btn.dataset.type || 'tag';

        // Toggle off if already active
        if (btn.classList.contains('active')) {
          clearSelection();
          const url = new URL(window.location.href);
          url.searchParams.delete('k');
          window.history.replaceState({}, '', url.toString());
          return;
        }

        selectKeyword(keyword, type);
      });
    });

    // Restore from URL param
    const params = new URLSearchParams(window.location.search);
    const initialKeyword = params.get('k');
    if (initialKeyword) {
      const matchingBtn = cloud.querySelector<HTMLButtonElement>(
        `.keyword[data-keyword="${CSS.escape(initialKeyword)}"]`
      );
      if (matchingBtn) {
        selectKeyword(initialKeyword, matchingBtn.dataset.type || 'tag');
      }
    }
  }

  initHeatmap();
  document.addEventListener('astro:after-swap', initHeatmap);
</script>
```

- [ ] **Step 2: Test click filtering**

Run: `npm run dev` and visit `http://localhost:4321/heat/`

Test the following scenarios manually:
1. Click a tag keyword (e.g., "wordpress") → blog posts with that tag appear, result count shows correctly
2. Click a label keyword (e.g., "Infrastructure") → blog posts with that label appear
3. Click the same keyword again → results hide, keyword deselects
4. Click one keyword, then another → first deselects, second selects with new results
5. After clicking a keyword, check URL shows `?k=wordpress`
6. Reload the page with `?k=wordpress` in the URL → keyword is pre-selected and results show
7. Check that Related Pages appear when clicking a label that matches a project/company domain

- [ ] **Step 3: Commit**

```bash
git add src/pages/heat/index.astro
git commit -m "feat(heat): add client-side keyword filter with URL state"
```

---

### Task 3: GA4 Analytics Event

**Files:**
- Modify: `src/pages/heat/index.astro` (add `gtag` call inside the click handler)

- [ ] **Step 1: Add GA4 event to the click handler**

In the `<script>` block inside `src/pages/heat/index.astro`, find the `selectKeyword` function. Add the GA4 event call right after the `// Update URL` section (after `window.history.replaceState`):

```typescript
      // GA4 analytics event
      if (typeof gtag === 'function') {
        gtag('event', 'heatmap_click', {
          keyword: keyword,
          keyword_type: type,
        });
      }
```

The `typeof gtag === 'function'` guard ensures it doesn't error if GA4 hasn't loaded (e.g., user declined cookies).

- [ ] **Step 2: Verify no console errors**

Run: `npm run dev` and visit `http://localhost:4321/heat/`
Open browser dev tools console. Click a keyword. Verify:
- No JavaScript errors in console
- If GA4 is loaded, the event appears in the Network tab (collect endpoint)
- If GA4 is not loaded (no consent), no errors thrown

- [ ] **Step 3: Commit**

```bash
git add src/pages/heat/index.astro
git commit -m "feat(heat): add GA4 heatmap_click event tracking"
```

---

### Task 4: Responsive Mobile Sizing

**Files:**
- Modify: `src/pages/heat/index.astro` (update `<style>` block)

- [ ] **Step 1: Fix the mobile font scaling**

The current `<style>` block has a media query using a CSS variable that isn't set. Replace the `@media` block in the `<style>` section:

Find:
```css
  @media (max-width: 640px) {
    .keyword-tag,
    .keyword-label {
      font-size: calc(var(--base-size, 14px) * 0.8) !important;
    }
  }
```

Replace with:
```css
  @media (max-width: 640px) {
    #word-cloud {
      gap: 8px 12px;
    }
  }
```

Then update the keyword rendering in the frontmatter's template section. For each keyword `<button>`, modify the inline `style` to include a CSS custom property for mobile scaling.

Find the `{keywords.map((kw) => (` block and update the `style` attributes:

For tags:
```
style={`font-size:${kw.size}px;--mob-size:${Math.round(kw.size * 0.8)}px;font-weight:${kw.weight};color:${kw.color};`}
```

For labels:
```
style={`font-size:${kw.size}px;--mob-size:${Math.round(kw.size * 0.8)}px;font-weight:${kw.weight};border-color:${kw.color};color:${kw.color};`}
```

Then update the media query to use the variable:
```css
  @media (max-width: 640px) {
    #word-cloud {
      gap: 8px 12px;
    }

    .keyword-tag,
    .keyword-label {
      font-size: var(--mob-size) !important;
    }
  }
```

- [ ] **Step 2: Test on mobile viewport**

Run: `npm run dev`, open browser dev tools, toggle device toolbar (mobile view).
Expected: Keywords are ~20% smaller on mobile. Cloud still wraps nicely. Result cards stack correctly.

- [ ] **Step 3: Commit**

```bash
git add src/pages/heat/index.astro
git commit -m "feat(heat): responsive mobile font scaling for word cloud"
```

---

### Task 5: Final Build Verification

**Files:**
- No file changes — verification only

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings related to the heat page.

- [ ] **Step 2: Verify page in preview**

Run: `npm run preview` and visit `http://localhost:4321/heat/`

Full checklist:
1. Word cloud renders with tags (plain text) and labels (pill/outline) visually distinct
2. Font sizes vary by frequency — most-used keywords are largest
3. Colors match the domain palette
4. Clicking a tag filters blog posts correctly
5. Clicking a label filters blog posts and shows matching projects/companies
6. Clicking active keyword deselects and hides results
7. URL updates with `?k=` param
8. Reloading with `?k=` pre-selects the keyword
9. Result count text is accurate
10. "Related Pages" heading only appears when project/company matches exist
11. Dark mode: toggle theme, verify cloud colors and cards look correct
12. Mobile: resize to mobile viewport, verify responsive sizing
13. View page source: confirm `<meta name="robots" content="noindex, nofollow">` is present
14. Confirm `/heat/` is NOT in any sitemap files
15. Confirm no links to `/heat/` exist in header or footer

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add src/pages/heat/index.astro
git commit -m "fix(heat): address verification issues"
```

Only commit if changes were made during verification.

---

### Task 6: Update README and CHANGELOG

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add entry to CHANGELOG.md**

Add to the top of CHANGELOG.md (below any existing header):

```markdown
## 2026-04-10

### Added
- Word heatmap page at `/heat/` — interactive keyword cloud visualizing blog tag and label frequency with click-to-filter results (noindex, hidden from navigation)
```

- [ ] **Step 2: Update README if it documents site pages or features**

Check if the README has a section listing pages or features. If so, add a brief mention of the heatmap page. If not, skip this step.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md README.md
git commit -m "docs: add word heatmap to changelog"
```
