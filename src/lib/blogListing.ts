import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export const AREA_GROUPS = [
  {
    id: 'mikawa',
    name: '三河エリア',
    keywords: [
      '岡崎', '豊田', '安城', '刈谷', '豊橋', '豊川', '蒲郡', '西尾',
      '碧南', '知立', '高浜', 'みよし', '幸田', '新城', '田原', '三河',
    ],
  },
  {
    id: 'nagoya',
    name: '名古屋・尾張エリア',
    keywords: [
      '名古屋', '一宮', '春日井', '小牧', '瀬戸', '豊明', '日進', '長久手',
      '尾張', '犬山', '江南', '稲沢', '尾張旭', '岩倉', '清須', '北名古屋',
      '東郷', '豊山', '大口', '扶桑',
    ],
  },
  {
    id: 'chita',
    name: '海部・知多エリア',
    keywords: [
      '半田', '常滑', '東海', '大府', '知多', '津島', '愛西', '弥富', 'あま',
      '海部', '蟹江', '飛島', '大治',
    ],
  },
] as const;

const REGION_CATEGORY_ALIASES: Record<string, string> = {
  aichi: 'mikawa',
  owari: 'nagoya',
};

const AREA_ID_SET = new Set(AREA_GROUPS.map((g) => g.id));

export function getPostSlug(post: { id: string }): string {
  return post.id.replace(/\/index$/, '');
}

export function getPostUrl(post: { id: string }): string {
  return `/blog/${getPostSlug(post)}`;
}

export function getPostSortTime(post: BlogPost): number {
  const updated = post.data.updatedDate?.valueOf();
  const published = post.data.date.valueOf();
  return Math.max(updated ?? 0, published);
}

export function sortPostsByNewest(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => {
    const diff = getPostSortTime(b) - getPostSortTime(a);
    if (diff !== 0) return diff;
    return b.id.localeCompare(a.id);
  });
}

export function isPublishedPost(post: BlogPost): boolean {
  return !(post.data.seo?.noindex ?? false);
}

function textHaystack(post: BlogPost): string {
  return `${post.data.areaName ?? ''} ${post.data.title} ${(post.data.categories ?? []).join(' ')}`;
}

export function getPostAreaIds(post: BlogPost): string[] {
  const ids = new Set<string>();

  for (const cat of post.data.categories ?? []) {
    const key = cat.trim().toLowerCase();
    const resolved = REGION_CATEGORY_ALIASES[key] ?? key;
    if (AREA_ID_SET.has(resolved)) ids.add(resolved);
  }

  const haystack = textHaystack(post);
  for (const group of AREA_GROUPS) {
    if (group.keywords.some((kw) => haystack.includes(kw))) {
      ids.add(group.id);
    }
  }

  return [...ids];
}

export type AreaBlogGroup = {
  areaId: string;
  areaName: string;
  posts: BlogPost[];
  latestTime: number;
};

export function buildAreaBlogGroups(posts: BlogPost[]): AreaBlogGroup[] {
  const byId = new Map<string, BlogPost[]>();

  for (const post of posts) {
    for (const areaId of getPostAreaIds(post)) {
      const list = byId.get(areaId) ?? [];
      list.push(post);
      byId.set(areaId, list);
    }
  }

  const groups: AreaBlogGroup[] = [];
  for (const area of AREA_GROUPS) {
    const raw = byId.get(area.id);
    if (!raw?.length) continue;
    const sorted = sortPostsByNewest(raw);
    groups.push({
      areaId: area.id,
      areaName: area.name,
      posts: sorted,
      latestTime: getPostSortTime(sorted[0]!),
    });
  }

  return groups.sort((a, b) => b.latestTime - a.latestTime);
}

export function getOtherBlogPosts(posts: BlogPost[]): BlogPost[] {
  return sortPostsByNewest(posts.filter((post) => getPostAreaIds(post).length === 0));
}
