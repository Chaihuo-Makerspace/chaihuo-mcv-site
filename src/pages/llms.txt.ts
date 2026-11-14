import type { APIRoute } from 'astro';
import { loadLocalizedStops } from '@/features/route-map/stops-loader';
import about from '@/i18n/about';
import deconstruct from '@/i18n/deconstruct';
import guide from '@/i18n/guide';
import home from '@/i18n/home';
import journalsDict from '@/i18n/journals';
import live from '@/i18n/live';
import route from '@/i18n/route';
import ui from '@/i18n/ui';
import { getAllJournals, localizeJournal } from '@/lib/journals';

export const prerender = true;

// llms.txt（https://llmstxt.org）：给生成式引擎的站点摘要与关键页面索引（GEO）。
// 全部内容取自 i18n 字典、stops 与日记集合，不另写事实，避免与页面漂移。
export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://mcv.chaihuo.org')).origin;
  const [journals, zhStops, enStops] = await Promise.all([
    getAllJournals(),
    loadLocalizedStops('zh'),
    loadLocalizedStops('en'),
  ]);

  const pages = (prefix: string, l: 'zh' | 'en') =>
    [
      ['/', home[l].title, home[l].description],
      ['/route/', route[l]['route.pageTitle'], route[l]['route.pageDesc']],
      ['/journals/', journalsDict[l].title, journalsDict[l].description],
      ['/deconstruct/', deconstruct[l].title, deconstruct[l].description],
      ['/live/', live[l].title, live[l].description],
      ['/guide/', guide[l].title, guide[l].description],
      ['/about/', about[l].title, about[l].description],
    ].map(([p, title, desc]) => `- [${title}](${origin}${prefix}${p}): ${desc}`);

  const cities = (stops: typeof zhStops) =>
    stops
      .filter((s) => s.visited && !s.routeOnly)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.label)
      .join(' → ');

  const journalLines = journals
    .filter((j) => j.data.status === 'published')
    .map((j) => {
      const zh = localizeJournal(j, zhStops, 'zh');
      return `- [${zh.date} ${zh.title}](${origin}/journals/${j.id}/)${zh.cityLabel ? `（${zh.cityLabel}）` : ''}: ${zh.excerpt}`;
    });

  const body = [
    `# ${ui.zh['site.name']}（${ui.en['site.name']}）`,
    '',
    `> ${ui.zh['site.description']}`,
    `> ${ui.en['site.description']}`,
    '',
    '由柴火创客空间（Chaihuo Makerspace, https://www.chaihuo.org）发起与运营。中文页面无前缀，英文镜像位于 /en/。',
    '',
    '## 页面（中文）',
    ...pages('', 'zh'),
    '',
    '## Pages (English)',
    ...pages('/en', 'en'),
    '',
    '## 抵达城市 / Cities visited',
    cities(zhStops),
    cities(enStops),
    '',
    '## 旅途日记 / Journals',
    ...journalLines,
    '',
    '## Optional',
    `- [Sitemap](${origin}/sitemap.xml)`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
