import fs from 'fs';
import path from 'path';

const files = [
  'C:\\Users\\yu\\Downloads\\ins.WordPress.2026-05-20.xml',
  'C:\\Users\\yu\\Downloads\\WordPress.2026-05-20 (2).xml',
  'C:\\Users\\yu\\Downloads\\WordPress.2026-05-20.xml'
];

function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`\n==================================================`);
  console.log(`Analyzing: ${path.basename(filePath)}`);
  console.log(`Size: ${fs.statSync(filePath).size} bytes`);

  const content = fs.readFileSync(filePath, 'utf-8');

  // Simple regex parser for <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  const items = [];

  while ((match = itemRegex.exec(content)) !== null) {
    const itemContent = match[1];
    
    const getTagValue = (tag) => {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const m = itemContent.match(regex);
      return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : '';
    };

    const title = getTagValue('title');
    const link = getTagValue('link');
    const postType = getTagValue('wp:post_type');
    const postName = getTagValue('wp:post_name'); // slug
    const status = getTagValue('wp:status');

    items.push({ title, link, postType, postName, status });
  }

  console.log(`Total <item> tags found: ${items.length}`);
  
  const postTypes = {};
  items.forEach(item => {
    postTypes[item.postType] = (postTypes[item.postType] || 0) + 1;
  });
  console.log('Post types count:', postTypes);

  const posts = items.filter(i => i.postType === 'post');
  console.log(`Posts (post_type="post"): ${posts.length}`);
  
  console.log('\nFirst 10 posts:');
  posts.slice(0, 10).forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.status}] ${p.title} (slug: ${p.postName}) -> ${p.link}`);
  });
}

files.forEach(analyzeFile);
