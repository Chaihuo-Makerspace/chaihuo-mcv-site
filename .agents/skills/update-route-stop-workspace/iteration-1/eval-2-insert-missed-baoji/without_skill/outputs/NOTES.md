# 补记宝鸡站 — 改动说明

任务：在榆林（36）与西安（37）之间补记宝鸡站（陕西省，107.14°E 34.36°N，海拔约 600 米，2026-07-23 抵达，industry 站，主题 industry)。

## 改动文件

- `src/content/stops/37-baoji.md`（新增）：宝鸡站中文内容，id `baoji`,order 37,`relationType: industry`,`themes: [industry]`,`event.date: "2026.07.23"`，正文按既有站点体例（在地遥测/在地共创/现场记/远征日志）填写。
- `src/content/stops/37-baoji.en.md`（新增）：对应英文正文（Telemetry/Activities/Event/Expedition Log)。
- `src/content/stops/38-xian.md`（由 `37-xian.md` 重命名）：校验脚本要求 order 连续 0..N-1 且文件名与 `<padded-order>-<id>` 一致，插入宝鸡后西安顺延为 38,frontmatter `order: 37` 改为 `38`。
- `src/content/stops/38-xian.en.md`（由 `37-xian.en.md` 重命名）：内容不变。
- `src/i18n/route.ts`:`route.pageDesc` 城市数 37 → 38(zh/en 两处）。
- `src/app/components/HomeContent.tsx:344`：首页遥测卡片硬编码的 "21 省 37 城" 改为 "21 省 38 城"。

## 未改动但已确认的同步点

- `src/features/route-map/visited-provinces.ts`：陕西省已在已访问省份列表中，宝鸡不新增省份，无需改。
- `src/data/boardings.json`：乘员上下车记录与本次补站无关，无宝鸡相关交接，未动。
- 各 `.astro` 页面与地图组件均通过 `loadLocalizedStops()` 按 order 动态加载，插入后自动包含宝鸡（榆林—宝鸡—西安实线段自动生成）。

## 校验

`node scripts/validate-site.mjs` 通过（1241 checks)，完整输出见 `../outputs/check.log`，退出码 0。
