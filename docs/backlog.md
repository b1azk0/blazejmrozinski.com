# Backlog

Open ideas and partially-scoped features. Each entry is resumable — enough context to pick up cold.

---

## Highlighted / pinned blog posts

**Status:** brainstorming paused 2026-04-15, resume later
**Goal:** drive reader attention to high-value posts (e.g. the psychometric analysis / IRT post, the WordPress Hetzner infrastructure series), not just "whatever shipped most recently".

### Decisions made so far

- **Placement (agreed):** Option D from the placement mockup — small "Featured" strip on the homepage *and* a full "Editor's Picks" band at the top of `/blog`. One source-of-truth list, rendered in both places.

### Open questions (in rough order)

1. **Homepage treatment: replace, coexist, or merge the "Writing" section?**
   Currently the homepage Writing section shows the 3 most recent posts. When Featured lands, does it:
   - **Replace** the latest-3 block (simplest, but loses "what's new" for returning visitors)
   - **Coexist** as a distinct second section labeled "Featured" + existing "Latest" (clearer, longer homepage) — *Claude's recommendation*
   - **Merge** into one mixed grid of featured + latest (compact, visually muddled)

2. **Curation mechanism:**
   - `featured: true` frontmatter flag on each post (distributed, easy edit-in-place)
   - Separate `src/data/featured.yml` listing slugs in order (centralized, supports explicit ordering)
   - Hybrid: frontmatter flag + optional `featured_order: N`

3. **How many posts?** Fixed top-N (e.g. exactly 3) or variable (whatever's flagged)?

4. **Series handling:** The WP Infra series is 7 posts (5 published, 3 drafts). Featuring the whole series means… pinning all 7 cards? Pinning Part 1 as a "series entry point"? Creating a dedicated series landing page? (Note: there's no series collection in the schema today — just convention via filename prefix `wp-infra-NN-*`.)

5. **Visual treatment:** Labeled ribbon ("Editor's Pick" / "Start Here"), distinct card background, a featured-post badge on the PostCard component?

6. **Dedicated `/start-here` page:** Deferred from placement decision, but worth revisiting as a companion to the homepage/blog-index strips — sometimes the best place to tell someone "read these 5, in this order" is a standalone page.

### Relevant files

- `src/pages/index.astro` — homepage Writing section around lines 260–290
- `src/pages/blog/index.astro` — blog index, currently sorts chronological and passes `featured={i === 0}` to PostCard (positional only)
- `src/components/PostCard.astro` — `featured?: boolean` prop currently just toggles title size (`text-2xl` vs `text-lg`)
- `src/content.config.ts` — blog schema; no `featured` / `pinned` field exists yet

### Next step on resume

Answer question 1 (homepage replace/coexist/merge), then proceed through questions 2–6, then write a proper design doc to `docs/superpowers/specs/YYYY-MM-DD-featured-posts-design.md` and hand off to implementation.
