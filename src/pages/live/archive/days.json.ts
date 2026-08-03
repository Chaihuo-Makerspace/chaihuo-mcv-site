import type { APIRoute } from 'astro';
import { listArchiveDays } from '@/lib/live';

// Gallery 日期筛选：archive 里有哪些天（最新在前）
export const GET: APIRoute = () => {
  return Response.json({ days: listArchiveDays() }, { headers: { 'Cache-Control': 'no-cache' } });
};
