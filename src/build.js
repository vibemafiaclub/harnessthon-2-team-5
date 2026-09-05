#!/usr/bin/env node
/** 시안 빌드. design.md → project.rules.json → 토큰 → 컴포넌트 → 화면 순으로만 값이 흐른다.
 * 빌드 마지막에 규칙을 스스로 검사하고, 위반이 있으면 파일을 쓰지 않는다(fail-closed). */
const fs = require('fs');
const { execFileSync } = require('child_process');
const C = require('./components');
const SCREENS = require('./screens');
const { T, guide, RULES_PATH } = C;

execFileSync('node', ['src/tokens/build-tokens.js', RULES_PATH], { stdio: 'inherit' });
const tokensCss = fs.readFileSync('src/tokens/tokens.css', 'utf8');
const compCss = fs.readFileSync('src/styles/components.css', 'utf8');

const pageCss = `
body { background: var(--c-surface); color: var(--c-foreground); font-family: var(--f-ui); }
.page { max-width: 1400px; margin: 0 auto; padding: var(--sp-32) var(--sp-24); }
h1 { font-size: var(--fs-h4); font-weight: var(--fw-h4); line-height: var(--lh-h4); margin: var(--sp-8) 0; }
.eyebrow { font-size: var(--fs-bodysmall); color: var(--c-muted); }
.lede { color: var(--c-body); font-size: var(--fs-bodysmall); line-height: var(--lh-bodysmall); max-width: 74ch; margin: 0; }
.board { display: flex; flex-wrap: wrap; gap: var(--sp-32); margin-top: var(--sp-32); align-items: flex-start; }
.art { width: var(--vw); }
.cap { display: flex; flex-direction: column; gap: var(--sp-4); padding-bottom: var(--sp-8); }
.cap .h { display: flex; align-items: baseline; gap: var(--sp-8); }
.cap .n { font-size: var(--fs-bodysmall); color: var(--c-primary); font-variant-numeric: tabular-nums; }
.cap .t { font-size: var(--fs-body); font-weight: var(--fw-bodystrong); }
.cap .p { margin-left: auto; font-size: var(--fs-bodysmall); color: var(--c-muted); }
.cap .d { font-size: var(--fs-bodysmall); color: var(--c-muted); line-height: var(--lh-bodysmall); }
.gal { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--sp-16); margin-top: var(--sp-16); }
.cell { background: var(--c-canvas); border: 1px solid var(--c-border); border-radius: var(--r-8);
  padding: var(--sp-16); display: flex; flex-direction: column; gap: var(--sp-8); align-items: flex-start; }
.cell .k { font-size: var(--fs-bodysmall); color: var(--c-muted); }
.cell.wide { grid-column: 1 / -1; }
.grade { font-size: var(--fs-bodysmall); color: var(--c-muted); }
.grade b { color: var(--c-foreground); font-weight: var(--fw-bodystrong); }
footer { margin-top: var(--sp-32); padding-top: var(--sp-24); border-top: 1px solid var(--c-border);
  color: var(--c-muted); font-size: var(--fs-bodysmall); line-height: var(--lh-bodysmall); max-width: 74ch; }
code { font-family: ui-monospace, Menlo, monospace; }
`;
const page = (title, body) => `<title>${title}</title>\n<style>\n${tokensCss}\n${compCss}\n${pageCss}\n</style>\n${body}\n`;

/* ---------- 화면 ---------- */
const screensHtml = page('청첩장모임 스케줄러 화면', `<div class="page">
<div class="eyebrow">Screen Preview · mobile-product · ${T.viewport.mobile.width}×${T.viewport.mobile.height}</div>
<h1>청첩장모임 스케줄러</h1>
<p class="lede">화면 ${SCREENS.length}개는 <code>src/screens/*.js</code>가 <code>src/components</code>를 조립한 결과입니다.
값은 <code>docs/wedding-scheduler/design.md</code> → <code>project.rules.json</code>에서만 흘러옵니다.
검증된 색은 10개, 그림자 토큰은 0개, semantic 색은 <code>danger</code> 하나입니다. 예시 데이터입니다.</p>
<div class="board">${SCREENS.map(s => `<figure class="art"><figcaption class="cap">`
  + `<div class="h"><span class="n">${s.n}</span><span class="t">${s.title}</span><span class="p">${s.prd}</span></div>`
  + `<div class="d">${s.note}</div></figcaption>${s.frame}</figure>`).join('')}</div>
<footer>이 시안은 A·C 게이트를 아직 통과하지 않았습니다. 판정은 <code>design-qa</code> 에이전트가,
Figma 반영은 <code>figma-implement</code> 에이전트가 맡습니다.</footer></div>`);

