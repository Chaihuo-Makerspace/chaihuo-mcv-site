import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { liveDataDir } from '@/lib/live';

const NAME_RE = /^\d{8}-\d{6}\.jpg$/;

// Gallery 原图：archive/<name>。严格校验文件名防路径穿越；?download=1 时走附件下载。
export const GET: APIRoute = ({ params, request }) => {
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
  const headers: Record<string, string> = {
    'Content-Type': 'image/jpeg',
    'Cache-Control': 'no-cache',
  };
  if (new URL(request.url).searchParams.get('download') === '1') {
    headers['Content-Disposition'] = `attachment; filename="${name}"`;
  }
  return new Response(new Uint8Array(data), { headers });
};
