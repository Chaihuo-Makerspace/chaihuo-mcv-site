#!/usr/bin/env node
// Flips already-planned route stops (visited: false) to visited: true once a
// synced Yuque journal confirms the vehicle reached that city. Text edit on
// frontmatter plus the required body section — journal city ids already match
// stop ids via inferCityId in scripts/lib/yuque-journal-sync.mjs, so this
// needs no GPS/tracker credentials, unlike scripts/check-arrival.mjs (which
// only handles discovering brand-new cities not yet in the stops list).
//
// The validator requires a stop with frontmatter `event` to carry a
// "## 现场记" body section, so flipping visited without adding one breaks
// `pnpm check` on main (and the Docker build). The filler sentences below
// match FILLER_RE / PLACEHOLDER_RE in src/features/route-map/stops-loader.ts
// and are scrubbed at load — no placeholder text reaches the UI.
import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const stopsDir = join(ROOT, 'src/content/stops');
const journalsPath = join(ROOT, 'src/data/yuque-journals.json');

function log(message) {
  console.log(`[update-route-stops] ${message}`);
}

function earliestArrivalByCity(journals) {
  const byCity = new Map();
  for (const journal of journals) {
    if (!journal.city || journal.city === 'yuque' || !journal.date) continue;
    const current = byCity.get(journal.city);
    if (!current || journal.date < current) byCity.set(journal.city, journal.date);
  }
  return byCity;
}

// inferCityId (scripts/lib/yuque-journal-sync.mjs) now derives stop primary
// names from the stops collection automatically, so journals for planned
// stops normally arrive with their real city id. This fallback remains as a
// safety net for anything that still lands as city: "yuque" (e.g. a title
// that names a place the keyword tables don't know): match the journal title
// against unvisited stops' labels directly.
function fillUnmatchedFromPlannedLabels(journals, plannedStops, byCity) {
  for (const stop of plannedStops) {
    if (byCity.has(stop.id)) continue;
    for (const journal of journals) {
      if (journal.city !== 'yuque' || !journal.date || !journal.title?.includes(stop.label)) {
        continue;
      }
      const current = byCity.get(stop.id);
      if (!current || journal.date < current) byCity.set(stop.id, journal.date);
    }
  }
}

function toDotDate(isoDate) {
  return isoDate.replaceAll('-', '.');
}

// Canonical section order is 遥测 → 共创 → 现场记 → 远征日志 → 照片
// (en: Telemetry → Activities → Event → Expedition Log → Photos), so the
// event section must land before any expedition/photos section, not at EOF.
const EVENT_SECTIONS = {
  zh: { heading: '## 现场记', after: ['## 远征日志', '## 照片'] },
  en: { heading: '## Event', after: ['## Expedition Log', '## Photos'] },
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureEventSection(text, locale, sentence) {
  const { heading, after } = EVENT_SECTIONS[locale];
  if (new RegExp(`^${escapeRegExp(heading)}\\s*$`, 'm').test(text)) return text;

  const section = `${heading}\n\n${sentence}\n`;
  const insertAt = after
    .map((h) => text.indexOf(`\n${h}\n`))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];

  if (insertAt === undefined) return `${text.trimEnd()}\n\n${section}`;
  return `${text.slice(0, insertAt)}\n\n${section}${text.slice(insertAt + 1)}`;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return { block: match[1], startIndex: match.index, endIndex: match.index + match[0].length };
}

function readField(block, field) {
  const match = block.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim() ?? null;
}

function applyArrival(text, dotDate, label) {
  const frontmatter = parseFrontmatter(text);
  if (!frontmatter) return null;

  let block = frontmatter.block;
  if (!/^visited:\s*false\s*$/m.test(block)) return null;
  block = block.replace(/^visited:\s*false\s*$/m, 'visited: true');

  if (!/^event:/m.test(block)) {
    block = `${block}\nevent:\n  date: "${dotDate}"`;
  } else if (!/^\s+date:/m.test(block.split(/^event:/m)[1] ?? '')) {
    block = block.replace(/^event:\s*$/m, `event:\n  date: "${dotDate}"`);
  }

  const nextText =
    text.slice(0, frontmatter.startIndex) + `---\n${block}\n---` + text.slice(frontmatter.endIndex);
  return ensureEventSection(
    nextText,
    'zh',
    `基地车已抵达${label}，路线图记录该城市节点。详细现场记录待补充。`,
  );
}

function main() {
  if (!existsSync(journalsPath)) {
    log(`No ${journalsPath} found. Nothing to do.`);
    return;
  }

  const { journals } = JSON.parse(readFileSync(journalsPath, 'utf8'));
  const arrivalByCity = earliestArrivalByCity(journals ?? []);

  const stopFiles = readdirSync(stopsDir).filter(
    (file) => file.endsWith('.md') && !file.startsWith('_') && !file.endsWith('.en.md'),
  );

  const plannedStops = [];
  for (const file of stopFiles) {
    const block = parseFrontmatter(readFileSync(join(stopsDir, file), 'utf8'))?.block;
    if (!block) continue;
    if (!/^visited:\s*false\s*$/m.test(block)) continue;
    const id = readField(block, 'id');
    const label = readField(block, 'label');
    if (id && label) plannedStops.push({ id, label });
  }
  fillUnmatchedFromPlannedLabels(journals ?? [], plannedStops, arrivalByCity);

  let changedCount = 0;
  const changedLabels = [];
  for (const file of stopFiles) {
    const filePath = join(stopsDir, file);
    const text = readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(text);
    if (!frontmatter) continue;

    const id = readField(frontmatter.block, 'id');
    const arrivalDate = id ? arrivalByCity.get(id) : null;
    if (!arrivalDate) continue;

    const label = readField(frontmatter.block, 'label') ?? id;
    const dotDate = toDotDate(arrivalDate);
    const nextText = applyArrival(text, dotDate, label);
    if (!nextText) continue;

    writeFileSync(filePath, nextText);
    log(`${id}: visited false -> true, event.date = ${dotDate} (${file})`);
    changedCount += 1;
    changedLabels.push(label);

    const enFile = file.replace(/\.md$/, '.en.md');
    const enPath = join(stopsDir, enFile);
    if (existsSync(enPath)) {
      // .en.md files carry no frontmatter — only mirror the body section.
      const labelEn = readField(frontmatter.block, 'label_en') ?? label;
      const enText = readFileSync(enPath, 'utf8');
      const nextEnText = ensureEventSection(
        enText,
        'en',
        `The mobile lab has arrived in ${labelEn}, and the route map now records this city stop. The detailed field note will be updated later.`,
      );
      if (nextEnText !== enText) {
        writeFileSync(enPath, nextEnText);
        log(`${id}: mirrored ## Event to ${enFile}`);
      }
    }
  }

  log(
    changedCount > 0
      ? `Updated ${changedCount} stop(s).`
      : 'No planned stops matched new journals.',
  );
  if (changedLabels.length > 0)
    emitGithubOutput('summary', `基地车抵达${changedLabels.join('、')}`);
}

// One-line summary for the workflow's commit message, e.g. "基地车抵达临汾".
function emitGithubOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${String(value).replace(/[\r\n]+/g, ' ')}\n`);
}

main();
