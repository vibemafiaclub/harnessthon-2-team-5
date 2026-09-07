#!/usr/bin/env node
/**
 * 0-A2 레퍼런스 수집 종료조건 검사 (U-2). 사용: node scripts/check-references.js --refs design/references.md [--state design/state.json] [--out design/verify/exit_references.md]
 * 종료 코드 0 PASS / 1 FAIL / 2 입력 오류. '레퍼런스 없음 — 사유' 한 줄이면 R-1 만 보고 나머지 N/A.
 *   R-1  표 존재, REF 행 수 agent_references_min~max (state caps; fast 는 caps_fast)
 *   R-2  출처 열 공백 0 (URL 또는 앱명+화면명)
 *   R-3  같은 카테고리(직접) ≥3 + 인접 카테고리(간접) ≥1 — '유형' 열(직접/간접)
 *   R-4  과업(동사/T-n) 열마다 ≥2 서비스 — 한 서비스만 보면 관행인지 그 앱의 버릇인지 모른다
 *   R-5  스크린샷 열: 행마다 design/references/ 아래 파일 ≥1 존재 또는 '미확보 — 사유'. 파일 있는 행이 전체의 절반 미만이면 FAIL(감사 지적: 1행만 있어도 통과하던 하한을 올림)
 *   R-6  처리 방식 열 금지어 0 (scripts/lib/forbidden-words.js) — 서비스·화면명 열은 고유명사라 제외
 */
