#!/usr/bin/env node
/**
 * 2단계 종료조건 결정론 검사기 — decisions.md 의 기계 판정 항목을 스크립트가 센다.
 * 왜: 2단계 종료조건 첫 항목("§1~§3 채움, §2 각 축에 사용자 선택·이유 원문 존재")이 worker(Haiku) 서술 판정뿐이었다.
 *     0단계 brief 는 check-brief.js 가 세는데 2단계 축 좁히기(2-B/2-E)는 아무도 세지 않았다(docs/eval-criteria-coverage.md §5 U-3·U-6·V-1).
 *     세는 일은 판단이 아니라 산술이다. 스크립트가 세고, worker 는 실행만 한다. (D-30 과 같은 처방)
 *
 * 사용법: node scripts/check-decisions.js --decisions design/decisions.md --raw design/interview_raw.md
 *          --state design/state.json [--out design/verify/exit_stage2.md]
 * 종료 코드: 0 전건 PASS / 1 FAIL 있음 / 2 입력 오류
 *
 * 검사 ID (design-draft-html 종료조건 첫 항목 = 이 명령):
 *   D-1  §1 열린 축 수 ≤ caps.human_open_axes_max(mode 가 fast 면 caps_fast 로 덮어씀, 기본 3), §1 행 전 셀 채움,
 *        §1 행 수 == §2 "### 축:" 블록 수. 축 0개면 §1 에 "열린 축 없음" 명시가 있어야 PASS.
 *   D-2  §2 각 축: 후보 ≥2(파일·설명 채움), 사용자 선택이 후보 중 하나, 선택 이유 원문(인용은 interview_raw 에 실제 존재),
 *        interview_raw 에 `D-<축번호>` 또는 `D-<축 이름>` 줄 존재 — 또는 위임(raw 에 '위임' + state.human_gates.axis_choice.delegated
 *        / human_gates.delegations[] 에 그 축 기록). state.human_gates.axis_choice.chosen[] 이 있으면 축 수와 대조.
 *   D-3  §2 각 축: AI 추천(표 'AI 추천' 열 또는 `- **AI 추천**:` / `ai_pick:` 줄)과 changed_after_reveal(true|false) 기록.
 *        state.human_gates.axis_choice.ai_pick[] 이 있으면 축 수와 대조.
 *   D-4  §3 최종 화면 세트 ≥1행(전 셀 채움) + 승인 일시 + 승인 원문 == state.human_gates.draft_approval.quote(공백·따옴표 정규화),
 *        draft_approval.approved == true. screen_count 가 있으면 §3 행 수와 대조.
 *   D-5  §1·§2 사용자 노출 문구에 금지어 0 — 정본 scripts/lib/forbidden-words.js(14개). 노출 문구 = §1 '축' 열, §2 축 이름,
 *        §2 표 '후보'·'설명' 열, §2 `- **질문**:` 줄. 페르소나 비평·AI 추천·'왜 아직 열려 있는가'·사용자 원문 줄은 사용자에게 보이지 않으므로 제외.
 * HTML 주석(<!-- -->)은 파싱 전에 제거한다(템플릿 설명문이 매치되던 check-brief B-12 결함 재발 방지).
 * 자리표시자 행("예:" 로 시작하는 셀이 있는 행, 전 셀 빈 행)은 세지 않는다 — 빈 템플릿은 D-1~D-4 가 FAIL 이어야 한다.
 */
const fs = require('fs'); const path = require('path');
function args(argv) { const o = {}; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; } return o; }
const A = args(process.argv);
if (!A.decisions || !A.raw) { console.error('--decisions <decisions.md> --raw <interview_raw.md> [--state <state.json>] [--out <리포트.md>] 필요'); process.exit(2); }
const read = (p) => (p && fs.existsSync(p)) ? fs.readFileSync(p, 'utf8') : null;
const decSrc = read(A.decisions), raw = read(A.raw);
if (decSrc == null || raw == null) { console.error('파일 없음: ' + (decSrc == null ? A.decisions : A.raw)); process.exit(2); }
let state = null;
if (A.state) {
  const s = read(A.state); if (s == null) { console.error('파일 없음: ' + A.state); process.exit(2); }
  try { state = JSON.parse(s); } catch (e) { console.error('state.json 파싱 실패: ' + e.message); process.exit(2); }
}
const caps = (state && (state.mode === 'fast' ? Object.assign({}, state.caps, state.caps_fast) : state.caps)) || {};
const cap = (k, d) => (caps && caps[k] != null) ? caps[k] : d;
const hg = (state && state.human_gates) || {};
const axisChoice = hg.axis_choice || (state && state.axis_choice) || {};
const delegations = Array.isArray(hg.delegations) ? hg.delegations : [];
const approval = hg.draft_approval || (state && state.draft_approval) || {};

