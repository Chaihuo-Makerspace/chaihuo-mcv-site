import type { Feature, FeatureCollection, LineString, Polygon } from 'geojson';
import type { StyleSpecification } from 'maplibre-gl';
import { geoData } from './projection';
import type { Stop } from './stops-loader';
import { PROVINCE_VISITED } from './visited-provinces';

// Mainland-China framing; keeps the whole national outline (never tight-crop).
export const CHINA_BOUNDS: [[number, number], [number, number]] = [
  [73.5, 17.5],
  [135.5, 53.8],
];

// Map background — warm PAPER, low saturation. The old design's failure was not
// warmth but flatness: bg/provinces/route all shared one tan, so nothing had
// hierarchy. Paper stays warm; hierarchy comes from lightness steps (paper →
// paper-white provinces → highlighter-yellow visited) and brand-dark for the
// completed route. (MapLibre styles can't read CSS vars, so the SSR skeleton
// imports this constant instead of hardcoding the hex.)
export const MAP_BG = '#f2ebd8';

// Province silhouette source — reuse the already-filtered geoData (no _JD).
export const provinceSource = {
  type: 'geojson' as const,
  data: geoData as unknown as FeatureCollection,
};

/** Centripetal Catmull-Rom (sqrt-distance parameterization, less overshoot than uniform). */
function catmullRom(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  steps: number,
): [number, number][] {
  const dist = (a: [number, number], b: [number, number]) =>
    Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), 1e-4);
  const t0 = 0;
  const t1 = t0 + Math.sqrt(dist(p0, p1));
  const t2 = t1 + Math.sqrt(dist(p1, p2));
  const t3 = t2 + Math.sqrt(dist(p2, p3));
  const out: [number, number][] = [];
  for (let s = 0; s <= steps; s++) {
    const t = t1 + ((t2 - t1) * s) / steps;
    const lerp = (
      a: [number, number],
      b: [number, number],
      ta: number,
      tb: number,
    ): [number, number] => [
      (a[0] * (tb - t) + b[0] * (t - ta)) / (tb - ta),
      (a[1] * (tb - t) + b[1] * (t - ta)) / (tb - ta),
    ];
    const a1 = lerp(p0, p1, t0, t1);
    const a2 = lerp(p1, p2, t1, t2);
    const a3 = lerp(p2, p3, t2, t3);
    const b1 = lerp(a1, a2, t0, t2);
    const b2 = lerp(a2, a3, t1, t3);
    out.push(lerp(b1, b2, t1, t2));
  }
  return out;
}

/** Perpendicular distance of p to the line through a→b (degrees). */
function chordDeviation(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1e-4;
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

// 曲线离弦超过弦长 12% 就退化为直线 — 折返/急转段的 CR 鼓包会打圈、交叉
const MAX_BULGE_RATIO = 0.12;

/** One LineString per adjacent stop pair; visited iff both endpoints visited. */
export function buildRouteSource(stops: Stop[]) {
  const sorted = [...stops].sort((a, b) => a.order - b.order);
  const pts = sorted.map((s) => [s.lng, s.lat] as [number, number]);
  const features: Feature<LineString>[] = [];
  const lastLeg = Math.max(1, sorted.length - 2);
  for (let i = 0; i < sorted.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const curve = catmullRom(p0, p1, p2, p3, 14);
    const chordLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const bulge = Math.max(...curve.map((p) => chordDeviation(p, p1, p2)));
    features.push({
      type: 'Feature',
      // `t` = how late in the journey this leg is (0 = first, 1 = last). The
      // route layer interpolates lightness along it, so direction of travel is
      // readable without arrows: early legs pale, recent legs near-ink.
      properties: { visited: sorted[i].visited && sorted[i + 1].visited, t: i / lastLeg },
      geometry: {
        type: 'LineString',
        coordinates: bulge > MAX_BULGE_RATIO * chordLen ? [p1, p2] : curve,
      },
    });
  }
  return {
    type: 'geojson' as const,
    data: { type: 'FeatureCollection', features } as FeatureCollection,
  };
}

/**
 * Tile-less MapLibre style: blank background + our own GeoJSON layers.
 * Warm paper base with lightness-step hierarchy: paper → paper-white
 * provinces → one-step-deeper visited provinces; the completed route ramps
 * pale→ink along the journey, planned legs stay muted dashes. Brand yellow is
 * spent on the current position only. No glyphs/sprite/tiles.
 */
export function buildMapStyle(
  routeData: FeatureCollection,
  horse: Feature<Polygon>,
): StyleSpecification {
  return {
    version: 8,
    name: 'chaihuo-handdrawn',
    sources: {
      provinces: provinceSource,
      route: { type: 'geojson', data: routeData },
      horse: { type: 'geojson', data: horse },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': MAP_BG } },
      {
        id: 'province-fill',
        type: 'fill',
        source: 'provinces',
        paint: {
          // Geography is background, not subject. The old highlighter yellow
          // (#f7e9bd) competed with the route, the stop dots and the horse for
          // the same hue; visited provinces now read as one lightness step
          // deeper than paper — present, never loud.
          'fill-color': [
            'case',
            ['in', ['get', 'name'], ['literal', PROVINCE_VISITED]],
            '#ece5d2', // 走过 — 暖中性,比纸白深半档
            '#fdfbf3', // 纸白 — unvisited
          ],
          'fill-opacity': 0.96,
        },
      },
      {
        id: 'province-line',
        type: 'line',
        source: 'provinces',
        paint: { 'line-color': '#ddd5c0', 'line-width': 0.8 },
      },
      {
        // 2026 马年愿景 — a WISH, not a fact, so it no longer shares the fact
        // layer's ink. Hidden in 足迹 mode and revealed as the subject in 愿景
        // mode (MapLibreCanvas drives the opacities).
        id: 'horse-fill',
        type: 'fill',
        source: 'horse',
        paint: {
          'fill-color': '#f3d230',
          'fill-opacity': 0,
          'fill-opacity-transition': { duration: 420 },
        },
      },
      {
        id: 'horse-line',
        type: 'line',
        source: 'horse',
        paint: {
          'line-color': '#b8960a',
          'line-width': 3,
          'line-opacity': 0,
          'line-opacity-transition': { duration: 420 },
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      },
      {
        id: 'route',
        type: 'line',
        source: 'route',
        paint: {
          // Visited legs ramp pale → ink along `t` (direction of travel);
          // planned legs stay a muted warm neutral dash.
          'line-color': [
            'case',
            ['get', 'visited'],
            ['interpolate', ['linear'], ['get', 't'], 0, '#a99a5e', 1, '#5c4d08'],
            '#a8a295',
          ],
          'line-width': ['case', ['get', 'visited'], 3.4, 2],
          'line-dasharray': ['case', ['get', 'visited'], ['literal', [1, 0]], ['literal', [2, 2]]],
          'line-opacity': 1,
          'line-opacity-transition': { duration: 300 },
          'line-color-transition': { duration: 420 },
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      },
    ],
  } as StyleSpecification;
}
