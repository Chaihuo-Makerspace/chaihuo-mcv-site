# Route map guide

本目录是路线功能的领域模块：stop schema/loader、地图投影、MapLibre 主地图、SVG 首页预览、时间—海拔统计和路线 UI。改动前同时阅读 `docs/DESIGN.md`；涉及站点、当前位置、访问状态、日记关联或省份时阅读 `docs/deployment-yuque-sync.md`。

## 数据流

`src/content/stops/*.md` → `stops-schema.ts` / `stops-body-parser.mjs` → `stops-loader.ts` → `.astro` 页面 → `RouteContent`、MapLibre 和 `RoutePreview`。

- stop 的 `id` 是跨文件稳定键；`order` 决定路线顺序。
- 当前城市是最后一个 `visited` 且非 `routeOnly` 的 stop。
- `event.date` 驱动时间轴位置；展示标题不能替代日期或地理事实。
- `routeOnly` 是途经点，不进入城市计数、当前位置和公开城市列表。
- `stops-loader.ts` 在装配层剔除占位内容；公共组件不应看到“待补充”。

## 修改流程

1. 明确改动落在 schema、装配、领域计算还是视图；共享规则放在领域层，避免 MapLibre/SVG/首页各写一份算法。
2. 数据字段变化同步 schema、`Stop`/`RouteCity` 类型、loader、zh/en 内容和全部消费者。
3. 地图颜色或路线语义变化同步 `map-style.ts` 与 `RoutePreview.tsx`；使用 `theme.css`/设计文档的品牌色语义。MapLibre style expression 中必须使用具体色值时，以 `map-style.ts` 为事实来源并保持 SVG 镜像一致。
4. 桌面与移动的 padding、fit bounds 和标签密度分别验证；不要把桌面侧栏参数复用到窄屏。
5. 运行 `pnpm check`、`pnpm smoke`、`pnpm visual`；交互控件或语义变化再跑 `pnpm audit:ui`。

完成标准：两套地图对同一 stop 顺序、访问状态和当前位置得出一致结果，zh/en 内容完整，桌面和移动端可见范围正确，route harness 通过。

## 硬锁

- 保持人工 `visited: true`；移动车辆位置应新增/更新 stop，而非修改 UI 推导逻辑。
- `PROVINCE_VISITED` 是地图填色镜像，不是当前位置或 stop 的权威源。更新路线时按 `update-route-stop` 流程同步，不能只改此数组。
- `CITY_KEYWORDS` 只处理别名/fold-in；站点主名称来自 stop frontmatter。不要用诗意标题或文章正文推断到达城市。
- stop Markdown 不写 `themes`；日记场景来自 journal category/override。
