# d3-geo + GeoJSON 中国路线地图 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将首页中国路线地图从 `@svg-maps/china` + 手动坐标迁移到 `d3-geo` + GeoJSON，省份边界和城市节点使用同一投影函数，数学保证对齐。

**Architecture:** 用 DataV 的中国省级 GeoJSON 作为地理数据源，`d3-geo` 的 `geoMercator` 投影函数同时生成省份 SVG paths 和城市像素坐标。城市数据抽离为纯经纬度数组，后期增删节点只改一个文件。马形路线暂时注释，后续单独处理。

**Tech Stack:** d3-geo, GeoJSON (DataV aliyun), React, Framer Motion, Astro

---

### Task 1: 安装依赖 + 下载 GeoJSON 数据

**Files:**
- Modify: `package.json`
- Create: `src/data/china-provinces.json`

**Step 1: 安装 d3-geo**

```bash
pnpm add d3-geo && pnpm add -D @types/d3-geo
```

**Step 2: 下载 DataV 省级 GeoJSON 到本地**

```bash
curl -s 'https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=100000_full' \
  -o src/data/china-provinces.json
```

**Step 3: 验证文件完整性**

```bash
node -e "const d=require('./src/data/china-provinces.json'); console.log(d.features.length, 'features');"
```

Expected: `35 features`

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/data/china-provinces.json
git commit -m "chore: add d3-geo dependency and China GeoJSON data"
```

---

### Task 2: 创建城市经纬度数据文件

**Files:**
- Create: `src/data/route-cities.ts`

**Step 1: 创建 `src/data/route-cities.ts`**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/data/route-cities.ts
git commit -m "feat: add route cities data with Google Maps coordinates"
```

---

### Task 3: 重构 ChinaRouteMap 组件 — 用 d3-geo 替换 @svg-maps/china

**Files:**
- Modify: `src/app/components/HomeContent.tsx`

这是核心改动。替换 `ChinaRouteMap` 函数内部实现，保留外部接口和所有动画。

**Step 1: 替换顶部 import**

移除:
```typescript
import chinaMapRaw from "@svg-maps/china";
const chinaMap = (
  "default" in chinaMapRaw ? (chinaMapRaw as any).default : chinaMapRaw
) as {
  viewBox: string;
  locations: { id: string; name: string; path: string }[];
};
```

替换为:
```typescript
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import chinaGeoJson from "@/data/china-provinces.json";
import { routeCities } from "@/data/route-cities";
```

**Step 2: 替换城市数据和投影设置**

移除整个 `cities` 数组（第 83-110 行）和 `horseRouteD` 常量（第 112-114 行）。

替换为:
```typescript
// ─── 地图投影 ───
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

const projection = geoMercator()
  .center([104.5, 37.5])
  .scale(580)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

const pathGenerator = geoPath().projection(projection);

const geoData = chinaGeoJson as unknown as FeatureCollection<MultiPolygon | Polygon>;
```

注意: `scale` 和 `center` 值需要在浏览器中微调以获得最佳视觉效果。初始值 `scale(580)` + `center([104.5, 37.5])` 是合理起点。

**Step 3: 重构 ChinaRouteMap 渲染逻辑**

替换 `<svg>` 内部的省份路径渲染:

```tsx
<svg
  viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
  className="w-full h-full"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  {/* 省份轮廓 */}
  {geoData.features.map((feature) => {
    const d = pathGenerator(feature);
    if (!d) return null;
    return (
      <path
        key={feature.properties?.adcode ?? feature.properties?.name}
        d={d}
        fill="#ece8df"
        stroke="#d5cfc3"
        strokeWidth="0.5"
      />
    );
  })}

  {/* 马形路线 — 暂时注释，后续单独处理 */}
  {/* <motion.path d={horseRouteD} ... /> */}

  {/* 城市节点 */}
  {routeCities.map((city, index) => {
    const projected = projection([city.lng, city.lat]);
    if (!projected) return null;
    const [cx, cy] = projected;
    const delay = city.visited ? 0.4 + index * 0.12 : 1.2 + index * 0.08;
    const dotColor = city.visited ? "#f3a230" : "#8db87c";
    const textColor = city.visited ? "#333" : "#666";
    const r = city.isOrigin ? 6 : city.visited ? 4.5 : 3.5;

    return (
      <g key={city.label}>
        {city.visited && (
          <motion.circle
            cx={cx} cy={cy} r={r + 6}
            fill="#f3a230" opacity={0}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: [0, 0.2, 0] } : {}}
            transition={{ duration: 2, delay: delay + 0.3, repeat: Infinity, repeatDelay: 1 }}
          />
        )}
        {city.isOrigin && (
          <motion.circle
            cx={cx} cy={cy} r={12}
            fill="none" stroke="#f3a230" strokeWidth="1.5" opacity={0}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 0.4, scale: 1 } : {}}
            transition={{ type: "spring", damping: 15, delay }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        )}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill={dotColor} stroke="white" strokeWidth="2"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 200, delay }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        <motion.text
          x={cx + (city.label.length > 3 ? -30 : 10)}
          y={cy - 10}
          fill={textColor} fontSize="10"
          fontWeight={city.visited ? "bold" : "normal"}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, delay: delay + 0.15 }}
        >
          {city.label}
        </motion.text>
      </g>
    );
  })}
</svg>
```

**Step 4: 验证**

在浏览器中打开 `http://localhost:4321/`，滚动到地图区域:
- 所有省份边界正确渲染
- 城市圆点在对应省份内
- 动画正常工作（圆点弹出、名称淡入）
- 图例和"2026·马年路线"标注仍在

**Step 5: 微调投影参数**

如果地图显示太小/太大/偏移，调整:
- `scale` — 控制缩放（增大→地图更大）
- `center` — 控制地理中心
- `translate` — 控制画布偏移

也可以用 `fitSize` 自动适配:
```typescript
const projection = geoMercator().fitSize([MAP_WIDTH, MAP_HEIGHT], geoData);
```

**Step 6: Commit**

```bash
git add src/app/components/HomeContent.tsx
git commit -m "feat: replace @svg-maps/china with d3-geo projection for accurate city placement"
```

---

### Task 4: 移除 @svg-maps/china 依赖

**Files:**
- Modify: `package.json`

**Step 1: 卸载**

```bash
pnpm remove @svg-maps/china
```

**Step 2: 确认构建通过**

```bash
pnpm build
```

Expected: 构建成功，无 `@svg-maps/china` 相关错误。

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove @svg-maps/china dependency"
```

---

### Task 5: 浏览器验证 + 投影参数微调

**Step 1: 启动 dev server**

```bash
pnpm dev
```

**Step 2: 用 Playwright 截图对比**

打开 `http://localhost:4321/`，截图地图区域，对比检查:
- [ ] 所有 17 个城市在正确省份内
- [ ] 深圳在广东南海岸
- [ ] 兰州在甘肃东南部
- [ ] 乌鲁木齐在新疆北部
- [ ] 九段线显示正确
- [ ] 省份边界清晰、无重叠

**Step 3: 如需微调投影参数，修改后重新验证**

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: fine-tune d3-geo projection parameters for optimal map display"
```
