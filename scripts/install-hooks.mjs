#!/usr/bin/env node
import { copyFileSync, chmodSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { isAbsolute, join, resolve } from 'node:path';

const repoRoot = process.cwd();
const source = join(repoRoot, 'scripts/hooks/post-commit');

// Resolve the real hooks dir via git so this works in both standard
// checkouts and git worktrees (where `.git` is a file, not a directory).
let gitHooksDir;
try {
  const hooksPath = execSync('git rev-parse --git-path hooks', {
    cwd: repoRoot,
  })
    .toString()
    .trim();
  gitHooksDir = isAbsolute(hooksPath) ? hooksPath : resolve(repoRoot, hooksPath);
} catch {
  gitHooksDir = join(repoRoot, '.git/hooks');
}

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
