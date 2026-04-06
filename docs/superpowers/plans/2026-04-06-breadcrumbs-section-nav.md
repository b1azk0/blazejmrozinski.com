# Breadcrumbs + Section Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add breadcrumbs to nested pages, a left sidebar TOC with scroll tracking to blog posts, and right-edge dot navigation to company/project pages.

**Architecture:** Three new Astro components (Breadcrumb, BlogSidebar, SectionDots). Heading data comes from Astro's built-in `render()` which returns `headings: MarkdownHeading[]` — no custom extraction needed. Scroll tracking via IntersectionObserver, re-initialized on view transitions. Both nav patterns hidden on mobile.

**Tech Stack:** Astro, Tailwind CSS, vanilla JS (IntersectionObserver)

---

### Task 1: Breadcrumb Component

**Files:**
- Create: `src/components/Breadcrumb.astro`

- [ ] **Step 1: Create Breadcrumb.astro**

```astro
---
interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  crumbs: Crumb[];
}

const { crumbs } = Astro.props;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: crumb.label,
    ...(crumb.href ? { item: `https://www.blazejmrozinski.com${crumb.href}` } : {}),
  })),
};
---

<nav aria-label="Breadcrumb" class="mb-4">
  <ol class="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
    {crumbs.map((crumb, i) => (
      <li class="flex items-center gap-1.5">
        {i > 0 && <span aria-hidden="true" class="text-muted-foreground/50">›</span>}
        {crumb.href ? (
          <a href={crumb.href} class="hover:text-foreground transition-colors">{crumb.label}</a>
        ) : (
          <span class="text-muted-foreground/70 truncate max-w-[200px] sm:max-w-none">{crumb.label}</span>
        )}
      </li>
    ))}
  </ol>
</nav>
<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Breadcrumb.astro
git commit -m "feat: add Breadcrumb component with JSON-LD schema"
```

---

### Task 2: Add Breadcrumbs to Blog, Company, and Project Pages

**Files:**
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/layouts/BlogPost.astro`
- Modify: `src/pages/work/[...slug].astro`
- Modify: `src/pages/projects/[...slug].astro`

- [ ] **Step 1: Add breadcrumb to BlogPost.astro**

Import Breadcrumb and add a `crumbs` prop. Insert breadcrumb above the `<header>` inside the `<article>`.

In the frontmatter, add:
```astro
import Breadcrumb from '@/components/Breadcrumb.astro';
```

Add `crumbs` to the Props interface:
```typescript
interface Props {
  title: string;
  description: string;
  date: Date;
  tags: string[];
  audience: string[];
  label?: string;
  crumbs: { label: string; href?: string }[];
}
```

Destructure it:
```typescript
const { title, description, date, tags, audience, label, crumbs } = Astro.props;
```

Insert before the existing `<header class="mb-8">`:
```astro
<Breadcrumb crumbs={crumbs} />
```

- [ ] **Step 2: Pass crumbs from blog/[...slug].astro**

In `src/pages/blog/[...slug].astro`, add the `crumbs` prop to the `<BlogPost>` component:

```astro
<BlogPost
  title={entry.data.title}
  description={entry.data.description}
  date={entry.data.date}
  tags={entry.data.tags}
  audience={entry.data.audience}
  label={entry.data.label}
  crumbs={[
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: entry.data.title },
  ]}
>
  <Content />
</BlogPost>
```

- [ ] **Step 3: Add breadcrumb to work/[...slug].astro**

Import Breadcrumb at the top of the frontmatter:
```astro
import Breadcrumb from '@/components/Breadcrumb.astro';
```

Replace the existing back-link:
```astro
<a href="/work" class="text-sm text-muted-foreground hover:text-foreground transition-colors">&larr; Work</a>
```

With:
```astro
<Breadcrumb crumbs={[
  { label: 'Home', href: '/' },
  { label: 'Work', href: '/work' },
  { label: entry.data.name },
]} />
```

- [ ] **Step 4: Add breadcrumb to projects/[...slug].astro**

Import Breadcrumb at the top of the frontmatter:
```astro
import Breadcrumb from '@/components/Breadcrumb.astro';
```

Replace the existing back-link:
```astro
<a href="/projects" class="text-sm text-muted-foreground hover:text-foreground transition-colors">&larr; Case Studies</a>
```

With:
```astro
<Breadcrumb crumbs={[
  { label: 'Home', href: '/' },
  { label: 'Case Studies', href: '/projects' },
  { label: entry.data.name },
]} />
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Clean build. Check rendered HTML for breadcrumb markup and JSON-LD on blog, work, and project pages.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/BlogPost.astro src/pages/blog/[...slug].astro src/pages/work/[...slug].astro src/pages/projects/[...slug].astro
git commit -m "feat: add breadcrumbs to blog, company, and case study pages"
```

---

### Task 3: BlogSidebar Component

**Files:**
- Create: `src/components/BlogSidebar.astro`

