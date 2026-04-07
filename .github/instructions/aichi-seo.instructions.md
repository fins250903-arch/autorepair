---
description: "Use when editing SEO metadata, head tags, canonical URLs, OGP tags, schema.org JSON-LD, or route-specific branding for the Aichi landing page in src/pages/aichi/index.astro."
name: "Aichi SEO Instructions"
applyTo: "src/pages/aichi/**/*.astro"
---

# Aichi SEO Guidelines

- Treat `src/pages/aichi/index.astro` as the source of truth for the live `/aichi` route.
- Keep the page title, description, canonical URL, OGP URL, and schema.org values aligned with the `/aichi` path and `https://autorepair.abura.site` domain.
- Preserve the business phone number and service-area framing unless the task explicitly changes business details.
- Keep Japanese marketing copy natural and locally specific; avoid replacing concise service copy with generic SEO filler.
- If you change latest-blog card markup or metadata-adjacent sections, preserve the safe fallback behavior for unreachable blog content.
- Prefer editing existing metadata and helper patterns in place instead of introducing parallel SEO helpers.

## Key References

- See `astro.config.mjs` for the production site URL and base path.
- See `src/pages/aichi/index.astro` for all head tags, JSON-LD, and server-side blog fetch logic.
