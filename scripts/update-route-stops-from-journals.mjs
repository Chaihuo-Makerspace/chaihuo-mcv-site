#!/usr/bin/env node
// Flips already-planned route stops (visited: false) to visited: true once a
// synced Yuque journal confirms the vehicle reached that city. Pure text edit
// on frontmatter — journal city ids already match stop ids via inferCityId
// in scripts/lib/yuque-journal-sync.mjs, so this
// needs no GPS/tracker credentials, unlike scripts/check-arrival.mjs (which
// only handles discovering brand-new cities not yet in the stops list).
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return { block: match[1], startIndex: match.index, endIndex: match.index + match[0].length };
}

function readField(block, field) {
  const match = block.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim() ?? null;
}

function applyArrival(text, dotDate) {
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

  return (
    text.slice(0, frontmatter.startIndex) + `---\n${block}\n---` + text.slice(frontmatter.endIndex)
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
  for (const file of stopFiles) {
    const filePath = join(stopsDir, file);
    const text = readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(text);
    if (!frontmatter) continue;

    const id = readField(frontmatter.block, 'id');
    const arrivalDate = id ? arrivalByCity.get(id) : null;
    if (!arrivalDate) continue;

    const dotDate = toDotDate(arrivalDate);
    const nextText = applyArrival(text, dotDate);
    if (!nextText) continue;

    writeFileSync(filePath, nextText);
    log(`${id}: visited false -> true, event.date = ${dotDate} (${file})`);
    changedCount += 1;

    const enFile = file.replace(/\.md$/, '.en.md');
    const enPath = join(stopsDir, enFile);
    if (existsSync(enPath)) {
      const enText = readFileSync(enPath, 'utf8');
      const nextEnText = applyArrival(enText, dotDate);
      if (nextEnText) {
        writeFileSync(enPath, nextEnText);
        log(`${id}: mirrored to ${enFile}`);
      }
    }
  }

  log(
    changedCount > 0
      ? `Updated ${changedCount} stop(s).`
      : 'No planned stops matched new journals.',
  );
}

main();
