#!/usr/bin/env node
/**
 * design/tokens.json (+ design/drafts/components.md) → design/project.rules.json
 *
 * 우리 하네스의 토큰 정본은 tokens.json 하나다. audit.js 는 project.rules.json 의 $tokens 를 읽으므로
 * 이 스크립트가 둘을 잇는다. 사람이 project.rules.json 을 손으로 채우지 않는다.
 *
 * 사용법:
 *   node scripts/build-rules.js --tokens design/tokens.json --out design/project.rules.json \
 *        [--components design/drafts/components.md | --variants "default,hover,pressed,disabled"] [--reuse-min 0.7] [--reference-palette "#ff6600,#..."]
 *
 * 규칙 매핑:
 *   color-palette-allowlist  ← tokens.color 의 모든 hex (참조 해석 후)
 *   spacing-grid             ← scale_allowlist(tokens.spacing.scale 값)  ※ multiple_of 대신. 우리 스케일은 등차가 아니다
 *   radius-scale             ← scale_allowlist(tokens.radius.scale 값)
 *   type-style-reuse         ← style_bound(tokens.typography.scale 키)   (미구현 → 사람 게이트 승격)
 *   variant-state-coverage   ← components.md 의 상태 목록                (미구현 → 사람 게이트 승격)
 *   component-reuse-rate     ← --reuse-min (기본 0.7, provisional)        (미구현)
 *   layer-naming-semantic    ← deny 기본 패턴
 *   _reference_palette       ← --reference-palette 또는 tokens.meta.reference_palette (없으면 빈 배열 + source_system null)
 */
const fs = require('fs');

function args(argv) {
  const o = { reuseMin: 0.7 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]; if (!a.startsWith('--')) continue;
    const k = a.slice(2); const v = argv[++i];
    if (k === 'reuse-min') o.reuseMin = Number(v); else o[k] = v;
  }
  return o;
}
const A = args(process.argv);
if (!A.tokens || !A.out) { console.error('사용법: --tokens <tokens.json> --out <project.rules.json>'); process.exit(2); }
const T = JSON.parse(fs.readFileSync(A.tokens, 'utf8'));

/* {a.b.c} 참조 해석 */
function get(path) { return path.split('.').reduce((c, k) => (c == null ? undefined : c[k]), T); }
function resolve(v, depth = 0) {
  if (typeof v === 'string') {
    const m = v.match(/^\{([^}]+)\}$/);
    if (m) { if (depth > 8) throw new Error('참조 순환: ' + v); return resolve(get(m[1]), depth + 1); }
  }
  return v;
}
const HEX = /^#[0-9a-fA-F]{6}$/;
const SKIP = new Set(['rationale', '_note', '$schema_note', 'usage', 'concentric_rule', 'label', 'wcag', 'meta']);
function collectHex(node, acc, keyPath = []) {
  if (node == null) return acc;
  if (typeof node === 'string') { const r = resolve(node); if (typeof r === 'string' && HEX.test(r)) acc.add(r.toUpperCase()); return acc; }
  if (typeof node === 'object') for (const [k, v] of Object.entries(node)) { if (SKIP.has(k)) continue; collectHex(v, acc, keyPath.concat(k)); }
  return acc;
}
const colorHex = Array.from(collectHex(T.color, new Set()));
const spacingScale = Object.values((T.spacing && T.spacing.scale) || {}).map(Number).filter((n) => !Number.isNaN(n));
const radiusScale = Object.values((T.radius && T.radius.scale) || {}).map(Number).filter((n) => !Number.isNaN(n));
const typeScale = Object.keys((T.typography && T.typography.scale) || {}).filter((k) => !k.startsWith('_'));
const errors = [];
/* 빈 문자열 leaf 가 남아 있으면 토큰이 확정되지 않은 것 — fail-closed */
function countEmpty(node, acc = [], kp = []) {
  if (node == null) return acc;
  if (typeof node === 'string') { if (node === '') acc.push(kp.join('.')); return acc; }
  if (typeof node === 'object') for (const [k, v] of Object.entries(node)) { if (SKIP.has(k)) continue; countEmpty(v, acc, kp.concat(k)); }
  return acc;
}
/* 키는 ASCII 슬러그만 — check-html/tokens.css 변환기(2-A)와 같은 정책. 한글 키는 label 로 옮긴다(D-9). */
function nonAsciiKeys(node, acc = [], kp = []) {
  if (node && typeof node === 'object' && !Array.isArray(node)) for (const [k, v] of Object.entries(node)) { if (/[^\x20-\x7E]/.test(k)) acc.push(kp.concat(k).join('.')); nonAsciiKeys(v, acc, kp.concat(k)); }
  return acc;
}
const badKeys = nonAsciiKeys({ color: T.color, typography: T.typography, spacing: T.spacing, radius: T.radius, elevation: T.elevation, icon: T.icon });
if (badKeys.length) errors.push(`비ASCII 키 ${badKeys.length}개 — 영문 슬러그 + label 규칙 위반(2-A 변환기와 같은 정책): ${badKeys.slice(0, 6).join(', ')}${badKeys.length > 6 ? ' …' : ''}`);
const empties = countEmpty({ color: T.color, typography: T.typography, spacing: T.spacing, radius: T.radius });
if (empties.length) errors.push(`빈 값 ${empties.length}개 — tokens.json 이 확정되지 않았다: ${empties.slice(0, 6).join(', ')}${empties.length > 6 ? ' …' : ''}`);
if (colorHex.length < 8) errors.push(`tokens.color 의 hex 가 ${colorHex.length}개뿐 (최소 8)`);
if (colorHex.length === 0) errors.push('tokens.color 에서 hex 를 하나도 찾지 못했다 (빈 문자열?)');
if (spacingScale.length === 0) errors.push('tokens.spacing.scale 이 비어 있다');
if (radiusScale.length === 0) errors.push('tokens.radius.scale 이 비어 있다');
if (typeScale.length === 0) errors.push('tokens.typography.scale 이 비어 있다');

