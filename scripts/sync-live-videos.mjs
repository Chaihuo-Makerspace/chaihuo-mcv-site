#!/usr/bin/env node
// 从飞书多维表格同步「路上视频」到 src/data/live-videos.json，仅支持 B 站。
// 数据源：https://seeedstudio.feishu.cn/base/EpPpbh8ndaHS1asFeCgcyp0Fnse （表「路上视频」）
// 无发布闸门：必填字段齐全的记录即同步；不完整的跳过并报警。「排序」越大越靠前，留空按发布日期倒序。
// 录入只要贴链接：分享短链 / 带参数搜索链 / 纯 BV 号都会解析成标准 https://www.bilibili.com/video/<BV>，
// 并尽量写回表格「视频链接」。封面/发布日期缺了走 B 站公开接口自动补。
// 用法：FEISHU_APP_ID=xxx FEISHU_APP_SECRET=xxx node scripts/sync-live-videos.mjs
// GitHub Actions: .github/workflows/sync-live-videos.yml
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  canonicalVideoUrl,
  looksLikeBilibiliPaste,
  needsUrlWriteback,
  resolveBvid,
} from './lib/bilibili-url.mjs';

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

// 解析「视频链接」里随手贴的分享短链 / 带参搜索链 / 纯 BV 号。短链需要联网，所以是 async。
async function resolveRecord(record, warnings) {
  const f = record.fields ?? {};
  const originalUrl = asText(f['视频链接']);

  if (!looksLikeBilibiliPaste(originalUrl)) {
    warnings.push(`跳过记录 ${record.record_id}：链接不是 B 站（${originalUrl || '空链接'}）`);
    return null;
  }

  // 「视频ID」是表里的公式字段（旧名 BVID，两个名字都认）；提不到就从粘贴内容解析
  const fieldId = asText(f['视频ID'] ?? f['BVID']);
  let bvid = /^BV[0-9A-Za-z]{10}$/.test(fieldId) ? fieldId : '';
  if (!bvid) {
    const resolved = await resolveBvid(originalUrl, { timeoutMs: FETCH_TIMEOUT_MS });
    if (resolved.error) {
      warnings.push(`记录 ${record.record_id} 短链解析失败：${resolved.error.message}`);
    }
    bvid = resolved.bvid;
  }

  if (!/^BV[0-9A-Za-z]{10}$/.test(bvid)) {
    warnings.push(
      `跳过记录 ${record.record_id}：无法从链接提取有效 BV 号（${originalUrl || '空链接'}）`,
    );
    return null;
  }

  return {
    recordId: record.record_id,
    originalUrl,
    bvid,
    canonicalUrl: canonicalVideoUrl(bvid),
    needsWriteback: needsUrlWriteback(originalUrl, bvid),
    fields: f,
  };
}

// 没有「状态」闸门：必填字段齐全即为可发布，不完整的记录跳过并报警
function toVideo(resolved, warnings) {
  const { bvid, canonicalUrl, fields: f } = resolved;

  // 排序读回来是字符串（"5"），空单元格是 null/undefined/""，要显式区分
  const rawSort = f['排序'];
  const sortNum =
    rawSort === null || rawSort === undefined || rawSort === '' ? null : Number(rawSort);

  const entry = {
    bvid,
    url: canonicalUrl,
    cover: `/live/videos/${bvid}.webp`,
    date: formatDate(f['发布日期']),
    eyebrow: asText(f['分类']),
    eyebrow_en: asText(f['分类 EN']),
    title: asText(f['标题']),
    title_en: asText(f['标题 EN']),
    description: asText(f['描述']),
    description_en: asText(f['描述 EN']),
    sort: Number.isFinite(sortNum) ? sortNum : null,
  };

  const missing = [
    'eyebrow',
    'eyebrow_en',
    'title',
    'title_en',
    'description',
    'description_en',
  ].filter((key) => !entry[key]);
  if (missing.length > 0) {
    warnings.push(`跳过 ${bvid}（${entry.title || '无标题'}）：缺少 ${missing.join('、')}`);
    return null;
  }
  return entry;
}

async function writeBackCanonicalUrls(token, resolved) {
  const updates = resolved.filter((item) => item.needsWriteback);
  if (updates.length === 0) return;

  try {
    const data = await fetchJson(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/records/batch_update`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: updates.map((item) => ({
            record_id: item.recordId,
            fields: { 视频链接: item.canonicalUrl },
          })),
        }),
      },
    );
    if (data.code !== 0) {
      console.warn(`[sync] 回写标准链接失败：${data.msg} (${data.code})`);
      return;
    }
    console.log(`[sync] 已将 ${updates.length} 条视频链接转为标准 BV 地址`);
  } catch (error) {
    console.warn(`[sync] 回写标准链接失败：${error.message}`);
  }
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

// B 站公开接口补封面和发布日期（pubdate = 上传时间；表里手填的日期优先）
async function ensureCoverAndDate(entry) {
  const coverPath = path.join(COVER_DIR, `${entry.bvid}.webp`);
  if (existsSync(coverPath) && entry.date) return;
  try {
    const data = await fetchJson(
      `https://api.bilibili.com/x/web-interface/view?bvid=${entry.bvid}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Referer: 'https://www.bilibili.com',
        },
      },
    );
    if (data.code !== 0) throw new Error(`B站接口返回 ${data.code}`);
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
    console.warn(`[sync] ${entry.bvid} 封面/日期获取失败：${error.message}`);
    if (!existsSync(coverPath)) throw new Error(`${entry.bvid} 缺少封面且无法自动生成`);
    if (!entry.date) throw new Error(`${entry.bvid} 缺少发布日期且无法自动获取`);
  }
}

function emitGithubOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${String(value).replace(/[\r\n]+/g, ' ')}\n`);
}

function summarize(previous, next) {
  const prevById = new Map(previous.map((v) => [v.bvid, v]));
  const nextById = new Map(next.map((v) => [v.bvid, v]));
  const added = next.filter((v) => !prevById.has(v.bvid));
  const removed = previous.filter((v) => !nextById.has(v.bvid));
  const updated = next.filter((v) => {
    const old = prevById.get(v.bvid);
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
    previous.some((v, i) => v.bvid !== (next[i] ? next[i].bvid : ''))
  )
    parts.push('调整路上视频顺序');
  return parts.join(' · ');
}

const token = await getTenantToken();
const records = await listRecords(token);
const warnings = [];
const resolved = [];
for (const record of records) {
  const item = await resolveRecord(record, warnings);
  if (item) resolved.push(item);
}
await writeBackCanonicalUrls(token, resolved);

const videos = [];
for (const item of resolved) {
  const entry = toVideo(item, warnings);
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

for (const entry of videos) await ensureCoverAndDate(entry);

const output = { videos: videos.map(({ sort, ...rest }) => rest) };
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
