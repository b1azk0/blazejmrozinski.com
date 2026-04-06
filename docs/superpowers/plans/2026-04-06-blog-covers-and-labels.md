# Blog Cover Images & Label System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 7-label topic taxonomy with filter chips on `/blog` and programmatic cover image generation via satori at build time.

**Architecture:** Labels are a new enum field on the blog schema. A prebuild script uses satori + resvg to render HTML/CSS cover templates (with embedded SVG illustrations) to 1200×630 PNGs in `public/covers/`. The blog listing page uses a LabelFilter component for client-side filtering. Cover images double as OG social cards.

**Tech Stack:** Astro 6, satori, @resvg/resvg-js, Tailwind CSS 4, vanilla JS

**Spec:** `docs/superpowers/specs/2026-04-06-blog-covers-and-labels-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/labels.ts` | Create | Label config — names, accent colors, gradient stops |
| `src/lib/cover-svgs.ts` | Create | SVG illustration markup strings per label |
| `scripts/generate-covers.ts` | Create | Prebuild script — reads posts, renders covers via satori + resvg |
| `src/content.config.ts` | Modify | Add `label` enum field to blog schema |
| `src/components/LabelFilter.astro` | Create | Label filter chips with colored dots for `/blog` |
| `src/components/PostCard.astro` | Modify | Add label indicator near date |
| `src/layouts/BlogPost.astro` | Modify | Add cover image display + OG image meta |
| `src/pages/blog/index.astro` | Modify | Replace TagFilter with LabelFilter |
| `src/pages/blog/[...slug].astro` | Modify | Pass label to BlogPost layout |
| `package.json` | Modify | Add satori + resvg deps, prebuild script |
| `CHANGELOG.md` | Modify | Add entry |
| `README.md` | Modify | Document label system |

---

### Task 1: Install Dependencies and Create Label Config

**Files:**
- Modify: `package.json`
- Create: `src/lib/labels.ts`

- [ ] **Step 1: Install satori and resvg**

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com
npm install satori @resvg/resvg-js
```

- [ ] **Step 2: Add prebuild script to package.json**

In `package.json`, add the `generate-covers` and `prebuild` scripts. Change the `scripts` section from:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "astro": "astro"
}
```

To:

```json
"scripts": {
  "dev": "astro dev",
  "generate-covers": "node --import tsx scripts/generate-covers.ts",
  "prebuild": "npm run generate-covers",
  "build": "astro build",
  "preview": "astro preview",
  "astro": "astro"
}
```

Also install tsx as a dev dependency for running TypeScript scripts:

```bash
npm install -D tsx
```

- [ ] **Step 3: Create the labels config**

Create `src/lib/labels.ts`:

```typescript
export type LabelSlug =
  | 'infrastructure'
  | 'ai-automation'
  | 'product'
  | 'research'
  | 'systems-thinking'
  | 'operator-notes'
  | 'academic-work';

export interface LabelConfig {
  name: string;
  accent: string;
  gradient: [string, string, string];
}

export const labels: Record<LabelSlug, LabelConfig> = {
  'infrastructure': {
    name: 'Infrastructure',
    accent: '#78c8dc',
    gradient: ['#061e2e', '#0d3a4e', '#0a2e3e'],
  },
  'ai-automation': {
    name: 'AI & Automation',
    accent: '#b48cff',
    gradient: ['#120827', '#1e0d45', '#180a38'],
  },
  'product': {
    name: 'Product',
    accent: '#6cc890',
    gradient: ['#0a1f12', '#143826', '#0d2a1a'],
  },
  'research': {
    name: 'Research',
    accent: '#dcb478',
    gradient: ['#1f1208', '#3a2510', '#2b1a0a'],
  },
  'systems-thinking': {
    name: 'Systems Thinking',
    accent: '#e08080',
    gradient: ['#1a0a0a', '#3a1818', '#2a1010'],
  },
  'operator-notes': {
    name: 'Operator Notes',
    accent: '#c8c8c8',
    gradient: ['#0f0f0f', '#1c1c1c', '#141414'],
  },
  'academic-work': {
    name: 'Academic Work',
    accent: '#a0a0d0',
    gradient: ['#0d0a1f', '#1a1440', '#140f30'],
  },
};

export const labelSlugs = Object.keys(labels) as LabelSlug[];
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/labels.ts package.json package-lock.json
git commit -m "feat: add label config and install satori + resvg"
```

---

### Task 2: Create SVG Illustrations

**Files:**
- Create: `src/lib/cover-svgs.ts`

- [ ] **Step 1: Create the SVG illustration templates**

Each label gets a fixed SVG illustration. These are returned as SVG markup strings that will be embedded as data URIs in the cover template.

Create `src/lib/cover-svgs.ts`:

```typescript
import type { LabelSlug } from './labels.ts';

/**
 * Returns an SVG illustration string for a given label.
 * These are embedded as data URI images in the satori cover template.
 * Each SVG is designed at 280x240 viewBox, rendered on the right side of the cover.
 */
export function getCoverSvg(label: LabelSlug, accent: string): string {
  const generators: Record<LabelSlug, () => string> = {
    'infrastructure': () => infrastructureSvg(accent),
    'ai-automation': () => aiAutomationSvg(accent),
    'product': () => productSvg(accent),
    'research': () => researchSvg(accent),
    'systems-thinking': () => systemsThinkingSvg(accent),
    'operator-notes': () => operatorNotesSvg(accent),
    'academic-work': () => academicWorkSvg(accent),
  };
  return generators[label]();
}

function infrastructureSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="20" y="10" width="240" height="220" rx="8" fill="${c}08" stroke="${c}22" stroke-width="2"/>
    <rect x="40" y="28" width="200" height="40" rx="5" fill="${c}0d" stroke="${c}30" stroke-width="1.5"/>
    <circle cx="62" cy="48" r="5" fill="#2dd4a0"/>
    <circle cx="78" cy="48" r="5" fill="#2dd4a0" opacity="0.6"/>
    <rect x="160" y="40" width="60" height="16" rx="3" fill="${c}10" stroke="${c}20" stroke-width="1"/>
    <line x1="175" y1="42" x2="175" y2="54" stroke="${c}20" stroke-width="1"/>
    <line x1="190" y1="42" x2="190" y2="54" stroke="${c}20" stroke-width="1"/>
    <line x1="205" y1="42" x2="205" y2="54" stroke="${c}20" stroke-width="1"/>
    <rect x="40" y="78" width="200" height="40" rx="5" fill="${c}0d" stroke="${c}30" stroke-width="1.5"/>
    <circle cx="62" cy="98" r="5" fill="#f59e0b"/>
    <circle cx="78" cy="98" r="5" fill="#2dd4a0" opacity="0.6"/>
    <rect x="160" y="90" width="60" height="16" rx="3" fill="${c}10" stroke="${c}20" stroke-width="1"/>
    <line x1="175" y1="92" x2="175" y2="104" stroke="${c}20" stroke-width="1"/>
    <line x1="190" y1="92" x2="190" y2="104" stroke="${c}20" stroke-width="1"/>
    <rect x="40" y="128" width="200" height="40" rx="5" fill="${c}0d" stroke="${c}30" stroke-width="1.5"/>
    <circle cx="62" cy="148" r="5" fill="#2dd4a0"/>
    <circle cx="78" cy="148" r="5" fill="#2dd4a0"/>
    <rect x="160" y="140" width="60" height="16" rx="3" fill="${c}10" stroke="${c}20" stroke-width="1"/>
    <line x1="175" y1="142" x2="175" y2="154" stroke="${c}20" stroke-width="1"/>
    <line x1="190" y1="142" x2="190" y2="154" stroke="${c}20" stroke-width="1"/>
    <line x1="205" y1="142" x2="205" y2="154" stroke="${c}20" stroke-width="1"/>
    <rect x="40" y="178" width="200" height="40" rx="5" fill="${c}08" stroke="${c}1a" stroke-width="1.5"/>
    <text x="56" y="204" font-family="monospace" font-size="16" fill="${c}55">$ ssh root@</text>
  </svg>`;
}

function aiAutomationSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path d="M140 30 C95 30 60 55 60 90 C60 108 68 122 80 132 C76 145 80 162 96 172 C104 180 120 186 140 186 C160 186 176 180 184 172 C200 162 204 145 200 132 C212 122 220 108 220 90 C220 55 185 30 140 30Z" stroke="${c}35" stroke-width="2" fill="${c}06"/>
    <path d="M105 65 L120 90 L105 115" stroke="${c}22" stroke-width="1.5" fill="none"/>
    <path d="M160 65 L175 90 L160 115" stroke="${c}22" stroke-width="1.5" fill="none"/>
    <line x1="120" y1="90" x2="160" y2="90" stroke="${c}22" stroke-width="1.5"/>
    <path d="M112 140 L140 155 L168 140" stroke="${c}22" stroke-width="1.5" fill="none"/>
    <circle cx="105" cy="65" r="7" fill="${c}35" stroke="${c}66" stroke-width="1.5"/>
    <circle cx="160" cy="65" r="7" fill="${c}35" stroke="${c}66" stroke-width="1.5"/>
    <circle cx="120" cy="90" r="8" fill="${c}44" stroke="${c}77" stroke-width="1.5"/>
    <circle cx="160" cy="90" r="8" fill="${c}44" stroke="${c}77" stroke-width="1.5"/>
    <circle cx="105" cy="115" r="7" fill="${c}35" stroke="${c}66" stroke-width="1.5"/>
    <circle cx="160" cy="115" r="7" fill="${c}35" stroke="${c}66" stroke-width="1.5"/>
    <circle cx="140" cy="155" r="8" fill="${c}44" stroke="${c}77" stroke-width="1.5"/>
    <circle cx="120" cy="90" r="18" stroke="${c}15" stroke-width="1" fill="none"/>
    <circle cx="140" cy="155" r="22" stroke="${c}10" stroke-width="1" fill="none"/>
    <line x1="220" y1="90" x2="255" y2="90" stroke="${c}28" stroke-width="1.5" stroke-dasharray="5 4"/>
    <line x1="60" y1="90" x2="25" y2="90" stroke="${c}28" stroke-width="1.5" stroke-dasharray="5 4"/>
    <circle cx="255" cy="90" r="5" fill="${c}35"/>
    <circle cx="25" cy="90" r="5" fill="${c}35"/>
  </svg>`;
}

function researchSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <line x1="40" y1="200" x2="260" y2="200" stroke="${c}35" stroke-width="2"/>
    <line x1="40" y1="200" x2="40" y2="20" stroke="${c}35" stroke-width="2"/>
    <line x1="40" y1="150" x2="260" y2="150" stroke="${c}0a" stroke-width="1"/>
    <line x1="40" y1="100" x2="260" y2="100" stroke="${c}0a" stroke-width="1"/>
    <line x1="40" y1="50" x2="260" y2="50" stroke="${c}0a" stroke-width="1"/>
    <circle cx="55" cy="175" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="75" cy="162" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="90" cy="168" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="108" cy="135" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="128" cy="125" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="145" cy="138" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="162" cy="105" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="180" cy="92" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="198" cy="100" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="218" cy="72" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="235" cy="55" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="250" cy="42" r="6.5" fill="${c}66" stroke="${c}99" stroke-width="1.5"/>
    <line x1="48" y1="182" x2="256" y2="35" stroke="#f59e0b88" stroke-width="2" stroke-dasharray="8 5"/>
    <path d="M48 172 L256 22 L256 48 L48 195 Z" fill="${c}06"/>
    <text x="140" y="222" font-family="monospace" font-size="12" fill="${c}40" text-anchor="middle">n = 20,000</text>
  </svg>`;
}

function productSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="10" y="10" width="260" height="220" rx="8" fill="${c}06" stroke="${c}28" stroke-width="2"/>
    <rect x="10" y="10" width="260" height="30" rx="8" fill="${c}0a"/>
    <rect x="10" y="32" width="260" height="8" fill="${c}0a"/>
    <circle cx="28" cy="25" r="5" fill="#ef4444" opacity="0.4"/>
    <circle cx="44" cy="25" r="5" fill="#eab308" opacity="0.4"/>
    <circle cx="60" cy="25" r="5" fill="#22c55e" opacity="0.4"/>
    <rect x="100" y="18" width="150" height="14" rx="7" fill="${c}0a" stroke="${c}15" stroke-width="1"/>
    <rect x="24" y="52" width="36" height="7" rx="3" fill="${c}22"/>
    <rect x="68" y="52" width="28" height="7" rx="3" fill="${c}15"/>
    <rect x="104" y="52" width="32" height="7" rx="3" fill="${c}15"/>
    <rect x="144" y="52" width="24" height="7" rx="3" fill="${c}15"/>
    <rect x="24" y="72" width="110" height="10" rx="3" fill="${c}22"/>
    <rect x="24" y="88" width="80" height="5" rx="2" fill="${c}10"/>
    <rect x="24" y="98" width="90" height="5" rx="2" fill="${c}10"/>
    <rect x="24" y="114" width="56" height="14" rx="7" fill="${c}28" stroke="${c}40" stroke-width="1"/>
    <rect x="160" y="72" width="96" height="56" rx="5" fill="${c}0a" stroke="${c}15" stroke-width="1"/>
    <line x1="160" y1="72" x2="256" y2="128" stroke="${c}08" stroke-width="1"/>
    <line x1="256" y1="72" x2="160" y2="128" stroke="${c}08" stroke-width="1"/>
    <rect x="24" y="145" width="70" height="70" rx="5" fill="${c}0a" stroke="${c}15" stroke-width="1"/>
    <rect x="102" y="145" width="70" height="70" rx="5" fill="${c}0a" stroke="${c}15" stroke-width="1"/>
    <rect x="180" y="145" width="70" height="70" rx="5" fill="${c}0a" stroke="${c}15" stroke-width="1"/>
    <rect x="30" y="153" width="54" height="5" rx="2" fill="${c}15"/>
    <rect x="30" y="164" width="40" height="4" rx="1" fill="${c}0a"/>
    <rect x="108" y="153" width="54" height="5" rx="2" fill="${c}15"/>
    <rect x="108" y="164" width="44" height="4" rx="1" fill="${c}0a"/>
    <rect x="186" y="153" width="54" height="5" rx="2" fill="${c}15"/>
    <rect x="186" y="164" width="36" height="4" rx="1" fill="${c}0a"/>
  </svg>`;
}

function systemsThinkingSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="100" y="80" width="80" height="44" rx="6" fill="${c}15" stroke="${c}48" stroke-width="2"/>
    <rect x="112" y="94" width="56" height="6" rx="2" fill="${c}28"/>
    <rect x="118" y="106" width="40" height="4" rx="1.5" fill="${c}18"/>
    <rect x="108" y="8" width="64" height="34" rx="5" fill="${c}0a" stroke="${c}28" stroke-width="1.5"/>
    <rect x="118" y="18" width="44" height="5" rx="2" fill="${c}20"/>
    <rect x="108" y="162" width="64" height="34" rx="5" fill="${c}0a" stroke="${c}28" stroke-width="1.5"/>
    <rect x="118" y="172" width="44" height="5" rx="2" fill="${c}20"/>
    <rect x="8" y="85" width="64" height="34" rx="5" fill="${c}0a" stroke="${c}28" stroke-width="1.5"/>
    <rect x="18" y="95" width="44" height="5" rx="2" fill="${c}20"/>
    <rect x="208" y="85" width="64" height="34" rx="5" fill="${c}0a" stroke="${c}28" stroke-width="1.5"/>
    <rect x="218" y="95" width="44" height="5" rx="2" fill="${c}20"/>
    <rect x="22" y="170" width="56" height="30" rx="5" fill="${c}06" stroke="${c}20" stroke-width="1.2"/>
    <rect x="30" y="179" width="38" height="4" rx="1.5" fill="${c}15"/>
    <rect x="200" y="170" width="56" height="30" rx="5" fill="${c}06" stroke="${c}20" stroke-width="1.2"/>
    <rect x="208" y="179" width="38" height="4" rx="1.5" fill="${c}15"/>
    <line x1="140" y1="42" x2="140" y2="80" stroke="${c}30" stroke-width="2"/>
    <line x1="140" y1="124" x2="140" y2="162" stroke="${c}30" stroke-width="2"/>
    <line x1="72" y1="102" x2="100" y2="102" stroke="${c}30" stroke-width="2"/>
    <line x1="180" y1="102" x2="208" y2="102" stroke="${c}30" stroke-width="2"/>
    <line x1="100" y1="124" x2="60" y2="170" stroke="${c}20" stroke-width="1.5" stroke-dasharray="5 3"/>
    <line x1="180" y1="124" x2="220" y2="170" stroke="${c}20" stroke-width="1.5" stroke-dasharray="5 3"/>
    <path d="M 272 102 Q 276 145 256 188" stroke="${c}18" stroke-width="1.5" fill="none" stroke-dasharray="5 3"/>
  </svg>`;
}

function operatorNotesSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="10" y="10" width="260" height="220" rx="8" fill="${c}05" stroke="${c}20" stroke-width="2"/>
    <rect x="10" y="10" width="260" height="28" rx="8" fill="${c}08"/>
    <rect x="10" y="30" width="260" height="8" fill="${c}08"/>
    <circle cx="28" cy="24" r="5" fill="#ef4444" opacity="0.35"/>
    <circle cx="44" cy="24" r="5" fill="#eab308" opacity="0.35"/>
    <circle cx="60" cy="24" r="5" fill="#22c55e" opacity="0.35"/>
    <text x="24" y="60" font-family="monospace" font-size="13" fill="#22c55e88">✓</text>
    <text x="42" y="60" font-family="monospace" font-size="12" fill="${c}40">deploy v2.4.1 completed</text>
    <text x="24" y="82" font-family="monospace" font-size="13" fill="#22c55e88">✓</text>
    <text x="42" y="82" font-family="monospace" font-size="12" fill="${c}40">ssl cert renewed (90d)</text>
    <text x="24" y="104" font-family="monospace" font-size="13" fill="#ef444488">✗</text>
    <text x="42" y="104" font-family="monospace" font-size="12" fill="#ef444455">ssh: connection refused</text>
    <text x="24" y="126" font-family="monospace" font-size="13" fill="#eab30888">⚠</text>
    <text x="42" y="126" font-family="monospace" font-size="12" fill="#eab30855">disk usage 87% /var/log</text>
    <text x="24" y="148" font-family="monospace" font-size="13" fill="#22c55e88">✓</text>
    <text x="42" y="148" font-family="monospace" font-size="12" fill="${c}40">firewall rules updated</text>
    <text x="24" y="170" font-family="monospace" font-size="13" fill="#22c55e88">✓</text>
    <text x="42" y="170" font-family="monospace" font-size="12" fill="${c}40">backup job 03:00 ok</text>
    <text x="24" y="200" font-family="monospace" font-size="12" fill="${c}50">$</text>
    <rect x="36" y="190" width="10" height="16" fill="${c}30"/>
  </svg>`;
}

function academicWorkSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="45" y="14" width="190" height="216" rx="6" fill="${c}06" stroke="${c}15" stroke-width="1"/>
    <rect x="25" y="5" width="190" height="216" rx="6" fill="${c}0a" stroke="${c}28" stroke-width="2"/>
    <rect x="42" y="22" width="120" height="10" rx="3" fill="${c}28"/>
    <rect x="42" y="38" width="90" height="6" rx="2" fill="${c}15"/>
    <line x1="42" y1="52" x2="198" y2="52" stroke="${c}12" stroke-width="1"/>
    <rect x="42" y="62" width="150" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="72" width="140" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="82" width="144" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="92" width="110" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="110" width="60" height="6" rx="2" fill="${c}20"/>
    <rect x="42" y="124" width="150" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="134" width="136" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="144" width="144" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="154" width="120" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="164" width="140" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="174" width="130" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="38" y="122" width="4" height="40" rx="2" fill="${c}28"/>
    <circle cx="190" cy="20" r="14" fill="#22c55e15" stroke="#22c55e35" stroke-width="1.5"/>
    <path d="M184 20 L188 24 L197 15" stroke="#22c55e55" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cover-svgs.ts
git commit -m "feat: add SVG illustration templates for cover images"
```

