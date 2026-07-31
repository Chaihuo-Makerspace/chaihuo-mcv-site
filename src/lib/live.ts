import { readFileSync } from 'node:fs';
import path from 'node:path';

export interface LiveMeta {
  capturedAt: string;
  file: string;
  bytes: number;
  width: number;
  height: number;
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
    };
  } catch {
    return null;
  }
}
