#!/usr/bin/env node
/**
 * 2단계 HTML 초안 정적 검사기 — 승인 전 게이트. 결정론(LLM 아님).
 * 왜: 세는 일은 판단이 아니라 산술이다. 스크립트가 세고, design-worker 는 실행만 한다(D-30 처방을 2단계에도 적용).
 *
 * 사용법: node scripts/check-html.js --drafts design/drafts [--brief design/brief.md] [--stimuli design/stimuli]
 *         [--tokens-css design/drafts/tokens.css] [--state design/state.json] [--frame 390x844]
 *         [--format text|json] [--out design/verify/html_check.md]
 *         (--out 이 .json 이면 JSON, 그 외는 check-brief.js 와 같은 표 | 항목 | 결과 | 내용 | 근거 |)
 * 종료 코드: 0 전건 PASS(WARN 허용) / 1 FAIL 있음 / 2 입력 오류
 *
 * 검사 대상 glob: screen_*.html(화면) · axis*.html(2-B 축 후보) · compare_axis*.html·index.html(사용자에게 열리는 페이지)
 *   · --stimuli 디렉터리의 design_guide_compare.html(1-C 세트 선택 페이지, H-13 만)
 *
 * 검사 항목 (layout_rules.md "빌드가 거부" + c_checks C-5/C-7/C-8 의 grep 가능분 + 실측 D-9·D-11·D-14·D-26·D-34):
 *   H-1  var(--x) 참조가 tokens.css 에 선언되어 있는가                          (L-9)        [screen·axis·page]
 *   H-2  루트에 word-break: keep-all 이 있는가                                   (L-7)        [screen·axis]
 *   H-3  overflow-wrap: anywhere 를 쓰지 않았는가                                (L-13)       [screen·axis]
 *   H-4  tokens.css 밖에 hex·px 리터럴이 없는가 — 예외는 #fff/#ffffff 뿐, #000 은 H-16 (토큰 규율) [screen·axis·page]
 *   H-5  루트 프레임 폭이 전 화면 동일하고 --frame 폭과 같은가 (높이는 내용에 따라 다름) (D-11·D-14·D-34)
 *   H-6  data-state="normal|empty|long" 섹션이 전부 있는가                       (상태 3종)
 *   H-7  고정 높이 + overflow:hidden 이면서 스크롤 컨테이너가 없는가 (경고)        (L-8)
 *   H-8  "Lorem ipsum" / "제목을 입력" 류 자리표시자가 없는가                     (C-5)        [screen·axis·page]
 *   H-9  주 행동(data-role=primary-action)이 하단 고정 바(data-fixed=bottom) 안이거나 above-fold 선언인가 (D-26)
 *   H-10 스크롤 영역을 overflow:hidden + 고정 높이로 절단하지 않는가              (D-26·D-34)
 *   H-11 [--brief] §2 매핑 열에서 F\d+|P-\d+ 수집 → 각 번호의 담당 행 # 에 screen_<nn>_*.html 존재, §2 전 행에 파일 (U-1·U-4)
 *   H-12 [--brief] §2c 여정·필수 플로우 표의 담당 화면 # 각각 파일 존재 — 화면 없이 사유만 있으면 WARN, 둘 다 없으면 FAIL (U-4)
 *   H-13 compare_axis*·index·design_guide_compare 의 사용자 노출 텍스트에 금지어 0건 — 정본 scripts/lib/forbidden-words.js 14개 (V-1)
 *   H-14 index.html 의 <a href="screen_…"> 고유 링크 집합 == screen 파일 집합                                          (2-F)
 *   H-15 screen_* 마다 data-role="top-info" 정확히 1개, data-fold 이전 또는 data-fixed 안,
 *        그 요소의 font-size 가 var(--typography-scale-(heading|display)-…) 참조                                   (U-5 1등 정보)
 *   H-16 C-5/C-8 grep: gradient 배경 WARN(hue 2종 이상 FAIL) · backdrop-filter FAIL · aria-hidden 밖 이모지 FAIL
 *        · color:#000|#000000|black FAIL · box-shadow 1종인데 card 류 ≥3 WARN · repeat(3 WARN                      (V-3)
 *   H-17 tokens.css --typography-scale-heading-1-size / --typography-scale-body-size ≥ 1.5                         (C-7 제목/본문 배율)
 * L-6 라벨 폭 예산·L-8 높이 초과량은 렌더가 필요하므로 여기서 계산하지 않는다(judge + 브라우저).
 * --state 는 mode 표기용(상한을 쓰는 항목이 생기면 caps/caps_fast 를 여기서 읽는다).
 */
