---
name: update-team-member
description: 更新柴火基地车官网团队成员(crew)的信息和头像图片(头像入库前一律转 WebP)。当用户要新增成员、修改成员姓名/角色/bio、发来头像照片要换头像、调整登车/交接(boarding)时间线,或提到 team.json、public/people、时间线上的人时使用。也适用于英文版字段(name_en/role_en/bio_en)的补全。Use this whenever the task touches team member data or people images, even if the user only says "加个成员" or "换张头像".
---

# 更新团队成员

团队成员在首页"在路上的人"时间线(RoleTimeline)展示。数据流:**`src/data/team.json`(成员档案)→ `src/data/boardings.json`(谁在车上/何时交接)→ `public/people/`(头像)**。三处都可能要动。时间轴顶部还有一条省际路段带,数据来自 stops(见 update-route-stop skill),与成员数据无关,改成员不用管它。

## 数据位置

- `src/data/team.json` — 成员档案,JSON 数组。schema 见 `src/content.config.ts` 的 `team` collection(构建时校验,但页面是直接 import JSON 的)。
- `src/data/boardings.json` — 登车片段:`crewId` + `boardedAt` + `disembarkedAt`(可含 `handoffTo`)。**没有 boarding 片段的成员不会渲染**;`disembarkedAt` 缺省 = 当前在车,会出现在"当前在车"bio 网格里。
- `public/people/` — 头像。当前惯例:800×800 方形 `.webp`(渲染为圆形 `object-cover` 头像)。文件名不必等于成员 id(`zhipeng` → `spencer.jpg`、`feng` → `teacher-feng.jpg`),**team.json 的 `image` 字段才是事实源**。历史遗留有 jpg/png(其中 `qu-jialu.png` 1.9MB、`ye-kaiwei.jpg` 1.7MB),新加的一律按下面的图片规范转 WebP。

## 图片规范(用户发来图片时必须先做)

**入库的图片一律先转 WebP,不要把用户发来的 jpg/png/heic 原图直接放进 `public/`。** 头像渲染只有 32–128px,原图动辄 1–2MB,直接拖慢首页。

```bash
# 头像:800px 见方上限 + WebP q82(sharp 是仓库依赖,仓库根目录直接跑)
node -e "const s=require('sharp');const [i,o,w]=process.argv.slice(1);s(i).resize({width:+w,height:+w,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(o).then(r=>console.log(o,r.width+'x'+r.height,Math.round(r.size/1024)+'KB'))" ~/Downloads/raw.jpg public/people/<id>.webp 800
```

- 备选:`cwebp -q 82 -resize 800 0 raw.jpg -o public/people/<id>.webp`。
- **别用 `sips -s format webp`** — 本机 macOS 写不了 WebP:`Error: Can't write format: org.webmproject.webp`。
- iPhone 的 HEIC 先 `sips -s format jpeg in.heic --out tmp.jpg`,再用上面的命令转 WebP。
- `scripts/generate-people-avatars.mjs`(`pnpm run images:avatars`)生成的 64/256 派生图是构建期产物、**不入库**,它读的仍是 `public/people/` 里的源图——所以源图是 2MB PNG 时照样浪费仓库和构建时间,派生脚本不替代这一步。
- 头像**不要裁成正方形**再转:`ye-kaiwei` 的裁切参数是按竖构图原图调的,派生脚本也保持原比例,`fit:'inside'` 只缩不裁。

## team.json 条目格式

```json
{
  "id": "ma-zhile",            // kebab-case ascii,全站引用键,必须唯一
  "name": "马志乐",
  "name_en": "Ma Zhile",       // 可选;拉丁名(如 Ray)可省略,消费端回退到 name
  "role": "技术担当",           // 只能用四个规范值之一(见下)
  "role_en": "Tech Lead",      // 可选但有坑,见下
  "bio": "……",
  "bio_en": "……",
  "image": "/people/ma-zhile.webp"  // public/ 根相对路径,必填
}
```

`role` 的规范值(首页 `src/pages/index.astro` 的 `ROLE_ORDER` 硬编码,也是排序依据):`领队` / `技术担当` / `媒体担当` / `场景担当`。

## 关键坑

- **角色标签的生成**:首页时间轴左侧有固定标签列(甘特图式),每个 role 显示主标签 + 副标签——zh 页 `中文 + role_en 小字`,en 页 `role_en + 中文小字`,数据都在 `src/pages/index.astro` / `en/index.astro` 里从 team.json 现取(已无 `localizeRole()` 函数)。所以:同一 role 的所有成员 `role_en` 要一致,且每个 role 至少要有一个成员带 `role_en`,否则英文版角色名丢失。`role_en` 会显示在约 112px 宽的标签列里,**保持 ≤ 13 个字符**("Scenario Lead" 是目前上限)。
- 交接换班:在前任的 `disembarkedAt` 里加 `handoffTo: "<新成员id>"`,并为新成员加一条只有 `boardedAt` 的片段。validate-site 会校验 `crewId`/`handoffTo` 必须是已知 team id。
- 英文 fallback 是 `name_en || name`、`bio_en || bio`(index.astro 手写,不走 `localize()`),所以 `_en` 字段缺了不会报错,但英文页会显示中文——加成员时三个 `_en` 字段都应补齐。
- journals frontmatter 的 `people: []` 也引用 team id(validate-site 校验),改 id 时要全局搜。

## 操作步骤

1. 头像转成 WebP 后放入 `public/people/`(见上面「图片规范」;`sips -s format webp` 在本机不可用)。
2. 编辑 `src/data/team.json`:新成员追加条目;改信息直接改字段;三个 `_en` 字段补齐。
3. 若要出现在首页时间线/在车网格:编辑 `src/data/boardings.json`(见上面的交接规则)。
4. 验证:`pnpm check`(id 唯一性、图片存在、boarding/journal 引用)。渲染行为变了再跑 `pnpm harness`。
