# Playwright harness guide

这些测试帮助 Agent 验证公开站点的路由、语义和视觉完整性。它们是行为护栏，不是组件实现的镜像。

## 测试职责

- `smoke.spec.ts`：核心 zh/en 路由、已发布日记和重定向可访问，页面无严重运行时错误。
- `ui-audit.spec.ts`：语言、landmark、可见 h1、图片 alt、交互名称和链接命名。
- `visual.spec.ts`：桌面/移动内容完整性、横向溢出、运行时错误和供人工查看的截图。

## 修改流程

1. 为用户可观察的契约写断言：路由存在、关键内容可见、控件可操作、布局没有溢出。
2. 使用稳定的角色、名称、路径或专用 data attribute；避免绑定 Tailwind 类、动画中间帧或精确像素。
3. 公共路由变化同步 zh/en case；动态 journal case 从真实发布数据派生。
4. 先运行目标 spec，再根据改动运行 `pnpm harness`。失败时查看 Playwright report 和截图，不用提高 timeout 掩盖竞态。

完成标准：测试能在生产 preview 上复现目标契约，对合理文案/布局微调保持稳定，并在实际缺失或破坏时失败。

默认配置会构建站点并在 `127.0.0.1:4322` 启动 preview。调试已有服务器可设置 `TEST_BASE_URL`。
