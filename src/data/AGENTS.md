# Data guide

先判定文件的权威来源，再编辑。数据文件分为同步生成物和仓库内人工源。

## 生成物：只由同步流程重写

| 文件 | 权威来源 | 同步入口 |
|---|---|---|
| `live-videos.json` | 飞书 Base「基地车路上视频」 | `scripts/sync-live-videos.mjs` |
| `yuque-journals.json` | 公开语雀知识库 + 人工 overrides | `scripts/sync-yuque-journals.mjs` |

内容修正要改外部源、override 或同步映射。不要把手工编辑生成物作为持久修复，也不要用格式化工具重写整个文件。

用户明确指定某篇日记的城市时，按照 `docs/deployment-yuque-sync.md` 增加 `journal-city-overrides.json` pin，并让即时展示值与 override 一致；这是生成文件唯一允许的临时配套改动。未明确指定时不猜城市。

日记场景 pin 写入 `journal-category-overrides.json`，值只用 `science | industry | maker | education`。不从标题或 venue 推断。

## 人工数据

`team.json`、`boardings.json`、`equipment.json`、`faq.json`、`partners.json`、`heroes.json`、`press.json`、timeline/config 和 override 文件在仓库内维护。

- 修改前搜索 id 的所有消费者和校验；stable id 不随显示名变化。
- 面向访客的字段同时维护 `_en`，并确认 `src/content.config.ts` 或本地类型覆盖新字段。
- 团队成员/头像/交接使用 `update-team-member` skill；媒体报道使用 `add-press-entry` skill。
- schema 变化必须同步数据生产者、同步脚本（若有）、装配层、类型、组件和校验。

完成标准：`pnpm check` 通过，生成物来源没有被绕过，所有新增引用存在，中文和英文消费者都得到预期字段。
