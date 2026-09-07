#!/usr/bin/env node
/**
 * 0-A PRD 분석 종료조건 검사 (Z-1~Z-8) — design-interview SKILL 0-A 종료조건을 스크립트로(감사 지적 M2: 0/1/2/3단계 중 0-A 만 worker 서술 판정이었다).
 * 사용: node scripts/check-prd-analysis.js --prd design/prd_analysis.md [--state design/state.json] [--out design/verify/exit_prd_analysis.md]
 * 종료 코드 0 PASS / 1 FAIL / 2 입력 오류.
 *   Z-1  §1~§9 전부 존재(## n.)
 *   Z-2  §1 화면표 행 ≥1, 행마다 매핑 셀에 PRD 기능 번호(F\d+·§n-n) 또는 P-nn
 *   Z-3  상태 순위표 ≥2행, 1순위 행에 [HYPOTHESIS]
 *   Z-4  역할별 진입표(헤더에 '역할') 존재
 *   Z-5  §6 반박: 행 수 ≤ agent_prd_pushback_max, 행마다 추천(A|B)·이유·물을 쉬운 말 채움, 물을 쉬운 말에 금지어·취향형·열린 결정(추천 문장 없이) 0, 유형 '누락' ≥1 또는 '누락 없음 — 사유'
 *   Z-6  §9 필수 플로우 (a)~(g) 7행, 행마다 화면 # 또는 '해당 없음 — 사유', (g) 계정 진입 행에 ①/②/③ 판단
 *   Z-7  §8 핵심 과업 3행(시작 화면·기대 경로 채움)
 *   Z-8  상한: 전체 줄 ≤ agent_prd_analysis_lines_max · §5 미확정 ≤ agent_prd_open_questions_max · 시나리오(S-n) ≤ agent_scenarios_max · §1 흐름 후보 표 ≤ agent_flow_candidates_max · §7 [HYPOTHESIS] 감성 키워드 ≤ agent_emotion_keywords_max
 */
'use strict';
const fs = require('fs'); const path = require('path');
const FW = require('./lib/forbidden-words');
const args = (argv) => { const o = {}; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v; } } return o; };
const A = args(process.argv); const prdPath = A.prd || 'design/prd_analysis.md';
if (!fs.existsSync(prdPath)) { console.error('prd_analysis.md 없음: ' + prdPath); process.exit(2); }
const txt = fs.readFileSync(prdPath, 'utf8');
let state = null; if (A.state && fs.existsSync(A.state)) { try { state = JSON.parse(fs.readFileSync(A.state, 'utf8')); } catch (e) { state = null; } }
const caps = state ? (state.mode === 'fast' ? Object.assign({}, state.caps, state.caps_fast) : (state.caps || {})) : {};
const cap = (k, d) => (caps[k] != null) ? caps[k] : d;
const checks = []; const add = (id, ok, detail, evidence) => checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail, evidence });
const sec = (n) => { const m = txt.match(new RegExp('^## ' + n + '\\.[^\\n]*\\n([\\s\\S]*?)(?=^## \\d+\\.|(?![\\s\\S]))', 'm')); return m ? m[1] : null; };
const tables = (s) => { const out = []; let cur = null; for (const line of (s || '').split('\n')) { if (/^\s*\|/.test(line)) { const cells = line.split('|').slice(1, -1).map((c) => c.trim()); if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; if (!cur) { cur = { header: cells, rows: [] }; out.push(cur); } else cur.rows.push(cells); } else cur = null; } return out; };
const col = (h, re) => h.findIndex((x) => re.test(x));
/* Z-1 */
{ const miss = []; for (let i = 1; i <= 9; i++) if (sec(i) == null) miss.push('§' + i); add('Z-1', miss.length === 0, `§1~§9 누락 ${miss.length}`, miss.join(',') || '전부 존재'); }
/* Z-2 */
{ const t = tables(sec(1)).find((x) => col(x.header, /화면/) >= 0 && col(x.header, /매핑|기능/) >= 0); if (!t) add('Z-2', false, '§1 화면표(화면·매핑 열) 없음', prdPath);
  else { const im = col(t.header, /매핑|기능/); const bad = t.rows.filter((r) => !/\bF\d+\b|§\d|\bP-\d+\b|X-\d+/.test(r[im] || '')).map((r) => r[0]); add('Z-2', t.rows.length >= 1 && bad.length === 0, `화면 ${t.rows.length}행, 매핑 없는 행 ${bad.length}`, bad.join(', ') || '전 행 매핑'); } }