/* ---- 금지어: 정본은 scripts/lib/forbidden-words.js. 없으면 같은 14개 임시 목록으로 대체하고 근거 열에 표시 ---- */
let fw = null; try { fw = require(path.join(__dirname, 'lib', 'forbidden-words')); } catch (e) { fw = null; }
const FALLBACK_RE = /정보\s*밀도|위계|톤\s*앤\s*매너|그리드|여백|대비|무드|컨셉|미니멀|모던|레이아웃|컴포넌트|플로우|\bIA\b/g;
const scan = (txt) => {
  if (fw && typeof fw.scanText === 'function') return fw.scanText(txt) || [];
  const out = []; for (const m of txt.matchAll(FALLBACK_RE)) out.push({ word: m[0], index: m.index, context: txt.slice(Math.max(0, m.index - 12), m.index + m[0].length + 12) }); return out;
};

/* ---- 섹션 분할: "## N. 제목" (HTML 주석 제거 후) ---- */
const dec = decSrc.replace(/<!--[\s\S]*?-->/g, '');
const sections = {}; let cur = null;
for (const line of dec.split('\n')) {
  const m = line.match(/^##\s+(\d+[a-z]?)\.\s+(.*)$/);
  if (m) { cur = m[1]; sections[cur] = { title: m[2], lines: [] }; continue; }
  if (cur) sections[cur].lines.push(line);
}
const sec = (id) => sections[id] ? sections[id].lines.join('\n') : '';
const has = (id) => !!sections[id];
const PLACEHOLDER = /^(?:TODO|-+)?$/;
const cellsOf = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
/* 표 = 헤더 + 실제 행. "예:" 셀이 있는 행·전 셀 빈 행은 자리표시자로 버린다 */
const table = (txt) => {
  const lines = txt.split('\n').filter((l) => /^\s*\|/.test(l));
  const header = lines.length ? cellsOf(lines[0]) : [];
  const rows = lines.slice(1).filter((l) => !/^\s*\|\s*:?-{2,}/.test(l)).map(cellsOf)
    .filter((cs) => !cs.some((c) => /^예\s*[:：]/.test(c)) && cs.some((c) => c && !PLACEHOLDER.test(c)));
  return { header, rows };
};
const col = (t, name) => t.header.findIndex((h) => h.replace(/\s+/g, '').includes(name.replace(/\s+/g, '')));
const cell = (t, row, name) => { const i = col(t, name); return i >= 0 ? (row[i] || '') : ''; };
const bulletOf = (body, label) => { const m = body.match(new RegExp('^-\\s*\\*\\*' + label + '[^*]*\\*\\*[^:：\\n]*[:：][ \\t]*(.*)$', 'm')); return m ? m[1].trim() : ''; };
const strip = (s) => String(s == null ? '' : s).replace(/[`*]/g, '').trim();
const norm = (s) => String(s == null ? '' : s).replace(/^\s*["“”'`]+|["“”'`]+\s*$/g, '').replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rawNorm = raw.replace(/\s+/g, ' ');

const checks = []; const add = (id, ok, detail, evidence) => checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail, evidence });

/* ---- §2 축 블록 파싱: "### 축: <이름>" 단위 ---- */
const axisBlocks = has('2') ? sec('2').split(/^###\s+축\s*[:：]/m).slice(1).map((b, i) => {
  const lines = b.split('\n'); const name = lines[0].trim(); const body = lines.slice(1).join('\n'); const t = table(body);
  const nums = [...new Set(t.rows.map((r) => (cell(t, r, '파일').match(/axis(\d+)/) || [])[1]).filter(Boolean))];
  return {
    i: i + 1, name, body, t, num: nums[0] || String(i + 1),
    pick: strip(bulletOf(body, '사용자 선택')), reason: bulletOf(body, '선택 이유'),
    changed: strip(bulletOf(body, 'AI 추천 공개 후 변경 여부') || (body.match(/changed_after_reveal[^:：\n]*[:：][ \t]*(true|false)/) || [])[1] || ''),
    aiBullet: (body.match(/^-\s*\*\*AI 추천\*\*[^:：\n]*[:：][ \t]*(\S.*)$/m) || [])[1] || (body.match(/\bai_pick[ \t]*[:：][ \t]*(\S.*)$/m) || [])[1] || '',
    question: bulletOf(body, '질문'),
  };
}) : [];
const label = (ax) => `축${ax.i}${ax.name ? '(' + ax.name + ')' : ''}`;

