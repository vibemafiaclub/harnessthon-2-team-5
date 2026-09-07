#!/usr/bin/env node
/**
 * 3단계 종료조건 결정론 검사기 — figma.md·figma_nodes.json·A검사·스크린샷·final_review·state 의 기계 판정 항목을 스크립트가 센다.
 * 왜: 3단계 종료조건 6항목(링크 일치·JSON 유효·개수 대조·passed_machine·c_report·final_ack)은 전부 산술인데 design-worker(Haiku) 판정에 남아 있었다
 *     (D-30 처방이 0단계에만 적용됨 — V-2 갭). 승인본(HTML 초안)↔구현본(Figma) 충실도도 판정이 아니라 산술이다(§2 규약 F-9 — judge 2콜은 계속 블라인드).
 *     스크립트가 세고, worker 는 실행만 한다.
 *
 * 사용법: node scripts/check-figma.js [--figma design/figma.md] [--state design/state.json] [--nodes design/figma_nodes.json]
 *          [--brief design/brief.md] [--drafts design/drafts] [--audit design/verify/audit_screens.json,design/verify/audit_components.json]
 *          [--shots design/verify/shots/final] [--review design/verify/final_review.md] [--tokens design/tokens.json]
 *          [--c-report design/verify/c_report.json] [--shots-index design/verify/shots/index.md] [--out design/verify/exit_stage3.md]
 * 모든 경로에 기본값이 있다(위 값). 종료 코드: 0 전건 PASS / 1 FAIL 있음 / 2 입력 오류(state.json 없음·파싱 불가)
 * 상한은 state.json caps(mode 가 fast 면 caps_fast 로 덮어씀)에서 읽고 없으면 기본값.
 *
 * 검사 ID (계획 21 단일 번호표 + F-0):
 *   F-0  산출 파일 존재·비어 있지 않음(figma.md, figma_nodes.json, a_report.md, c_report.md, c_report.json, final_review.md — D-13), a_report·c_report ≤ agent_report_lines_max
 *   F-1  figma.md 의 Figma 링크 == state.figma_url (파일 키 기준)
 *   F-2  figma_nodes.json 유효, variables·components·screens 3섹션 비어 있지 않음, 프레임 수 == brief §2 행 × 상태 수
 *        (화면마다 normal·empty·long 필수. 상태 수는 drafts 의 data-state 수, drafts 없으면 nodes 의 프레임 수(≥3))
 *   F-3  shots/final PNG 수 == 같은 수
 *   F-4  audit 병합 passed_machine (blocker 0, error 없음, 파일 전부 존재)
 *   F-5  requires_human_review 규칙마다 final_review.md 규칙 행(| 규칙 id | 확인 방법 | 결과 |) 존재, 결과가 FAIL 이면 final_ack.exceptions 에 그 규칙의 예외
 *   F-6  final_review.md 스크린샷 행(| 파일명 | 노드 id | 본 것 | PASS·FAIL |) 수 == PNG 수, 행마다 파일 존재·노드 id·본 것·PASS, state.human_gates.final_ack.final_review.file 기록
 *   F-7  state.human_gates.final_ack.approved===true, quote·level_ack(3축 채점 고지 답) 비어 있지 않음
 *   F-8  `git diff --quiet -- templates/`
 *   F-9  충실도(가능한 범위) — a: drafts 각 screen 의 data-state 수 == 그 화면 프레임 수 / b: data-role="primary-action" 수 × 상태 수 == Figma Action/Primary 수
 *        (audit primary_actions[] → figma_nodes frames[].primary_action → audit primary-action-visible 위반 역산 순으로 읽음) /
 *        c: tokens.json Variables 대상 leaf 수 == figma_nodes.variables 수(typography·elevation·icon 은 스타일이라 제외, typography.scale 수는 text_styles 와 대조) /
 *        d: 번들 text_inventory 가 있으면 초안 텍스트 집합 일치율 ≥90% (없으면 N/A)
 *   F-10 `check-c-report.js` 종료 코드 0 (리포트는 --out 과 같은 폴더의 exit_stage3_c.md)
 *   F-12 final_review.md 에 '## 대신 정한 것' 절: 행 수 ≥ state.human_gates.delegations[] 수(전 단계 합본 — 0단계 모르겠음·Q12·추천 수락·예산 60%·2단계 ai_pick 등), 행 텍스트 금지어 0 — 사용자가 마지막에 '하네스가 묻지 않고 정한 것' 전부를 한 번에 본다(U-6)
 *   F-9e drafts screen_*.html 연결 sha256 == state.human_gates.draft_approval.draft_hash (승인 뒤 변경 감지 — 2-H 규약)
 *   F-11 C 판정 처리 원장(D-40) — c_report.json 의 verdict fail 전건(local 포함)마다 `--c-routing`(기본 design/verify/c_routing.md) 표에
 *        `| <화면 id> | <C-id> | <분류> | <처리: 수정|처리 안 함> | <근거> |` 행이 있고, 처리가 '수정' 이면 근거에 재캡처 파일명(.png) 또는 커밋 해시(7자 이상),
 *        '처리 안 함' 이면 근거(사유) ≥8자. fail 0건이면 원장 없이 PASS. 정본 스키마(screens[])가 아니면 FAIL(D-41 — 조용히 PASS 하지 않는다). 리포트를 받아 보고만 하는 것은 라우팅이 아니다.
 *
 * figma_nodes.json 정본 형태(3-A·3-B·3-C 병합본):
 *   { "variables": { "primitive": { "color/primitive/primary/500": "VariableID:1:2" }, "semantic": { … }, "text_styles": { "display": "S:…" }, "font_substitution": null },
 *     "components": { "Chip/Status": { "id": "3:4", "variants": ["Waiting", "Closing"] } },
 *     "screens": [ { "id": "02_home", "name": "홈", "frames": [ { "state": "normal", "id": "12:34", "name": "02 홈 / normal", "primary_action": "12:40" } ] } ] }
 *   screens 는 프레임 평면 배열([{ "name": "02 홈 / normal", "id": … }])이나 객체({ "02_home": { "normal": "12:34", … } })도 읽는다. 상태는 state 필드 또는 이름의 "/ <state>" 접미.
 * final_review.md 정본 형태(3-G): 스크린샷마다 `| 02_normal.png | 12:34 | 아이콘·상태칩·규격 확인 | PASS |`, requires_human_review 규칙마다 `| contrast-text-aa | 즉석 대비 측정 | PASS |`.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
function args(argv) { const o = {}; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; } return o; }
const A = args(process.argv);
const DEF = { figma: 'design/figma.md', state: 'design/state.json', nodes: 'design/figma_nodes.json', brief: 'design/brief.md', drafts: 'design/drafts', audit: 'design/verify/audit_screens.json,design/verify/audit_components.json', shots: 'design/verify/shots/final', review: 'design/verify/final_review.md', tokens: 'design/tokens.json', 'c-report': 'design/verify/c_report.json', 'c-routing': 'design/verify/c_routing.md', 'shots-index': 'design/verify/shots/index.md' };
const P = (k) => A[k] || DEF[k];
const read = (p) => (fs.existsSync(p) && fs.statSync(p).isFile()) ? fs.readFileSync(p, 'utf8') : null;
const stateTxt = read(P('state'));
if (stateTxt == null) { console.error('state.json 없음: ' + P('state')); process.exit(2); }
let state; try { state = JSON.parse(stateTxt); } catch (e) { console.error('state.json 파싱 실패: ' + e.message); process.exit(2); }
const caps = state.mode === 'fast' ? Object.assign({}, state.caps, state.caps_fast) : (state.caps || {});
const cap = (k, d) => (caps[k] != null) ? caps[k] : d;
const HG = state.human_gates || {}; const FA = HG.final_ack || {};
const exceptions = Array.isArray(FA.exceptions) ? FA.exceptions : [];

const checks = []; const add = (id, ok, detail, evidence) => checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail, evidence });
const str = (v) => typeof v === 'string' && v.trim().length > 0;
const arr = (v) => Array.isArray(v) ? v : [];
const hasException = (item) => exceptions.some((e) => String(e.item || e.key || e.rule || '') === item && str(e.quote || e.user_quote));
const STATES = ['normal', 'empty', 'long', 'loading', 'error'];
const nnOf = (...vals) => { for (const v of vals) { const m = String(v == null ? '' : v).match(/^(\d+)/); if (m) return m[1].padStart(2, '0'); } return null; };
const normT = (s) => String(s).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim().toLowerCase();

/* ---- brief §2 (주석 제거 후 섹션 분할, ID 셀만 있는 자리표시자 행 제외) ---- */
function briefTable(txt, id) {
  const sections = {}; let cur = null;
  for (const line of txt.replace(/<!--[\s\S]*?-->/g, '').split('\n')) { const m = line.match(/^##\s+(\d+[a-z]?)\.\s+(.*)$/); if (m) { cur = m[1]; sections[cur] = []; continue; } if (cur) sections[cur].push(line); }
  const rows = []; let header = null;
  for (const l of (sections[id] || [])) { if (!/^\s*\|/.test(l)) continue; const cells = l.split('|').slice(1, -1).map((c) => c.trim()); if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; if (!header) { header = cells; continue; } if (cells.filter(Boolean).length <= 1) continue; rows.push(cells); }
  return { header: header || [], rows };
}
const briefTxt = read(P('brief'));
const s2rows = briefTxt != null ? briefTable(briefTxt, '2').rows.filter((r) => /^\d+$/.test(r[0])) : null;
const briefNN = s2rows ? s2rows.map((r) => r[0].padStart(2, '0')) : [];

/* ---- drafts: 화면별 상태 수·주 행동 수·텍스트 집합 ---- */
function draftInfo(dir) {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null;
  const files = fs.readdirSync(dir).filter((f) => /^screen_\d+.*\.html$/.test(f)).sort(); const map = {};
  for (const f of files) {
    const nn = f.match(/^screen_(\d+)/)[1].padStart(2, '0'); const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const states = [...new Set([...src.matchAll(/data-state\s*=\s*"([a-z-]+)"/g)].map((m) => m[1]))];
    const primary = /data-no-primary\s*=\s*"true"/.test(src) ? 0 : (src.match(/data-role\s*=\s*"primary-action"/g) || []).length;
    const body = src.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '\n');
    const texts = new Set(); for (const line of body.split('\n')) { const t = normT(line); if (t.length >= 2) texts.add(t); }
    map[nn] = { file: f, states, primary, texts };
  }
  return { files, map };
}
const drafts = draftInfo(P('drafts'));

/* ---- figma_nodes.json → 프레임 목록 {screen(nn), state, id, name, primary} ---- */
const stateOf = (v, name) => { if (typeof v === 'string' && STATES.includes(v.toLowerCase())) return v.toLowerCase(); const m = String(name || '').replace(/\s*\[[^\]]*\]\s*$/, '').match(/\/\s*([a-z]+)\s*$/i); /* 이름 접미사 [no-primary]·[no-tabbar] 는 상태·파일명에서 버린다 */ return (m && STATES.includes(m[1].toLowerCase())) ? m[1].toLowerCase() : null; };
function collectFrames(screens) {
  const out = [];
  const push = (screen, st, f) => { const o = f && typeof f === 'object' ? f : {}; out.push({ screen, state: st, id: o.id || (typeof f === 'string' ? f : null), name: o.name || '', primary: o.primary_action !== undefined ? (o.primary_action ? 1 : 0) : null }); };
  const fromEntry = (e, hint) => {
    if (!e || typeof e !== 'object') return;
    const scr = nnOf(e.id, e.screen, e.name, hint);
    let list = null;
    if (Array.isArray(e.frames)) list = e.frames; else if (Array.isArray(e.states)) list = e.states;
    else if (e.frames && typeof e.frames === 'object') list = Object.entries(e.frames).map(([k, v]) => (v && typeof v === 'object') ? Object.assign({ state: k }, v) : { state: k, id: v });
    if (list) { for (const f of list) push(scr, typeof f === 'string' ? stateOf(f) : stateOf(f && f.state, f && f.name), f); return; }
    push(scr, stateOf(e.state, e.name), e);
  };
  if (Array.isArray(screens)) screens.forEach((e) => fromEntry(e, null));
  else if (screens && typeof screens === 'object') for (const [k, v] of Object.entries(screens)) {
    if (Array.isArray(v)) v.forEach((f) => fromEntry(typeof f === 'object' && f ? Object.assign({ screen: k }, f) : { screen: k, id: f }, k));
    else if (v && typeof v === 'object') fromEntry(Object.keys(v).some((s) => STATES.includes(s)) ? { id: k, frames: v } : Object.assign({ id: k }, v), k);
  }
  return out;
}
const nodesTxt = read(P('nodes')); let nodes = null, nodesErr = null;
if (nodesTxt == null) nodesErr = '파일 없음'; else { try { nodes = JSON.parse(nodesTxt); } catch (e) { nodesErr = e.message; } }
const frames = nodes ? collectFrames(nodes.screens) : [];
const byScreen = {}; for (const f of frames) { const k = f.screen || '?'; (byScreen[k] = byScreen[k] || []).push(f); }
const expectedStates = (nn) => (drafts && drafts.map[nn]) ? drafts.map[nn].states : (byScreen[nn] && byScreen[nn].length >= 3 ? byScreen[nn].map((f) => f.state || '?') : ['normal', 'empty', 'long']);
const screenList = briefNN.length ? briefNN : Object.keys(byScreen).filter((k) => k !== '?').sort();
const expectedTotal = screenList.reduce((a, nn) => a + expectedStates(nn).length, 0);
function countVariables(v) {
  if (!v) return 0; if (Array.isArray(v)) return v.length; if (typeof v !== 'object') return 0;
  let n = 0;
  for (const [k, val] of Object.entries(v)) {
    if (/^(_|\$)/.test(k) || ['font_substitution', 'text_styles', 'textStyles', 'effect_styles', 'styles', 'collection_ids', 'collections_meta'].includes(k)) continue;
    if (Array.isArray(val)) n += val.length; else if (val && typeof val === 'object') n += ('id' in val && Object.keys(val).length <= 5) ? 1 : countVariables(val); else if (typeof val === 'string' && val) n++;
  }
  return n;
}
const countEntries = (v) => Array.isArray(v) ? v.length : (v && typeof v === 'object') ? Object.keys(v).filter((k) => !/^(_|\$)/.test(k)).length : 0;

