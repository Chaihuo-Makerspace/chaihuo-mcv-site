// /live 相似照片分组索引（capture 侧）。
// 车辆停着不动时摄像头画面几乎不变，web 端按分组把连拍的相似帧折叠展示。
//   data/live/archive-index.json
//   { "days": { "20260803": [{ "file": "20260803-145433.jpg", "group": 0 }, ...] } }
// 判定规则：新图与当天上一张已索引图的 dHash 汉明距离 < 阈值 → 同组（沿用上一张的
// group），否则 group+1；group 天内从 0 递增。阈值默认 5，可用 LIVE_SIMILAR_THRESHOLD 覆盖。
// 与 latest.jpg 一样先写临时文件再 rename，避免 web 读到半截文件。
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ARCHIVE_JPG_RE } from './live-thumbs.mjs';

const DEFAULT_SIMILAR_THRESHOLD = 5;

export function indexPath(dataDir) {
  return path.join(dataDir, 'archive-index.json');
}

/** 相似判定阈值（汉明距离）；LIVE_SIMILAR_THRESHOLD 非法时回落默认值 */
export function similarThreshold(env = process.env) {
  const value = Number(env.LIVE_SIMILAR_THRESHOLD ?? DEFAULT_SIMILAR_THRESHOLD);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_SIMILAR_THRESHOLD;
}

/**
 * 计算 64 位 dHash：缩到 9x8 灰度，行内相邻像素亮度比较（左 > 右记 1）。
 * 返回 16 位 hex 字符串。
 */
export async function computeDHash(buffer) {
  const pixels = await sharp(buffer).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let hash = 0n;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      hash <<= 1n;
      if (pixels[row * 9 + col] > pixels[row * 9 + col + 1]) hash |= 1n;
    }
  }
  return hash.toString(16).padStart(16, '0');
}

/** 两个 dHash（hex 字符串）的汉明距离 */
export function hammingDistance(a, b) {
  let xor = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let distance = 0;
  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
}

/** 读分组索引；文件不存在或损坏时按空索引处理 */
export function readIndex(dataDir) {
  try {
    const parsed = JSON.parse(readFileSync(indexPath(dataDir), 'utf8'));
    if (parsed && typeof parsed === 'object' && parsed.days && typeof parsed.days === 'object') {
      return parsed;
    }
  } catch {
    // 无索引或索引损坏则按空索引重建
  }
  return { days: {} };
}

/** 原子写索引（先写临时文件再 rename） */
export function writeIndex(dataDir, index) {
  mkdirSync(dataDir, { recursive: true });
  const tmp = `${indexPath(dataDir)}.tmp`;
  writeFileSync(tmp, JSON.stringify(index));
  renameSync(tmp, indexPath(dataDir));
}

/** 给 archive 里的一张图算 dHash；文件缺失返回 null */
async function hashOfFile(dataDir, file) {
  const filePath = path.join(dataDir, 'archive', file);
  if (!existsSync(filePath)) return null;
  return computeDHash(readFileSync(filePath));
}

/**
 * 抓拍成功后把一张图记入分组索引（buffer 为刚存盘的 JPEG，避免重复读盘）。
 * 失败向上抛出，由调用方决定记日志还是中断。
 */
export async function addToIndex(dataDir, file, buffer, threshold = similarThreshold()) {
  const index = readIndex(dataDir);
  const day = file.slice(0, 8);
  const entries = index.days[day] ?? [];
  const hash = await computeDHash(buffer);
  let group = 0;
  if (entries.length > 0) {
    const last = entries[entries.length - 1];
    const lastHash = await hashOfFile(dataDir, last.file);
    // 上一张原图已不在（被清理/手动删除）时无法比对，按新场景开新组
    group =
      lastHash !== null && hammingDistance(hash, lastHash) < threshold
        ? last.group
        : last.group + 1;
  }
  entries.push({ file, group });
  index.days[day] = entries;
  writeIndex(dataDir, index);
}

/** 从索引中删除已清理的归档记录；清空的天一并移除。无变化不写文件。 */
export function removeFromIndex(dataDir, files) {
  if (files.length === 0) return;
  const index = readIndex(dataDir);
  const removed = new Set(files);
  let changed = false;
  for (const day of Object.keys(index.days)) {
    const kept = index.days[day].filter((entry) => !removed.has(entry.file));
    if (kept.length === index.days[day].length) continue;
    changed = true;
    if (kept.length === 0) delete index.days[day];
    else index.days[day] = kept;
  }
  if (changed) writeIndex(dataDir, index);
}

/**
 * 启动回填：对 archive 里有但索引里缺的天逐天补算分组，返回补齐的天数。
 * 按文件名时间序逐张与上一张比对；每处理完一天就原子写一次，
 * 中断后下次启动从未补的天继续。单天失败只 log 并继续。
 */
export async function backfillIndex(dataDir, threshold = similarThreshold(), logFn = console.log) {
  const archiveDir = path.join(dataDir, 'archive');
  if (!existsSync(archiveDir)) return 0;
  const byDay = new Map();
  for (const file of readdirSync(archiveDir)) {
    if (!ARCHIVE_JPG_RE.test(file)) continue;
    const day = file.slice(0, 8);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(file);
  }
  const index = readIndex(dataDir);
  let filled = 0;
  for (const [day, files] of [...byDay.entries()].sort()) {
    if (index.days[day]) continue;
    try {
      const entries = [];
      let prevHash = null;
      let group = -1;
      for (const file of files.sort()) {
        const hash = await hashOfFile(dataDir, file);
        if (hash === null) continue;
        if (prevHash === null || hammingDistance(hash, prevHash) >= threshold) group += 1;
        entries.push({ file, group });
        prevHash = hash;
      }
      if (entries.length > 0) {
        index.days[day] = entries;
        writeIndex(dataDir, index);
        filled += 1;
      }
    } catch (error) {
      logFn(`分组索引回填失败（已跳过）：${day} —— ${error.message}`);
    }
  }
  return filled;
}
