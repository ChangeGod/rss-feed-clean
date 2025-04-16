import Parser from 'rss-parser';
import fs from 'fs';
import RSS from 'rss';

const FEED_URL = 'https://forexlive.com/feed';
const MAX_FEEDS = 100;

const CACHE1A_FILE = 'cache1a.json';
const CACHE2A_FILE = 'cache2a.xml';

const parser = new Parser();

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function createRSS(feedItems) {
  const feed = new RSS({
    title: 'Bản lưu 2a - Đã biến mất khỏi nguồn',
    description: 'Danh sách bài viết không còn trong nguồn hiện tại.',
    feed_url: 'https://your-github-page-url/cache2a.xml',
    site_url: FEED_URL,
    pubDate: new Date().toUTCString(),
  });

  feedItems.forEach(item => {
    feed.item({
      title: item.title,
      description: item.description || '',
      url: item.link,
      date: item.pubDate || new Date().toUTCString(),
    });
  });

  return feed.xml({ indent: true });
}

async function main() {
  const sourceFeed = await parser.parseURL(FEED_URL);
  const sourceLinks = new Set(sourceFeed.items.map(i => i.link));

  let cache1a = loadJSON(CACHE1A_FILE);

  const newItems = sourceFeed.items.filter(
    item => !cache1a.some(existing => existing.link === item.link)
  );

  cache1a = [...newItems, ...cache1a].slice(0, MAX_FEEDS);
  saveJSON(CACHE1A_FILE, cache1a);

  const cache2a = cache1a.filter(item => !sourceLinks.has(item.link));

  const rssOutput = createRSS(cache2a);
  fs.writeFileSync(CACHE2A_FILE, rssOutput);

  console.log(`✅ Đã cập nhật cache1a (${cache1a.length} mục), cache2a (${cache2a.length} mục).`);
}

main();
