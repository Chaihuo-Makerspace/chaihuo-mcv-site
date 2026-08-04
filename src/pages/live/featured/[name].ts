import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { liveDataDir } from '@/lib/live';

const NAME_RE = /^\d{8}-\d{6}\.webp$/;

// 公开轮播的精选展示图：featured/webp/<name>，缺失时回退 featured 原图。
// 精选由媒体担当人工把关，此路由无需鉴权。
export const GET: APIRoute = ({ params }) => {
  const name = params.name ?? '';
  if (!NAME_RE.test(name)) {
    return new Response('Bad Request: 非法文件名', { status: 400 });
  }
  const featuredDir = path.join(liveDataDir(), 'featured');
  try {
    const data = readFileSync(path.join(featuredDir, 'webp', name));
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/webp',
        // 内容永不变（按秒命名的快照），可长期缓存
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    try {
      const data = readFileSync(path.join(featuredDir, name.replace(/\.webp$/, '.jpg')));
      return new Response(new Uint8Array(data), {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-cache' },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  }
};
