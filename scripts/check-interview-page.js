#!/usr/bin/env node
/**
 * 0-B 인터뷰 페이지 발행 전 결정론 검사기 — design/stimuli/interview.html 을 스크립트가 센다.
 * 왜: 발행 전 검증 ①~⑥이 design-worker(Haiku) 지시문이었고, D-30 은 세는 일을 worker 판단에 맡기면 3회 연속 틀린다고 기록했다.
 *     세는 일은 판단이 아니라 산술이다. 스크립트가 세고, worker 는 실행만 한다. 결과 파일은 check-brief B-21 이 다시 읽는다(| FAIL | 0건).
 *
 * 사용법: node scripts/check-interview-page.js --page design/stimuli/interview.html
 *          [--template-ref HEAD:templates/interview_page.html]   (git ref:경로, 또는 파일 경로 — selftest 픽스처용)
 *          [--index design/stimuli/gallery_index.json]           (없으면 페이지 옆 interview_index.json 대체)
 *          [--state design/state.json] [--refs design/references.md]
 *          [--prompts .claude/skills/design-interview/references/interview_prompts.md]
 *          [--prd design/prd_analysis.md] [--out design/verify/exit_interview_page.md]
 * 종료 코드: 0 전건 PASS / 1 FAIL 있음 / 2 입력 오류
 * 상한은 state.json caps(mode 가 fast 면 caps_fast 로 덮어씀)에서 읽고 없으면 기본값.
 *
 * 검사 항목:
 *   P-0  git diff --quiet -- templates/ 종료 코드 0 (템플릿 무변조, D-28)
 *   P-1  기준 골격(HEAD)과 생성물에서 harness-data 블록을 뺀 나머지가 바이트 동일
 *   P-2  JSON 유효 · questions ≤ human_interview_questions_max · [0]=Q1 · [1]=Q5 · tiles ≤ human_gallery_tiles_max
 *        · pairs ≤ human_worldcup_rounds_max(기본 7) · flows[].steps ≤ agent_flow_steps_max
 *   P-3  questions(+flows) 전건 unknown===true && free===true · options 전건 value 있음·scene ≥8자
 *        · kind:pushback 은 options 정확히 3 + recommended + why · kind:pattern 은 options ≥2 · 어느 kind 든 recommended 가 있으면 options.value 중 하나 + why (결정형 추천 선명시)
 *   P-4  사용자 노출 텍스트(title·intro·banner·frame·text·effect·why·value·scene·tile/pair/flow html·title·cta·press·then·states 텍스트 노드) 금지어(디자인 14 + 문서 용어 12) 0 + text·scene 에 TASTE_PATTERN 0 + text 에 열린 결정 질문(OPEN_DECISION_PATTERN, 추천 문장 '저는 …봅니다' 없이) 0
 *   P-5  축 차이: 타이포=font-family · 형태=border-radius · 밀도=행 수 · 색온도=hue · 채도=saturation · 강조=font-weight|font-size|색 이 변형 간 다름
 *   P-6  축 격리: 같은 축 변형의 style 선언 집합에서 P-5 축 속성을 제거한 나머지가 동일
 *   P-7  타일 여는 태그 수 ≤ agent_gallery_tile_elements_max (<br> 제외)
 *   P-8  타일·흐름 텍스트에 자리표시자 0 + 타일마다 prd_analysis §1 화면표 1열 명사 ≥1
 *   P-9  타일·쌍·흐름 텍스트의 color ↔ 배경 hex 대비 ≥4.5:1 (hex 아니면 N/A)
 *   P-10 questions 전건 skeleton·payload 존재 · payload ∈ prompts §6 payload 집합 · 같은 payload 2건(pushback·pattern·verifies 재검증 제외) FAIL · verifies 는 다른 질문 id
 *   P-11 필수 payload {mood_axis,state_priority,top_info,constraint,ia,pushback,delegation,audience} 중 빠진 키마다 index.skipped[] 에 'PRD 가 답함: …'
 *   P-12 kind:pattern 수 == references.md 과업 수(fast ≤2, full ≤agent_reference_patterns_max) 또는 references.md 에 '레퍼런스 없음'
 *   P-13 페이지 skeleton 집합 ⊆ prompts §6 정본 세트(fast/full)
 *   P-14 파일 크기 ≤ agent_gallery_html_kb_max
 *   P-15 frame 존재(app_title·cta 문자열) · questions 전건 effect("이걸 정하면 ○○가 달라집니다" 한 줄) ≥6자 (team-3 비교 후보 3)
 *   P-18 재검증 존재(I-3): verifies 가 붙은 질문 ≥1 이고 그 원 질문의 skeleton 이 Q5(fast) 또는 Q5·Q2(full) — §1-12. 없으면 FAIL
 *   P-19 서비스명 비노출(U-2/U-3): references.md '서비스' 열의 이름이 페이지 노출 텍스트(P-4 조각)에 0건
 *   P-20 always 대비쌍(I-3 두 번째 각도): 진술형 질문이 없는 축 — fast 는 밀도·형태·타이포·강조·채도 5축, full 은 타이포·채도 2축 — 마다 always:true 쌍 ≥1 (동의어: 밀도|정보량, 형태|모양, 타이포|서체|글자, 강조, 채도|진하기)
 *   P-21 자극 미감 QA(0-B ⑦) 리포트(--qa, 기본 design/verify/stimuli_qa.md): 존재 · 첫 줄 RENDER: png|none · 표 `| 타일 | 정렬 | 간격 | 색 역할 | 대비 | 근거 |` 에 타일 id 전건(fast 는 ≥min(6, 타일 수)) · 4항 전부 PASS(FAIL 타일이 남아 있으면 maker 되돌림 미완) · 근거 공백 0
 *   P-17 kind:pattern 의 options 전건 html(≥40자, 자리표시자 0) — 패턴은 글이 아니라 폰 프레임 그림으로 보인다(U-3)
 *   P-16 flows[].steps: 마지막을 뺀 전 장면에 press(≥2자) + 강조할 곳(html 에 data-press 또는 press == 그 장면의 cta) · states[] 항목마다 label·html ("따라가 보기" 투어, 후보 5)
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const FW = require('./lib/forbidden-words');
const ROOT = path.resolve(__dirname, '..');
function args(argv) { const o = {}; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; } return o; }
const A = Object.assign({
  'template-ref': 'HEAD:templates/interview_page.html', index: 'design/stimuli/gallery_index.json', state: 'design/state.json',
  refs: 'design/references.md', prompts: '.claude/skills/design-interview/references/interview_prompts.md', prd: 'design/prd_analysis.md',
}, args(process.argv));
if (!A.page) { console.error('--page <interview.html> 필요'); process.exit(2); }
const read = (p) => (p && fs.existsSync(p)) ? fs.readFileSync(p, 'utf8') : null;
const page = read(A.page);
if (page == null) { console.error('파일 없음: ' + A.page); process.exit(2); }
let state = null;
if (read(A.state) != null) { try { state = JSON.parse(read(A.state)); } catch (e) { console.error('state 파싱 실패: ' + A.state + ' — ' + e.message); process.exit(2); } }
const mode = state && state.mode === 'fast' ? 'fast' : 'full';
const caps = (state && (mode === 'fast' ? Object.assign({}, state.caps, state.caps_fast) : state.caps)) || {};
const cap = (k, d) => (caps[k] != null ? caps[k] : d);

/* index: gallery_index.json 이 없으면 페이지 옆 interview_index.json 으로 대체(0-B 이전 런의 파일명) */
let indexPath = A.index, indexNote = '';
if (!fs.existsSync(indexPath)) { const alt = path.join(path.dirname(A.page), 'interview_index.json'); if (fs.existsSync(alt)) { indexPath = alt; indexNote = 'gallery_index.json 없음 → interview_index.json 대체'; } else indexNote = 'index 파일 없음'; }
let index = null; try { const s = read(indexPath); if (s != null) index = JSON.parse(s); } catch (e) { indexNote = 'index JSON 파싱 실패: ' + e.message; }