- [ ] **Step 1: Create BlogSidebar.astro**

```astro
---
interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface Props {
  headings: Heading[];
}

const { headings } = Astro.props;
const h2s = headings.filter((h) => h.depth === 2);
---

{h2s.length >= 3 && (
  <nav class="hidden md:block w-44 shrink-0" aria-label="Table of contents">
    <div class="sticky top-24">
      <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">On this page</p>
      <ul class="space-y-2 text-sm">
        {h2s.map((heading) => (
          <li>
            <a
              href={`#${heading.slug}`}
              class="sidebar-link block pl-3 border-l-2 border-transparent text-muted-foreground hover:text-foreground transition-colors leading-snug"
              data-heading-id={heading.slug}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </nav>
)}

<script>
  function initSidebarObserver() {
    const links = document.querySelectorAll<HTMLAnchorElement>('.sidebar-link');
    if (!links.length) return;

    const headingIds = Array.from(links).map((l) => l.dataset.headingId!);
    const headings = headingIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!headings.length) return;

    function setActive(id: string) {
      links.forEach((link) => {
        const isActive = link.dataset.headingId === id;
        link.classList.toggle('border-primary', isActive);
        link.classList.toggle('text-foreground', isActive);
        link.classList.toggle('border-transparent', !isActive);
        link.classList.toggle('text-muted-foreground', !isActive);
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));

    // Smooth scroll on click
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.dataset.headingId!;
        document.getElementById(id)?.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
        });
        history.replaceState(null, '', `#${id}`);
      });
    });

    return () => observer.disconnect();
  }

  let cleanup: (() => void) | undefined;

  function init() {
    cleanup?.();
    cleanup = initSidebarObserver();
  }

  init();
  document.addEventListener('astro:after-swap', init);
</script>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/BlogSidebar.astro
git commit -m "feat: add BlogSidebar component with scroll-tracking"
```

---

### Task 4: Integrate BlogSidebar into BlogPost Layout

**Files:**
- Modify: `src/layouts/BlogPost.astro`
- Modify: `src/pages/blog/[...slug].astro`

- [ ] **Step 1: Add headings prop and sidebar layout to BlogPost.astro**

Import BlogSidebar:
```astro
import BlogSidebar from '@/components/BlogSidebar.astro';
```

Add `headings` to the Props interface:
```typescript
interface Props {
  title: string;
  description: string;
  date: Date;
  tags: string[];
  audience: string[];
  label?: string;
  crumbs: { label: string; href?: string }[];
  headings: { depth: number; slug: string; text: string }[];
}
```

Destructure it:
```typescript
const { title, description, date, tags, audience, label, crumbs, headings } = Astro.props;
```

Determine whether to show sidebar (3+ h2 headings):
```typescript
const showSidebar = headings.filter((h) => h.depth === 2).length >= 3;
```

Replace the current `<article>` wrapper. The current code is:
```astro
<article class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
```

Replace with a flex wrapper that puts the sidebar alongside the article. The article's `max-w-3xl` stays unchanged:
```astro
<div class:list={["container mx-auto px-4 sm:px-6 py-12", showSidebar ? "max-w-5xl" : "max-w-3xl"]}>
  <div class:list={[showSidebar && "md:flex md:gap-8"]}>
    {showSidebar && <BlogSidebar headings={headings} />}
    <article class="max-w-3xl min-w-0">
```

And close both wrappers at the end. The current closing is:
```astro
    </article>
```

Replace with:
```astro
    </article>
  </div>
</div>
```

The Breadcrumb component should be inside the outer `<div>` but above the flex container, so it spans the full width. Move it above the `<div class:list={[showSidebar && "md:flex md:gap-8"]}>`.

- [ ] **Step 2: Pass headings from blog/[...slug].astro**

In the frontmatter, destructure headings from render:
```astro
const { Content, headings } = await render(entry);
```

Pass to BlogPost:
```astro
<BlogPost
  title={entry.data.title}
  description={entry.data.description}
  date={entry.data.date}
  tags={entry.data.tags}
  audience={entry.data.audience}
  label={entry.data.label}
  crumbs={[
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: entry.data.title },
  ]}
  headings={headings}
>
  <Content />
</BlogPost>
```

- [ ] **Step 3: Build and test locally**

Run: `npm run build && npm run preview`
Expected: Clean build. Open a blog post with 3+ h2s (e.g., wp-infra-01). Verify:
- Sidebar appears on the left on desktop
- Sidebar is hidden on mobile-width viewports
- Prose content width is unchanged
- Clicking a sidebar link scrolls to the heading
- Active heading highlights as you scroll
- Breadcrumb appears above the content

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BlogPost.astro src/pages/blog/[...slug].astro
git commit -m "feat: integrate sidebar TOC into blog post layout"
```

---

### Task 5: SectionDots Component

**Files:**
- Create: `src/components/SectionDots.astro`

- [ ] **Step 1: Create SectionDots.astro**