/* variant required ← components.md  ("| 이름 | 상태: a, b, c |" 또는 "상태: a/b/c" 행을 느슨하게 파싱) */
let variantRequired = null;
if (A.variants) variantRequired = A.variants.split(',').map((s) => s.trim()).filter(Boolean);
else if (A.components && fs.existsSync(A.components)) {
  const txt = fs.readFileSync(A.components, 'utf8');
  const set = new Set(); const byComp = {};
  /* 괄호 안 설명은 지운 뒤 나눈다 — "Pending(미회신, outline만)" 의 쉼표는 구분자가 아니다(실측 22건 중 5건 깨짐). 'Key=Value' 는 Value 만 남긴다. */
  const add = (cell, comp) => cell.replace(/[（(][^)）]*[)）]/g, '').split(/[,/·|]/).map((s) => s.trim().replace(/^`|`$/g, '').replace(/^[^=]+=/, '')).filter((s) => s && !/^[-:\s]+$/.test(s)).forEach((s) => { set.add(s); if (comp) (byComp[comp] = byComp[comp] || []).push(s); });
  /* 1) 마크다운 표: 헤더에 '상태' 또는 'variant' 가 있는 열을 찾아 그 열의 셀을 읽는다 */
  const lines = txt.split('\n');
  const isSep = (l) => /^\s*\|?\s*:?-{2,}/.test(l || '');
  let usedTable = null;
  for (let i = 0; i < lines.length; i++) {
    /* 헤더 = 바로 다음 줄이 구분선(|---|)인 표 줄. 데이터 행의 "상태" 같은 단어에 걸리지 않게 한다(실측: 컴포넌트별 목록이 안 만들어짐) */
    if (!/^\s*\|/.test(lines[i]) || !isSep(lines[i + 1])) continue;
    const head = lines[i].split('|').map((c) => c.trim());
    /* variant 열 우선. '상태' 는 정확히 그 단어(또는 '상태(variant)')일 때만 — "상태 메모" 같은 열에 걸리지 않게(실측) */
    let col = head.findIndex((c) => /variant/i.test(c));
    if (col < 0) col = head.findIndex((c) => /^상태(\s*[（(]\s*variant\s*[)）])?$/i.test(c));
    if (col < 0) continue;
    usedTable = { line: i + 1, column: head[col] };
    for (let j = i + 2; j < lines.length && /^\s*\|/.test(lines[j]); j++) { const cells = lines[j].split('|').map((c) => c.trim()); const comp = (cells[1] || '').replace(/`/g, '').trim(); if (cells[col]) add(cells[col], comp); }
    break; // variant 열이 있는 첫 표만
  }
  if (usedTable) console.error(`[build-rules] variant 표: ${A.components}:${usedTable.line} 열 "${usedTable.column}", 컴포넌트 ${Object.keys(byComp).length}개`);
  /* 2) 산문 형식(실측 — 2단계 maker 가 표 없이 쓴 경우):
        ## 1. Chip/Status (id 4:12)
        상태 배지. variant: `Status=Waiting`(대기) · `Status=Closing`(확정임박) …
     섹션 제목에서 이름, 그 블록의 'variant:' 뒤를 ·,/ 로 나누고 백틱 안 Key=Value 의 Value 만 취한다 */
  if (!set.size) {
    const sections = txt.split(/^##\s+/m).slice(1);
    for (const sec of sections) {
      const head = sec.split('\n')[0];
      const nm = head.match(/^(?:\d+\.\s*)?([^(\n]+?)\s*(?:\(|$)/); if (!nm) continue;
      const comp = nm[1].replace(/`/g, '').trim();
      const vm = sec.match(/variants?\s*[:：]\s*([^\n]+)/i); if (!vm) continue;
      const ticks = [...vm[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      (ticks.length ? ticks.join(' · ') : vm[1]).split(/[·,/|]/).map((s) => s.replace(/[（(][^)）]*[)）]/g, '').trim().replace(/^[^=]+=/, '')).filter(Boolean).forEach((s) => { set.add(s); (byComp[comp] = byComp[comp] || []).push(s); });
    }
    if (Object.keys(byComp).length) console.error(`[build-rules] variant 산문 형식(## 이름 + variant:)에서 컴포넌트 ${Object.keys(byComp).length}개`);
  }
  /* 3) 마지막 폴백: "상태: a, b, c" 줄 */
  if (!set.size) for (const m of txt.matchAll(/(?:상태|variants?)\s*[:：]\s*([^\n]+)/gi)) add(m[1]);
  if (set.size) { variantRequired = Array.from(set); variantRequired.byComponent = Object.keys(byComp).length ? byComp : null; }
  else console.error('[build-rules] 경고: components.md 에서 variant 상태를 하나도 못 읽었다. 표 헤더에 "상태" 또는 "variant" 열을 두거나 --variants "a,b,c" 로 넘겨라. variant 규칙은 warning 으로 내려간다.');
}
const refPalette = (A['reference-palette'] || (T.meta && T.meta.reference_palette) || '')
  .toString().split(',').map((s) => s.trim().toUpperCase()).filter((s) => HEX.test(s));