const checks = []; const add = (id, ok, detail, evidence) => checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail, evidence });
const short = (arr, n = 6) => arr.slice(0, n).join(', ') + (arr.length > n ? ` 외 ${arr.length - n}` : '');
const chars = (s) => Array.from(String(s == null ? '' : s)).length;

/* ---- 마크다운 유틸 (check-brief 와 같은 섹션·표 규약) ---- */
function sectionsOf(md) { const secs = {}; let cur = null; for (const line of String(md || '').split('\n')) { const m = line.match(/^##\s+(\d+[a-z]?)\.\s+(.*)$/); if (m) { cur = m[1]; secs[cur] = []; continue; } if (cur) secs[cur].push(line); } return secs; }
function tables(txt) {
  const out = []; let t = null;
  for (const line of String(txt || '').split('\n')) {
    if (/^\s*\|/.test(line)) { if (/^\s*\|\s*:?-{2,}/.test(line)) continue; const cells = line.split('|').slice(1, -1).map((c) => c.trim()); if (!t) { t = { header: cells, rows: [] }; out.push(t); } else t.rows.push(cells); }
    else t = null;
  }
  return out;
}

/* ---- 색·스타일 유틸 ---- */
const NAMED = { white: '#ffffff', black: '#000000', red: '#ff0000', blue: '#0000ff', green: '#008000', gray: '#808080', grey: '#808080' };
const COLOR_TOKEN = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:white|black|red|blue|green|gray|grey|transparent)\b/gi;
function parseColor(v) {
  if (!v) return null; v = String(v).trim().toLowerCase(); if (NAMED[v]) v = NAMED[v];
  let m = v.match(/^#([0-9a-f]{3})$/); if (m) return m[1].split('').map((c) => parseInt(c + c, 16));
  m = v.match(/^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/); if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/); if (m) return [+m[1], +m[2], +m[3]];
  return null;
}
const firstColorToken = (v) => { const m = String(v || '').match(new RegExp(COLOR_TOKEN.source, 'i')); return m ? m[0] : null; };
function hsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2; if (max === min) return { h: 0, s: 0, l }; const d = max - min; const s = l > 0.5 ? d / (2 - max - min) : d / (max + min); let h; if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; return { h: h * 60, s, l }; }
function luminance([r, g, b]) { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
function contrast(a, b) { const A1 = parseColor(a), B1 = parseColor(b); if (!A1 || !B1) return null; const la = luminance(A1), lb = luminance(B1); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
const hex6 = (v) => { const c = parseColor(v); return c ? '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('') : null; };

function parseElems(html) {
  const out = [];
  for (const m of String(html || '').matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
    const st = (m[2].match(/style\s*=\s*(["'])(.*?)\1/i) || [])[2] || ''; const decls = [];
    for (const d of st.split(';')) { const i = d.indexOf(':'); if (i < 0) continue; const p = d.slice(0, i).trim().toLowerCase(), v = d.slice(i + 1).trim().toLowerCase().replace(/\s+/g, ' '); if (p) decls.push([p, v]); }
    out.push({ tag: m[1].toLowerCase(), decls });
  }
  return out;
}
const allDecls = (html) => parseElems(html).flatMap((e) => e.decls);
function fontParts(v) { const m = String(v).match(/(?:^|\s)((?:\d[\d.]*)(?:px|pt|em|rem|%)|(?:xx?-)?(?:small|large)|medium)(?:\s*\/\s*[\w.%]+)?\s+(.+)$/); return m ? { size: m[1], family: m[2].trim() } : null; }
function families(html) { const s = new Set(); for (const [p, v] of allDecls(html)) { if (p === 'font-family') s.add(v); else if (p === 'font') { const f = fontParts(v); if (f) s.add(f.family); } } return s; }
function radii(html) { const s = new Set(); for (const [p, v] of allDecls(html)) if (/^border(-[a-z]+)*-radius$/.test(p)) s.add(v); if (!s.size) s.add('(없음)'); return s; }
const rows = (html) => (String(html).match(/<(?:div|li|tr|p)\b/gi) || []).length + (String(html).match(/<br\b/gi) || []).length;
function chroma(html) { const out = []; for (const [, v] of allDecls(html)) for (const t of v.match(COLOR_TOKEN) || []) { const c = parseColor(t); if (c) out.push(hsl(c)); } return out; }
function meanHue(list) { const ch = list.filter((c) => c.s >= 0.05); if (!ch.length) return null; let x = 0, y = 0; for (const c of ch) { x += Math.cos(c.h * Math.PI / 180); y += Math.sin(c.h * Math.PI / 180); } return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; }
function hueDiff(a, b) { if (a == null || b == null) return (a == null) !== (b == null) ? 180 : 0; const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
function satSig(html) { const els = parseElems(html); let bg = null; if (els[0]) for (const [p, v] of els[0].decls) if (/^background(-color)?$/.test(p)) { const c = parseColor(firstColorToken(v)); if (c) bg = hsl(c).s; } const all = chroma(html).map((c) => c.s); return { bg, max: all.length ? Math.max(...all) : null }; }
function emphSig(html) {
  const els = parseElems(html); const w = new Set(), s = new Set(), c = new Set();
  els.forEach((e, i) => { for (const [p, v] of e.decls) { if (p === 'font-weight') w.add(v); if (p === 'font-size') s.add(v); if (p === 'font') { const f = fontParts(v); if (f) s.add(f.size); if (/\b(bold|[5-9]00)\b/.test(v)) w.add('bold'); } if (i > 0 && /^(color|background|background-color)$/.test(p)) c.add(p + ':' + v); } });
  const bold = els.filter((e) => e.tag === 'b' || e.tag === 'strong').length;
  return { w: [...w].sort(), s: [...s].sort(), c: [...c].sort(), bold };
}
const setEq = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const setStr = (s) => [...s].sort().join('/') || '(없음)';

/* 축 이름 → 검사 유형. SKILL 0-B 표의 6축. 이름으로 유형을 못 정하면 자극인지 판정할 수 없으므로 FAIL. */
const AXIS_TYPES = [
  ['typo', /타이포|서체|글꼴|글자|폰트|font/i, 'font-family'],
  ['shape', /형태|모양|둥글|각진|모서리|radius/i, 'border-radius'],
  ['density', /밀도|정보량|정보 량|촘촘|빽빽|간격|행 ?수/, '행 수'],
  ['temp', /색온도|온도|무드|따뜻|차가|warm|cool/i, 'hue'],
  ['sat', /채도|진하기|선명|농도|색진|옅/, 'saturation'],
  ['emphasis', /강조|돋보|눈에/, 'weight|size|색'],
];
const axisType = (name) => { for (const [t, re] of AXIS_TYPES) if (re.test(String(name || ''))) return t; return null; };
const AXIS_PROP = Object.fromEntries(AXIS_TYPES.map(([t, , p]) => [t, p]));
/* P-5: 변형 하나의 서명과 표시값 */
function sig(type, html) {
  if (type === 'typo') { const f = families(html); return { key: setStr(f), show: setStr(f) }; }
  if (type === 'shape') { const r = radii(html); return { key: setStr(r), show: setStr(r) }; }
  if (type === 'density') { const n = rows(html); return { key: n, show: n + '행' }; }
  if (type === 'temp') { const h = meanHue(chroma(html)); return { key: h, show: h == null ? '무채색' : Math.round(h) + '°' }; }
  if (type === 'sat') { const s = satSig(html); return { key: s, show: `bg ${s.bg == null ? '-' : s.bg.toFixed(2)}/max ${s.max == null ? '-' : s.max.toFixed(2)}` }; }
  const e = emphSig(html); return { key: JSON.stringify(e), show: `w[${e.w.join(',')}] s[${e.s.join(',')}] c[${e.c.length}] b${e.bold}` };
}
function differs(type, a, b) {
  if (type === 'temp') return hueDiff(a.key, b.key) >= 15;
  if (type === 'sat') { const A1 = a.key, B1 = b.key; const d = (x, y) => (x == null || y == null) ? ((x == null) !== (y == null)) : Math.abs(x - y) >= 0.1; return d(A1.bg, B1.bg) || d(A1.max, B1.max); }
  return a.key !== b.key;
}
/* P-6: 축 속성을 뺀 나머지 선언 집합 */
const ISOLATE = {
  typo: /^(font|font-family|font-size|font-weight|font-style|letter-spacing|line-height)$/,
  shape: /^(border(-[a-z]+)*|box-shadow|outline|padding(-[a-z]+)?)$/,
  density: /^(padding(-[a-z]+)?|margin(-[a-z]+)?|gap|row-gap|line-height|height|min-height)$/,
  emphasis: /^(font-weight|font-size|color|background|background-color|padding(-[a-z]+)?|border-radius|order|text-decoration|letter-spacing)$/,
};
function residual(type, html) {
  const set = new Set();
  for (let [p, v] of allDecls(html)) {
    if (type === 'temp' || type === 'sat') v = v.replace(COLOR_TOKEN, '#c');
    else if (ISOLATE[type] && ISOLATE[type].test(p)) continue;
    else if (type === 'emphasis' && p === 'font') { const f = fontParts(v); v = f ? f.family : v; }
    set.add(p + ':' + v);
  }
  return set;
}
/* P-9: 인라인 색 상속을 따라가며 텍스트 노드마다 대비를 잰다. .stim 컨테이너 기본은 background:#fff / color:#111 (골격 CSS). */
function contrastWalk(html) {
  const issues = []; let measured = 0, skipped = 0; const stack = [{ bg: '#ffffff', fg: '#111111' }];
  const re = /<\/?([a-z][a-z0-9]*)\b([^>]*)>|([^<]+)/gi; let m;
  while ((m = re.exec(String(html || '')))) {
    if (m[3] !== undefined) { const text = m[3].replace(/&nbsp;/g, ' ').trim(); if (!text) continue; const top = stack[stack.length - 1]; const c = contrast(top.fg, top.bg); if (c == null) { skipped++; continue; } measured++; if (c < 4.5) issues.push(`"${text.slice(0, 10)}" ${top.fg}/${top.bg} ${c.toFixed(2)}:1`); continue; }
    if (m[0][1] === '/') { if (stack.length > 1) stack.pop(); continue; }
    const tag = m[1].toLowerCase(), attrs = m[2] || ''; const isVoid = /^(br|img|hr|input|meta|link)$/.test(tag) || /\/\s*$/.test(attrs);
    const st = (attrs.match(/style\s*=\s*(["'])(.*?)\1/i) || [])[2] || ''; const top = stack[stack.length - 1]; let bg = top.bg, fg = top.fg;
    for (const d of st.split(';')) { const i = d.indexOf(':'); if (i < 0) continue; const p = d.slice(0, i).trim().toLowerCase(), v = d.slice(i + 1).trim(); if (p === 'color') fg = hex6(v); else if (p === 'background' || p === 'background-color') { const tok = firstColorToken(v); if (/transparent|none/i.test(v) && !tok) continue; bg = tok ? hex6(tok) : null; } }
    if (!isVoid) stack.push({ bg, fg });
  }
  return { issues, measured, skipped };
}
const PLACEHOLDER = /lorem ipsum|홍길동|항목 \d|제목을 입력/i;

/* ================= 검사 ================= */
/* P-0 템플릿 무변조 */
try { cp.execSync('git diff --quiet -- templates/', { stdio: 'ignore', cwd: ROOT }); add('P-0', true, 'templates/ 무변조', 'git diff --quiet -- templates/ → 0'); }
catch (e) { add('P-0', false, 'templates/ 가 변경됨 — git checkout -- templates/ (또는 커밋) 후 재검', 'git diff --quiet -- templates/ → ' + (e.status || 1)); }

/* P-1 골격 바이트 대조 */
/* 골격 첫 주석에도 '<script id="harness-data">' 문구가 있으므로 type="application/json" 까지 있는 진짜 블록만 잡는다(속성 순서 무관). */
const HD_RE = /<script\b(?=[^>]*\bid=["']harness-data["'])(?=[^>]*\btype=["']application\/json["'])[^>]*>[\s\S]*?<\/script>/;
function readTemplate(ref) { if (fs.existsSync(ref)) return fs.readFileSync(ref, 'utf8'); try { return cp.execSync('git show ' + JSON.stringify(ref), { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } }
const tpl = readTemplate(A['template-ref']);
if (tpl == null) add('P-1', false, `기준 골격을 읽지 못함: ${A['template-ref']}`, 'git show 실패 — ref 또는 경로 확인');
else if (!HD_RE.test(page)) add('P-1', false, '생성물에 <script id="harness-data"> 블록이 없음', A.page);
else {
  const a = tpl.replace(HD_RE, ''), b = page.replace(HD_RE, '');
  if (a === b) add('P-1', true, 'harness-data 블록 제외 골격 바이트 동일', `${a.length} bytes == ${b.length} bytes (기준 ${A['template-ref']})`);
  else { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; const line = (b.slice(0, i).match(/\n/g) || []).length + 1; add('P-1', false, `골격이 기준과 다름 (기준 ${a.length}B / 생성물 ${b.length}B)`, `첫 차이 offset ${i}, 생성물 줄 ${line}: "${b.slice(i, i + 40).replace(/\n/g, '⏎')}"`); }
}

/* P-2 JSON 과 개수 */
const hdm = page.match(new RegExp(HD_RE.source.replace('[\\s\\S]*?', '([\\s\\S]*?)')));
let D = null, jsonErr = hdm ? null : 'harness-data 블록 없음';
if (hdm) { try { D = JSON.parse(hdm[1]); } catch (e) { jsonErr = e.message; } }
const normSk = (s) => String(s).replace(/[′’]/g, "'").replace(/\s+/g, '');
function skel(q) { if (q && typeof q.skeleton === 'string' && q.skeleton.trim()) return normSk(q.skeleton); if (q && q.kind === 'pattern') return 'pattern'; const m = String((q && q.id) || '').match(/^Q-?0*(\d+)([a-z]?)$/i); return m ? 'Q' + m[1] + m[2].toLowerCase() : ''; }

if (!D) {
  add('P-2', false, 'harness-data JSON 무효', jsonErr);
  for (let n = 3; n <= 13; n++) add('P-' + n, false, 'harness-data JSON 무효 — 검사 불가', 'P-2 참조');
} else {
  const Q = Array.isArray(D.questions) ? D.questions : [], T = Array.isArray(D.tiles) ? D.tiles : [], P = Array.isArray(D.pairs) ? D.pairs : [], FL = Array.isArray(D.flows) ? D.flows : [];
  const qmax = cap('human_interview_questions_max', mode === 'fast' ? 10 : 12), tmax = cap('human_gallery_tiles_max', 24), pmax = cap('human_worldcup_rounds_max', 7), fsmax = cap('agent_flow_steps_max', 4);
  const p2 = [];
  if (Q.length > qmax) p2.push(`질문 ${Q.length} > ${qmax}`);
  if (skel(Q[0]) !== 'Q1') p2.push(`questions[0] 이 Q1 아님(${skel(Q[0]) || '없음'})`);
  if (skel(Q[1]) !== 'Q5') p2.push(`questions[1] 이 Q5 아님(${skel(Q[1]) || '없음'})`);
  if (T.length > tmax) p2.push(`타일 ${T.length} > ${tmax}`);
  if (P.length > pmax) p2.push(`대비쌍 ${P.length} > ${pmax}`);
  const bigFlow = FL.filter((f) => (Array.isArray(f.steps) ? f.steps.length : 0) > fsmax).map((f) => f.id);
  if (bigFlow.length) p2.push(`flows steps > ${fsmax}: ${bigFlow.join(',')}`);
  add('P-2', p2.length === 0, `JSON 유효 · 질문 ${Q.length}(≤${qmax}) · 타일 ${T.length}(≤${tmax}) · 쌍 ${P.length}(≤${pmax}) · 흐름 ${FL.length}`, p2.join('; ') || `[0]=${skel(Q[0])}, [1]=${skel(Q[1])}, mode ${mode}`);

  /* P-3 탈출구·장면·pushback·pattern 형식 */
  const p3 = [];
  Q.forEach((q) => {
    const id = q.id || '(id 없음)'; const opts = Array.isArray(q.options) ? q.options : [];
    if (q.unknown !== true) p3.push(`${id} unknown≠true`); if (q.free !== true) p3.push(`${id} free≠true`);
    opts.forEach((o, i) => { if (!o || !String(o.value || '').trim()) p3.push(`${id}.options[${i}] value 없음`); if (!o || chars(o.scene) < 8) p3.push(`${id}.options[${i}] scene ${chars(o && o.scene)}자 < 8`); });
    /* 결정형(§1-10·§1-14: Q2·Q10·Q11·Q11b·pattern)은 recommended·why 필수, 취향형(Q1·Q5·Q3 계열·Q6a)은 recommended 금지(앵커링) — 감사 지적: 있을 때만 검사하면 골든 Q-02 가 무검으로 통과했다 */
    const sk = normSk(String(q.skeleton || '')); const isDecision = !q.verifies && (q.kind === 'pattern' || ['Q2', 'Q10', 'Q11', 'Q11b'].includes(sk)); /* 재검증 질문(verifies)은 추천 없이 묻는다 — 앵커링 방지 */ const isTaste = ['Q1', 'Q5', 'Q3', 'Q3b', 'Q3c', 'Q6a', 'Q5b'].includes(sk);
    if (isDecision && q.kind !== 'pushback' && q.recommended == null) p3.push(`${id} 결정형(${sk || q.kind})인데 recommended 없음`);
    if (isTaste && q.recommended != null) p3.push(`${id} 취향형(${sk})에 recommended — 앵커링 금지`);
    if (q.kind !== 'pushback' && q.recommended != null) { if (!opts.some((o) => o && o.value === q.recommended)) p3.push(`${id} recommended(${q.recommended}) 가 options.value 에 없음`); if (!String(q.why || '').trim()) p3.push(`${id} 추천이 있는데 why 없음`); }
    if (q.kind === 'pushback') { if (opts.length !== 3) p3.push(`${id} pushback options ${opts.length} ≠ 3`); if (!opts.some((o) => o && o.value === q.recommended)) p3.push(`${id} recommended(${q.recommended == null ? '없음' : q.recommended}) 가 options.value 에 없음`); if (!String(q.why || '').trim()) p3.push(`${id} why 없음`); }
    if (q.kind === 'pattern' && opts.length < 2) p3.push(`${id} pattern options ${opts.length} < 2`);
  });
  FL.forEach((f) => { const id = f.id || '(flow id 없음)'; if (f.unknown !== true) p3.push(`${id} unknown≠true`); if (f.free !== true) p3.push(`${id} free≠true`); });
  add('P-3', p3.length === 0, `탈출구·장면 형식 위반 ${p3.length}건 (질문 ${Q.length}, 흐름 ${FL.length})`, short(p3) || `unknown/free 전건 true, scene ≥8자, pushback ${Q.filter((q) => q.kind === 'pushback').length}건 recommended·why 있음`);

  /* P-4 금지어·취향형 */
  const segs = [['title', D.title], ['intro', D.intro], ['banner', D.banner]];
  const FR = (D.frame && typeof D.frame === 'object') ? D.frame : {};
  segs.push(['frame.app_title', FR.app_title]); segs.push(['frame.cta', FR.cta]); (Array.isArray(FR.tabs) ? FR.tabs : []).forEach((t, i) => segs.push([`frame.tabs[${i}]`, t]));
  Q.forEach((q) => { segs.push([`${q.id}.text`, q.text]); if (q.effect) segs.push([`${q.id}.effect`, q.effect]); if (q.why) segs.push([`${q.id}.why`, q.why]); (q.options || []).forEach((o, i) => { segs.push([`${q.id}.options[${i}].value`, o && o.value]); segs.push([`${q.id}.options[${i}].scene`, o && o.scene]); if (o && o.html) segs.push([`${q.id}.options[${i}].html`, FW.stripTags(o.html)]); }); });
  const chromeSegs = (id, o) => { if (!o) return; if (typeof o.title === 'string') segs.push([`${id}.title`, o.title]); if (typeof o.cta === 'string') segs.push([`${id}.cta`, o.cta]); (Array.isArray(o.tabs) ? o.tabs : []).forEach((t, i) => segs.push([`${id}.tabs[${i}]`, t])); };
  T.forEach((t) => { segs.push([`${t.id}.html`, FW.stripTags(t.html || '')]); chromeSegs(t.id, t); });
  P.forEach((p, i) => ['left', 'right'].forEach((s) => { if (p[s]) { const pid = p[s].id || 'W-' + (i + 1) + '-' + s; segs.push([`${pid}.html`, FW.stripTags(p[s].html || '')]); chromeSegs(pid, p[s]); } }));
  FL.forEach((f) => { segs.push([`${f.id}.question`, f.question]); segs.push([`${f.id}.narrative`, f.narrative]); (f.steps || []).forEach((s, i) => { const sid = `${f.id}.steps[${i}]`; segs.push([`${sid}.label`, s && s.label]); segs.push([`${sid}.html`, FW.stripTags((s && s.html) || '')]); if (s) { ['press', 'then', 'now'].forEach((k) => { if (s[k]) segs.push([`${sid}.${k}`, s[k]]); }); chromeSegs(sid, s); (Array.isArray(s.states) ? s.states : []).forEach((st, j) => { segs.push([`${sid}.states[${j}].label`, st && st.label]); segs.push([`${sid}.states[${j}].html`, FW.stripTags((st && st.html) || '')]); }); } }); });
  const p4 = [];
  for (const [where, text] of segs) for (const h of FW.scanText(text)) p4.push(`${where}:「${h.word}」`);
  const taste = [];
  Q.forEach((q) => { if (FW.TASTE_PATTERN.test(String(q.text || ''))) taste.push(`${q.id}.text`); if (FW.OPEN_DECISION_PATTERN && FW.OPEN_DECISION_PATTERN.test(String(q.text || '')) && !/저는 .+(봅니다|보입니다)/.test(String(q.text || ''))) taste.push(`${q.id}.text:열린 결정 질문(추천 없이 '무엇을/몇 개/어떻게' — §1-10)`); (q.options || []).forEach((o, i) => { if (FW.TASTE_PATTERN.test(String((o && o.scene) || ''))) taste.push(`${q.id}.options[${i}].scene`); }); });
  add('P-4', p4.length === 0 && taste.length === 0, `금지어 ${p4.length}건 · 취향형 패턴 ${taste.length}건 (텍스트 조각 ${segs.length})`, [...p4, ...taste.map((t) => t + ':취향형')].slice(0, 8).join(', ') || `${(FW.ALL_WORDS || FW.FORBIDDEN_WORDS).length}개 단어 0건, TASTE_PATTERN 0건`);

  /* P-5·P-6 축 차이·축 격리 (타일은 축별로, 쌍은 W-n 별로) */
  const groups = [];
  const byAxis = {}; T.forEach((t) => { (byAxis[t.axis] = byAxis[t.axis] || []).push({ id: t.id, html: t.html || '' }); });
  for (const ax of Object.keys(byAxis)) groups.push({ name: ax, items: byAxis[ax] });
  P.forEach((p, i) => groups.push({ name: `${p.axis}(W-${i + 1})`, axis: p.axis, items: [['left', p.left], ['right', p.right]].filter(([, s]) => s).map(([s, v]) => ({ id: v.id || `W-${i + 1}-${s}`, html: v.html || '' })) }));
  const p5 = [], p5ok = [], p6 = [], p6ok = [];
  for (const g of groups) {
    const type = axisType(g.axis || g.name); const ids = g.items.map((x) => x.id).join(',');
    if (!type) { p5.push(`${g.name}[${ids}] 축 이름으로 유형 판정 불가(타이포/형태/밀도/색온도/채도/강조)`); p6.push(`${g.name} 유형 미상`); continue; }
    if (g.items.length < 2) { p5.push(`${g.name}[${ids}] 변형 1개`); continue; }
    const sigs = g.items.map((x) => sig(type, x.html)); let same = [];
    for (let i = 0; i < sigs.length; i++) for (let j = i + 1; j < sigs.length; j++) if (!differs(type, sigs[i], sigs[j])) same.push(`${g.items[i].id}=${g.items[j].id}`);
    const shown = `${g.name}[${ids}] ${AXIS_PROP[type]} ${sigs.map((s) => s.show).join(' vs ')}`;
    if (same.length) p5.push(shown + ' 동일'); else p5ok.push(shown);
    const res = g.items.map((x) => residual(type, x.html)); const leaks = [];
    for (let i = 1; i < res.length; i++) { const onlyA = [...res[0]].filter((d) => !res[i].has(d)), onlyB = [...res[i]].filter((d) => !res[0].has(d)); if (onlyA.length || onlyB.length) leaks.push(`${g.items[0].id}↔${g.items[i].id}: ${[...onlyA.map((d) => '-' + d), ...onlyB.map((d) => '+' + d)].slice(0, 4).join(' ')}`); }
    if (leaks.length) p6.push(`${g.name} ${leaks.join('; ')}`); else p6ok.push(g.name);
  }
  add('P-5', groups.length > 0 && p5.length === 0, `축 ${groups.length}개 중 자극이 아닌 축 ${p5.length}` + (groups.length ? '' : ' (타일·쌍 없음)'), short(p5, 4) || short(p5ok, 4));
  add('P-6', groups.length > 0 && p6.length === 0, `축 격리 위반 ${p6.length}건 (같은 축 변형의 나머지 선언이 다름)`, short(p6, 3) || `격리됨: ${short(p6ok, 8)}`);

  /* P-7 타일 요소 수 */
  const emax = cap('agent_gallery_tile_elements_max', 10);
  const p7 = T.map((t) => [t.id, (String(t.html || '').match(/<(?!br\b)[a-z][a-z0-9]*\b/gi) || []).length]).filter(([, n]) => n > emax);
  add('P-7', p7.length === 0, `타일 여는 태그 수 > ${emax} 인 타일 ${p7.length}건 (<br> 제외)`, p7.map(([id, n]) => `${id}:${n}`).join(', ') || `타일 ${T.length}장 전부 ≤${emax}`);

  /* P-8 자리표시자·도메인 명사 */
  const prd = read(A.prd); let nouns = null;
  if (prd != null) { const t1 = tables((sectionsOf(prd)['1'] || []).join('\n'))[0]; if (t1) nouns = new Set(t1.rows.flatMap((r) => String(r[0] || '').split(/[^가-힣A-Za-z0-9]+/)).filter((w) => w.length >= 2)); }
  const p8 = [];
  T.forEach((t) => { const txt = FW.stripTags(t.html || ''); if (PLACEHOLDER.test(txt)) p8.push(`${t.id} 자리표시자`); if (nouns && ![...nouns].some((w) => txt.includes(w))) p8.push(`${t.id} PRD 화면 명사 없음`); });
  FL.forEach((f) => (f.steps || []).forEach((s, i) => { if (PLACEHOLDER.test(FW.stripTags((s && s.html) || '') + ' ' + ((s && s.label) || ''))) p8.push(`${f.id}.steps[${i}] 자리표시자`); (s && Array.isArray(s.states) ? s.states : []).forEach((st, j) => { if (PLACEHOLDER.test(FW.stripTags((st && st.html) || '') + ' ' + ((st && st.label) || ''))) p8.push(`${f.id}.steps[${i}].states[${j}] 자리표시자`); }); }));
  add('P-8', p8.length === 0, `자리표시자·도메인 명사 위반 ${p8.length}건` + (nouns ? ` (명사 ${nouns.size}개 from ${A.prd} §1)` : ` (${A.prd} §1 화면표 없음 — 명사 검사 N/A)`), short(p8) || (nouns ? `타일 ${T.length}장 전부 PRD 명사 포함, 자리표시자 0` : '자리표시자 0'));

  /* P-9 대비 */
  const p9 = []; let measured = 0, skipped = 0;
  const stimuli = [...T.map((t) => [t.id, t.html]), ...P.flatMap((p, i) => ['left', 'right'].filter((s) => p[s]).map((s) => [p[s].id || `W-${i + 1}-${s}`, p[s].html])), ...FL.flatMap((f) => (f.steps || []).map((s, i) => [`${f.id}.steps[${i}]`, s && s.html]))];
  for (const [id, html] of stimuli) { const r = contrastWalk(html); measured += r.measured; skipped += r.skipped; r.issues.forEach((x) => p9.push(`${id} ${x}`)); }
  add('P-9', p9.length === 0, `대비 <4.5:1 텍스트 ${p9.length}건 (측정 ${measured}, hex 아님 N/A ${skipped})`, short(p9, 4) || (measured ? '전건 ≥4.5:1' : '측정 대상 없음'));

  /* P-10·P-13 prompts §6 정본 */
  const DEFAULT_PAYLOADS = ['mood_axis', 'top_info', 'density_axis', 'form_axis', 'emphasis_axis', 'borrow_scope', 'state_priority', 'dislike_list', 'expression_axis', 'constraint', 'audience', 'ia', 'edge_state', 'pushback', 'open_item', 'delegation', 'pattern']; /* §6 17종과 같게(감사 지적: form_axis·emphasis_axis 누락) */
  const prompts = read(A.prompts); let payloadSet = null, fullSet = new Set(), fastSet = new Set(), promptNote = '';
  if (prompts == null) promptNote = `${A.prompts} 없음 — 기본 집합`;
  else {
    const s6 = (sectionsOf(prompts)['6'] || []).join('\n'); const tbs = tables(s6); const main = tbs.find((t) => t.header.some((h) => /^#|캐내는|skeleton/i.test(h))) || tbs[0];
    if (main) {
      const pc = main.header.findIndex((h) => /payload/i.test(h));
      if (pc >= 0) { payloadSet = new Set(); main.rows.forEach((r) => (String(r[pc] || '').match(/[a-z][a-z_]+/g) || []).forEach((k) => payloadSet.add(k))); }
      main.rows.forEach((r) => { const c = String(r[0] || '').replace(/[*`]/g, '').trim(); const m = c.match(/^Q\d+[a-z]?['′’]?/i); if (m) fullSet.add(normSk('Q' + m[0].slice(1))); else if (/pattern/i.test(c)) fullSet.add('pattern'); });
      if (/kind\s*:?\s*pattern|\bpattern\b/i.test(s6)) fullSet.add('pattern');
    }
    /* fast 세트 = '### fast' 소절(다음 ### 전까지)의 '→' 순서 줄에 있는 Q 토큰만 — 소절의 산문('…는 fast 에 넣지 않는다')은 세지 않는다 */
    const fi = s6.search(/^###.*fast/mi);
    if (fi >= 0) { let ft = s6.slice(fi); const nx = ft.slice(1).search(/^###\s/m); if (nx >= 0) ft = ft.slice(0, nx + 1); const seq = ft.split('\n').filter((l) => l.includes('→')); const src = seq.length ? seq.join('\n') : ft; (src.match(/Q\d+[a-z]?['′’]?/g) || []).forEach((k) => fastSet.add(normSk(k))); if (/\bpattern\b/i.test(src)) fastSet.add('pattern'); }
    if (!payloadSet) promptNote = '§6 payload 열 없음 — 기본 집합';
    if (!fastSet.size) fastSet = fullSet;
  }
  if (!payloadSet) payloadSet = new Set(DEFAULT_PAYLOADS);
  const p10 = []; const seen = {};
  Q.forEach((q) => {
    const id = q.id || '(id 없음)';
    if (typeof q.skeleton !== 'string' || !q.skeleton.trim()) p10.push(`${id} skeleton 없음`);
    if (typeof q.payload !== 'string' || !q.payload.trim()) p10.push(`${id} payload 없음`);
    else { if (!payloadSet.has(q.payload)) p10.push(`${id} payload '${q.payload}' ∉ §6`); (seen[q.payload] = seen[q.payload] || []).push(id); }
  });
  /* 같은 payload 2건은 pushback·pattern, 그리고 재검증(verifies: <원 질문 id>, §6 재검증 규칙) 만 허용 */
  const qid = new Set(Q.map((q) => q.id));
  Q.forEach((q) => { if (q.verifies != null && (!qid.has(q.verifies) || q.verifies === q.id)) p10.push(`${q.id} verifies '${q.verifies}' 가 페이지의 다른 질문 id 가 아님`); });
  for (const k of Object.keys(seen)) { if (seen[k].length <= 1 || k === 'pushback' || k === 'pattern') continue; const rest = seen[k].filter((id) => !Q.some((q) => q.id === id && q.verifies && qid.has(q.verifies) && q.verifies !== q.id)); if (rest.length > 1) p10.push(`payload '${k}' 중복: ${seen[k].join(',')} (재검증이면 verifies 필요)`); }
  add('P-10', p10.length === 0, `skeleton·payload 위반 ${p10.length}건 (§6 payload 집합 ${payloadSet.size}개${promptNote ? ', ' + promptNote : ''})`, short(p10) || `payload: ${Q.map((q) => q.payload).join(', ')}`);

  /* P-11 필수 payload 8종 — 빠지면 index.skipped[] 에 'PRD 가 답함: …' */
  const REQUIRED = { mood_axis: 'Q1', state_priority: 'Q5', top_info: 'Q2', constraint: 'Q6', ia: 'Q8', pushback: 'Q11', delegation: 'Q12', audience: 'Q7' };
  const present = new Set(Q.map((q) => q.payload).filter(Boolean));
  const skippedList = (index && Array.isArray(index.skipped)) ? index.skipped : [];
  const justified = (key) => skippedList.some((e) => { const names = [key, REQUIRED[key], REQUIRED[key] + "'"]; if (typeof e === 'string') return names.some((n) => e.includes(n)) && /PRD\s?가 답함/.test(e); if (e && typeof e === 'object') { const idf = [e.payload, e.skeleton, e.id, e.key].filter(Boolean).map(String); const txt = [e.reason, e.why, e.note, e.text].filter(Boolean).join(' ') || JSON.stringify(e); return idf.some((x) => names.includes(normSk(x))) && /PRD\s?가 답함/.test(txt); } return false; });
  const missing = Object.keys(REQUIRED).filter((k) => !present.has(k)); const unjust = missing.filter((k) => !justified(k));
  add('P-11', unjust.length === 0, `필수 payload 8종 중 페이지에 없음 ${missing.length} · 그중 skipped[] 고지 없음 ${unjust.length}`, (unjust.length ? `고지 없음: ${unjust.join(', ')}` : (missing.length ? `전부 고지됨: ${missing.join(', ')}` : '8종 전부 페이지에 있음')) + (indexNote ? ` (${indexNote})` : ` (${indexPath})`));

  /* P-12 pattern 수 == references.md 과업 수 */
  const refs = read(A.refs); const patN = Q.filter((q) => q.kind === 'pattern').length; const patMax = cap('agent_reference_patterns_max', 6);
  if (refs == null) add('P-12', false, `references.md 없음 — kind:pattern ${patN}건의 근거를 셀 수 없음 (0-A2 미실행)`, A.refs);
  else if (/레퍼런스 없음/.test(refs)) add('P-12', patN === 0, `references.md '레퍼런스 없음' → pattern 0 기대, 실제 ${patN}`, A.refs);
  else {
    const tb = tables(refs).find((t) => t.header.some((h) => /과업|동사|T-n/i.test(h)));
    if (!tb) add('P-12', false, 'references.md 에 과업(동사) 열이 있는 표가 없음', A.refs);
    else { const ci = tb.header.findIndex((h) => /과업|동사|T-n/i.test(h)); const tasks = new Set(tb.rows.flatMap((r) => String(r[ci] || '').split(/[·,/、]+/)).map((s) => s.replace(/[*`()]/g, '').trim()).filter((s) => s && s !== '-')); const expected = Math.min(tasks.size, patMax); const capRelief = patN >= 1 && patN < expected && Q.length + (expected - patN) > qmax; /* §6: 질문 상한에 걸리면 pattern 을 줄인다(≥1) */ add('P-12', patN === expected || capRelief, `kind:pattern ${patN}건 == 기대 ${expected} (references 과업 ${tasks.size}, 상한 ${patMax}${mode === 'fast' ? ' fast' : ''}${capRelief ? ', 질문 상한 ' + qmax + ' 때문에 감축 허용' : ''})`, `과업: ${short([...tasks], 6)}`); }
  }

  /* P-13 skeleton ⊆ §6 세트 */
  const allowed = mode === 'fast' ? fastSet : fullSet;
  const p13 = Q.map((q) => [q.id, skel(q)]).filter(([, s]) => !allowed.has(s));
  add('P-13', allowed.size > 0 && p13.length === 0, `§6 ${mode} 세트 밖 skeleton ${p13.length}건` + (allowed.size ? '' : ' (정본 세트를 읽지 못함)'), p13.map(([id, s]) => `${id}:${s || '없음'}`).join(', ') || `페이지 {${Q.map(skel).join(',')}} ⊆ §6 {${[...allowed].join(',')}}`);
  /* P-15 frame + effect 한 줄 (team-3 비교 후보 3: "이걸 정하면 ○○가 달라집니다") */
  {
    const p15 = []; const FR15 = (D.frame && typeof D.frame === 'object') ? D.frame : null;
    if (!FR15) p15.push('frame 없음'); else { if (!String(FR15.app_title || '').trim()) p15.push('frame.app_title 없음'); if (FR15.cta !== false && !String(FR15.cta || '').trim()) p15.push('frame.cta 없음(없으면 false)'); }
    Q.forEach((q) => { if (chars(q.effect) < 6) p15.push(`${q.id} effect ${chars(q.effect)}자 < 6`); });
    add('P-15', p15.length === 0, `frame·effect 위반 ${p15.length}건 (질문 ${Q.length})`, short(p15) || `frame(${FR15 ? FR15.app_title : '-'}) 있음, 질문 전건 effect ≥6자`);
  }
  /* P-16 따라가 보기 투어: 마지막을 뺀 전 장면에 press + 강조할 곳, states 형식 */
  {
    const p16 = [];
    FL.forEach((f) => { const steps = Array.isArray(f.steps) ? f.steps : []; steps.forEach((s, i) => { const sid = `${f.id}.steps[${i}]`; if (!s) { p16.push(`${sid} 없음`); return; }
      if (i < steps.length - 1) { if (chars(s.press) < 2) p16.push(`${sid} press 없음(마지막 장면만 생략 가능)`); else if (!/data-press/.test(String(s.html || '')) && s.press !== s.cta) p16.push(`${sid} 강조할 곳 없음 — html 에 data-press 를 두거나 press 를 그 장면의 cta 와 같게`); }
      (Array.isArray(s.states) ? s.states : []).forEach((st, j) => { if (!st || chars(st.label) < 1 || !String(st.html || '').trim()) p16.push(`${sid}.states[${j}] label·html 필요`); }); }); });
    { const vq = Q.filter((q) => q.verifies); const byId = new Map(Q.map((q) => [q.id, q])); const tgt = vq.map((q) => normSk(String((byId.get(q.verifies) || {}).skeleton || '')));
    const need = mode === 'fast' ? ['Q5'] : ['Q5', 'Q2']; const missing = need.filter((k) => !tgt.includes(k));
    add('P-18', vq.length >= 1 && missing.length === 0, `재검증 질문 ${vq.length}건, 원 질문 ${tgt.join(',') || '없음'} (필요: ${need.join('·')})`, missing.length ? `재검증 없는 핵심 답: ${missing.join(', ')}` : vq.map((q) => `${q.id}→${q.verifies}`).join(', ')); }
  { const p19 = []; const refsTxt = read(A.refs) || ''; const names = []; let hdr = null;
    for (const line of refsTxt.split('\n')) { if (!/^\s*\|/.test(line)) continue; const cells = line.split('|').slice(1, -1).map((c) => c.trim()); if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; if (!hdr) { hdr = cells; continue; } const si = hdr.findIndex((h) => /서비스/.test(h)); if (si >= 0 && /^REF-/i.test(cells[0] || '')) { const nm = String(cells[si] || '').replace(/[*`]/g, '').trim(); if (nm.length >= 2) names.push(nm); } }
    const seen = new Set(names); const exposed = segs.map(([w, t]) => [w, String(t || '')]);
    for (const nm of seen) for (const [w, t] of exposed) if (t.includes(nm)) p19.push(`${w}:「${nm}」`);
    add('P-19', p19.length === 0, `references.md 서비스명 ${seen.size}개 중 페이지 노출 ${p19.length}건`, short(p19) || (seen.size ? '노출 0건' : 'references.md 서비스 열 없음/레퍼런스 없음')); }
  { const SYN = { '밀도': /밀도|정보량/, '형태': /형태|모양/, '타이포': /타이포|서체|글자/, '강조': /강조/, '채도': /채도|진하기/ }; const need20 = mode === 'fast' ? ['밀도', '형태', '타이포', '강조', '채도'] : ['타이포', '채도'];
    const alwaysAxes = P.filter((p) => p && p.always === true).map((p) => String(p.axis || '')); const miss20 = need20.filter((k) => !alwaysAxes.some((a) => SYN[k].test(a)));
    add('P-20', miss20.length === 0, `always 쌍 ${alwaysAxes.length}개 (필요 축 ${need20.join('·')})`, miss20.length ? `always 쌍 없는 축: ${miss20.join(', ')}` : `always: ${alwaysAxes.join(', ')}`); }
  { const qaPath = A.qa || 'design/verify/stimuli_qa.md'; const qa = read(qaPath); const tileIds = T.map((t) => t.id);
    if (qa == null) add('P-21', false, `자극 미감 QA 리포트 없음 — 0-B ⑦ 미실행 (${qaPath})`, qaPath);
    else { const p21 = []; if (!/^RENDER:\s*(png|none)\b/m.test(qa)) p21.push('첫 줄 RENDER: png|none 없음');
      const rows = []; let hdr = null; for (const line of qa.split('\n')) { if (!/^\s*\|/.test(line)) continue; const cells = line.split('|').slice(1, -1).map((c) => c.trim()); if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; if (!hdr) { hdr = cells; continue; } rows.push(cells); }
      const ci = (re) => hdr ? hdr.findIndex((h) => re.test(h)) : -1; const iT = ci(/타일/), i4 = [ci(/정렬/), ci(/간격/), ci(/색/), ci(/대비/)], iW = ci(/근거/);
      if (!hdr || iT < 0 || i4.some((i) => i < 0) || iW < 0) p21.push('표 헤더에 타일·정렬·간격·색 역할·대비·근거 열 필요');
      else { const seen = new Set(rows.map((r) => r[iT])); const need = mode === 'fast' ? Math.min(6, tileIds.length) : tileIds.length; const covered = tileIds.filter((id) => seen.has(id)).length; if (covered < need) p21.push(`타일 ${covered}/${need} 만 판정`);
        rows.forEach((r) => { const bad = i4.filter((i) => !/^PASS$/i.test(r[i] || '')); if (bad.length) p21.push(`${r[iT]}: ${bad.map((i) => hdr[i]).join('·')} FAIL/공백 — maker 되돌림 뒤 재판정`); if (!(r[iW] || '').trim()) p21.push(`${r[iT]}: 근거 없음`); }); }
      add('P-21', p21.length === 0, `미감 QA 위반 ${p21.length}건 (표 ${rows.length}행, 타일 ${tileIds.length})`, short(p21) || `타일 전건 4항 PASS (${qaPath})`); } }
  { const p17 = []; Q.filter((q) => q.kind === 'pattern').forEach((q) => (q.options || []).forEach((o, i) => { const h = String((o && o.html) || ''); if (h.trim().length < 40) p17.push(`${q.id}.options[${i}] html ${h.trim().length}자 < 40`); else if (PLACEHOLDER.test(FW.stripTags(h))) p17.push(`${q.id}.options[${i}] 자리표시자`); }));
    add('P-17', p17.length === 0, `패턴 선택지 그림 위반 ${p17.length}건 (pattern 질문 ${Q.filter((q) => q.kind === 'pattern').length})`, short(p17) || '패턴 선택지 전건 html 있음'); }
  add('P-16', p16.length === 0, `투어 형식 위반 ${p16.length}건 (흐름 ${FL.length})`, short(p16) || (FL.length ? `전 장면 press·강조 위치 있음` : '흐름 없음'));
  }
}

/* P-14 파일 크기 */
const kb = Buffer.byteLength(page, 'utf8') / 1024, kbMax = cap('agent_gallery_html_kb_max', 200);
add('P-14', kb <= kbMax, `파일 ${kb.toFixed(1)}KB (≤${kbMax}KB)`, `wc -c ${A.page} → ${Buffer.byteLength(page, 'utf8')}`);

/* 리포트 */
const passed = checks.every((c) => c.status === 'PASS');
const L = [`# 인터뷰 페이지 발행 전 검사 (scripts/check-interview-page.js, ${new Date().toISOString()})`, '', `- page: ${A.page} · template-ref: ${A['template-ref']} · index: ${indexPath}${indexNote ? ' (' + indexNote + ')' : ''} · mode: ${state ? mode : '- (state 없음 → full)'}`, `- 결과: **${passed ? 'PASS' : 'FAIL'}** (${checks.filter((c) => c.status === 'PASS').length}/${checks.length})`, '', '| 항목 | 결과 | 내용 | 근거 |', '|---|---|---|---|'];
for (const c of checks) L.push(`| ${c.id} | ${c.status} | ${String(c.detail).replace(/\|/g, '/').replace(/\n/g, ' ')} | ${String(c.evidence).replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 200)} |`);
const out = L.join('\n') + '\n';
if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, out); }
console.log(out);
process.exit(passed ? 0 : 1);
