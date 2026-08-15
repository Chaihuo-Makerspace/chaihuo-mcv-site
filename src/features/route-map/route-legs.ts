import type { Locale } from '@/i18n/index';
import type { Stop } from './stops-loader';

export type RouteLeg = {
  key: string; // province (zh, canonical join key)
  label: string; // localized short label, e.g. 粤 / GD
  fullName: string; // localized full province name, for tooltips
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  planned: boolean; // all stops unvisited — dates are placeholders, position after today
};

// Province → short label per locale. zh uses 单字简称, en uses two-letter codes.
const PROVINCE_SHORT: Record<string, { zh: string; en: string; enFull: string }> = {
  广东省: { zh: '粤', en: 'GD', enFull: 'Guangdong' },
  广西壮族自治区: { zh: '桂', en: 'GX', enFull: 'Guangxi' },
  贵州省: { zh: '黔', en: 'GZ', enFull: 'Guizhou' },
  四川省: { zh: '川', en: 'SC', enFull: 'Sichuan' },
  西藏自治区: { zh: '藏', en: 'XZ', enFull: 'Xizang' },
  青海省: { zh: '青', en: 'QH', enFull: 'Qinghai' },
  甘肃省: { zh: '甘', en: 'GS', enFull: 'Gansu' },
  宁夏回族自治区: { zh: '宁', en: 'NX', enFull: 'Ningxia' },
  陕西省: { zh: '陕', en: 'SX', enFull: 'Shaanxi' },
  新疆维吾尔自治区: { zh: '新', en: 'XJ', enFull: 'Xinjiang' },
  山西省: { zh: '晋', en: 'SH', enFull: 'Shanxi' },
  内蒙古自治区: { zh: '蒙', en: 'NM', enFull: 'Inner Mongolia' },
  北京市: { zh: '京', en: 'BJ', enFull: 'Beijing' },
  吉林省: { zh: '吉', en: 'JL', enFull: 'Jilin' },
  黑龙江省: { zh: '黑', en: 'HL', enFull: 'Heilongjiang' },
};

// Event dates come in loose formats: "2026.04.22", "2026.04.24 / 04.25", "2026.05.05–07".
// The first full date is what matters for positioning.
function parseEventDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// Stops without an event date get one interpolated between the nearest dated
// neighbors by route order — good enough for band positioning, never shown to users.
function resolveDates(stops: Stop[]): (string | null)[] {
  const dates = stops.map((s) => parseEventDate(s.event?.date));
  const datedIdx = dates.map((d, i) => (d ? i : -1)).filter((i) => i >= 0);
  if (datedIdx.length === 0) return dates;

  const first = datedIdx[0];
  const last = datedIdx[datedIdx.length - 1];
  for (let i = 0; i < first; i++) dates[i] = dates[first];
  for (let i = last + 1; i < dates.length; i++) dates[i] = dates[last];

  let anchor = first;
  for (let i = first + 1; i <= last; i++) {
    if (dates[i]) {
      const a = new Date(`${dates[anchor]}T00:00:00Z`).getTime();
      const b = new Date(`${dates[i]}T00:00:00Z`).getTime();
      for (let j = anchor + 1; j < i; j++) {
        const ratio = (j - anchor) / (i - anchor);
        const t = new Date(a + (b - a) * ratio);
        dates[j] = t.toISOString().slice(0, 10);
      }
      anchor = i;
    }
  }
  return dates;
}

/**
 * Group consecutive same-province stops into journey legs along the time axis.
 * Leg i spans [its first stop's date, leg i+1's start); the last leg ends at
 * its own last stop date.
 */
export function buildRouteLegs(stops: Stop[], locale: Locale): RouteLeg[] {
  const sorted = [...stops].sort((a, b) => a.order - b.order);
  const dates = resolveDates(sorted);

  const legs: RouteLeg[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const stop = sorted[i];
    const date = dates[i];
    if (!stop.province || !date) continue;

    const prev = legs[legs.length - 1];
    if (prev && prev.key === stop.province) {
      prev.endDate = date;
      prev.planned = prev.planned && !stop.visited;
      continue;
    }
    // Planned tail: the same province recurring later (e.g. 蒙→京→蒙 for
    // 呼和浩特→北京→赤峰) folds into its first planned leg — the band shows
    // each upcoming province once.
    if (!stop.visited && legs.some((leg) => leg.planned && leg.key === stop.province)) {
      continue;
    }
    const short = PROVINCE_SHORT[stop.province];
    legs.push({
      key: stop.province,
      label: short ? short[locale] : stop.province,
      fullName: locale === 'en' ? (short?.enFull ?? stop.province) : stop.province,
      startDate: date,
      endDate: date,
      planned: !stop.visited,
    });
  }

  // Each leg visually ends where the next begins (travel days belong to the road)
  for (let i = 0; i < legs.length - 1; i++) {
    legs[i].endDate = legs[i + 1].startDate;
  }
  return legs;
}