/* 1 §1 열린 축 수·채움·§2 블록 수 일치 */
const s1 = has('1') ? table(sec('1')) : { header: [], rows: [] };
const noneOpen = /열린\s*축\s*없음/.test(sec('1'));
const axesMax = cap('human_open_axes_max', 3);
const n1 = s1.rows.length, n2 = axisBlocks.length;
const s1empty = s1.rows.filter((r) => r.length < 3 || r.slice(0, 3).some((c) => !c)).length;
const d1probs = [];
if (!has('1')) d1probs.push('§1 없음'); if (!has('2')) d1probs.push('§2 없음');
if (n1 === 0 && !noneOpen) d1probs.push('§1 축 0개인데 "열린 축 없음" 명시 없음');
if (n1 > 0 && noneOpen) d1probs.push('"열린 축 없음" 명시인데 §1 행 존재');
if (n1 > axesMax) d1probs.push(`축 ${n1}개 > 상한 ${axesMax}`);
if (s1empty) d1probs.push(`§1 셀 미기입 행 ${s1empty}`);
if (n1 !== n2) d1probs.push(`§1 행 ${n1} ≠ §2 축 블록 ${n2}`);
add('D-1', d1probs.length === 0, `§1 열린 축 ${n1}개 (≤${axesMax}, mode ${state ? state.mode || 'full' : '-'}), §2 축 블록 ${n2}개${noneOpen ? ', 열린 축 없음 명시' : ''}`,
  d1probs.join('; ') || (n1 ? s1.rows.map((r) => r[0]).join(', ') : '열린 축 없음 — §2 검사 N/A'));

