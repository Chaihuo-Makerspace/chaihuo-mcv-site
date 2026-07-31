import type { APIRoute } from 'astro';
import { readLiveMeta } from '@/lib/live';

// 页面前端每 60s 轮询一次：有新 capturedAt 就静默换图
export const GET: APIRoute = () => {
  return Response.json(
    { meta: readLiveMeta(), serverTime: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-cache' } },
  );
};