/* ---------- 컴포넌트 ---------- */
const cell = (k, h, wide) => `<div class="cell${wide ? ' wide' : ''}"><span class="k">${k}</span>${h}</div>`;
const sec = (t, grade, note, cells) => `<div class="sec" style="padding-top:var(--sp-32)"><span class="t">${t}</span>`
  + `<span class="r">${grade}</span></div><p class="lede">${note}</p><div class="gal">${cells.join('')}</div>`;

const componentsHtml = page('컴포넌트 라이브러리', `<div class="page">
<div class="eyebrow">Component Library · design.md §4</div>
<h1>컴포넌트</h1>
<p class="lede">각 컴포넌트에 증거 등급을 붙였습니다. <b>reference</b>는 참조 시스템에서 검증된 것,
<b>extension</b>은 PRD를 충족하려고 새로 만든 것입니다. 두 가지를 섞어 표시하지 않습니다.</p>

${sec('Button', 'reference', 'documented 4단계 크기만. 로딩 중 너비 유지. 마케팅 표면 높이(40·46)는 코드가 거부합니다.', [
  cell('xlarge 56 / r16', C.Button('11월 8일로 확정')),
  cell('large 48 / r14', C.Button('확정', { size: 'large' })),
  cell('medium 38 / r10', C.Button('알림', { size: 'medium' })),
  cell('small 32 / r8', C.Button('알림', { size: 'small' })),
  cell('pressed', C.Button('확정', { state: 'pressed' })),
  cell('disabled', C.Button('확정', { state: 'disabled' })),
  cell('loading — 너비 유지', C.Button('확정하는 중', { state: 'loading' })),
  cell('focus', C.Button('확정', { state: 'focus' })),
  cell('weak', C.Button('더 기다리기', { fill: 'weak' })),
  cell('light', C.Button('그대로 두기', { fill: 'light' })),
  cell('fill · danger', C.Button('모임 삭제', { tone: 'danger' })),
  cell('weak · danger', C.Button('모임 삭제', { fill: 'weak', tone: 'danger' })),
])}

${sec('Text Field', 'reference', 'box·line 변형과 focus·error·disabled·read-only 상태.', [
  cell('box / default', C.Field({ label: '이름', value: '이현우' }), true),
  cell('box / focus', C.Field({ label: '이름', value: '이현우', state: 'focus' }), true),
  cell('box / error', C.Field({ label: '연락처', placeholder: '010-0000-0000', error: '이미 등록된 번호예요. 강태호님과 같은 번호입니다.' }), true),
  cell('box / disabled', C.Field({ label: '연락처', value: '010-2431-8890', state: 'disabled' }), true),
  cell('box / read-only', C.Field({ label: '등록일', value: '2026년 9월 5일', state: 'readonly' }), true),
  cell('line', C.Field({ label: '검색', placeholder: '이름 또는 관계', variant: 'line' }), true),
])}

${sec('Badge', 'reference geometry + extension 배정', 'danger 외 semantic 색 값이 문서화되어 있지 않아, 상태를 fill/weak와 중성 명도로 구분합니다.', [
  cell('확정 — weak · Surface', C.Badge('confirmed')),
  cell('마감 임박 — fill · Foreground', C.Badge('due', { label: 'D-2' })),
  cell('겹침 — weak · Danger + 아이콘', C.Badge('conflict')),
  cell('다녀옴 — weak · Muted', C.Badge('done')),
  cell('양가 — weak · Body', C.Badge('both')),
  cell('회신 대기 — 뱃지 없음', '<span class="grade">문장으로만 표시합니다</span>'),
  cell('xsmall / small / medium', [C.Badge('confirmed', { size: 'xsmall' }), C.Badge('confirmed', { size: 'small' }), C.Badge('confirmed', { size: 'medium' })].join(' ')),
])}

${sec('Agreement / Check', 'reference', 'checked·unchecked·disabled. 이 프로젝트에서는 다중 선택에도 같은 컨트롤을 씁니다(extension 용도).', [
  cell('unchecked', C.Check()), cell('checked', C.Check({ on: true })), cell('disabled', C.Check({ disabled: true })),
])}

${sec('List Row', 'extension', '카드가 아닙니다. Border 1px 구분선과 정렬로 구조를 만들고 최소 높이 56px.', [
  cell('person', C.Row({ lead: C.Avatar('현우'), name: '이현우', sub: '직장 · 대학 · 신랑 쪽', trail: '모임 2', rowName: 'Row/person' }), true),
  cell('person / selected', C.Row({ lead: C.Check({ on: true }), name: '최유진', sub: '대학', state: 'selected', rowName: 'Row/person' }), true),
  cell('person / disabled', C.Row({ lead: C.Check({ disabled: true }), name: '김 부장', sub: '직장 · 1:1', trail: '따로 뵙기', state: 'disabled', rowName: 'Row/person' }), true),
  cell('event / confirmed', C.Row({ name: '동네 친구들', sub: '낮 12:00 · 5명', trail: C.Badge('confirmed'), rowName: 'Row/event' }), true),
  cell('event / conflict', C.Row({ name: '회사 팀 저녁', sub: '오후 7:00 · 김 부장님 1:1', trail: C.Badge('conflict'), tone: 'danger', rowName: 'Row/event/conflict' }), true),
  cell('date', C.Row({ name: '11월 8일 토', sub: '오후 6:00', trail: C.Tally({ y: 3, none: 2 }), rowName: 'Row/date' }), true),
])}

${sec('Day Gutter', 'extension', 'PRD §4-5 "특정 날짜에 겹치는지"를 축으로 만든 구조입니다.', [
  cell('weekend / weekday', C.Day({ d: '8', w: '토', weekend: true, items: [
    C.Row({ name: '양가 상견례', sub: '오후 6:00', trail: C.Badge('confirmed'), rowName: 'Row/event' })] })
    + C.Day({ d: '18', w: '화', items: [C.Row({ name: '전 직장 선배', sub: '오후 7:30 · 1:1', trail: '3일째', rowName: 'Row/event' })] }), true),
])}

${sec('Owner Mark', 'extension', '신랑/신부를 색이 아니라 테두리 스타일과 라벨로 구분합니다. 검증된 색이 부족해 색 구분은 애초에 불가능합니다.', [
  cell('groom — 실선', C.Person('이현우', { ini: '현우' })),
  cell('bride — 파선', C.Person('박지현', { owner: 'bride', ini: '지현' })),
  cell('note 지정', C.Person('김 부장', { ini: '부장', note: '신랑 · 1:1' })),
  cell('muted', C.Person('한서연', { owner: 'bride', ini: '서연', note: '무응답', muted: true })),
  cell('Avatar groom / bride', C.Avatar('현우') + ' ' + C.Avatar('지현', { owner: 'bride' })),
])}

<footer>이 갤러리는 화면과 같은 코드에서 렌더됩니다. <code>variant-state-coverage</code>는 blocker이지만
v0 검사기가 미구현이라 <code>guide/README.md</code> 규약에 따라 사람 게이트로 승격되며, 이 페이지가 그 육안 확인 대상입니다.</footer></div>`);


