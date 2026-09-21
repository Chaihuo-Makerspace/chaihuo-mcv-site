# Astro pages guide

`src/pages/` 定义 Astro 文件路由。中文是默认语言，英文页面位于 `src/pages/en/`，公共页面保持镜像。本指南放在 `docs/`，因为 `src/pages/*.md` 会被 Astro 当作页面路由。

## 修改流程

1. 找到中文页面、英文镜像和对应的 `src/app/components/*Content.tsx`。
2. 在 frontmatter 中读取 collection/JSON，完成排序、过滤、图片 fallback 和 `localize()`；只把渲染需要的数据传给 Island。
3. 新增文案时更新相关 `src/i18n/*.ts` 的 zh/en 键。内部链接用 `localePath()`，Layout、Navigation 和 Footer 传递 `locale`。
4. 新增或删除公共路由时同步 zh/en、导航、alternate URL、sitemap 和 `tests/harness/smoke.spec.ts`。
5. 运行 `pnpm check`；页面渲染改动至少再跑 `pnpm smoke`，UI 改动按根文件矩阵补跑视觉与语义检查。

完成标准：两种语言都能直接访问，`lang`/canonical/alternate 正确，服务端装配不把未本地化或过量数据送入客户端，相关路由检查通过。

## 边界

- `.astro` 是数据装配层，React Island 是交互层。共享业务转换提取到 `src/lib/` 或对应 feature，不在 zh/en 页面复制复杂逻辑。
- 英文页面目前是完整镜像文件。修改数据形状或 Island props 时，两边一起更新。
- 公开页面使用共享 Layout。`/live/admin` 是中文、`noindex` 的成员后台，可以没有英文镜像。
- API 路由位于 `api/`；涉及 live 文件读取、鉴权、featured 状态或下载时先读 `docs/live-capture.md`。
- Astro 7 对无效 HTML 嵌套严格，内联元素间需要空格时使用显式 `{' '}`。

## 数据提示

- `live-videos.json` 和 `yuque-journals.json` 是生成物，页面只能读取。
- 大图通常在 frontmatter 中选择派生 WebP，并以原图作为 `existsSync` fallback；细节见 `docs/image-derivatives.md`。
- 首页当前位置从最后一个已访问、非 `routeOnly` 的 stop 推导，不额外创建或硬编码 current city。
- 改装手记的“查看全部”固定链接到 `https://www.yuque.com/chaihuo-mcv/home`。
