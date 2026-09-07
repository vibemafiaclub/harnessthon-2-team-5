#!/usr/bin/env node
/**
 * 1단계 토큰·디자인 가이드 종료조건 검사 (K-1~K-12 단일 번호표 — design-tokens SKILL 1-D 의 인라인 명령을 스크립트로 옮김, V-1).
 * 사용: node scripts/check-tokens.js --tokens design/tokens.json --state design/state.json --design design/design.md --brief design/brief.md
 *        --wcag design/verify/wcag_tokens.md --compare design/stimuli/design_guide_compare.html --sets design/stimuli/token_sets.json
 *        --raw design/interview_raw.md [--rules-out design/project.rules.json] [--out design/verify/exit_stage1.md]
 * 종료 코드 0 PASS / 1 FAIL / 2 입력 오류(tokens·state 없음). 나머지 입력이 없으면 그 항목 FAIL(지정 안 했어도 — 1단계 산출물은 전부 있어야 한다).
 *   K-1  tokens.json: 빈 문자열 0(_note 류 제외), 6카테고리 rationale, typography.family.fallback
 *   K-2  build-rules 종료 0 + audit --compile-only 종료 0
 *   K-3  wcag_tokens.md: 선택 세트 행 ≥10, FAIL 0, 필수 행(WCAG text.primary/bg.page·on-primary·단조성 neutral·강약 text·M-1·M-2·M-3) PASS
 *   K-4  design.md §1~§13 존재, 줄 ≤ agent_design_md_lines_max, §2b '- 왜 …:' 4, §4A+§4C 행 == brief §4 confidence 수, §7 행 3 + 역할 열, §8 ≥2줄 + 사용자 수준, §9 아이콘 사전·§10 장치·§12 최장 문자열
 *   K-5  design.md 에 hex 0건
 *   K-6  compare 페이지 data-set 세트 수 == human_token_sets
 *   K-7  세트 section 마다 data-section="apply" + .set-desc
 *   K-8  금지어: (a) compare 페이지 보이는 텍스트 (b) raw 의 H-nn [tokens/token_choice] 블록('답:' 제외)·'고지:' 줄
 *   K-9  token_sets.json 세트 쌍마다 4키 중 ≥2 다름
 *   K-10 raw ^T-01 1줄(형식) · 마지막 T-0n 세트 == state chosen · H-nn [tokens/token_choice] 수 == (위임 0 / 아니면 1)
 *   K-11 design.md §5 행 == brief §2 화면 수, 1등 정보 공백 0, '상태 강조 순위:' 줄
 *   K-12 state token_set_choice.chosen SET-X, delegated 면 delegations{tokens/token_set/q12} 1 + default_taken==chosen==ai_pick
 */
'use strict';
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const FW = require('./lib/forbidden-words');
const args = (argv) => { const o = {}; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v; } } return o; };
const A = args(process.argv);
const DEF = { tokens: 'design/tokens.json', state: 'design/state.json', design: 'design/design.md', brief: 'design/brief.md', wcag: 'design/verify/wcag_tokens.md', compare: 'design/stimuli/design_guide_compare.html', sets: 'design/stimuli/token_sets.json', raw: 'design/interview_raw.md', 'rules-out': 'design/project.rules.json' };
const P = (k) => A[k] || DEF[k];
const read = (p) => (fs.existsSync(p) && fs.statSync(p).isFile()) ? fs.readFileSync(p, 'utf8') : null;
const tokTxt = read(P('tokens')), stTxt = read(P('state'));
if (tokTxt == null || stTxt == null) { console.error('tokens.json 또는 state.json 없음: ' + P('tokens') + ' / ' + P('state')); process.exit(2); }
let T, S; try { T = JSON.parse(tokTxt); S = JSON.parse(stTxt); } catch (e) { console.error('JSON 파싱 실패: ' + e.message); process.exit(2); }
const caps = S.mode === 'fast' ? Object.assign({}, S.caps, S.caps_fast) : (S.caps || {});
const checks = []; const add = (id, ok, detail, evidence) => checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail, evidence });
const sec = (t, h, endRe) => { if (t == null) return null; const i = t.search(new RegExp('^##+ ' + h + '[.\\s]', 'm')); if (i < 0) return null; const r = t.slice(i).split('\n').slice(1); const e = r.findIndex((l) => endRe.test(l)); return (e < 0 ? r : r.slice(0, e)).join('\n'); };
const rows = (x) => (x || '').split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l)).slice(1).filter((l) => l.replace(/[|\s]/g, '').length);

