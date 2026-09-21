# AGENTS.md

柴火基地车官网（普罗米修斯号）是 Astro 7 SSR + React 19 Islands 的中英双语站点。中文路由无前缀，英文路由位于 `/en/`。包管理器只用 `pnpm`。

## 开始工作

1. 先运行 `git status --short --branch`，保留现有改动；找到目标文件所在目录中最近的 `AGENTS.md` 并阅读。
2. 从数据源追到页面：数据/Content Collection → `.astro` 装配与本地化 → React Island。先确认权威数据源，再改展示层。
3. UI 改动先读 `docs/DESIGN.md`；路线、当前位置、站点、日记城市或场景分类改动先读 `docs/deployment-yuque-sync.md`。
4. 做满足需求的最小完整改动。中文和英文、schema 和消费者、桌面和移动端必须一起考虑。
5. 按 `docs/ai-iteration.md` 的改动矩阵验证；报告执行过的检查和仍存在的限制。

完成标准：目标行为已实现，权威数据源正确，中英入口一致，相关检查通过，工作区没有被顺带格式化或覆盖的无关改动。

## 代码地图与局部规则

| 范围 | 职责 | 修改前读取 |
|---|---|---|
| `src/pages/` | Astro 路由、数据装配、SEO、zh/en 镜像 | `docs/agent-pages.md` |
| `src/app/components/` | 页面 React Islands、共享交互组件 | `src/app/components/AGENTS.md` |
| `src/features/route-map/` | 路线地图、站点装配、投影、时间轴 | `src/features/route-map/AGENTS.md` |
| `src/content/` | 手写 Markdown、站点与遇见的人 | `src/content/AGENTS.md` |
| `src/data/` | JSON 数据、生成物与人工数据 | `src/data/AGENTS.md` |
| `scripts/` | 校验、同步、图片派生脚本 | `scripts/AGENTS.md` |
| `tests/harness/` | Playwright smoke、语义和视觉检查 | `tests/harness/AGENTS.md` |

其他关键入口：

- `src/content.config.ts`：Astro Content Collections schema，必须位于此路径；从 `astro/zod` 导入 `z`，从 `astro/loaders` 导入 loader。
- `src/i18n/`：页面与共享翻译字典；`src/i18n/index.ts` 提供 `Locale`、`localize()`、`localePath()`。
- `src/styles/theme.css`：设计令牌的单一事实来源；Tailwind v4 配置也在 CSS 中，没有 `tailwind.config`。
- `src/app/components/ui/`：shadcn/Radix 基础组件，视为上游代码且不手工修改；业务样式和行为放在调用方。
- `docs/CHANGELOG.md`：已完成的重要功能记录；不要把变更日志堆进本文件。

## 全局不变量

### 数据权威

- `src/data/live-videos.json` 来自飞书 Base，`src/data/yuque-journals.json` 来自语雀；两者是同步产物。内容修正应修改外部源或同步映射，生成物只可由同步流程重写。
- 人工数据（如 `team.json`、`equipment.json`、`faq.json`、override 文件和 `src/content/stops/`）在仓库中维护。
- 新字段要形成完整链路：权威源/schema → 装配或同步 → 类型/组件 → zh/en → 校验。

### 路线位置与日记归属硬锁

- 首页“位于”和地图黄点取 `order` 最大、`visited: true` 且非 `routeOnly` 的官方 stop；没有独立的 current-city 字段。移动位置要更新 stop，不在组件或 i18n 中硬编码城市和计数。
- 已由人工标为 `visited: true` 的 stop 保持已访问；`routeOnly` 只表示途经点，不计入城市数和当前位置。
- 已匹配的语雀日记城市是 sticky。不要根据诗意标题、正文或新增站点重新推断城市。
- 用户明确指定日记归属时，按 `docs/deployment-yuque-sync.md` 同时维护 `journal-city-overrides.json` 和即时展示值；不要批量重排。
- 日记 `category` 只用 `src/lib/scenes.mjs` 的 `science | industry | maker | education`，人工 pin 写入 `journal-category-overrides.json`，不从标题推断。
- 除非用户明确要求更改锁本身，不改城市锁解析、overlay 和校验逻辑。

### 国际化与页面结构

- 面向访客的新文案同时加入相关 `src/i18n/*.ts` 的 zh/en 字典；JSON 双语字段使用 `_en`，在 `.astro` 装配层通过 `localize()` 选择。
- 公共中文页面在 `src/pages/`，英文镜像在 `src/pages/en/`。增加或删除公共路由时同步两边并更新导航、alternate URL、sitemap 与 smoke 覆盖。
- `.astro` 负责数据读取、本地化和精简 props；React Island 负责交互。不要让组件自行重复读取同一份内容数据。

### UI 与实现

- 使用 `theme.css` 已定义的 `brand`、`surface-*`、`neutral-*` 等令牌；不用硬编码页面颜色或 Tailwind `gray-*`。品牌黄只作小面积强调。
- 页面内容列使用 `.page-rail`；例外是阅读页、全幅地图和后台，详见 `docs/DESIGN.md`。
- 图标使用 Lucide React；交互元素具备可访问名称、`cursor-pointer` 和 `transition-colors duration-200`。
- 动效复用 `src/app/components/motion.tsx`，尊重 `prefers-reduced-motion`；全页最多一个循环状态动画。
- 空字段整块不渲染；“待补充 / To be updated”等占位内容不能进入公共 UI。

## 常见陷阱

- `react-slick` 是 CJS，沿用 `HomeContent.tsx` 现有的嵌套 `default` 兼容写法。
- React 组件中的 Astro 图片 import 可能是 `{ src, width, height }`，传给 DOM 前提取 `.src`。
- Astro 7 的 JSX HTML 压缩会移除内联元素之间的源码空白；需要空格时写显式 `{' '}`。Rust 编译器不会替你修复无效嵌套。
- Docker 固定 `pnpm@11.5.0`。workspace/lockfile 变更用同版本生成和验证。
- 生产由 Tengine/CDN + Jenkins 发布；排查线上陈旧版本时读 `docs/deployment-yuque-sync.md`，不要把 Cloudflare Workers/Pages 检查当作部署结果。

## 命令

```bash
pnpm dev          # 派生图片后启动开发服务器
pnpm check        # Biome + 内容引用校验 + Astro/TypeScript
pnpm smoke        # 核心 zh/en 路由
pnpm audit:ui     # 语义和可访问性
pnpm visual       # 桌面/移动布局、溢出、运行时错误、截图
pnpm harness      # check + 完整 Playwright harness
pnpm build        # check + 图片派生 + Node standalone build
```

浏览器检查默认由 Playwright 构建并在 `127.0.0.1:4322` 启动 preview。只在排查构建阶段时使用 `pnpm build:astro`；正常交付使用包含前置校验的 `pnpm build`。

## 按需文档

- 设计、令牌、版心、动效或新 UI：`docs/DESIGN.md`；对照页 `/elements`、`/en/elements`。
- Astro 路由、页面装配、SEO 或 zh/en 镜像：`docs/agent-pages.md`。
- 验证选择与失败排查：`docs/ai-iteration.md`。
- stop、当前位置、日记城市/分类、Yuque 同步或 Jenkins：`docs/deployment-yuque-sync.md`。
- `/live`、capture 服务或后台：`docs/live-capture.md`。
- public 大图、WebP 或图片生成脚本：`docs/image-derivatives.md`。
- 路线页设计背景：`docs/route-redesign.md`，它是历史设计说明；当前行为以代码、schema 和 `docs/DESIGN.md` 为准。
