# 柴火基地车官网 | Chaihuo MCV Site

移动的 AI 实验室 — 用 200 天行走中国，在极限环境里检验技术，与在地居民共创解决方案。

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 (Rolldown) |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix) |
| 3D | React Three Fiber 9 + Drei 10 + Three.js 0.183 |
| Animation | Motion (Framer Motion) |
| Routing | React Router 7 |
| Carousel | react-slick |

## Getting Started

```bash
npm install
npm run dev
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero 轮播、视频弹窗、中国路线图（马字走线）、移动AI实验室 |
| `/deconstruct` | 解构基地车 | 普罗米修斯号 3D 爆炸图（R3F）、改装手记、装备清单 |
| `/documentation` | 完整纪实 | 时间轴纪实（开发中） |
| `/guide` | 上车指南 | 参与指南（开发中） |

## Architecture

```
src/
├── app/
│   ├── pages/          # 页面组件
│   ├── components/
│   │   ├── ui/         # shadcn/ui 组件库
│   │   ├── figma/      # Figma 生成的辅助组件
│   │   ├── Navigation.tsx
│   │   └── VehicleExplodedView.tsx  # R3F 3D 爆炸图
│   └── routes.ts       # React Router 路由配置
├── styles/             # CSS: index → fonts + tailwind + theme
└── assets/
```

## Data Sources

- **改装日志**: 语雀 → 本地 Markdown 同步（`scripts/sync-yuque.ts`，待实现）
- **装备清单**: 组件内静态数据（后续可接数据库）

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | v1 存档（Astro 架构） |
| `v2` | 当前开发（React SPA） |

## License

MIT
