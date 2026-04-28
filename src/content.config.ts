import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    audience: z.array(z.string()).default([]),
    format: z.string().optional(),
    description: z.string(),
    status: z.enum(['draft', 'published']).default('published'),
    safety_review: z.boolean().default(false),
    label: z.enum([
      'infrastructure',
      'ai-automation',
      'product',
      'research',
      'systems-thinking',
      'operator-notes',
      'academic-work',
    ]).optional(),
  }),
});

const companies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/companies' }),
  schema: z.object({
    name: z.string(),
    metaTitle: z.string().optional(),
    role: z.string(),
    description: z.string(),
    url: z.string().url().optional(),
    domain: z.string(),
    order: z.number().default(0),
    related_projects: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    metaTitle: z.string().optional(),
    company: z.string().optional(),
    description: z.string(),
    domain: z.string(),
    order: z.number().default(0),
    related_posts: z.array(z.string()).default([]),
    // Case study fields (optional — render full case study layout when present)
    challenge: z.string().optional(),
    approach: z.string().optional(),
    results: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const glossary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/glossary' }),
  schema: z.object({
    term: z.string(),
    seoTitle: z.string(),
    description: z.string(),
    definition: z.string(),
    domain: z.string(),
    relatedContent: z.array(z.string()).default([]),
    relatedTerms: z.array(z.string()).default([]),
    status: z.enum(['draft', 'published']).default('draft'),
    date: z.coerce.date(),
  }),
});

const photography = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/photography' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    location: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(0),
    hero: image(),
    photos: z.array(z.object({
      file: image(),
      caption: z.string().optional(),
    })),
  }),
});

export const collections = { blog, companies, projects, pages, glossary, photography };
