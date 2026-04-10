import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ACCENT_PALETTE = [
  '#a78bfa', // purple
  '#60a5fa', // blue
  '#f59e0b', // amber
  '#34d399', // green
  '#f472b6', // pink
  '#22d3ee', // cyan
  '#fb923c', // orange
  '#a3e635', // lime
];

export interface ReleaseChanges {
  added: string[];
  changed: string[];
  fixed: string[];
  removed: string[];
}

export interface Release {
  version: string;
  date: string;
  title: string;
  description: string;
  isMajor: boolean;
  accentColor: string;
  changes: ReleaseChanges;
}

function deriveTitle(changes: ReleaseChanges): string {
  const first = changes.added[0] || changes.changed[0] || changes.fixed[0] || changes.removed[0] || '';
  const dash = first.indexOf(' — ');
  if (dash > 0) return first.slice(0, dash);
  const period = first.indexOf('. ');
  if (period > 0) return first.slice(0, period);
  if (first.length > 60) return first.slice(0, 60).replace(/\s+\S*$/, '') + '…';
  return first;
}

function stripInlineMarkdown(text: string): string {
  return text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function deriveDescription(changes: ReleaseChanges): string {
  const first = changes.added[0] || changes.changed[0] || changes.fixed[0] || changes.removed[0] || '';
  const period = first.indexOf('. ');
  const raw = period > 0 ? first.slice(0, period + 1) : first;
  return stripInlineMarkdown(raw);
}

function parseChanges(block: string): ReleaseChanges {
  const changes: ReleaseChanges = { added: [], changed: [], fixed: [], removed: [] };
  let currentCategory: string | null = null;

  for (const line of block.split('\n')) {
    const categoryMatch = line.match(/^### (\w+)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].toLowerCase();
      continue;
    }
    if (currentCategory && line.startsWith('- ')) {
      const item = line.slice(2).trim();
      if (currentCategory in changes) {
        changes[currentCategory as keyof ReleaseChanges].push(item);
      } else {
        changes.added.push(item);
      }
    }
  }

  return changes;
}

let _cache: Release[] | null = null;

export function getAllReleases(): Release[] {
  if (_cache) return _cache;
  const content = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf-8');
  const releases: Release[] = [];
  let majorIndex = 0;

  const blocks = content.split(/^## /m).slice(1);

  for (const block of blocks) {
    const headingMatch = block.match(/^\[(\d+\.\d+\.\d+)\]\s*—\s*(\d{4}-\d{2}-\d{2})(?:\s*—\s*(.+?))?$/m);
    if (!headingMatch) continue;

    const [, version, date, explicitTitle] = headingMatch;
    const patch = parseInt(version.split('.')[2], 10);
    const isMajor = patch === 0 && version !== '0.1.0';

    const changes = parseChanges(block);
    const accentColor = isMajor
      ? (version === '0.2.0' ? '#e2e8f0' : ACCENT_PALETTE[majorIndex % ACCENT_PALETTE.length])
      : '#666666';
    if (isMajor) majorIndex++;

    const title = explicitTitle?.trim() || deriveTitle(changes);
    const description = deriveDescription(changes);

    releases.push({ version, date, title, description, isMajor, accentColor, changes });
  }

  _cache = releases;
  return releases;
}

export function getReleaseByVersion(version: string): Release | undefined {
  return getAllReleases().find((r) => r.version === version);
}

export function getLatestVersion(): string {
  const releases = getAllReleases();
  return releases.length > 0 ? releases[0].version : '0.0.0';
}
