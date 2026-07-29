#!/usr/bin/env node
/**
 * 人物头像派生图生成。
 *
 * public/people 里的照片有几张是相机原图(qu-jialu.png 2.0MB、ye-kaiwei.jpg
 * 1.76MB),而首页时间线只渲染 32px 车道头像和最大 128px 的"在车上"头像 ——
 * client:load 岛屿意味着这几 MB 会随首页首屏一起下载。
 *
 * 这里生成两档 WebP 派生图(按 2x 屏幕密度取宽度):
 *   avatars/64/  64px — 车道上的 32px 头像
 *   avatars/256/ 256px — "在车上"卡片的 128px 头像
 *
 * 保持原始宽高比(不裁方):ye-kaiwei 的头像依赖针对竖版原图调过的
 * transform 取景,方形预裁会让脸部位置跑偏。
 *
 * 原图保留不动。派生图不入库:构建时由 `pnpm build` 生成;缺派生图时页面
 * 自动回退到原图(见 src/lib/people.ts 的 existsSync 检查)。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'public/people');
const OUT_DIR = path.join(SOURCE_DIR, 'avatars');

/** 渲染尺寸 × 2(高密度屏),不是原图尺寸。 */
export const DERIVATIVES = [
  { name: '64', width: 64, quality: 74 },
  { name: '256', width: 256, quality: 78 },
];

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

async function generate({ verbose = true } = {}) {
  if (!fs.existsSync(SOURCE_DIR)) {
    if (verbose) console.log('no people directory, nothing to do:', SOURCE_DIR);
    return { written: 0, skipped: 0 };
  }
  const files = fs.readdirSync(SOURCE_DIR).filter((f) => IMAGE_RE.test(f));
  let written = 0;
  let skipped = 0;
  let bytesIn = 0;
  let bytesOut = 0;

  for (const { name, width, quality } of DERIVATIVES) {
    const outDir = path.join(OUT_DIR, name);
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
      if (name === '256') {
        bytesIn += srcStat.size;
        bytesOut += fs.statSync(out).size;
      }
    }
  }

  if (verbose) {
    const saved = bytesIn
      ? ` (256px: ${Math.round(bytesIn / 1024)}KB → ${Math.round(bytesOut / 1024)}KB)`
      : '';
    console.log(`avatar derivatives: ${written} written, ${skipped} up to date${saved}`);
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
