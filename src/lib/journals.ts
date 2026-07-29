import { type CollectionEntry, getCollection } from 'astro:content';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yuqueJournalsData from '@/data/yuque-journals.json';
import type { Stop } from '@/features/route-map/stops-loader';
import type { Locale } from '@/i18n/index';

export type JournalEntry = CollectionEntry<'journals'>;
export type JournalStatus = JournalEntry['data']['status'];

export interface LocalizedJournal {
  slug: string;
  date: string;
  status: JournalStatus;
  city: string;
  cityLabel: string;
  people: string[];
  title: string;
  excerpt: string;
  coverImage?: string;
  activities: string[];
  equipment: string[];
  yuqueUrl?: string;
  tags: string[];
}

/** All journals, newest first. Drafts excluded by default. */
export async function getAllJournals(
  opts: { includeDrafts?: boolean } = {},
): Promise<JournalEntry[]> {
  const all = await getCollection('journals');
  const filtered = opts.includeDrafts ? all : all.filter((j) => j.data.status !== 'draft');
  return filtered.sort((a, b) => b.data.date.localeCompare(a.data.date));
}

export function getJournalsByCity(journals: JournalEntry[], cityId: string): JournalEntry[] {
  return journals.filter((j) => j.data.city === cityId);
}

export function countByStatus(journals: JournalEntry[]): Record<JournalStatus, number> {
  const counts: Record<JournalStatus, number> = {
    published: 0,
    placeholder: 0,
    draft: 0,
  };
  for (const j of journals) counts[j.data.status]++;
  return counts;
}

/** Resolve a stable city id to its Stop within a provided cities[] (or undefined). */
export function findCity(cityId: string, cities: Stop[]): Stop | undefined {
  return cities.find((c) => c.id === cityId);
}

/** Apply locale-aware field selection to a journal for rendering. */
export function localizeJournal(
  entry: JournalEntry,
  cities: Stop[],
  locale: Locale,
): LocalizedJournal {
  const d = entry.data;
  const city = findCity(d.city, cities);
  const cityLabel = city ? city.label : d.city;
  const activities = locale === 'en' && d.activities_en.length > 0 ? d.activities_en : d.activities;
  return {
    slug: entry.id,
    date: d.date,
    status: d.status,
    city: d.city,
    cityLabel,
    people: d.people,
    title: locale === 'en' && d.title_en ? d.title_en : d.title,
    excerpt: locale === 'en' && d.excerpt_en ? d.excerpt_en : d.excerpt,
    coverImage: d.coverImage,
    activities,
    equipment: d.equipment,
    yuqueUrl: d.yuqueUrl,
    tags: d.tags,
  };
}

export interface RouteJournal {
  slug: string;
  title: string;
  date: string;
  status: string;
  city: string;
  href?: string;
  /** 已发布的本地日记才有站内详情页 /journals/[slug] */
  hasPage?: boolean;
  coverImage?: string;
  /** 208px WebP — 故事流卡片与地图照片钉 */
  coverThumb?: string;
  /** 480px WebP — 城市面板首篇大图 */
  coverCard?: string;
}

// "基地车日记｜2026.05.22｜基地车首保…" / "基地车日记|2026.0727 西安理工…" → 去头
const YUQUE_TITLE_PREFIX = /^基地车日记\s*[|｜]\s*[\d.\-–/]+\s*[|｜]?\s*/;

/** 本地日记 + 语雀日记（同城同日去重：已发布本地稿优先，placeholder 让位语雀）。 */
export async function getRouteJournals(cities: Stop[], locale: Locale): Promise<RouteJournal[]> {
  const stopIds = new Set(cities.map((c) => c.id));
  const yuquePool = yuqueJournalsData.journals.filter((j) => j.date && stopIds.has(j.city));
  const yuqueKeys = new Set(yuquePool.map((j) => `${j.city}@${j.date}`));
  // placeholder 没有详情页;语雀已有同城同日正式稿时让位,否则留下做不可点的记录
  const local = (await getAllJournals())
    .map((j) => localizeJournal(j, cities, locale))
    .filter((l) => l.status === 'published' || !yuqueKeys.has(`${l.city}@${l.date}`))
    .map((l) => ({
      slug: l.slug,
      title: l.title,
      date: l.date,
      status: l.status as string,
      city: l.city,
      hasPage: l.status === 'published',
    }));
  const localKeys = new Set(local.map((j) => `${j.city}@${j.date}`));
  const yuque: RouteJournal[] = [];
  for (const j of yuquePool) {
    if (localKeys.has(`${j.city}@${j.date}`)) continue;
    yuque.push({
      slug: j.slug,
      title: j.title.replace(YUQUE_TITLE_PREFIX, ''),
      date: j.date,
      status: 'published',
      city: j.city,
      href: j.href,
      coverImage: j.coverImage ?? undefined,
    });
  }
  return withCoverDerivatives([...local, ...yuque].sort((a, b) => b.date.localeCompare(a.date)));
}

/**
 * 把封面指向 `scripts/generate-cover-thumbs.mjs` 生成的派生图。
 *
 * 语雀原图是 960px / 中位 100KB,而路线页最大只渲染到 132px —— 直接用原图等于
 * 按 9 倍像素传输。派生图不入库(构建时生成),所以这里逐个查存在性:没生成时
 * 回退原图,dev 首次启动或 CI 漏跑都不会瞎掉。
 */
function withCoverDerivatives(journals: RouteJournal[]): RouteJournal[] {
  // dev 下 import.meta.url 是源码路径;构建预渲染时却是 dist/server 产物
  // 的路径,'../../public' 解析不到真实 public —— 两个候选都试,存在者胜。
  const publicDir = [
    fileURLToPath(new URL('../../public', import.meta.url)),
    join(process.cwd(), 'public'),
  ].find((dir) => existsSync(join(dir, 'yuque-journals')));
  const resolve = (cover: string, variant: 'thumb' | 'card'): string | undefined => {
    if (!publicDir) return undefined;
    const slash = cover.lastIndexOf('/');
    if (slash < 0) return undefined;
    const dir = cover.slice(0, slash);
    const name = cover.slice(slash + 1).replace(/\.[^.]+$/, '');
    const url = `${dir}/${variant}/${name}.webp`;
    return existsSync(join(publicDir, url)) ? url : undefined;
  };
  return journals.map((j) => {
    if (!j.coverImage) return j;
    return {
      ...j,
      coverThumb: resolve(j.coverImage, 'thumb') ?? j.coverImage,
      coverCard: resolve(j.coverImage, 'card') ?? j.coverImage,
    };
  });
}