/* 2 §2 각 축: 후보·사용자 선택·이유 원문·raw D-<축> 또는 위임 */
const mentions = (v, ax) => { const s = String(v == null ? '' : v).replace(/\s+/g, ''); return !!s && (s === ax.num || s === 'axis' + ax.num || s === '축' + ax.num || (!!ax.name && s.includes(ax.name.replace(/\s+/g, '')))); };
const stateDelegated = (ax) => {
  const d = axisChoice.delegated;
  return d === true || (Array.isArray(d) && d.some((v) => mentions(v, ax))) || (typeof d === 'string' && mentions(d, ax))
    || delegations.some((e) => e && /draft|axis|축|^2$/i.test(String(e.stage)) && mentions(e.item, ax));
};
const rawTagFor = (ax) => {
  const ids = [ax.num, ax.name].filter(Boolean).map(esc);
  const m = raw.match(new RegExp('^D-(?:' + ids.join('|') + ')[ \\t]*[:：(（\\[][ \\t]*(\\S.*)$', 'm')); return m ? m[0].trim() : '';
};
const d2probs = [], d2ev = [];
for (const ax of axisBlocks) {
  const p = [];
  if (!ax.name) p.push('축 이름 없음');
  const cands = ax.t.rows.map((r) => strip(cell(ax.t, r, '후보'))).filter(Boolean);
  if (cands.length < 2) p.push(`후보 ${cands.length}개(<2)`);
  const thin = ax.t.rows.filter((r) => !cell(ax.t, r, '파일') || !cell(ax.t, r, '설명')).map((r) => strip(cell(ax.t, r, '후보')) || '?');
  if (thin.length) p.push('파일·설명 미기입: ' + thin.join(','));
  const tag = rawTagFor(ax); const tagDeleg = !!tag && /위임/.test(tag); const sDeleg = stateDelegated(ax);
  if (!ax.pick) p.push('사용자 선택 없음');
  else if (cands.length && !cands.includes(ax.pick) && !(tagDeleg || sDeleg)) p.push(`사용자 선택 '${ax.pick}' 이 후보(${cands.join('/')})에 없음`);
  if (tag && !tagDeleg) {
    if (!ax.reason) p.push('선택 이유 원문 없음');
    const norm = (t) => t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    const quotes = [...norm(ax.reason).matchAll(/"([^"]{6,})"/g)].map((m) => m[1].replace(/\s+/g, ' '));
    if (!quotes.length && tag) { /* 인용부호 없는 서술: D- 줄의 '— <원문>' 과 6자 이상 공통 부분열이 있어야 raw 유래로 본다 */
      const rawPart = (tag.split('—')[1] || '').replace(/\s+/g, ' ').trim(); const rs = ax.reason.replace(/\s+/g, ' ');
      let shared = false; for (let i = 0; i + 6 <= rawPart.length && !shared; i++) if (rs.includes(rawPart.slice(i, i + 6))) shared = true;
      if (rawPart && !shared) p.push('선택 이유가 raw D- 줄 원문과 겹치지 않음(인용 없음)');
    }
    const nf = quotes.filter((q) => !rawNorm.includes(q)); if (nf.length) p.push(`선택 이유 인용이 raw 에 없음 "${nf[0].slice(0, 20)}…"`);
    d2ev.push(`${label(ax)}: ${tag.slice(0, 40)}`);
  } else if (tagDeleg) {   /* 위임은 축별 D- 줄에 '사용자 위임' 이 있을 때만 — 파일 전체 grep 으로 인정하지 않는다 */
    if (!sDeleg) p.push('raw 는 위임인데 state.human_gates.axis_choice.delegated / delegations[] 에 이 축 기록 없음');
    else d2ev.push(`${label(ax)}: 위임(state 기록 있음)`);
  } else p.push(sDeleg ? `state 는 위임인데 raw 에 D-${ax.num}: 사용자 위임 줄 없음(2-E 는 위임 시에도 D- 줄을 쓴다)` : `raw 에 D-${ax.num}${ax.name ? '/D-' + ax.name : ''} 줄 없음(위임 기록도 없음)`);
  if (p.length) d2probs.push(`${label(ax)}: ${p.join(', ')}`);
}
if (Array.isArray(axisChoice.chosen) && axisChoice.chosen.length < n2) d2probs.push(`state.human_gates.axis_choice.chosen ${axisChoice.chosen.length}건 < 축 ${n2}`);
if (Array.isArray(axisChoice.chosen)) axisBlocks.forEach((ax, i) => { const c = axisChoice.chosen[i]; if (c != null && ax.pick && String(c).trim().toLowerCase() !== String(ax.pick).trim().toLowerCase()) d2probs.push(`${label(ax)}: §2 사용자 선택 '${ax.pick}' ≠ state.chosen[${i}] '${c}'`); });
if (n2 === 0 && !(n1 === 0 && noneOpen)) d2probs.push('§2 축 블록 없음');
add('D-2', d2probs.length === 0, `§2 사용자 선택·이유 원문·raw D-<축> 기록: 축 ${n2}개 중 결함 ${d2probs.length}건`, d2probs.join('; ') || (n2 ? d2ev.join(' / ') : 'N/A(열린 축 없음)'));

/* 3 §2 각 축: ai_pick·changed_after_reveal */
const d3probs = [], d3ev = [];
for (const ax of axisBlocks) {
  const p = [];
  const aiCells = ax.t.rows.map((r) => cell(ax.t, r, 'AI 추천')).filter(Boolean);
  if (!aiCells.length && !ax.aiBullet) p.push('AI 추천(ai_pick) 없음');
  if (!/^(true|false)$/.test(ax.changed)) p.push(`changed_after_reveal 이 true|false 가 아님('${ax.changed || '없음'}')`);
  if (p.length) d3probs.push(`${label(ax)}: ${p.join(', ')}`); else d3ev.push(`${label(ax)}: ai_pick=${(aiCells[0] || ax.aiBullet).slice(0, 20)}, changed=${ax.changed}`);
}
if (Array.isArray(axisChoice.ai_pick) && axisChoice.ai_pick.length < n2) d3probs.push(`state.human_gates.axis_choice.ai_pick ${axisChoice.ai_pick.length}건 < 축 ${n2}`);
add('D-3', d3probs.length === 0, `§2 ai_pick·changed_after_reveal: 축 ${n2}개 중 결함 ${d3probs.length}건`, d3probs.join('; ') || (n2 ? d3ev.join(' / ') : 'N/A(열린 축 없음)'));