---

### Task 3: Create Cover Generation Script

**Files:**
- Create: `scripts/generate-covers.ts`

- [ ] **Step 1: Create the cover generation script**

This script reads blog post frontmatter, generates covers using satori, and outputs PNGs to `public/covers/`.

Create `scripts/generate-covers.ts`:

```typescript
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { labels } from '../src/lib/labels.ts';
import { getCoverSvg } from '../src/lib/cover-svgs.ts';
import type { LabelSlug } from '../src/lib/labels.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const BLOG_DIR = join(ROOT, 'src/content/blog');
const OUTPUT_DIR = join(ROOT, 'public/covers');
const FONT_PATH = join(ROOT, 'public/fonts/Geist-Variable.woff2');

const WIDTH = 1200;
const HEIGHT = 630;

function parseFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm: Record<string, any> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return fm;
}

function getPostFiles(): Array<{ slug: string; title: string; label: LabelSlug }> {
  if (!existsSync(BLOG_DIR)) return [];
  const files = readdirSync(BLOG_DIR, { recursive: true })
    .filter((f) => String(f).endsWith('.md'));

  const posts: Array<{ slug: string; title: string; label: LabelSlug }> = [];
  for (const file of files) {
    const filePath = join(BLOG_DIR, String(file));
    const content = readFileSync(filePath, 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm.label || !fm.title) continue;
    if (fm.status === 'draft') continue;
    if (!(fm.label in labels)) continue;
    const slug = basename(String(file), '.md');
    posts.push({ slug, title: fm.title, label: fm.label as LabelSlug });
  }
  return posts;
}

function buildCoverElement(title: string, label: LabelSlug) {
  const config = labels[label];
  const svgMarkup = getCoverSvg(label, config.accent);
  const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svgMarkup).toString('base64')}`;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        background: `linear-gradient(145deg, ${config.gradient[0]}, ${config.gradient[1]} 60%, ${config.gradient[2]})`,
        padding: '56px',
        position: 'relative',
        fontFamily: 'Geist',
      },
      children: [
        // Illustration on the right
        {
          type: 'img',
          props: {
            src: svgDataUri,
            width: 420,
            height: 360,
            style: {
              position: 'absolute',
              right: '30px',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.85,
            },
          },
        },
        // Text content on the left
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              width: '60%',
              zIndex: 1,
            },
            children: [
              // Label badge
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          padding: '6px 16px',
                          border: `1.5px solid ${config.accent}33`,
                          borderRadius: '6px',
                          background: `${config.accent}0d`,
                          fontSize: '16px',
                          color: `${config.accent}cc`,
                          letterSpacing: '3px',
                          textTransform: 'uppercase',
                          fontWeight: 500,
                        },
                        children: config.name,
                      },
                    },
                  ],
                },
              },
              // Title + URL
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '42px',
                          fontWeight: 700,
                          color: '#f0f0f0',
                          lineHeight: 1.25,
                        },
                        children: title,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '18px',
                          color: `${config.accent}88`,
                          marginTop: '16px',
                        },
                        children: 'blazejmrozinski.com',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function main() {
  const posts = getPostFiles();
  if (posts.length === 0) {
    console.log('[generate-covers] No blog posts with labels found. Skipping.');
    return;
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const fontData = readFileSync(FONT_PATH);

  console.log(`[generate-covers] Generating ${posts.length} cover image(s)...`);

  for (const post of posts) {
    const element = buildCoverElement(post.title, post.label);

    const svg = await satori(element as any, {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Geist', data: fontData, weight: 400, style: 'normal' },
        { name: 'Geist', data: fontData, weight: 700, style: 'normal' },
      ],
    });

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: WIDTH },
    });
    const png = resvg.render().asPng();

    const outPath = join(OUTPUT_DIR, `${post.slug}.png`);
    writeFileSync(outPath, png);
    console.log(`  ✓ ${post.slug}.png`);
  }

  console.log('[generate-covers] Done.');
}

main().catch((err) => {
  console.error('[generate-covers] Error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify the script runs (with no posts, it should skip gracefully)**

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com && npm run generate-covers
```

Expected: `[generate-covers] No blog posts with labels found. Skipping.` (blog directory is empty)

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-covers.ts
git commit -m "feat: add cover image generation script using satori + resvg"
```

---

### Task 4: Add Label to Blog Schema and Create Test Post

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/content/blog/test-cover-post.md`

- [ ] **Step 1: Add label enum to blog schema**

In `src/content.config.ts`, add the `label` field to the blog schema. Change:

```typescript
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    audience: z.array(z.string()).default([]),
    format: z.string().optional(),
    description: z.string(),
    status: z.enum(['draft', 'published']).default('published'),
    safety_review: z.boolean().default(false),
  }),
});
```

To:

```typescript
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    audience: z.array(z.string()).default([]),
    format: z.string().optional(),
    description: z.string(),
    status: z.enum(['draft', 'published']).default('published'),
    safety_review: z.boolean().default(false),
    label: z.enum([
      'infrastructure',
      'ai-automation',
      'product',
      'research',
      'systems-thinking',
      'operator-notes',
      'academic-work',
    ]).optional(),
  }),
});
```

- [ ] **Step 2: Create a test blog post with a label**

Create `src/content/blog/test-cover-post.md`:

```markdown
---
title: "Why I Ditched Managed Hosting for Bare Metal"
date: 2026-04-01
tags: [devops-reality, wordpress, hetzner]
audience: [founders-operators]
format: lesson-from-trenches
description: "Moving from managed WordPress hosting to a self-built LEMP stack on Hetzner."
status: published
label: infrastructure
---

