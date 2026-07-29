---
name: update-route-stop
description: 更新柴火基地车官网路线地图:新增/修改城市站点(stop)、标记已到达、更新站点内容(照片/事件/遇见的人)、给站点加图片(入库前一律转 WebP)、保持地图相关数据同步一致。当用户提到加城市、路线、地图、站点、visited、"N 省 N 城"文案、stops、路线省份填色、发来站点/现场照片,或车辆到达新城市时使用。Use this whenever the task touches the route map or city stops, even if the user only says "加个站点" or "车到了XX".
---

# 更新路线地图

站点的唯一事实源是 **`src/content/stops/` 下的 Markdown content collection**(不是 JSON)。改一个站点往往要同步多处,本 skill 的核心是下面的同步清单。

## 站点文件

每个城市 = 一对文件:`NN-<id>.md`(中文,frontmatter + 正文)+ `NN-<id>.en.md`(英文,正文覆盖)。模板:`src/content/stops/_template.md` / `_template.en.md`。schema:`src/features/route-map/stops-schema.ts`。

```yaml
---
id: hami                # kebab-case;文件名必须是 <order两位数>-<id>.md
order: 27               # 必须连续 0..N-1,validator 强制
visited: true           # true = 已到达(实线段 + 高亮)
label: 哈密
label_en: Hami
province: 新疆维吾尔自治区  # 完整行政区名
lng: 93.51 / lat: 42.83
altitude: "764"
relationType: community # departure|education|community|industry
themes: [maker]         # science|maker|industry
event: { date: "…", link: "…" }  # 可选;有 event 正文必须有 ## 现场记
people: []              # 可选,id 指向 src/content/people/met/<id>.md
---
```

正文有固定小节(`## 在地遥测` / `## 在地共创` / `## 现场记` / `## 远征日志` / 可选 `## 照片`),由 `stops-body-parser.mjs` 解析;**中文文件 H1 必须等于 `label`,英文文件 H1 必须等于 `label_en`**。

特殊情况:只弯折路线不显示的隐藏途经点,加 `routeOnly: true`(如 `23-korla-return.md`)。

## 渲染机制(决定你要不要手动改什么)

/route 现在是**三个共用一套选中态的视图**:地图(照片钉)、时间-海拔脊、故事流。一个新站点会同时出现在三处,不用手动登记任何一处——但下面几条决定它长什么样。

- 路线段:相邻 stop 连线,**两端都 `visited: true` 才是实线**,否则虚线。已走段还按行程进度做明度渐变(早段浅、近段深),自动算,无需干预。
- "最新到达"高亮:自动取 order 最大的 `visited && !routeOnly` 站点——**把车标成已到达只需翻 `visited: true`,没有任何"当前城市"字段**。它是全页唯一用品牌黄的点。
- **城市标签自动排布**:`label-layout.ts` 的 `placeLabels()` 求解器(首页 SVG 地图与 MapLibre 共用)。密集处**放不下的标签会被剔除**——新站点标签在全国视野看不见是正常的,放大就出来,别去硬调坐标。
- **照片钉**:有日记的站点在地图上带一张封面(封面 + 城市名题注 + 日记数角标)。钉数按地图面积算(手机约 6 个,桌面上限 18),**按日记数排序取前 N**——所以新站点有没有钉取决于第 6 项的词表是否接上。被钉住的城名字在题注里,不再单独排标签。
- **站点圆点大小 = 日记数**(0 / 1–3 / 4+ 三档),同样来自第 6 项。
- **时间-海拔脊**(`ExpeditionRidge.tsx`)读 `event.date` + `altitude`:X 轴是真实日期、Y 轴海拔、柱高是日记数。所以 **`event.date` 现在比以前重要得多**:
  - 有日期 → 站点落在时间轴的真实位置;
  - 没日期 → `expedition-timeline.ts` 按顺序在**已知日期之间**插值,标 `guessed`,脊上画虚线引线;
  - 尾部计划段(最后一个有日期的站点之后)不编日期,单独排在右侧预留区;
  - "N 天零篇日记"那条空白带只用**手写日期**(非插值)来算,所以补日期会直接影响它。