/* 4 §3 최종 화면 세트·승인 원문 == state.draft_approval.quote */
const s3 = has('3') ? table(sec('3')) : { header: [], rows: [] };
const s3incomplete = s3.rows.filter((r) => r.length < 4 || r.slice(0, 4).some((c) => !c)).length;
const q1 = norm(bulletOf(sec('3'), '승인 원문')), q2 = norm(approval.quote), at = bulletOf(sec('3'), '승인 일시');
const d4probs = [];
if (!has('3')) d4probs.push('§3 없음');
if (s3.rows.length < 1) d4probs.push('§3 화면 행 0');
if (s3incomplete) d4probs.push(`§3 셀 미기입 행 ${s3incomplete}`);
if (!at) d4probs.push('승인 일시 없음');
if (!q1) d4probs.push('승인 원문 없음');
if (!state) d4probs.push('--state 없음 → draft_approval 대조 불가');
else {
  if (approval.approved !== true) d4probs.push('draft_approval.approved != true');
  if (!q2) d4probs.push('state draft_approval.quote 비어 있음'); else if (q1 && q1 !== q2) d4probs.push(`승인 원문 ≠ state.quote ("${q1.slice(0, 20)}…" vs "${q2.slice(0, 20)}…")`);
  if (approval.screen_count != null && Number(approval.screen_count) !== s3.rows.length) d4probs.push(`draft_approval.screen_count ${approval.screen_count} ≠ §3 행 ${s3.rows.length}`);
}
add('D-4', d4probs.length === 0, `§3 화면 ${s3.rows.length}행, 승인 원문 ↔ state.draft_approval.quote`, d4probs.join('; ') || `일치 "${q1.slice(0, 40)}" · 일시 ${at} · approved true`);

/* 5 §1·§2 사용자 노출 문구 금지어 0 */
const exposed = [];
for (const r of s1.rows) if (r[0]) exposed.push(r[0]);
for (const ax of axisBlocks) {
  if (ax.name) exposed.push(ax.name);
  for (const r of ax.t.rows) { const a = cell(ax.t, r, '후보'), d = cell(ax.t, r, '설명'); if (a) exposed.push(a); if (d) exposed.push(d); }
  if (ax.question) exposed.push(ax.question);
}
const hits = []; for (const txt of exposed) for (const h of scan(txt)) hits.push(`${h.word}@"${String(h.context || txt).replace(/\s+/g, ' ').slice(0, 30)}"`);
add('D-5', hits.length === 0, `§1·§2 사용자 노출 문구 ${exposed.length}건 중 금지어 ${hits.length}건 (정본 ${fw ? 'scripts/lib/forbidden-words.js' : '임시 목록 14개 — lib/forbidden-words.js 부재'})`,
  hits.slice(0, 6).join('; ') || (exposed.length ? '매치 0' : '노출 문구 없음(§1·§2 비어 있음)'));

/* 리포트 */
const passed = checks.every((c) => c.status === 'PASS');
const L = [`# 2단계 종료조건 검사 (scripts/check-decisions.js, ${new Date().toISOString()})`, '', `- decisions: ${A.decisions} · raw: ${A.raw} · state: ${A.state || '-'} · mode: ${state ? state.mode || 'full' : '-'}`, `- 결과: **${passed ? 'PASS' : 'FAIL'}** (${checks.filter((c) => c.status === 'PASS').length}/${checks.length})`, '', '| 항목 | 결과 | 내용 | 근거 |', '|---|---|---|---|'];
for (const c of checks) L.push(`| ${c.id} | ${c.status} | ${c.detail} | ${String(c.evidence).replace(/\|/g, '/').slice(0, 160)} |`);
const out = L.join('\n') + '\n';
if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, out); }
console.log(out);
process.exit(passed ? 0 : 1);
