/**
 * Build public/admin/blog-index.json from src/content/blog markdown files.
 * Used by Decap CMS list UI for reliable thumbnails and dates.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const blogRoot = join(root, 'src/content/blog');
const outFile = join(root, 'public/admin/blog-index.json');

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('_')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (name === 'index.md' || name === 'index.mdx') files.push(full);
  }
  return files;
}

function readField(yaml, key) {
  const quoted = yaml.match(new RegExp(`^${key}:\\s*["']([^"']+)["']\\s*$`, 'm'));
  if (quoted) return quoted[1].trim();
  const plain = yaml.match(new RegExp(`^${key}:\\s*([^\\n#]+)\\s*$`, 'm'));
  return plain ? plain[1].trim() : '';
}

function firstMarkdownImage(body) {
  const md = body.match(/!\[[^\]]*]\(([^)]+)\)/);
  if (md) return md[1].split('/').pop();
  const html = body.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (html) return html[1].split('/').pop();
  return '';
}

function resolvePostImage(imagePath, postSlug) {
  if (!imagePath) return '';
  const raw = String(imagePath).trim();
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return raw;
  const normalized = raw.replace(/^\/?posts\//, '');
  if (normalized.includes('/')) return `/posts/${normalized}`;
  return `/posts/${postSlug}/images/${normalized}`;
}

function parsePost(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;

  const yaml = match[1];
  const body = match[2];
  const rel = relative(blogRoot, filePath).replace(/\\/g, '/');
  const postSlug = rel.replace(/\/index\.mdx?$/, '');
  const slug = postSlug.split('/').pop() || postSlug;

  let coverImage = readField(yaml, 'coverImage');
  if (!coverImage) coverImage = firstMarkdownImage(body);

  let ogImage = '';
  const ogBlock = yaml.match(/ogp:[\s\S]*?(?=\n[A-Za-z_]|$)/);
  if (ogBlock) ogImage = readField(ogBlock[0], 'og_image');

  const imageUrl =
    resolvePostImage(coverImage, postSlug) || resolvePostImage(ogImage, postSlug);

  return {
    slug,
    postSlug,
    title: readField(yaml, 'title'),
    date: readField(yaml, 'date'),
    areaName: readField(yaml, 'areaName'),
    coverImage,
    imageUrl,
  };
}

const posts = walk(blogRoot)
  .map(parsePost)
  .filter(Boolean)
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));

writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), posts }, null, 2) + '\n');
console.log(`Generated blog-index.json with ${posts.length} posts`);
