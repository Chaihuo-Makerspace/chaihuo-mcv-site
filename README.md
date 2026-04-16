# 柴火基地车官网 | Chaihuo MCV Site

移动 AI 实验室"普罗米修斯号"官方网站 — 用 200 天行走中国，在极限环境里检验技术，与在地居民共创解决方案。

中英双语，支持 3D 车辆交互查看。

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Astro 6 + React 19 (Islands) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix) |
| 3D | React Three Fiber 9 + Three.js 0.183 |
| Animation | Framer Motion + GSAP |

## Getting Started

```bash
pnpm install
pnpm dev
```

> 仅支持 pnpm，不要使用 npm 或 yarn。

## Pages

中文为默认语言（无前缀），英文路由在 `/en/` 下。

| 中文路由 | 英文路由 | 页面 | 说明 |
|----------|----------|------|------|
| `/` | `/en/` | 首页 | Hero 轮播、视频弹窗、中国路线图、移动 AI 实验室卡片 |
| `/deconstruct` | `/en/deconstruct` | 解构基地车 | 3D 爆炸图交互、改装手记、装备清单 |
| `/documentation` | `/en/documentation` | 完整纪实 | 时间轴纪实、分类筛选 |
| `/guide` | `/en/guide` | 上车指南 | 参与指南、FAQ、团队介绍 |
| `/about` | `/en/about` | 关于柴火 | 柴火历程时间轴（GSAP 滚动驱动） |

## Architecture

Astro 页面 + React Islands 模式：每个 `.astro` 页面在 frontmatter 中获取数据并处理 i18n，然后将数据传入 `*Content.tsx` React 组件渲染。

```
src/
├── pages/           # Astro 路由（zh 默认 + en/ 镜像）
├── app/components/  # React Islands + shadcn/ui
├── content/         # Markdown 集合（改装手记、纪实文档）
├── data/            # JSON 结构化数据（装备、团队、FAQ 等）
├── i18n/            # 翻译字典（按页面拆分）
├── assets/          # 图片、3D 模型
└── styles/          # Tailwind CSS 主题与全局样式
```

## Content

- **Markdown 集合**（Astro Content Collections）：`src/content/notes/`（改装手记）、`src/content/docs/`（时间线文档）
- **JSON 数据**：`src/data/` 下的装备、团队、FAQ、合作伙伴、Heroes、时间线等
- JSON 中使用 `_en` 后缀字段实现双语（如 `title` / `title_en`）

## License

MIT
