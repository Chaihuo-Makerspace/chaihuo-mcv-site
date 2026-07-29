#!/usr/bin/env node
// Grader for update-team-member evals.
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

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(repo, rel), 'utf8'));
const exists = (rel) => fs.existsSync(path.join(repo, rel));

let team, boardings;
try { team = readJson('src/data/team.json'); } catch (e) { team = null; }
try { boardings = readJson('src/data/boardings.json'); } catch (e) { boardings = null; }

const imgDims = (rel) => {
  try {
    const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', path.join(repo, 'public', rel)], { encoding: 'utf8' });
    const w = Number(out.match(/pixelWidth: (\d+)/)?.[1]);
    const h = Number(out.match(/pixelHeight: (\d+)/)?.[1]);
    return { w, h };
  } catch { return null; }
};

const runValidate = () => {
  try {
    execFileSync('node', ['scripts/validate-site.mjs'], { cwd: repo, encoding: 'utf8', stdio: 'pipe' });
    return { ok: true, out: '' };
  } catch (e) {
    return { ok: false, out: `${e.stdout || ''}${e.stderr || ''}`.slice(0, 800) };
  }
};

const isLiLan = meta.eval_name === 'add-member-li-lan';
const memberId = isLiLan ? 'li-lan' : 'wang-kaiwen';
const roleZh = isLiLan ? '媒体担当' : '技术担当';

if (!team || !boardings) {
  results.forEach((_, i) => set(i, false, 'team.json or boardings.json missing/invalid JSON'));
} else {
  const m = team.find((x) => x.id === memberId);
  // assertion: entry with all _en fields + image path
  if (isLiLan) {
    const ok = !!m && ['name', 'name_en', 'bio', 'bio_en', 'role_en'].every((k) => m[k]) && m.image === '/people/li-lan.webp';
    set(0, ok, m ? JSON.stringify(m) : 'no li-lan entry');
    const peers = team.filter((x) => x.role === roleZh && x.id !== memberId && x.role_en);
    const okRole = !!m && m.role === roleZh && peers.length > 0 && m.role_en === peers[0].role_en;
    set(1, okRole, m ? `role=${m.role} role_en=${m.role_en} peers=${peers.map((p) => p.role_en).join(',')}` : 'no entry');
    const seg = boardings.find((s) => s.crewId === memberId);
    const okSeg = !!seg && seg.boardedAt?.date === '2026-07-27' && seg.boardedAt?.location === '西安' && ('disembarkedAt' in seg ? seg.disembarkedAt == null : true);
    set(2, okSeg, seg ? JSON.stringify(seg) : 'no boarding segment');
    const dims = imgDims('people/li-lan.webp');
    set(3, !!dims && dims.w === 800 && dims.h === 800, dims ? `${dims.w}x${dims.h}` : 'image missing');
    const v = runValidate();
    set(4, v.ok, v.ok ? 'validate-site passed' : v.out);
  } else {
    const b15 = boardings.find((s) => s.crewId === 'he-zhiwei');
    const okB15 = !!b15?.disembarkedAt && b15.disembarkedAt.date === '2026-07-28' && b15.disembarkedAt.location === '西安' && b15.disembarkedAt.handoffTo === 'wang-kaiwen';
    set(0, okB15, b15 ? JSON.stringify(b15.disembarkedAt) : 'no he-zhiwei segment');
    const peers = team.filter((x) => x.role === roleZh && x.id !== memberId && x.role_en);
    const okM = !!m && ['name', 'name_en', 'bio', 'bio_en'].every((k) => m[k]) && m.role === roleZh && peers.length > 0 && m.role_en === peers[0].role_en;
    set(1, okM, m ? JSON.stringify(m) : 'no wang-kaiwen entry');
    const seg = boardings.find((s) => s.crewId === memberId);
    const okSeg = !!seg && (seg.disembarkedAt === null || !('disembarkedAt' in seg));
    set(2, okSeg, seg ? JSON.stringify(seg) : 'no segment');
    const dims = imgDims('people/wang-kaiwen.webp');
    set(3, !!dims && dims.w === 800 && dims.h === 800, dims ? `${dims.w}x${dims.h}` : 'image missing');
    const v = runValidate();
    set(4, v.ok, v.ok ? 'validate-site passed' : v.out);
  }
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
