import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 把人物照片指向 `scripts/generate-people-avatars.mjs` 生成的派生图。
 *
 * public/people 里有相机原图(最大 2MB),而首页时间线最大只渲染 128px ——
 * 直接用原图等于按十几倍像素传输。派生图不入库(构建时生成),所以这里
 * 逐个查存在性:没生成时回退原图,dev 首次启动或 CI 漏跑都不会瞎掉。
 *
 * existsSync 只能跑在 SSR/构建期 —— 请在 .astro frontmatter 里调用,
 * 不要把本模块引进 client island。
 */
export function withAvatarDerivatives<T extends { image: string }>(
  items: T[],
): Array<T & { avatarThumb: string; avatarCard: string }> {
  // dev 下 import.meta.url 是源码路径;构建预渲染时却是 dist/server 产物
  // 的路径,'../../public' 解析不到真实 public —— 两个候选都试,存在者胜。
  const publicDir = [
    fileURLToPath(new URL('../../public', import.meta.url)),
    join(process.cwd(), 'public'),
  ].find((dir) => existsSync(join(dir, 'people')));
  const resolve = (image: string, variant: '64' | '256'): string | undefined => {
    if (!publicDir || !image.startsWith('/people/')) return undefined;
    const name = image.slice('/people/'.length).replace(/\.[^.]+$/, '');
    const url = `/people/avatars/${variant}/${name}.webp`;
    return existsSync(join(publicDir, url)) ? url : undefined;
  };
  return items.map((item) => ({
    ...item,
    avatarThumb: resolve(item.image, '64') ?? item.image,
    avatarCard: resolve(item.image, '256') ?? item.image,
  }));
}