/* ---------- 라벨 폭 가드 — 버튼이 접히는 것을 눈이 아니라 빌드가 잡는다 ----------
 * 한글 1자 ≈ 1em, 라틴·숫자 ≈ 0.55em 으로 근사한다. 근사치이므로 여유 8px를 둔다. */
function labelWidth(text, fontSize) {
  let w = 0;
  for (const ch of text) {
    if (/[\uAC00-\uD7A3\u3130-\u318F]/.test(ch)) w += fontSize;        // 한글
    else if (/\s/.test(ch)) w += fontSize * 0.28;
    else w += fontSize * 0.55;                                          // 라틴·숫자·기호
  }
  return Math.ceil(w);
}
function checkActionBars(html, label) {
  const out = [];
  const SAFETY = 8;
  const frameW = T.viewport.mobile.width;
  for (const m of html.matchAll(/<div class="actionbar"[^>]*>([\s\S]*?)<\/div>\s*(?:<nav|<\/div>)/g)) {
    const inner = m[1];
    const btns = [...inner.matchAll(/<button class="btn"([^>]*)>([\s\S]*?)<\/button>/g)];
    if (!btns.length) continue;
    const gap = 8;
    const track = frameW - 2 - 2 * 16 - gap * (btns.length - 1);
    /* 보조(flex:0 1 auto)는 콘텐츠 폭을 먼저 가져가고, 주(flex:1 1 auto)가 나머지를 갖는다 */
    const parsed = btns.map((b) => {
      const text = (b[2].match(/<span>([^<]*)<\/span>/) || [, ''])[1];
      const hasIcon = /<svg/.test(b[2]);
      const size = /data-size="small"/.test(b[1]) ? T.typography.scale.BodySmall.size
        : T.typography.scale.Button.size;
      const chrome = 2 * T.control.button_padding_x + (hasIcon ? 20 + 8 : 0);
      return { text, size, chrome, primary: /data-fill="fill"/.test(b[1]),
               need: labelWidth(text, size) + SAFETY };
    });
    const secondaryTotal = parsed.filter(p => !p.primary)
      .reduce((a, p) => a + p.need + p.chrome, 0);
    const primaries = parsed.filter(p => p.primary);
    for (const p of parsed) {
      const avail = p.primary
        ? Math.floor((track - secondaryTotal) / Math.max(primaries.length, 1)) - p.chrome
        : track - p.chrome;
      if (p.need > avail)
        out.push(`${label}: 버튼 "${p.text}" 라벨 ${p.need}px > 가용 ${avail}px — 줄바꿈으로 깨진다`);
    }
  }
  return out;
}

