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
