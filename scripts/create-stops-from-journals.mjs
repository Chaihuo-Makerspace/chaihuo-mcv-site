#!/usr/bin/env node
// Creates brand-new route stops from synced Yuque journals for cities NOT in
// the planned stops list (e.g. 长春、哈尔滨 on the northeast detour).
//
// Runs AFTER scripts/update-route-stops-from-journals.mjs in the
// sync-yuque-journals workflow. That script only flips *planned* stops to
// visited; this one handles genuinely new destinations:
//
//   1. extract destination from the journal title
//      - "A→B" chain → B (destination), last token wins
//      - no arrow → first place token after the date, but ONLY auto-created
//        when it resolves unambiguously to a real city (city table / Photon)
//   2. known cities (stop labels / alias table) are skipped — the existing
//      pipeline already owns them
//   3. resolve coordinates: built-in city table (src/data/city-coordinates.json)
//      first, Photon (free, no key, China-OK) as fallback
//   4. if the resolved point is within 100 km of an existing stop, skip
//      (same place — the sync's nearest-stop folding already covers it)
//   5. otherwise create stop files (reusing check-arrival's buildStopFiles
//      template), fill the visited province, and sediment the city into the
//      alias table so future runs are idempotent
//
// Everything unresolved (low confidence / no coordinates) goes to a pending
// list printed at the end — never auto-created.
//
// Dry-run by default; pass --apply to write files (workflow uses --apply).

import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const stopsDir = join(ROOT, 'src/content/stops');
const journalsPath = join(ROOT, 'src/data/yuque-journals.json');
const aliasesPath = join(ROOT, 'scripts/location-city-aliases.json');
const cityCoordsPath = join(ROOT, 'src/data/city-coordinates.json');
const geocodeCachePath = join(ROOT, 'src/data/geocode-cache.json');
const visitedProvincesPath = join(ROOT, 'src/features/route-map/visited-provinces.ts');

const PHOTON_URL = 'https://photon.komoot.io/api/';
const NEAR_KM = 100; // same threshold as the sync's nearest-stop folding

const shouldApply = process.argv.includes('--apply');

function log(message) {
  console.log(`[create-stops] ${message}`);
}