/* K-1 */
{ const skip = new Set(['_note', '$schema_note', '_reference_note']); const empt = [];
  (function w(o, p) { for (const [k, v] of Object.entries(o || {})) { if (skip.has(k)) continue; if (p === 'meta.' && k === 'reference_palette' && T.meta && T.meta.reference_system == null) continue; if (v && typeof v === 'object') w(v, p + k + '.'); else if (v === '') empt.push(p + k); } })(T, '');
  const nr = ['color', 'typography', 'spacing', 'radius', 'elevation', 'icon'].filter((c) => !(T[c] && String(T[c].rationale || '').trim()));
  const fb = !!(T.typography && T.typography.family && String(T.typography.family.fallback || '').trim());
  add('K-1', !empt.length && !nr.length && fb, `빈 문자열 ${empt.length} / rationale 누락 ${nr.join(',') || '없음'} / fallback ${fb}`, empt.slice(0, 6).join(',') || P('tokens')); }
/* K-2 */
{ const out = P('rules-out'); const b = cp.spawnSync(process.execPath, [path.join(__dirname, 'build-rules.js'), '--tokens', P('tokens'), '--out', out], { encoding: 'utf8' });
  let a = { status: -1, stdout: '', stderr: 'build-rules 실패' }; if (b.status === 0) a = cp.spawnSync(process.execPath, [path.join(__dirname, 'audit.js'), '--project', out, '--compile-only'], { encoding: 'utf8' });
  add('K-2', b.status === 0 && a.status === 0, `build-rules 종료 ${b.status} · audit --compile-only 종료 ${a.status}`, ((b.stdout + b.stderr).trim().split('\n').pop() || '') + ' | ' + ((a.stdout || '') + (a.stderr || '')).trim().split('\n').pop()); }
/* K-3 */
{ const c = (S.human_gates && S.human_gates.token_set_choice && S.human_gates.token_set_choice.chosen) || ''; const w = read(P('wcag'));
  if (w == null) add('K-3', false, 'wcag_tokens.md 없음', P('wcag'));
  else { const L = w.split('\n').filter((l) => l.startsWith('| ' + c + ' |')); const fail = L.filter((l) => /\| FAIL /.test(l)).length; const has = (n) => L.some((l) => new RegExp('^\\| ' + c + ' \\| ' + n + ' \\| PASS ').test(l));
    const miss = ['WCAG text\\.primary/bg\\.page', 'WCAG text\\.on-primary/brand\\.default', '단조성 neutral', '강약 text', 'M-1', 'M-2', 'M-3'].filter((n) => !has(n));
    add('K-3', L.length >= 10 && !fail && !miss.length, `${c} 행 ${L.length} (≥10) / FAIL ${fail} / 누락 ${miss.map((m) => m.replace(/\\\\/g, '')).join(',') || '없음'}`, P('wcag')); } }
