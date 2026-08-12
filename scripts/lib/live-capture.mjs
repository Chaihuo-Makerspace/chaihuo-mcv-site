import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { addToIndex, removeFromIndex, similarThreshold } from './live-similar.mjs';
import { ARCHIVE_JPG_RE, ensureThumb, removeThumb } from './live-thumbs.mjs';

// 萤石云开放平台。抓拍走云 API（不直连摄像头），设备离线是常态而非故障。
const EZVIZ_BASE = 'https://open.ys7.com/api/lapp';
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const HTTP_TIMEOUT_MS = 60_000;
// token 有效期约 7 天，剩余不足 1 天时提前刷新
const TOKEN_REFRESH_MARGIN_MS = 24 * 60 * 60 * 1000;
// 10001/10002: token 不存在或已过期 —— 刷新后重试一次
const TOKEN_ERROR_CODES = new Set([10_001, 10_002]);

export function loadConfig(env = process.env) {
  const required = ['EZVIZ_APP_KEY', 'EZVIZ_APP_SECRET', 'EZVIZ_DEVICE_SERIAL'];
  const missing = required.filter((name) => !String(env[name] ?? '').trim());
  if (missing.length > 0) {
    throw new Error(`缺少环境变量：${missing.join(', ')}`);
  }
  return {
    appKey: env.EZVIZ_APP_KEY.trim(),
    appSecret: env.EZVIZ_APP_SECRET.trim(),
    deviceSerial: env.EZVIZ_DEVICE_SERIAL.trim(),
    dataDir: path.resolve(env.LIVE_DATA_DIR ?? './data/live'),
    keepDays: Number(env.LIVE_KEEP_DAYS ?? 30),
    intervalMinutes: Number(env.LIVE_INTERVAL_MINUTES ?? 3),
    similarThreshold: similarThreshold(env),
  };
}

export function log(message) {
  console.log(`[live-capture] ${new Date().toISOString()} ${message}`);
}

async function apiPost(endpoint, params) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(`${EZVIZ_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
      signal: controller.signal,
    });
    const data = await response.json();
    // 注意：萤石返回的 code 有时是字符串 "200"，统一转数字再比较
    const code = Number(data.code);
    if (code !== 200) {
      const error = new Error(`萤石 API ${endpoint} 返回 code=${data.code} msg=${data.msg}`);
      error.code = code;
      throw error;
    }
    return data.data;
  } finally {
    clearTimeout(timer);
  }
}

function tokenCachePath(config) {
  return path.join(config.dataDir, '.token.json');
}

function readCachedToken(config) {
  try {
    const cached = JSON.parse(readFileSync(tokenCachePath(config), 'utf8'));
    // appKey 不一致说明换过凭证：旧账号的 token 即使没过期，
    // 查到的也是旧账号的设备列表（目标设备永远"离线"），必须重申请
    if (
      cached.appKey === config.appKey &&
      typeof cached.accessToken === 'string' &&
      Number(cached.expireTime) > Date.now() + TOKEN_REFRESH_MARGIN_MS
    ) {
      return cached.accessToken;
    }
  } catch {
    // 无缓存或缓存损坏则重新申请
  }
  return null;
}

export async function getToken(config) {
  const cached = readCachedToken(config);
  if (cached) return cached;
  const data = await apiPost('/token/get', { appKey: config.appKey, appSecret: config.appSecret });
  mkdirSync(config.dataDir, { recursive: true });
  writeFileSync(
    tokenCachePath(config),
    JSON.stringify({ appKey: config.appKey, accessToken: data.accessToken, expireTime: data.expireTime }),
  );
  log('已刷新萤石 accessToken');
  return data.accessToken;
}

/** 调需要 token 的接口；token 失效时刷新并重试一次 */
async function authedPost(config, endpoint, params) {
  let token = await getToken(config);
  try {
    return await apiPost(endpoint, { accessToken: token, ...params });
  } catch (error) {
    if (!TOKEN_ERROR_CODES.has(error.code)) throw error;
    unlinkSync(tokenCachePath(config));
    token = await getToken(config);
    return apiPost(endpoint, { accessToken: token, ...params });
  }
}

export async function isDeviceOnline(config) {
  // 设备少，一页足够；找不到目标设备按离线处理
  const list = await authedPost(config, '/device/list', { pageStart: '0', pageSize: '50' });
  const device = (list ?? []).find((item) => item.deviceSerial === config.deviceSerial);
  return device !== undefined && device.status === 1;
}

/** 校验并按 EOI 截断 JPEG。萤石 OSS 有时在 FFD9 后补零填充，截掉再存。 */
function trimToJpeg(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  const windowStart = Math.max(2, buffer.length - 1024);
  for (let i = buffer.length - 2; i >= windowStart; i -= 1) {
    if (buffer[i] === 0xff && buffer[i + 1] === 0xd9) return buffer.subarray(0, i + 2);
  }
  return null;
}

/** 从 JPEG 二进制里读 SOF 标记拿宽高（不做解码，仅为页面 width/height 属性） */
export function jpegDimensions(buffer) {
  let offset = 2; // 跳过 SOI (FF D8)
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (
      (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) ||
      marker === 0xc2
    ) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

/** 车辆本地时间（Asia/Shanghai）的归档文件名：YYYYMMDD-HHmmss */
function archiveName(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}${get('month')}${get('day')}-${get('hour')}${get('minute')}${get('second')}`;
}

