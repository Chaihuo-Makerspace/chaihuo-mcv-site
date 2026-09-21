# AI iteration harness

本项目用一组递进检查让 Agent 从静态约束走到真实页面。先运行最便宜、最接近改动的检查；每一层通过后再扩大范围。

## 默认循环

1. 读取根 `AGENTS.md`、目标目录最近的 `AGENTS.md` 和被点名的按需文档。
2. 运行 `git status --short --branch`，确认并保留已有改动。
3. 追踪权威数据源、装配层和消费者，完成最小完整改动。
4. 运行 `pnpm check`，修复由本次改动引起的 Biome、内容引用和 Astro/TypeScript 问题。
5. 按下表运行浏览器检查；失败时先确认能在目标 spec 中稳定复现，再修改实现。
6. 交付前查看 `git diff --check` 和 scoped diff，确认没有无关格式化、生成物误改或漏掉英文镜像。

## 改动矩阵

| 改动 | 必跑 |
|---|---|
| 文档、脚本注释、不参与构建的说明 | `git diff --check`；验证文档中的路径/命令 |
| TypeScript、Astro、schema、JSON、Markdown 内容 | `pnpm check` |
| 路由、导航、页面装配、公开内容或重定向 | `pnpm check` + `pnpm smoke` |
| 交互控件、链接、heading、图片或页面语义 | 上述检查 + `pnpm audit:ui` |
| UI、布局、动画、地图、轮播或响应式行为 | `pnpm check` + `pnpm smoke` + `pnpm visual`；涉及语义时加 `pnpm audit:ui` |
| 跨页面或高风险渲染改动 | `pnpm harness` |
| 发布候选、依赖、构建配置、Docker 或图片管线 | `pnpm build`，再运行受影响的浏览器检查 |

`pnpm check` 已包含 `biome check .`、`scripts/validate-site.mjs` 和 `astro check`。不要用 `pnpm build:astro` 代替正常的前置校验。

## 浏览器检查

- `pnpm smoke`：核心 zh/en 路由、发布日记详情和旧文档重定向。
- `pnpm audit:ui`：document language、landmarks、可见 h1、图片 alt、交互 accessible name 和链接命名一致性。
- `pnpm visual`：桌面/移动内容完整性、横向溢出、运行时错误，并生成截图。
- `pnpm harness`：`pnpm check` 加全部 Playwright harness。

Playwright 默认构建 Astro 并在 `127.0.0.1:4322` 启动 preview。针对已运行的开发服务器：

```bash
TEST_BASE_URL=http://127.0.0.1:4321 pnpm smoke
```

## 失败排查

- Biome：先看是否只涉及本次文件；使用项目格式，不全仓库机械改写。
- 内容校验：按错误中的文件和 stable id 修正权威源，不在消费者里绕过约束。
- Astro check：检查 schema、`.astro` 装配和 Island props 是否同步。
- Smoke：检查路由、redirect、SSR/水合错误和页面 shell。
- UI audit：优先用原生 HTML 与可见标签，再补 ARIA。
- Visual：打开 Playwright report/截图，检查空白、塌陷、移动端溢出和 runtime errors。

视觉 harness 是结构性 smoke，不是像素快照。它应捕获空白页、断裂布局和运行时问题，同时允许有意的设计迭代。
