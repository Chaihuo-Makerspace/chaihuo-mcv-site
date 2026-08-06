import type { APIRoute } from 'astro';
import { BUILD_ID } from '@/lib/build-info';

// 当前部署版本号：客户端轮询此端点，与页面 <meta name="build-id"> 比对，
// 不一致说明新部署已上线，页面自动刷新。禁止任何缓存（浏览器/CDN），否则检测不到新版本。
export const prerender = false;

export const GET: APIRoute = () => {
  return Response.json({ version: BUILD_ID }, { headers: { 'Cache-Control': 'no-store' } });
};
