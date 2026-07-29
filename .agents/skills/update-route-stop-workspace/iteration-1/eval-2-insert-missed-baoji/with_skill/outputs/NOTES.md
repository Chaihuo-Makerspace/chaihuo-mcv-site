# 补记宝鸡站（insert missed Baoji stop）

## 背景

行程漏记一站：车在榆林（陕西）之后、西安之前停靠过宝鸡（陕西省，约 107.14°E 34.36°N，海拔约 600 米，2026-07-23，industry 站，主题 industry，已到达）。按 skill 同步清单逐项补齐。

## 改动文件及原因

- `src/content/stops/37-baoji.md`（新建）：宝鸡中文站点，order 37、visited true、province 陕西省、relationType industry、themes [industry]、event.date 2026.07.23；H1 = 宝鸡（= label），正文按模板小节填写，在地遥测按渭河谷地/秦岭北麓地貌写实，其余小节"待补充"。
- `src/content/stops/37-baoji.en.md`（新建）：英文正文覆盖，H1 = Baoji（= label_en）。
- `src/content/stops/37-xian.md` → `38-xian.md`、`37-xian.en.md` → `38-xian.en.md`：宝鸡插在西安之前，validator 强制 order 连续 0..N-1，故西安后移到 order 38（`38-xian.md` frontmatter 的 `order: 37` 改为 `order: 38`；站点 id `xian` 不变，journal 的 `city: xian` 引用不受影响）。除西安外其他站点编号均未变动。
- `src/i18n/route.ts`：`route.pageDesc` 中/英文案 "21 省 37 城" → "21 省 38 城"（省份数不变，陕西已在列）。
- `src/app/components/HomeContent.tsx`：首页硬编码 "21 省 37 城" → "21 省 38 城"。
- `src/app/components/RouteContent.tsx`：过时 fallback 文案顺手对齐到 "21 省 38 城"（skill 清单第 4 项）。
- `scripts/location-city-aliases.json`：新增 "宝鸡"、"宝鸡市" → `{id: baoji, label: 宝鸡, label_en: Baoji, province: 陕西省}`（skill 清单第 7 项，供自动定位流使用）。
- `AGENTS.md`：Current Status 与 Changelog 各补一条记录（项目惯例，skill 清单第 8 项）。

## 不需要改的地方

- `src/features/route-map/visited-provinces.ts`：陕西省已在 `PROVINCE_VISITED` 中。
- `src/features/route-map/route-legs.ts`：`PROVINCE_SHORT` 已有陕西省（陕 / SX / Shaanxi）。
- 无宝鸡相关 journal / people / 照片，清单第 5、6 项不适用。

## 验证

- `node scripts/validate-site.mjs`：通过（1241 checks，退出码 0），完整输出见 `check.log`。
- 未跑 `pnpm harness`（地图渲染变了本来建议跑，但本次任务只要求 validate-site；如需浏览器冒烟可另行执行）。
- 未做任何 git 提交。
