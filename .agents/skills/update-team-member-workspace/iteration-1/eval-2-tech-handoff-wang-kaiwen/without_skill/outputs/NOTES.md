# 变更说明:技术担当交接(何智伟 → 王凯文)

任务:何智伟(he-zhiwei)于 2026-07-28 在西安下车,技术担当交接给新成员王凯文(目前在车上)。

## 改动文件

- `src/data/team.json`:在末尾新增王凯文条目(id `wang-kaiwen`,技术担当/Tech Lead,bio:硬件工程师,负责车载设备维护 / Hardware engineer maintaining onboard equipment)。何智伟条目保留,与已下车成员(冯磊、颜志鹏等)一样作为历史成员留在名册中。
- `src/data/boardings.json`:
  - `b15`(he-zhiwei):补上 `disembarkedAt` = 2026-07-28 西安,`handoffTo: "wang-kaiwen"`。
  - 新增 `b18`(wang-kaiwen):2026-07-28 西安上车,`disembarkedAt: null`(在车上)。
- `public/people/wang-kaiwen.png`:从 `inbox/wang-kaiwen.png` 复制的新成员照片。

## 校验

`node scripts/validate-site.mjs` 通过(1244 checks,退出码 0),完整输出见 `../outputs/check.log`。

未做 git commit。
