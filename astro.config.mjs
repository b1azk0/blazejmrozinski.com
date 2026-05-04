// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import validateTaxonomy from './src/integrations/validate-taxonomy.ts';

export default defineConfig({
  site: 'https://www.blazejmrozinski.com',
  trailingSlash: 'always',
  integrations: [validateTaxonomy()],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
