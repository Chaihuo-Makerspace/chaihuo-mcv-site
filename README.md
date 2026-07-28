# 柴火基地车官网 | Chaihuo MCV Site

移动 AI 实验室"普罗米修斯号"官方网站 — 用 200 天行走中国，在极限环境里检验技术，与在地居民共创解决方案。

中英双语，支持旅途日记和交互路线地图。

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Astro 7 + React 19 (Islands) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix) |
| Animation | Framer Motion + GSAP |

## Getting Started

```bash
pnpm install
pnpm dev
```

> 仅支持 pnpm，不要使用 npm 或 yarn。

## Checks

```bash
pnpm check
pnpm smoke
pnpm audit:ui
pnpm visual
pnpm build
```

- `pnpm check` runs project content validation plus Astro type diagnostics.
- `pnpm smoke` runs browser route smoke tests against a production preview.
- `pnpm audit:ui` runs a lightweight UI/accessibility semantics audit.
- `pnpm visual` captures desktop/mobile screenshots and checks visual substance, overflow, and runtime errors.
- `pnpm build` runs `pnpm check` before creating the production build.
- `pnpm build:astro` runs the raw Astro build when you need to isolate build behavior.
- `pnpm harness` runs `pnpm check` and the full Playwright harness.

## Pages

中文为默认语言（无前缀），英文路由在 `/en/` 下。

| 中文路由 | 英文路由 | 页面 | 说明 |
|----------|----------|------|------|
| `/` | `/en/` | 首页 | Hero 轮播、视频弹窗、中国路线图、移动 AI 实验室卡片 |
| `/journals` | `/en/journals` | 旅途日记 | 城市日记列表、筛选、详情页 |
| `/route` | `/en/route` | 行程路线 | 交互中国地图、城市面板、关联日记 |
| `/deconstruct` | `/en/deconstruct` | 解构基地车 | 改装手记、装备清单 |
| `/guide` | `/en/guide` | 上车指南 | 参与指南、FAQ、团队介绍 |
| `/about` | `/en/about` | 关于柴火 | 柴火历程时间轴（GSAP 滚动驱动） |

## Architecture

Astro 页面 + React Islands 模式：每个 `.astro` 页面在 frontmatter 中获取数据并处理 i18n，然后将数据传入 `*Content.tsx` React 组件渲染。

```
src/
├── pages/           # Astro 路由（zh 默认 + en/ 镜像）
├── app/components/  # React Islands + shadcn/ui
├── features/        # 复杂功能模块（路线地图等）
├── content/         # Markdown 集合（改装手记、旅途日记）
├── data/            # JSON 结构化数据（装备、团队、FAQ 等）
├── i18n/            # 翻译字典（按页面拆分）
├── assets/          # 图片
└── styles/          # Tailwind CSS 主题与全局样式
```

## Content

- **Markdown 集合**（Astro Content Collections）：`src/content/notes/`（改装手记）、`src/content/journals/`（旅途日记）
- **JSON 数据**：`src/data/` 下的装备、团队、FAQ、合作伙伴、Heroes、登车记录、路线城市等
- JSON 中使用 `_en` 后缀字段实现双语（如 `title` / `title_en`）

`scripts/validate-site.mjs` 会额外检查跨文件引用，包括城市 ID、人员 ID、装备 ID、公开图片路径、i18n 字典键一致性和英文页面镜像。

更多 AI 自迭代流程见 `docs/ai-iteration.md`。

## 日常内容更新（AI Skills)

仓库在 `.agents/skills/`（本地目录，不入库）维护了两个项目级 skill，覆盖最高频的两类例行更新。让 AI agent 按对应 skill 的步骤清单执行，可以避免漏掉跨文件同步点：

- **车到新城市 / 进入新省** → `update-route-stop`：新增或更新 `src/content/stops/` 站点、翻转 `visited`、省份填色、首页时间轴的省际路段带（`route-legs.ts` 的 `PROVINCE_SHORT`)、"N 省 N 城"文案等 8 项同步清单；也可先跑 `pnpm update:city` 自动生成站点骨架再手动补齐。
- **加成员 / 换头像 / 交接换班** → `update-team-member`:`team.json`（档案）→ `boardings.json`（登车与交接）→ `public/people/`（头像）的数据流，以及角色标签、`role_en` 一致性的注意事项。

两类更新都以 `pnpm check` 收尾验证；渲染行为有变化再跑 `pnpm harness`。

## License

MIT