const refSystem = (T.meta && T.meta.reference_system) || null;
if (refSystem && refPalette.length === 0) errors.push('meta.reference_system 을 선언했는데 reference_palette 가 비어 있다 (fail-closed 5)');
const clash = colorHex.filter((h) => refPalette.includes(h));
if (clash.length) errors.push('토큰 색이 참조 팔레트와 같다 — 도출 과정이 없었다는 뜻: ' + clash.join(', '));
if (errors.length) { console.error('build-rules 거부:\n  ' + errors.join('\n  ')); process.exit(2); }

const src = `tokens.json (${T.meta && T.meta.chosen_set ? 'set ' + T.meta.chosen_set : 'unknown set'})`;
const out = {
  layer: 'project', version: '0.2.0',
  _note: `scripts/build-rules.js 가 ${A.tokens} 에서 생성. 손으로 고치지 않는다 — tokens.json 을 고치고 다시 생성한다.`,
  tokens: {
    color: { allowed: colorHex, status: 'filled', source: src },
    spacing: { scale: spacingScale, status: 'filled', source: src },
    typography: { scale: typeScale, status: 'filled', source: src },
    radius: { scale: radiusScale, status: 'filled', source: src },
    _reference_palette: { source_system: refSystem, values: refPalette, status: 'filled', _note: refSystem ? '참조 시스템 색 복사 금지 목록' : '참조 시스템 미선언 — 금지 목록 없음' },
  },
  rules: [
    { id: 'color-palette-allowlist', title: '컬러 팔레트 일관성', stage: ['design'], severity: 'blocker', applies_to: {},
      check: { type: 'color_allowlist', allowed: '$tokens.color.allowed' }, autofix: false, status: 'filled', source: src,
      fix_hint: '팔레트 밖 색은 가장 가까운 토큰으로 교체. 새 색을 만들지 않는다.' },
    { id: 'spacing-grid', title: 'Spacing 스케일 준수', stage: ['wireframe', 'design'], severity: 'blocker', applies_to: { has_auto_layout: true },
      check: { type: 'scale_allowlist', scale: '$tokens.spacing.scale', properties: ['itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] },
      autofix: true, status: 'filled', source: src, fix_hint: '가장 가까운 스케일 값으로. 중간이면 작은 쪽.' },
    { id: 'radius-scale', title: 'Radius 스케일 준수', stage: ['design'], severity: 'warning', applies_to: { exclude_node_types: ['COMPONENT_SET'] },   /* variant set 컨테이너의 radius 5 는 Figma 기본값(실측 오탐) */
      check: { type: 'scale_allowlist', scale: '$tokens.radius.scale', properties: ['cornerRadius'] }, autofix: true, status: 'filled', source: src,
      fix_hint: '가장 가까운 radius 토큰으로.' },
    { id: 'type-style-reuse', title: '타이포 스타일 재사용', stage: ['design'], severity: 'blocker', applies_to: { node_types: ['TEXT'] },
      check: { type: 'style_bound', style_kind: 'text' }, autofix: false, status: 'filled', source: src, _note: '바인딩 여부만 검사. 스타일 이름이 스케일 안인지는 3-A 생성 시점에 보장된다.',
      fix_hint: '인라인 폰트 설정을 스케일 내 텍스트 스타일 바인딩으로.' },
    { id: 'component-reuse-rate', title: '컴포넌트 재사용률', stage: ['design'], severity: 'warning', applies_to: {},
      check: { type: 'reuse_ratio', min: A.reuseMin }, autofix: false, status: 'filled', source: '가정: 기본값 ' + A.reuseMin + ' (provisional)',
      fix_hint: '기존 컴포넌트로 대체 가능한 신규 노드를 인스턴스로.' },
    { id: 'layer-naming-semantic', title: '레이어 네이밍 semantic', stage: ['wireframe', 'design'], severity: 'warning', applies_to: {},
      check: { type: 'name_pattern', deny: ['^(Frame|Group|Rectangle|Ellipse|Vector|Line)\\s*\\d*$'] }, autofix: true, status: 'filled', source: '하네스 기본 — 인스턴스 내부·의미 있는 부모 아래의 자동 생성 벡터는 제외',
      fix_hint: '역할 기반 이름(Card/MeetingRow, Chip/Status)으로.' },
    { id: 'variant-state-coverage', title: 'Variant 상태 커버리지', stage: ['design'], severity: variantRequired ? 'blocker' : 'warning', applies_to: { node_types: ['COMPONENT_SET'] },
      check: { type: 'variant_states_present', required: variantRequired || [], required_by_component: (variantRequired && variantRequired.byComponent) || undefined }, autofix: false, status: 'filled',
      source: variantRequired ? A.components : '가정: components.md 없음 — 검사 대상 없음(warning)', fix_hint: '누락 상태 variant 추가. 품질은 C단계.' },
  ],
  project_specific: { _note: 'L3 — design.md §4A 중 기계 판정 가능한 도메인 규칙을 여기에 추가한다(사람 또는 judge 가 작성).', rules: [] },
};
fs.mkdirSync(require('path').dirname(A.out), { recursive: true });
fs.writeFileSync(A.out, JSON.stringify(out, null, 2));
console.log(`생성: ${A.out} — 색 ${colorHex.length}, spacing ${spacingScale.length}, radius ${radiusScale.length}, 타이포 ${typeScale.length}, variant required ${variantRequired ? variantRequired.length : 0}(컴포넌트별 ${variantRequired && variantRequired.byComponent ? Object.keys(variantRequired.byComponent).length : 0}), 참조 팔레트 ${refPalette.length}`);
