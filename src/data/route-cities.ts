export interface RouteCity {
  label: string;
  lng: number;
  lat: number;
  visited: boolean;
  isOrigin?: boolean;
  order: number;
  labelOffset?: [number, number]; // [dx, dy] for label positioning
}

// Google Maps 精确经纬度 — 增删节点只改这个数组
// order 字段表示行程顺序，visited 控制进度
export const routeCities: RouteCity[] = [
  // ── 已走过 ──
  { label: '深圳',    lng: 114.057, lat: 22.543, visited: true, isOrigin: true, order: 0, labelOffset: [10, -8] },
  { label: '南宁',    lng: 108.320, lat: 22.816, visited: true, order: 1, labelOffset: [-35, 12] },
  { label: '贵阳',    lng: 106.713, lat: 26.647, visited: true, order: 2, labelOffset: [-35, -5] },
  { label: '重庆',    lng: 106.551, lat: 29.563, visited: true, order: 3, labelOffset: [-35, -5] },
  // ── 计划中 ──
  { label: '成都',    lng: 104.066, lat: 30.572, visited: false, order: 4, labelOffset: [-35, -5] },
  { label: '拉萨',    lng: 91.111,  lat: 29.645, visited: false, order: 5, labelOffset: [-30, -8] },
  { label: '乌鲁木齐', lng: 87.617,  lat: 43.825, visited: false, order: 6, labelOffset: [-45, -8] },
  { label: '西宁',    lng: 101.778, lat: 36.617, visited: false, order: 7, labelOffset: [10, -5] },
  { label: '兰州',    lng: 103.834, lat: 36.061, visited: false, order: 8, labelOffset: [10, 12] },
  { label: '呼和浩特', lng: 111.751, lat: 40.842, visited: false, order: 9, labelOffset: [-45, -8] },
  { label: '北京',    lng: 116.407, lat: 39.904, visited: false, order: 10, labelOffset: [10, -5] },
  { label: '哈尔滨',  lng: 126.650, lat: 45.750, visited: false, order: 11, labelOffset: [10, -5] },
  { label: '沈阳',    lng: 123.432, lat: 41.806, visited: false, order: 12, labelOffset: [10, 12] },
  { label: '济南',    lng: 117.000, lat: 36.675, visited: false, order: 13, labelOffset: [10, -5] },
  { label: '南京',    lng: 118.797, lat: 32.060, visited: false, order: 14, labelOffset: [10, -5] },
  { label: '杭州',    lng: 120.154, lat: 30.288, visited: false, order: 15, labelOffset: [10, 12] },
  { label: '长沙',    lng: 112.938, lat: 28.228, visited: false, order: 16, labelOffset: [-35, 5] },
];