/* Z-3 */
{ const t = tables(txt).find((x) => col(x.header, /순위/) >= 0 && col(x.header, /상태/) >= 0); if (!t) add('Z-3', false, '상태 순위표 없음', prdPath);
  else { const first = t.rows.find((r) => /^1$/.test((r[col(t.header, /순위/)] || '').trim())) || t.rows[0]; const hyp = /\[HYPOTHESIS\]/.test((first || []).join(' ')); add('Z-3', t.rows.length >= 2 && hyp, `상태 순위 ${t.rows.length}행(≥2), 1순위 [HYPOTHESIS] ${hyp}`, (first || []).join(' | ').slice(0, 120)); } }
/* Z-4 */
{ const t = tables(txt).find((x) => col(x.header, /역할/) >= 0 && col(x.header, /진입|랜딩|첫 화면/) >= 0); add('Z-4', !!t && t.rows.length >= 1, t ? `역할별 진입표 ${t.rows.length}행` : '역할별 진입표(역할·진입 열) 없음', t ? t.header.join(' | ') : prdPath); }
/* Z-5 */
{ const s6 = sec(6); const t = tables(s6).find((x) => col(x.header, /추천/) >= 0); const max = cap('agent_prd_pushback_max', 10);
  if (!t) add('Z-5', /누락 없음\s*[—-]\s*\S+/.test(s6 || '') , t ? '' : (/누락 없음\s*[—-]\s*\S+/.test(s6 || '') ? '반박 표 없음 — 누락 없음 사유 선언' : '§6 반박 표(추천 열) 없음'), prdPath);
  else { const iRec = col(t.header, /추천/), iWhy = col(t.header, /이유/), iAsk = col(t.header, /쉬운 말|물을/), iType = col(t.header, /유형/); const bad = [];
    t.rows.forEach((r) => { const id = r[0]; if (!/^[AB①②]|\S/.test((r[iRec] || '').trim())) bad.push(`${id}: 추천 없음`); if (iWhy < 0 || !(r[iWhy] || '').trim()) bad.push(`${id}: 이유 없음`); const ask = iAsk < 0 ? '' : (r[iAsk] || '').trim(); if (!ask) bad.push(`${id}: 물을 쉬운 말 없음`); else { const hits = FW.scanText(ask); if (hits.length) bad.push(`${id}: 금지어 ${hits.map((h) => h.word).join('/')}`); if (FW.TASTE_PATTERN.test(ask)) bad.push(`${id}: 취향형 질문`); if (FW.OPEN_DECISION_PATTERN && FW.OPEN_DECISION_PATTERN.test(ask) && !/저는 .+(봅니다|보입니다)/.test(ask)) bad.push(`${id}: 열린 결정 질문(추천 문장 없음)`); } });
    const missing = iType >= 0 && t.rows.some((r) => /누락/.test(r[iType] || '')); const noneDecl = /누락 없음\s*[—-]\s*\S+/.test(s6 || '');
    if (!missing && !noneDecl) bad.push("'누락' 유형 0건인데 '누락 없음 — 사유' 도 없음");
    add('Z-5', t.rows.length <= max && bad.length === 0, `반박 ${t.rows.length}건(≤${max}), 위반 ${bad.length}`, bad.slice(0, 5).join('; ') || '전 행 추천·이유·쉬운 말 있음'); } }
