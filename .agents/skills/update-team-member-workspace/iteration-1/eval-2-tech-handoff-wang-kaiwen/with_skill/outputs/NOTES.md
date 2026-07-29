# 变更说明

任务：何智伟(he-zhiwei)2026-07-28 在西安下车，技术担当交接给新成员王凯文(wang-kaiwen)。

## 修改的文件

- `public/people/wang-kaiwen.webp` — 新增头像。源图 `inbox/wang-kaiwen.png`，用 Python PIL 居中裁剪为方形并缩放至 800×800、转为 webp（本机 sips 不支持写 webp,故未用 skill 示例命令）。
- `src/data/team.json` — 追加王凯文条目：`role: 技术担当` / `role_en: Tech Lead`（与其他技术担当一致，保证英文角色标签正常）,bio 中英按任务给定内容填写，`image` 指向上面的 webp。
- `src/data/boardings.json` — 两处：
  - `b15`(he-zhiwei)的 `disembarkedAt` 从 `null` 改为 `2026-07-28 西安 / Xi'an`，并加 `handoffTo: "wang-kaiwen"`，形成交接链。
  - 新增 `b18`:wang-kaiwen,2026-07-28 西安登车，`disembarkedAt: null`（当前在车，会出现在"当前在车"网格）。

## 验证

- `node scripts/validate-site.mjs` 通过（exit 0,1244 checks)，完整输出见 `check.log`。
- 未做 git commit。
