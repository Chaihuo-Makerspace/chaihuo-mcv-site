#!/usr/bin/env node
// 地图当前位置因日记同步而变化（排定站点翻成已到达，或新站点自动建成）时，
// 往「柴火基地车」飞书群发一条播报。由 sync-yuque-journals workflow 在提交
// 数据之后调用；没有变化则不运行本脚本（workflow 里用 if 挡住）。
//
// 需要的 env（全部来自 GitHub secrets / step outputs）：
//   FEISHU_APP_ID / FEISHU_APP_SECRET  飞书自建应用凭据
//   FEISHU_CHAT_ID                     目标群 chat_id
//   ARRIVAL_CITIES                     排定站点翻到的城市（顿号分隔，可空）
//   NEW_STOP_CITIES                    新建站点的城市（顿号分隔，可空）
//
// 缺凭据时打印消息内容并正常退出——播报失败不该拖垮同步主流程
// （workflow 侧也加了 continue-on-error）。

const { FEISHU_APP_ID, FEISHU_APP_SECRET, FEISHU_CHAT_ID, ARRIVAL_CITIES, NEW_STOP_CITIES } =
  process.env;

const FEISHU_ORIGIN = 'https://open.feishu.cn';
const MAP_URL = 'https://mcv.chaihuo.org/route';

function splitCities(value) {
  return String(value ?? '')
    .split(/[、,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildMessage() {
  const cities = [...new Set([...splitCities(ARRIVAL_CITIES), ...splitCities(NEW_STOP_CITIES)])];
  if (cities.length === 0) return null;
  return `📍 基地车官网地图已自动更新：基地车抵达 ${cities.join('、')}\n${MAP_URL}`;
}

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  const message = buildMessage();
  if (!message) {
    console.log('[notify-feishu] no cities to announce; skip');
    return;
  }
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_CHAT_ID) {
    console.log('[notify-feishu] credentials not configured; skip. Message would be:');
    console.log(message);
    return;
  }

  const tokenResult = await postJson(
    `${FEISHU_ORIGIN}/open-apis/auth/v3/tenant_access_token/internal`,
    {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    },
  );
  const token = tokenResult.data?.tenant_access_token;
  if (tokenResult.data?.code !== 0 || !token) {
    throw new Error(
      `tenant_access_token failed: ${tokenResult.data?.code} ${tokenResult.data?.msg}`,
    );
  }

  const sendResult = await postJson(
    `${FEISHU_ORIGIN}/open-apis/im/v1/messages?receive_id_type=chat_id`,
    {
      receive_id: FEISHU_CHAT_ID,
      msg_type: 'text',
      content: JSON.stringify({ text: message }),
    },
    { Authorization: `Bearer ${token}` },
  );
  if (sendResult.data?.code !== 0) {
    throw new Error(`send message failed: ${sendResult.data?.code} ${sendResult.data?.msg}`);
  }
  console.log(`[notify-feishu] announced: ${message.split('\n')[0]}`);
}

main().catch((error) => {
  console.error(`[notify-feishu] Fatal: ${error.message}`);
  process.exit(1);
});
