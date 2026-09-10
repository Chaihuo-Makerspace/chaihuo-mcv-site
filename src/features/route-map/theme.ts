import { isSceneId, SCENES, type SceneId } from '@/lib/scenes.mjs';
import type { RouteCity } from './types';

/** Same ids as journal `category`. Map chips and diary chips share `src/lib/scenes.mjs`. */
export type ThemeType = SceneId;
export const THEME_ORDER = SCENES;

/** True when a city carries the given activity theme. */
export function cityMatchesTheme(city: Pick<RouteCity, 'themes'>, theme: ThemeType): boolean {
  return city.themes.includes(theme);
}

/** Count how many cities carry each theme. */
export function countThemes(cities: Pick<RouteCity, 'themes'>[]): Record<ThemeType, number> {
  const counts = Object.fromEntries(THEME_ORDER.map((theme) => [theme, 0])) as Record<
    ThemeType,
    number
  >;
  for (const city of cities) {
    for (const theme of THEME_ORDER) {
      if (cityMatchesTheme(city, theme)) counts[theme] += 1;
    }
  }
  return counts;
}

/** Map filter uses journal 场景, not stop Markdown `themes`. Origin stays bare. */
export function attachThemesFromJournals<
  T extends { id: string; isOrigin?: boolean; themes: ThemeType[] },
>(cities: T[], journals: { city: string; category?: string }[]): T[] {
  const byCity = new Map<string, Set<ThemeType>>();
  for (const journal of journals) {
    const category = journal.category;
    if (!isSceneId(category)) continue;
    const bucket = byCity.get(journal.city) ?? new Set<ThemeType>();
    bucket.add(category);
    byCity.set(journal.city, bucket);
  }
  return cities.map((city) => {
    if (city.isOrigin) return { ...city, themes: [] };
    const set = byCity.get(city.id);
    return { ...city, themes: set ? THEME_ORDER.filter((theme) => set.has(theme)) : [] };
  });
}