- 左栏四个数字(天数 / 公里 / 城 / 篇日记)**全部派生**,别去写死:天数来自时间轴、公里是站点坐标的大圆弧累加、城是 `visited/总数`、日记数是 `getRouteJournals()` 的长度。
- 「马年愿景」是视图模式,不是常驻图层;加站点不影响它。
- 省份填色:唯一来源 `src/features/route-map/visited-provinces.ts` 的 `PROVINCE_VISITED` 数组(MapLibre 和 SVG 预览共用)。
- 首页时间轴路段带:`src/features/route-map/route-legs.ts` 的 `buildRouteLegs(stops, locale)` 按 **连续同省站点归并省际段落**(粤→桂→黔→…),喂给首页 `RoleTimeline` 的 legs band + 当前省竖列高亮。每段带 `planned` 标记(段内站点全部 `visited: false` 即计划段):
  - 已走段:按 `event.date` 定位(取第一个完整日期;缺日期的站点按路线顺序线性插值,不缺也能跑,但补日期更准),灰色 `bg-neutral-100`;最后一个已走段自动延伸到今天,没有"当前省份"字段。
  - 计划段:没有真实日期,**不参与日期定位**——从今日指针起在当前月剩余宽度内均匀排开(保底 12% 宽度,不横跨后续月份),淡黄 `bg-brand/10`(当前段是 `bg-brand/25`);当前段判定只看非计划段,计划段永远不会被误判为"当前省"。计划行程里同省重复出现(如 蒙→京→蒙 的 呼和浩特→北京→赤峰)会并入首次出现的计划段,band 上每个 upcoming 省只显示一次。
- 城市面板关联日记有两个来源,由 `getRouteJournals()`(`src/lib/journals.ts`)合并,同城同日本地优先:
  1. `src/content/journals/*.md` frontmatter `city: <stop-id>`(本地深度日记,站内详情页);
  2. `src/data/yuque-journals.json` 的语雀日记(外链原文),其 `city` 由同步脚本的 `CITY_KEYWORDS` 词表推断(见同步清单第 6 项)。
- 中英文页面(route.astro / en/route.astro)共用 `RouteContent`,只要 `.en.md` 齐了就自动双语言,不用改页面。

## 同步清单(新增/变更站点时逐项过)

1. `src/content/stops/NN-<id>.md` + `NN-<id>.en.md`:order 连续无空缺;H1 与 label 对齐。
2. `src/features/route-map/visited-provinces.ts`:首次进入的省份补完整行政区名(如 `甘肃省`,不是 `甘肃`)。
3. **首次进入的省份还要补** `src/features/route-map/route-legs.ts` 的 `PROVINCE_SHORT`(zh 单字简称 / en 两字母代码 / en 全名),否则首页路段带该省显示全名,放不进去窄段。
4. **"N 省 N 城"文案**(最容易漏,共两处三处):
   - `src/i18n/route.ts` 的 `route.pageDesc`(zh 和 en 各一条);
   - `src/app/components/HomeContent.tsx` 里**硬编码**的 `21 省 32 城`(搜 `省` 定位);
   - `src/app/components/RouteContent.tsx` 里有一条过时的 fallback 文案(死代码,顺手对齐)。
