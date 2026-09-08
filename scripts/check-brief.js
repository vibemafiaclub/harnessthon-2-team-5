#!/usr/bin/env node
/**
 * 0단계 종료조건 결정론 검사기 — brief.md 의 기계 판정 항목을 스크립트가 센다.
 * 왜: design-worker(Haiku)에 맡긴 종료조건 검사가 3회 연속 틀렸다(§2 vs §2b 경계 오판, 인용 대조 오탐, 파일 미생성 — D-30).
 *     세는 일은 판단이 아니라 산술이다. 스크립트가 세고, worker 는 실행만 한다.
 *     빈 templates/brief.md 는 반드시 FAIL 이어야 한다. 이전 판은 tableRows 가 ID 셀 하나만 채운 자리 행을 데이터로 세고
 *     sec() 가 HTML 주석 안의 '반박 없음' 까지 읽어 빈 템플릿에서 B-4·B-12 가 PASS 였다(실행 확인). 이 판은 둘 다 고쳤다.
 *
 * 사용법: node scripts/check-brief.js --brief design/brief.md --raw design/interview_raw.md
 *          [--state design/state.json] [--audit design/audit_result.json] [--out design/verify/exit_stage0.md]
 *          [--refs design/references.md] [--page-report design/verify/exit_interview_page.md]
 *   --refs·--page-report 를 생략하면 brief 가 있는 폴더 기준으로 잡는다
 *   (design/brief.md → design/references.md · design/verify/exit_interview_page.md). templates/brief.md 로 돌리면 templates/ 기준이라 없음 → FAIL.
 * 종료 코드: 0 전건 PASS / 1 FAIL 있음 / 2 입력 오류
 * 상한: state.json caps (mode 가 fast 면 caps_fast 로 덮어씀), 없으면 아래 괄호 안 기본값.
 *
 * 검사 번호표 (docs/eval-criteria-coverage.md §2 단일 번호표 — design-interview SKILL 종료조건과 같은 순서로 쓴다):
 *   T-0   templates/ 무변조 (git diff --quiet -- templates/)
 *   B-1   brief 전체 줄 수 ≤ agent_brief_lines_max(320, fast 220 — state 없을 때 기본 320)
 *   B-2   §1 문제 진술 3~5
 *   B-3   §2 화면표 전 행에 PRD 기능 번호 또는 §10 P-nn 매핑 (PRD 밖 화면은 'X-nn → §10 P-nn')
 *   B-3b  §2 '이 화면의 1등 정보' 열 공백 0
 *   B-3c  §11 '누가 쓰는가' 의 역할(R-n 번호가 있으면 번호, 없으면 ·,/ 분리 명사) 각각이 §2 '역할' 열에 ≥1
 *   B-4   §2b T-1~T-3 존재 + 각 행 시작 화면·기대 경로 채움 + T-1 시작 화면 == §2c 첫 진입 행의 담당 화면 #
 *   B-5   §3 6축 정본 기입 + 진술·반응 한쪽 비면 정본 provisional + 둘 다 있고 다르면 raw ^N-<축앞2글자> 고지 + constraint=true 면 raw [CONSTRAINT]
 *   B-6   §4 판단기준 agent_rules_min(8)~agent_rules_max(20) (초과도 FAIL)
 *   B-7   §4 각 RULE 9필드(statement…audit) 채움
 *   B-7b  confidence confirmed 면 source_refs ≥3 이고 근거 접두 종류(A/R/W/D/T) ≥2
 *   B-8   verdict_method A|C
 *   B-9   source_quote 가 interview_raw 에 실제 존재
 *   B-10  §6 가정 로그 1~15
 *   B-11  §7 토큰 자리 3~10
 *   B-12  §10 반박 로그: 1~agent_prd_pushback_max(10) 행, 각 행 '하네스 이의·대안'·'하네스 추천'·'사용자 확인 원문'(인용·A-nn·위임)·'결정' 채움,
 *         또는 '반박 없음 — 사유: …'; 유형 열 '누락' ≥1 또는 '누락 없음 — 사유: …'
 *   B-13  §11 적합성 단서 2~6줄
 *   B-14  0-G 감사 결과(--audit) 필수(§4 RULE ≥1 이면) + 감사가 제거한 수치가 §5/§7/§8 에 잔존하지 않음 — 감사 미실행이 조용히 통과하던 것(M5) 차단
 *   B-15  raw 답변 수 ≥ 질문 수
 *   B-16  §2c 사용자 여정·필수 플로우: 고정 행 10 전부 존재(계정 진입 포함, D-50), 담당 화면 # ∈ §2 번호 집합 또는 사유; 초대 두 행 '해당 없음' 인데 §2 역할 2종 이상이면 FAIL
 *   B-17  §2d 상태 강조 순위 ≥2행, raw 에 ^A-05 있으면 1순위 행이 A-05 참조, 행마다 §2c 상태 행에 '상태 #n' 대응
 *   B-18  §9 레퍼런스 행 agent_references_min(4·fast 3)~agent_references_max(10·fast 6), 출처 공백 0, T-1~T-3 각각 '우리 과업' 열에 ≥1(fast)/≥2(full), --refs 존재·비어 있지 않은 줄 ≥10
 *   B-19  §4 각 RULE: plain: 필드 존재(그 안에 금지어 0) 또는 statement 에 금지어 0 — 금지어 26개 정본은 scripts/lib/forbidden-words.js
 *   B-20  raw 반응 하한: ^R-…(좋다|싫다) + ^W-n: (left|right) ≥5 또는 state.human_gates.delegations[] 에 kind q12
 *   B-21  --page-report(기본 design/verify/exit_interview_page.md) 존재·비어 있지 않음·'| FAIL |' 0
 *   B-22  state.stages.interview.answered 있으면 raw ^A-nn + ^R- + ^W-n 합계와 일치 (없으면 N/A)
 *   B-23  되묻기 ^F-n ≤3, 같은 원 질문(Q-nn) ≤2
 *   B-24  사람 호출 원장 ^H-nn [<stage>/<kind>]: 4라벨(결정할 것·선택지·추천·안 정하면), kind ∈ 허용 집합, 건수 ≤ human_calls_max(9), state.human_gates.calls[] 있으면 건수 1:1
 *   B-25  답변 활용률: raw ^A-nn ID 가 brief §2·2b·2c·2d·3·4·5·6·9·10·11 어디든 등장 ≥2/3; [UNCLEAR] 수 / 본질문(^Q-nn) 수 < 1/2
 *   B-26  §11 '누가 쓰는가:'·'사용자 수준(익숙함·연령·기기):' 줄 공백 0
 *   B-27  추천 수락 정합(I-4): raw `A-nn [ACCEPTED]` 수 == §6 '추천 수락' 행 수 == state delegations kind accepted 수 — 추천 수락은 답이 아니라 위임이라 세 곳에 같은 수로 남아야 한다
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
let FW = null; try { FW = require('./lib/forbidden-words'); } catch (e) { FW = null; }
/* scripts/lib/forbidden-words.js 가 아직 없을 때만 쓰는 대체 목록(정본과 같은 14개). 목록을 여기서 따로 늘리지 않는다 — 정본은 그 파일이다. */
const FW_FALLBACK = ['정보 밀도', '위계', '톤앤매너', '그리드', '여백', '대비', '무드', '컨셉', '미니멀', '모던', '레이아웃', '컴포넌트', '플로우', '\\bIA\\b'];
const scanForbidden = (s) => (FW && typeof FW.scanText === 'function') ? FW.scanText(s || '')
  : [...(s || '').matchAll(new RegExp(FW_FALLBACK.join('|'), 'g'))].map((m) => ({ word: m[0], index: m.index, context: '' }));

