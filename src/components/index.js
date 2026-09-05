/** 컴포넌트. design.md §4와 1:1로 대응하며, 등급(reference/extension)을 주석으로 남긴다.
 * 값은 CSS 변수가 갖고 있고 여기서는 구조와 상태만 다룬다. */
const fs = require('fs'), path = require('path');

const RULES_PATH = process.env.DESIGN_RULES || 'docs/wedding-scheduler/project.rules.json';
const guide = JSON.parse(fs.readFileSync(path.resolve(RULES_PATH), 'utf8'));
const T = guide.tokens;
const allRules = [...guide.rules, ...guide.project_specific.rules];

const NAME_OK = new RegExp(allRules.find(r => r.id === 'extension-registered').check.allow);
const nm = (n) => { if (!NAME_OK.test(n)) throw new Error(`등록되지 않은 컴포넌트 이름: "${n}" — design.md §4에 먼저 등록한다`); return n; };

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const at = o => Object.entries(o).filter(([, v]) => v !== undefined && v !== false && v !== null)
  .map(([k, v]) => v === true ? ` ${k}` : ` ${k}="${esc(v)}"`).join('');

/* ---- 아이콘: outlined 1.5. 레퍼런스에 아이콘 토큰이 없어 최소한만 둔다 (extension) ---- */
const P = {
  back: '<path d="M15 5l-7 7 7 7"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.4v.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M16 6.5a3 3 0 010 5.6M18 20c0-2.6-1-4-2.5-4.6"/>',
  person: '<circle cx="12" cy="8" r="3.4"/><path d="M4.5 20c0-3.8 3.2-6 7.5-6s7.5 2.2 7.5 6"/>',
  share: '<path d="M12 15V4M8.5 7.5L12 4l3.5 3.5"/><path d="M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5"/>',
  spinner: '<path d="M12 3a9 9 0 019 9"/><circle cx="12" cy="12" r="9" opacity=".3"/>',
};
const icon = (n, size = 20) => {
  if (!P[n]) throw new Error(`정의되지 않은 아이콘: ${n}`);
  if (!T.icon.sizes.includes(size)) throw new Error(`등록되지 않은 아이콘 크기: ${size}`);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor"`
    + ` stroke-width="${T.icon.stroke}" stroke-linecap="round" stroke-linejoin="round"`
    + ` aria-hidden="true" focusable="false">${P[n]}</svg>`;
};

/* ================= reference 컴포넌트 ================= */

/** Mobile Primary Button — 크기 4단계는 documented 값만. 로딩 시 너비 유지. */
function Button(label, { size = 'xlarge', fill = 'fill', tone = 'primary', state = 'default', leading, name = 'Button' } = {}) {
  nm(name);
  if (!(size in T.control.button_height)) throw new Error(`문서화되지 않은 버튼 크기: ${size}`);
  const busy = state === 'loading';
  return `<button class="btn"${at({
    'data-size': size, 'data-fill': fill, 'data-tone': tone,
    'data-state': ['pressed', 'focus'].includes(state) ? state : undefined,
    disabled: state === 'disabled' || busy, 'aria-busy': busy ? 'true' : undefined,
    'data-name': `${name}/${fill}/${tone}`,
  })}>${leading ? icon(leading, 20) : ''}<span>${esc(label)}</span>`
    + (busy ? `<span class="spin">${icon('spinner', 20)}</span>` : '') + `</button>`;
}

/** Mobile Text Field — box/line, focus/error/disabled/read-only */
function Field({ label, value, placeholder, help, error, variant = 'box', state = 'default', name = 'Field' }) {
  nm(name);
  const st = error ? 'error' : state;
  return `<label class="field"${at({ 'data-variant': variant, 'data-state': st !== 'default' ? st : undefined, 'data-name': `${name}/${variant}` })}>`
    + `<span class="label">${esc(label)}</span>`
    + `<span class="box">${value ? esc(value) : `<span class="ph">${esc(placeholder ?? '')}</span>`}</span>`
    + (error ? `<span class="error">${icon('alert', 16)}${esc(error)}</span>`
      : help ? `<span class="help">${esc(help)}</span>` : '') + `</label>`;
}

/** Mobile Badge — 설명용이며 조작 대상이 아니다. 상태 배정은 design.md §4 Status Badge */
const STATUS = { confirmed: '확정', due: null, conflict: '겹침', done: '다녀옴', both: '양가' };
function Badge(status, { label, size = 'small', name = 'Badge' } = {}) {
  nm(name);
  if (!(status in STATUS)) throw new Error(`등록되지 않은 상태: ${status}`);
  const text = label ?? STATUS[status];
  if (!text) throw new Error(`상태 '${status}'는 라벨을 직접 줘야 한다 (D-day 숫자 등)`);
  return `<span class="badge"${at({ 'data-status': status, 'data-size': size, 'data-name': `${name}/${status}` })}>`
    + (status === 'conflict' ? icon('alert', 16) : '') + esc(text) + `</span>`;
}

/** Agreement 컨트롤 — 체크/언체크/비활성 */
function Check({ on = false, disabled = false, label } = {}) {
  return `<span class="check" role="checkbox" aria-checked="${on}"`
    + `${disabled ? ' aria-disabled="true"' : ' tabindex="0"'}`
    + (label ? ` aria-label="${esc(label)}"` : '')
    + at({ 'data-on': on || undefined, 'data-disabled': disabled || undefined, 'data-name': 'Check' })
    + `>` + (on ? icon('check', 16) : '') + `</span>`;
}

/* ================= extension 컴포넌트 (design.md §4에 등록됨) ================= */

