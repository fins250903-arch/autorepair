---
description: "Use when editing public CSS, JavaScript, or static assets for the landing page, especially public/style.css, public/script.js, or related files under public/."
name: "Public Asset Instructions"
applyTo: "public/**/*"
---

# Public Asset Guidelines

- Files under `public/` are served as-is. Do not assume Astro processing, bundling, import resolution, or path rewriting.
- Prefer updating `public/style.css` and `public/script.js` together with the markup they support in `src/pages/aichi/index.astro`.
- Use root-relative asset paths that remain valid under the production `/aichi` deployment model already established by the project.
- Keep existing class names, IDs, and DOM hooks stable unless the matching Astro markup is updated in the same task.
- Preserve existing fallback behavior in `public/script.js`, especially around latest-blog loading and no-data cases.
- Treat `public/index.html` as a legacy static copy unless a task explicitly targets it.

## Key References

- See `src/pages/aichi/index.astro` for the markup that consumes these assets.
- See `.github/copilot-instructions.md` for project-wide route and content constraints.