function args(argv) { const o = {}; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; } return o; }
const A = args(process.argv);
if (!A.brief || !A.raw) { console.error('--brief <brief.md> --raw <interview_raw.md> 필요'); process.exit(2); }
const read = (p) => (p && fs.existsSync(p)) ? fs.readFileSync(p, 'utf8') : null;
const briefSrc = read(A.brief), raw = read(A.raw);
if (briefSrc == null || raw == null) { console.error('파일 없음: ' + (briefSrc == null ? A.brief : A.raw)); process.exit(2); }
let state = null;
if (A.state) {
  if (!fs.existsSync(A.state)) { console.error('파일 없음: ' + A.state); process.exit(2); }
  try { state = JSON.parse(fs.readFileSync(A.state, 'utf8')); } catch (e) { console.error('state.json 파싱 실패: ' + e.message); process.exit(2); }
}
const mode = state && state.mode === 'fast' ? 'fast' : 'full';
const caps = Object.assign({}, state && state.caps, (mode === 'fast' && state) ? state.caps_fast : {});
const cap = (k, d) => (caps[k] != null ? caps[k] : d);
const briefDir = path.dirname(path.resolve(A.brief));
const refsPath = A.refs || path.join(briefDir, 'references.md');
const pageReportPath = A['page-report'] || path.join(briefDir, 'verify', 'exit_interview_page.md');

