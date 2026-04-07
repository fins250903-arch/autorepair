// @ts-check
import { defineConfig } from 'astro/config';

const isGitHubPagesDeploy = process.env.DEPLOY_TARGET === 'github-pages';

// https://astro.build/config
export default defineConfig({
  site: 'https://autorepair.abura.site',
  base: isGitHubPagesDeploy ? '/autorepair' : '/aichi',
});
