import { SITE_URL, STORE_NAME } from './site';

/** Resolve Decap CMS / Markdown image paths to site-relative URLs. */
export function resolvePostImage(
  imagePath: string | undefined,
  postSlug: string,
): string | undefined {
  if (!imagePath) return undefined;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/')) return imagePath;

  const normalized = imagePath.replace(/^\/?posts\//, '');
  if (normalized.includes('/')) {
    return `/posts/${normalized}`;
  }

  return `/posts/${postSlug}/images/${normalized}`;
}

export function toAbsoluteUrl(path: string, site: string = SITE_URL): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return new URL(path, site).href;
}

type ArticleJsonLdInput = {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedTime?: Date;
  modifiedTime?: Date;
  keywords?: string;
  publisherName?: string;
};

export function buildArticleJsonLd(input: ArticleJsonLdInput) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': input.url,
    },
    publisher: {
      '@type': 'Organization',
      name: input.publisherName ?? STORE_NAME,
    },
  };

  if (input.image) jsonLd.image = input.image;
  if (input.publishedTime) {
    jsonLd.datePublished = input.publishedTime.toISOString();
  }
  if (input.modifiedTime) {
    jsonLd.dateModified = input.modifiedTime.toISOString();
  } else if (input.publishedTime) {
    jsonLd.dateModified = input.publishedTime.toISOString();
  }
  if (input.keywords) jsonLd.keywords = input.keywords;

  return jsonLd;
}

export function resolveBlogMeta(post: {
  data: {
    title: string;
    description?: string;
    date: Date;
    updatedDate?: Date;
    seo?: {
      meta_title?: string;
      meta_description?: string;
      keywords?: string;
      noindex?: boolean;
    };
    ogp?: {
      og_type?: 'article' | 'website';
    };
  };
}) {
  const { data } = post;
  const title = data.seo?.meta_title || data.title;
  const description = data.seo?.meta_description || data.description || data.title;
  const noindex = data.seo?.noindex ?? false;
  const ogType = data.ogp?.og_type ?? 'article';

  return { title, description, noindex, ogType };
}
