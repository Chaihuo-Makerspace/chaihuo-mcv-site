#!/usr/bin/env node
// 基地车摄像头定时抓拍 worker。
//   node scripts/live-capture-loop.mjs --once   单次抓拍（本地验证 / 手动触发）
//   node scripts/live-capture-loop.mjs          每 LIVE_INTERVAL_MINUTES（默认 3）分钟一轮
// 车辆熄火时摄像头离线，离线轮安静跳过，不算失败。
import { captureOnce, loadConfig, log } from './lib/live-capture.mjs';

const once = process.argv.slice(2).includes('--once');
const intervalMinutes = Number(process.env.LIVE_INTERVAL_MINUTES ?? 3);
if (!Number.isFinite(intervalMinutes) || intervalMinutes < 1) {
  console.error('[live-capture] LIVE_INTERVAL_MINUTES 必须是 >= 1 的数字');
  process.exit(1);
}

let config;
try {
  config = loadConfig();
} catch (error) {
  if (once) {
    console.error(`[live-capture] ${error.message}`);
    process.exit(1);
  }
  // 常驻模式：缺凭证不退出（避免容器崩溃循环拖垮 compose 部署），
  // 挂起等待；配置好凭证后 docker compose up -d 重建容器即生效。
  console.error(`[live-capture] ${error.message} —— capture 挂起等待配置，web 不受影响`);
  setInterval(() => {}, 2_147_483_647);
  await new Promise(() => {});
}

async function runRound() {
  try {
    await captureOnce(config);
  } catch (error) {
    console.error(`[live-capture] 本轮抓拍失败：${error.message}`);
  }
}

if (once) {
  await runRound();
} else {
  log(`启动，每 ${intervalMinutes} 分钟抓拍一轮，数据目录 ${config.dataDir}`);
  await runRound();
  setInterval(runRound, intervalMinutes * 60 * 1000);
}
