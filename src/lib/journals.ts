import { type CollectionEntry, getCollection } from 'astro:content';
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
  coverImage?: string;
}

// "基地车日记｜2026.05.22｜基地车首保…" / "基地车日记|2026.0727 西安理工…" → 去头
const YUQUE_TITLE_PREFIX = /^基地车日记\s*[|｜]\s*[\d.\-–/]+\s*[|｜]?\s*/;

/** 本地日记 + 语雀日记（同城同日去重，本地优先），供路线页城市面板使用。 */
export async function getRouteJournals(cities: Stop[], locale: Locale): Promise<RouteJournal[]> {
  const local = (await getAllJournals()).map((j) => {
    const l = localizeJournal(j, cities, locale);
    return { slug: l.slug, title: l.title, date: l.date, status: l.status as string, city: l.city };
  });
  const localKeys = new Set(local.map((j) => `${j.city}@${j.date}`));
  const stopIds = new Set(cities.map((c) => c.id));
  const yuque: RouteJournal[] = [];
  for (const j of yuqueJournalsData.journals) {
    if (!j.date || !stopIds.has(j.city) || localKeys.has(`${j.city}@${j.date}`)) continue;
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
  return [...local, ...yuque].sort((a, b) => b.date.localeCompare(a.date));
}