/* K-4 */
{ const D = read(P('design')), B = read(P('brief')); const cap = caps.agent_design_md_lines_max || 160;
  if (D == null || B == null) add('K-4', false, `design.md ${D == null ? '없음' : '있음'} / brief.md ${B == null ? '없음' : '있음'}`, P('design'));
  else { const dS = (h) => sec(D, h, /^##+ /), bS = (h) => sec(B, h, /^## /); const miss = []; for (let i = 1; i <= 13; i++) if (sec(D, String(i), /^## /) === null) miss.push('§' + i);
    const lines = D.split('\n').length; const b2 = (dS('2b') || '').split('\n').filter((l) => /^- 왜 .+: \S/.test(l)).length; const bc = (bS('4') || '').split('\n').filter((l) => /^- confidence: (confirmed|provisional)\b/.test(l)).length;
    const d4 = rows(dS('4A')).length + rows(dS('4C')).length; const s7 = dS('7') || '', h7 = s7.split('\n').find((l) => /^\|/.test(l)) || ''; const r7 = rows(s7).length, role7 = /역할/.test(h7);
    const s8 = dS('8') || ''; const lv = /^- 사용자 수준[^:]*: \S/m.test(s8), n8 = s8.split('\n').filter((l) => /^- \S/.test(l)).length; const s9 = /아이콘 사전[^:]*: \S/m.test(dS('9') || ''), s10 = /이 프로젝트의 장치: \S/m.test(dS('10') || ''), s12 = /최장 문자열[^:]*: \S/m.test(dS('12') || '');
    const ok = !miss.length && lines <= cap && b2 === 4 && d4 > 0 && bc === d4 && r7 === 3 && role7 && lv && n8 >= 2 && s9 && s10 && s12;
    add('K-4', ok, `누락 절 ${miss.join(',') || '없음'} / 줄 ${lines}≤${cap} / §2b ${b2}/4 / §4A+4C ${d4} vs brief ${bc} / §7 행 ${r7} 역할 ${role7} / §8 줄 ${n8} 수준 ${lv} / §9 ${s9} §10 ${s10} §12 ${s12}`, P('design')); } }
/* K-5 */
{ const D = read(P('design')); const hex = D == null ? null : (D.match(/#[0-9A-Fa-f]{6}\b/g) || []); add('K-5', D != null && hex.length === 0, D == null ? 'design.md 없음' : `hex 직접 표기 ${hex.length}건`, hex ? hex.slice(0, 5).join(',') : P('design')); }
/* K-6·K-7·K-8a */
{ const h = read(P('compare')); const want = caps.human_token_sets;
  if (h == null) { add('K-6', false, 'design_guide_compare.html 없음', P('compare')); add('K-7', false, '페이지 없음', P('compare')); add('K-8a', false, '페이지 없음', P('compare')); }
  else { const n = new Set([...h.matchAll(/<section[^>]*data-set="(SET-[A-Z])"/g)].map((m) => m[1])).size; add('K-6', n === want, `data-set 세트 ${n} / human_token_sets ${want}`, P('compare'));
    let f = 0, cnt = 0; const det = []; for (const m of h.matchAll(/<section[^>]*data-set="(SET-[A-Z])"[^>]*>([\s\S]*?)<\/section>/g)) { cnt++; const a = /data-section="apply"/.test(m[2]), d = /<p[^>]*class="[^"]*\bset-desc\b/.test(m[2]); if (!a || !d) { f++; det.push(`${m[1]}: apply ${a} desc ${d}`); } }
    add('K-7', cnt > 0 && f === 0, `세트 ${cnt} 중 apply·set-desc 누락 ${f}`, det.join('; ') || '전 세트 apply+set-desc');
    const hits = FW.scanText(FW.stripTags(h)); add('K-8a', hits.length === 0, `비교 페이지 금지어 ${hits.length}건`, hits.slice(0, 5).map((x) => '「' + x.word + '」').join(',') || '0건'); } }
/* K-8b·K-10 (raw) */
{ const raw = read(P('raw')); const st = (S.human_gates && S.human_gates.token_set_choice) || {};
  if (raw == null) { add('K-8b', false, 'interview_raw.md 없음', P('raw')); add('K-10', false, 'interview_raw.md 없음', P('raw')); }
  else { const lines = raw.split('\n'); const msgs = []; let p = false; for (const l of lines) { if (/^H-[0-9]+ \[tokens\/token_choice\]/.test(l)) { p = true; continue; } if (p && /^$/.test(l)) p = false; if (p && !/^답:/.test(l)) msgs.push(l); if (/^고지:/.test(l)) msgs.push(l); }
    const hits = FW.scanText(msgs.join('\n')); add('K-8b', hits.length === 0, `1단계 호출·고지 문장 ${msgs.length}줄 금지어 ${hits.length}건`, hits.slice(0, 5).map((x) => '「' + x.word + '」').join(',') || '0건');
    const t = lines.filter((l) => /^T-0[1-9] /.test(l)); const t1 = t.filter((l) => /^T-01 (SET-[A-Z] \| (이유: \S.*|사용자 위임.*)|없음 \| 이유: \S.*)$/.test(l)).length; const last = t[t.length - 1] || ''; const set = (last.match(/^T-0[1-9] (SET-[A-Z])/) || [])[1]; const hn = lines.filter((l) => /^H-[0-9]{2} \[tokens\/token_choice\]/.test(l)).length;
    const ok = t1 === 1 && !!set && set === st.chosen && (st.delegated ? hn === 0 : hn === 1);
    add('K-10', ok, `T-01 유효 ${t1} / 최종 T 세트 ${set || '없음'} / state.chosen ${st.chosen} / H-nn [tokens/token_choice] ${hn} (위임 ${!!st.delegated})`, t.join(' ; ').slice(0, 160) || 'T- 줄 없음'); } }
/* K-9 */
{ const sTxt = read(P('sets')); if (sTxt == null) add('K-9', false, 'token_sets.json 없음', P('sets'));
  else { let SS; try { SS = JSON.parse(sTxt); } catch (e) { SS = null; } const sets = SS && Array.isArray(SS.sets) ? SS.sets : []; const g = (o, p) => p.split('.').reduce((a, k) => a && a[k], o); const K = ['typography.family.body', 'color.primitive.primary.500', 'radius.usage.card', 'spacing.unit']; let f = 0; const det = [];
    for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) { const d = K.filter((k) => String(g(sets[i].tokens, k)).toLowerCase() !== String(g(sets[j].tokens, k)).toLowerCase()); det.push(`${sets[i].id} vs ${sets[j].id}: ${d.length}`); if (d.length < 2) f++; }
    add('K-9', sets.length >= 2 && f === 0, `세트 ${sets.length}, 체감 동일 쌍 ${f}`, det.join(', ') || 'sets 없음'); } }
/* K-11 */
{ const D = read(P('design')), B = read(P('brief')); if (D == null || B == null) add('K-11', false, 'design.md/brief.md 없음', P('design'));
  else { const tbl = (s) => { const L = (s || '').split('\n').filter((l) => /^\|/.test(l)); if (!L.length) return { rows: [], idx: -1 }; const H = L[0].split('|').map((x) => x.trim()); return { rows: L.slice(2).filter((l) => l.replace(/[|\s]/g, '').length), idx: H.findIndex((c) => /1등 정보/.test(c)) }; };
    const b = tbl(sec(B, '2', /^## /)), d = tbl(sec(D, '5', /^## /)); const blank = d.rows.filter((l) => !(l.split('|').map((x) => x.trim())[d.idx] || '').length); const rank = /^상태 강조 순위[^:]*: \S/m.test(sec(D, '5', /^## /) || '');
    add('K-11', b.rows.length > 0 && b.rows.length === d.rows.length && blank.length === 0 && d.idx >= 0 && rank, `brief §2 화면 ${b.rows.length} / design.md §5 행 ${d.rows.length} / 1등 정보 공백 ${blank.length} / 상태 강조 순위 줄 ${rank ? '있음' : '없음'}`, P('design')); } }
/* K-12 */
{ const t = (S.human_gates && S.human_gates.token_set_choice) || {}; const d = (S.human_gates && S.human_gates.delegations || []).filter((x) => x.stage === 'tokens' && x.item === 'token_set' && x.kind === 'q12');
  const ok = /^SET-[A-Z]$/.test(t.chosen || '') && (!t.delegated || (d.length === 1 && d[0].default_taken === t.chosen && t.ai_pick === t.chosen));
  add('K-12', ok, `chosen ${t.chosen} / ai_pick ${t.ai_pick} / delegated ${!!t.delegated} / delegations(tokens/token_set/q12) ${d.length}`, P('state')); }

const passed = checks.every((c) => c.status === 'PASS');
const L = [`# 1단계 종료조건 검사 (scripts/check-tokens.js, ${new Date().toISOString()})`, '', `- tokens: ${P('tokens')} · state: ${P('state')} (mode ${S.mode || 'full'}, human_token_sets ${caps.human_token_sets}, design_md_lines ${caps.agent_design_md_lines_max})`, `- 결과: **${passed ? 'PASS' : 'FAIL'}** (${checks.filter((c) => c.status === 'PASS').length}/${checks.length})`, '', '| 항목 | 결과 | 내용 | 근거 |', '|---|---|---|---|'];
for (const c of checks) L.push(`| ${c.id} | ${c.status} | ${c.detail} | ${String(c.evidence).replace(/\|/g, '/').slice(0, 160)} |`);
const out = L.join('\n') + '\n'; if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, out); } console.log(out);
process.exit(passed ? 0 : 1);
