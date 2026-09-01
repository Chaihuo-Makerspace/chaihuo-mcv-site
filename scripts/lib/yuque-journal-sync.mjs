import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const YUQUE_ORIGIN = 'https://www.yuque.com';

const STOPS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src/content/stops',
);

// 手工关键词表只保留别名/归并项：小地名/途经点归到路线站点 id
// （如 定边→榆林）。站点主名（临汾、太原…）不再登记于此，
// 由 loadStopCityKeywords() 从 stops 内容集合的 label 自动派生。
// 顺序即优先级（靠后的站点在前），"A→B" 中转标题归到目的地。
const CITY_KEYWORDS = [
  ['weihai', ['威海']],
  ['jinan', ['济南']],
  ['xian', ['西安']],
  ['yulin-shaanxi', ['榆林', '定边']],
  ['yinchuan', ['银川']],
  ['wuzhong', ['吴忠']],
  ['lanzhou', ['兰州']],
  ['zhangye', ['张掖', '肃南']],
  ['jiuquan', ['酒泉']],
  ['jiayuguan', ['嘉峪关']],
  ['dunhuang', ['敦煌']],
  ['yumen', ['玉门']],
  ['hami', ['哈密', '伊吾']],
  ['chengdu', ['成都', '四川科技馆', '绵阳', '宜宾', 'C-SCHOOL', 'BOSA', '麓湖']],
  ['bijie', ['毕节', '赫章']],
  ['guiyang', ['贵阳', '格凸河']],
  ['liuzhou', ['柳州', '三都', '七百弄']],
  ['nanning', ['南宁', '广西科技馆', '浩坤湖']],
  ['yulin', ['玉林']],
  ['yangjiang', ['阳江']],
  ['guangzhou', ['广州', '广东科学中心']],
  ['lhasa', ['拉萨']],
  ['batang', ['巴塘']],
  ['yaan', ['雅安']],
  ['tagong', ['塔公']],
];

export function extractAppData(html) {
  const match = html.match(
    /window\.appData\s*=\s*JSON\.parse\(decodeURIComponent\("([\s\S]*?)"\)\)/,
  );
  if (!match) {
    throw new Error('Unable to find Yuque appData in page html.');
  }
  return JSON.parse(decodeURIComponent(match[1]));
}

export function parseJournalDate(title) {
  // 月/日允许不补零（作者常写 2026.8.17），统一补齐为 ISO。
  const separatedMatch = title.match(/(20\d{2})[.-](\d{1,2})[.-](\d{1,2})/);
  if (separatedMatch) {
    const [, year, month, day] = separatedMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const compactMatch = title.match(/(20\d{2})[.-](\d{2})(\d{2})/);
  if (!compactMatch) return null;
  return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
}

function loadStops(stopsDir) {
  let files;
  try {
    files = readdirSync(stopsDir);
  } catch {
    return [];
  }

  const stops = [];
  for (const file of files) {
    if (!file.endsWith('.md') || file.endsWith('.en.md') || file.startsWith('_')) continue;
    const frontmatter = readFileSync(path.join(stopsDir, file), 'utf8').match(
      /^---\r?\n([\s\S]*?)\r?\n---/,
    );
    if (!frontmatter) continue;
    const id = frontmatter[1].match(/^id:\s*(\S+)\s*$/m)?.[1];
    const label = frontmatter[1].match(/^label:\s*(.+?)\s*$/m)?.[1];
    const order = Number(frontmatter[1].match(/^order:\s*(\d+)\s*$/m)?.[1] ?? 0);
    const lng = Number(frontmatter[1].match(/^lng:\s*([-\d.]+)\s*$/m)?.[1]);
    const lat = Number(frontmatter[1].match(/^lat:\s*([-\d.]+)\s*$/m)?.[1]);
    const visited = /^visited:\s*true\s*$/m.test(frontmatter[1]);
    const eventDateRaw = frontmatter[1].match(/^ {2}date:\s*"?([^"\n]+?)"?\s*$/m)?.[1];
    const eventDate = eventDateRaw ? parseJournalDate(eventDateRaw) : null;
    if (id && label) stops.push({ id, label, order, lng, lat, visited, eventDate });
  }

  return stops.sort((a, b) => b.order - a.order);
}

// 从 stops 内容集合（src/content/stops/*.md）派生站点主名关键词，
// 按 order 倒序排列，延续“靠后的站点优先、A→B 归目的地”的约定。
// 新增站点无需再手工登记，同步时自动生效。
export function loadStopCityKeywords(stopsDir = STOPS_DIR) {
  return loadStops(stopsDir).map((stop) => [stop.id, [stop.label], { date: stop.eventDate }]);
}

// 站点坐标（同样按 order 倒序），供地理编码兜底就近归并。
export function loadStopCoordinates(stopsDir = STOPS_DIR) {
  return loadStops(stopsDir).filter(
    (stop) => Number.isFinite(stop.lng) && Number.isFinite(stop.lat),
  );
}

