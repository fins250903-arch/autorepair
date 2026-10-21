// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://autorepair.abura.site',
  // Keep Astro 6 HTML whitespace so inline text does not collapse after the v7 default.
  compressHTML: true,
});