'use strict';
const fs = require('fs'); const path = require('path');
const FW = require('./lib/forbidden-words');
const args = (argv) => { const o = {}; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v; } } return o; };
const A = args(process.argv);
const refsPath = A.refs || 'design/references.md';
if (!fs.existsSync(refsPath)) { console.error('references.md 없음: ' + refsPath); process.exit(2); }
const txt = fs.readFileSync(refsPath, 'utf8');
let state = null; if (A.state && fs.existsSync(A.state)) { try { state = JSON.parse(fs.readFileSync(A.state, 'utf8')); } catch (e) { state = null; } }
const caps = state ? (state.mode === 'fast' ? Object.assign({}, state.caps, state.caps_fast) : (state.caps || {})) : {};
const cap = (k, d) => (caps[k] != null) ? caps[k] : d;
const checks = []; const add = (id, ok, detail, evidence) => checks.push({ id, status: ok ? 'PASS' : (ok === null ? 'N/A' : 'FAIL'), detail, evidence });
const none = /레퍼런스 없음\s*[—-]\s*\S+/.test(txt);
let header = null; const rows = [];
for (const line of txt.split('\n')) {
  if (!/^\s*\|/.test(line)) continue; const cells = line.split('|').slice(1, -1).map((c) => c.trim());
  if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
  if (!header) { header = cells; continue; }
  if (/^REF-\d+/i.test(cells[0] || '')) rows.push(cells);
}
const col = (re) => header ? header.findIndex((h) => re.test(h)) : -1;
const iSvc = col(/서비스/), iTask = col(/과업|동사|T-n/), iHow = col(/처리 방식|처리/), iSrc = col(/출처/), iKind = col(/유형|직접|카테고리/), iShot = col(/스크린샷|캡처|이미지/);
const min = cap('agent_references_min', 4), max = cap('agent_references_max', 10);
if (none) { add('R-1', true, `'레퍼런스 없음 — 사유' 선언 — 사유: ${(txt.match(/레퍼런스 없음\s*[—-]\s*(.+)/) || [])[1] || ''}`, refsPath); ['R-2', 'R-3', 'R-4', 'R-5', 'R-6'].forEach((id) => add(id, null, '레퍼런스 없음 선언 — N/A', refsPath)); }
else {
  add('R-1', !!header && rows.length >= min && rows.length <= max, `REF 행 ${rows.length} (${min}~${max}, ${state ? state.mode || 'full' : 'state 없음'})`, header ? `열: ${header.join(' | ')}` : '표 없음');
  const noSrc = rows.filter((r) => iSrc < 0 || !String(r[iSrc] || '').trim()).map((r) => r[0]);
  add('R-2', iSrc >= 0 && noSrc.length === 0, `출처 공백 ${noSrc.length}건`, noSrc.join(', ') || (iSrc >= 0 ? '전 행 출처 있음' : '출처 열 없음'));
  const kinds = rows.map((r) => String(iKind >= 0 ? r[iKind] : '').trim());
  const direct = kinds.filter((k) => /직접|같은/.test(k)).length, indirect = kinds.filter((k) => /간접|인접/.test(k)).length;
  add('R-3', iKind >= 0 && direct >= 3 && indirect >= 1, `직접(같은 카테고리) ${direct} (≥3) · 간접(인접) ${indirect} (≥1)`, iKind >= 0 ? kinds.join(', ') : '유형 열 없음(직접/간접)');
  const byTask = {}; rows.forEach((r) => String(iTask >= 0 ? r[iTask] : '').split(/[·,/、]+/).map((s) => s.replace(/[*`()]/g, '').trim()).filter((s) => s && s !== '-').forEach((t) => { (byTask[t] = byTask[t] || new Set()).add(String(r[iSvc >= 0 ? iSvc : 1] || r[0])); }));
  const thin = Object.keys(byTask).filter((t) => byTask[t].size < 2);
  add('R-4', iTask >= 0 && Object.keys(byTask).length > 0 && thin.length === 0, `과업 ${Object.keys(byTask).length}개 중 서비스 1개뿐 ${thin.length}`, thin.map((t) => `${t}: ${[...byTask[t]].join('')}`).join('; ') || Object.keys(byTask).map((t) => `${t}:${byTask[t].size}`).join(', '));
  const refDir = path.join(path.dirname(refsPath), 'references');
  let withFile = 0, withReason = 0; const bad5 = [];
  rows.forEach((r) => { const cell = String(iShot >= 0 ? r[iShot] : '').trim(); const files = (cell.match(/[\w.\-\/]+\.(png|jpe?g|webp)/gi) || []).map((f) => f.split('/').pop());
    if (files.length) { const missing = files.filter((f) => !fs.existsSync(path.join(refDir, f))); if (missing.length) bad5.push(`${r[0]}: 파일 없음 ${missing.join(',')}`); else withFile++; }
    else if (/미확보\s*[—-]\s*\S+/.test(cell)) withReason++; else bad5.push(`${r[0]}: 스크린샷 파일도 '미확보 — 사유' 도 없음`); });
  const needShots = Math.max(1, Math.ceil(rows.length / 2));
  add('R-5', iShot >= 0 && bad5.length === 0 && withFile >= needShots, `스크린샷 파일 있는 행 ${withFile} (≥${needShots} = 행의 절반), 미확보(사유) ${withReason}, 위반 ${bad5.length}` + (withFile < needShots && bad5.length === 0 ? ' — 스크린샷이 절반 미만(수집 부족)' : ''), bad5.join('; ') || (iShot >= 0 ? `${refDir}/` : '스크린샷 열 없음'));
  const hits = []; rows.forEach((r) => FW.scanText(String(iHow >= 0 ? r[iHow] : '')).forEach((h) => hits.push(`${r[0]}:「${h.word}」`)));
  add('R-6', iHow >= 0 && hits.length === 0, `처리 방식 열 금지어 ${hits.length}건`, hits.slice(0, 6).join(', ') || (iHow >= 0 ? '0건' : '처리 방식 열 없음'));
}
const passed = checks.every((c) => c.status !== 'FAIL');
const L = [`# 0-A2 레퍼런스 종료조건 검사 (scripts/check-references.js, ${new Date().toISOString()})`, '', `- refs: ${refsPath} · state: ${A.state || '-'}`, `- 결과: **${passed ? 'PASS' : 'FAIL'}** (${checks.filter((c) => c.status === 'PASS').length}/${checks.length})`, '', '| 항목 | 결과 | 내용 | 근거 |', '|---|---|---|---|'];
for (const c of checks) L.push(`| ${c.id} | ${c.status} | ${c.detail} | ${String(c.evidence).replace(/\|/g, '/').slice(0, 160)} |`);
const out = L.join('\n') + '\n'; if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, out); } console.log(out);
process.exit(passed ? 0 : 1);
