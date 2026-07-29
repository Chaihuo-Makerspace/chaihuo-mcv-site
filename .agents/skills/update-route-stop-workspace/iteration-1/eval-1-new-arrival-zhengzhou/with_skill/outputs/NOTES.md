# 新增郑州站(2026-07-27 到达)— 改动说明

## 新增文件
- `src/content/stops/38-zhengzhou.md`:郑州中文站点,order 38(接在西安 37 之后,保持 order 连续),`visited: true`(自动成为"最新到达"高亮,西安→郑州段变实线),`province: 河南省`,lng 113.65 / lat 34.76,海拔 "110",`relationType: education`,`themes: [science, maker]`,`event.date: "2026.07.27"`(供首页时间轴路段带定位)。正文按模板小节,现场记/共创等留"待补充"。H1 = `郑州` 与 label 对齐。
- `src/content/stops/38-zhengzhou.en.md`:英文正文覆盖,H1 = `Zhengzhou` 与 label_en 对齐,中英页面自动双语,无需改页面。

## 同步修改
- `src/features/route-map/visited-provinces.ts`:`PROVINCE_VISITED` 末尾加 `河南省`(完整行政区名),河南是首次进入的省份,地图填色同步。
- `src/features/route-map/route-legs.ts`:`PROVINCE_SHORT` 加 `河南省: { zh: '豫', en: 'HA', enFull: 'Henan' }`,首页时间轴路段带窄段用简称,否则会显示全名放不下。
- `src/i18n/route.ts`:`route.pageDesc` 中英两条文案 `21 省 37 城` / `37 cities` → `38 城` / `38 cities`(38 个站点减 1 个 routeOnly 隐藏途经点 = 38 座可见城市;"21 省"是规划总数,不变)。
- `src/app/components/HomeContent.tsx`:首页硬编码 `21 省 37 城` → `21 省 38 城`。
- `src/app/components/RouteContent.tsx`:过时的 fallback 文案 `21 省 26 城` → `21 省 38 城`(顺手对齐死代码)。
- `scripts/location-city-aliases.json`:加 `郑州` / `郑州市` → `{id: zhengzhou, label_en: Zhengzhou, province: 河南省}` 映射,供 `pnpm update:city` 自动定位流使用。
- `AGENTS.md`:Current Status 加一条"Route map now extends from Xi'an to Zhengzhou…",Changelog 加 2026-07-28 一行(项目惯例)。

## 未做
- 无郑州相关 journal 和 people,无需关联;无照片,未加 `## 照片` 小节(可选)。
- 未跑 `pnpm harness`(只要求跑 validate-site)。

## 验证
- `node scripts/validate-site.mjs` 通过:`Site validation passed (1241 checks).`,完整输出见 `../outputs/check.log`。
