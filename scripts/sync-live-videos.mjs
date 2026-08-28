#!/usr/bin/env node
// 从飞书多维表格同步「路上视频」到 src/data/live-videos.json，支持 B 站和抖音两个平台。
// 数据源：https://seeedstudio.feishu.cn/base/EpPpbh8ndaHS1asFeCgcyp0Fnse （表「路上视频」）
// 无发布闸门：必填字段齐全的记录即同步；不完整的跳过并报警。「排序」越大越靠前，留空按发布日期倒序。
// 平台差异：
//   B 站 — 封面/时长缺了走 B 站公开接口自动补；表里传了「封面」附件则优先用附件。
//   抖音 — 没有可用的公开接口：封面必须走表里的「封面」附件，「时长(秒)」必须手填；
//          v.douyin.com 短链会跟随 302 解析出真实视频 ID。
// 用法：FEISHU_APP_ID=xxx FEISHU_APP_SECRET=xxx node scripts/sync-live-videos.mjs
// GitHub Actions: .github/workflows/sync-live-videos.yml
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'src/data/live-videos.json');
const COVER_DIR = path.join(ROOT, 'public/live/videos');
const COVER_WIDTH = 960; // 与现有封面一致 960x540

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN ?? 'EpPpbh8ndaHS1asFeCgcyp0Fnse';
const TABLE_ID = process.env.FEISHU_TABLE_ID ?? 'tblOiBmRcqj8xLaZ';
const FETCH_TIMEOUT_MS = Number(process.env.FEISHU_SYNC_TIMEOUT_MS ?? 30_000);

if (!APP_ID || !APP_SECRET) {
  console.error('[sync] 缺少 FEISHU_APP_ID / FEISHU_APP_SECRET');
  process.exit(1);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${url} → HTTP ${response.status} ${body.slice(0, 300)}`);
  }
  return response.json();
}

async function getTenantToken() {
  const data = await fetchJson(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
    },
  );
  if (data.code !== 0) throw new Error(`tenant_access_token 失败：${data.msg} (${data.code})`);
  return data.tenant_access_token;
}

async function listRecords(token) {
  const records = [];
  let pageToken;
  do {
    const url = new URL(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/records`,
    );
    url.searchParams.set('page_size', '200');
    if (pageToken) url.searchParams.set('page_token', pageToken);
    const data = await fetchJson(url, { headers: { Authorization: `Bearer ${token}` } });
    if (data.code !== 0) throw new Error(`读取记录失败：${data.msg} (${data.code})`);
    records.push(...(data.data?.items ?? []));
    pageToken = data.data?.has_more ? data.data.page_token : undefined;
  } while (pageToken);
  return records;
}

// 文本/URL 字段读回来是分段数组；公式、单选等是标量；URL 字段是 { link, text } 对象。统一拍平成字符串。
function asText(value) {
  if (value == null) return '';
  if (Array.isArray(value))
    return value
      .map((seg) => seg?.text ?? seg?.link ?? '')
      .join('')
      .trim();
  if (typeof value === 'object') return String(value.link ?? value.text ?? '').trim();
  return String(value).trim();
}

// b23.tv 是 B 站短链域名，v.douyin.com 是抖音短链域名
function detectPlatform(url) {
  if (/bilibili\.|b23\.tv/.test(url)) return 'bilibili';
  if (/douyin\.|iesdouyin\./.test(url)) return 'douyin';
  return null;
}

function canonicalUrl(platform, id) {
  return platform === 'bilibili'
    ? `https://www.bilibili.com/video/${id}`
    : `https://www.douyin.com/video/${id}`;
}

// B 站封面沿用 <bvid>.webp（不触发重新下载），抖音加平台前缀避免与 BV 号撞名
function coverFileName(platform, id) {
  return platform === 'bilibili' ? `${id}.webp` : `douyin-${id}.webp`;
}

// b23.tv / v.douyin.com 短链本身不含视频 ID，跟随 302 拿到真实地址
async function resolveShortLink(url) {
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  return response.headers.get('location') ?? '';
}

