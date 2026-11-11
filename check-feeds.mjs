/**
 * Phase 0 only: fetch and inspect candidate RSS feeds without dependencies.
 * It does not persist content or accept credentials.
 */
const feeds = [
  ['Press Information Bureau — India releases', 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3'],
  ['UN News — global', 'https://news.un.org/feed/subscribe/en/news/all/rss.xml'],
  ['BBC News — world', 'https://feeds.bbci.co.uk/news/world/rss.xml'],
  ['BBC News — business', 'https://feeds.bbci.co.uk/news/business/rss.xml'],
  ['BBC News — India', 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml'],
  ['BBC News — Middle East', 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml'],
  ['BBC News — United States and Canada', 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml'],
  ['BBC News — Europe', 'https://feeds.bbci.co.uk/news/world/europe/rss.xml'],
  ['Al Jazeera — global', 'https://www.aljazeera.com/xml/rss/all.xml'],
  ['The Indian Express — India', 'https://indianexpress.com/section/india/feed/'],
  ['The Indian Express — world', 'https://indianexpress.com/section/world/feed/'],
  ['The Indian Express — economy', 'https://indianexpress.com/section/business/economy/feed/'],
  ['Hindustan Times — India', 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml'],
  ['NPR — world', 'https://feeds.npr.org/1004/rss.xml'],
  ['NPR — business', 'https://feeds.npr.org/1014/rss.xml'],
];

function itemBlocks(xml) {
  return xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
}

function dateCount(xml) {
  return (xml.match(/<(?:pubDate|published|updated|dc:date)\b[^>]*>/gi) ?? []).length;
}

const results = await Promise.all(feeds.map(async ([name, url]) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const started = performance.now();
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    const xml = await response.text();
    return {
      name,
      url,
      status: response.status,
      contentType: response.headers.get('content-type'),
      bytes: Buffer.byteLength(xml),
      items: itemBlocks(xml).length,
      dateFields: dateCount(xml),
      elapsedMs: Math.round(performance.now() - started),
    };
  } catch (error) {
    return { name, url, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}));

console.log(JSON.stringify(results, null, 2));