This is a test post to verify cover image generation and label filtering. Replace with real content.
```

- [ ] **Step 3: Generate the cover image for the test post**

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com && npm run generate-covers
```

Expected:
```
[generate-covers] Generating 1 cover image(s)...
  ✓ test-cover-post.png
[generate-covers] Done.
```

Verify the file exists:
```bash
ls -la public/covers/test-cover-post.png
```

Expected: A PNG file, roughly 30-100KB.

- [ ] **Step 4: Add public/covers/ to .gitignore**

These are generated files — they should not be committed. Add to `.gitignore`:

```
# Generated cover images
public/covers/
```

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/blog/test-cover-post.md .gitignore
git commit -m "feat: add label field to blog schema, create test post"
```

---

### Task 5: Create LabelFilter Component

**Files:**
- Create: `src/components/LabelFilter.astro`

- [ ] **Step 1: Create the LabelFilter component**

This replaces TagFilter on the blog listing page. Each chip has a colored dot matching the label's accent color.

Create `src/components/LabelFilter.astro`:

```astro
---
import { labels, type LabelSlug } from '@/lib/labels';

interface Props {
  activeLabel?: string;
}

const { activeLabel } = Astro.props;
const labelEntries = Object.entries(labels) as [LabelSlug, typeof labels[LabelSlug]][];
---

<div class="flex gap-2 flex-wrap mb-6" id="label-filter">
  <a
    href="/blog"
    class:list={[
      'text-xs px-3 py-1.5 rounded-full transition-colors font-medium',
      !activeLabel
        ? 'bg-primary text-primary-foreground'
        : 'bg-secondary text-secondary-foreground hover:bg-accent',
    ]}
    data-label="all"
  >
    All
  </a>
  {labelEntries.map(([slug, config]) => (
    <a
      href={`/blog?label=${slug}`}
      class:list={[
        'text-xs px-3 py-1.5 rounded-full transition-colors font-medium inline-flex items-center gap-1.5',
        activeLabel === slug
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-accent',
      ]}
      data-label={slug}
    >
      <span
        class="w-2 h-2 rounded-full shrink-0"
        style={`background-color: ${config.accent};`}
        aria-hidden="true"
      />
      {config.name}
    </a>
  ))}
</div>

<script>
  function filterByLabel() {
    const params = new URLSearchParams(window.location.search);
    const activeLabel = params.get('label');
    const articles = document.querySelectorAll<HTMLElement>('[data-post-label]');
    const filterLinks = document.querySelectorAll<HTMLAnchorElement>('#label-filter a');

    filterLinks.forEach((link) => {
      const label = link.dataset.label;
      const isActive = (!activeLabel && label === 'all') || activeLabel === label;
      link.classList.toggle('bg-primary', isActive);
      link.classList.toggle('text-primary-foreground', isActive);
      link.classList.toggle('bg-secondary', !isActive);
      link.classList.toggle('text-secondary-foreground', !isActive);
    });

    articles.forEach((article) => {
      if (!activeLabel) {
        article.style.display = '';
        return;
      }
      article.style.display = article.dataset.postLabel === activeLabel ? '' : 'none';
    });
  }

  filterByLabel();
  document.addEventListener('astro:after-swap', filterByLabel);
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LabelFilter.astro
git commit -m "feat: add LabelFilter component with colored dots"
```

---

### Task 6: Update Blog Listing Page

**Files:**
- Modify: `src/pages/blog/index.astro`

- [ ] **Step 1: Replace TagFilter with LabelFilter and add label data attribute**

Replace the entire content of `src/pages/blog/index.astro` with:

```astro
---
import Base from '@/layouts/Base.astro';
import PostCard from '@/components/PostCard.astro';
import LabelFilter from '@/components/LabelFilter.astro';
import { getCollection } from 'astro:content';

const allPosts = await getCollection('blog', ({ data }) => data.status === 'published');
const posts = allPosts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

const hasLabels = posts.some((p) => p.data.label);
---

