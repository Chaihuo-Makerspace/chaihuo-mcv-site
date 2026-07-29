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
      properties: { visited: sorted[i].visited && sorted[i + 1].visited },
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
 * provinces → highlighter-yellow visited provinces; brand-dark solid for the
 * completed route, muted dashes for the planned leg. No glyphs/sprite/tiles.
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
          'fill-color': [
            'case',
            ['in', ['get', 'name'], ['literal', PROVINCE_VISITED]],
            '#f7e9bd', // 荧光笔标记 — visited
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
        // 2026 马年愿景:背景级存在——brand 淡填充 + 虚线轮廓(纸色套管托底)
        id: 'horse-fill',
        type: 'fill',
        source: 'horse',
        paint: { 'fill-color': '#f3d230', 'fill-opacity': 0.12 }, // --brand watermark
      },
      {
        id: 'horse-casing',
        type: 'line',
        source: 'horse',
        paint: { 'line-color': '#fdfbf3', 'line-width': 4.5, 'line-opacity': 0.95 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      },
      {
        id: 'horse-line',
        type: 'line',
        source: 'horse',
        paint: {
          'line-color': '#f3d230',
          'line-width': 1.6,
          'line-opacity': 0.85,
          'line-dasharray': [2.5, 1.8],
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      },
      {
        id: 'route',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': ['case', ['get', 'visited'], '#b8960a', '#a8a295'], // brand-dark / warm-muted
          'line-width': ['case', ['get', 'visited'], 3.5, 2],
          'line-dasharray': ['case', ['get', 'visited'], ['literal', [1, 0]], ['literal', [2, 2]]],
          'line-opacity': 1,
          'line-opacity-transition': { duration: 300 },
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      },
    ],
  } as StyleSpecification;
}
