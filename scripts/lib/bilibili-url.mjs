const BV_RE = /BV[0-9A-Za-z]{10}/;
const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;
const SCHEMELESS_RE = /(?:^|\s)((?:www\.)?(?:bilibili\.com|b23\.tv|bili2233\.cn)\/[^\s<>"')\]]+)/gi;
const SHORT_HOST_RE = /(?:^|\.)(b23\.tv|bili2233\.cn|bili22\.cn)$/i;
const BILI_HOST_RE = /(?:^|\.)(bilibili\.com|b23\.tv|bili2233\.cn|bili22\.cn)$/i;

export function canonicalVideoUrl(bvid) {
  return `https://www.bilibili.com/video/${bvid}`;
}

export function extractBvid(text) {
  const match = String(text ?? '').match(BV_RE);
  return match ? match[0] : '';
}

function stripTrailingPunctuation(url) {
  return url.replace(/[.,;:!?。，、；：！？]+$/u, '');
}

export function extractUrls(text) {
  const raw = String(text ?? '');
  const urls = [];
  for (const match of raw.match(URL_RE) ?? []) {
    urls.push(stripTrailingPunctuation(match));
  }
  for (const match of raw.matchAll(SCHEMELESS_RE)) {
    const token = stripTrailingPunctuation(match[1] ?? '');
    if (token) urls.push(`https://${token}`);
  }
  return [...new Set(urls)];
}

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function isBilibiliUrl(url) {
  const host = hostOf(url);
  return host ? BILI_HOST_RE.test(host) : /bilibili\.|b23\.tv|bili2233\.cn/i.test(url);
}

export function looksLikeBilibiliPaste(text) {
  const raw = String(text ?? '');
  if (extractBvid(raw)) return true;
  return extractUrls(raw).some(isBilibiliUrl);
}

export function isCanonicalVideoUrl(url, bvid) {
  if (!url || !bvid) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    return (
      parsed.protocol === 'https:' &&
      host === 'bilibili.com' &&
      parsed.pathname.replace(/\/+$/, '') === `/video/${bvid}` &&
      parsed.search === '' &&
      parsed.hash === ''
    );
  } catch {
    return false;
  }
}

export function needsUrlWriteback(originalText, bvid) {
  if (!bvid) return false;
  const text = String(originalText ?? '').trim();
  if (!text) return false;
  if (isCanonicalVideoUrl(text, bvid)) return false;
  const markdown = text.match(/^\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
  if (markdown && isCanonicalVideoUrl(markdown[2], bvid)) return false;
  return true;
}

function isShortUrl(url) {
  const host = hostOf(url);
  return host ? SHORT_HOST_RE.test(host) : /b23\.tv|bili2233\.cn/i.test(url);
}

export async function resolveBvid(raw, { fetchImpl = fetch, timeoutMs = 30_000 } = {}) {
  const text = String(raw ?? '').trim();
  const direct = extractBvid(text);
  if (direct) return { bvid: direct, via: 'direct' };

  const biliUrl = extractUrls(text).find(isBilibiliUrl) ?? '';
  if (!biliUrl) return { bvid: '', via: null };

  const fromUrl = extractBvid(biliUrl);
  if (fromUrl) return { bvid: fromUrl, via: 'url' };

  if (!isShortUrl(biliUrl)) return { bvid: '', via: null };

  try {
    const response = await fetchImpl(biliUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const finalUrl = response.url ?? '';
    let bvid = extractBvid(finalUrl);
    if (!bvid && typeof response.text === 'function') {
      bvid = extractBvid(await response.text());
    }
    return { bvid, via: 'short-link', resolvedUrl: finalUrl };
  } catch (error) {
    return { bvid: '', via: 'short-link', error };
  }
}
