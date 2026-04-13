import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import routes from '@/i18n/routes.json';

const site = 'https://www.blazejmrozinski.com';

interface UrlSpec {
  enLoc: string;
  plLoc: string | null;
  changefreq: string;
  priority: string;
}

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

export const GET: APIRoute = async () => {
  const allCompanies = await getCollection('companies');
  const allProjects = await getCollection('projects');

  // Filter to EN entries only (skip .pl.md siblings, which load with lang === 'pl')
  const companiesEn = allCompanies.filter((c) => c.data.lang === 'en');
  const projectsEn = allProjects.filter((p) => p.data.lang === 'en');

  // EN ids that have a PL sibling
  const companiesWithPl = new Set(
    allCompanies.filter((c) => c.data.lang === 'pl').map((c) => c.id.replace(/^pl\//, '')),
  );
  const projectsWithPl = new Set(
    allProjects.filter((p) => p.data.lang === 'pl').map((p) => p.id.replace(/^pl\//, '')),
  );

  const urls: UrlSpec[] = [
    { enLoc: `/${routes.en.work}/`,    plLoc: `/pl/${routes.pl.work}/`,    changefreq: 'monthly', priority: '0.8' },
    { enLoc: `/${routes.en.projects}/`, plLoc: `/pl/${routes.pl.projects}/`, changefreq: 'monthly', priority: '0.7' },
    ...companiesEn.map<UrlSpec>((c) => ({
      enLoc: `/${routes.en.work}/${c.id}/`,
      plLoc: companiesWithPl.has(c.id) ? `/pl/${routes.pl.work}/${c.id}/` : null,
      changefreq: 'monthly',
      priority: '0.7',
    })),
    ...projectsEn.map<UrlSpec>((p) => ({
      enLoc: `/${routes.en.projects}/${p.id}/`,
      plLoc: projectsWithPl.has(p.id) ? `/pl/${routes.pl.projects}/${p.id}/` : null,
      changefreq: 'monthly',
      priority: '0.6',
    })),
  ];

  const entries: string[] = [];
  for (const u of urls) {
    const alternates = { en: u.enLoc, pl: u.plLoc ?? undefined };
    entries.push(urlEntry(u.enLoc, alternates));
    if (u.plLoc) {
      entries.push(urlEntry(u.plLoc, alternates));
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
