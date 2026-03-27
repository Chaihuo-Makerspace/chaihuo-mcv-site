export interface RouteCity {
  label: string;
  lng: number;
  lat: number;
  visited: boolean;
  isOrigin?: boolean;
  order: number;
  labelOffset?: [number, number]; // [dx, dy] for label positioning
}

// 实际路线：21省 23城，深圳出发→深圳返回
// order 字段表示行程顺序，visited 控制进度
export const routeCities: RouteCity[] = [
  // ── 出发点（尚未出发，预计 2026.04 中旬启程）──
  { label: '深圳',     lng: 114.057, lat: 22.543, visited: true, isOrigin: true, order: 0, labelOffset: [10, -8] },
  // ── 计划路线 ──
  { label: '合浦',     lng: 109.207, lat: 21.660, visited: false, order: 1, labelOffset: [-30, 12] },
  { label: '肇兴',     lng: 109.116, lat: 25.863, visited: false, order: 2, labelOffset: [-30, -5] },
  { label: '酉阳',     lng: 108.770, lat: 28.840, visited: false, order: 3, labelOffset: [-30, -5] },
  { label: '雅安',     lng: 103.001, lat: 29.988, visited: false, order: 4, labelOffset: [-30, -5] },
  { label: '康定',     lng: 101.957, lat: 30.050, visited: false, order: 5, labelOffset: [-30, 10] },
  { label: '林芝',     lng: 94.362,  lat: 29.649, visited: false, order: 6, labelOffset: [-25, -8] },
  { label: '喀什',     lng: 75.990,  lat: 39.468, visited: false, order: 7, labelOffset: [-25, -8] },
  { label: '敦煌',     lng: 94.662,  lat: 40.142, visited: false, order: 8, labelOffset: [10, -5] },
  { label: '中卫',     lng: 105.190, lat: 37.500, visited: false, order: 9, labelOffset: [-30, -5] },
  { label: '榆林',     lng: 109.734, lat: 38.285, visited: false, order: 10, labelOffset: [10, -5] },
  { label: '鄂尔多斯', lng: 109.781, lat: 39.608, visited: false, order: 11, labelOffset: [-50, -8] },
  { label: '大庆',     lng: 125.104, lat: 46.589, visited: false, order: 12, labelOffset: [10, -5] },
  { label: '济宁',     lng: 116.587, lat: 35.415, visited: false, order: 13, labelOffset: [10, -5] },
  { label: '沧州',     lng: 116.838, lat: 38.304, visited: false, order: 14, labelOffset: [10, -5] },
  { label: '太原',     lng: 112.549, lat: 37.870, visited: false, order: 15, labelOffset: [-30, -5] },
  { label: '淮南',     lng: 116.999, lat: 32.626, visited: false, order: 16, labelOffset: [10, -5] },
  { label: '扬州',     lng: 119.413, lat: 32.394, visited: false, order: 17, labelOffset: [10, -5] },
  { label: '崇明',     lng: 121.397, lat: 31.623, visited: false, order: 18, labelOffset: [10, -5] },
  { label: '杭州',     lng: 120.154, lat: 30.288, visited: false, order: 19, labelOffset: [10, 12] },
  { label: '襄阳',     lng: 112.144, lat: 32.042, visited: false, order: 20, labelOffset: [-30, -5] },
  { label: '凤凰',     lng: 109.600, lat: 27.948, visited: false, order: 21, labelOffset: [-30, 5] },
  { label: '广州',     lng: 113.264, lat: 23.130, visited: false, order: 22, labelOffset: [-30, 10] },
];