// 返回 entry 或 null；抖音短链需要联网解析，所以是 async
// 没有「状态」闸门：必填字段齐全即为可发布，不完整的记录跳过并报警
async function toVideo(record, warnings) {
  const f = record.fields ?? {};
  const url = asText(f['视频链接']);

  const platform = detectPlatform(url);
  if (!platform) {
    warnings.push(`跳过记录 ${record.record_id}：链接不是 B 站或抖音（${url || '空链接'}）`);
    return null;
  }

  // 「视频ID」是表里的公式字段（旧名 BVID，两个名字都认）；提不到就从链接正则兜底，短链先解析
  const fieldId = asText(f['视频ID'] ?? f['BVID']);
  let id = fieldId;
  if (!id) {
    let target = url;
    if (/b23\.tv|v\.douyin\.com/.test(url)) {
      try {
        target = await resolveShortLink(url);
      } catch (error) {
        warnings.push(`记录 ${record.record_id} 短链解析失败：${error.message}`);
      }
    }
    id =
      platform === 'bilibili'
        ? (target.match(/BV[0-9A-Za-z]{10}/)?.[0] ?? '')
        : (target.match(/video\/(\d{6,})/)?.[1] ?? '');
  }

  const valid = platform === 'bilibili' ? /^BV[0-9A-Za-z]{10}$/.test(id) : /^\d{6,}$/.test(id);
  if (!valid) {
    warnings.push(`跳过记录 ${record.record_id}：无法从链接提取有效视频 ID（${url || '空链接'}）`);
    return null;
  }

  // 排序读回来是字符串（"5"），空单元格是 null/undefined/""，要显式区分
  const rawSort = f['排序'];
  const sortNum =
    rawSort === null || rawSort === undefined || rawSort === '' ? null : Number(rawSort);

  // 「封面」是附件字段，值是对象数组，取第一个的 file_token（下载在 ensureCover 阶段做）
  const attachments = Array.isArray(f['封面']) ? f['封面'] : [];
  const coverFileToken = attachments[0]?.file_token ?? null;

  const entry = {
    platform,
    id,
    url: canonicalUrl(platform, id),
    cover: `/live/videos/${coverFileName(platform, id)}`,
    date: formatDate(f['发布日期']),
    duration: Math.round(Number(f['时长(秒)'])) || 0,
    eyebrow: asText(f['分类']),
    eyebrow_en: asText(f['分类 EN']),
    title: asText(f['标题']),
    title_en: asText(f['标题 EN']),
    description: asText(f['描述']),
    description_en: asText(f['描述 EN']),
    sort: Number.isFinite(sortNum) ? sortNum : null,
    coverFileToken,
  };

  const missing = [
    'eyebrow',
    'eyebrow_en',
    'title',
    'title_en',
    'description',
    'description_en',
  ].filter((key) => !entry[key]);
  // 抖音没有公开接口，日期/时长/封面都必须手工给；B 站留空可以走接口补
  if (platform === 'douyin' && !entry.date) missing.push('发布日期（抖音需手填）');
  if (platform === 'douyin' && entry.duration <= 0) missing.push('时长(秒)（抖音需手填）');
  if (
    platform === 'douyin' &&
    !coverFileToken &&
    !existsSync(path.join(COVER_DIR, coverFileName(platform, id)))
  )
    missing.push('封面（抖音需上传附件）');
  if (missing.length > 0) {
    warnings.push(
      `跳过 ${platform}:${id}（${entry.title || '无标题'}）：缺少 ${missing.join('、')}`,
    );
    return null;
  }
  return entry;
}

