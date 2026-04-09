/**
 * Post-build script: submit all published URLs to IndexNow.
 * Parses sitemap XML files from dist/ and sends a batch ping.
 *
 * Runs automatically via the "postbuild" npm script after every `astro build`.
 * IndexNow handles deduplication, so pinging all URLs on every deploy is fine.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const HOST = 'www.blazejmrozinski.com';
const KEY = '3a838b06f8a64c129f2d2c72f535b6b2';
const DIST = resolve(process.cwd(), 'dist');

const SITEMAPS = [
  'sitemap-blog.xml',
  'sitemap-pages.xml',
  'sitemap-work.xml',
  'sitemap-photography.xml',
];

function extractUrls(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

async function main() {
  const urls: string[] = [];

  for (const sitemap of SITEMAPS) {
    const path = resolve(DIST, sitemap);
    if (!existsSync(path)) continue;
    const xml = readFileSync(path, 'utf-8');
    urls.push(...extractUrls(xml));
  }

  if (urls.length === 0) {
    console.log('[IndexNow] No URLs found in sitemaps, skipping.');
    return;
  }

  console.log(`[IndexNow] Submitting ${urls.length} URLs...`);

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  };

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (res.ok || res.status === 202) {
    console.log(`[IndexNow] Submitted successfully (${res.status}).`);
  } else {
    const text = await res.text().catch(() => '');
    console.error(`[IndexNow] Failed (${res.status}): ${text}`);
    // Don't fail the build over IndexNow issues
  }
}

main().catch((err) => {
  console.error('[IndexNow] Error:', err.message);
  // Non-fatal — don't break the deploy
});
