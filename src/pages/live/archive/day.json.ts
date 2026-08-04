import type { APIRoute } from 'astro';
import { listArchiveDay } from '@/lib/live';
import { isAuthed } from '@/lib/live-auth';

const DAY_RE = /^\d{8}$/;

// 某天的归档列表：?d=YYYYMMDD，按小时分组正序。历史抓拍仅成员可见。
export const GET: APIRoute = ({ request }) => {
  if (!isAuthed(request)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const d = new URL(request.url).searchParams.get('d');
  if (d === null || !DAY_RE.test(d)) {
    return new Response('Bad Request: d 需为 YYYYMMDD', { status: 400 });
  }
  return Response.json({ hours: listArchiveDay(d) }, { headers: { 'Cache-Control': 'no-cache' } });
};
