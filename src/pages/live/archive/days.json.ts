import type { APIRoute } from 'astro';
import { listArchiveDays } from '@/lib/live';
import { isAuthed } from '@/lib/live-auth';

// 历史抓拍仅成员可见（公开 /live 只保留实时帧与精选轮播）
export const GET: APIRoute = ({ request }) => {
  if (!isAuthed(request)) {
    return new Response('Unauthorized', { status: 401 });
  }
  return Response.json({ days: listArchiveDays() }, { headers: { 'Cache-Control': 'no-cache' } });
};
