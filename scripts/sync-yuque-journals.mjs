import { appendFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractAppData,
  extractCoverFromDocHtml,
  extractFirstImageFromDocContent,
  extractRouteTokens,
  inferCityId,
  loadStopCityKeywords,
  loadStopCoordinates,
  nearestStop,
  normalizeYuqueToc,
} from './lib/yuque-journal-sync.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const bookUrl = process.env.YUQUE_BOOK_URL ?? 'https://www.yuque.com/mouseart/mcv';
const outputPath = path.join(root, 'src/data/yuque-journals.json');
const imageDir = path.join(root, 'public/yuque-journals');
// Nominatim 地理编码结果缓存（入库提交）：结果稳定可审查，也避免每 10 分钟
// 重复请求公共实例。
const geocodeCachePath = path.join(root, 'src/data/geocode-cache.json');
const userAgent =
  process.env.YUQUE_USER_AGENT ??
  'Mozilla/5.0 (compatible; ChaihuoMCVSiteSync/1.0; +https://www.chaihuo.org)';
const requestTimeoutMs = Number(process.env.YUQUE_SYNC_TIMEOUT_MS ?? 30_000);

async function main() {
  const bookHtml = await fetchText(bookUrl);
  const appData = extractAppData(bookHtml);
  const namespace = appData.book?.namespace ?? namespaceFromUrl(bookUrl);
  const bookId = appData.book?.id;
  const entries = normalizeYuqueToc(appData.book?.toc ?? [], { namespace });

  const withCovers = (
    await mapWithConcurrency(entries, 4, async (entry) => {
      const coverResult = entry.coverImage
        ? { available: true, coverImage: entry.coverImage }
        : await fetchCover(entry.href, entry.slug, bookId);
      if (!coverResult.available) return null;

      const remoteCover = coverResult.coverImage;
      return {
        ...entry,
        updatedAt:
          entry.updatedAt ?? appData.book?.content_updated_at ?? appData.book?.updated_at ?? null,
        coverImage: remoteCover ? await downloadCoverImage(remoteCover, entry.slug) : null,
      };
    })
  ).filter(Boolean);

  // 标题不含任何地名的日记(如《…双车并进北上路…》)会落为 city: "yuque",
  // 路线自动更新就不会触发。兜底链:正文日期行关键词 → 中转链目的地
  // 地理编码就近归并。落选的日记很少,串行处理即可。
  const stopKeywords = loadStopCityKeywords();
  const stopCoordinates = loadStopCoordinates();
  const geocodeCache = await readJsonObject(geocodeCachePath);
  for (const entry of withCovers.filter((item) => item.city === 'yuque')) {
    const city = await inferCityFromDocBody(entry.slug, bookId, {
      stopKeywords,
      stopCoordinates,
      geocodeCache,
    });
    if (city) entry.city = city;
  }
  await writeCacheIfChanged(geocodeCachePath, geocodeCache);

  const payload = {
    source: {
      name: appData.book?.name ?? '柴火基地车车长日记',
      namespace,
      url: bookUrl,
      syncedAt: new Date().toISOString(),
      intervalMinutes: 10,
    },
    journals: withCovers,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  const previousSlugs = await readExistingSlugs(outputPath);
  const wrote = await writeJsonIfMateriallyChanged(outputPath, payload);
  if (wrote) {
    const added = withCovers.filter((entry) => !previousSlugs.has(entry.slug));
    emitGithubOutput('summary', syncSummary(added));
    console.log(
      `Synced ${withCovers.length} Yuque journal cards to ${path.relative(root, outputPath)}.`,
    );
  } else {
    console.log(`Yuque journal cards are already up to date (${withCovers.length} cards).`);
  }
}

async function readExistingSlugs(filePath) {
  try {
    const existing = JSON.parse(await readFile(filePath, 'utf8'));
    return new Set((existing.journals ?? []).map((journal) => journal.slug));
  } catch {
    return new Set();
  }
}

// One-line summary for the workflow's commit message, e.g.
// "新增基地车日记《2026.07.30｜隰县→临汾》" or "新增 4 篇基地车日记《A》《B》《C》等".
function syncSummary(added) {
  if (added.length === 0) return '更新基地车日记内容';
  const titles = added
    .slice(0, 3)
    .map((entry) => `《${shortTitle(entry.title)}》`)
    .join('');
  if (added.length === 1) return `新增基地车日记${titles}`;
  return `新增 ${added.length} 篇基地车日记${titles}${added.length > 3 ? '等' : ''}`;
}

// Titles arrive as "基地车日记｜2026.07.30｜隰县→临汾" — keep the part that
// tells you where the vehicle actually is.
function shortTitle(title) {
  return (title ?? '')
    .replace(/^基地车日记[｜|]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function emitGithubOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${String(value).replace(/[\r\n]+/g, ' ')}\n`);
}

// Title-based inference failed (city: "yuque") — try the doc's opening
// dateline ("2026.08.01 | 晴 | 临汾→洪洞→太原 | …"), which names the cities
// even when the title is poetic. If keywords still miss, geocode the
// destination token via Photon and fold it into the nearest route stop.
// Returns null when still unmatched.
async function inferCityFromDocBody(slug, bookId, { stopKeywords, stopCoordinates, geocodeCache }) {
  if (!bookId) return null;
  try {
    const docResponse = await fetchJson(docApiUrl(slug, bookId));
    const opening = String(docResponse.data?.content ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 200);
    const city = inferCityId(opening, stopKeywords);
    if (city !== 'yuque') return city;

    const destination = extractRouteTokens(opening).at(-1);
    if (!destination) return null;
    const candidates = await geocodePlace(destination, geocodeCache);
    if (!candidates) return null;
    // 同名地名会有多个候选(贵州也有个"洪洞"),取离路线站点最近的那个,
    // 阈值内才归并——宁可落选也不错标。
    let best = null;
    for (const point of candidates) {
      const hit = nearestStop(point.lng, point.lat, stopCoordinates);
      if (hit && (!best || hit.km < best.km)) best = hit;
    }
    if (best) {
      console.log(`Geocoded "${destination}" -> ${best.id} (${best.km.toFixed(1)}km)`);
    }
    return best?.id ?? null;
  } catch {
    return null;
  }
}

// Photon (photon.komoot.io, 基于 OpenStreetMap) 免费无需 key。
// 不用 Nominatim 公共实例是因为它在本机网络(国内)被 DNS 污染,
// Photon 本地和 GitHub Actions 都可达;结果写入 cache(含查不到的
// null),保证多次运行结果稳定。串行调用,频率远低于其 fair-use 限制。
// 返回全部中国候选点(不做单选),由调用方按路线站点距离消歧。
async function geocodePlace(name, cache) {
  if (name in cache) return cache[name];
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', name);
  url.searchParams.set('limit', '5');
  url.searchParams.set('bbox', '73,18,135,53'); // 中国范围
  try {
    const results = await fetchJson(url.toString());
    const points = (results?.features ?? [])
      .filter((item) => item.properties?.countrycode === 'CN' && item.geometry?.coordinates)
      .map((item) => ({
        lng: Number(item.geometry.coordinates[0]),
        lat: Number(item.geometry.coordinates[1]),
      }));
    cache[name] = points.length > 0 ? points : null;
  } catch (error) {
    console.warn(`Photon geocode failed for "${name}": ${error.message}`);
    cache[name] = null;
  }
  return cache[name];
}

async function readJsonObject(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return {};
  }
}

async function writeCacheIfChanged(filePath, cache) {
  const keys = Object.keys(cache);
  const existing = await readFile(filePath, 'utf8').catch(() => null);
  if (existing === null && keys.length === 0) return;
  const text = `${JSON.stringify(cache, null, 2)}\n`;
  if (existing !== text) await writeFile(filePath, text, 'utf8');
}

async function fetchCover(url, slug, bookId) {
  try {
    const docHtml = await fetchText(url);
    const fallbackCover = extractCoverFromDocHtml(docHtml);
    if (!bookId) return { available: true, coverImage: fallbackCover };

    const docResponse = await fetchJson(docApiUrl(slug, bookId));
    return {
      available: true,
      coverImage:
        extractFirstImageFromDocContent(docResponse.data?.content) ??
        docResponse.data?.cover ??
        fallbackCover,
    };
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      console.warn(`Skipping inaccessible Yuque doc ${url}: ${error.status}`);
      return { available: false, coverImage: null };
    }
    console.warn(`Unable to fetch cover for ${url}: ${error.message}`);
    return { available: true, coverImage: null };
  }
}

async function downloadCoverImage(url, slug) {
  const fileName = `${slug}.jpg`;
  const filePath = path.join(imageDir, fileName);
  await mkdir(imageDir, { recursive: true });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const downloadUrl = coverDownloadUrl(url);
    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': userAgent,
        Referer: bookUrl,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(`Unable to download cover ${url}: ${response.status} ${response.statusText}`);
      return url;
    }

    const nextImage = Buffer.from(await response.arrayBuffer());
    const existingImage = await readFile(filePath).catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (!existingImage?.equals(nextImage)) {
      await writeFile(filePath, nextImage);
    }
    return `/yuque-journals/${fileName}`;
  } catch (error) {
    console.warn(`Unable to download cover ${url}: ${error.message}`);
    return url;
  } finally {
    clearTimeout(timeout);
  }
}

function docApiUrl(slug, bookId) {
  const url = new URL(`/api/docs/${slug}`, bookUrl);
  url.searchParams.set('book_id', String(bookId));
  url.searchParams.set('merge_dynamic_data', 'false');
  return url.toString();
}

function coverDownloadUrl(url) {
  const parsed = new URL(url);
  if (parsed.hostname.endsWith('nlark.com') || parsed.hostname.endsWith('yuque.com')) {
    parsed.searchParams.set('x-oss-process', 'image/resize,w_960/quality,q_82/format,jpg');
  }
  return parsed.toString();
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = new Error(`GET ${url} failed with ${response.status} ${response.statusText}`);
      error.status = response.status;
      throw error;
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
        Referer: bookUrl,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = new Error(`GET ${url} failed with ${response.status} ${response.statusText}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = [];
  for (let index = 0; index < items.length; index += concurrency) {
    const batch = items.slice(index, index + concurrency);
    results.push(...(await Promise.all(batch.map(worker))));
  }
  return results;
}

async function writeJsonIfMateriallyChanged(filePath, payload) {
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  try {
    const existing = await readFile(filePath, 'utf8');
    const existingPayload = JSON.parse(existing);
    if (!hasMaterialChange(existingPayload, payload)) return false;
  } catch (error) {
    if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
  }
  await writeFile(filePath, text, 'utf8');
  return true;
}

function hasMaterialChange(existingPayload, nextPayload) {
  const existingComparable = comparablePayload(existingPayload);
  const nextComparable = comparablePayload(nextPayload);
  return JSON.stringify(existingComparable) !== JSON.stringify(nextComparable);
}

function comparablePayload(payload) {
  return {
    source: {
      name: payload.source?.name ?? null,
      namespace: payload.source?.namespace ?? null,
      url: payload.source?.url ?? null,
      intervalMinutes: payload.source?.intervalMinutes ?? null,
    },
    journals: payload.journals ?? [],
  };
}

function namespaceFromUrl(url) {
  const parsed = new URL(url);
  return parsed.pathname.replace(/^\/+|\/+$/g, '');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
