/**
 * Canonical JSON-LD identifiers and node builders for entity SEO.
 *
 * Every page emits a sitewide `@graph` (WebSite + Person) from Base.astro.
 * Per-page schemas (Article, ProfilePage, ScholarlyArticle, ...) reference
 * those entities by `@id` so Google merges them into a single graph.
 */

export const SITE_URL = 'https://www.blazejmrozinski.com';

export const PERSON_ID = `${SITE_URL}/about/#person` as const;
export const WEBSITE_ID = `${SITE_URL}/#website` as const;
export const ABOUT_PAGE_ID = `${SITE_URL}/about/#profile` as const;

interface CompanyLike {
  data: {
    name: string;
    url?: string;
  };
}

export function getPersonNode(companies: CompanyLike[] = []) {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Blazej Mrozinski',
    givenName: 'Blazej',
    familyName: 'Mrozinski',
    url: `${SITE_URL}/about/`,
    mainEntityOfPage: { '@id': ABOUT_PAGE_ID },
    image: `${SITE_URL}/headshot.png`,
    jobTitle: 'Psychologist, Psychometrician, Product Leader, Data Scientist',
    description:
      'PhD psychologist and psychometrician building products at the intersection of behavioral science, AI, and growth engineering.',
    alumniOf: [
      { '@type': 'EducationalOrganization', name: 'SWPS University' },
      { '@type': 'EducationalOrganization', name: 'London School of Economics' },
    ],
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'PhD in Psychology',
      recognizedBy: { '@type': 'EducationalOrganization', name: 'SWPS University' },
    },
    knowsAbout: [
      'Psychometrics',
      'Item Response Theory',
      'Cognitive Psychology',
      'Social Cognition',
      'Product Management',
      'SEO',
      'AI Workflows',
      'Statistical Modeling',
    ],
    worksFor: companies.map((c) => ({
      '@type': 'Organization',
      name: c.data.name,
      ...(c.data.url ? { url: c.data.url } : {}),
    })),
    sameAs: [
      'https://www.linkedin.com/in/bmrozinski/',
      'https://github.com/b1azk0',
      'https://scholar.google.com/citations?user=RpSeDYwAAAAJ',
      'https://orcid.org/0000-0002-5423-2291',
    ],
  };
}

export function getWebSiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: 'Blazej Mrozinski',
    description:
      'Personal site of Blazej Mrozinski, PhD — psychologist, psychometrician, product leader.',
    inLanguage: 'en-US',
    publisher: { '@id': PERSON_ID },
  };
}

export function getSiteGraph(companies: CompanyLike[] = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [getWebSiteNode(), getPersonNode(companies)],
  };
}

/**
 * True if the given author string looks like a Mrozinski-led publication
 * (i.e. Blazej is among the listed authors).
 */
export function authorsIncludeBlazej(authors: string): boolean {
  return /\bMrozinski\b/.test(authors);
}
