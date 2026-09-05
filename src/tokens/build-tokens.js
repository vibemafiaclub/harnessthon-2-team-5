#!/usr/bin/env node
/**
 * project.rules.json → CSS 커스텀 프로퍼티.
 * 값의 출처는 design.md → project.rules.json 한 줄기다. 여기서 색이나 px을 만들지 않는다.
 */
const fs = require('fs'), path = require('path');

const RULES = process.argv[2] || 'docs/wedding-scheduler/project.rules.json';
const OUT = process.argv[3] || 'src/tokens/tokens.css';
const g = JSON.parse(fs.readFileSync(RULES, 'utf8'));
const t = g.tokens;
const fail = (m) => { console.error('build-tokens 거부: ' + m); process.exit(1); };

/* fail-closed — 게이트와 같은 조건을 빌드에도 건다 */
for (const [k, v] of Object.entries(t))
  if (v?.status && v.status !== 'filled') fail(`토큰 '${k}'이 ${v.status}`);
for (const r of [...g.rules, ...g.project_specific.rules])
  if (r.status !== 'filled' && r.severity === 'blocker') fail(`blocker 규칙 '${r.id}'이 unfilled`);

/* 표면 혼합 방어 — 금지 값이 토큰에 새어 들어오면 빌드를 세운다.
 * 색은 값으로, 높이는 '높이 역할 토큰'으로만 본다. 값 전체를 문자열로 훑으면
 * font-weight 400을 마케팅 높이 40으로 오인한다. */
const bannedColors = (t._reference_palette?.values || []).map(v => v.toLowerCase());
if (!bannedColors.length) fail('_reference_palette가 비어 있다 (guide/README.md fail-closed #5)');
const bannedHeights = t.control._forbidden_surface.heights;
const HEIGHT_KEY = /^(btn-h-|row-min-h$)/;

const emitted = [];
const L = [];
const push = (k, v) => { L.push(`  --${k}: ${v};`); emitted.push([k, String(v)]); };

for (const [k, v] of Object.entries(t.color._roles)) push(`c-${k.replace(/_/g, '-')}`, v);
for (const n of t.spacing.scale) push(`sp-${n}`, `${n}px`);
for (const n of t.radius.scale) push(`r-${n}`, `${n}px`);
for (const [k, v] of Object.entries(t.control.button_height)) push(`btn-h-${k}`, `${v}px`);
for (const [k, v] of Object.entries(t.radius.button)) push(`btn-r-${k}`, `${v}px`);
push('btn-px', `${t.control.button_padding_x}px`);
push('row-min-h', `${t.control.row_min_height}px`);

const stack = [t.typography.family.ui, ...t.typography.fallback.ui]
  .map(n => /\s/.test(n) ? `"${n}"` : n).join(', ');
push('f-ui', stack);
for (const [name, s] of Object.entries(t.typography.scale)) {
  const k = name.toLowerCase();
  push(`fs-${k}`, `${s.size}px`); push(`fw-${k}`, String(s.weight)); push(`lh-${k}`, `${s.lh}px`);
}
push('vw', `${t.viewport.mobile.width}px`);
push('vh', `${t.viewport.mobile.height}px`);

/* 터치 타깃 하한은 core.rules.json이 소유한다. 프로젝트가 정하는 값이 아니다. */
const core = JSON.parse(fs.readFileSync('guide/core.rules.json', 'utf8'));
const tap = core.rules.find(r => r.id === 'touch-target-min');
if (!tap) fail('core.rules.json에 touch-target-min이 없다');
push('tap-min', `${tap.check.height}px`);
for (const n of t.icon.sizes) push(`icon-${n}`, `${n}px`);
push('icon-stroke', String(t.icon.stroke));

if (t.elevation.scale.length) fail('elevation.scale이 비어 있지 않다. design.md §2는 그림자 토큰을 승격하지 않았다.');

const leaked = [
  ...emitted.filter(([, v]) => bannedColors.includes(v.toLowerCase())).map(([k, v]) => `${k}=${v} (참조 팔레트 복사)`),
  ...emitted.filter(([k, v]) => HEIGHT_KEY.test(k) && bannedHeights.includes(parseInt(v, 10)))
            .map(([k, v]) => `${k}=${v}`),
];
if (leaked.length) fail(`마케팅 표면 값이 제품 토큰에 섞였다: ${leaked.join(', ')}`);

/* 타입 유틸 클래스 — 컴포넌트가 폰트를 직접 지정하지 못하게 한다 */
const classes = Object.keys(t.typography.scale).map(name => {
  const k = name.toLowerCase();
  return `.t-${k} {\n  font-family: var(--f-ui);\n  font-size: var(--fs-${k});\n`
    + `  font-weight: var(--fw-${k});\n  line-height: var(--lh-${k});\n}`;
}).join('\n');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT,
  `/* 자동 생성 — 직접 수정하지 마세요.\n * 출처: ${g.design_guide} → ${RULES}\n`
  + ` * 재생성: node src/tokens/build-tokens.js\n */\n:root {\n${L.join('\n')}\n}\n\n${classes}\n`);

console.log(`${OUT} — 변수 ${L.length}개 · 타입 ${Object.keys(t.typography.scale).length}단계 · 그림자 0개`);