5. 日记:如有该城市的 journal,frontmatter `city` 填 stop id(validator 强制存在)。
5b. **`event.date` 尽量补上**(格式随意:`2026.07.24` / `2026.04.24/04.25` / `2026.05.05–07`,取第一个完整日期)。缺了不会报错,但该站点在时间-海拔脊上是插值位置(虚线引线),城市面板也没有"第 N 天"。
6. **语雀日记词表**(新城市最容易漏):`scripts/lib/yuque-journal-sync.mjs` 的 `CITY_KEYWORDS` 加一条 `[<stop-id>, ['城市名', '别名…']]`,否则之后语雀同步的该城日记会落进 `city: "yuque"`,地图面板看不到。词表顺序即优先级(行程靠后的站点在前),"A→B" 中转标题归目的地;小地名/途经点直接并进所属站点(如 定边→榆林、赫章→毕节)。改完用 `node -e "import('./scripts/lib/yuque-journal-sync.mjs').then(m=>console.log(m.inferCityId('基地车日记|2026.0101 新城市')))"` 验证,并重算存量 JSON 的 city。
6b. **封面派生图**:语雀封面是 960px 原图,页面只渲染到 132px。`scripts/generate-cover-thumbs.mjs` 生成 `public/yuque-journals/thumb/`(208px)与 `card/`(480px)两档 WebP,`pnpm build` / `pnpm dev` 会自动跑,派生图**不入库**(所以语雀同步的 Action 不需要装依赖)。手动重跑:`pnpm run images:covers`。派生图缺失时页面自动回退原图(`src/lib/journals.ts` 的 `withCoverDerivatives` 逐个 `existsSync`),不会瞎。
7. 遇见的人:`people:` id → 对应 `src/content/people/met/<id>.md` 要存在;照片放 `public/` 并在 `## 照片` 引用。**所有新入库图片先转 WebP,见下面「图片规范」。**
8. 自动定位流:在 `scripts/location-city-aliases.json` 加中文地名(含"X市"变体)→ `{id, label, label_en, province}` 映射。
9. `AGENTS.md` 的 Current Status / Changelog(项目惯例,历史加站 commit 都更新了)。

## 图片规范(用户发来照片时必须先做)

站点 `## 照片`、`people/met/*.md` 的 `image`、任何进 `public/` 的新图,**一律先转 WebP 再入库**,不要直接放用户给的 jpg/png/heic 原图。这些图在地图照片钉里只渲染到 132px,原图常有 1–2MB。

```bash
# 长边 ≤1600px + WebP q82(sharp 是仓库依赖,仓库根目录直接跑)
node -e "const s=require('sharp');const [i,o,w]=process.argv.slice(1);s(i).resize({width:+w,height:+w,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(o).then(r=>console.log(o,r.width+'x'+r.height,Math.round(r.size/1024)+'KB'))" ~/Downloads/raw.jpg public/people/<id>.webp 1600
```

- 人物头像用 800(见 update-team-member skill),站点/现场照片用 1600。
- 备选:`cwebp -q 82 -resize 1600 0 raw.jpg -o out.webp`。
- **别用 `sips -s format webp`** — 本机 macOS 写不了 WebP:`Error: Can't write format: org.webmproject.webp`。iPhone 的 HEIC 先 `sips -s format jpeg in.heic --out tmp.jpg` 再转。
- 例外:`public/yuque-journals/*.jpg` 是语雀同步脚本自动抓的封面原图,由 `scripts/generate-cover-thumbs.mjs` 在构建期生成 WebP 派生图(第 6b 项),**不要手动改这些文件**。手动加的图不走那条流水线,所以必须自己转好。
- `pnpm check` 只校验图片存在,不校验格式和体积——转 WebP 这步没人替你兜底。

## 自动流程:`pnpm update:city`

`scripts/check-arrival.mjs`(文档 `docs/location-city-update.md`):拉 SenseCAP GPS → 反地理编码 → `--apply` 自动生成 `NN-id.md` + `.en.md` 骨架并补 `visited-provinces.ts`。**它不会改**:第 3 项的 `PROVINCE_SHORT`、第 4 项的"N 省 N 城"文案、第 6 项的 `CITY_KEYWORDS`、正文占位符(`待补充`)、`AGENTS.md`——这些都要手动跟进。别名表(第 8 项)决定自动生成的 id/名称质量,新区域先补别名再跑脚本。

## 验证

- `pnpm check` — validate-site 校验:order 连续、文件名规范、H1==label、`.en.md` 语法、图片存在、journal city 引用、恰好一个 `isOrigin`。
- 地图渲染变了(新站点/线段/省份)再跑 `pnpm harness`(含视觉冒烟)。
- 新站点带日记时顺手确认三处都对上了:地图上有照片钉、脊上有柱子、故事流里有卡片。三处对不上通常是第 6 项词表没接。