/* Z-6 */
{ const t = tables(sec(9)).find((x) => col(x.header, /항목|플로우/) >= 0); const need = ['첫 진입', '초대 보내기', '초대받은', '역할별', '알림', '설정', '계정'];
  if (!t) add('Z-6', false, '§9 필수 플로우 대조표 없음', prdPath);
  else { const items = t.rows.map((r) => r[0] || ''); const miss = need.filter((n) => !items.some((it) => it.includes(n))); const iScr = col(t.header, /화면/), iWhy = col(t.header, /사유|없으면/); const bad = [];
    t.rows.forEach((r) => { const scr = (r[iScr] || '').trim(), why = (r[iWhy] || '').trim(); if (!/\d/.test(scr) && !/해당 없음\s*[—-]\s*\S+/.test(scr + ' ' + why)) bad.push(`${r[0]}: 화면 # 도 '해당 없음 — 사유' 도 없음`); if (/계정/.test(r[0] || '') && !/[①②③]|명시|필요|불필요/.test(r.join(' '))) bad.push('계정 진입: ①/②/③ 판단 없음'); });
    add('Z-6', miss.length === 0 && bad.length === 0, `필수 플로우 ${t.rows.length}행, 누락 항목 ${miss.length}, 위반 ${bad.length}`, [...miss.map((m) => m + ' 행 없음'), ...bad].join('; ') || '(a)~(g) 전부, 화면/사유 있음'); } }
/* Z-7 */
{ const t = tables(sec(8)).find((x) => col(x.header, /과업/) >= 0); if (!t) add('Z-7', false, '§8 핵심 과업 표 없음', prdPath);
  else { const iS = col(t.header, /시작/), iP = col(t.header, /경로/); const bad = t.rows.filter((r) => !(r[iS] || '').trim() || !(r[iP] || '').trim()).map((r) => r[0]); add('Z-7', t.rows.length === 3 && bad.length === 0, `핵심 과업 ${t.rows.length}행(==3), 시작·경로 공백 ${bad.length}`, bad.join(', ') || t.rows.map((r) => r[0]).join(', ')); } }
/* Z-8 */
{ const lines = txt.split('\n').length, lmax = cap('agent_prd_analysis_lines_max', 120); const s5 = sec(5) || ''; const open = s5.split('\n').filter((l) => /^\s*(-|\d+\.|\|)/.test(l) && !/^\s*\|\s*-/.test(l) && !/^\s*\|\s*#/.test(l)).length; const omax = cap('agent_prd_open_questions_max', 8); const sc = new Set((txt.match(/\bS-\d+\b/g) || [])).size, smax = cap('agent_scenarios_max', 3);
  const flows = tables(sec(1)).filter((x) => col(x.header, /화면/) >= 0 && col(x.header, /진입/) >= 0).length, fmax = cap('agent_flow_candidates_max', 2);
  const emo = ((sec(7) || '').match(/\[HYPOTHESIS\][^\n]*/g) || []).reduce((n, l) => n + l.replace('[HYPOTHESIS]', '').split(/[·,、]/).map((x) => x.trim()).filter(Boolean).length, 0), emax = cap('agent_emotion_keywords_max', 5);
  add('Z-8', lines <= lmax && open <= omax && sc <= smax && flows <= fmax && emo <= emax, `줄 ${lines}≤${lmax} · 미확정 ${open}≤${omax} · 시나리오 ${sc}≤${smax} · 흐름 후보 ${flows}≤${fmax} · 감성 키워드 ${emo}≤${emax}`, prdPath); }
const passed = checks.every((c) => c.status === 'PASS');
const L = [`# 0-A 종료조건 검사 (scripts/check-prd-analysis.js, ${new Date().toISOString()})`, '', `- prd: ${prdPath} · state: ${A.state || '-'} (${state ? state.mode || 'full' : 'state 없음'})`, `- 결과: **${passed ? 'PASS' : 'FAIL'}** (${checks.filter((c) => c.status === 'PASS').length}/${checks.length})`, '', '| 항목 | 결과 | 내용 | 근거 |', '|---|---|---|---|'];
for (const c of checks) L.push(`| ${c.id} | ${c.status} | ${c.detail} | ${String(c.evidence).replace(/\|/g, '/').slice(0, 160)} |`);
const out = L.join('\n') + '\n'; if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, out); } console.log(out);
process.exit(passed ? 0 : 1);
