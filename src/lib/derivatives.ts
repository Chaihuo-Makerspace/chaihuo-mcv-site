import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * public/ 派生图解析与图片尺寸读取(与 src/lib/people.ts 同一思路)。
 *
 * 派生图不入库(构建时由 scripts/generate-*.mjs 生成),所以这里逐个查存在性:
 * 没生成时回退原图,dev 首次启动或 CI 漏跑都不会瞎掉。
 *
 * existsSync / sharp 只能跑在 SSR/构建期 —— 请在 .astro frontmatter 里调用,
 * 不要把本模块引进 client island。
 */

// dev 下 import.meta.url 是源码路径;构建预渲染时却是 dist/server 产物
// 的路径,'../../public' 解析不到真实 public —— 两个候选都试,存在者胜。
function resolvePublicDir(anchor: string): string | undefined {
  return [
    fileURLToPath(new URL('../../public', import.meta.url)),
    join(process.cwd(), 'public'),
  ].find((dir) => existsSync(join(dir, anchor)));
}

/**
 * 生成一个把原图 URL 改写为派生图 URL 的解析器。
 *
 * @param variantDir 派生图目录(也是 URL 前缀),如 '/heroes/mobile'、
 *   '/deconstruct/solutions/thumb';其第一段目录用于定位 public。
 * 原图 `/deconstruct/solutions/a.jpg` 在该目录下解析为
 * `/deconstruct/solutions/thumb/a.webp`;派生图缺失时原样返回原图。
 */
export function createDerivativeResolver(variantDir: string): (src: string) => string {
  const anchor = variantDir.replace(/^\//, '').split('/')[0];
  const publicDir = resolvePublicDir(anchor);
  return (src: string): string => {
    if (!publicDir) return src;
    const base = src
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '');
    if (!base) return src;
    const url = `${variantDir}/${base}.webp`;
    return existsSync(join(publicDir, url)) ? url : src;
  };
}

/** 读取 public 下图片的原始宽高,文件不存在时返回 undefined。 */
export async function getPublicImageSize(
  src: string,
): Promise<{ width: number; height: number } | undefined> {
  const anchor = src.replace(/^\//, '').split('/')[0];
  const publicDir = resolvePublicDir(anchor);
  if (!publicDir) return undefined;
  const file = join(publicDir, src);
  if (!existsSync(file)) return undefined;
  const meta = await sharp(file).metadata();
  return meta.width && meta.height ? { width: meta.width, height: meta.height } : undefined;
}
