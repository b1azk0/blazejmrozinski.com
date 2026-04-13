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
