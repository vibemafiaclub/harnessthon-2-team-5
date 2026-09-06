#!/usr/bin/env node
/**
 * 0단계 종료조건 결정론 검사기 — brief.md 의 기계 판정 항목을 스크립트가 센다.
 * 왜: design-worker(Haiku)에 맡긴 종료조건 검사가 3회 연속 틀렸다(§2 vs §2b 경계 오판, 인용 대조 오탐, 파일 미생성 — D-30).
 *     세는 일은 판단이 아니라 산술이다. 스크립트가 세고, worker 는 실행만 한다.
 *
 * 사용법: node scripts/check-brief.js --brief design/brief.md --raw design/interview_raw.md
 *          [--state design/state.json] [--audit design/audit_result.json] [--out design/verify/exit_stage0.md]
 * 종료 코드: 0 전건 PASS / 1 FAIL 있음 / 2 입력 오류
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
function args(argv) { const o = {}; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; } return o; }
const A = args(process.argv);
if (!A.brief || !A.raw) { console.error('--brief <brief.md> --raw <interview_raw.md> 필요'); process.exit(2); }
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
const brief = read(A.brief), raw = read(A.raw);
if (brief == null || raw == null) { console.error('파일 없음: ' + (brief == null ? A.brief : A.raw)); process.exit(2); }
const state = A.state && fs.existsSync(A.state) ? JSON.parse(fs.readFileSync(A.state, 'utf8')) : null;
const caps = (state && (state.mode === 'fast' ? Object.assign({}, state.caps, state.caps_fast) : state.caps)) || {};
const cap = (k, d) => (caps && caps[k] != null) ? caps[k] : d;

/* ---- 섹션 분할: "## N. 제목" / "## 2b. 제목" ---- */
const sections = {}; let cur = null;
for (const line of brief.split('\n')) {
  const m = line.match(/^##\s+(\d+[a-z]?)\.\s+(.*)$/);
  if (m) { cur = m[1]; sections[cur] = { title: m[2], lines: [] }; continue; }
  if (cur) sections[cur].lines.push(line);
}
const sec = (id) => sections[id] ? sections[id].lines.join('\n') : '';
const has = (id) => !!sections[id];
const tableRows = (txt) => txt.split('\n').filter((l) => /^\s*\|/.test(l) && !/^\s*\|\s*-{2,}/.test(l)).slice(1) // 헤더 제외
  .map((l) => l.split('|').slice(1, -1).map((c) => c.trim())).filter((cells) => cells.some((c) => c && !/^(TODO|예:.*)$/.test(c)));
const bullets = (txt) => txt.split('\n').filter((l) => /^\s*(?:[-*]|\d+\.)\s+\S/.test(l) && !/TODO/.test(l));

const checks = []; const add = (id, ok, detail, evidence) => checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail, evidence });

/* 0 템플릿 무변조 */
try { cp.execSync('git diff --quiet -- templates/', { stdio: 'ignore' }); add('T-0', true, 'templates/ 무변조', 'git diff --quiet -- templates/ → 0'); }
catch (e) { add('T-0', false, 'templates/ 가 변경됨 — git checkout -- templates/ 후 재검', 'git diff --quiet -- templates/ → ' + (e.status || 1)); }

/* 1 전체 줄 수 */
const total = brief.split('\n').length; const maxLines = cap('agent_brief_lines_max', 220);
add('B-1', total <= maxLines, `brief 전체 ${total}줄 (≤${maxLines})`, `wc -l ${A.brief} → ${total}`);

/* 2 §1 문제 진술 3~5 */
const s1 = bullets(sec('1')); add('B-2', s1.length >= 3 && s1.length <= 5, `§1 문제 진술 ${s1.length}개 (3~5)`, s1.slice(0, 5).map((l) => l.trim().slice(0, 60)).join(' | '));

/* 3 §2 화면표 전 행에 기능 매핑 (§2b 와 분리) */
const s2rows = tableRows(sec('2')); const s2bad = s2rows.filter((c) => !c[c.length - 1] || !/\d|F|기능|§/.test(c[c.length - 1]));
add('B-3', s2rows.length >= 1 && s2bad.length === 0, `§2 화면표 ${s2rows.length}행, 기능 매핑 누락 ${s2bad.length}`, s2bad.map((c) => c[1] || c[0]).join(', ') || '전행 매핑');

/* 4 §2b 핵심 과업 3 */
const s2b = tableRows(sec('2b')); add('B-4', s2b.length >= 3, `§2b 핵심 과업 ${s2b.length}행 (≥3)`, s2b.map((c) => c[1] || c[0]).slice(0, 3).join(' | '));

/* 5 §3 대조표 6축 정본 */
const s3 = tableRows(sec('3')); const s3noCanon = s3.filter((c) => !c[4]);
add('B-5', s3.length >= 6 && s3noCanon.length === 0, `§3 대조표 ${s3.length}축, 정본 미기입 ${s3noCanon.length}`, s3noCanon.map((c) => c[0]).join(', ') || '전축 정본');

