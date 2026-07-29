#!/usr/bin/env node
// Grader for update-route-stop evals.
// Usage: node grade.mjs <eval-dir> <with_skill|without_skill>
// Writes <eval-dir>/<run>/grading.json
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [evalDir, run] = process.argv.slice(2);
const repo = path.join(evalDir, run, 'repo');
const meta = JSON.parse(fs.readFileSync(path.join(evalDir, 'eval_metadata.json'), 'utf8'));

const results = meta.assertions.map((text) => ({ text, passed: false, evidence: 'not checked' }));
const set = (i, passed, evidence) => { results[i] = { text: results[i].text, passed, evidence }; };

const p = (rel) => path.join(repo, rel);
const exists = (rel) => fs.existsSync(p(rel));
const read = (rel) => fs.readFileSync(p(rel), 'utf8');

const stopsDir = p('src/content/stops');
const stopFiles = fs.existsSync(stopsDir) ? fs.readdirSync(stopsDir).filter((f) => /^\d+-.+\.md$/.test(f) && !f.endsWith('.en.md')) : [];

const frontmatter = (rel) => {
  const txt = read(rel);
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  return { fm: m ? m[1] : '', body: m ? txt.slice(m[0].length) : txt };
};
const fmVal = (fm, key) => fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '');
const h1 = (body) => body.match(/^#\s+(.+)$/m)?.[1]?.trim();

const checkStopPair = (nn, id, expectedOrder, labelZh, labelEn) => {
  const zhRel = `src/content/stops/${nn}-${id}.md`;
  const enRel = `src/content/stops/${nn}-${id}.en.md`;
  if (!exists(zhRel) || !exists(enRel)) return { ok: false, ev: `missing ${zhRel} or ${enRel}` };
  const zh = frontmatter(zhRel);
  const en = frontmatter(enRel);
  const problems = [];
  if (fmVal(zh.fm, 'order') !== String(expectedOrder)) problems.push(`order=${fmVal(zh.fm, 'order')}`);
  if (fmVal(zh.fm, 'visited') !== 'true') problems.push('visited!=true');
  if (!fmVal(zh.fm, 'lng') || !fmVal(zh.fm, 'lat')) problems.push('missing lng/lat');
  if (h1(zh.body) !== fmVal(zh.fm, 'label')) problems.push(`zh H1 '${h1(zh.body)}' != label '${fmVal(zh.fm, 'label')}'`);
  if (h1(en.body) !== labelEn) problems.push(`en H1 '${h1(en.body)}' != '${labelEn}'`);
  return { ok: problems.length === 0, ev: problems.join('; ') || `${nn}-${id} pair OK` };
};

const contiguity = () => {
  const nums = stopFiles.map((f) => Number(f.split('-')[0])).sort((a, b) => a - b);
  const problems = [];
  nums.forEach((n, i) => { if (n !== i) problems.push(`index ${i} has ${n}`); });
  for (const f of stopFiles) {
    const nn = f.split('-')[0];
    const { fm } = frontmatter(`src/content/stops/${f}`);
    const order = fmVal(fm, 'order');
    const id = fmVal(fm, 'id');
    if (Number(nn) !== Number(order)) problems.push(`${f}: filename ${nn} != order ${order}`);
    if (f !== `${String(Number(order)).padStart(2, '0')}-${id}.md`) problems.push(`${f}: filename != NN-id`);
  }
  return { ok: problems.length === 0, ev: problems.join('; ') || `orders contiguous 0..${nums[nums.length - 1]} (${nums.length} stops)` };
};

const countCopyConsistency = () => {
  try {
    const routeTs = read('src/i18n/route.ts');
    const zh = routeTs.match(/(\d+)\s*省\s*(\d+)\s*城/);
    const en = routeTs.match(/(\d+)\s*provinces?\s*and\s*(\d+)\s*cities/i);
    const home = read('src/app/components/HomeContent.tsx');
    const hc = home.match(/(\d+)\s*省\s*(\d+)\s*城/);
    if (!zh || !en || !hc) return { ok: false, ev: `missing copy: zh=${!!zh} en=${!!en} home=${!!hc}` };
    const realStops = stopFiles.filter((f) => {
      const { fm } = frontmatter(`src/content/stops/${f}`);
      return !/^routeOnly:\s*true/m.test(fm) && !f.includes('-return');
    }).length;
    const consistent = zh[1] === en[1] && zh[2] === en[2] && zh[1] === hc[1] && zh[2] === hc[2];
    const cityMatches = Number(zh[2]) === realStops;
    return {
      ok: consistent && cityMatches,
      ev: `copy=${zh[1]}省${zh[2]}城 (en ${en[1]}/${en[2]}, home ${hc[1]}/${hc[2]}), actual non-routeOnly stops=${realStops}`,
    };
  } catch (e) { return { ok: false, ev: String(e).slice(0, 200) }; }
};

const runValidate = () => {
  try {
    execFileSync('node', ['scripts/validate-site.mjs'], { cwd: repo, encoding: 'utf8', stdio: 'pipe' });
    return { ok: true, out: '' };
  } catch (e) {
    return { ok: false, out: `${e.stdout || ''}${e.stderr || ''}`.slice(0, 800) };
  }
};

if (meta.eval_name === 'new-arrival-zhengzhou') {
  const r0 = checkStopPair('38', 'zhengzhou', 38, '郑州', 'Zhengzhou');
  set(0, r0.ok, r0.ev);
  const vp = read('src/features/route-map/visited-provinces.ts');
  set(1, vp.includes('河南省'), vp.includes('河南省') ? '河南省 present' : '河南省 missing');
  const legs = read('src/features/route-map/route-legs.ts');
  const hasHenan = /河南省:\s*\{[^}]*豫[^}]*Henan[^}]*\}/s.test(legs) || /河南省['"]?\s*:\s*\{[^}]*\}/s.test(legs) && legs.includes('豫');
  set(2, hasHenan, hasHenan ? 'PROVINCE_SHORT has 河南省 entry' : 'no 河南省 entry in PROVINCE_SHORT');
  const cc = countCopyConsistency();
  set(3, cc.ok, cc.ev);
  const aliases = JSON.parse(read('scripts/location-city-aliases.json'));
  const flat = JSON.stringify(aliases);
  set(4, flat.includes('郑州') && flat.includes('zhengzhou'), flat.includes('zhengzhou') ? 'alias present' : 'no 郑州 alias');
  const v = runValidate();
  set(5, v.ok, v.ok ? 'validate-site passed' : v.out);
} else {
  const r0 = checkStopPair('37', 'baoji', 37, '宝鸡', 'Baoji');
  set(0, r0.ok, r0.ev);
  const xianOk = exists('src/content/stops/38-xian.md') && exists('src/content/stops/38-xian.en.md') && !exists('src/content/stops/37-xian.md');
  const xOrder = xianOk ? fmVal(frontmatter('src/content/stops/38-xian.md').fm, 'order') : null;
  const cont = contiguity();
  set(1, xianOk && xOrder === '38' && cont.ok, `xian renamed=${xianOk} order=${xOrder}; ${cont.ev}`);
  const vp = read('src/features/route-map/visited-provinces.ts');
  const shaanxiCount = (vp.match(/陕西省/g) || []).length;
  set(2, shaanxiCount === 1, `陕西省 appears ${shaanxiCount}x`);
  const cc = countCopyConsistency();
  set(3, cc.ok, cc.ev);
  const v = runValidate();
  set(4, v.ok, v.ok ? 'validate-site passed' : v.out);
}

const passed = results.filter((r) => r.passed).length;
const grading = {
  eval_id: meta.eval_id,
  eval_name: meta.eval_name,
  run,
  expectations: results,
  summary: { passed, total: results.length, pass_rate: passed / results.length },
};
fs.writeFileSync(path.join(evalDir, run, 'grading.json'), JSON.stringify(grading, null, 2));
console.log(`${run}: ${passed}/${results.length} passed`);
results.forEach((r) => console.log(` ${r.passed ? 'PASS' : 'FAIL'} ${r.text}\n     ${r.evidence.split('\n')[0].slice(0, 300)}`));
