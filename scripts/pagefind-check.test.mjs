import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');

async function readDist(relPath) {
  return await readFile(join(DIST, relPath), 'utf8');
}

test('dist/ exists (run npm run build first)', () => {
  assert.ok(existsSync(DIST), 'dist/ missing — run npm run build');
});

test('Pagefind bundle assets shipped to dist/pagefind/', async () => {
  const required = [
    'pagefind/pagefind.js',
    'pagefind/pagefind-ui.js',
    'pagefind/pagefind-ui.css',
  ];
  for (const path of required) {
    const full = join(DIST, path);
    assert.ok(existsSync(full), `missing: ${path}`);
    const s = await stat(full);
    assert.ok(s.size > 0, `empty: ${path}`);
  }
});

test('homepage emits SearchAction in WebSite JSON-LD', async () => {
  const html = await readDist('index.html');
  assert.match(html, /"@type":\s*"SearchAction"/);
  assert.match(html, /"urlTemplate":\s*"[^"]*\/search\/\?q=\{search_term_string\}"/);
  assert.match(html, /"query-input":\s*"required name=search_term_string"/);
});

test('a deep blog post also emits the SearchAction (sitewide)', async () => {
  const html = await readDist('blog/wp-infra-04-four-layers-of-caching/index.html');
  assert.match(html, /"@type":\s*"SearchAction"/);
});

test('blog post has data-pagefind-body and kind:blog meta', async () => {
  const html = await readDist('blog/wp-infra-04-four-layers-of-caching/index.html');
  assert.match(html, /data-pagefind-body/);
  assert.match(html, /data-pagefind-meta="kind:blog"/);
});

test('glossary term has data-pagefind-body and kind:glossary meta', async () => {
  const slugs = await readdir(join(DIST, 'glossary')).catch(() => []);
  const sample = slugs.find((s) => s !== 'index.html' && !s.endsWith('.xml'));
  assert.ok(sample, 'no glossary terms found in dist');
  const html = await readDist(`glossary/${sample}/index.html`);
  assert.match(html, /data-pagefind-body/);
  assert.match(html, /data-pagefind-meta="kind:glossary"/);
});

test('about, cv, publications opted in', async () => {
  for (const path of ['about/index.html', 'cv/index.html', 'publications/index.html']) {
    const html = await readDist(path);
    assert.match(html, /data-pagefind-body/, `missing on ${path}`);
  }
});

test('listing pages NOT opted in', async () => {
  const listings = [
    'blog/index.html',
    'blog/topic/wordpress-infrastructure/index.html',
    'blog/series/wp-infrastructure/index.html',
  ];
  for (const path of listings) {
    if (!existsSync(join(DIST, path))) continue;
    const html = await readDist(path);
    assert.doesNotMatch(html, /data-pagefind-body/, `unexpected on ${path}`);
  }
});

test('header and footer carry data-pagefind-ignore on every page', async () => {
  const samples = ['index.html', 'about/index.html', 'blog/index.html'];
  for (const path of samples) {
    const html = await readDist(path);
    const ignoreCount = (html.match(/data-pagefind-ignore/g) ?? []).length;
    assert.ok(ignoreCount >= 2, `expected ≥2 ignore markers on ${path}, got ${ignoreCount}`);
  }
});

test('/search route exists, is noindex, well-formed', async () => {
  const html = await readDist('search/index.html');
  assert.match(html, /<meta\s+name="robots"\s+content="noindex/);
  assert.match(html, /pagefind-ui\.js/);
  assert.match(html, /pagefind-ui\.css/);
  assert.match(html, /id="search"/);
  // Must end with </body></html> — no foreign tags after.
  assert.match(html.trim().slice(-30), /<\/body>\s*<\/html>$/);
});

test('robots.txt disallows /pagefind/', async () => {
  const txt = await readDist('robots.txt');
  assert.match(txt, /Disallow:\s*\/pagefind\//);
});

test('/search NOT in sitemap-pages.xml', async () => {
  const xml = await readDist('sitemap-pages.xml');
  assert.doesNotMatch(xml, /\/search<\/loc>/);
});

test('footer "Search" nav link rendered on homepage', async () => {
  const html = await readDist('index.html');
  assert.match(html, /href="\/search\/"/);
});
