import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { liveDataDir } from '@/lib/live';

// 从抓拍 volume 读 latest.jpg。capture 容器用临时文件 + rename 覆盖写，
// 所以这里永远不会读到半截文件。
export const GET: APIRoute = () => {
  try {
    const data = readFileSync(path.join(liveDataDir(), 'latest.jpg'));
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new Response('No capture yet', { status: 404 });
  }
};
