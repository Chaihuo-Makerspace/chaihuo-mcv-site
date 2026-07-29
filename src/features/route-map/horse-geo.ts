import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { geoData, horseRouteD, projection } from './projection';

// horseRouteD 在 SVG 中渲染时带 translate(50,50),补上偏移后反投影即还原设计师
// 在中国版图上画的原始马形(头朝东北=2026 终点方向,尾在新疆,腿落川藏)。
const HORSE_OFFSET_X = 50;
const HORSE_OFFSET_Y = 50;

function parsePathPoints(d: string): [number, number][] {
  const nums = d.match(/-?\d+(?:\.\d+)?/g);
  if (!nums) return [];
  const pts: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    pts.push([parseFloat(nums[i]) + HORSE_OFFSET_X, parseFloat(nums[i + 1]) + HORSE_OFFSET_Y]);
  }
  return pts;
}

// 线上版本(6bb4c42)的适配盒:原稿等比放大 ~1.23 倍,东到江浙沪、南抵深圳。
const HORSE_TARGET = { minLng: 80, minLat: 22, maxLng: 128, maxLat: 50 };

/** 等比缩放 + 平移,居中放入 box(不裁剪、不变形)。 */
function fitInto(
  coords: [number, number][],
  box: { minLng: number; minLat: number; maxLng: number; maxLat: number },
): [number, number][] {
  if (coords.length === 0) return coords;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of coords) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const tw = box.maxLng - box.minLng;
  const th = box.maxLat - box.minLat;
  const scale = Math.min(tw / w, th / h);
  const offX = box.minLng + (tw - w * scale) / 2 - minX * scale;
  const offY = box.minLat + (th - h * scale) / 2 - minY * scale;
  return coords.map(([x, y]) => [x * scale + offX, y * scale + offY]);
}

// ─── 国界检查(逐点,带内缩边距) ───

type Ring = number[][];
type PolygonCoords = Ring[];

function pointInRing([x, y]: [number, number], ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInPolygon(pt: [number, number], coords: PolygonCoords): boolean {
  if (!pointInRing(pt, coords[0])) return false;
  for (let i = 1; i < coords.length; i++) {
    if (pointInRing(pt, coords[i])) return false; // hole
  }
  return true;
}

const provinces = geoData as unknown as FeatureCollection;

function insideChina([lng, lat]: [number, number]): boolean {
  for (const f of provinces.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'Polygon' && pointInPolygon([lng, lat], g.coordinates as PolygonCoords)) {
      return true;
    }
    if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates as unknown as PolygonCoords[]) {
        if (pointInPolygon([lng, lat], poly)) return true;
      }
    }
  }
  return false;
}

// ~0.25° 内缩边距,描边不会视觉上压到国界线。
const MARGIN = 0.25;
function insideChinaWithMargin([lng, lat]: [number, number]): boolean {
  return (
    insideChina([lng, lat]) &&
    insideChina([lng + MARGIN, lat]) &&
    insideChina([lng - MARGIN, lat]) &&
    insideChina([lng, lat + MARGIN]) &&
    insideChina([lng, lat - MARGIN])
  );
}

/**
 * 2026 马年愿景:全年路程走成一匹马。
 * 设计师原稿反投影后等比适配 HORSE_TARGET(同线上版本);越界点逐个向中心拉回。
 * 返回闭合 Polygon,渲染为轮廓线 + 纸色套管。
 */
export function horseRouteGeoJson(): Feature<Polygon> {
  const svgPoints = parsePathPoints(horseRouteD);
  const center: [number, number] = [104, 34];

  const inverted: [number, number][] = [];
  for (const p of svgPoints) {
    const lngLat = projection.invert?.(p);
    if (lngLat) inverted.push([lngLat[0], lngLat[1]]);
  }

  const ring: [number, number][] = [];
  for (const pt of fitInto(inverted, HORSE_TARGET)) {
    if (insideChinaWithMargin(pt)) {
      ring.push(pt);
      continue;
    }
    let pulled = center;
    for (let t = 0.02; t <= 1; t += 0.02) {
      const q: [number, number] = [
        pt[0] + (center[0] - pt[0]) * t,
        pt[1] + (center[1] - pt[1]) * t,
      ];
      if (insideChinaWithMargin(q)) {
        pulled = q;
        break;
      }
    }
    ring.push(pulled);
  }

  return {
    type: 'Feature',
    properties: { kind: 'horse' },
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}
