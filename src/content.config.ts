import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/index.{md,mdx}' }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      date: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      coverImage: z.string().optional(),
      categories: z.array(z.string()).optional(),
      areaName: z.union([z.string(), z.null()]).optional().transform((v) => v ?? undefined),
      shortSlug: z.string().optional(),
      seo: z
        .object({
          meta_title: z.string().optional(),
          meta_description: z.string().optional(),
          keywords: z.string().optional(),
          noindex: z.boolean().optional().default(false),
        })
        .optional(),
      ogp: z
        .object({
          og_image: z.string().optional(),
          og_type: z.enum(['article', 'website']).optional().default('article'),
        })
        .optional(),
    }),
});

export const collections = { blog };
