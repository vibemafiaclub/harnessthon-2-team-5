#!/usr/bin/env node
/**
 * A단계(구조적 사실 검증) 감사기 — HTML/CSS 프리뷰 대상.
 * SKILL.md의 A단계 체크리스트를 실행 가능한 검사로 코드화한 것.
 * Figma 노드 검사(scripts/extract-nodes.js 류)가 아니라, 3단계(HTML 프리뷰) 게이트용이다.
 *
 * Usage: node scripts/audit.js <index.html 경로> <styles.css 경로> [--tokens <brief.md 경로>]
 *
 * 종료 코드: 0 = 위반 없음, 1 = blocker 위반 존재 (fail-closed)
 */

const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error(`사용법: node scripts/audit.js <index.html> <styles.css>\n${msg}`);
  process.exit(2);
}

const [, , htmlArg, cssArg] = process.argv;
if (!htmlArg || !cssArg) fail('index.html과 styles.css 경로를 모두 지정하세요.');

const htmlPath = path.resolve(htmlArg);
const cssPath = path.resolve(cssArg);
if (!fs.existsSync(htmlPath)) fail(`파일 없음: ${htmlPath}`);
if (!fs.existsSync(cssPath)) fail(`파일 없음: ${cssPath}`);

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

const violations = []; // { rule, severity: 'blocker'|'warning', detail }
const info = [];

// ---------- 0. :root 변수 집합 추출 ----------
const rootMatch = css.match(/:root\s*{([^}]*)}/);
const rootBlock = rootMatch ? rootMatch[1] : '';
const rootVarLines = rootBlock.match(/--[\w-]+\s*:\s*[^;]+;/g) || [];
const allowedHex = new Set();
for (const line of rootVarLines) {
  const hexes = line.match(/#[0-9a-fA-F]{3,8}/g);
  if (hexes) hexes.forEach((h) => allowedHex.add(h.toLowerCase()));
}
info.push(`:root에서 발견한 허용 hex 색상 ${allowedHex.size}개: ${[...allowedHex].join(', ')}`);

// ---------- 1. 컬러 팔레트 일관성 ----------
// :root 블록을 제외한 CSS 본문 + HTML 인라인 style에서 리터럴 hex 검사
const cssBody = css.replace(/:root\s*{[^}]*}/, '');
const cssHexMatches = cssBody.match(/#[0-9a-fA-F]{3,8}/g) || [];
const inlineStyleBlocks = html.match(/style="[^"]*"/g) || [];
const htmlHexMatches = inlineStyleBlocks.join(' ').match(/#[0-9a-fA-F]{3,8}/g) || [];

const strayHex = [...cssHexMatches, ...htmlHexMatches].filter(
  (h) => !allowedHex.has(h.toLowerCase())
);
if (strayHex.length) {
  violations.push({
    rule: '컬러 팔레트 일관성',
    severity: 'blocker',
    detail: `:root 변수에 없는 하드코딩 hex ${strayHex.length}건: ${[...new Set(strayHex)].join(', ')}`,
  });
} else {
  info.push('컬러 팔레트 일관성: 위반 없음 — 모든 hex가 :root 변수 집합 안에 있음');
}

// ---------- 2. 타이포 재사용 ----------
// @font-face 블록은 폰트 "정의"이지 "사용"이 아니므로 검사 대상에서 제외
const cssWithoutFontFace = css.replace(/@font-face\s*{[^}]*}/g, '');
const fontFamilyDecls = cssWithoutFontFace.match(/font-family\s*:\s*[^;]+;/g) || [];
const badFontDecls = fontFamilyDecls.filter(
  (d) => !/var\(--font-(display|body)\)/.test(d)
);
if (badFontDecls.length) {
  violations.push({
    rule: '타이포 스타일 재사용',
    severity: 'blocker',
    detail: `var(--font-display)/var(--font-body)를 안 쓴 font-family 선언 ${badFontDecls.length}건: ${badFontDecls.join(' | ')}`,
  });
} else {
  info.push('타이포 스타일 재사용: 위반 없음 — font-family 전부 토큰 변수 사용');
}

// ---------- 3. Spacing 그리드 준수 (4/6/8/16/20 배수) ----------
const GRID_UNITS = [4, 6, 8, 16, 20];
function isOnGrid(px) {
  return GRID_UNITS.some((u) => px % u === 0) || px === 0;
}
const spacingDecls = css.match(/\b(padding|margin)(-(top|right|bottom|left))?\s*:\s*[^;]+;/g) || [];
const spacingViolations = [];
for (const decl of spacingDecls) {
  const values = decl
    .split(':')[1]
    .replace(';', '')
    .trim()
    .split(/\s+/)
    .filter((v) => v.endsWith('px'));
  for (const v of values) {
    const px = parseFloat(v);
    if (!isOnGrid(px)) spacingViolations.push(`${decl.trim()} (${v})`);
  }
}
if (spacingViolations.length) {
  violations.push({
    rule: 'Spacing 그리드 준수 (4/6/8/16/20)',
    severity: 'warning',
    detail: `그리드 밖 수치 ${spacingViolations.length}건: ${spacingViolations.slice(0, 10).join(' | ')}${spacingViolations.length > 10 ? ' ...' : ''}`,
  });
} else {
  info.push('Spacing 그리드 준수: 위반 없음 — 모든 padding/margin이 4/6/8/16/20 배수');
}

// ---------- 4. 컴포넌트 재사용률 ----------
const classAttrs = html.match(/class="([^"]+)"/g) || [];
const classUsage = new Map();
for (const attr of classAttrs) {
  const classes = attr.slice(7, -1).split(/\s+/);
  for (const c of classes) {
    if (!c) continue;
    classUsage.set(c, (classUsage.get(c) || 0) + 1);
  }
}
const totalUsages = [...classUsage.values()].reduce((a, b) => a + b, 0);
const uniqueClasses = classUsage.size;
const reuseRatio = totalUsages ? 1 - uniqueClasses / totalUsages : 0;
const reusePct = Math.round(reuseRatio * 100);
if (reusePct < 80) {
  violations.push({
    rule: '컴포넌트 재사용률',
    severity: 'warning',
    detail: `재사용률 ${reusePct}% (목표 ≥80%) — 고유 클래스 ${uniqueClasses}개 / 총 사용 ${totalUsages}회`,
  });
} else {
  info.push(`컴포넌트 재사용률: ${reusePct}% (고유 ${uniqueClasses}개 / 총 사용 ${totalUsages}회) — 목표(≥80%) 충족`);
}