const fs = require('fs'); const path = require('path');
let FW = null; try { FW = require('./lib/forbidden-words'); } catch (e) { FW = null; }
/* scripts/lib/forbidden-words.js 가 아직 없을 때만 쓰는 대체 목록(정본과 같은 14개, check-brief.js 와 동일). 목록을 여기서 따로 늘리지 않는다 — 정본은 그 파일이다. */
const FW_FALLBACK = ['정보 밀도', '위계', '톤앤매너', '그리드', '여백', '대비', '무드', '컨셉', '미니멀', '모던', '레이아웃', '컴포넌트', '플로우', '\\bIA\\b'];
const FW_SOURCE = (FW && typeof FW.scanText === 'function') ? 'scripts/lib/forbidden-words.js 정본' : '대체 목록 14개(정본 모듈 없음)';
const scanForbidden = (s) => (FW && typeof FW.scanText === 'function') ? (FW.scanText(s || '') || [])
  : [...(s || '').matchAll(new RegExp(FW_FALLBACK.join('|'), 'g'))].map((m) => ({ word: m[0], index: m.index, context: (s || '').slice(Math.max(0, m.index - 15), m.index + 15) }));
function args(argv) { const o = { format: 'text', frame: '390x844' }; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; } return o; }
const A = args(process.argv);
if (!A.drafts) { console.error('--drafts <dir> 필요'); process.exit(2); }
if (!fs.existsSync(A.drafts) || !fs.statSync(A.drafts).isDirectory()) { console.error('drafts 디렉터리 없음: ' + A.drafts); process.exit(2); }
if (A.brief && !fs.existsSync(A.brief)) { console.error('brief 없음: ' + A.brief); process.exit(2); }
if (A.stimuli && !fs.existsSync(A.stimuli)) { console.error('stimuli 디렉터리 없음: ' + A.stimuli); process.exit(2); }
if (!/^\d+x\d+$/.test(A.frame)) { console.error('--frame 은 WxH 형식이어야 한다: ' + A.frame); process.exit(2); }
const state = A.state && fs.existsSync(A.state) ? JSON.parse(fs.readFileSync(A.state, 'utf8')) : null;

/* ---- 입력 수집 ---- */
const tokensCss = A['tokens-css'] || path.join(A.drafts, 'tokens.css');
const tokensSrc = fs.existsSync(tokensCss) ? fs.readFileSync(tokensCss, 'utf8') : '';
const declared = new Set(); const tokenMap = new Map();
for (const m of tokensSrc.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;}]*)/g)) { declared.add(m[1]); tokenMap.set(m[1], m[2].trim()); }
const all = fs.readdirSync(A.drafts).filter((f) => /\.html$/i.test(f)).sort();
const screens = all.filter((f) => /^screen_.*\.html$/.test(f));
const axes = all.filter((f) => /^axis.*\.html$/.test(f));
const pages = all.filter((f) => /^compare_axis.*\.html$/.test(f) || f === 'index.html');
const files = screens.concat(axes);
const [FRW] = A.frame.split('x').map(Number);
const report = { frame: A.frame, drafts: A.drafts, brief: A.brief || null, stimuli: A.stimuli || null, mode: state ? state.mode : null, files: { screen: screens.length, axis: axes.length, page: pages.length }, tokens_css: !!tokensSrc, checks: [], passed: true };
function add(id, file, status, detail, evidence) { report.checks.push({ id, file, status, detail, evidence: evidence || '' }); if (status === 'FAIL') report.passed = false; }
const read = (f) => fs.readFileSync(path.join(A.drafts, f), 'utf8');

