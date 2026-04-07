---
description: "Implement a requested update for the Aichi landing page, including content, CTA, FAQ, SEO-safe edits, and matching static asset changes when needed."
name: "Aichi LP Edit"
argument-hint: "Describe the landing-page change you want"
agent: "agent"
---

Apply the requested change to the Aichi landing page.

User request: ${input:Describe the landing-page change you want}

Requirements:
- Start from [workspace instructions](../copilot-instructions.md).
- Follow [Aichi SEO instructions](../instructions/aichi-seo.instructions.md) when changing metadata, head tags, branding, canonical URLs, OGP tags, or schema.org JSON-LD.
- Follow [public asset instructions](../instructions/public-assets.instructions.md) when changing [public/style.css](../../public/style.css), [public/script.js](../../public/script.js), or related static assets.
- Treat [src/pages/aichi/index.astro](../../src/pages/aichi/index.astro) as the primary source for the live page.
- Avoid editing [public/index.html](../../public/index.html) unless the request explicitly targets the legacy static copy.
- Preserve Japanese user-facing copy quality and keep route-specific values aligned with `/aichi`.
- Keep latest-blog fallback behavior intact unless the request explicitly changes that area.

Execution steps:
1. Inspect the relevant page sections and linked assets before editing.
2. Implement only the files necessary for the requested change.
3. If markup, CSS, and JavaScript depend on each other, update them together.
4. Run the most relevant verification for the change when feasible.
5. Summarize what changed, what was verified, and any remaining risks.