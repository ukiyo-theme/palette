import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://karazuri.github.io',
  base: '/palette',
  build: { assets: 'site-assets', inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
