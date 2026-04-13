import type { APIRoute } from 'astro';
import routes from '@/i18n/routes.json';

const site = 'https://www.blazejmrozinski.com';

interface PageSpec {
  enLoc: string;
  plLoc: string | null;
  changefreq: string;
  priority: string;
}

const pages: PageSpec[] = [
  { enLoc: '/',                   plLoc: '/pl/',                   changefreq: 'weekly',  priority: '1.0' },
  { enLoc: `/${routes.en.about}/`,    plLoc: `/pl/${routes.pl.about}/`,    changefreq: 'monthly', priority: '0.8' },
  { enLoc: '/blog/',              plLoc: null,                     changefreq: 'weekly',  priority: '0.9' },
  { enLoc: `/${routes.en.contact}/`,  plLoc: `/pl/${routes.pl.contact}/`,  changefreq: 'yearly',  priority: '0.6' },
  { enLoc: `/${routes.en.cv}/`,       plLoc: `/pl/${routes.pl.cv}/`,       changefreq: 'monthly', priority: '0.5' },
  { enLoc: '/publications/',      plLoc: null,                     changefreq: 'monthly', priority: '0.6' },
];

function urlEntry(loc: string, alternates: { en?: string; pl?: string }): string {
  const links: string[] = [];
  if (alternates.en) {
    links.push(`    <xhtml:link rel="alternate" hreflang="en" href="${site}${alternates.en}"/>`);
  }
  if (alternates.pl) {
    links.push(`    <xhtml:link rel="alternate" hreflang="pl" href="${site}${alternates.pl}"/>`);
  }
  if (alternates.en) {
    links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${alternates.en}"/>`);
  }
  return `  <url>
    <loc>${site}${loc}</loc>
${links.join('\n')}
  </url>`;
}

export const GET: APIRoute = () => {
  const entries: string[] = [];
  for (const p of pages) {
    const alternates = { en: p.enLoc, pl: p.plLoc ?? undefined };
    entries.push(urlEntry(p.enLoc, alternates));
    if (p.plLoc) {
      entries.push(urlEntry(p.plLoc, alternates));
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
