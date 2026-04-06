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
                          textTransform: 'uppercase' as const,
                          fontWeight: 500,
                        },
                        children: config.name,
                      },
                    },
                  ],
                },
              },
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
        { name: 'Geist', data: fontData, weight: 400, style: 'normal' as const },
        { name: 'Geist', data: fontData, weight: 700, style: 'normal' as const },
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