<Base title="Blog" description="Writing on psychometrics, product building, growth engineering, and technology.">
  <div class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <h1 class="text-4xl font-bold tracking-tight mb-8" data-animate>Blog</h1>

    {hasLabels && <LabelFilter />}

    {posts.length > 0 ? (
      <div class="grid gap-4">
        {posts.map((post, i) => (
          <div data-animate data-delay={String(Math.min(i + 1, 5))} data-post-label={post.data.label || ''}>
            <PostCard
              title={post.data.title}
              description={post.data.description}
              date={post.data.date}
              tags={post.data.tags}
              slug={post.id}
              featured={i === 0}
              label={post.data.label}
            />
          </div>
        ))}
      </div>
    ) : (
      <div class="text-center py-8" data-animate>
        <p class="text-muted-foreground mb-4">No posts yet. Check back soon.</p>
        <a href="/rss.xml" class="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          Subscribe via RSS
        </a>
      </div>
    )}
  </div>
</Base>
```

Key changes from original:
- `LabelFilter` replaces `TagFilter`
- `data-post-label` attribute on each post wrapper (for client-side filtering)
- `label` prop passed to `PostCard`
- `hasLabels` check — only show filter if any posts have labels

- [ ] **Step 2: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat: replace tag filter with label filter on blog listing"
```

---

### Task 7: Update PostCard with Label Indicator

**Files:**
- Modify: `src/components/PostCard.astro`

- [ ] **Step 1: Add label prop and indicator**

Replace the entire content of `src/components/PostCard.astro` with:

```astro
---
import { labels, type LabelSlug } from '@/lib/labels';

interface Props {
  title: string;
  description: string;
  date: Date;
  tags: string[];
  slug: string;
  featured?: boolean;
  label?: string;
}

const { title, description, date, tags, slug, featured = false, label } = Astro.props;

const formattedDate = date.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const labelConfig = label && label in labels ? labels[label as LabelSlug] : null;
---
<article
  class="group rounded-lg border bg-card text-card-foreground p-6 hover:shadow-md transition-all"
  data-tags={tags.join(',')}
>
  <a href={`/blog/${slug}`} class="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
    <h3 class:list={[
      'font-bold tracking-tight group-hover:text-primary/80 transition-colors',
      featured ? 'text-2xl' : 'text-lg',
    ]}>
      {title}
    </h3>
  </a>
  <p class="text-sm text-muted-foreground mt-2 leading-relaxed">
    {description}
  </p>
  <div class="flex items-center gap-3 mt-4 flex-wrap">
    <time class="text-xs text-muted-foreground" datetime={date.toISOString()}>
      {formattedDate}
    </time>
    {labelConfig && (
      <span class="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <span
          class="w-1.5 h-1.5 rounded-full shrink-0"
          style={`background-color: ${labelConfig.accent};`}
          aria-hidden="true"
        />
        {labelConfig.name}
      </span>
    )}
    {tags.length > 0 && (
      <div class="flex gap-1.5 flex-wrap">
        {tags.map((tag) => (
          <span class="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    )}
  </div>
</article>
```

Key changes from original:
- Added `label` prop (optional)
- Added `labelConfig` lookup
- Added label indicator with colored dot between date and tags
- Tags are now `<span>` instead of `<a>` (labels handle filtering now, tags are informational)

- [ ] **Step 2: Commit**

```bash
git add src/components/PostCard.astro
git commit -m "feat: add label indicator to PostCard"
```

---

### Task 8: Update BlogPost Layout with Cover Image and OG

**Files:**
- Modify: `src/layouts/BlogPost.astro`

- [ ] **Step 1: Add cover image and OG support**

Replace the entire content of `src/layouts/BlogPost.astro` with:

```astro
---
import Base from "./Base.astro";
import JsonLd from "@/components/JsonLd.astro";
import { labels, type LabelSlug } from '@/lib/labels';

interface Props {
  title: string;
  description: string;
  date: Date;
  tags: string[];
  audience: string[];
  label?: string;
}

const { title, description, date, tags, audience, label } = Astro.props;

const formattedDate = date.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const slug = Astro.params.slug;
const canonicalUrl = `https://blazejmrozinski.com/blog/${slug}/`;
const coverUrl = label ? `/covers/${slug}.png` : undefined;
const labelConfig = label && label in labels ? labels[label as LabelSlug] : null;

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  datePublished: date.toISOString(),
  dateModified: date.toISOString(),
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': canonicalUrl,
  },
  author: {
    '@type': 'Person',
    name: 'Blazej Mrozinski',
    url: 'https://blazejmrozinski.com/about',
  },
  publisher: {
    '@type': 'Person',
    name: 'Blazej Mrozinski',
    url: 'https://blazejmrozinski.com',
  },
  keywords: tags.join(', '),
  ...(coverUrl ? { image: `https://blazejmrozinski.com${coverUrl}` } : {}),
};
---

