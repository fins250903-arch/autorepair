import fs from 'fs';
import path from 'path';

const xmlPath = 'C:\\Users\\yu\\Downloads\\WordPress.2026-05-20 (2).xml';

if (!fs.existsSync(xmlPath)) {
  console.error(`File not found: ${xmlPath}`);
  process.exit(1);
}

const content = fs.readFileSync(xmlPath, 'utf-8');

// Parse items
const itemRegex = /<item>([\s\S]*?)<\/item>/g;
let match;
const items = [];

while ((match = itemRegex.exec(content)) !== null) {
  const itemContent = match[1];
  
  const getTagValue = (tag) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = itemContent.match(regex);
    return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
  };

  const title = getTagValue('title');
  const link = getTagValue('link');
  const postType = getTagValue('wp:post_type');
  const postName = getTagValue('wp:post_name');
  const status = getTagValue('wp:status');
  const pubDate = getTagValue('pubDate');
  const postDate = getTagValue('wp:post_date');
  const postContent = getTagValue('content:encoded');
  const postId = getTagValue('wp:post_id');

  // Post meta to find featured image
  const postMeta = [];
  const metaRegex = /<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g;
  let metaMatch;
  while ((metaMatch = metaRegex.exec(itemContent)) !== null) {
    const metaContent = metaMatch[1];
    const keyRegex = /<wp:meta_key>[^]*?<!\[CDATA\[([^]*?)\]\]>[^]*?<\/wp:meta_key>/i;
    const valRegex = /<wp:meta_value>[^]*?<!\[CDATA\[([^]*?)\]\]>[^]*?<\/wp:meta_value>/i;
    const k = metaContent.match(keyRegex)?.[1] || '';
    const v = metaContent.match(valRegex)?.[1] || '';
    if (k) postMeta.push({ key: k, value: v });
  }

  items.push({
    postId,
    title,
    link,
    postType,
    postName,
    status,
    pubDate,
    postDate,
    postContent,
    postMeta
  });
}

const attachments = items.filter(i => i.postType === 'attachment');
const posts = items.filter(i => i.postType === 'post');

console.log(`Found ${posts.length} posts and ${attachments.length} attachments.`);

// Map attachments by ID
const attachmentMap = {};
attachments.forEach(att => {
  const parentId = att.postMeta.find(m => m.key === '_wp_attached_file')?.value || '';
  // The attachment node itself usually has <guid> which is the URL
  const guidRegex = /<guid[^>]*>([\s\S]*?)<\/guid>/i;
  // Let's find the original item block for this attachment
  const originalItem = items.find(i => i.postId === att.postId);
  const guidMatch = content.match(new RegExp(`<item>[\\s\\S]*?<wp:post_id>${att.postId}<\\/wp:post_id>[\\s\\S]*?<guid[^>]*>([\\s\\S]*?)<\\/guid>[\\s\\S]*?<\\/item>`, 'i'));
  const guid = guidMatch ? guidMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
  
  attachmentMap[att.postId] = guid;
});

posts.forEach((post, index) => {
  console.log(`\n--------------------------------------------------`);
  console.log(`POST #${index + 1}: ${post.title}`);
  console.log(`Slug: ${post.postName}`);
  console.log(`Date: ${post.postDate}`);
  console.log(`Status: ${post.status}`);

  // Find thumbnail ID from meta
  const thumbnailMeta = post.postMeta.find(m => m.key === '_thumbnail_id');
  const thumbnailId = thumbnailMeta ? thumbnailMeta.value : null;
  const imageUrl = thumbnailId ? attachmentMap[thumbnailId] : 'No Thumbnail';
  console.log(`Featured Image URL: ${imageUrl}`);
  
  console.log(`Content Snippet (first 500 chars):`);
  console.log(post.postContent.substring(0, 500) + '...');
});