/* 6 §4 판단기준: 개수·8필드·인용 존재 */
const ruleBlocks = sec('4').split(/^###\s+RULE-/m).slice(1).map((b) => 'RULE-' + b);
const rmin = cap('agent_rules_min', 8), rmax = cap('agent_rules_max', 20);
add('B-6', ruleBlocks.length >= rmin && ruleBlocks.length <= rmax, `§4 판단기준 ${ruleBlocks.length}개 (${rmin}~${rmax}, 초과도 FAIL)`, ruleBlocks.map((b) => b.split('\n')[0]).join(', '));
const FIELDS = ['statement', 'source_quote', 'source_refs', 'axis', 'exception', 'verdict_method', 'borrow_scope', 'confidence', 'audit'];
const rawNorm = raw.replace(/\s+/g, ' ');
const missing = [], badQuote = [], badVerdict = [];
for (const b of ruleBlocks) {
  const id = b.split('\n')[0].trim();
  const f = {}; for (const F of FIELDS) { const m = b.match(new RegExp('^-\\s*' + F + '\\s*:\\s*(.*)$', 'm')); f[F] = m ? m[1].trim() : ''; }
  const empty = FIELDS.filter((F) => !f[F] || /^\[\]$/.test(f[F])); if (empty.length) missing.push(id + '(' + empty.join(',') + ')');
  if (f.verdict_method && !/^(A|C)(\+C|\+A)?\b/.test(f.verdict_method)) badVerdict.push(id);
  const quotes = [...(f.source_quote || '').matchAll(/"([^"]{6,})"/g)].map((m) => m[1].replace(/\s+/g, ' '));
  const notFound = quotes.filter((q) => !rawNorm.includes(q));
  if (quotes.length === 0 || notFound.length) badQuote.push(id + (notFound.length ? ':미발견 "' + notFound[0].slice(0, 30) + '…"' : ':인용 없음'));
}
add('B-7', missing.length === 0, `8필드 누락 ${missing.length}건`, missing.join('; ') || '전건 채움');
add('B-8', badVerdict.length === 0, `verdict_method A|C 아님 ${badVerdict.length}건`, badVerdict.join(', ') || '전건 A/C');
add('B-9', badQuote.length === 0, `source_quote 가 interview_raw 에 실제 존재하지 않음 ${badQuote.length}건`, badQuote.join('; ') || `전건 존재(${ruleBlocks.length})`);

/* 7 §6 가정 1~15 */
const s6 = tableRows(sec('6')).length || bullets(sec('6')).length; add('B-10', s6 >= 1 && s6 <= 15, `§6 가정 로그 ${s6}건 (1~15)`, `rows=${s6}`);
/* 8 §7 토큰 자리 3~10 */
const s7 = tableRows(sec('7')); add('B-11', s7.length >= 3 && s7.length <= 10, `§7 토큰 자리 ${s7.length}행 (3~10)`, s7.map((c) => c[0]).join(', '));
/* 9 §10 반박 로그 */
const s10 = tableRows(sec('10')); const s10none = /반박 없음/.test(sec('10'));
add('B-12', s10.length >= 1 || s10none, `§10 PRD 반박 ${s10.length}건${s10none ? ' (반박 없음 명시)' : ''}`, s10.map((c) => c[0]).join(', ') || (s10none ? '반박 없음 — 사유 있음' : '없음'));
/* 10 §11 적합성 2~6 */
const s11 = bullets(sec('11')).filter((l) => /:\s*\S/.test(l)); add('B-13', s11.length >= 2 && s11.length <= 6, `§11 적합성 단서 ${s11.length}줄 (2~6)`, `채운 항목 ${s11.length}`);

/* 11 감사 전파: audit 이 제거한 수치가 §5·§7 에 남아 있지 않은가 (D-31) */
if (A.audit && fs.existsSync(A.audit)) {
  const audit = JSON.parse(fs.readFileSync(A.audit, 'utf8')); const items = Array.isArray(audit) ? audit : (audit.results || audit.rules || []);
  const numRe = /\d+(?:\.\d+)?\s*(?:px|pt|:1|°|%|배|개|초|em)/g; const leaked = [];
  const others = sec('5') + '\n' + sec('7') + '\n' + sec('8');
  for (const it of items) {
    const verdict = it.audit || it.verdict;
    if (!it || verdict === 'entailed' || !it.narrowed) continue;
    /* 제거된 수치 = (원 statement + 감사 note)에 있고 narrowed 에 없는 수치 */
    const src = (it.statement || '') + ' ' + (it.note || '');
    const removed = [...new Set((src.match(numRe) || []).map((s) => s.replace(/\s+/g, '')))].filter((n) => !(it.narrowed.replace(/\s+/g, '')).includes(n));
    for (const n of removed) if (others.replace(/\s+/g, '').includes(n)) leaked.push(`${it.rule_id || it.id}:${n}`);
  }
  add('B-14', leaked.length === 0, `감사가 제거한 수치가 §5/§7/§8 에 잔존 ${leaked.length}건`, leaked.join(', ') || '잔존 없음');
} else add('B-14', true, '감사 결과 파일 없음 — 전파 검사 생략(N/A)', A.audit || '--audit 미지정');

/* 12 raw 답변 수 ≥ 질문 수 */
const qs = (raw.match(/^Q-\d+/gm) || []).length, as = (raw.match(/^A-\d+/gm) || []).length;
add('B-15', qs === 0 || as >= qs, `interview_raw 질문 ${qs} / 답변 ${as}`, `grep -c '^Q-' → ${qs}, '^A-' → ${as}`);

/* 리포트 */
const passed = checks.every((c) => c.status === 'PASS');
const L = [`# 0단계 종료조건 검사 (scripts/check-brief.js, ${new Date().toISOString()})`, '', `- brief: ${A.brief} · raw: ${A.raw} · mode: ${state ? state.mode : '-'}`, `- 결과: **${passed ? 'PASS' : 'FAIL'}** (${checks.filter((c) => c.status === 'PASS').length}/${checks.length})`, '', '| 항목 | 결과 | 내용 | 근거 |', '|---|---|---|---|'];
for (const c of checks) L.push(`| ${c.id} | ${c.status} | ${c.detail} | ${String(c.evidence).replace(/\|/g, '/').slice(0, 160)} |`);
const out = L.join('\n') + '\n';
if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, out); }
console.log(out);
process.exit(passed ? 0 : 1);
