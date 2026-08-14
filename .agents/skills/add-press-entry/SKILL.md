---
name: add-press-entry
description: 新增/更新柴火基地车官网「媒体报道」条目。当用户发来媒体报道链接（政府官网、新闻网站、微信公众号文章）、要求把某篇报道加入官网、调整首页精选(featured)、或提到 press.json 时使用。也适用于英文版字段(source_en/title_en)的补全。Use this whenever the user shares a press link or asks to add a media report to the site, even if they only say "加这篇报道" or "把这条新闻放上去".
---

# 新增媒体报道条目

媒体报道在「首页底部精选卡(1-2 条) + About 页完整列表」两处渲染,单一数据源:**`src/data/press.json`**(JSON 数组,页面直接 import)。

## 数据位置

- `src/data/press.json` — 媒体报道条目,JSON 数组。schema 见下。页面直接 import,不受 content collection 校验约束,但需保持 JSON 合法。

## press.json 条目格式

```json
{
  "source": "深圳南山政府在线",          // 来源机构官方名(zh)
  "source_en": "Shenzhen Nanshan Government Online", // 可选;英文站显示名
  "sourceUrl": "https://www.szns.gov.cn/...",        // 原文链接,必须可访问且稳定
  "title": "柴火AI基地车从深圳南山出发 开启200天共创之旅", // 报道原标题(zh)
  "title_en": "",                       // 可选;英文站 fallback 到 title
  "date": "2026-04-22",                 // 发布日期;日未知时可用 "2026-07"
  "tier": "featured",                   // featured=首页精选(政府类优先,≤3 条) | full=仅 About 完整列表
  "category": "gov"                     // gov=政府官网 | media=主流媒体 | wechat=公众号
}
```

## 添加步骤

1. **先验证链接**:`curl -sI -A "Mozilla/5.0 ..." <url>` 确认可访问、标题与内容真实。抓不到 `<title>` 时,用用户描述或正文首段概括标题,**不要编造**。
2. 提取字段:来源机构官方名、报道标题、发布日期(从页面/URL 路径推断,如 `/202607/` → "2026-07")。
3. 定 `tier`:政府类报道(发车、里程碑、政策)优先 `featured`,但首页精选保持 ≤3 条;其余 `full`。定 `category`:gov / media / wechat。
4. 追加到 `src/data/press.json` 数组末尾。**先查重**:同 `sourceUrl` 只收一次。
5. 验证:`pnpm check`(JSON 合法 + 无类型错误)。渲染行为确认跑 `pnpm build` 或 `pnpm harness`。

## 关键坑

- **公众号文章若无稳定外链,只收标题占位(可加 `sourceUrl: ""`),绝不造假链接或编造可访问 URL。** 渲染对空链接有兜底(卡不跳转)。
- **日期未知只给到月**(如 "2026-07"),不要臆造具体日。
- **口径数字**:站内 route 地图里程是实时数据(可能已超 2 万 km),引用「1.9 万公里」等计划口径时在文案写「预计」,不与实时数据打架。省份数 21 省 vs 二十多省以官方口径为准,站间保持一致。
- 媒体报道汇总源是飞书 wiki(https://seeedstudio.feishu.cn/wiki/X72LwhfICiTpUqkvQQ0cF9qwnuh),**可能需要登录**,抓不到时向用户要公开链接,不要用登录墙后的 URL。
- `tier` 变更(精选↔全部)直接改字段即可,两处渲染自动跟随。
