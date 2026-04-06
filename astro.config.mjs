// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.blazejmrozinski.com',
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
