# Scripts guide

本目录包含内容校验、外部同步和图片派生。脚本运行于本地、GitHub Actions 或构建前流程；修改时保持无交互、确定性和清晰失败信息。

## 修改流程

1. 找到生产调用方：`package.json`、`.github/workflows/`、Docker/build 或文档。
2. 保持输入权威与输出边界；同步脚本只写其声明的生成物和资源目录。
3. 把可测试的解析/决策逻辑放入 `scripts/lib/`，网络与文件写入留在入口脚本。
4. 先用 fixture/现有脚本路径验证纯逻辑，再在具备凭据时模拟 CI 入口。不要用外部管理 CLI 替代项目脚本来判断同步产物。
5. 同步修改相关 workflow、schema、消费者与 runbook；运行 `pnpm check`。

完成标准：无凭据时给出明确错误或按设计安全停驻，有凭据时重复运行结果稳定，校验能阻止半完成数据进入站点。

## 权威与硬锁

- `sync-live-videos.mjs` 从飞书读取并生成 `src/data/live-videos.json`。修改飞书 Base 内容/结构使用 `lark-cli --as user`；验证同步行为运行项目脚本。
- `sync-yuque-journals.mjs` 生成 `src/data/yuque-journals.json`。已匹配城市 sticky，override 优先；仅 `city: "yuque"` 可重新推断。
- `CITY_KEYWORDS` 只登记别名/fold-in；stop 主名称来自 `src/content/stops/`。不从文章正文、诗意标题或新 stop 批量重推城市。
- 除非任务明确要求改变城市锁，不修改 `resolveSyncedCity`、`parseCityOverrides`、sync overlay 或 `validateJournalCityOverrides`。
- `validate-site.mjs` 是跨文件约束的执行规范。新增数据关系时在此增加能指出具体文件/id 的校验。

图片派生规则见 `docs/image-derivatives.md`；输出通常 gitignored，页面装配必须保留原图 fallback。