// One-line summary for the workflow's commit message, e.g. "新站点 哈尔滨、长春 已自动建站".
function emitGithubOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${String(value).replace(/[\r\n]+/g, ' ')}\n`);
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readStops() {
  const stops = [];
  for (const file of readdirSync(stopsDir)) {
    if (!file.endsWith('.md') || file.includes('.en.')) continue;
    const text = readFileSync(join(stopsDir, file), 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const get = (key) => fm[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
    const id = get('id');
    const label = get('label');
    const order = Number(get('order') ?? 0);
    const lng = Number(get('lng'));
    const lat = Number(get('lat'));
    const province = get('province');
    if (id && label) stops.push({ id, label, order, lng, lat, province });
  }
  return stops;
}

function readAliases() {
  const data = readJson(aliasesPath);
  if (!data) return {};
  const out = {};
  for (const [name, entry] of Object.entries(data)) {
    if (name === '_meta') continue;
    out[name] = entry;
  }
  return out;
}

// 归一化：去省市县等行政后缀，用于查表与去重
function normalizeCityName(name) {
  return String(name ?? '')
    .trim()
    .replace(/(自治州|自治县|地区|盟|省|市|县|区|旗)$/u, '');
}

// 标题 → 到达城市候选。返回 { name, highConfidence }：
//  "A→B" 链的 B 端是结构化高置信，唯一允许自动建站的路径；
//  无箭头时取日期后首个地名 token——一律进待确认清单，不自动建站
//  （行为比方案更保守：宁可人工看一眼，也不猜）。
function extractDestination(title) {
  const chain = title.match(/[一-鿿]{2,}(?:\s*→\s*[一-鿿]{2,})+/);
  if (chain) {
    const tokens = chain[0].split(/\s*→\s*/);
    return { name: tokens[tokens.length - 1], highConfidence: true };
  }
  // 无箭头：形如 "基地车日记|2026.0812 赤峰：..." → 取「：」前的最后一个 token
  const beforeColon = title.split(/[:：]/)[0];
  const seg = beforeColon.split(/[|｜\s]+/).filter(Boolean);
  const candidate = seg[seg.length - 1] ?? '';
  // 至少 2 个汉字且不完全是日期/数字
  if (!/^[\u4e00-\u9fff]{2,}$/.test(candidate)) return { name: null, highConfidence: false };
  return { name: candidate, highConfidence: false };
}

function tableLookup(name, table) {
  const metaKey = '_meta';
  const direct = table[name];
  if (direct && direct !== metaKey) return direct;
  // 全称/简称互换再试（如 "哈尔滨市" vs "哈尔滨"）
  for (const [key, entry] of Object.entries(table)) {
    if (key === metaKey) continue;
    if (entry && normalizeCityName(key) === normalizeCityName(name)) return entry;
  }
  return null;
}

async function geocodePhoton(name, cache) {
  if (name in cache) return cache[name];
  try {
    const url = new URL(PHOTON_URL);
    url.searchParams.set('q', name);
    url.searchParams.set('limit', '5');
    url.searchParams.set('bbox', '73,18,135,53');
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'ChaihuoMCV/1.0 create-stops' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const points = (data?.features ?? [])
      .filter((item) => item.properties?.countrycode === 'CN' && item.geometry?.coordinates)
      .map((item) => ({
        lng: Number(item.geometry.coordinates[0]),
        lat: Number(item.geometry.coordinates[1]),
        name: item.properties?.name ?? '',
        state: item.properties?.state ?? '',
      }));
    cache[name] = points.length > 0 ? points : null;
  } catch (error) {
    console.warn(`Photon geocode failed for "${name}": ${error.message}`);
    cache[name] = null;
  }
  return cache[name];
}

// Photon lang=en 取城市英文名（仅新站创建时调用一次，失败回退中文）。
// 坐标表只有中文名，而 en 页需要英文城市名（中英对等 invariant）。
async function geocodeNameEn(name) {
  try {
    const url = new URL(PHOTON_URL);
    url.searchParams.set('q', name);
    url.searchParams.set('limit', '1');
    url.searchParams.set('lang', 'en');
    url.searchParams.set('bbox', '73,18,135,53');
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'ChaihuoMCV/1.0 create-stops' },
    });
    if (!res.ok) return '';
    const data = await res.json();
    const feature = data?.features?.[0];
    if (feature?.properties?.countrycode === 'CN' && feature.properties?.name) {
      return feature.properties.name;
    }
    return '';
  } catch {
    return '';
  }
}

// 低置信候选必须「唯一定位」：Photon 中国候选恰有 1 个且名字可核对，才算高置信。
async function resolvePoint(name, { table, cache }) {
  const hit = tableLookup(name, table);
  if (hit) {
    // 坐标表命中即高置信（权威本地数据）；英文名从 Photon lang=en 补，失败回退中文
    const labelEn = hit.name_en ?? (await geocodeNameEn(name));
    return {
      lng: hit.lng,
      lat: hit.lat,
      province: hit.province,
      adcode: hit.adcode,
      labelEn,
      source: 'table',
    };
  }
  const points = await geocodePhoton(name, cache);
  if (!points || points.length === 0) return null;
  if (points.length > 1) return null; // 歧义 → 待确认，不自动
  const p = points[0];
  return {
    lng: p.lng,
    lat: p.lat,
    province: p.state ?? '',
    adcode: null,
    labelEn: p.name ?? '',
    source: 'photon',
  };
}

function nearestStopKm(lng, lat, stops) {
  let best = Infinity;
  for (const s of stops) {
    if (!Number.isFinite(s.lng) || !Number.isFinite(s.lat)) continue;
    const km = haversineKm(lng, lat, s.lng, s.lat);
    if (km < best) best = km;
  }
  return best;
}

function haversineKm(lng1, lat1, lng2, lat2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toDotDate(isoDate) {
  return isoDate.replaceAll('-', '.');
}

function buildStopFiles({ order, id, label, labelEn, province, lng, lat, date }) {
  const enLabel = labelEn || label;
  const frontmatter = `---\nid: ${id}\norder: ${order}\nvisited: true\nlabel: ${label}\n${labelEn ? `label_en: ${labelEn}\n` : ''}province: ${province}\nlng: ${lng}\nlat: ${lat}\naltitude: "0"\nrelationType: community\nthemes:\n  - maker\nevent:\n  date: "${date}"\n---`;
  const zh = `${frontmatter}\n\n# ${label}\n\n## 在地遥测\n\n- 地形: 待补充\n- 阶梯: 待补充\n- 气候: 待补充\n- 极境挑战: 待补充\n\n## 在地共创\n\n- 待补充\n\n## 现场记\n\n基地车已抵达${label}，路线图已自动记录该城市节点。详细现场记录待补充。\n\n## 远征日志\n\n### 新世界\n\n待补充\n\n### 火种\n\n待补充\n\n### 越界\n\n待补充\n`;
  const en = `# ${enLabel}\n\n## Telemetry\n\n- Terrain: To be updated\n- Step: To be updated\n- Climate: To be updated\n- Challenge: To be updated\n\n## Activities\n\n- To be updated\n\n## Event\n\nThe mobile lab arrived in ${enLabel}. The detailed field note will be updated later.\n\n## Expedition Log\n\n### World\n\nTo be updated\n\n### Fire\n\nTo be updated\n\n### Frontier\n\nTo be updated\n`;
  return { zh, en };
}

function addProvinceIfNeeded(province) {
  if (!province) return false;
  const text = readFileSync(visitedProvincesPath, 'utf8');
  if (text.includes(`'${province}'`)) return false;
  const updated = text.replace(/\n\];\s*$/u, `\n  '${province}',\n];\n`);
  if (shouldApply) writeFileSync(visitedProvincesPath, updated);
  return true;
}

