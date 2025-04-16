import Parser from 'rss-parser';
import fs from 'fs';
import { xml } from 'xml';

const FEED_URL = 'https://forexlive.com/feed'; // nguồn gốc
const MAX_FEEDS = 100;

const CACHE1A_FILE = 'cache1a.json'; // bản lưu 1a
const CACHE2A_FILE = 'cache2a.xml';  // bản lưu 2a

const parser = new Parser();

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function createRSS(feedItems) {
  const items = feedItems.map(item => ({
    item: [
      { title: item.title },
      { link: item.link },
      { pubDate: item.pubDate || new Date().toUTCString() },
      ...(item.description ? [{ description: item.description }] : [])
    ]
  }));

  const rssData = {
    rss: [
      { _attr: { version: '2.0' } },
      {
        channel: [
          { title: 'Bản lưu 2a - Đã biến mất khỏi nguồn' },
          { link: FEED_URL },
          { description: 'Danh sách bài viết không còn xuất hiện trong feed nguồn.' },
          { lastBuildDate: new Date().toUTCString() },
          ...items
        ]
      }
    ]
  };

  return xml(rssData, { declaration: true, indent: '  ' });
}

async function main() {
  const sourceFeed = await parser.parseURL(FEED_URL);
  const sourceLinks = new Set(sourceFeed.items.map(i => i.link));

  let cache1a = loadJSON(CACHE1A_FILE);

  // Tìm bài mới không trùng
  const newItems = sourceFeed.items.filter(
    item => !cache1a.some(existing => existing.link === item.link)
  );

  // Cập nhật cache1a
  cache1a = [...newItems, ...cache1a].slice(0, MAX_FEEDS);
  saveJSON(CACHE1A_FILE, cache1a);

  // Tạo bản lưu 2a: những item trong cache1a không còn trong feed gốc hiện tại
  const cache2a = cache1a.filter(item => !sourceLinks.has(item.link));

  // Xuất XML
  const rssOutput = createRSS(cache2a);
  fs.writeFileSync(CACHE2A_FILE, rssOutput);

  console.log(`✅ Đã cập nhật cache1a (${cache1a.length} mục), cache2a (${cache2a.length} mục).`);
}

main();