<Base title={title} description={description} ogType="article" ogImage={coverUrl}>
  <JsonLd data={articleJsonLd} />

  <article class="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <header class="mb-8">
      <h1 class="text-4xl font-bold tracking-tight mb-4">{title}</h1>
      <div class="flex items-center gap-4 text-muted-foreground text-sm">
        <a href="/about" class="hover:text-foreground transition-colors">Blazej Mrozinski</a>
        <span>&middot;</span>
        <time datetime={date.toISOString()}>{formattedDate}</time>
        {labelConfig && (
          <>
            <span>&middot;</span>
            <span class="inline-flex items-center gap-1.5">
              <span
                class="w-1.5 h-1.5 rounded-full"
                style={`background-color: ${labelConfig.accent};`}
                aria-hidden="true"
              />
              {labelConfig.name}
            </span>
          </>
        )}
      </div>
      {tags.length > 0 && (
        <div class="flex gap-2 mt-4 flex-wrap">
          {tags.map((tag) => (
            <span class="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </header>

    {coverUrl && (
      <div class="mb-10 -mx-4 sm:mx-0">
        <img
          src={coverUrl}
          alt=""
          class="w-full rounded-none sm:rounded-lg"
          loading="eager"
          width="1200"
          height="630"
        />
      </div>
    )}

    <div class="prose prose-neutral dark:prose-invert max-w-none">
      <slot />
    </div>
  </article>
</Base>
```

Key changes from original:
- Added `label` prop
- Computes `coverUrl` from slug + label presence
- Passes `ogImage={coverUrl}` to Base layout (existing SEO component handles OG meta)
- Displays cover image below header when present
- Label indicator shown in header metadata
- Tags are `<span>` instead of `<a>` (consistent with PostCard change)
- Added `image` to Article JSON-LD when cover exists

- [ ] **Step 2: Commit**

```bash
git add src/layouts/BlogPost.astro
git commit -m "feat: add cover image and label to BlogPost layout"
```

---

### Task 9: Update Blog Slug Page to Pass Label

**Files:**
- Modify: `src/pages/blog/[...slug].astro`

- [ ] **Step 1: Pass label to BlogPost**

Replace the entire content of `src/pages/blog/[...slug].astro` with:

```astro
---
import BlogPost from '@/layouts/BlogPost.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => data.status === 'published');
  return posts.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<BlogPost
  title={entry.data.title}
  description={entry.data.description}
  date={entry.data.date}
  tags={entry.data.tags}
  audience={entry.data.audience}
  label={entry.data.label}
>
  <Content />
</BlogPost>
```

Only change: added `label={entry.data.label}`.

- [ ] **Step 2: Commit**

```bash
git add src/pages/blog/[...slug].astro
git commit -m "feat: pass label from blog post to layout"
```

---

### Task 10: Full Build Verification

**Files:** (none — verification only)

- [ ] **Step 1: Run the full build (prebuild → build)**

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com && npm run build
```

Expected:
1. `prebuild` runs `generate-covers` first — generates `test-cover-post.png`
2. Astro build completes successfully — all pages including `/blog/test-cover-post/`

- [ ] **Step 2: Preview and verify**

```bash
cd /Users/bajzel/GitHub/blazejmrozinski.com && npm run preview
```

Open in browser and verify:
1. `http://localhost:4321/blog` — shows the test post with label filter at top, label indicator on card
2. Click "Infrastructure" label chip — filters to only the test post
3. Click "All" — shows all posts
4. `http://localhost:4321/blog/test-cover-post` — shows cover image below title, label in header
5. View page source — `og:image` meta tag points to `/covers/test-cover-post.png`

Stop the preview server.

---

### Task 11: Update Documentation

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`

- [ ] **Step 1: Add CHANGELOG entry**

Add a new entry at the top of `CHANGELOG.md`, after the `# Changelog` heading:

```markdown
## [0.5.0] — 2026-04-06

### Added
- Blog label system with 7 topic categories (Infrastructure, AI & Automation, Product, Research, Systems Thinking, Operator Notes, Academic Work)
- Label filter chips with colored dots on /blog listing page
- Programmatic cover image generation via satori + resvg at build time
- Per-label SVG illustrations (server rack, brain, scatter plot, wireframe, flowchart, terminal, paper)
- Cover images used as OG social cards (1200×630)
- Label indicator on PostCard and BlogPost layout
```

- [ ] **Step 2: Update README with label documentation**

Add a new section after "Adding a Photo Album" and before "Environment Variables":

```markdown
## Blog Labels

Each blog post can have a `label` field in its frontmatter — one of 7 topic categories:

| Label | Slug | Description |
|-------|------|-------------|
| Infrastructure | `infrastructure` | DevOps, servers, hosting |
| AI & Automation | `ai-automation` | AI workflows, LLM tooling |
| Product | `product` | Product thinking, specs |
| Research | `research` | Quantitative methods, experiments |
| Systems Thinking | `systems-thinking` | Knowledge systems, processes |
| Operator Notes | `operator-notes` | Lessons and reflections |
| Academic Work | `academic-work` | Thesis, peer review, methodology |

Add `label: infrastructure` (or any slug) to a post's frontmatter. Labels power the filter chips on `/blog` and determine the auto-generated cover image.

### Cover Images

Cover images are generated automatically at build time from the post's title + label. Each label has a unique color palette and SVG illustration. The same image serves as the OG social card.

- **Generated by:** `scripts/generate-covers.ts` (runs as `prebuild` before `astro build`)
- **Output:** `public/covers/{post-slug}.png` (1200×630, gitignored)
- **Dependencies:** satori, @resvg/resvg-js, tsx
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md README.md
git commit -m "docs: add blog labels and cover images to changelog and readme"
```