// ---------- 5. 네이밍 semantic 여부 ----------
const ALLOWED_PREFIXES = [
  'badge', 'btn', 'tab', 'field', 'card', 'chip', 'avatar', 'progress',
  'topbar', 'tabbar', 'statusbar', 'section', 'friend', 'select', 'date',
  'mini-cal', 'cal', 'picked', 'segmented', 'checkbox', 'settings', 'switch',
  'profile', 'empty', 'icon', 'share', 'info', 'reply', 'home', 'couple',
  'deadline', 'warning', 'respondent', 'dot', 'filter', 'list', 'gallery',
  'frame', 'phone', 'screen', 'fab', 'nav', 'tag',
];
const badNames = [...classUsage.keys()].filter((c) => {
  if (!/^[a-z][a-z0-9-]*$/.test(c)) return true; // kebab-case 위반
  return !ALLOWED_PREFIXES.some((p) => c === p || c.startsWith(p + '-') || c.startsWith(p));
});
if (badNames.length) {
  violations.push({
    rule: '레이어 네이밍 semantic 여부',
    severity: 'warning',
    detail: `허용 접두어 밖 클래스 ${badNames.length}개: ${badNames.join(', ')}`,
  });
} else {
  info.push('레이어 네이밍: 위반 없음 — 전부 kebab-case + 역할 접두어 준수');
}

// ---------- 6. Variant 상태 커버리지 (정보성 — SKILL.md에 TODO로 이미 명시된 항목) ----------
const stateSelectors = { hover: /:hover/, disabled: /:disabled|\.disabled/, empty: /\.empty/, error: /\.error/ };
const missingStates = Object.entries(stateSelectors)
  .filter(([, re]) => !re.test(css))
  .map(([name]) => name);
if (missingStates.length) {
  info.push(`Variant 상태 커버리지: CSS에 없음 — ${missingStates.join(', ')} (정적 HTML 프리뷰 단계 TODO, Figma 배리언트 단계에서 채울 것)`);
}

// ---------- 리포트 ----------
console.log(`\n=== A단계 구조 감사 리포트 ===`);
console.log(`대상: ${path.relative(process.cwd(), htmlPath)} / ${path.relative(process.cwd(), cssPath)}\n`);

console.log('--- 통과 항목 ---');
info.forEach((i) => console.log(`  ✓ ${i}`));

const blockers = violations.filter((v) => v.severity === 'blocker');
const warnings = violations.filter((v) => v.severity === 'warning');

if (warnings.length) {
  console.log('\n--- WARNING (기록만, 진행 차단 안 함) ---');
  warnings.forEach((v) => console.log(`  ⚠ [${v.rule}] ${v.detail}`));
}
if (blockers.length) {
  console.log('\n--- BLOCKER (다음 단계 진입 차단) ---');
  blockers.forEach((v) => console.log(`  ✗ [${v.rule}] ${v.detail}`));
}

console.log(`\n총 ${violations.length}건 (blocker ${blockers.length} / warning ${warnings.length})`);
process.exit(blockers.length ? 1 : 0);