```astro
---
interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface Props {
  headings: Heading[];
}

const { headings } = Astro.props;
const h2s = headings.filter((h) => h.depth === 2);
---

{h2s.length >= 3 && (
  <nav class="hidden md:flex fixed right-4 lg:right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-3" aria-label="Page sections">
    {h2s.map((heading) => (
      <a
        href={`#${heading.slug}`}
        class="section-dot group flex items-center gap-2"
        data-heading-id={heading.slug}
        title={heading.text}
      >
        <span class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground whitespace-nowrap pointer-events-none">
          {heading.text}
        </span>
        <span class="dot-indicator block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 transition-all duration-200" />
      </a>
    ))}
  </nav>
)}

<script>
  function initDotsObserver() {
    const dots = document.querySelectorAll<HTMLAnchorElement>('.section-dot');
    if (!dots.length) return;

    const headingIds = Array.from(dots).map((d) => d.dataset.headingId!);
    const headings = headingIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!headings.length) return;

    function setActive(id: string) {
      dots.forEach((dot) => {
        const indicator = dot.querySelector('.dot-indicator')!;
        const isActive = dot.dataset.headingId === id;
        if (isActive) {
          indicator.classList.remove('w-1.5', 'h-1.5', 'bg-muted-foreground/40');
          indicator.classList.add('w-2', 'h-2', 'bg-primary');
        } else {
          indicator.classList.remove('w-2', 'h-2', 'bg-primary');
          indicator.classList.add('w-1.5', 'h-1.5', 'bg-muted-foreground/40');
        }
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const id = dot.dataset.headingId!;
        document.getElementById(id)?.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
        });
        history.replaceState(null, '', `#${id}`);
      });
    });

    return () => observer.disconnect();
  }

  let cleanup: (() => void) | undefined;

  function init() {
    cleanup?.();
    cleanup = initDotsObserver();
  }

  init();
  document.addEventListener('astro:after-swap', init);
</script>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SectionDots.astro
git commit -m "feat: add SectionDots component with scroll-tracking"
```

---

### Task 6: Integrate SectionDots into Company and Project Pages

**Files:**
- Modify: `src/pages/work/[...slug].astro`
- Modify: `src/pages/projects/[...slug].astro`

- [ ] **Step 1: Add SectionDots to work/[...slug].astro**

Import SectionDots and destructure headings from render:
```astro
import SectionDots from '@/components/SectionDots.astro';
```

Change:
```astro
const { Content } = await render(entry);
```
To:
```astro
const { Content, headings } = await render(entry);
```

Add `<SectionDots headings={headings} />` just inside the opening `<Base>` tag, before the container `<div>`:
```astro
<Base title={entry.data.metaTitle || entry.data.name} description={entry.data.description}>
  <JsonLd data={orgJsonLd} />
  <SectionDots headings={headings} />

  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
```

- [ ] **Step 2: Add SectionDots to projects/[...slug].astro**

Same pattern. Import SectionDots:
```astro
import SectionDots from '@/components/SectionDots.astro';
```

Change:
```astro
const { Content } = await render(entry);
```
To:
```astro
const { Content, headings } = await render(entry);
```

Add `<SectionDots headings={headings} />` just inside `<Base>`, before the container `<div>`:
```astro
<Base title={entry.data.metaTitle || entry.data.name} description={entry.data.description}>
  <JsonLd data={creativeWorkJsonLd} />
  <SectionDots headings={headings} />

  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
```

- [ ] **Step 3: Build and test locally**

Run: `npm run build && npm run preview`
Expected: Clean build. Open a company page with 3+ h2s (e.g., gyfted). Verify:
- Dots appear on the right edge on desktop
- Dots hidden on mobile
- Hovering a dot shows the section label
- Clicking scrolls to the section
- Active dot is larger and accent-colored
- Breadcrumb appears at the top

- [ ] **Step 4: Commit**

```bash
git add src/pages/work/[...slug].astro src/pages/projects/[...slug].astro
git commit -m "feat: add section dots to company and case study pages"
```

---

### Task 7: Final Verification and Cleanup

**Files:**
- No new files

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Clean build, 23 pages, no warnings.

- [ ] **Step 2: Visual verification with dev server**

Run: `npm run dev`

Check each page type:
1. Blog post (wp-infra-01): breadcrumb + left sidebar with scroll tracking
2. Blog post with <3 headings (if any): breadcrumb only, no sidebar
3. Company page (gyfted): breadcrumb + right dots with scroll tracking
4. Case study (prawomat): breadcrumb + right dots
5. Flat page (about): no breadcrumb, no nav
6. Homepage: no breadcrumb, no nav

Resize browser to mobile width — verify sidebar and dots are hidden.

- [ ] **Step 3: Commit any final adjustments**

If any tweaks were needed during verification, commit them:
```bash
git add -A
git commit -m "fix: polish breadcrumb and section nav styling"
```
