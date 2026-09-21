# Content guide

本目录存放人工维护的 Astro Content Collections。schema 在 `src/content.config.ts`，stop/people 的领域 schema 位于 `src/features/route-map/`。

## 通用流程

1. 复制同集合中最近、结构完整的条目或 `_template.md`，保持 stable id 和 frontmatter 类型。
2. 中文正文为主；有 `.en.md` 同伴的集合同步维护英文文件。结构标题必须与 parser 预期一致。
3. 图片放入现有 public/assets 体系，使用根路径 URL 并提供真实说明文字。
4. 更新跨文件引用后运行 `pnpm check`；内容会改变公开页面时再跑 `pnpm smoke`。

完成标准：schema 与引用校验通过，中文/英文结构对应，公开 UI 没有占位符和断图。

## stops/

- 修改前阅读 `docs/deployment-yuque-sync.md`，并遵循 `update-route-stop` skill。
- `id` 一旦被日记、人物或路线引用就保持稳定；`order` 唯一并决定行驶顺序。
- zh 文件承载 frontmatter；`.en.md` 是英文正文同伴，文件名前缀与 zh 完全一致。
- `visited` 表示官方已到达。保持已有的 `true`；未来计划为 `false`。途经点使用 `routeOnly: true`，不算城市。
- 当前位置由最后一个已访问且非途经 stop 推导。不要新增 current 字段。
- 真实到达事件使用 ISO 日期；它参与时间轴计算。无法确认的信息保持未到达或省略，不用诗意标题补事实。
- 不在 stop frontmatter 写 `themes`。日记场景分类由 journal 数据维护。

## journals/、notes/、people/

- 手写 journal 的 `city` 必须引用现有 stop id；`people` 和 `equipment` 使用稳定 id。
- `status` 是明确编辑状态，不从正文长度推断。
- 语雀同步日记不在本目录维护；其生成物和 override 规则见 `src/data/AGENTS.md`。
- people/met 的中英文正文由 stop loader 组装；修改字段时同步 `people-schema.ts`。
