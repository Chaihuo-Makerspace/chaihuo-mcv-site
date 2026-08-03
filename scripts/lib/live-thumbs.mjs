// /live Gallery 缩略图生成（capture 侧）。
// web 容器只读挂载数据卷，无法运行时生成缩略图，所以在抓拍流程里顺带产出：
//   archive/YYYYMMDD-HHmmss.jpg        原图（1280x720 JPEG）
//   archive/thumb/YYYYMMDD-HHmmss.webp 缩略图（宽 320px，WebP quality 60）
// 与 latest.jpg 一样先写临时文件再 rename，避免 web 读到半截文件。
import { existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const THUMB_WIDTH = 320;
const THUMB_QUALITY = 60;
export const ARCHIVE_JPG_RE = /^\d{8}-\d{6}\.jpg$/;

export function thumbName(jpgName) {
  return `${jpgName.replace(/\.jpg$/, '')}.webp`;
}

export function thumbDir(dataDir) {
  return path.join(dataDir, 'archive', 'thumb');
}

/** 为单张 archive 原图生成缩略图；已存在则跳过。失败向上抛出，由调用方决定记日志还是中断。 */
export async function ensureThumb(dataDir, jpgName) {
  const out = path.join(thumbDir(dataDir), thumbName(jpgName));
  if (existsSync(out)) return false;
  mkdirSync(thumbDir(dataDir), { recursive: true });
  const tmp = `${out}.tmp`;
  try {
    await sharp(path.join(dataDir, 'archive', jpgName))
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toFile(tmp);
    renameSync(tmp, out);
  } catch (error) {
    // 清理半截临时文件，避免下次 ensureThumb 误判（正式名不存在就会重试）
    if (existsSync(tmp)) unlinkSync(tmp);
    throw error;
  }
  return true;
}

/**
 * 增量补齐 archive/ 下所有缺缩略图的原图，返回补齐数量。
 * 单张失败只 log 并继续，不中断整批（残图不影响其余）。
 */
export async function backfillThumbs(dataDir, logFn = console.log) {
  const archiveDir = path.join(dataDir, 'archive');
  let filled = 0;
  for (const file of readdirSync(archiveDir)) {
    if (!ARCHIVE_JPG_RE.test(file)) continue;
    try {
      if (await ensureThumb(dataDir, file)) filled += 1;
    } catch (error) {
      logFn(`缩略图生成失败（已跳过）：archive/${file} —— ${error.message}`);
    }
  }
  return filled;
}

/** 删除某张原图对应的缩略图（存在才删；thumb 目录可能不存在）。 */
export function removeThumb(dataDir, jpgName) {
  const out = path.join(thumbDir(dataDir), thumbName(jpgName));
  if (existsSync(out)) unlinkSync(out);
}
