import { copyFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { liveDataDir, readFeatured, writeFeatured } from '@/lib/live';

// 精选的文件操作：archive（30 天清理）→ featured（长期保留）⇄ featured/trash（30 天清理）。
// 所有 JSON 写走 lib/live.ts 的原子写；文件移动同目录 rename 原子完成。

const BASE_RE = /^\d{8}-\d{6}$/;

export type ToggleResult =
  | { ok: true; action: 'featured' | 'unfeatured' | 'restored' }
  | { ok: false; error: 'invalid' | 'expired' | 'not-found' };

function paths(base: string) {
  const dir = liveDataDir();
  return {
    archive: path.join(dir, 'archive', `${base}.jpg`),
    featured: path.join(dir, 'featured', `${base}.jpg`),
    trash: path.join(dir, 'featured', 'trash', `${base}.jpg`),
    webp: path.join(dir, 'featured', 'webp', `${base}.webp`),
  };
}

/** 1280px WebP 展示图（公开轮播用）；失败只删半成品，由路由回退原图 */
async function ensureWebp(base: string): Promise<void> {
  const p = paths(base);
  mkdirSync(path.dirname(p.webp), { recursive: true });
  const tmp = `${p.webp}.tmp`;
  try {
    await sharp(p.featured)
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(tmp);
    renameSync(tmp, p.webp);
  } catch (error) {
    try {
      unlinkSync(tmp);
    } catch {
      // 半成品不存在，忽略
    }
    throw error;
  }
}

/** 入选 ⇄ 取消（对已取消的记录再次入选 = 恢复） */
export async function toggleFeatured(base: string): Promise<ToggleResult> {
  if (!BASE_RE.test(base)) return { ok: false, error: 'invalid' };
  const p = paths(base);
  const entries = readFeatured();
  const existing = entries.find((e) => e.file === base);

  // 取消精选：featured → trash
  if (existing && existing.removedAt === null) {
    if (!existsSync(p.featured)) return { ok: false, error: 'not-found' };
    mkdirSync(path.dirname(p.trash), { recursive: true });
    renameSync(p.featured, p.trash);
    try {
      unlinkSync(p.webp);
    } catch {
      // webp 不存在无妨
    }
    existing.removedAt = new Date().toISOString();
    writeFeatured(entries);
    return { ok: true, action: 'unfeatured' };
  }

  // 再次入选已有记录 = 恢复：trash → featured
  if (existing) {
    return restoreFeatured(base);
  }

  // 新入选：archive → featured（archive 已被 30 天清理则过期）
  if (!existsSync(p.archive)) return { ok: false, error: 'expired' };
  mkdirSync(path.dirname(p.featured), { recursive: true });
  copyFileSync(p.archive, p.featured);
  try {
    await ensureWebp(base);
  } catch {
    // webp 失败不阻塞入选：公开路由回退原图
  }
  entries.push({ file: base, pickedAt: new Date().toISOString(), removedAt: null });
  writeFeatured(entries);
  return { ok: true, action: 'featured' };
}

/** 回收站恢复：trash → featured */
export async function restoreFeatured(base: string): Promise<ToggleResult> {
  if (!BASE_RE.test(base)) return { ok: false, error: 'invalid' };
  const p = paths(base);
  const entries = readFeatured();
  const existing = entries.find((e) => e.file === base);
  if (!existing || existing.removedAt === null) return { ok: false, error: 'not-found' };

  if (existsSync(p.trash)) {
    mkdirSync(path.dirname(p.featured), { recursive: true });
    renameSync(p.trash, p.featured);
  } else if (existsSync(p.archive)) {
    // trash 文件已丢（极端）：archive 还在就重新复制
    mkdirSync(path.dirname(p.featured), { recursive: true });
    copyFileSync(p.archive, p.featured);
  } else {
    return { ok: false, error: 'expired' };
  }
  try {
    await ensureWebp(base);
  } catch {
    // 同上，回退原图
  }
  existing.removedAt = null;
  writeFeatured(entries);
  return { ok: true, action: 'restored' };
}

/** 回收站条目：removedAt 非空且 trash 文件还在（被 capture 清掉的条目在此消失，下次写 featured.json 时惰性移除） */
export function listTrash(
  keepDays: number,
): { file: string; removedAt: string; daysLeft: number }[] {
  const now = Date.now();
  return readFeatured()
    .filter((e) => e.removedAt !== null && existsSync(paths(e.file).trash))
    .map((e) => {
      const removedMs = new Date(e.removedAt as string).getTime();
      const daysLeft = Math.max(
        0,
        Math.ceil((keepDays * 86_400_000 - (now - removedMs)) / 86_400_000),
      );
      return { file: e.file, removedAt: e.removedAt as string, daysLeft };
    })
    .sort((a, b) => (a.removedAt < b.removedAt ? 1 : -1));
}
