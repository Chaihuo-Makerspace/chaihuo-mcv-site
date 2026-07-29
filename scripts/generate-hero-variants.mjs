#!/usr/bin/env node
/**
 * 首页 hero 轮播移动端派生图。
 *
 * public/heroes 的轮播图是桌面宽度原图(最大 karst-guangxi.webp 537KB),
 * 而 react-slick 会把所有 slide 一起渲染 —— 移动端首屏等于按全尺寸拉一整套。
 *
 * 这里生成一档 WebP 派生图:
 *   mobile/ 768px — 768px 以下视口的轮播背景(质量 72,轮播图带暗色遮罩,
 *   细节损失不可见)
 *
 * 保持原始宽高比。原图保留不动(桌面端继续用)。派生图不入库:构建时由
 * `pnpm build` 生成;缺派生图时页面自动回退到原图(见 src/lib/derivatives.ts
 * 的 existsSync 检查)。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'public/heroes');

/** 渲染尺寸 × 2(高密度屏),不是原图尺寸。 */
export const DERIVATIVES = [{ name: 'mobile', width: 768, quality: 72 }];

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

async function generate({ verbose = true } = {}) {
  if (!fs.existsSync(SOURCE_DIR)) {
    if (verbose) console.log('no heroes directory, nothing to do:', SOURCE_DIR);
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
    console.log(`hero derivatives: ${written} written, ${skipped} up to date${saved}`);
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
