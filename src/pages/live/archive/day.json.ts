import type { APIRoute } from 'astro';
import { listArchiveDay } from '@/lib/live';

const DAY_RE = /^\d{8}$/;

// Gallery 某天的归档列表：?d=YYYYMMDD，按小时分组正序
export const GET: APIRoute = ({ request }) => {
  const d = new URL(request.url).searchParams.get('d');
  if (d === null || !DAY_RE.test(d)) {
    return new Response('Bad Request: d 需为 YYYYMMDD', { status: 400 });
  }
  return Response.json({ hours: listArchiveDay(d) }, { headers: { 'Cache-Control': 'no-cache' } });
};
