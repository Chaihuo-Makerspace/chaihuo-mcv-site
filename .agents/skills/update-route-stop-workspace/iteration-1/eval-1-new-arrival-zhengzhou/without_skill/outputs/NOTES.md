# 郑州到站（2026-07-27）更新说明

基地车 2026-07-27 抵达郑州（河南省，113.65°E 34.76°N，海拔约 110 米），作为第 38 站（order 38，接在西安之后）加入路线地图，已到达、教育站、主题 science+maker。

## 改动的文件（均在副本 repo/ 内）

- `src/content/stops/38-zhengzhou.md`（新增）：郑州站点中文内容。frontmatter 按任务要求设置 `visited: true`、`relationType: education`、`themes: [science, maker]`、`province: 河南省`、坐标与 `altitude: "110"`、`event.date: "2026.07.27"`；正文各段落先以“待补充”占位，现场记沿用定位器自动到站的既有文案风格（参照哈密/敦煌站）。
- `src/content/stops/38-zhengzhou.en.md`（新增）：对应英文镜像，H1 与 `label_en` 一致（校验器会检查）。
- `src/features/route-map/visited-provinces.ts`：`PROVINCE_VISITED` 追加 `'河南省'`（新到访省份，驱动 RoutePreview 与 MapLibre 地图的省份着色；geojson 中已有“河南省”）。
- `src/i18n/route.ts`：路线页描述中/英由 “21 省 37 城” 改为 “21 省 38 城”（参照此前西安站提交，只加城市数，省份数为全程规划口径不变）。
- `src/app/components/HomeContent.tsx:344`：首页遥测卡片 “21 省 37 城” 改为 “21 省 38 城”。
- `scripts/lib/yuque-journal-sync.mjs`：`CITY_KEYWORDS` 顶部新增 `['zhengzhou', ['郑州']]`，让语雀日记同步能把郑州相关日记归到新城市（参照西安站提交的做法）。

未改动：`scripts/location-city-aliases.json`（仅用于修正定位器逆地理编码偏差，郑州可正常解析，此前西安也未加别名）；首页时间线 legs、地图站点渲染、“最新一站”高亮均由 stops 数据自动推导，无需手改。

## 校验

在副本目录运行 `node scripts/validate-site.mjs`：通过（1241 checks，退出码 0）。完整输出见 `../outputs/check.log`。
