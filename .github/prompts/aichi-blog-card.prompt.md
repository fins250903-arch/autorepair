---
description: "Update the latest blog card on the Aichi landing page while preserving external feed handling and fallback behavior."
name: "Aichi Blog Card"
argument-hint: "Describe the blog card change you want"
agent: "agent"
---

Apply the requested change to the latest blog card on the Aichi landing page.

User request: ${input:Describe the blog card change you want}

Requirements:
- Start from [workspace instructions](../copilot-instructions.md).
- Follow [Aichi SEO instructions](../instructions/aichi-seo.instructions.md) if the request touches metadata, page branding, links, or route-specific copy in [src/pages/aichi/index.astro](../../src/pages/aichi/index.astro).
- Follow [public asset instructions](../instructions/public-assets.instructions.md) for any changes in [public/script.js](../../public/script.js), [public/style.css](../../public/style.css), or related static assets.
- Treat the server-side latest blog fallback in [src/pages/aichi/index.astro](../../src/pages/aichi/index.astro) and the client-side refresh logic in [public/script.js](../../public/script.js) as a paired system.
- Preserve safe behavior when the external blog feed or article page cannot be fetched.
- Avoid changing unrelated landing-page sections unless required by the request.

Execution steps:
1. Inspect the latest blog card markup, styles, and script hooks before editing.
2. Update only the files needed for the requested card change.
3. Keep IDs and DOM hooks aligned across Astro markup, CSS, and JavaScript.
4. Verify that fallback text, image, and link behavior still make sense after the change.
5. Summarize what changed, what was verified, and any remaining risks around external feed dependency.