// 已到访站点的时间线（按 event.date 升序），供"标题/正文都没有地名"的
// 日记按发布日期归并到当时车辆所在站点。
export function loadStopTimeline(stopsDir = STOPS_DIR) {
  return loadStops(stopsDir)
    .filter((stop) => stop.visited && stop.eventDate)
    .map((stop) => ({ id: stop.id, date: stop.eventDate }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// 日记日期落在哪一段行程：取 event.date 不晚于该日期的最近一个站点
// （行程途中归上一个已到访站）。早于首站则返回 null。
export function stopIdAtDate(timeline, date) {
  if (!date) return null;
  let hit = null;
  for (const stop of timeline) {
    if (stop.date <= date) hit = stop.id;
    else break;
  }
  return hit;
}

// 语雀时间戳（UTC）转北京时间日历日——日记是按中国时区记的。
export function dateOnlyInShanghai(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// 从正文日期行提取 "A→B→C" 中转链，最后一个地名即目的地。
export function extractRouteTokens(text) {
  const chain = text.match(/[一-鿿]{2,}(?:\s*→\s*[一-鿿]{2,})+/);
  if (!chain) return [];
  return chain[0].split(/\s*→\s*/);
}

export function haversineKm(lng1, lat1, lng2, lat2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 距离阈值内的最近站点；超过 maxKm 视为无法归并（宁可落选也不错标）。
export function nearestStop(lng, lat, stops, maxKm = 100) {
  let best = null;
  for (const stop of stops) {
    const km = haversineKm(lng, lat, stop.lng, stop.lat);
    if (km <= maxKm && (!best || km < best.km)) best = { id: stop.id, km };
  }
  return best;
}

export function nearestStopId(lng, lat, stops, maxKm = 100) {
  return nearestStop(lng, lat, stops, maxKm)?.id ?? null;
}

export function inferCityId(title, stopKeywords = loadStopCityKeywords()) {
  const entries = [...CITY_KEYWORDS, ...stopKeywords];
  const journalDate = parseJournalDate(title);

  const choose = (text) => {
    const matches = entries.filter(([, keywords]) =>
      keywords.some((keyword) => text.includes(keyword)),
    );
    if (matches.length === 0) return null;
    if (!journalDate) return matches[0][0];

    const dated = matches
      .filter((entry) => entry[2]?.date && entry[2].date <= journalDate)
      .sort((a, b) => b[2].date.localeCompare(a[2].date));
    return (dated[0] ?? matches[0])[0];
  };

  // 中转标题优先按最后一个地名(目的地)归属，再回退到全文关键词。
  const destination = extractRouteTokens(title).at(-1);
  if (destination) {
    const cityId = choose(destination);
    if (cityId) return cityId;
  }
  return choose(title) ?? 'yuque';
}

export function normalizeYuqueToc(toc, { namespace }) {
  const stopKeywords = loadStopCityKeywords();
  return toc
    .filter((entry) => entry.type === 'DOC' && entry.visible !== 0 && entry.url)
    .map((entry) => ({
      id: String(entry.doc_id ?? entry.id ?? entry.url),
      slug: entry.url,
      title: entry.title,
      date: parseJournalDate(entry.title),
      city: inferCityId(entry.title, stopKeywords),
      href: `${YUQUE_ORIGIN}/${namespace}/${entry.url}`,
      updatedAt: entry.updated_at ?? entry.content_updated_at ?? null,
      coverImage: entry.cover ?? null,
    }))
    .sort(compareJournalEntries);
}

export function extractCoverFromDocHtml(html) {
  const metaMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (metaMatch) return decodeHtmlEntities(metaMatch[1]);

  const appData = extractAppData(html);
  return appData.doc?.cover ?? null;
}

export function extractFirstImageFromDocContent(content) {
  if (!content) return null;

  const inlineImage = extractImageCard(content, 'image');
  if (inlineImage) return inlineImage;

  return extractImageCard(content, 'board');
}

function extractImageCard(content, cardName) {
  const cardPattern = new RegExp(
    `<card\\b(?=[^>]*\\bname=["']${cardName}["'])[^>]*\\bvalue=["']([^"']+)["'][^>]*>`,
    'gi',
  );

  for (const match of content.matchAll(cardPattern)) {
    try {
      const encodedValue = decodeHtmlEntities(match[1]).replace(/^data:/, '');
      const cardData = JSON.parse(decodeURIComponent(encodedValue));
      if (cardName === 'image' && cardData.src) return cardData.src;

      const boardImage = cardData.diagramData?.body?.find(
        (item) => item.type === 'image' && item.image?.src,
      );
      if (boardImage) return boardImage.image.src;
    } catch {
      // Continue to the next media card when one card has malformed data.
    }
  }

  return null;
}

export function imageExtensionFromUrl(url) {
  const pathname = new URL(url).pathname;
  const match = pathname.match(/\.([a-z0-9]+)$/i);
  const ext = match?.[1]?.toLowerCase();
  if (ext === 'png' || ext === 'jpeg' || ext === 'jpg' || ext === 'webp') return ext;
  return 'jpg';
}

function compareJournalEntries(left, right) {
  const leftTime = timestampForSort(left);
  const rightTime = timestampForSort(right);
  return rightTime - leftTime;
}

function timestampForSort(entry) {
  const value = entry.date ?? entry.updatedAt ?? '';
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function decodeHtmlEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}