/* ---- 공통 유틸 ---- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
/* 텍스트 노드·노출 속성 수집. script/style/template/주석 제외, aria-hidden 조상 여부를 같이 준다. */
function walkHtml(src) {
  const texts = [], attrs = [], stack = []; const re = /<!--[\s\S]*?-->|<[!?][^>]*>|<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)([^>]*)>/g;
  const hidden = () => stack.some((s) => s.hidden); let last = 0, m;
  while ((m = re.exec(src))) {
    if (m.index > last) texts.push({ text: src.slice(last, m.index), hidden: hidden() });
    last = re.lastIndex;
    if (m[2]) { const t = m[2].toLowerCase(); let i = stack.length - 1; while (i >= 0 && stack[i].tag !== t) i--; if (i >= 0) stack.length = i; }
    else if (m[3]) {
      const t = m[3].toLowerCase(), at = m[4] || ''; const h = /\baria-hidden\s*=\s*["']?true["']?/i.test(at);
      for (const am of at.matchAll(/\b(placeholder|title|alt|aria-label)\s*=\s*"([^"]*)"/gi)) attrs.push({ text: am[2], hidden: hidden() || h });
      if (!VOID.has(t) && !/\/\s*$/.test(at)) stack.push({ tag: t, hidden: h });
    }
  }
  if (last < src.length) texts.push({ text: src.slice(last), hidden: hidden() });
  return { texts, attrs };
}
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
function visibleText(src) { const w = walkHtml(src); return decode(w.texts.map((t) => t.text).concat(w.attrs.map((a) => a.text)).join('\n')); }
/* aria-hidden 밖 텍스트의 이모지(©·®·™ 같은 활자 기호는 제외) */
function emojiOutsideHidden(src) { const hits = []; for (const t of walkHtml(src).texts) if (!t.hidden) for (const m of t.text.matchAll(/\p{Extended_Pictographic}/gu)) if (!/[©®™]/.test(m[0])) hits.push(m[0]); return hits; }
/* <style> 블록의 규칙 목록 {sel, decl} */
function cssRules(src) { const rules = []; for (const sm of src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) { const css = sm[1].replace(/\/\*[\s\S]*?\*\//g, ''); for (const rm of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) rules.push({ sel: rm[1].trim(), decl: rm[2] }); } return rules; }
/* idx 위치가 attrRe 속성을 가진 열린 요소 안에 있는가(같은 태그명의 열림/닫힘 수로 판정) */
function insideTag(src, idx, attrRe) {
  const opens = [...src.slice(0, idx).matchAll(/<([a-zA-Z][\w:-]*)\b([^>]*)>/g)].filter((m) => attrRe.test(m[2]) && !/\/\s*$/.test(m[2]));
  for (const o of opens.reverse()) { const seg = src.slice(o.index + o[0].length, idx); const op = (seg.match(new RegExp('<' + o[1] + '\\b', 'gi')) || []).length, cl = (seg.match(new RegExp('</' + o[1] + '\\s*>', 'gi')) || []).length; if (op >= cl) return true; }
  return false;
}
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* var(--x[, fallback]) 를 tokens.css + 파일 내 선언으로 해석 */
function resolveVar(v, map, depth) { depth = depth || 0; if (depth > 8 || !v) return v || ''; return v.replace(/var\(\s*--([\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (all, name, fb) => { const val = map.get(name); if (val != null && val !== '') return resolveVar(val, map, depth + 1); return fb != null ? resolveVar(fb.trim(), map, depth + 1) : all; }); }
const NAMED = { red: [255, 0, 0], blue: [0, 0, 255], green: [0, 128, 0], purple: [128, 0, 128], pink: [255, 192, 203], orange: [255, 165, 0], yellow: [255, 255, 0], cyan: [0, 255, 255], magenta: [255, 0, 255], violet: [238, 130, 238], indigo: [75, 0, 130], teal: [0, 128, 128], navy: [0, 0, 128] };
function parseColor(s) {
  s = String(s).trim().toLowerCase(); let r, g, b, m;
  if ((m = s.match(/^#([0-9a-f]{3,4})$/))) { const h = m[1]; r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16); }
  else if ((m = s.match(/^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/))) { const h = m[1]; r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16); }
  else if ((m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/))) { r = +m[1]; g = +m[2]; b = +m[3]; }
  else if ((m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%/))) return { h: +m[1] % 360, s: +m[2] / 100 };
  else if (/^(white|black|transparent|gray|grey|silver)$/.test(s)) return { h: 0, s: 0 };
  else if (NAMED[s]) [r, g, b] = NAMED[s];
  else return null;
  r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2; let h = 0, sat = 0;
  if (d > 0.0001) { sat = d / (1 - Math.abs(2 * l - 1)); if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h = (h * 60 + 360) % 360; }
  return { h, s: sat };
}
/* linear/radial/conic-gradient(...) 호출 전문(괄호 균형) */
function gradients(src) { const out = []; const re = /(?:linear|radial|conic)-gradient\(/g; let m; while ((m = re.exec(src))) { let i = re.lastIndex, depth = 1; while (i < src.length && depth > 0) { if (src[i] === '(') depth++; else if (src[i] === ')') depth--; i++; } out.push(src.slice(m.index, i)); re.lastIndex = i; } return out; }
const colorTokens = (s) => s.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|var\(\s*--[\w-]+(?:\s*,[^()]*(?:\([^()]*\)[^()]*)*)?\)|\b(?:white|black|red|blue|green|purple|pink|orange|yellow|cyan|magenta|violet|indigo|teal|navy|gray|grey|silver|transparent)\b/gi) || [];
function hueClusters(hues, tol) { const kept = []; for (const h of hues) if (!kept.some((k) => Math.min(Math.abs(k - h), 360 - Math.abs(k - h)) < tol)) kept.push(h); return kept.length; }
/* hex 리터럴: &#…; 엔티티·href="#…"·url(#…)·id 선택자(#x {) 제외. 예외는 #fff/#ffffff 뿐. */
const HEX_RE = /(?<!&|href=["']|url\()#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b(?![\w-]|\s*[\{.,>+~\[:])/gi;   // id 선택자(#abc .x {, #add-btn {) 제외
function hexPx(src) { const body = src.replace(/<style[^>]*data-tokens[^>]*>[\s\S]*?<\/style>/g, ''); return { hex: (body.match(HEX_RE) || []).filter((h) => !/^#(fff|ffffff)$/i.test(h)), px: (body.match(/\b\d{2,4}px\b/g) || []).length }; }

/* ---- H-1 · H-4 · H-8: screen·axis·page 공통 ---- */
function commonChecks(f, src) {
  const local = new Set(declared); for (const m of src.matchAll(/--([a-zA-Z0-9-]+)\s*:/g)) local.add(m[1]);
  const undef = new Set(); for (const m of src.matchAll(/var\(--([a-zA-Z0-9-]+)/g)) if (!local.has(m[1])) undef.add(m[1]);
  add('H-1', f, undef.size ? 'FAIL' : 'PASS', undef.size ? '미선언 변수: ' + Array.from(undef).join(', ') : 'var 전부 선언됨', `var(--x) 참조 ${(src.match(/var\(--/g) || []).length}건 vs 선언 ${local.size}개`);
  const { hex, px } = hexPx(src);
  add('H-4', f, hex.length ? 'FAIL' : (px > 6 ? 'WARN' : 'PASS'), `hex 리터럴 ${hex.length}건${hex.length ? ' (' + Array.from(new Set(hex)).slice(0, 5).join(', ') + ')' : ''}, px 리터럴 ${px}건(프레임·상태바 규격 외에는 0 이어야; hex 예외는 #fff 뿐, #000 은 H-16)`, 'tokens.css·<style data-tokens> 제외 grep');
  const ph = src.match(/lorem ipsum|제목을 입력|텍스트를 입력|placeholder text/i);
  add('H-8', f, ph ? 'FAIL' : 'PASS', ph ? '자리표시자 텍스트: ' + ph[0] : '자리표시자 없음', '/lorem ipsum|제목을 입력|텍스트를 입력|placeholder text/i');
}

/* ---- H-15: 1등 정보 요소 ---- */
function topInfoCheck(f, src) {
  const tis = [...src.matchAll(/<([a-zA-Z][\w:-]*)\b([^>]*?)\bdata-role\s*=\s*"top-info"([^>]*)>/g)];
  if (tis.length !== 1) { add('H-15', f, 'FAIL', `data-role="top-info" 가 ${tis.length}개 (정확히 1개 — brief §2 '이 화면의 1등 정보' 요소)`, 'grep data-role="top-info"'); return; }
  const m = tis[0], idx = m.index, tag = m[1].toLowerCase(), attrs = m[2] + ' ' + m[3];
  /* 위치: data-fixed 안이거나, 같은 data-state 섹션의 data-fold 마커보다 앞 */
  let pos, posDetail;
  if (insideTag(src, idx, /\bdata-fixed\s*=/)) { pos = 'PASS'; posDetail = 'data-fixed 안'; }
  else {
    const secStart = Math.max(0, src.slice(0, idx).lastIndexOf('data-state=')); const nextSec = src.indexOf('data-state=', idx); const secEnd = nextSec < 0 ? src.length : nextSec;
    const foldIn = src.slice(secStart, secEnd).search(/\bdata-fold\b/); const foldAny = /\bdata-fold\b/.test(src);
    if (foldIn >= 0) { const foldIdx = secStart + foldIn; pos = idx < foldIdx ? 'PASS' : 'FAIL'; posDetail = idx < foldIdx ? 'data-fold 이전' : 'data-fold 이후 — 스크롤해야 보인다'; }
    else { pos = 'FAIL'; posDetail = foldAny ? '같은 data-state 섹션에 data-fold 마커 없음 — normal 섹션마다 844 위치 마커 필수' : 'data-fold 마커 없음 — normal 섹션에 844 위치 마커 필수(2-C 규칙), 없으면 첫 화면 안 여부를 셀 수 없다'; }
  }
  /* font-size: 인라인 style 또는 class/id/tag/[data-role] 선택자 규칙 */
  const classes = ((attrs.match(/\bclass\s*=\s*"([^"]*)"/) || [, ''])[1]).split(/\s+/).filter(Boolean); const id = (attrs.match(/\bid\s*=\s*"([^"]*)"/) || [, ''])[1]; const inline = (attrs.match(/\bstyle\s*=\s*"([^"]*)"/) || [, ''])[1];
  const sizes = [...inline.matchAll(/font-size\s*:\s*([^;]+)/gi)].map((x) => x[1].trim());
  for (const r of cssRules(src)) {
    const hit = classes.some((c) => new RegExp('\\.' + escRe(c) + '(?![\\w-])').test(r.sel)) || (id && new RegExp('#' + escRe(id) + '(?![\\w-])').test(r.sel)) || /\[data-role\s*=\s*"?top-info"?\]/.test(r.sel) || new RegExp('(^|[\\s,>+~])' + escRe(tag) + '(?![\\w-])').test(r.sel);
    if (hit) for (const x of r.decl.matchAll(/font-size\s*:\s*([^;]+)/gi)) sizes.push(x[1].trim());
  }
  const scaleOk = sizes.some((s) => /var\(\s*--typography-scale-(heading|display)-/.test(s));
  const fs_ = scaleOk ? 'PASS' : 'FAIL', fsDetail = scaleOk ? 'font-size 가 heading/display 스케일 참조' : (sizes.length ? 'font-size 가 heading/display 스케일이 아님: ' + sizes.slice(0, 3).join(' | ') : 'font-size 미지정(상속) — 1등 정보는 --typography-scale-(heading|display)-… 이어야');
  const st = (pos === 'FAIL' || fs_ === 'FAIL') ? 'FAIL' : (pos === 'WARN' ? 'WARN' : 'PASS');
  add('H-15', f, st, `top-info 1개(<${tag}${classes.length ? ' .' + classes.join('.') : ''}>) · 위치: ${posDetail} · ${fsDetail}`, `top-info offset ${idx}; 선택자 대조 class/id/tag/[data-role]`);
}

/* ---- H-16: C-5/C-8 grep ---- */
function slopCheck(f, src) {
  const items = []; let st = 'PASS'; const bump = (s) => { if (s === 'FAIL') st = 'FAIL'; else if (s === 'WARN' && st !== 'FAIL') st = 'WARN'; };
  const local = new Map(tokenMap); for (const m of src.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;}]*)/g)) local.set(m[1], m[2].trim());
  const grads = gradients(src);
  if (grads.length) {
    const hues = []; let unresolved = 0;
    for (const g of grads) for (const c of colorTokens(g)) { const r = resolveVar(c, local); if (/var\(/.test(r)) { unresolved++; continue; } const p = parseColor(r); if (p && p.s > 0.08) hues.push(p.h); }
    const distinct = hueClusters(hues, 15); const s = distinct >= 2 ? 'FAIL' : 'WARN'; bump(s);
    items.push(`[${s}] gradient 배경 ${grads.length}건(유채색 hue ${distinct}종${unresolved ? ', 미해석 var ' + unresolved : ''}) — C-5 그라디언트`);
  }
  const bf = (src.match(/backdrop-filter\s*:/gi) || []).length; if (bf) { bump('FAIL'); items.push(`[FAIL] backdrop-filter ${bf}건 — C-5 glassmorphism`); }
  const em = emojiOutsideHidden(src); if (em.length) { bump('FAIL'); items.push(`[FAIL] aria-hidden 밖 이모지 ${em.length}건(${Array.from(new Set(em)).slice(0, 5).join(' ')}) — C-5 이모지 아이콘`); }
  const blk = [...src.matchAll(/(?<![\w-])color\s*:\s*(#000000|#000|black)\b/gi)]; if (blk.length) { bump('FAIL'); items.push(`[FAIL] color:${Array.from(new Set(blk.map((x) => x[1]))).join('/')} ${blk.length}건 — C-8 순수 검정 텍스트`); }
  const shadows = new Set([...src.matchAll(/box-shadow\s*:\s*([^;}]+)/gi)].map((x) => x[1].replace(/\s+/g, ' ').trim())); const cards = (src.match(/class\s*=\s*"[^"]*card/gi) || []).length;
  if (shadows.size === 1 && cards >= 3) { bump('WARN'); items.push(`[WARN] box-shadow 1종인데 card 류 ${cards}개 — C-5 동일 그림자(elevation 위계 없음)`); }
  const rep = (src.match(/repeat\(\s*3\b/g) || []).length; if (rep) { bump('WARN'); items.push(`[WARN] repeat(3 ${rep}건 — C-5 3열 균등 그리드`); }
  add('H-16', f, st, items.length ? items.join('; ') : 'C-5/C-8 grep 슬롭 패턴 없음', 'gradient · backdrop-filter · \\p{Extended_Pictographic} · color:#000 · box-shadow/card · repeat(3');
}

/* ---- H-13: 사용자 노출 텍스트 금지어 ---- */
function forbiddenCheck(f, src) {
  const text = visibleText(src); const hits = scanForbidden(text);
  add('H-13', f, hits.length ? 'FAIL' : 'PASS', hits.length ? `금지어 ${hits.length}건: ` + Array.from(new Set(hits.map((h) => h.word || String(h)))).join(', ') : '사용자 노출 텍스트 금지어 0건', hits.length ? hits.slice(0, 3).map((h) => String(h.context || h.word || h).replace(/\s+/g, ' ').slice(0, 40)).join(' / ') : `본문 ${text.replace(/\s+/g, ' ').trim().length}자 스캔(script·style·주석 제외, placeholder·title·alt·aria-label 포함) · ${FW_SOURCE}`);
}

/* ---- screen·axis 파일 ---- */
if (!tokensSrc) add('H-1', '(all)', 'FAIL', 'tokens.css 없음', tokensCss);
const frames = new Map();
for (const f of files) {
  const src = read(f);
  commonChecks(f, src);
  add('H-2', f, /word-break\s*:\s*keep-all/.test(src) ? 'PASS' : 'FAIL', 'word-break: keep-all', '/word-break\\s*:\\s*keep-all/');
  add('H-3', f, /overflow-wrap\s*:\s*anywhere/.test(src) ? 'FAIL' : 'PASS', 'overflow-wrap: anywhere 금지', '/overflow-wrap\\s*:\\s*anywhere/');
  const fm = src.match(/data-frame\s*=\s*"(\d+)x(\d+)"/) || src.match(/\.screen\s*\{[^}]*width\s*:\s*(\d+)px[^}]*height\s*:\s*(\d+)px/);
  const fw = fm ? fm[1] : null; frames.set(f, fw);
  add('H-5', f, fw === String(FRW) ? 'PASS' : 'FAIL', fw ? `프레임 폭 ${fw} (기대 ${FRW}; 높이 ${fm[2]} 는 내용에 따라 자유)` : '루트 프레임 규격 미표기 — data-frame="WxH" 또는 .screen{width;height} 필요', 'data-frame="WxH" | .screen{width;height}');
  const states = ['normal', 'empty', 'long'].filter((s) => !new RegExp(`data-state\\s*=\\s*"${s}"`).test(src));
  if (/^screen_/.test(f)) add('H-6', f, states.length ? 'FAIL' : 'PASS', states.length ? '누락 상태: ' + states.join(', ') : '상태 3종 존재', 'data-state="normal|empty|long"');
  const h7 = /overflow\s*:\s*hidden/.test(src) && !/overflow(-y)?\s*:\s*auto|scroll/.test(src);
  add('H-7', f, h7 ? 'WARN' : 'PASS', h7 ? '고정 높이+hidden 인데 스크롤 컨테이너 없음 → 무음 절단 가능' : 'overflow:hidden 없음 또는 스크롤 컨테이너 있음', 'overflow:hidden 有 · overflow:auto|scroll 無');
  if (/^screen_/.test(f)) {
    const noPrimary = /data-no-primary\s*=\s*"true"/.test(src);
    const pa = [...src.matchAll(/<[^>]+data-role\s*=\s*"primary-action"[^>]*>/g)];
    if (noPrimary) add('H-9', f, 'PASS', '주 행동 없음 선언(data-no-primary)', 'data-no-primary="true"');
    else if (pa.length !== 1) add('H-9', f, 'FAIL', `data-role="primary-action" 가 ${pa.length}개 (정확히 1개, 없으면 data-no-primary="true")`, 'grep data-role="primary-action"');
    else {
      const idx = src.indexOf(pa[0][0]);
      const before = src.slice(0, idx);
      const opens = (before.match(/data-fixed\s*=\s*"bottom"/g) || []).length;
      const inFixed = opens > 0 && /data-fixed\s*=\s*"bottom"/.test(before.slice(Math.max(0, before.lastIndexOf('data-fixed'))));
      const aboveFold = /data-above-fold\s*=\s*"true"/.test(pa[0][0]);
      add('H-9', f, (inFixed || aboveFold) ? 'PASS' : 'FAIL', inFixed ? '주 행동이 하단 고정 바 안' : aboveFold ? '주 행동 above-fold 선언 (judge 가 스크린샷으로 확인)' : '주 행동이 하단 고정 바 밖이고 above-fold 선언도 없음 — 스크롤/잘림 위험', `primary-action offset ${idx}`);
    }
    const cut = /\.(?:content|scroll|body|list)[^{]*\{[^}]*(?:height\s*:\s*\d+px|max-height\s*:\s*\d+px)[^}]*overflow(?:-y)?\s*:\s*hidden/.test(src) || /overflow(?:-y)?\s*:\s*hidden[^}]*(?:height|max-height)\s*:\s*\d+px/.test(src);
    add('H-10', f, cut ? 'FAIL' : 'PASS', cut ? '스크롤 영역을 고정 높이 + overflow:hidden 으로 절단 — 프레임이 길어져야 한다' : '내용 절단 없음', '고정 height + overflow:hidden 조합 grep');
    topInfoCheck(f, src);
  }
  slopCheck(f, src);
}
const distinct = new Set(Array.from(frames.values()));
if (distinct.size > 1) add('H-5', '(all)', 'FAIL', '화면 간 프레임 폭 불일치: ' + Array.from(distinct).join(' / '), 'frames map');

/* ---- 사용자에게 열리는 페이지: compare_axis*·index (+ stimuli/design_guide_compare) ---- */
for (const f of pages) { const src = read(f); commonChecks(f, src); forbiddenCheck(f, src); }
if (A.stimuli) {
  const p = path.join(A.stimuli, 'design_guide_compare.html');
  if (fs.existsSync(p)) forbiddenCheck('stimuli/design_guide_compare.html', fs.readFileSync(p, 'utf8'));
  else add('H-13', 'stimuli/design_guide_compare.html', 'FAIL', 'design_guide_compare.html 없음(--stimuli 지정됨) — 1-C 세트 선택 페이지', p);
}

/* ---- H-14 index.html 링크 집합 == screen 파일 집합 ---- */
{
  const ip = path.join(A.drafts, 'index.html');
  if (!fs.existsSync(ip)) add('H-14', 'index.html', 'FAIL', 'index.html 없음 — 전 화면 링크 + 흐름 순서 페이지 필요(2-F)', ip);
  else {
    const isrc = fs.readFileSync(ip, 'utf8');
    const links = new Set([...isrc.matchAll(/<a\b[^>]*\bhref\s*=\s*["'](?:\.\/)?(screen_[^"'#?]+\.html)/gi)].map((m) => m[1]));
    const missingFile = Array.from(links).filter((l) => !screens.includes(l)); const unlinked = screens.filter((s) => !links.has(s));
    const ok = links.size === screens.length && !missingFile.length && !unlinked.length;
    add('H-14', 'index.html', ok ? 'PASS' : 'FAIL', `<a href="screen_…"> 고유 링크 ${links.size} vs screen 파일 ${screens.length}${missingFile.length ? '; 파일 없는 링크: ' + missingFile.join(', ') : ''}${unlinked.length ? '; 링크 없는 화면: ' + unlinked.join(', ') : ''}`, `links: ${Array.from(links).join(', ') || '없음'}`);
  }
}

/* ---- H-11 · H-12 brief 대조 ---- */
if (A.brief) {
  const brief = fs.readFileSync(A.brief, 'utf8');
  const sections = {}; let cur = null;
  for (const line of brief.split('\n')) { const m = line.match(/^##\s+(\d+[a-z]?)\.\s+(.*)$/); if (m) { cur = m[1]; sections[cur] = []; continue; } if (cur) sections[cur].push(line); }
  const sec = (id) => sections[id] ? sections[id].join('\n') : '';
  const table = (txt) => { const lines = txt.split('\n').filter((l) => /^\s*\|/.test(l) && !/^\s*\|\s*-{2,}/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim())); return { header: lines[0] || [], rows: lines.slice(1).filter((cells) => cells.some((c) => c && !/^(TODO|예:.*)$/.test(c))) }; };
  const col = (header, re, dflt) => { const i = header.findIndex((h) => re.test(h)); return i >= 0 ? i : dflt; };
  const screenNums = new Map(); for (const s of screens) { const m = s.match(/^screen_(\d+)/); if (m) screenNums.set(parseInt(m[1], 10), s); }
  /* 셀에서 화면 번호만: F3·P-01·S-2·T-1·§2 같은 ID 는 제거 */
  const refNums = (cell) => Array.from(new Set(((cell || '').replace(/[A-Za-z§]+-?\d+[a-z]?/g, ' ').match(/\d+/g) || []))).map(Number);
  /* H-11 */
  const t2 = table(sec('2')); const iNo = col(t2.header, /^#$/, 0), iMap = col(t2.header, /매핑/, Math.max(0, t2.header.length - 1));
  if (!sections['2'] || !t2.rows.length) add('H-11', '(brief §2)', 'FAIL', '§2 화면표에 데이터 행 없음', A.brief);
  else {
    const rows = t2.rows.map((c) => { const n = parseInt((c[iNo] || '').replace(/\D/g, ''), 10); return { n, name: c[1] || '', file: screenNums.get(n) || null, ids: (c[iMap] || '').match(/\bF\d+\b|\bP-\d+\b/g) || [] }; });
    const noFile = rows.filter((r) => !r.file), noName = rows.filter((r) => !r.name);
    const ids = new Map(); for (const r of rows) for (const id of r.ids) { if (!ids.has(id)) ids.set(id, []); ids.get(id).push(r); }
    const idMissing = Array.from(ids).filter(([, rs]) => !rs.some((r) => r.file)).map(([id, rs]) => `${id}(행 ${rs.map((r) => r.n).join(',')})`);
    const extra = Array.from(screenNums).filter(([n]) => !rows.some((r) => r.n === n)).map(([, f]) => f);
    const st = (noFile.length || idMissing.length || noName.length) ? 'FAIL' : ((extra.length || !ids.size) ? 'WARN' : 'PASS');
    add('H-11', '(brief §2)', st, `§2 ${rows.length}행 / screen 파일 ${screens.length}개 / 매핑 번호(F·P) ${ids.size}개${noFile.length ? '; 파일 없는 행: ' + noFile.map((r) => `#${r.n} ${r.name}`.trim()).join(', ') : ''}${noName.length ? '; 화면명 없는 행: #' + noName.map((r) => r.n).join(',#') : ''}${idMissing.length ? '; 화면 없는 번호: ' + idMissing.join(', ') : ''}${extra.length ? '; §2 밖 파일: ' + extra.join(', ') : ''}${!ids.size ? '; 매핑 열에 F·P 번호 0개(check-brief B-3 확인)' : ''}`, `§2 매핑 열 /F\\d+|P-\\d+/ → ${Array.from(ids.keys()).join(' ') || '없음'}; 행→파일 screen_<nn>_*`);
  }
  /* H-12 */
  if (!sections['2c']) add('H-12', '(brief §2c)', 'FAIL', '§2c 사용자 여정·필수 플로우 커버리지 표 없음', A.brief);
  else {
    const t = table(sec('2c')); const iScr = col(t.header, /담당 화면/, 2), iWhy = col(t.header, /사유/, 3);
    if (!t.rows.length) add('H-12', '(brief §2c)', 'FAIL', '§2c 표에 데이터 행 없음', A.brief);
    else {
      const fails = [], warns = []; let ok = 0;
      for (const c of t.rows) {
        const item = (c[0] || '').slice(0, 20); const nums = refNums(c[iScr]); const why = (c[iWhy] || '').trim();
        if (nums.length) { const miss = nums.filter((n) => !screenNums.has(n)); if (miss.length) fails.push(`${item}: 화면 #${miss.join(',#')} 파일 없음`); else ok++; }
        else if (why) warns.push(`${item}: 화면 없음(사유: ${why.slice(0, 30)})`);
        else fails.push(`${item}: 담당 화면·사유 둘 다 없음`);
      }
      add('H-12', '(brief §2c)', fails.length ? 'FAIL' : (warns.length ? 'WARN' : 'PASS'), `§2c ${t.rows.length}행 — 화면 파일 확인 ${ok}, 사유만 ${warns.length}, 미충족 ${fails.length}${fails.length ? ': ' + fails.join('; ') : ''}${warns.length ? '; ' + warns.join('; ') : ''}`, `담당 화면 # 열(${iScr}) → screen_<nn>_* 존재; 사유 열(${iWhy})`);
    }
  }
} else {
  add('H-11', '(brief §2)', 'WARN', '--brief 미지정 — §2 PRD 매핑·화면 존재 검사 생략', '2-G 는 --brief design/brief.md 로 실행해야 한다');
  add('H-12', '(brief §2c)', 'WARN', '--brief 미지정 — §2c 여정·필수 플로우 화면 검사 생략', '2-G 는 --brief design/brief.md 로 실행해야 한다');
}

/* ---- H-17 tokens.css 제목/본문 배율 ---- */
{
  const H1 = 'typography-scale-heading-1-size', BODY = 'typography-scale-body-size';
  const num = (k) => { const r = resolveVar(tokenMap.get(k) || '', tokenMap); const m = r.match(/-?\d+(?:\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
  const h1 = num(H1), body = num(BODY);
  if (!tokensSrc) add('H-17', 'tokens.css', 'FAIL', 'tokens.css 없음 — 배율 계산 불가', tokensCss);
  else if (isNaN(h1) || isNaN(body) || body <= 0) add('H-17', 'tokens.css', 'FAIL', `--${H1}(${tokenMap.get(H1) || '없음'}) / --${BODY}(${tokenMap.get(BODY) || '없음'}) 가 숫자가 아님`, 'tokens.css grep');
  else add('H-17', 'tokens.css', h1 / body >= 1.5 ? 'PASS' : 'FAIL', `제목/본문 배율 ${h1}/${body} = ${(h1 / body).toFixed(2)} (≥1.5, C-7 위계)`, `--${H1}: ${tokenMap.get(H1)} · --${BODY}: ${tokenMap.get(BODY)}`);
}

/* ---- 리포트 ---- */
const idNum = (c) => parseInt(c.id.slice(2), 10);
report.checks.sort((a, b) => idNum(a) - idNum(b) || String(a.file).localeCompare(String(b.file)));
const cnt = (s) => report.checks.filter((c) => c.status === s).length;
const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '/').replace(/\n/g, ' ');
const L = [`# 2단계 HTML 초안 검사 (scripts/check-html.js, ${new Date().toISOString()})`, '',
  `- drafts: ${A.drafts} · brief: ${A.brief || '-'} · stimuli: ${A.stimuli || '-'} · tokens.css: ${report.tokens_css ? '있음' : '없음'} · frame: ${A.frame} · mode: ${report.mode || '-'}`,
  `- 파일: screen ${screens.length} / axis ${axes.length} / page ${pages.length}`,
  `- 결과: **${report.passed ? 'PASS' : 'FAIL'}** (PASS ${cnt('PASS')} / WARN ${cnt('WARN')} / FAIL ${cnt('FAIL')}, 총 ${report.checks.length}) — ${report.passed ? '통과' : '미통과 — 승인 화면을 열지 않는다'}`,
  '', '| 항목 | 결과 | 내용 | 근거 |', '|---|---|---|---|'];
for (const c of report.checks) L.push(`| ${c.id} (${esc(c.file)}) | ${c.status} | ${esc(c.detail)} | ${esc(c.evidence).slice(0, 160)} |`);
const md = L.join('\n') + '\n';
if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, /\.json$/i.test(A.out) ? JSON.stringify(report, null, 2) : md); }
console.log(A.format === 'json' ? JSON.stringify(report, null, 2) : md);
process.exit(report.passed ? 0 : 1);
