# 新增团队成员:李岚

## 改动文件

- `src/data/team.json`
  - 新增成员 `li-lan`(李岚 / Li Lan,媒体担当 / Media Lead),中英文 bio 按需求填写,头像指向 `/people/li-lan.jpg`。

- `src/data/boardings.json`
  - 新增登车记录 `b18`:`crewId: li-lan`,2026-07-27 在西安登车,`disembarkedAt: null`(仍在车上)。

- `public/people/li-lan.jpg`(新增)
  - 由 `inbox/li-lan-photo.jpg`(2400×1800 相机原图)处理而来:方形裁剪脸部区域(原图坐标 550,350 起 1300×1300),缩放到 800×800、JPEG 质量 85,约 84KB,与现有头像规格(如 zhou-yantong.webp 800×800)一致。

## 校验

- `node scripts/validate-site.mjs` 通过(1240 checks,退出码 0),完整输出见 `check.log`。
