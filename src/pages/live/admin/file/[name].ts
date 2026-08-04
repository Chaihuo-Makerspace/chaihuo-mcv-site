import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { liveDataDir } from '@/lib/live';
import { isAuthed } from '@/lib/live-auth';

const NAME_RE = /^\d{8}-\d{6}\.jpg$/;

// 后台下载 archive 原图（唯一下载入口，鉴权）。严格校验文件名防路径穿越。
export const GET: APIRoute = ({ params, request }) => {
  if (!isAuthed(request)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const name = params.name ?? '';
  if (!NAME_RE.test(name)) {
    return new Response('Bad Request: 非法文件名', { status: 400 });
  }
  let data: Buffer;
  try {
    data = readFileSync(path.join(liveDataDir(), 'archive', name));
  } catch {
    return new Response('Not found', { status: 404 });
  }
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-cache',
    },
  });
};