/* ---- 텍스트 유틸 ---- */
const brief = briefSrc.replace(/<!--[\s\S]*?-->/g, '');           // 검사는 HTML 주석 제거본으로 (템플릿 주석의 예시·'반박 없음' 이 데이터로 읽히던 결함)
const plainText = (c) => String(c == null ? '' : c).replace(/\*\*|__|`/g, '').trim();
const isBlank = (c) => { const p = plainText(c); return !p || /^[(（]?\s*(없음|미정|n\/a|-|—|–)\s*[)）]?$/i.test(p); };
const stripParen = (s) => plainText(s).replace(/[(（][^)）]*[)）]/g, '').trim();
const nums = (c) => [...plainText(c).matchAll(/\d+/g)].map((m) => m[0]);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rawLines = raw.split('\n');
const rawHas = (re) => rawLines.some((l) => re.test(l));
const rawCount = (re) => rawLines.filter((l) => re.test(l)).length;

/* ---- 섹션 분할: "## N. 제목" / "## 2b. 제목" ---- */
const sections = {}; let cur = null;
for (const line of brief.split('\n')) {
  const m = line.match(/^##\s+(\d+[a-z]?)\.\s+(.*)$/);
  if (m) { cur = m[1]; sections[cur] = { title: m[2], lines: [] }; continue; }
  if (cur) sections[cur].lines.push(line);
}
const sec = (id) => sections[id] ? sections[id].lines.join('\n') : '';
const has = (id) => !!sections[id];

/* ---- 표: 헤더로 열을 찾고, 채운 셀이 2개 미만(ID 셀만 있는 자리 행)은 데이터 행에서 제외 ---- */
const cellsOf = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
const filled = (c) => !!c && !/^(TODO|예:.*)$/.test(c);
const isDataRow = (cells) => cells.filter(filled).length >= 2;
function table(txt) {
  const lines = txt.split('\n').filter((l) => /^\s*\|/.test(l));
  const header = lines.length ? cellsOf(lines[0]).map(plainText) : [];
  const rows = lines.slice(1).filter((l) => !/^\s*\|\s*:?-{2,}/.test(l)).map(cellsOf).filter(isDataRow);
  const col = (re) => header.findIndex((h) => re.test(h));
  return { header, rows, col };
}
const tableRows = (txt) => table(txt).rows;
const bullets = (txt) => txt.split('\n').filter((l) => /^\s*(?:[-*]|\d+\.)\s+\S/.test(l) && !/TODO/.test(l));

const checks = []; const add = (id, ok, detail, evidence) => checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail, evidence });

/* T-0 템플릿 무변조 */
try { cp.execSync('git diff --quiet -- templates/', { stdio: 'ignore', cwd: ROOT }); add('T-0', true, 'templates/ 무변조', 'git diff --quiet -- templates/ → 0'); }
catch (e) { add('T-0', false, 'templates/ 가 변경됨 — git checkout -- templates/ 후 재검', 'git diff --quiet -- templates/ → ' + (e.status || 1)); }

/* B-1 전체 줄 수 (주석 포함 원본 기준) */
const total = briefSrc.split('\n').length; const maxLines = cap('agent_brief_lines_max', 320);
add('B-1', total <= maxLines, `brief 전체 ${total}줄 (≤${maxLines})`, `wc -l ${A.brief} → ${total}`);

/* B-2 §1 문제 진술 3~5 */
const s1 = bullets(sec('1')); add('B-2', s1.length >= 3 && s1.length <= 5, `§1 문제 진술 ${s1.length}개 (3~5)`, s1.slice(0, 5).map((l) => l.trim().slice(0, 60)).join(' | '));

/* B-3 §2 화면표 전 행에 기능 매핑 (§2b 와 분리) */
const s2t = table(sec('2')); const s2rows = s2t.rows;
const s2bad = s2rows.filter((c) => !c[c.length - 1] || !/\d|F|기능|§/.test(c[c.length - 1]));
add('B-3', s2rows.length >= 1 && s2bad.length === 0, `§2 화면표 ${s2rows.length}행, 기능 매핑 누락 ${s2bad.length}`, s2bad.map((c) => c[1] || c[0]).join(', ') || (s2rows.length ? '전행 매핑' : '§2 데이터 행 없음'));
const s2nums = new Set(s2rows.map((c) => plainText(c[0]).replace(/^#/, '')));

/* B-3b §2 '1등 정보' 열 공백 0 */
const s2top = s2t.col(/1등 정보/);
const s2topBad = s2top < 0 ? s2rows : s2rows.filter((c) => isBlank(c[s2top]));
add('B-3b', s2rows.length >= 1 && s2top >= 0 && s2topBad.length === 0, `§2 '1등 정보' 열 공백 ${s2top < 0 ? '(열 없음)' : s2topBad.length + '행'} / ${s2rows.length}행`,
  s2top < 0 ? '§2 헤더에 "1등 정보" 열 없음' : (s2topBad.map((c) => '#' + plainText(c[0])).join(', ') || `${s2rows.length}행 전부 기입`));

/* B-3c §11 '누가 쓰는가' 역할 ↔ §2 '역할' 열. §11 에 R-n 번호가 있으면 번호로 대조(templates/brief.md 정본), 없으면 ·,/+ 로 나눈 명사로 대조 */
const splitRoles = (s) => stripParen(s).replace(/§\s*\d+[a-z]?/g, '').split(/[·,/+]/).map((x) => x.trim()).filter(Boolean);
const roleIds = (s) => [...new Set(plainText(s).match(/\bR-\d+\b/g) || [])];
const s2role = s2t.col(/역할/);
const s2roleIds = s2role < 0 ? [] : [...new Set(s2rows.flatMap((c) => roleIds(c[s2role])))];
const s2roleVals = s2role < 0 ? [] : (s2roleIds.length ? s2roleIds : [...new Set(s2rows.flatMap((c) => splitRoles(c[s2role])))]);
const s11 = sec('11');
const whoLine = (s11.match(/^\s*-\s*누가 쓰는가[^:：]*[:：][ \t]*(.*)$/m) || [])[1] || '';
const whoIds = roleIds(whoLine);
const whoTokens = whoIds.length ? whoIds : splitRoles(whoLine);
const whoMissing = whoIds.length ? whoIds.filter((id) => !s2roleIds.includes(id)) : whoTokens.filter((t) => !s2roleVals.some((r) => t.includes(r) || r.includes(t)));
add('B-3c', s2role >= 0 && whoTokens.length >= 1 && whoMissing.length === 0, `§11 역할 ${whoTokens.length}종(${whoIds.length ? 'R-n 번호' : '명사'}) 중 §2 역할 열에 없는 것 ${s2role < 0 ? '(열 없음)' : whoMissing.length}`,
  s2role < 0 ? '§2 헤더에 "역할" 열 없음' : (whoTokens.length === 0 ? '§11 누가 쓰는가 비어 있음' : (whoMissing.join(', ') || `§2 역할 값: ${s2roleVals.join('/')}`)));

/* §2c 표 (B-4·B-16 이 같이 쓴다) */
const s2ct = table(sec('2c')); const s2c = s2ct.rows;
const s2cItem = s2ct.col(/여정|항목/), s2cScreen = s2ct.col(/담당 화면|화면/), s2cWhy = s2ct.col(/사유/);
const itemOf = (c) => plainText(c[s2cItem < 0 ? 0 : s2cItem]);
const firstEntryRow = s2c.find((c) => /첫 진입|온보딩/.test(itemOf(c)) && !/초대받은/.test(itemOf(c)));

/* B-4 §2b 핵심 과업 T-1~T-3: 시작 화면·기대 경로 채움, T-1 시작 화면 == §2c 첫 진입 화면 # */
const s2bt = table(sec('2b')); const s2b = s2bt.rows;
const s2bStart = s2bt.col(/시작 화면/), s2bPath = s2bt.col(/경로/);
const tRow = (n) => s2b.find((c) => plainText(c[0]) === 'T-' + n);
const s2bMissing = [1, 2, 3].filter((n) => !tRow(n)).map((n) => 'T-' + n + ' 없음');
const s2bEmpty = [1, 2, 3].map(tRow).filter(Boolean).filter((c) => s2bStart < 0 || s2bPath < 0 || isBlank(c[s2bStart]) || isBlank(c[s2bPath])).map((c) => c[0] + '(시작 화면·경로 미기입)');
const resolveScreenNo = (cell) => {
  const n = nums(cell); if (n.length) return n[0];
  const name = stripParen(cell); if (!name) return null;
  const names = s2rows.map((c) => stripParen(c[1]));
  let i = names.findIndex((x) => x === name); if (i < 0) i = names.findIndex((x) => x && (x.includes(name) || name.includes(x)));
  return i < 0 ? null : plainText(s2rows[i][0]).replace(/^#/, '');
};
const t1 = tRow(1);
const t1No = (t1 && s2bStart >= 0) ? resolveScreenNo(t1[s2bStart]) : null;
const firstNos = (firstEntryRow && s2cScreen >= 0) ? nums(firstEntryRow[s2cScreen]) : [];
const t1Match = t1No != null && firstNos.includes(t1No);
const b4why = [];
if (!has('2c')) b4why.push('§2c 없음'); else if (!firstEntryRow) b4why.push('§2c 첫 진입 행 없음'); else if (!firstNos.length) b4why.push('§2c 첫 진입 담당 화면 # 없음');
if (t1 && t1No == null) b4why.push('T-1 시작 화면이 §2 화면 번호·이름과 대응 안 됨');
if (t1 && t1No != null && firstNos.length && !t1Match) b4why.push(`T-1 시작 화면 #${t1No} ≠ §2c 첫 진입 #${firstNos.join('/')}`);
add('B-4', s2bMissing.length === 0 && s2bEmpty.length === 0 && t1Match, `§2b 핵심 과업 ${s2b.length}행(T-1~T-3), 시작 화면·경로 미기입 ${s2bEmpty.length}, T-1 시작 화면 == §2c 첫 진입 ${t1Match ? '일치' : '불일치'}`,
  [...s2bMissing, ...s2bEmpty, ...b4why].join('; ') || `T-1 시작 #${t1No} == §2c 첫 진입 #${firstNos.join('/')}`);

/* B-5 §3 대조표 6축 정본 + 진술·반응·고지 정합 */
const s3t = table(sec('3')); const s3 = s3t.rows;
const s3Stmt = s3t.col(/진술/), s3React = s3t.col(/반응/), s3Con = s3t.col(/constraint/i), s3Canon = s3t.col(/정본/);
const s3noCanon = s3.filter((c) => s3Canon < 0 || isBlank(c[s3Canon]));
const s3bad = []; const hasConstraintTag = /\[CONSTRAINT\]/.test(raw);
for (const c of s3) {
  const axis = plainText(c[0]); const ax2 = axis.replace(/\s+/g, '').slice(0, 2);
  const st = s3Stmt >= 0 ? c[s3Stmt] : '', re = s3React >= 0 ? c[s3React] : '', canon = s3Canon >= 0 ? plainText(c[s3Canon]) : '';
  const con = s3Con >= 0 && /true/i.test(plainText(c[s3Con]));
  const oneEmpty = isBlank(st) || isBlank(re);
  if (oneEmpty && !/provisional/i.test(canon)) s3bad.push(`${axis}: 진술·반응 한쪽 비었는데 정본에 provisional 없음`);
  /* '다르다' = 둘 다 채웠고 정규화 문자열이 다르며 정본 열이 '일치|같은 방향|동일' 을 선언하지 않음 */
  const differ = !oneEmpty && plainText(st).replace(/\s+/g, '') !== plainText(re).replace(/\s+/g, '') && !/일치|같은 방향|동일/.test(canon);
  if (differ && !rawHas(new RegExp('^N-' + esc(ax2)))) s3bad.push(`${axis}: 진술≠반응인데 raw 에 ^N-${ax2} 고지 없음`);
  if (con && !hasConstraintTag) s3bad.push(`${axis}: constraint=true 인데 raw 에 [CONSTRAINT] 없음`);
}
add('B-5', s3.length >= 6 && s3noCanon.length === 0 && s3bad.length === 0, `§3 대조표 ${s3.length}축(≥6), 정본 미기입 ${s3noCanon.length}, 진술·반응·고지 위반 ${s3bad.length}`,
  [...s3noCanon.map((c) => plainText(c[0]) + ' 정본 없음'), ...s3bad].join('; ') || '전축 정본·고지 정합');

/* B-6~B-9·B-7b·B-19 §4 판단기준 */
const ruleBlocks = sec('4').split(/^###\s+RULE-/m).slice(1).map((b) => 'RULE-' + b);
const rmin = cap('agent_rules_min', 8), rmax = cap('agent_rules_max', 20);
add('B-6', ruleBlocks.length >= rmin && ruleBlocks.length <= rmax, `§4 판단기준 ${ruleBlocks.length}개 (${rmin}~${rmax}, 초과도 FAIL)`, ruleBlocks.map((b) => b.split('\n')[0]).join(', ') || 'RULE 없음');
const FIELDS = ['statement', 'source_quote', 'source_refs', 'axis', 'exception', 'verdict_method', 'borrow_scope', 'confidence', 'audit'];
const rawNorm = raw.replace(/\s+/g, ' ');
const missing = [], badQuote = [], badVerdict = [], confirmedBad = [], plainBad = []; let confirmedN = 0;
for (const b of ruleBlocks) {
  const id = b.split('\n')[0].trim();
  const f = {}; for (const F of FIELDS.concat('plain')) { /* [ \t]* — \s* 는 줄바꿈까지 먹어 빈 값이 다음 줄 텍스트를 가져오는 결함(변이 보강에서 실측) */
    const m = b.match(new RegExp('^-[ \\t]*' + F + '[ \\t]*:[ \\t]*(.*)$', 'm')); f[F] = m ? m[1].trim() : ''; }
  const empty = FIELDS.filter((F) => !f[F] || /^\[\]$/.test(f[F])); if (empty.length) missing.push(id + '(' + empty.join(',') + ')');
  if (f.verdict_method && !/^(A|C)(\+C|\+A)?\b/.test(f.verdict_method)) badVerdict.push(id);
  const quotes = [...(f.source_quote || '').matchAll(/"([^"]{6,})"/g)].map((m) => m[1].replace(/\s+/g, ' '));
  const notFound = quotes.filter((q) => !rawNorm.includes(q));
  if (quotes.length === 0 || notFound.length) badQuote.push(id + (notFound.length ? ':미발견 "' + notFound[0].slice(0, 30) + '…"' : ':인용 없음'));
  if (/^confirmed/i.test(f.confidence)) {
    confirmedN++;
    const refs = f.source_refs.replace(/^\[|\]$/g, '').split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    const kinds = new Set(refs.map((r) => (r.match(/^(A|R|W|D|T)(?=-)/) || [])[1]).filter(Boolean));
    if (refs.length < 3 || kinds.size < 2) confirmedBad.push(`${id}(refs ${refs.length}, 종류 ${[...kinds].join('/') || '없음'})`);
  }
  const stmtHits = scanForbidden(f.statement).map((m) => m.word), plainHits = scanForbidden(f.plain).map((m) => m.word);
  if (f.plain) { if (plainHits.length) plainBad.push(`${id}: plain 에 금지어 ${[...new Set(plainHits)].join('/')}`); }
  else if (stmtHits.length) plainBad.push(`${id}: plain 없음 + statement 금지어 ${[...new Set(stmtHits)].join('/')}`);
}
add('B-7', missing.length === 0, `9필드 누락 ${missing.length}건`, missing.join('; ') || '전건 채움');
add('B-7b', confirmedBad.length === 0, `confirmed 인데 source_refs <3 또는 근거 종류(A/R/W/D/T) <2 ${confirmedBad.length}건`, confirmedBad.join('; ') || `confirmed ${confirmedN}건 전건 충족`);
add('B-8', badVerdict.length === 0, `verdict_method A|C 아님 ${badVerdict.length}건`, badVerdict.join(', ') || '전건 A/C');
add('B-9', badQuote.length === 0, `source_quote 가 interview_raw 에 실제 존재하지 않음 ${badQuote.length}건`, badQuote.join('; ') || `전건 존재(${ruleBlocks.length})`);

/* B-10 §6 가정 1~15 */
const s6 = tableRows(sec('6')).length || bullets(sec('6')).length; add('B-10', s6 >= 1 && s6 <= 15, `§6 가정 로그 ${s6}건 (1~15)`, `rows=${s6}`);
/* B-11 §7 토큰 자리 3~10 */
const s7 = tableRows(sec('7')); add('B-11', s7.length >= 3 && s7.length <= 10, `§7 토큰 자리 ${s7.length}행 (3~10)`, s7.map((c) => c[0]).join(', ') || '없음');

/* B-12 §10 반박 로그: 행마다 이의·대안/하네스 추천/사용자 확인 원문(인용·A-nn·위임)/결정, 1~cap, '반박 없음 — 사유', 누락 유형 */
const s10t = table(sec('10')); const s10 = s10t.rows; const s10txt = sec('10');
const s10none = /반박 없음\s*[—–-]\s*사유\s*[:：]?\s*\S{2,}/.test(s10txt);
const pmax = cap('agent_prd_pushback_max', 10);
const cObj = s10t.col(/이의|대안/), cRec = s10t.col(/추천/), cUser = s10t.col(/사용자 확인/), cType = s10t.col(/유형/), cDec = s10t.col(/결정/);
const s10bad = [];
for (const c of s10) {
  const miss = [];
  if (cObj < 0 || isBlank(c[cObj])) miss.push('이의·대안');
  if (cRec < 0 || isBlank(c[cRec])) miss.push('하네스 추천' + (cRec < 0 ? '(열 없음)' : ''));
  const u = cUser < 0 ? '' : plainText(c[cUser]);
  if (!u || !(/["“”]/.test(u) || /\bA-(F-)?\d+/.test(u) || /사용자 위임|위임|모르겠음/.test(u))) miss.push('사용자 확인 원문·위임');
  if (cDec < 0 || isBlank(c[cDec])) miss.push('결정');
  if (miss.length) s10bad.push(`${plainText(c[0])}(${miss.join(',')})`);
}
const s10missing = cType >= 0 && s10.some((c) => /누락/.test(plainText(c[cType])));
const s10missingNone = /누락 없음\s*[—–-]\s*사유\s*[:：]?\s*\S{2,}/.test(s10txt);
const b12rows = s10.length >= 1 ? (s10.length <= pmax && s10bad.length === 0) : s10none;
add('B-12', b12rows && (s10missing || s10missingNone), `§10 PRD 반박 ${s10.length}건 (1~${pmax}${s10.length === 0 ? (s10none ? ', 반박 없음+사유 있음' : ', 반박 없음 사유 없음') : ''}), 열 미기입 ${s10bad.length}, 누락 유형 ${s10missing ? '있음' : (s10missingNone ? "'누락 없음 — 사유' 있음" : '없음(사유도 없음)')}`,
  [...(s10.length > pmax ? [`상한 ${pmax} 초과`] : []), ...s10bad].join('; ') || (s10.map((c) => plainText(c[0])).join(', ') || (s10none ? '반박 없음 — 사유 있음' : '없음')));

/* B-13 §11 적합성 2~6 */
const s11lines = bullets(s11).filter((l) => /:\s*\S/.test(l)); add('B-13', s11lines.length >= 2 && s11lines.length <= 6, `§11 적합성 단서 ${s11lines.length}줄 (2~6)`, `채운 항목 ${s11lines.length}`);

/* B-14 감사 전파: audit 이 제거한 수치가 §5·§7·§8 에 남아 있지 않은가 (D-31) */
if (A.audit && fs.existsSync(A.audit)) {
  const audit = JSON.parse(fs.readFileSync(A.audit, 'utf8')); const items = Array.isArray(audit) ? audit : (audit.results || audit.rules || []);
  const numRe = /\d+(?:\.\d+)?\s*(?:px|pt|:1|°|%|배|개|초|em)/g; const leaked = [];
  const others = sec('5') + '\n' + sec('7') + '\n' + sec('8');
  for (const it of items) {
    const verdict = it.audit || it.verdict;
    if (!it || verdict === 'entailed' || !it.narrowed) continue;
    const src = (it.statement || '') + ' ' + (it.note || '');
    const removed = [...new Set((src.match(numRe) || []).map((s) => s.replace(/\s+/g, '')))].filter((n) => !(it.narrowed.replace(/\s+/g, '')).includes(n));
    for (const n of removed) if (others.replace(/\s+/g, '').includes(n)) leaked.push(`${it.rule_id || it.id}:${n}`);
  }
  add('B-14', leaked.length === 0, `감사가 제거한 수치가 §5/§7/§8 에 잔존 ${leaked.length}건`, leaked.join(', ') || '잔존 없음');
} else { const ruleN = (sec('4').match(/^### RULE-/gm) || []).length; add('B-14', ruleN === 0, ruleN ? `0-G 감사 결과 없음(--audit) 인데 §4 RULE ${ruleN}건 — 감사를 돌리지 않으면 재검증(I-3)의 절반이 무검이다` : 'RULE 0건 — 감사 대상 없음', A.audit || '--audit 미지정 (design/audit_result.json)'); }

/* B-15 raw 답변 수 ≥ 질문 수 */
const qs = rawCount(/^Q-\d+/), as = rawCount(/^A-\d+/);
add('B-15', qs === 0 || as >= qs, `interview_raw 질문 ${qs} / 답변 ${as}`, `grep -c '^Q-' → ${qs}, '^A-' → ${as}`);

/* B-16 §2c 사용자 여정·필수 플로우 커버리지 */
const FIXED = [
  ['첫 진입·온보딩', (s) => /첫 진입|온보딩/.test(s) && !/초대받은/.test(s)],
  ['초대 보내기·공유', (s) => /초대 보내기|초대를 보내|공유/.test(s) && !/초대받은/.test(s)],
  ['초대받은 쪽 첫 진입', (s) => /초대받은/.test(s)],
  ['역할별 랜딩', (s) => /역할별|랜딩/.test(s)],
  ['알림·리마인드 진입', (s) => /알림|리마인드/.test(s)],
  ['설정·탈퇴', (s) => /설정|탈퇴/.test(s)],
  ['계정 진입', (s) => /계정/.test(s)], /* '초대받은 쪽 첫 진입(미가입·링크)' 의 '가입' 과 겹치지 않게 '계정' 만 */
  ['상태 순위표의 각 상태', (s) => /상태/.test(s)],
  ['시나리오 까다로운 상황', (s) => /시나리오|까다로운/.test(s)],
  ['되돌리기·오류 복구', (s) => /되돌리기|오류|복구/.test(s)],
];
const fixedMissing = FIXED.filter(([, f]) => !s2c.some((c) => f(itemOf(c)))).map(([n]) => n);
const s2cBad = [];
for (const c of s2c) {
  const scr = s2cScreen < 0 ? '' : (c[s2cScreen] || ''), why = s2cWhy < 0 ? '' : (c[s2cWhy] || '');
  const ns = nums(scr); const unknown = ns.filter((n) => !s2nums.has(n));
  if (ns.length && unknown.length) s2cBad.push(`${itemOf(c)}: 화면 #${unknown.join('/')} 가 §2 에 없음`);
  if (!ns.length && isBlank(why)) s2cBad.push(`${itemOf(c)}: 담당 화면 # 도 사유도 없음`);
}
const inviteRows = s2c.filter((c) => /초대/.test(itemOf(c)));
const inviteNA = inviteRows.length >= 2 && inviteRows.every((c) => !nums(s2cScreen < 0 ? '' : (c[s2cScreen] || '')).length && /해당 없음/.test(plainText(c[s2cScreen] || '') + ' ' + plainText(c[s2cWhy] || '')));
const inviteConflict = inviteNA && s2roleVals.length >= 2;
/* '역할마다 1행'(templates/brief.md §2c 주석) — §2 역할 열의 역할 수만큼 '역할별 랜딩' 행이 있어야 한다(감사 지적: ≥1 만 요구해 역할 3종이 1행으로 통과) */
const landingRows = s2c.filter((c) => /역할별|랜딩/.test(itemOf(c))).length; const landingShort = s2roleVals.length > 0 && landingRows < s2roleVals.length;
add('B-16', has('2c') && s2cItem >= 0 && s2cScreen >= 0 && s2c.length >= 10 && fixedMissing.length === 0 && s2cBad.length === 0 && !inviteConflict && !landingShort,
  `§2c 여정 ${s2c.length}행(≥10), 고정 행 누락 ${fixedMissing.length}, 화면·사유 위반 ${s2cBad.length}${inviteConflict ? ', 초대 두 행 해당 없음인데 역할 ' + s2roleVals.length + '종' : ''}${landingShort ? ', 역할별 랜딩 ' + landingRows + '행 < 역할 ' + s2roleVals.length + '종' : ''}`,
  !has('2c') ? '§2c 없음' : (s2cItem < 0 || s2cScreen < 0) ? '§2c 헤더에 여정 항목/담당 화면 열 없음' : ([...fixedMissing.map((n) => n + ' 행 없음'), ...s2cBad, ...(inviteConflict ? ['초대·초대받은 쪽 둘 다 해당 없음 + §2 역할 ' + s2roleVals.join('/')] : [])].join('; ') || '고정 행 10 전부·화면 # 정합'));

/* B-17 §2d 상태 강조 순위 (+ 행마다 §2c '상태 #n' 대응 행 — templates/brief.md §2d 주석이 B-17 로 지목) */
const s2dt = table(sec('2d')); const s2d = s2dt.rows; const s2dRank = s2dt.col(/순위/);
const rankOf = (c, i) => (s2dRank >= 0 && nums(c[s2dRank]).length) ? nums(c[s2dRank])[0] : String(i + 1);
const topRow = s2d.find((c, i) => rankOf(c, i) === '1') || s2d[0];
const hasA05 = rawHas(/^A-05\b/); const topRefsA05 = !!topRow && /\bA-05\b/.test(topRow.join(' '));
const s2cStateTxt = s2c.filter((c) => /상태/.test(itemOf(c))).map((c) => c.join(' ')).join('\n');
const s2dNo2c = s2d.filter((c, i) => !new RegExp('상태\\s*#\\s*' + rankOf(c, i) + '\\b').test(s2cStateTxt)).map((c, i) => '상태 #' + rankOf(c, s2d.indexOf(c)));
add('B-17', has('2d') && s2d.length >= 2 && (!hasA05 || topRefsA05) && s2dNo2c.length === 0, `§2d 상태 강조 순위 ${s2d.length}행 (≥2)${hasA05 ? ', 1순위 행 A-05 참조 ' + (topRefsA05 ? '있음' : '없음') : ', raw 에 ^A-05 없음(참조 검사 생략)'}, §2c 대응 행 없는 상태 ${s2dNo2c.length}`,
  !has('2d') ? '§2d 없음' : ([...(s2dNo2c.length ? ['§2c 에 ' + s2dNo2c.join(',') + ' 행 없음'] : []), ...(topRow ? ['1순위: ' + plainText(topRow.slice(0, 3).join(' / ')).slice(0, 60)] : ['행 없음'])].join('; ')));

/* B-18 §9 레퍼런스 UX 패턴 + design/references.md */
const s9t = table(sec('9')); const s9 = s9t.rows;
const rmin9 = cap('agent_references_min', mode === 'fast' ? 3 : 4), rmax9 = cap('agent_references_max', mode === 'fast' ? 6 : 10);
const c9Src = s9t.col(/출처/), c9Task = s9t.col(/과업/);
const s9noSrc = s9.filter((c) => c9Src < 0 || isBlank(c[c9Src]));
const tNeed = mode === 'fast' ? 1 : 2;
const tCount = [1, 2, 3].map((n) => s9.filter((c) => c9Task >= 0 && new RegExp('\\bT-' + n + '\\b').test(plainText(c[c9Task]))).length);
const tShort = [1, 2, 3].filter((n) => tCount[n - 1] < tNeed).map((n) => `T-${n}(${tCount[n - 1]})`);
const refsTxt = read(refsPath); const refsLines = refsTxt == null ? 0 : refsTxt.split('\n').filter((l) => l.trim()).length;
add('B-18', has('9') && s9.length >= rmin9 && s9.length <= rmax9 && s9noSrc.length === 0 && tShort.length === 0 && refsLines >= 10,
  `§9 레퍼런스 ${s9.length}행 (${rmin9}~${rmax9}), 출처 공백 ${s9noSrc.length}, 과업 커버 T-1/2/3 = ${tCount.join('/')} (각 ≥${tNeed}), references.md ${refsTxt == null ? '없음' : refsLines + '줄(≥10)'}`,
  [...(!has('9') ? ['§9 없음'] : []), ...(s9noSrc.length ? ['출처 공백: ' + s9noSrc.map((c) => plainText(c[0])).join(',')] : []), ...(tShort.length ? ['과업 부족: ' + tShort.join(',')] : []), ...(refsTxt == null ? ['없음: ' + refsPath] : [])].join('; ') || refsPath);

/* B-19 §4 각 RULE 쉬운 말 */
add('B-19', ruleBlocks.length >= 1 && plainBad.length === 0, `§4 RULE ${ruleBlocks.length}건 중 plain 없음+statement 금지어 / plain 에 금지어 ${plainBad.length}건`, plainBad.join('; ') || (ruleBlocks.length ? `전건 충족 (금지어 정본: ${FW ? 'scripts/lib/forbidden-words.js' : '내장 대체 목록 — lib 파일 없음'})` : 'RULE 없음'));

/* B-20 자극 반응 하한 */
const reactR = rawCount(/^R-.*(좋다|싫다)/), reactW = rawCount(/^W-\d+\s*:\s*(left|right|왼쪽|오른쪽|W-\d+-[LR]\b|[LR]\b)/);
const delegations = (state && state.human_gates && Array.isArray(state.human_gates.delegations)) ? state.human_gates.delegations : [];
const q12 = delegations.some((d) => d && d.kind === 'q12');
add('B-20', reactR + reactW >= 5 || q12, `자극 반응 ${reactR + reactW}건 (R 좋다/싫다 ${reactR} + W 선택 ${reactW}; ≥5) 또는 Q12 위임 ${q12 ? '있음' : '없음'}`, `grep -c '^R-.*(좋다|싫다)' → ${reactR}, '^W-n: left|right' → ${reactW}, delegations q12 → ${q12}`);

/* B-21 인터뷰 페이지 검사 리포트 존재·전건 PASS */
const pr = read(pageReportPath); const prFails = pr ? (pr.match(/\|\s*FAIL\s*\|/g) || []).length : 0;
add('B-21', pr != null && pr.trim().length > 0 && prFails === 0, `인터뷰 페이지 검사 리포트 ${pr == null ? '없음' : (pr.trim() ? `존재, '| FAIL |' ${prFails}건` : '비어 있음')}`, pageReportPath);

/* B-22 state answered == raw A/R/W 합계 */
const answered = (state && state.stages && state.stages.interview) ? state.stages.interview.answered : undefined;
const answeredNum = (answered === '' || answered == null) ? null : Number(answered);
const rawA = rawCount(/^A-\d+/), rawR = rawCount(/^R-/), rawW = rawCount(/^W-\d+/);
if (answeredNum == null || Number.isNaN(answeredNum)) add('B-22', true, 'state.stages.interview.answered 없음 — 회수 수 대조 생략(N/A)', `raw A ${rawA} + R ${rawR} + W ${rawW} = ${rawA + rawR + rawW}`);
else add('B-22', answeredNum === rawA + rawR + rawW, `answered ${answeredNum} vs raw A ${rawA} + R ${rawR} + W ${rawW} = ${rawA + rawR + rawW}`, `state.stages.interview.answered=${answered}`);

/* B-23 되묻기 ≤3, 같은 원 질문 ≤2 */
const fLines = rawLines.filter((l) => /^F-\d+/.test(l));
const byQ = {}; for (const l of fLines) { const q = (l.match(/Q-?\d+/) || [])[0] || '(원 질문 미표기)'; byQ[q] = (byQ[q] || 0) + 1; }
const overQ = Object.entries(byQ).filter(([, n]) => n > 2);
add('B-23', fLines.length <= 3 && overQ.length === 0, `되묻기 F- ${fLines.length}건 (≤3), 같은 원 질문 3회 이상 ${overQ.length}`, overQ.map(([q, n]) => `${q}×${n}`).join(', ') || (fLines.length ? Object.entries(byQ).map(([q, n]) => `${q}×${n}`).join(', ') : '되묻기 없음'));

/* B-24 사람 호출 원장 H-nn [<stage>/<kind>] */
/* 사람 호출 kind 정본(11종) — 스킬 문서는 이 목록을 복제하지 않고 참조한다. scripts/fixtures/check-kinds.js 가 문서에 쓰인 kind ⊆ 이 목록을 selftest 에서 대조한다. */
const KINDS = ['interview_page', 'followup', 'constraint', 'blocked', 'token_choice', 'axis_choice', 'draft_approval', 'taste_gap', 'cap_exceeded', 'repeat_brief', 'final_ack'];
const hBlocks = [];
for (let i = 0; i < rawLines.length; i++) {
  if (!/^H-\d+/.test(rawLines[i])) continue;
  const body = [rawLines[i]];
  for (let j = i + 1; j < rawLines.length && rawLines[j].trim() && !/^(?:[A-Z]{1,3}-|##|\[)/.test(rawLines[j]); j++) body.push(rawLines[j]);
  hBlocks.push({ id: rawLines[i].match(/^H-\d+/)[0], head: rawLines[i], text: body.join('\n') });
}
const hBad = [];
for (const b of hBlocks) {
  const miss = [];
  for (const [label, re] of [['결정할 것', /결정할 것/], ['선택지', /선택지/], ['추천', /추천/], ['안 정하면', /안 정하면/]]) if (!re.test(b.text)) miss.push(label + ' 없음');
  const m = b.head.match(/\[([^\/\]]+)\/([^\]]+)\]/);
  if (!m) miss.push('[stage/kind] 없음'); else if (!KINDS.includes(m[2].trim())) miss.push('kind ' + m[2].trim() + ' 미허용');
  if (miss.length) hBad.push(`${b.id}(${miss.join(',')})`);
}
const hmax = cap('human_calls_max', 9);
/* state.human_gates.calls[] 는 raw H-nn 과 1:1 (templates/state.json 주석). 배열이 있을 때만 대조, 없으면 생략 */
const calls = (state && state.human_gates && Array.isArray(state.human_gates.calls)) ? state.human_gates.calls : null;
const callsMismatch = calls != null && calls.length !== hBlocks.length;
add('B-24', hBlocks.length <= hmax && hBad.length === 0 && !callsMismatch, `사람 호출 원장 H- ${hBlocks.length}건 (≤${hmax}), 4라벨·kind 위반 ${hBad.length}, state.calls[] ${calls == null ? '없음(대조 생략)' : calls.length + '건' + (callsMismatch ? ' ≠ H-' : ' 일치')}`,
  [...hBad, ...(callsMismatch ? [`state.human_gates.calls ${calls.length} ≠ raw H- ${hBlocks.length}`] : [])].join('; ') || (hBlocks.length ? hBlocks.map((b) => b.id).join(', ') : 'H- 없음'));

/* B-27 추천 수락 정합 — raw [ACCEPTED] == §6 '추천 수락' 행 == delegations kind accepted */
{
  const acc = rawLines.filter((l) => /^A-\d+[a-z]?\s*\[ACCEPTED\]/.test(l)).length;
  const s6acc = tableRows(sec('6')).filter((c) => /추천 수락/.test(c.join(' '))).length;
  const dacc = ((state && state.human_gates && Array.isArray(state.human_gates.delegations)) ? state.human_gates.delegations : []).filter((d) => d && d.kind === 'accepted').length;
  add('B-27', acc === s6acc && s6acc === dacc, `추천 수락 raw ${acc} · §6 행 ${s6acc} · delegations ${dacc}`, acc === s6acc && s6acc === dacc ? (acc ? '세 곳 일치' : '추천 수락 0건 일치') : '세 수가 달라야 할 이유가 없다 — 회수(0-D)·§6·state 중 빠진 곳을 채운다');
}
/* B-25 답변 활용률 ≥2/3, [UNCLEAR] 비율 <1/2 */
const aIds = [...new Set(rawLines.map((l) => (l.match(/^A-\d+/) || [])[0]).filter(Boolean))];
const s6noId = tableRows(sec('6')).map((c) => c.slice(1).join(' ')).join('\n');   // §6 가정 ID(A-nn) 는 답변 ID 와 겹치므로 첫 셀 제외
const usedIn = ['2', '2b', '2c', '2d', '3', '4', '5', '9', '10', '11'].map(sec).join('\n') + '\n' + s6noId;   // §11 은 Q7' 사용자 수준 답의 소비처(규약)라 포함
const used = aIds.filter((id) => new RegExp('\\b' + esc(id) + '\\b').test(usedIn));
const unused = aIds.filter((id) => !used.includes(id));
const useRate = aIds.length ? used.length / aIds.length : 0;
const unclear = (raw.match(/\[UNCLEAR\]/g) || []).length; const qMain = rawCount(/^Q-\d+/);
const unclearOk = qMain > 0 ? unclear / qMain < 0.5 : unclear === 0;
add('B-25', aIds.length >= 1 && useRate >= 2 / 3 && unclearOk, `답변 활용률 ${used.length}/${aIds.length} (≥2/3), [UNCLEAR] ${unclear}/${qMain} (<1/2)`, aIds.length === 0 ? 'raw 에 ^A-nn 답변 없음' : (unused.length ? '미활용: ' + unused.join(', ') : '전건 활용') + (unclearOk ? '' : '; UNCLEAR 비율 초과'));

/* B-26 §11 누가 쓰는가 · 사용자 수준 */
const who = (s11.match(/^\s*-\s*누가 쓰는가[^:：]*[:：][ \t]*(\S.*)$/m) || [])[1] || '';
const level = (s11.match(/^\s*-\s*사용자 수준[^:：]*[:：][ \t]*(\S.*)$/m) || [])[1] || '';
add('B-26', !!who.trim() && !!level.trim(), `§11 누가 쓰는가 ${who.trim() ? '기입' : '공백'} · 사용자 수준(익숙함·연령·기기) ${level.trim() ? '기입' : '공백 또는 줄 없음'}`, [who.trim() && '누가: ' + who.trim().slice(0, 50), level.trim() && '수준: ' + level.trim().slice(0, 50)].filter(Boolean).join(' / ') || '둘 다 없음');

/* 리포트 */
const passed = checks.every((c) => c.status === 'PASS');
const L = [`# 0단계 종료조건 검사 (scripts/check-brief.js, ${new Date().toISOString()})`, '',
  `- brief: ${A.brief} · raw: ${A.raw} · mode: ${state ? state.mode : '-'}`,
  `- refs: ${refsPath} · page-report: ${pageReportPath}`,
  `- 결과: **${passed ? 'PASS' : 'FAIL'}** (${checks.filter((c) => c.status === 'PASS').length}/${checks.length})`, '',
  '| 항목 | 결과 | 내용 | 근거 |', '|---|---|---|---|'];
for (const c of checks) L.push(`| ${c.id} | ${c.status} | ${c.detail} | ${String(c.evidence).replace(/\|/g, '/').slice(0, 160)} |`);
const out = L.join('\n') + '\n';
if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, out); }
console.log(out);
process.exit(passed ? 0 : 1);
