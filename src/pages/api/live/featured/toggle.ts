import type { APIRoute } from 'astro';
import { isAuthed } from '@/lib/live-auth';
import { toggleFeatured } from '@/lib/live-featured';

// 入选 ⇄ 取消精选（对已取消的记录再次入选 = 恢复）
export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  let body: { file?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad-request' }, { status: 400 });
  }
  if (typeof body.file !== 'string') {
    return Response.json({ ok: false, error: 'bad-request' }, { status: 400 });
  }
  const result = await toggleFeatured(body.file);
  if (!result.ok) {
    const status = result.error === 'expired' ? 410 : result.error === 'not-found' ? 404 : 400;
    return Response.json(result, { status });
  }
  return Response.json(result);
};
