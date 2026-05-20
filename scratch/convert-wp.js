import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const xmlPath = 'C:\\Users\\yu\\Downloads\\WordPress.2026-05-20 (2).xml';
const outputDir = 'g:\\マイドライブ\\車内掃除\\antiLP\\carwindow\\src\\content\\blog';
const imageOutputDir = 'g:\\マイドライブ\\車内掃除\\antiLP\\carwindow\\public\\images\\blog';

// Ensure directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(imageOutputDir)) {
  fs.mkdirSync(imageOutputDir, { recursive: true });
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
  const guid = getTagValue('guid');

  // Post meta
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
    guid,
    postMeta
  });
}

const attachments = items.filter(i => i.postType === 'attachment');
const posts = items.filter(i => i.postType === 'post' && i.status === 'publish');

// Map attachments by ID
const attachmentMap = {};
attachments.forEach(att => {
  attachmentMap[att.postId] = att.guid;
});

// Function to download image
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => {});
      reject(err);
    });
  });
}

async function convert() {
  console.log(`Converting ${posts.length} posts...`);
  
  for (const post of posts) {
    const slug = post.postName || `post-${post.postId}`;
    console.log(`Processing: ${post.title} (slug: ${slug})`);
    
    // Find thumbnail
    const thumbnailMeta = post.postMeta.find(m => m.key === '_thumbnail_id');
    const thumbnailId = thumbnailMeta ? thumbnailMeta.value : null;
    let originalImageUrl = thumbnailId ? attachmentMap[thumbnailId] : null;
    
    let localImageUrl = '';
    
    if (originalImageUrl) {
      console.log(`- Found featured image: ${originalImageUrl}`);
      // Clean URL if it's like a param URL or doesn't have extension
      if (!originalImageUrl.includes('.') || originalImageUrl.includes('?')) {
        // Fallback or skip if not direct image link
        // Check if there are other attachments with images
        originalImageUrl = null;
      }
    }
    
    // If no direct featured image URL, search in post content
    if (!originalImageUrl) {
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
      const contentImgMatch = post.postContent.match(imgRegex);
      if (contentImgMatch) {
        originalImageUrl = contentImgMatch[1];
        console.log(`- Found image in content: ${originalImageUrl}`);
      }
    }
    
    if (originalImageUrl) {
      try {
        const ext = path.extname(originalImageUrl.split('?')[0]) || '.png';
        const imageFilename = `${slug}${ext}`;
        const localImagePath = path.join(imageOutputDir, imageFilename);
        console.log(`- Downloading image to: ${localImagePath}`);
        await downloadImage(originalImageUrl, localImagePath);
        localImageUrl = `/images/blog/${imageFilename}`;
        console.log(`- Saved image: ${localImageUrl}`);
      } catch (err) {
        console.error(`- Failed to download image ${originalImageUrl}: ${err.message}`);
      }
    }

    // Extract excerpt (simple description)
    const excerptRegex = /<p>([\s\S]*?)<\/p>/i;
    const excerptMatch = post.postContent.match(excerptRegex);
    let excerpt = '';
    if (excerptMatch) {
      excerpt = excerptMatch[1].replace(/<[^>]+>/g, '').substring(0, 120).trim() + '...';
    } else {
      excerpt = post.title;
    }

    // Clean post content from WordPress Gutenberg comment tags
    let cleanContent = post.postContent
      .replace(/<!-- wp:[^>]+ -->/g, '')
      .replace(/<!-- \/wp:[^>]+ -->/g, '')
      .trim();

    // Also download inline images if any, and replace URLs
    const inlineImgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
    let inlineMatch;
    let imgCounter = 1;
    while ((inlineMatch = inlineImgRegex.exec(post.postContent)) !== null) {
      const inlineUrl = inlineMatch[1];
      if (inlineUrl !== originalImageUrl) {
        try {
          const ext = path.extname(inlineUrl.split('?')[0]) || '.png';
          const imageFilename = `${slug}-inline-${imgCounter}${ext}`;
          const localImagePath = path.join(imageOutputDir, imageFilename);
          console.log(`- Downloading inline image: ${inlineUrl}`);
          await downloadImage(inlineUrl, localImagePath);
          const localInlineUrl = `/images/blog/${imageFilename}`;
          cleanContent = cleanContent.replace(inlineUrl, localInlineUrl);
          console.log(`- Replaced inline image URL: ${localInlineUrl}`);
          imgCounter++;
        } catch (err) {
          console.error(`- Failed to download inline image ${inlineUrl}: ${err.message}`);
        }
      }
    }

    // Generate markdown with frontmatter
    const mdContent = `---
title: "${post.title.replace(/"/g, '\\"')}"
description: "${excerpt.replace(/"/g, '\\"').replace(/\n/g, ' ')}"
pubDate: ${post.postDate.split(' ')[0]}
heroImage: "${localImageUrl}"
slug: "${slug}"
---

${cleanContent}
`;

    const outputPath = path.join(outputDir, `${slug}.md`);
    fs.writeFileSync(outputPath, mdContent, 'utf-8');
    console.log(`- Created Markdown file: ${outputPath}`);
  }
  
  console.log('\nConversion complete!');
}

convert().catch(console.error);
