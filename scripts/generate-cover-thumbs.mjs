#!/usr/bin/env node
/**
 * Yuque 封面派生图生成。
 *
 * 同步下来的封面是语雀原图:960px 宽、中位 103KB、51 张共 5MB。而实际渲染
 * 尺寸是故事流 104px、地图照片钉 36–58px、城市面板 132px —— 等于按 9 倍
 * 像素在传,弱网下故事流一条就能拖掉几 MB。
 *
 * 这里生成两档 WebP 派生图(按 2x 屏幕密度取宽度):
 *   thumb/ 208px — 故事流卡片 + 地图照片钉
 *   card/  480px — 城市面板首篇大图
 *
 * 原图保留不动(详情页/未来用途)。派生图不入库:构建时由 `pnpm build` 生成,
 * 所以语雀同步的 GitHub Action 不需要装依赖(它刻意不装)。
 * 缺派生图时页面自动回退到原图(见 src/pages/route.astro 的 existsSync 检查)。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'public/yuque-journals');

/** 渲染尺寸 × 2(高密度屏),不是原图尺寸。 */
export const DERIVATIVES = [
  { name: 'thumb', width: 208, quality: 72 },
  { name: 'card', width: 480, quality: 76 },
];

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

async function generate({ verbose = true } = {}) {
  if (!fs.existsSync(SOURCE_DIR)) {
    if (verbose) console.log('no cover directory, nothing to do:', SOURCE_DIR);
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
      if (name === 'thumb') {
        bytesIn += srcStat.size;
        bytesOut += fs.statSync(out).size;
      }
    }
  }

  if (verbose) {
    const saved = bytesIn
      ? ` (thumb: ${Math.round(bytesIn / 1024)}KB → ${Math.round(bytesOut / 1024)}KB)`
      : '';
    console.log(`cover derivatives: ${written} written, ${skipped} up to date${saved}`);
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
