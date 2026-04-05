import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    audience: z.array(z.string()).default([]),
    format: z.string().optional(),
    description: z.string(),
    status: z.enum(['draft', 'published']).default('published'),
    safety_review: z.boolean().default(false),
  }),
});

const companies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/companies' }),
  schema: z.object({
    name: z.string(),
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

export const collections = { blog, companies, projects, pages };