function formatDate(value) {
  const ms = typeof value === 'number' ? value : Date.parse(asText(value));
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

function sortVideos(videos) {
  // 排序字段越大越靠前；留空的排最后，按发布日期倒序
  return videos.sort((a, b) => {
    const sa = a.sort ?? Number.NEGATIVE_INFINITY;
    const sb = b.sort ?? Number.NEGATIVE_INFINITY;
    if (sa !== sb) return sb - sa;
    return b.date.localeCompare(a.date);
  });
}

async function writeCover(buffer, outPath) {
  await sharp(buffer)
    .resize({ width: COVER_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(outPath);
}

// 飞书 drive 媒体下载（需要 drive:drive:readonly，已开通）
async function downloadAttachment(token, fileToken) {
  const response = await fetch(
    `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    },
  );
  if (!response.ok) throw new Error(`附件下载失败 HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function ensureCoverAndDuration(entry, token) {
  const coverPath = path.join(COVER_DIR, coverFileName(entry.platform, entry.id));
  if (existsSync(coverPath) && entry.duration > 0 && entry.date) return;

  // 表里传了封面附件：优先用附件（抖音的唯一来源，B 站可用它覆盖自动抓取）
  if (!existsSync(coverPath) && entry.coverFileToken) {
    try {
      await writeCover(await downloadAttachment(token, entry.coverFileToken), coverPath);
      console.log(`[sync] 封面已生成（附件）${entry.cover}`);
    } catch (error) {
      console.warn(`[sync] ${entry.platform}:${entry.id} 附件封面下载失败：${error.message}`);
    }
  }

  if (entry.platform === 'douyin') {
    // 抖音无公开接口；到这里封面还没落盘就是真缺了（附件缺失的记录已在 toVideo 拦截）
    if (!existsSync(coverPath)) throw new Error(`${entry.id} 缺少封面且无法自动生成`);
    return;
  }

  // B 站公开接口补封面、时长和发布日期（pubdate = 上传时间；表里手填的日期优先）
  if (existsSync(coverPath) && entry.duration > 0 && entry.date) return;
  try {
    const data = await fetchJson(`https://api.bilibili.com/x/web-interface/view?bvid=${entry.id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Referer: 'https://www.bilibili.com',
      },
    });
    if (data.code !== 0) throw new Error(`B站接口返回 ${data.code}`);
    if (entry.duration <= 0 && Number.isInteger(data.data?.duration)) {
      entry.duration = data.data.duration;
    }
    if (!entry.date && Number.isInteger(data.data?.pubdate)) {
      entry.date = formatDate(data.data.pubdate * 1000);
    }
    if (!entry.date) throw new Error('接口未返回 pubdate，请在表里手填发布日期');
    if (!existsSync(coverPath) && data.data?.pic) {
      const picUrl = data.data.pic.replace(/^http:/, 'https:');
      const buf = Buffer.from(
        await (
          await fetch(picUrl, {
            headers: { Referer: 'https://www.bilibili.com' },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          })
        ).arrayBuffer(),
      );
      await writeCover(buf, coverPath);
      console.log(`[sync] 封面已生成 ${entry.cover}`);
    }
  } catch (error) {
    console.warn(`[sync] ${entry.id} 封面/时长/日期获取失败：${error.message}`);
    if (!existsSync(coverPath)) throw new Error(`${entry.id} 缺少封面且无法自动生成`);
    if (!entry.date) throw new Error(`${entry.id} 缺少发布日期且无法自动获取`);
  }
}

function emitGithubOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${String(value).replace(/[\r\n]+/g, ' ')}\n`);
}

function videoKey(video) {
  return `${video.platform}:${video.id}`;
}

function summarize(previous, next) {
  const prevById = new Map(previous.map((v) => [videoKey(v), v]));
  const nextById = new Map(next.map((v) => [videoKey(v), v]));
  const added = next.filter((v) => !prevById.has(videoKey(v)));
  const removed = previous.filter((v) => !nextById.has(videoKey(v)));
  const updated = next.filter((v) => {
    const old = prevById.get(videoKey(v));
    return (
      old &&
      JSON.stringify({ ...old, sort: undefined }) !== JSON.stringify({ ...v, sort: undefined })
    );
  });
  const parts = [];
  if (added.length > 0) parts.push(`新增路上视频${added.map((v) => `《${v.title}》`).join('')}`);
  if (updated.length > 0) parts.push(`更新 ${updated.length} 条路上视频`);
  if (removed.length > 0)
    parts.push(`下架路上视频${removed.map((v) => `《${v.title}》`).join('')}`);
  // 纯顺序调整（成员没变）：视频序列不同即为重排
  if (
    parts.length === 0 &&
    previous.length === next.length &&
    previous.some((v, i) => videoKey(v) !== (next[i] ? videoKey(next[i]) : ''))
  )
    parts.push('调整路上视频顺序');
  return parts.join(' · ');
}

const token = await getTenantToken();
const records = await listRecords(token);
const warnings = [];
const videos = [];
for (const record of records) {
  const entry = await toVideo(record, warnings);
  if (entry) videos.push(entry);
}
sortVideos(videos);
for (const warning of warnings) console.warn(`[sync] ${warning}`);
console.log(`[sync] 可同步视频 ${videos.length} 条（表中记录共 ${records.length} 条）`);

// 表里有记录但一条都同步不出来，多半是字段结构变了或数据源异常——宁可失败也不清空 JSON
if (videos.length === 0 && records.length > 0) {
  console.error('[sync] 所有记录均被跳过，疑似字段结构变化，放弃写入');
  process.exit(1);
}

for (const entry of videos) await ensureCoverAndDuration(entry, token);

const output = { videos: videos.map(({ sort, coverFileToken, ...rest }) => rest) };
const nextJson = `${JSON.stringify(output, null, 2)}\n`;
const prevVideos = existsSync(DATA_FILE)
  ? (JSON.parse(readFileSync(DATA_FILE, 'utf8')).videos ?? [])
  : [];

if (existsSync(DATA_FILE) && readFileSync(DATA_FILE, 'utf8') === nextJson) {
  console.log('[sync] 无变化');
} else {
  writeFileSync(DATA_FILE, nextJson);
  const summary = summarize(prevVideos, output.videos) || '同步路上视频';
  console.log(`[sync] ${summary}`);
  emitGithubOutput('summary', summary);
}
