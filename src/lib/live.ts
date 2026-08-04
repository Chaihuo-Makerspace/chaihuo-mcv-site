import { readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export interface LiveMeta {
  capturedAt: string;
  file: string;
  bytes: number;
  width: number;
  height: number;
  /** 抓拍间隔（分钟），capture 由 LIVE_INTERVAL_MINUTES 写入；旧数据缺省 3 */
  intervalMinutes: number;
  /** 归档/回收站保留天数，capture 由 LIVE_KEEP_DAYS 写入；旧数据缺省 30 */
  keepDays: number;
}

/** 抓拍数据目录：本地 dev 默认 ./data/live，容器内由 LIVE_DATA_DIR 指向 /data/live */
export function liveDataDir(): string {
  return path.resolve(process.env.LIVE_DATA_DIR ?? './data/live');
}

/** 读取最近一次抓拍的元信息；还没抓过（首次部署）返回 null，页面走空态 */
export function readLiveMeta(): LiveMeta | null {
  try {
    const raw: unknown = JSON.parse(readFileSync(path.join(liveDataDir(), 'latest.json'), 'utf8'));
    if (typeof raw !== 'object' || raw === null) return null;
    const meta = raw as Record<string, unknown>;
    if (typeof meta.capturedAt !== 'string') return null;
    return {
      capturedAt: meta.capturedAt,
      file: typeof meta.file === 'string' ? meta.file : '',
      bytes: typeof meta.bytes === 'number' ? meta.bytes : 0,
      width: typeof meta.width === 'number' ? meta.width : 1280,
      height: typeof meta.height === 'number' ? meta.height : 720,
      intervalMinutes: typeof meta.intervalMinutes === 'number' ? meta.intervalMinutes : 3,
      keepDays: typeof meta.keepDays === 'number' ? meta.keepDays : 30,
    };
  } catch {
    return null;
  }
}

const ARCHIVE_JPG_RE = /^\d{8}-\d{6}\.jpg$/;

/** archive 目录下的文件名（过滤非归档文件并排序）；目录不存在/不可读返回空数组 */
function readArchiveFiles(): string[] {
  try {
    return readdirSync(path.join(liveDataDir(), 'archive')).filter((f) => ARCHIVE_JPG_RE.test(f));
  } catch {
    // 30 天滚动清理可能让目录短暂消失，按空处理
    return [];
  }
}

/** archive 里有哪些天：按天分组计数，最新在前 */
export function listArchiveDays(): { day: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const file of readArchiveFiles()) {
    const day = file.slice(0, 8);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => (a.day < b.day ? 1 : -1));
}

/** 某天的归档按小时分组：小时组与组内文件均按时间正序；day 不合法返回空数组 */
export function listArchiveDay(day: string): { hour: string; files: string[] }[] {
  if (!/^\d{8}$/.test(day)) return [];
  const grouped = new Map<string, string[]>();
  for (const file of readArchiveFiles().sort()) {
    if (file.slice(0, 8) !== day) continue;
    const hour = file.slice(9, 11);
    const list = grouped.get(hour);
    if (list) list.push(file);
    else grouped.set(hour, [file]);
  }
  return [...grouped.entries()].map(([hour, files]) => ({ hour, files }));
}

// ─── 相似分组索引（capture 侧 dHash 写入，见 scripts/lib/live-similar.mjs） ───

interface ArchiveIndexEntry {
  file: string;
  group: number;
}

interface ArchiveIndex {
  days: Record<string, ArchiveIndexEntry[]>;
}

/** 读取相似分组索引；缺失/损坏返回 null（调用方退化为无折叠） */
function readArchiveIndex(): ArchiveIndex | null {
  try {
    const raw: unknown = JSON.parse(
      readFileSync(path.join(liveDataDir(), 'archive-index.json'), 'utf8'),
    );
    if (typeof raw !== 'object' || raw === null) return null;
    const days = (raw as Record<string, unknown>).days;
    if (typeof days !== 'object' || days === null) return null;
    return raw as ArchiveIndex;
  } catch {
    return null;
  }
}

export interface AdminGroup {
  /** 组内文件（base 名，无 .jpg，时间正序）；无 index 记录的单张自成一组 */
  files: string[];
}

export interface AdminDaySummary {
  day: string;
  /** 原始张数 */
  count: number;
  /** 折叠后组数 */
  groupCount: number;
}

/** 某天的归档按相似组折叠：组按时间正序；day 不合法返回空数组 */
export function listAdminDay(day: string): AdminGroup[] {
  if (!/^\d{8}$/.test(day)) return [];
  const files = readArchiveFiles()
    .filter((f) => f.startsWith(day))
    .sort();
  const index = readArchiveIndex();
  const groupOf = new Map<string, number>();
  for (const entry of index?.days?.[day] ?? []) {
    groupOf.set(entry.file.replace(/\.jpg$/, ''), entry.group);
  }
  const groups = new Map<number, string[]>();
  let fallbackGroup = -1;
  for (const file of files) {
    const base = file.replace(/\.jpg$/, '');
    const group = groupOf.get(base) ?? fallbackGroup--;
    const list = groups.get(group);
    if (list) list.push(base);
    else groups.set(group, [base]);
  }
  return [...groups.values()].map((groupFiles) => ({ files: groupFiles }));
}

/** 后台存档的天列表：按天汇总原始张数与折叠后组数，最新在前 */
export function listAdminDays(): AdminDaySummary[] {
  const index = readArchiveIndex();
  const byDay = new Map<string, { count: number; groups: Set<number> }>();
  let fallback = -1;
  for (const file of readArchiveFiles()) {
    const day = file.slice(0, 8);
    const base = file.replace(/\.jpg$/, '');
    const entry = byDay.get(day) ?? { count: 0, groups: new Set<number>() };
    entry.count += 1;
    const group = index?.days?.[day]?.find((e) => e.file.replace(/\.jpg$/, '') === base)?.group;
    entry.groups.add(group ?? fallback--);
    byDay.set(day, entry);
  }
  return [...byDay.entries()]
    .map(([day, { count, groups }]) => ({ day, count, groupCount: groups.size }))
    .sort((a, b) => (a.day < b.day ? 1 : -1));
}

// ─── 精选（featured） ───

export interface FeaturedEntry {
  /** base 名（无 .jpg） */
  file: string;
  pickedAt: string;
  /** null = 在轮播中；非 null = 在回收站（ISO 时间） */
  removedAt: string | null;
}

function featuredPath(): string {
  return path.join(liveDataDir(), 'featured.json');
}

/** 读取精选清单；缺失/损坏返回空数组 */
export function readFeatured(): FeaturedEntry[] {
  try {
    const raw: unknown = JSON.parse(readFileSync(featuredPath(), 'utf8'));
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (e): e is FeaturedEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as FeaturedEntry).file === 'string' &&
        typeof (e as FeaturedEntry).pickedAt === 'string',
    );
  } catch {
    return [];
  }
}

/** 原子写精选清单（tmp + rename） */
export function writeFeatured(entries: FeaturedEntry[]): void {
  const tmp = `${featuredPath()}.tmp`;
  writeFileSync(tmp, JSON.stringify(entries, null, 2));
  renameSync(tmp, featuredPath());
}

/** 公开轮播用的已入选图（removedAt 为空、入选时间倒序） */
export function listActiveFeatured(): FeaturedEntry[] {
  return readFeatured()
    .filter((e) => e.removedAt === null)
    .sort((a, b) => (a.pickedAt < b.pickedAt ? 1 : -1));
}
