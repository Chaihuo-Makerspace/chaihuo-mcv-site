export interface RouteCity {
  label: string;
  lng: number;
  lat: number;
  visited: boolean;
  isOrigin?: boolean;
}

// Google Maps 精确经纬度 — 增删节点只改这个数组
export const routeCities: RouteCity[] = [
  // ── 已走过 ──
  { label: '深圳',    lng: 114.057, lat: 22.543, visited: true, isOrigin: true },
  { label: '南宁',    lng: 108.320, lat: 22.816, visited: true },
  { label: '贵阳',    lng: 106.713, lat: 26.647, visited: true },
  { label: '重庆',    lng: 106.551, lat: 29.563, visited: true },
  // ── 计划中 ──
  { label: '成都',    lng: 104.066, lat: 30.572, visited: false },
  { label: '拉萨',    lng: 91.111,  lat: 29.645, visited: false },
  { label: '乌鲁木齐', lng: 87.617,  lat: 43.825, visited: false },
  { label: '西宁',    lng: 101.778, lat: 36.617, visited: false },
  { label: '兰州',    lng: 103.834, lat: 36.061, visited: false },
  { label: '呼和浩特', lng: 111.751, lat: 40.842, visited: false },
  { label: '北京',    lng: 116.407, lat: 39.904, visited: false },
  { label: '哈尔滨',  lng: 126.650, lat: 45.750, visited: false },
  { label: '沈阳',    lng: 123.432, lat: 41.806, visited: false },
  { label: '济南',    lng: 117.000, lat: 36.675, visited: false },
  { label: '南京',    lng: 118.797, lat: 32.060, visited: false },
  { label: '杭州',    lng: 120.154, lat: 30.288, visited: false },
  { label: '长沙',    lng: 112.938, lat: 28.228, visited: false },
];
