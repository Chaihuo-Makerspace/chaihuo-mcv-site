import config from '@/data/expedition-config.json';
import type { Stop } from './stops-loader';
import { isRouteOnlyCity } from './types';

/**
 * The route's third axis: TIME.
 *
 * Stop frontmatter carries `event.date` for most — but not all — stops, and in
 * loose human formats ("2026.04.22", "2026.04.24/04.25", "2026.05.05–07").
 * This module normalises those to ISO dates, fills the gaps by interpolating
 * between the nearest dated neighbours (flagged `guessed` so the UI can show a
 * dashed tick instead of claiming a date it doesn't have), and derives the
 * day-N counter the CityPanel reads.
 */

export interface StopTime {
  /** ISO yyyy-mm-dd, or null when the stop sits past the last dated one. */
  date: string | null;
  /** True when the date was interpolated rather than authored. */
  guessed: boolean;
  /** 1-based day of the expedition (day 1 = origin), null without a date. */
  day: number | null;
}

const ISO = /(\d{4})[.-](\d{2})[.-](\d{2})/;

/** First calendar date inside a loose frontmatter date string. */
export function parseStopDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = ISO.exec(raw);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

const dayMs = 86_400_000;
const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * Timeline for the route, keyed by stop id. Only non-routeOnly stops are
 * included — return legs share a city and would double-count days.
 */
export function buildTimeline(cities: Stop[]): Map<string, StopTime> {
  const ordered = [...cities].filter((c) => !isRouteOnlyCity(c)).sort((a, b) => a.order - b.order);

  const dates: (string | null)[] = ordered.map((c) => parseStopDate(c.event?.date));
  const guessed: boolean[] = ordered.map(() => false);
  const known = dates.map((d, i) => (d ? i : -1)).filter((i) => i >= 0);

  // Interpolate interior gaps only: a stop past the last dated one has no
  // honest date to give (the planned tail), so it stays null.
  for (let i = 0; i < ordered.length; i++) {
    if (dates[i]) continue;
    const prev = [...known].reverse().find((k) => k < i);
    const next = known.find((k) => k > i);
    if (prev === undefined || next === undefined) continue;
    const a = toMs(dates[prev] as string);
    const b = toMs(dates[next] as string);
    dates[i] = toIso(a + ((b - a) * (i - prev)) / (next - prev));
    guessed[i] = true;
  }

  const origin = dates.find((d) => d);
  const originMs = origin ? toMs(origin) : null;

  const result = new Map<string, StopTime>();
  ordered.forEach((c, i) => {
    const date = dates[i];
    result.set(c.id, {
      date,
      guessed: guessed[i],
      day: date && originMs !== null ? Math.round((toMs(date) - originMs) / dayMs) + 1 : null,
    });
  });
  return result;
}

/** How many journals each stop carries, keyed by stop id. */
export function countJournalsByCity(journals: { city: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const j of journals) counts[j.city] = (counts[j.city] ?? 0) + 1;
  return counts;
}

export interface ExpeditionStats {
  days: number | null;
  cities: number;
  visitedCities: number;
  journals: number;
  maxAltitude: number;
  /** 实际道路里程 (km). */
  visitedKm: number;
}

const R_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
function greatCircleKm(a: Stop, b: Stop): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(h));
}

/** Headline numbers for the topbar — data-driven. */
export function expeditionStats(
  cities: Stop[],
  journals: { city: string }[],
  timeline: Map<string, StopTime>,
): ExpeditionStats {
  const visible = cities.filter((c) => !isRouteOnlyCity(c)).sort((a, b) => a.order - b.order);
  const visited = visible.filter((c) => c.visited);
  const lastVisited = visited[visited.length - 1];

  // 实际道路里程（优先取配置值，无配置时回退到大圆弧近似）
  let visitedKm: number;
  if (config.actualRoadKm) {
    visitedKm = config.actualRoadKm;
  } else {
    visitedKm = 0;
    for (let i = 1; i < visited.length; i++) {
      visitedKm += greatCircleKm(visited[i - 1], visited[i]);
    }
  }

  return {
    days: lastVisited ? (timeline.get(lastVisited.id)?.day ?? null) : null,
    cities: visible.length,
    visitedCities: visited.length,
    journals: journals.length,
    maxAltitude: Math.max(0, ...visible.map((c) => parseFloat(c.altitude) || 0)),
    visitedKm,
  };
}
