import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// GitHub Pages 项目站：https://lanrengm.github.io/earth-online-metadata/
export default defineConfig({
  site: 'https://lanrengm.github.io',
  base: '/earth-online-metadata',
  trailingSlash: 'always',
  integrations: [react(), mdx()],
});