function slugifyId(adcode, name) {
  if (adcode) return `city-${adcode}`;
  const slug = name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `city-${slug}` : null;
}

async function main() {
  const journalsData = readJson(journalsPath);
  if (!journalsData?.journals) {
    log('No journals data found; nothing to do.');
    return;
  }
  const journals = journalsData.journals;
  const stops = readStops();
  const aliases = readAliases();
  const table = readJson(cityCoordsPath) ?? {};
  const cache = readJson(geocodeCachePath) ?? {};

  const known = new Set();
  for (const s of stops) known.add(s.label);
  for (const a of Object.keys(aliases)) known.add(a);
  // 别名里的 id 也视为已知（如 长春 已被登记过就不再建）
  for (const a of Object.values(aliases)) if (a?.id) known.add(a.id);

  const maxOrder = stops.reduce((m, s) => Math.max(m, s.order), 0);
  const visited = new Set();
  const created = [];
  const pending = [];

  for (const journal of journals) {
    if (!journal?.title || !journal.date) continue;
    const { name, highConfidence } = extractDestination(journal.title);
    if (!name) continue;
    const normalized = normalizeCityName(name);
    if (!normalized || known.has(normalized)) continue;
    if (visited.has(normalized)) continue; // 同一 run 内去重

    const point = await resolvePoint(normalized, { table, cache });
    if (!point) {
      if (!highConfidence) continue; // 低置信又解析失败 → 静默跳过（可能不是城市）
      pending.push({ city: name, journal: journal.title, reason: '无法定位坐标' });
      continue;
    }
    // 离已有站点 <100km → 同地不同名，交给现有就近归并，不重复建站
    const nearestKm = nearestStopKm(point.lng, point.lat, stops);
    if (nearestKm < NEAR_KM) {
      visited.add(normalized);
      log(`Skip "${normalized}" — within ${nearestKm.toFixed(0)}km of existing stops`);
      continue;
    }
    if (!highConfidence) {
      pending.push({ city: name, journal: journal.title, reason: '低置信且非表格唯一命中' });
      continue;
    }

    visited.add(normalized);
    const order = maxOrder + created.length + 1;
    const id = slugifyId(point.adcode, normalized);
    if (!id) {
      pending.push({ city: name, journal: journal.title, reason: '无法生成稳定 id' });
      continue;
    }
    const date = toDotDate(journal.date);
    created.push({
      order,
      id,
      label: normalized,
      labelEn: point.labelEn,
      province: point.province,
      lng: point.lng,
      lat: point.lat,
      date,
    });
  }

  // 写文件
  for (const stop of created) {
    const pad = String(stop.order).padStart(2, '0');
    const zhPath = join(stopsDir, `${pad}-${stop.id}.md`);
    const enPath = join(stopsDir, `${pad}-${stop.id}.en.md`);
    if (existsSync(zhPath) || existsSync(enPath)) {
      log(`Skip write ${pad}-${stop.id} — file already exists`);
      continue;
    }
    const files = buildStopFiles(stop);
    if (shouldApply) {
      writeFileSync(zhPath, files.zh);
      writeFileSync(enPath, files.en);
    }
    log(`${shouldApply ? 'Created' : 'Would create'} ${pad}-${stop.id}.md (${stop.label})`);
  }

  // 省份点亮
  for (const stop of created) {
    if (addProvinceIfNeeded(stop.province)) {
      log(`${shouldApply ? 'Filled' : 'Would fill'} province ${stop.province}`);
    }
  }

  // 别名沉淀（幂等）
  if (created.length > 0 && shouldApply) {
    const aliasesFile = readJson(aliasesPath) ?? {};
    let changed = false;
    for (const stop of created) {
      if (aliasesFile[stop.label]) continue;
      aliasesFile[stop.label] = {
        id: stop.id,
        label: stop.label,
        label_en: stop.labelEn || stop.label,
        province: stop.province,
      };
      changed = true;
    }
    if (changed) writeFileSync(aliasesPath, `${JSON.stringify(aliasesFile, null, 2)}\n`);
  }

  // 缓存落盘（含 null 结果）
  if (shouldApply && Object.keys(cache).length > 0) {
    writeFileSync(geocodeCachePath, `${JSON.stringify(cache, null, 2)}\n`);
  }

  // 摘要输出（workflow commit message 复用）
  if (created.length > 0) {
    log(`SUMMARY: 新站点 ${created.map((s) => s.label).join('、')} 已自动建站`);
    emitGithubOutput('summary', `新站点 ${created.map((s) => s.label).join('、')} 已自动建站`);
  }
  if (pending.length > 0) {
    console.log('\n[create-stops] PENDING（待人工确认，未自动建站）:');
    for (const p of pending) {
      console.log(`  - ${p.city} | ${p.reason} | ${p.journal}`);
    }
  }
}

main().catch((error) => {
  console.error(`[create-stops] Fatal: ${error.message}`);
  process.exit(1);
});