/** List Row — 카드가 아니다. 구분선과 정렬로 구조를 만든다. */
function Row({ lead, name: title, sub, trail, tone, state, alert, rowName = 'Row', interactive = false }) {
  nm(rowName);
  const tag = interactive ? 'button' : 'div';
  const extra = interactive
    ? ` type="button"${state === 'disabled' ? ' disabled' : ''}` : '';
  return `<${tag} class="row"${extra}${at({ 'data-tone': tone, 'data-state': state, 'data-name': rowName })}>`
    + (lead ?? '') + `<div class="main"><div class="name">${esc(title)}</div>`
    + (sub ? `<div class="sub">${sub}</div>` : '')
    + (alert ? Alert(alert) : '') + `</div>`
    + (trail ? `<div class="trail">${trail}</div>` : '') + `</${tag}>`;
}

/** Day Gutter — prd §4-5의 "특정 날짜에 겹치는지"를 축으로 만든 구조 */
function Day({ d, w, weekend = false, items }) {
  return `<div class="day"${at({ 'data-weekend': weekend || undefined, 'data-name': 'Gutter/day' })}>`
    + `<div class="gut"><span class="d">${esc(d)}</span><span class="w">${esc(w)}</span></div>`
    + `<div class="items">${items.join('')}</div></div>`;
}

/** Owner Mark — 신랑/신부를 색이 아니라 테두리 스타일 + 라벨로 */
const OWN = { groom: '신랑', bride: '신부', both: '양가' };
function Person(personName, { owner = 'groom', ini, note, muted = false } = {}) {
  nm(`Person/${owner}`);
  return `<span class="person"${at({ 'data-owner': owner, 'data-muted': muted || undefined, 'data-name': `Person/${owner}` })}>`
    + `<span class="ini">${esc(ini ?? personName.slice(-2))}</span>${esc(personName)}`
    + `<span class="own">${esc(note ?? OWN[owner])}</span></span>`;
}
function Avatar(ini, { owner = 'groom' } = {}) {
  return `<span class="avatar"${at({ 'data-owner': owner, 'data-name': `Avatar/${owner}` })}>${esc(ini)}</span>`;
}

/* ---- 배치 유틸 ---- */
const Sec = (t, r) => nm('Section/head') && `<div class="sec" data-name="Section/head">`
  + `<span class="t">${esc(t)}</span>${r ? `<span class="r">${esc(r)}</span>` : ''}</div>`;
const Note = html => `<p class="note" data-name="State/note">${html}</p>`;
const Alert = text => `<p class="alert" data-name="State/alert">${icon('alert', 16)}<span>${esc(text)}</span></p>`;
const Meter = (a, b) => `<div class="meter" data-name="Bar/meter" role="progressbar"`
  + ` aria-valuenow="${a}" aria-valuemin="0" aria-valuemax="${b}"`
  + ` aria-label="회신 ${a} / ${b}"><i style="width:${Math.round(a / b * 100)}%"></i></div>`;
/* 색 단독 전달 금지 — 집계는 aria-label로도 읽히고, 옆에 숫자 텍스트를 함께 둔다 */
/** 회신 집계. 건수 비례로 자라는 점 표시는 6개를 넘으면 숫자로 축약한다
 *  (레이아웃.md L-4 — 후행 슬롯이 데이터 건수에 비례해 자라면 제목이 접힌다). */
const TALLY_MAX = 6;
const Tally = ({ y = 0, n = 0, none = 0 }) => {
  const label = `가능 ${y}명, 불가 ${n}명, 무응답 ${none}명`;
  if (y + n + none > TALLY_MAX) {
    return `<span class="tally-text" data-name="Text/count" aria-label="${label}">`
      + `가능 ${y} · 불가 ${n} · 대기 ${none}</span>`;
  }
  return `<span class="tally" data-name="Bar/tally" role="img" aria-label="${label}">`
    + '1'.repeat(y).split('').map(() => '<i data-y></i>').join('')
    + '1'.repeat(n).split('').map(() => '<i data-n></i>').join('')
    + '1'.repeat(none).split('').map(() => '<i></i>').join('') + `</span>`
    + `<span class="tally-num" data-name="Text/count">가능 ${y}</span>`;
};

/* ---- 화면 셸 ---- */
const TABS = [['schedule', '일정', 'calendar'], ['people', '지인', 'people'], ['me', '내 정보', 'person']];
function Screen({ id, title, back = false, right, tab, body, action }) {
  return `<div class="screen" data-name="Screen/${id}">`
    + `<div class="statusbar"><span>9:41</span><span class="dots"><i></i><i></i><i></i></span></div>`
    + `<div class="appbar">${back ? `<button class="lead" aria-label="뒤로 가기">${icon('back', 24)}</button>` : ''}`
    + `<div class="title t-h4">${esc(title)}</div>${right ?? ''}</div>`
    + `<div class="body">${body}</div>${action ?? ''}`
    + (tab ? `<nav class="tabbar">${TABS.map(([k, l, i]) =>
      `<a href="#${k}"${k === tab ? ' aria-current="page"' : ''}>${icon(i, 24)}<span>${l}</span></a>`).join('')}</nav>` : '')
    + `</div>`;
}
const ActionBar = c => `<div class="actionbar" data-name="Bar/action">${c}</div>`;
/** 섹션 묶음. 헤더와 내용을 한 그룹으로 묶어, 그룹 사이 간격을 .body가 단독 소유하게 한다.
 *  (합성 여백 방지 — design.md §5) */
const Group = (head, ...children) => `<section class="group" data-name="Section/group">`
  + head + children.join('') + `</section>`;

module.exports = { T, guide, allRules, RULES_PATH, icon, esc, Group,
  Button, Field, Badge, Check, Row, Day, Person, Avatar,
  Sec, Note, Alert, Meter, Tally, Screen, ActionBar, STATUS, OWN, TABS };
