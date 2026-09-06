#!/usr/bin/env node
/**
 * A게이트 Figma 번들 생성기 — 판정을 Figma 안에서 끝내고 위반 목록만 돌려받는다.
 *
 * 왜: use_figma 반환값은 약 20KB 에서 잘리고 로컬 파일에 쓸 수 없다(실측: 24프레임 노드 덤프 553KB).
 *     그래서 노드를 밖으로 꺼내지 않고, 규칙을 안으로 들여보낸다. 반환은 수 KB.
 *
 * 사용법:
 *   node scripts/make-figma-audit.js --project design/project.rules.json --stage design \
 *        --out design/verify/figma_audit.js [--cap 25] [--max-nodes 4000] [--page Screens]
 *   → 생성된 파일 본문을 use_figma 코드로 1회 실행(호출 전 figma-use 스킬 로드). 반환 JSON 을
 *     design/verify/audit.json 에 저장하고 `node scripts/audit.js --render design/verify/audit.json` 으로 읽는다.
 *
 * 규칙당 위반 기록은 --cap 개까지(개수는 전부 센다). 대상 페이지는 --page 이름(없으면 현재 페이지),
 * 그 페이지의 자식 전부. 선택 상태를 전제하지 않는다.
 */
const fs = require('fs'); const path = require('path');
const { compile } = require('./audit');
function args(argv) { const o = { stage: 'design', cap: '25', 'max-nodes': '4000' }; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; } return o; }
const A = args(process.argv);
if (!A.project || !A.out) { console.error('--project <project.rules.json> --out <figma_audit.js> 필요'); process.exit(2); }
const { rules, errors } = compile(A.core || 'guide/core.rules.json', A.project);
if (errors.length) { console.error('컴파일 실패 — 번들을 만들지 않는다:\n  ' + errors.join('\n  ')); process.exit(2); }
const active = rules.filter((r) => (r.stage || []).includes(A.stage)).map((r) => ({ id: r.id, title: r.title, stage: r.stage, severity: r.severity, applies_to: r.applies_to || {}, check: r.check, autofix: r.autofix === true, fix_hint: r.fix_hint }));
const coreSrc = fs.readFileSync(path.join(__dirname, 'lib', 'audit-core.js'), 'utf8').replace(/if \(typeof module[\s\S]*$/, '');
const bundle = `/* figma_audit — 생성물. 손으로 고치지 않는다. 규칙 ${active.length}개, stage=${A.stage}, 생성 ${new Date().toISOString()} */
${coreSrc}
var RULES = ${JSON.stringify(active)};
var STAGE = ${JSON.stringify(A.stage)};
var CAP = ${Number(A.cap)};
var MAX_NODES = ${Number(A['max-nodes'])};
var PAGE_NAME = ${JSON.stringify(A.page || null)};
var page = figma.currentPage;
if (PAGE_NAME) { var p = figma.root.children.find(function (x) { return x.name === PAGE_NAME; }); if (!p) return JSON.stringify({ error: '페이지 없음: ' + PAGE_NAME, pages: figma.root.children.map(function (x) { return x.name; }) }); await figma.setCurrentPageAsync(p); page = p; }
var roots = page.selection && page.selection.length ? page.selection : page.children;
var counter = { n: 0 };
var tree;
try { tree = Array.prototype.map.call(roots, function (r) { return dumpTree(r, figma.mixed, MAX_NODES, counter); }); }
catch (e) { return JSON.stringify({ error: String(e && e.message || e), nodes_seen: counter.n }); }
var report = audit({ rules: RULES, stage: STAGE, nodes: tree, target: page.name, perRuleCap: CAP });
report.page = page.name; report.roots = roots.length; report.generated_at = ${JSON.stringify(new Date().toISOString())};
return JSON.stringify(report);
`;
fs.mkdirSync(path.dirname(A.out), { recursive: true });
fs.writeFileSync(A.out, bundle);
console.log(`생성: ${A.out} — 규칙 ${active.length}개(stage ${A.stage}), 번들 ${(bundle.length / 1024).toFixed(1)}KB, 규칙당 위반 기록 ≤${A.cap}`);
