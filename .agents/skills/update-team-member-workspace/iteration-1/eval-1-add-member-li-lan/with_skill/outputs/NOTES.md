# 新增团队成员：李岚（Li Lan)

## 改动的文件

- `public/people/li-lan.webp`（新增）— 头像。原图 `inbox/li-lan-photo.jpg` 为 2400×1800 相机原图，用 ffmpeg 居中裁剪成 1800×1800 方形后缩放到 800×800，再用 cwebp 转为 webp（约 61KB)，符合 `public/people/` 的 800×800 webp 惯例。注：本机 sips 不支持写 webp，故改用 ffmpeg + cwebp。
- `src/data/team.json`（修改）— 末尾追加李岚条目：`id: "li-lan"`，`role: "媒体担当"` / `role_en: "Media Lead"`（与其他媒体担当成员保持一致）,zh/en 的 name、bio 均已补齐，`image` 指向 `/people/li-lan.webp`。
- `src/data/boardings.json`（修改）— 新增登车片段 `b18`:crewId `li-lan`,`boardedAt` 2026-07-27 西安（Xi'an),`disembarkedAt: null` 表示当前仍在车上，会出现在首页"当前在车"bio 网格里。任务未提及任何人下车，故未给前任加 `handoffTo`，现有媒体担当瞿嘉露仍在车片段保持不变（同角色多人同时在车已有先例）。

## 验证

- `node scripts/validate-site.mjs` 通过：Site validation passed (1240 checks)，退出码 0，完整输出见 `../outputs/check.log`。
- 头像已读取目检：800×800 webp，人脸居中，适合做圆形头像。
