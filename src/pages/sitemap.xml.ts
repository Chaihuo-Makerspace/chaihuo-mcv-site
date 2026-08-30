import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const prerender = true;

// 站点规模小（<50 条 URL），@astrojs/sitemap 默认产出
// sitemap-index.xml → sitemap-0.xml 两级套娃。改为单文件 sitemap.xml，
// 一层到底，robots.txt 直指本文件。排除管理端（/live/admin/）与 404。
const STATIC_PATHS = [
  '/',
  '/about/',
  '/deconstruct/',
  '/elements/',
  '/guide/',
  '/journals/',
  '/live/',
  '/route/',
];

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://mcv.chaihuo.org')).origin;

  const journals = await getCollection('journals');
  const journalPaths = journals
    .filter((j) => j.data.status === 'published')
    .map((j) => `/journals/${j.id}/`);

  const zhPaths = [...STATIC_PATHS, ...journalPaths];
  const paths = [...zhPaths, ...zhPaths.map((p) => (p === '/' ? '/en/' : `/en${p}`))].sort();

  const urls = paths.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