/* ---------- 사후 검증 — 위반이 있으면 파일을 쓰지 않는다 ---------- */
const errors = [];
const allowed = new Set(Object.values(T.color._roles).map(v => v.toLowerCase()));
const refPalette = (T._reference_palette?.values || []).map(v => v.toLowerCase());
if (!refPalette.length) { console.error('빌드 거부: _reference_palette가 비어 있다 (fail-closed #5)'); process.exit(1); }

for (const [label, html] of [['screens', screensHtml], ['components', componentsHtml]]) {
  const afterRoot = html.slice(html.indexOf('}', html.indexOf(':root {')));
  errors.push(...checkActionBars(html, label));
  for (const hex of new Set(afterRoot.match(/#[0-9a-fA-F]{6}\b/g) || []))
    errors.push(`${label}: :root 밖 색 리터럴 ${hex}`);
  for (const b of refPalette) if (afterRoot.toLowerCase().includes(b))
    errors.push(`${label}: 참조 팔레트 색 ${b} 사용 (no-reference-color-copy)`);
  if (/box-shadow\s*:/.test(afterRoot)) errors.push(`${label}: 그림자 사용 (no-elevation-token)`);
  for (const m of afterRoot.matchAll(/var\(--sp-(\d+)\)/g))
    if (!T.spacing.scale.includes(+m[1])) errors.push(`${label}: 스케일 밖 간격 ${m[1]}`);
  for (const m of afterRoot.matchAll(/var\(--r-(\d+)\)/g))
    if (!T.radius.scale.includes(+m[1])) errors.push(`${label}: 스케일 밖 radius ${m[1]}`);
  /* 정의되지 않은 CSS 변수 — 조용히 죽는 대신 빌드를 세운다 */
  const declared = new Set([...html.matchAll(/^\s*--([a-z0-9-]+):/gm)].map(m => m[1]));
  for (const m of new Set([...afterRoot.matchAll(/var\(--([a-z0-9-]+)/g)].map(m => m[1])))
    if (!declared.has(m)) errors.push(`${label}: 정의되지 않은 변수 --${m}`);
}
if (errors.length) {
  console.error('\n빌드 거부 — 규칙 위반:');
  for (const e of new Set(errors)) console.error('  · ' + e);
  process.exit(1);
}

fs.mkdirSync('docs/wedding-scheduler', { recursive: true });
fs.writeFileSync('docs/wedding-scheduler/screens.html', screensHtml);
fs.writeFileSync('docs/wedding-scheduler/components.html', componentsHtml);
console.log(`screens.html — 화면 ${SCREENS.length}개`);
console.log(`components.html — 갤러리`);
console.log('사후 검증 통과: 팔레트 밖 색 0 · 그림자 0 · 스케일 이탈 0');
