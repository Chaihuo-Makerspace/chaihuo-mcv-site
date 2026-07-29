#!/usr/bin/env node
/**
 * 解构页解决方案缩略图派生。
 *
 * public/deconstruct/solutions 的 14 张 JPEG 是 155–355KB 的原图(共约 3MB),
 * 而车载技术卡片里只渲染在 h-28(112px)的盒子里 —— 等于按 3 倍以上像素在传。
 *
 * 这里生成一档 WebP 派生图:
 *   thumb/ 224px — 112px 渲染宽度 × 2(高密度屏)
 *
 * 保持原始宽高比。原图保留不动。派生图不入库:构建时由 `pnpm build` 生成;
 * 缺派生图时页面自动回退到原图(见 src/lib/derivatives.ts 的 existsSync 检查)。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'public/deconstruct/solutions');

/** 渲染尺寸 × 2(高密度屏),不是原图尺寸。 */
export const DERIVATIVES = [{ name: 'thumb', width: 224, quality: 74 }];

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

async function generate({ verbose = true } = {}) {
  if (!fs.existsSync(SOURCE_DIR)) {
    if (verbose) console.log('no solutions directory, nothing to do:', SOURCE_DIR);
    return { written: 0, skipped: 0 };
  }
  const files = fs.readdirSync(SOURCE_DIR).filter((f) => IMAGE_RE.test(f));
  let written = 0;
  let skipped = 0;
  let bytesIn = 0;
  let bytesOut = 0;

  for (const { name, width, quality } of DERIVATIVES) {
    const outDir = path.join(SOURCE_DIR, name);
    fs.mkdirSync(outDir, { recursive: true });

    for (const file of files) {
      const src = path.join(SOURCE_DIR, file);
      const out = path.join(outDir, `${path.parse(file).name}.webp`);
      const srcStat = fs.statSync(src);
      // Skip when the derivative is newer than its source — reruns are cheap.
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= srcStat.mtimeMs) {
        skipped += 1;
        continue;
      }
      await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(out);
      written += 1;
      bytesIn += srcStat.size;
      bytesOut += fs.statSync(out).size;
    }
  }

  if (verbose) {
    const saved = bytesIn
      ? ` (${Math.round(bytesIn / 1024)}KB → ${Math.round(bytesOut / 1024)}KB)`
      : '';
    console.log(`solution derivatives: ${written} written, ${skipped} up to date${saved}`);
  }
  return { written, skipped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generate().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default generate;