/* ---- F-0 산출 파일 존재·상한 ---- */
const verifyDir = path.dirname(P('c-report'));
const F0 = [[P('figma'), 'figma.md'], [P('nodes'), 'figma_nodes.json'], [path.join(verifyDir, 'a_report.md'), 'a_report.md'], [path.join(verifyDir, 'c_report.md'), 'c_report.md'], [P('c-report'), 'c_report.json'], [P('review'), 'final_review.md']];
const missing0 = F0.filter(([p]) => { const t = read(p); return t == null || !t.trim(); }).map(([, n]) => n);
const maxRep = cap('agent_report_lines_max', 80); const over0 = [];
for (const n of ['a_report.md', 'c_report.md']) { const t = read(path.join(verifyDir, n)); if (t != null) { const l = t.split('\n').length; if (l > maxRep) over0.push(`${n} ${l}줄`); } }
add('F-0', !missing0.length && !over0.length, `산출 파일 없음·빈 파일 ${missing0.length}건, 리포트 상한(${maxRep}줄) 초과 ${over0.length}건`, [...missing0.map((n) => n + ':없음'), ...over0].join(', ') || F0.map(([, n]) => n).join(', ') + ' 존재');

/* ---- F-1 링크 일치 ---- */
const figmaTxt = read(P('figma'));
const keyOf = (u) => { const m = String(u || '').match(/figma\.com\/(?:file|design|board|proto|slides|deck)\/([A-Za-z0-9]+)/); return m ? m[1] : null; };
const mdUrl = figmaTxt ? (figmaTxt.match(/https?:\/\/(?:www\.)?figma\.com\/[^\s)>\]"'`]+/) || [null])[0] : null;
const stUrl = String(state.figma_url || '');
const urlSame = !!(mdUrl && stUrl) && (keyOf(mdUrl) ? keyOf(mdUrl) === keyOf(stUrl) : mdUrl.replace(/\/+$/, '') === stUrl.replace(/\/+$/, ''));
add('F-1', urlSame, `figma.md 링크 ${mdUrl ? '있음' : '없음'} / state.figma_url ${stUrl ? '있음' : '없음'} / 파일 키 ${urlSame ? '일치' : '불일치'}`, `${mdUrl || '(figma.md 링크 없음)'} vs ${stUrl || '(state 비어 있음)'}`);

/* ---- F-2 figma_nodes.json ---- */
if (nodesErr) add('F-2', false, 'figma_nodes.json 유효하지 않음', nodesErr.slice(0, 120));
else {
  const nVar = countVariables(nodes.variables), nComp = countEntries(nodes.components);
  const secBad = [];
  if (!nVar) secBad.push('variables 비어 있음'); if (!nComp) secBad.push('components 비어 있음'); if (!frames.length) secBad.push('screens 비어 있음');
  const missingScreens = briefNN.filter((nn) => !byScreen[nn]);
  const extra = Object.keys(byScreen).filter((k) => k === '?' || (briefNN.length && !briefNN.includes(k)));
  const baseMissing = screenList.filter((nn) => byScreen[nn]).flatMap((nn) => ['normal', 'empty', 'long'].filter((s) => !byScreen[nn].some((f) => f.state === s)).map((s) => `${nn}:${s}`));
  const noState = frames.filter((f) => !f.state).length;
  const countOk = frames.length === expectedTotal;
  const bad = [...secBad, ...missingScreens.map((n) => `§2 #${n} 프레임 없음`), ...extra.map((k) => `§2 밖/번호 없는 화면 '${k}'`), ...baseMissing.map((x) => x + ' 없음'), ...(noState ? [`상태 미상 프레임 ${noState}`] : []), ...(countOk ? [] : [`프레임 ${frames.length} ≠ 기대 ${expectedTotal}`])];
  add('F-2', bad.length === 0 && (briefTxt != null), `variables ${nVar} · components ${nComp} · 프레임 ${frames.length} (기대 ${expectedTotal} = §2 ${briefNN.length}행 × 상태 수${drafts ? ', drafts 기준' : ', nodes 기준(≥3)'})${briefTxt == null ? ' — brief 없음' : ''}`, bad.join('; ') || `${screenList.map((nn) => nn + ':' + (byScreen[nn] || []).length).join(' ')}`);
}

/* ---- F-3 shots/final PNG 수 ---- */
const shotsDir = P('shots'); const pngs = (fs.existsSync(shotsDir) && fs.statSync(shotsDir).isDirectory()) ? fs.readdirSync(shotsDir).filter((f) => /\.png$/i.test(f)) : null;
const expectedNames = screenList.flatMap((nn) => expectedStates(nn).map((s) => `${nn}_${s}.png`));
const missingPng = pngs ? expectedNames.filter((n) => !pngs.includes(n)) : expectedNames;
add('F-3', pngs != null && pngs.length === expectedTotal && expectedTotal > 0, `shots/final PNG ${pngs ? pngs.length : '(폴더 없음)'} (기대 ${expectedTotal})`, missingPng.length ? '이름 기준 없는 캡처: ' + missingPng.slice(0, 8).join(', ') + (missingPng.length > 8 ? ` 외 ${missingPng.length - 8}` : '') : '전 프레임 캡처 존재');

/* ---- F-4 audit 병합 ---- */
const auditParts = [], auditErrs = [];
for (const p of String(P('audit')).split(',').map((s) => s.trim()).filter(Boolean)) {
  const t = read(p); if (t == null) { auditErrs.push(p + ':없음'); continue; }
  try { const j = JSON.parse(t); if (j.error) auditErrs.push(p + ':' + j.error); else auditParts.push(Object.assign({ _file: p }, j)); } catch (e) { auditErrs.push(p + ':' + e.message.slice(0, 60)); }
}
const blockers = auditParts.reduce((a, p) => a + (((p.summary || {}).blocker) || 0), 0);
const passedMachine = auditParts.length > 0 && auditErrs.length === 0 && auditParts.every((p) => p.passed_machine === true) && blockers === 0;
const rhr = [...new Set(auditParts.flatMap((p) => arr(p.requires_human_review)))];
const applicable = {}; for (const p of auditParts) for (const [k, v] of Object.entries(p.applicable_per_rule || {})) applicable[k] = (applicable[k] || 0) + v;
const violations = auditParts.flatMap((p) => arr(p.violations));
add('F-4', passedMachine, `audit ${auditParts.length}파일 병합 — blocker ${blockers}, passed_machine ${passedMachine ? 'true' : 'false'}, 오류 ${auditErrs.length}`, auditErrs.join('; ') || `nodes ${auditParts.reduce((a, p) => a + (p.nodes_inspected || 0), 0)}, requires_human_review ${rhr.length}: ${rhr.join(', ') || '-'}`);

/* ---- final_review.md 파싱: 스크린샷 행 / 규칙 행 ---- */
const reviewTxt = read(P('review'));
function parseReview(txt) {
  const shots = [], rules = [];
  for (const line of (txt || '').split('\n')) {
    if (!/^\s*\|/.test(line)) continue; const cells = line.split('|').slice(1, -1).map((c) => c.replace(/`/g, '').trim());
    if (!cells.length || cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
    if (/\.png$/i.test(cells[0])) shots.push({ file: cells[0].split('/').pop(), node: cells[1] || '', seen: cells[2] || '', result: cells[3] || '' });
    else if (/^[a-z][a-z0-9-]*$/i.test(cells[0]) && cells.length >= 3) rules.push({ rule: cells[0], how: cells[1] || '', result: cells[2] || '' });
  }
  return { shots, rules };
}
const review = parseReview(reviewTxt);

/* ---- F-5 requires_human_review 확인 기록 ---- */
const bad5 = [];
for (const r of rhr) { const row = review.rules.find((x) => x.rule === r); if (!row) bad5.push(`${r}:행 없음`); else if (!str(row.how)) bad5.push(`${r}:확인 방법 없음`); else if (/FAIL/i.test(row.result) && !hasException(r)) bad5.push(`${r}:FAIL 인데 예외 승인 없음`); else if (!/PASS|예외|승인/i.test(row.result)) bad5.push(`${r}:결과 '${row.result}'`); }
add('F-5', reviewTxt != null && auditParts.length > 0 && bad5.length === 0, `requires_human_review ${rhr.length}건, final_review 규칙 행 ${review.rules.length}, 미확인 ${bad5.length}${reviewTxt == null ? ' — final_review.md 없음' : ''}${auditParts.length ? '' : ' — audit 없음'}`, bad5.join('; ') || (rhr.length ? '전건 사람 확인 행 존재' : '미검사 blocker 없음'));

/* ---- F-6 스크린샷 확인 행 == PNG 수 ---- */
const frFile = (() => { for (const c of [FA.final_review, HG.final_review, state.final_review]) { if (!c) continue; if (typeof c === 'string') return c; if (typeof c.file === 'string') return c.file; } return ''; })();
const bad6 = [];
for (const s of review.shots) { const m = []; if (pngs && !pngs.includes(s.file)) m.push('파일 없음'); if (!str(s.node)) m.push('노드 id 없음'); if (!str(s.seen)) m.push('본 것 없음'); if (!/^PASS$/i.test(s.result)) m.push(`결과 '${s.result || ''}'`); if (m.length) bad6.push(`${s.file}:${m.join('·')}`); }
if (pngs) for (const f of pngs) if (!review.shots.some((s) => s.file === f)) bad6.push(`${f}:확인 행 없음`);
const frOk = str(frFile) && path.basename(frFile) === path.basename(P('review'));
add('F-6', reviewTxt != null && pngs != null && review.shots.length === pngs.length && pngs.length > 0 && bad6.length === 0 && frOk, `final_review 스크린샷 행 ${review.shots.length} (PNG ${pngs ? pngs.length : '-'}), 결함 행 ${bad6.length}, state final_ack.final_review.file ${frOk ? '기록됨' : '없음/불일치'}`, bad6.slice(0, 6).join('; ') + (bad6.length > 6 ? ` 외 ${bad6.length - 6}` : '') || `행 전건 파일·노드 id·본 것·PASS, file=${frFile}`);

/* ---- F-12 대신 정한 것 합본 (U-6) ---- */
{
  const dele = arr(HG.delegations); const FW = (() => { try { return require('./lib/forbidden-words'); } catch (e) { return null; } })();
  const secIdx = (reviewTxt || '').search(/^##\s*대신 정한 것/m); let rows = [];
  if (secIdx >= 0) { const body = reviewTxt.slice(secIdx).split('\n').slice(1); for (const line of body) { if (/^##\s/.test(line)) break; const m = line.match(/^\s*(?:\|\s*)?(?:\d+[.)]|[-*])?\s*(.+?)\s*\|?\s*$/); if (/^\s*\|?\s*-{2,}/.test(line) || /^\s*\|\s*(#|번호|항목)/.test(line)) continue; if (m && m[1].trim() && /[가-힣A-Za-z]/.test(m[1])) rows.push(m[1].replace(/\|/g, ' ').trim()); } }
  const fw = FW ? rows.flatMap((r) => FW.scanText(r).map((h) => `「${h.word}」`)) : [];
  add('F-12', secIdx >= 0 && rows.length >= dele.length && fw.length === 0, `'대신 정한 것' 절 ${secIdx >= 0 ? '있음' : '없음'} · 행 ${rows.length} (delegations ${dele.length}) · 금지어 ${fw.length}`, secIdx < 0 ? 'final_review.md 에 "## 대신 정한 것" 절을 두고 delegations[] 항목마다 쉬운 말 한 줄' : (fw.join(', ') || rows.slice(0, 3).join(' / ')));
}

/* ---- F-7 final_ack ---- */
const bad7 = []; if (FA.approved !== true) bad7.push('approved≠true'); if (!str(FA.quote)) bad7.push('quote 없음'); if (!str(FA.level_ack)) bad7.push('level_ack(3축 채점 고지 답) 없음');
add('F-7', bad7.length === 0, `final_ack approved=${JSON.stringify(FA.approved)}, at=${FA.at || '-'}, 예외 ${exceptions.length}건`, bad7.join('; ') || `quote="${String(FA.quote).slice(0, 40)}" level_ack="${String(FA.level_ack).slice(0, 40)}"`);

/* ---- F-8 템플릿 무변조 ---- */
try { cp.execSync('git diff --quiet -- templates/', { stdio: 'ignore', cwd: ROOT }); add('F-8', true, 'templates/ 무변조', 'git diff --quiet -- templates/ → 0'); }
catch (e) { add('F-8', false, 'templates/ 가 변경됨 — git checkout -- templates/ 후 재검', 'git diff --quiet -- templates/ → ' + (e.status || 1)); }

/* ---- F-9 충실도 ---- */
if (!drafts || !drafts.files.length) { add('F-9a', false, '승인본(drafts/screen_*.html) 없음 — 상태 수 대조 불가', P('drafts')); add('F-9b', false, '승인본 없음 — 주 행동 수 대조 불가', P('drafts')); }
else {
  const bad9a = [];
  for (const nn of Object.keys(drafts.map)) { const ds = drafts.map[nn].states.length, fs_ = (byScreen[nn] || []).length; if (ds !== fs_) bad9a.push(`${nn}: 초안 상태 ${ds}(${drafts.map[nn].states.join('/')}) ≠ 프레임 ${fs_}`); }
  for (const nn of Object.keys(byScreen)) if (nn !== '?' && !drafts.map[nn]) bad9a.push(`${nn}: 초안 파일 없음`);
  add('F-9a', bad9a.length === 0 && !nodesErr, `초안 ${drafts.files.length}파일 상태 섹션 수 vs 프레임 수 불일치 ${bad9a.length}건`, bad9a.join('; ') || Object.keys(drafts.map).map((nn) => `${nn}:${drafts.map[nn].states.length}`).join(' '));

  /* b: 초안 primary-action × 상태 수 == Figma Action/Primary 수 */
  const expectedPrimary = Object.keys(drafts.map).reduce((a, nn) => a + drafts.map[nn].primary * expectedStates(nn).length, 0);
  let figmaPrimary = null, basis = '';
  const pa = auditParts.flatMap((p) => arr(p.primary_actions));
  if (pa.length) { figmaPrimary = pa.reduce((a, x) => a + (Number(x.count) || 0), 0); basis = 'audit primary_actions[]'; }
  else if (frames.some((f) => f.primary !== null)) { figmaPrimary = frames.reduce((a, f) => a + (f.primary || 0), 0); basis = 'figma_nodes frames[].primary_action'; }
  else { const rid = Object.keys(applicable).find((k) => /primary/i.test(k)); if (rid) { const v = violations.filter((x) => x.rule === rid && /^Action\/Primary$/.test(String(x.node).split(' / ').pop())); figmaPrimary = applicable[rid] - v.length + v.reduce((a, x) => a + (Number(String(x.actual).match(/^(\d+)개/) ? String(x.actual).match(/^(\d+)개/)[1] : 0)), 0); basis = `audit ${rid} 역산(no-primary 프레임은 1로 셈)`; } }
  if (figmaPrimary == null) add('F-9b', true, `주 행동 수 대조 N/A — audit 에 primary_actions·primary-action-visible 없음, figma_nodes 에 primary_action 없음 (초안 기대 ${expectedPrimary})`, 'audit primary_actions[] 또는 frames[].primary_action 기록 필요');
  else add('F-9b', figmaPrimary === expectedPrimary, `초안 primary-action × 상태 수 ${expectedPrimary} vs Figma Action/Primary ${figmaPrimary} (${basis})`, Object.keys(drafts.map).map((nn) => `${nn}:${drafts.map[nn].primary}×${expectedStates(nn).length}`).join(' '));
}
/* c: tokens leaf 수 == variables 수 */
const tokensTxt = read(P('tokens')); let tokens = null; try { tokens = tokensTxt != null ? JSON.parse(tokensTxt) : null; } catch (e) { tokens = null; }
const SKIP = new Set(['rationale', '_note', '$schema_note', 'usage', 'concentric_rule', 'label', 'meta', 'wcag', '_reference_note']); const STYLE_GROUPS = new Set(['typography', 'elevation', 'icon']);
function countLeaves(obj, depth) { let n = 0; for (const [k, v] of Object.entries(obj || {})) { if (SKIP.has(k) || /^(_|\$)/.test(k) || (depth === 0 && STYLE_GROUPS.has(k))) continue; if (v && typeof v === 'object') n += countLeaves(v, depth + 1); else if (v !== null && v !== undefined && v !== '') n++; } return n; }
if (!tokens) add('F-9c', false, 'tokens.json 없음·파싱 불가 — 변수 수 대조 불가', P('tokens'));
else if (nodesErr) add('F-9c', false, 'figma_nodes.json 없음 — 변수 수 대조 불가', nodesErr.slice(0, 80));
else {
  const leaves = countLeaves(tokens, 0), nVar = countVariables(nodes.variables);
  const scale = tokens.typography && tokens.typography.scale ? Object.keys(tokens.typography.scale).filter((k) => !/^(_|\$)/.test(k)).length : 0;
  const ts = (nodes.variables && (nodes.variables.text_styles || nodes.variables.textStyles)) || nodes.text_styles || nodes.textStyles || null;
  const nTs = ts ? countEntries(ts) : null;
  const tsOk = nTs == null || nTs === scale;
  add('F-9c', leaves === nVar && tsOk, `tokens.json Variables 대상 leaf ${leaves}(color·spacing·radius·layout) vs figma_nodes.variables ${nVar}; typography.scale ${scale} vs text_styles ${nTs == null ? 'N/A(미기록)' : nTs}`, leaves === nVar ? '변수 수 일치' : `변수 ${nVar - leaves > 0 ? '초과' : '누락'} ${Math.abs(nVar - leaves)}건`);
}
/* d: text_inventory 일치율 */
const inventory = auditParts.flatMap((p) => arr(p.text_inventory));
if (!auditParts.length) add('F-9d', false, 'audit 없음 — 텍스트 일치율 대조 불가', P('audit'));
else if (!inventory.length) add('F-9d', true, '텍스트 일치율 N/A — 번들이 text_inventory 를 반환하지 않음(우선순위 3)', 'make-figma-audit 반환에 text_inventory 추가 후 활성');
else if (!drafts || !drafts.files.length) add('F-9d', false, '승인본 없음 — 텍스트 일치율 대조 불가', P('drafts'));
else {
  const idToNN = {}; for (const f of frames) if (f.id) idToNN[f.id] = f.screen;
  const figTexts = {}; for (const inv of inventory) { const nn = nnOf(inv.frame) || idToNN[inv.id] || null; if (!nn) continue; (figTexts[nn] = figTexts[nn] || new Set()); for (const t of arr(inv.texts)) figTexts[nn].add(normT(t)); }
  let total = 0, matched = 0; const per = [];
  for (const nn of Object.keys(drafts.map)) {
    const F = [...(figTexts[nn] || [])]; let m = 0; const D = [...drafts.map[nn].texts];
    for (const d of D) if (F.some((f) => f === d || (f.length >= 40 && d.startsWith(f)) || f.includes(d) || (f.length >= 2 && d.includes(f)))) m++;
    total += D.length; matched += m; per.push(`${nn}:${m}/${D.length}`);
  }
  const rate = total ? matched / total : 0;
  add('F-9d', rate >= 0.9, `초안 텍스트 집합 일치율 ${(rate * 100).toFixed(1)}% (≥90%, ${matched}/${total})`, per.join(' '));
}

/* ---- F-9e 승인본 해시 — 승인 뒤 초안이 바뀌면 그 승인은 무효(2-H: draft_hash = cat screen_*.html | shasum -a 256) ---- */
{ const DA = HG.draft_approval || {}; const dir = P('drafts'); const files = (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) ? fs.readdirSync(dir).filter((f) => /^screen_.*\.html$/.test(f)).sort() : [];
  if (!files.length) add('F-9e', false, 'drafts 에 screen_*.html 없음 — 해시 대조 불가', dir);
  else { const h = require('crypto').createHash('sha256'); for (const f of files) h.update(fs.readFileSync(path.join(dir, f))); const now = h.digest('hex'); const rec = String(DA.draft_hash || '');
    add('F-9e', rec.length >= 8 && now.startsWith(rec.slice(0, 8)) && rec === now.slice(0, rec.length), `승인 해시 ${rec ? rec.slice(0, 12) : '(없음)'} vs 현재 ${now.slice(0, 12)} (${files.length}개 파일)`, rec === now ? '승인본과 동일' : rec ? '승인 뒤 초안이 바뀌었거나 승인 기록이 없다 — 2-H 재승인' : 'state.human_gates.draft_approval.draft_hash 없음'); } }

/* ---- F-10 check-c-report.js ---- */
const cOut = A.out ? path.join(path.dirname(A.out), 'exit_stage3_c.md') : 'design/verify/exit_stage3_c.md';
const cr = cp.spawnSync(process.execPath, [path.join(__dirname, 'check-c-report.js'), '--report', P('c-report'), '--shots', P('shots-index'), '--state', P('state'), '--brief', P('brief'), '--out', cOut], { encoding: 'utf8' });
const crLine = ((cr.stdout || '').match(/결과: \*\*(PASS|FAIL)\*\* \([^)]*\)/) || [(cr.stderr || '').trim().split('\n')[0] || ''])[0];
add('F-10', cr.status === 0, `check-c-report.js 종료 코드 ${cr.status} (리포트 ${cOut})`, crLine || '(출력 없음)');

/* ---- F-11 C 판정 처리 원장 (D-40) ---- */
{
  let crep = null; try { crep = JSON.parse(read(P('c-report')) || 'null'); } catch (e) { crep = null; }
  const fails = []; for (const s of arr(crep && crep.screens)) for (const c of arr(s.checks)) if (/^fail$/i.test(String(c.verdict || ''))) fails.push({ screen: String(s.id || ''), id: String(c.id || '').toUpperCase(), diag: String(c.diagnosis || '') });
  /* 스키마 불일치는 통과가 아니라 FAIL — 정본은 screens[].checks[].verdict(3-E·check-c-report 헤더). 다른 모양(예: 최상위 fails[])이면 fail 을 셀 수 없으므로 게이트가 헛돈다(D-41). */
  const schemaOk = !!(crep && Array.isArray(crep.screens) && crep.screens.length);
  const legacyFails = arr(crep && crep.fails).length;
  const routing = read(P('c-routing'));
  const rows = []; for (const line of (routing || '').split('\n')) { const m = line.match(/^\s*\|(.+)\|\s*$/); if (!m) continue; const cells = m[1].split('|').map((x) => x.trim()); if (cells.length < 5 || /^-+$/.test(cells[0]) || /^화면/.test(cells[0])) continue; rows.push({ screen: cells[0], id: cells[1].toUpperCase(), diag: cells[2], action: cells[3], basis: cells.slice(4).join(' ') }); }
  const bad11 = [];
  for (const f of fails) {
    const r = rows.find((x) => x.screen === f.screen && x.id === f.id);
    if (!r) { bad11.push(`${f.screen}/${f.id}(${f.diag || '분류 없음'}): 원장 행 없음`); continue; }
    if (/^수정/.test(r.action)) { if (!/[A-Za-z0-9_\-]+\.png|\b[0-9a-f]{7,40}\b/.test(r.basis)) bad11.push(`${f.screen}/${f.id}: '수정' 인데 근거에 재캡처 파일(.png)·커밋 해시 없음`); }
    else if (/^처리 안 함|^미처리/.test(r.action)) { if (r.basis.replace(/\s+/g, '').length < 8) bad11.push(`${f.screen}/${f.id}: '처리 안 함' 사유 8자 미만`); }
    else bad11.push(`${f.screen}/${f.id}: 처리 열 '${r.action}' ∉ {수정, 처리 안 함}`);
  }
  if (!schemaOk) add('F-11', false, `c_report.json 이 정본 스키마(screens[].checks[].verdict)가 아님 — fail 을 셀 수 없음` + (legacyFails ? ` (최상위 fails[] ${legacyFails}건 발견: 3-E 스키마로 다시 내야 한다)` : ''), crep ? `키: ${Object.keys(crep).join(', ')}` : `${P('c-report')} 없음/파싱 실패`);
  else if (fails.length && routing == null) add('F-11', false, `C fail ${fails.length}건인데 처리 원장 없음 (${P('c-routing')})`, fails.map((f) => f.screen + '/' + f.id).join(', '));
  else add('F-11', bad11.length === 0, `C fail ${fails.length}건 중 처리 원장 미기록·근거 부족 ${bad11.length}건`, bad11.join('; ') || (fails.length ? `전건 원장 있음 (${P('c-routing')} 행 ${rows.length})` : 'fail 0건 — 원장 불필요'));
}

/* ---- 리포트 ---- */
const passed = checks.every((c) => c.status === 'PASS');
const L = [`# 3단계 종료조건 검사 (scripts/check-figma.js, ${new Date().toISOString()})`, '', `- figma: ${P('figma')} · nodes: ${P('nodes')} · brief: ${P('brief')} · drafts: ${P('drafts')} · audit: ${P('audit')} · shots: ${P('shots')} · review: ${P('review')} · mode: ${state.mode || '-'}`, `- 결과: **${passed ? 'PASS' : 'FAIL'}** (${checks.filter((c) => c.status === 'PASS').length}/${checks.length})`, '', '| 항목 | 결과 | 내용 | 근거 |', '|---|---|---|---|'];
for (const c of checks) L.push(`| ${c.id} | ${c.status} | ${c.detail} | ${String(c.evidence).replace(/\|/g, '/').slice(0, 160)} |`);
const out = L.join('\n') + '\n';
if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, out); }
console.log(out);
process.exit(passed ? 0 : 1);
