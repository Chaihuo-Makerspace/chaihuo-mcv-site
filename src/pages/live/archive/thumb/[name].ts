import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { liveDataDir } from '@/lib/live';

const NAME_RE = /^\d{8}-\d{6}\.webp$/;

// Gallery 缩略图：archive/thumb/<name>。严格校验文件名防路径穿越。
// 缩略图缺失时回退同名原图（兜底，前端不用处理）。
export const GET: APIRoute = ({ params }) => {
  const name = params.name ?? '';
  if (!NAME_RE.test(name)) {
    return new Response('Bad Request: 非法文件名', { status: 400 });
  }
  const archiveDir = path.join(liveDataDir(), 'archive');
  try {
    const data = readFileSync(path.join(archiveDir, 'thumb', name));
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/webp',
        // 内容永不变（按秒命名的快照），可长期缓存
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    // 回退原图：缩略图可能被回填补上，这里不强缓存
    try {
      const data = readFileSync(path.join(archiveDir, name.replace(/\.webp$/, '.jpg')));
      return new Response(new Uint8Array(data), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-cache',
        },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  }
};