function cleanArchive(config, logFn) {
  const archiveDir = path.join(config.dataDir, 'archive');
  const cutoff = new Date(Date.now() - config.keepDays * 24 * 60 * 60 * 1000);
  const cutoffName = archiveName(cutoff);
  const removedFiles = [];
  for (const file of readdirSync(archiveDir)) {
    if (!ARCHIVE_JPG_RE.test(file)) continue;
    if (file < `${cutoffName}.jpg`) {
      unlinkSync(path.join(archiveDir, file));
      removeThumb(config.dataDir, file);
      removedFiles.push(file);
    }
  }
  if (removedFiles.length > 0) {
    removeFromIndex(config.dataDir, removedFiles);
    logFn(`已清理 ${removedFiles.length} 张 ${config.keepDays} 天前的历史照片`);
  }
  cleanTrash(config, logFn);
}

/**
 * 顺带清理 featured 回收站里 mtime 超过 keepDays 的文件。
 * 目录可能不存在，按空处理；featured.json 由 web 端维护，这里只删文件本身。
 */
function cleanTrash(config, logFn) {
  const trashDir = path.join(config.dataDir, 'featured', 'trash');
  if (!existsSync(trashDir)) return;
  const cutoffMs = Date.now() - config.keepDays * 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const file of readdirSync(trashDir)) {
    const filePath = path.join(trashDir, file);
    try {
      const stat = statSync(filePath);
      if (!stat.isFile() || stat.mtimeMs >= cutoffMs) continue;
      unlinkSync(filePath);
      removed += 1;
    } catch {
      // 单个文件清理失败跳过，下轮再试
    }
  }
  if (removed > 0) logFn(`已清理回收站 ${removed} 个 ${config.keepDays} 天前的文件`);
}

/**
 * 抓拍一轮。
 * 返回 'captured'（存盘成功）或 'offline'（设备离线/不在列表，安静跳过）。
 * 其他错误（网络、API、文件校验）向上抛出，由调用方记录。
 */
export async function captureOnce(config, logFn = log) {
  const online = await isDeviceOnline(config);
  if (!online) {
    logFn('设备离线（车辆未开工），本轮跳过');
    return 'offline';
  }

  // 以发起抓拍请求的时刻为准：摄像头在车联网上拍照+回传要好几秒，
  // 用下载完成时刻会比画面 OSD 时间慢，跨分钟时页面上就对不上了。
  const capturedAt = new Date();

  const data = await authedPost(config, '/device/capture', { deviceSerial: config.deviceSerial });
  const picUrl = data?.picUrl;
  if (!picUrl) throw new Error('抓拍接口未返回 picUrl');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  let buffer;
  try {
    const response = await fetch(picUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`下载抓拍图失败：HTTP ${response.status}`);
    buffer = Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`抓拍图超过大小上限（${buffer.length} 字节）`);
  }
  const jpeg = trimToJpeg(buffer);
  if (!jpeg) throw new Error('下载结果不是完整 JPEG');
  const dimensions = jpegDimensions(jpeg) ?? { width: 1280, height: 720 };

  const archiveDir = path.join(config.dataDir, 'archive');
  mkdirSync(archiveDir, { recursive: true });

  const file = `${archiveName(capturedAt)}.jpg`;
  writeFileSync(path.join(archiveDir, file), jpeg);

  // 缩略图失败只告警：原图已存，可由启动时的 backfillThumbs 补齐
  try {
    await ensureThumb(config.dataDir, file);
  } catch (error) {
    logFn(`缩略图生成失败（不影响抓拍）：archive/${file} —— ${error.message}`);
  }

  // 分组索引失败只告警：该张不记 index，展示端会把无记录的图自成一组
  try {
    await addToIndex(config.dataDir, file, jpeg, config.similarThreshold);
  } catch (error) {
    logFn(`分组索引写入失败（不影响抓拍）：archive/${file} —— ${error.message}`);
  }

  // latest.jpg 覆盖写（先写临时文件再 rename，避免 web 读到半截文件）
  const latestTmp = path.join(config.dataDir, '.latest.tmp.jpg');
  writeFileSync(latestTmp, jpeg);
  renameSync(latestTmp, path.join(config.dataDir, 'latest.jpg'));

  const meta = {
    capturedAt: capturedAt.toISOString(),
    file: `archive/${file}`,
    bytes: jpeg.length,
    width: dimensions.width,
    height: dimensions.height,
    intervalMinutes: config.intervalMinutes,
    keepDays: config.keepDays,
  };
  writeFileSync(path.join(config.dataDir, 'latest.json'), JSON.stringify(meta, null, 2));

  cleanArchive(config, logFn);
  logFn(
    `抓拍成功：archive/${file}（${dimensions.width}x${dimensions.height}，${jpeg.length} 字节）`,
  );
  return 'captured';
}
