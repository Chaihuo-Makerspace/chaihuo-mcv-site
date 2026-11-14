import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const prerender = true;

// 站点规模小（<50 条 URL），@astrojs/sitemap 默认产出
// sitemap-index.xml → sitemap-0.xml 两级套娃。改为单文件 sitemap.xml，
// 一层到底，robots.txt 直指本文件。排除管理端（/live/admin/）、404 与 noindex 的 /elements/。
// 每条 URL 附 xhtml:link hreflang 互指，日记附 lastmod。
const STATIC_PATHS = [
  '/',
  '/about/',
  '/deconstruct/',
  '/guide/',
  '/journals/',
  '/live/',
  '/route/',
];

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://mcv.chaihuo.org')).origin;

  const journals = await getCollection('journals');
  const lastmod = new Map<string, string>();
  const journalPaths = journals
    .filter((j) => j.data.status === 'published')
    .map((j) => {
      const path = `/journals/${j.id}/`;
      lastmod.set(path, j.data.date);
      return path;
    });

  const toEn = (p: string) => (p === '/' ? '/en/' : `/en${p}`);
  const zhPaths = [...STATIC_PATHS, ...journalPaths].sort();

  const urls = zhPaths
    .flatMap((zh) => {
      const en = toEn(zh);
      const alt = [
        `    <xhtml:link rel="alternate" hreflang="zh" href="${origin}${zh}"/>`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${origin}${en}"/>`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${zh}"/>`,
      ].join('\n');
      const mod = lastmod.get(zh);
      const modTag = mod ? `\n    <lastmod>${mod}</lastmod>` : '';
      return [zh, en].map(
        (p) => `  <url>\n    <loc>${origin}${p}</loc>${modTag}\n${alt}\n  </url>`,
      );
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
