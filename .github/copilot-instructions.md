# Project Guidelines

## Architecture
- This workspace is an Astro site with the production route rooted at `/aichi`; keep changes consistent with `site` and `base` in `astro.config.mjs`.
- Treat `src/pages/aichi/index.astro` as the primary source for the live page. It contains page markup, SEO metadata, schema.org JSON-LD, and the server-side blog fetch fallback.
- Treat `public/style.css` and `public/script.js` as shared static assets referenced by the Astro page. Files under `public/` are served as-is and are not processed by Astro.
- Treat files under `tmp/` as scratch or backup material unless a task explicitly says otherwise.

## Build and Test
- Use Node.js 22.12.0 or later to match the `engines` field in `package.json`.
- Install dependencies with `npm install`.
- Run the dev server with `npm run dev`.
- Build the site with `npm run build`.
- Preview the production build with `npm run preview`.

## Conventions
- Preserve Japanese user-facing copy unless the task explicitly requires rewriting content.
- When editing SEO or branding content, keep canonical URLs, OGP values, business phone number, and local business schema aligned with the `/aichi` route.
- Prefer updating the Astro page and its linked assets over editing `public/index.html`; that static HTML appears to be a legacy copy, not the main routed page.
- The latest blog card depends on external content from `https://blog.autorepair.abura.site/`. Keep a safe fallback path and avoid changes that assume the feed is always reachable.
- Reuse the existing helper patterns for HTML decoding, stripping, image extraction, and text clamping instead of introducing a new parsing approach unless the task requires it.

## Key References
- See `package.json` for the authoritative command set.
- See `astro.config.mjs` for deployment URL and base-path settings.
- See `src/pages/aichi/index.astro` for route structure, metadata, and server-side content fetching.