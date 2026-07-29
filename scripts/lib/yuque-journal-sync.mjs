const YUQUE_ORIGIN = 'https://www.yuque.com';

// 关键词表即归并表：小地名/途经点直接归到路线站点 id。
// 顺序即优先级（靠后的站点在前），"A→B" 中转标题归到目的地。
const CITY_KEYWORDS = [
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
  const separatedMatch = title.match(/(20\d{2})[.-](\d{2})[.-](\d{2})/);
  if (separatedMatch) {
    return `${separatedMatch[1]}-${separatedMatch[2]}-${separatedMatch[3]}`;
  }

  const compactMatch = title.match(/(20\d{2})[.-](\d{2})(\d{2})/);
  if (!compactMatch) return null;
  return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
}

export function inferCityId(title) {
  for (const [cityId, keywords] of CITY_KEYWORDS) {
    if (keywords.some((keyword) => title.includes(keyword))) return cityId;
  }
  return 'yuque';
}

export function normalizeYuqueToc(toc, { namespace }) {
  return toc
    .filter((entry) => entry.type === 'DOC' && entry.visible !== 0 && entry.url)
    .map((entry) => ({
      id: String(entry.doc_id ?? entry.id ?? entry.url),
      slug: entry.url,
      title: entry.title,
      date: parseJournalDate(entry.title),
      city: inferCityId(entry.title),
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
