// 一次性回填相似分组索引：对 archive 里已有但 archive-index.json 缺失的天补算 dHash 分组。
// 常驻 capture 服务启动时会自动回填，本脚本用于本地/手动场景（无需萤石凭证）。
// 用法：node scripts/backfill-live-index.mjs
import path from 'node:path';
import { backfillIndex, similarThreshold } from './lib/live-similar.mjs';

const dataDir = path.resolve(process.env.LIVE_DATA_DIR ?? './data/live');
const threshold = similarThreshold(process.env);

const days = await backfillIndex(dataDir, threshold, (msg) => console.log(`[backfill] ${msg}`));
console.log(
  days > 0
    ? `[backfill] 完成：补齐 ${days} 天的分组索引（阈值 ${threshold}）`
    : '[backfill] 索引已是最新，无需回填',
);
