# React components guide

本目录放页面级 React Islands 和共享交互组件。数据读取与本地化通常由 `src/pages/*.astro` 完成。

## 修改流程

1. 先确认 props 的装配页面以及 zh/en 两个调用点；修改接口时同步所有调用方。
2. 文案从 `t` 字典读取，链接通过 `localePath()` 构造。可选内容为空时隐藏整个区块。
3. 复用 `motion.tsx` 的 variants/transitions；交互状态优先用语义 HTML，随后补充可访问名称、键盘行为和 reduced-motion。
4. 使用 `theme.css` 令牌和 `.page-rail`，新 UI 对照 `docs/DESIGN.md` 与 `/elements`。
5. 运行 `pnpm check`；交互或布局改动再运行 `pnpm audit:ui`、`pnpm visual`，路由级行为补 `pnpm smoke`。

完成标准：props 两端一致，中英文无硬编码分叉，空态与加载态明确，桌面/移动无溢出，键盘和 reduced-motion 可用。

## 约定

- `ui/` 是 shadcn/Radix 基础层，不手工修改。业务样式和行为放在页面组件或 feature 中。
- 图标使用 Lucide React。可点击元素使用 `cursor-pointer transition-colors duration-200`，并保留清晰 focus 状态。
- 全页最多一个无限循环动画，通常只给“当前位置”等实时状态。
- Astro 图片 import 传入 React 后可能不是字符串；沿用现有兼容提取方式获得 `.src`。
- `HomeContent.tsx` 中 `react-slick` 的嵌套 `default` 处理是 Vite/CJS 兼容代码，保持该写法。
- 当前站点状态、城市数和路线进度从 stop 数据计算，不写进组件常量或翻译字符串。
- `RoleTimeline` 的省份带与人员任期共享真实日期轴。人员横坐标始终来自自己的 `boardedAt.date`；头像防碰撞只做纵向错开，不能把相近日期合并成同一个视觉起点。

复杂地图 UI 属于 `src/features/route-map/`，同时遵守该目录的 `AGENTS.md`。
