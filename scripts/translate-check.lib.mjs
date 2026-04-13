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
  const match = fmMatch[1].match(/^source_hash:\s*(\S+)\s*$/m);
  return match ? match[1] : null;
}

export function scanCollection(dir) {
  const result = { missing: [], drifted: [], upToDate: [] };
  if (!existsSync(dir)) return result;
  const plDir = join(dir, 'pl');
  const entries = readdirSync(dir);
  for (const name of entries) {
    if (!name.endsWith('.md')) continue;
    const enPath = join(dir, name);
    if (!statSync(enPath).isFile()) continue;
    const plPath = join(plDir, name);
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
