/**
 * Copy images stored next to blog markdown into public/posts
 * so Decap-style relative filenames resolve at /posts/{slug}/images/.
 */
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);
const root = join(fileURLToPath(import.meta.url), '..', '..');
const blogRoot = join(root, 'src/content/blog');
const publicPosts = join(root, 'public/posts');

function walk(dir, files = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return files;
  for (const name of readdirSync(dir)) {
    if (name.startsWith('_')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

let copied = 0;
for (const file of walk(blogRoot)) {
  const ext = extname(file).toLowerCase();
  if (!IMAGE_EXT.has(ext)) continue;

  const rel = relative(blogRoot, file).replace(/\\/g, '/');
  const slug = rel.replace(/\/[^/]+$/, '').replace(/\/images$/, '');
  const filename = rel.split('/').pop();
  const destDir = join(publicPosts, slug, 'images');
  mkdirSync(destDir, { recursive: true });
  copyFileSync(file, join(destDir, filename));
  copied += 1;
}

console.log(`Synced ${copied} blog images to public/posts`);
