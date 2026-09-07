#!/usr/bin/env node
/**
 * A게이트 Figma 번들 생성기 — 판정을 Figma 안에서 끝내고 위반 목록만 돌려받는다.
 *
 * 왜: use_figma 반환값은 약 20KB 에서 잘리고 로컬 파일에 쓸 수 없다(실측: 24프레임 노드 덤프 553KB).
 *     그래서 노드를 밖으로 꺼내지 않고, 규칙을 안으로 들여보낸다. 반환은 수 KB.
 *
 * 사용법:
 *   node scripts/make-figma-audit.js --project design/project.rules.json --stage design \
 *        --out design/verify/figma_audit.js [--cap 25] [--max-nodes 4000] [--page Screens] \
 *        [--design design/design.md] [--frame-width 390] [--frame-min-height 844] \
 *        [--bars "Bar/Status|StatusBar,Bar/Tab|TabBar"] [--no-builtin] \
 *        [--budget 18000] [--text-per-frame 60] [--reactions-max 120]
 *   → 생성된 파일 본문을 use_figma 코드로 1회 실행(호출 전 figma-use 스킬 로드). 반환 JSON 을
 *     design/verify/audit_screens.json 에 저장하고 `node scripts/audit.js --render design/verify/audit_screens.json` 으로 읽는다.
 *
 * 규칙당 위반 기록은 --cap 개까지(개수는 전부 센다). 대상 페이지는 --page 이름(없으면 현재 페이지),
 * 그 페이지의 자식 전부. 선택 상태를 전제하지 않는다.
 *
 * 내장 규칙(A검사 9·13·14 — 3-D 보완 항목의 결정론화). project.rules.json 에 같은 id 가 있으면 프로젝트 것을 쓰고 주입하지 않는다. --no-builtin 으로 끈다.
 *   frame-spec              (A-9)  frame_spec: 폭 == design.md §2 폭, 높이 ≥ 최소, 상태바·탭바(--bars 이름 패턴) 존재. 값은 --design 의 '화면 규격' 줄 → --frame-* 플래그 → 기본 390/844 순.
 *   primary-action-visible  (A-13) primary_action_visible: 루트 프레임마다 Action/Primary 정확히 1개, y+height ≤ 최소 높이(첫 화면) 또는 조상 Bar/Action.
 *   content-not-cut         (A-14) within_parent_bounds: 루트 프레임 자손의 y+height ≤ 프레임 높이.
 *   no-primitive-binding    (A-15) binding_name_deny: 노드에 직접 바인딩된 변수 이름에 primitive 계층 0건 (D-43).
 *   A-12(text_overflow)는 guide/core.rules.json 의 text-not-clipped 가 담당한다 — audit-core 가 구현했으므로 더 이상 unchecked 가 아니다.
 *
 * 반환 JSON 추가 필드 (audit() 결과 위에):
 *   text_inventory: [{frame, id, texts[], total}] — 프레임당 ≤ --text-per-frame 개, 각 ≤40자. check-figma F-9 가 초안 텍스트 집합과 일치율을 센다.
 *   reactions:      [{from_frame, to_frame | null + to_id}] — 프로토타입 연결을 화면 프레임 단위 간선으로. check-figma A-16 이 brief §2 진입 경로와 대조한다.
 *   builtin_rules, frame_spec, bytes, text_inventory_truncated / reactions_truncated(잘렸을 때만).
 *   --budget(UTF-8 바이트) 를 넘으면 프레임당 텍스트 수를 반씩 줄이고, 그래도 넘으면 reactions 를 40개로 자른다. 잘렸음은 필드로 남긴다.
 */
const fs = require('fs'); const path = require('path');
const { compile } = require('./audit');
const FLAGS = new Set(['no-builtin']);
function args(argv) {
  const o = { stage: 'design', cap: '25', 'max-nodes': '4000', budget: '18000', 'text-per-frame': '60', 'reactions-max': '120', bars: 'Bar/Status|StatusBar|Status Bar,Bar/Tab|TabBar|Tab Bar' };
  for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (!a.startsWith('--')) continue; const k = a.slice(2); if (FLAGS.has(k)) { o[k] = true; continue; } o[k] = argv[++i]; }
  return o;
}
const A = args(process.argv);
if (!A.project || !A.out) { console.error('--project <project.rules.json> --out <figma_audit.js> 필요'); process.exit(2); }
const { rules, errors } = compile(A.core || 'guide/core.rules.json', A.project);
if (errors.length) { console.error('컴파일 실패 — 번들을 만들지 않는다:\n  ' + errors.join('\n  ')); process.exit(2); }

/* design.md §2 '화면 규격' 줄에서 폭·최소 높이를 읽는다. 라벨 자체에 '최소 844' 가 적혀 있으므로 콜론 뒤 값 부분만 본다. 못 읽으면 플래그/기본값. */
function frameSpecFromDesign(file) {
  const spec = { source: '기본값' };
  if (!file) return spec;
  if (!fs.existsSync(file)) { console.error(`[make-figma-audit] 경고: --design ${file} 없음 — 프레임 규격은 플래그/기본값`); return spec; }
  const line = fs.readFileSync(file, 'utf8').split('\n').find((l) => /^\s*-\s*\**화면 규격/.test(l));
  if (!line) { console.error(`[make-figma-audit] 경고: ${file} 에 '- 화면 규격' 줄이 없다 — 플래그/기본값`); return spec; }
  const val = line.split(/[:：]/).slice(1).join(':').trim();
  if (!val) { console.error(`[make-figma-audit] 경고: ${file} 의 '화면 규격' 값이 비어 있다(1-D 미완) — 플래그/기본값`); return spec; }
  const w = val.match(/폭\s*[:=]?\s*(\d{3,4})/) || val.match(/(\d{3,4})\s*(?:px)?\s*(?:고정|×|x)/i);
  const h = val.match(/(?:최소|≥|>=|이상)\s*(\d{3,4})/) || val.match(/(\d{3,4})\s*(?:px)?\s*이상/);
  if (w) spec.width = Number(w[1]); if (h) spec.min_height = Number(h[1]);
  spec.source = `${file}: ${val}`;
  return spec;
}
const fromDesign = frameSpecFromDesign(A.design);
const FRAME = {
  width: Number(A['frame-width']) || fromDesign.width || 390,
  min_height: Number(A['frame-min-height']) || fromDesign.min_height || 844,
  bars: String(A.bars || '').split(',').map((s) => s.trim()).filter(Boolean),
  source: A['frame-width'] || A['frame-min-height'] ? '플래그' : fromDesign.source,
};
function builtinRules(spec) {
  const barPatterns = spec.bars.map((b) => '^(?:' + b + ')');
  return [
    { id: 'frame-spec', title: '프레임 규격 (A검사 9)', stage: ['design'], severity: 'blocker', applies_to: { root_only: true, node_types: ['FRAME'] },
      check: { type: 'frame_spec', width: spec.width, min_height: spec.min_height, required_children: barPatterns }, autofix: false,
      fix_hint: `폭 ${spec.width} 고정, 높이 ≥${spec.min_height}(내용에 맞춰 늘림, hug 허용), 상태바·탭바 노드 이름은 ${spec.bars.join(' / ')} 로. 같은 화면 두 벌 금지(D-34).` },
    { id: 'primary-action-visible', title: '주 행동 가시성 (A검사 13)', stage: ['design'], severity: 'blocker', applies_to: { root_only: true, node_types: ['FRAME'] },
      check: { type: 'primary_action_visible', name: '^Action\\/Primary$', bar: '^Bar\\/Action', fold: spec.min_height, no_primary_marker: 'no-primary' }, autofix: false,
      fix_hint: `주 행동 노드 이름 Action/Primary 정확히 1개. 첫 화면(y+height ≤ ${spec.min_height}) 안에 두거나 Bar/Action 하단 고정 바 안에. 주 행동 없는 화면은 프레임 description(또는 이름)에 no-primary (D-26).` },
    { id: 'content-not-cut', title: '내용 절단 없음 (A검사 14)', stage: ['design'], severity: 'blocker', applies_to: { descendants_only: true, root_node_types: ['FRAME'] },
      check: { type: 'within_parent_bounds', axis: 'y', tolerance: 1 }, autofix: false,
      fix_hint: '프레임 높이를 내용에 맞춰 늘린다(hug). clip content 로 잘라 숨기지 않는다(D-34).' },
    { id: 'no-primitive-binding', title: 'primitive 직접 바인딩 없음 (A검사 15)', stage: ['design'], severity: 'warning', applies_to: {},
      check: { type: 'binding_name_deny', deny: ['(^|/)primitive/'] }, autofix: false,
      fix_hint: 'semantic 변수만 노드에 직접 바인딩한다. 값(#hex)으로 변수를 찾지 말고 정본 노드의 boundVariables 를 읽어 같은 변수를 바인딩한다(D-43).' },
  ];
}
const projectIds = new Set(rules.map((r) => r.id));
const builtin = A['no-builtin'] ? [] : builtinRules(FRAME).filter((r) => !projectIds.has(r.id));
const active = rules.concat(builtin).filter((r) => (r.stage || []).includes(A.stage)).map((r) => ({ id: r.id, title: r.title, stage: r.stage, severity: r.severity, applies_to: r.applies_to || {}, check: r.check, autofix: r.autofix === true, fix_hint: r.fix_hint }));
const coreSrc = fs.readFileSync(path.join(__dirname, 'lib', 'audit-core.js'), 'utf8').replace(/if \(typeof module[\s\S]*$/, '');
const bundle = `/* figma_audit — 생성물. 손으로 고치지 않는다. 규칙 ${active.length}개(내장 ${builtin.length}), stage=${A.stage}, 생성 ${new Date().toISOString()} */
${coreSrc}
var RULES = ${JSON.stringify(active)};
var STAGE = ${JSON.stringify(A.stage)};
var CAP = ${Number(A.cap)};
var MAX_NODES = ${Number(A['max-nodes'])};
var PAGE_NAME = ${JSON.stringify(A.page || null)};
var BUDGET = ${Number(A.budget)};
var TEXT_PER_FRAME = ${Number(A['text-per-frame'])};
var REACTIONS_MAX = ${Number(A['reactions-max'])};
var page = figma.currentPage;
if (PAGE_NAME) { var p = figma.root.children.find(function (x) { return x.name === PAGE_NAME; }); if (!p) return JSON.stringify({ error: '페이지 없음: ' + PAGE_NAME, pages: figma.root.children.map(function (x) { return x.name; }) }); await figma.setCurrentPageAsync(p); page = p; }
var roots = page.selection && page.selection.length ? page.selection : page.children;
var counter = { n: 0 };
var tree;
try { tree = Array.prototype.map.call(roots, function (r) { return dumpTree(r, figma.mixed, MAX_NODES, counter); }); }
catch (e) { return JSON.stringify({ error: String(e && e.message || e), nodes_seen: counter.n }); }
var report = audit({ rules: RULES, stage: STAGE, nodes: tree, target: page.name, perRuleCap: CAP });
report.page = page.name; report.roots = roots.length; report.generated_at = ${JSON.stringify(new Date().toISOString())};
report.builtin_rules = ${JSON.stringify(builtin.map((r) => r.id))};
report.frame_spec = ${JSON.stringify({ width: FRAME.width, min_height: FRAME.min_height, bars: FRAME.bars, source: FRAME.source })};
/* 승인본 대조(F-9)·흐름 연결(A-16) 재료. use_figma 반환 상한(약 20KB) 안에 맞춘다 — 넘치면 프레임당 텍스트를 반씩 줄이고, 그래도 넘치면 reactions 를 자른다. 잘렸음은 필드로 남긴다. */
report.text_inventory = textInventory(tree, { perFrame: TEXT_PER_FRAME, maxChars: 40 });
report.reactions = reactionEdges(tree, { max: REACTIONS_MAX });
var per = TEXT_PER_FRAME;
while (utf8Len(JSON.stringify(report)) > BUDGET && per > 1) { per = Math.floor(per / 2); report.text_inventory = textInventory(tree, { perFrame: per, maxChars: 40 }); report.text_inventory_truncated = true; }
if (utf8Len(JSON.stringify(report)) > BUDGET && report.reactions.length > 40) { report.reactions = report.reactions.slice(0, 40); report.reactions_truncated = true; }
report.bytes = utf8Len(JSON.stringify(report));
return JSON.stringify(report);
`;
fs.mkdirSync(path.dirname(A.out), { recursive: true });
fs.writeFileSync(A.out, bundle);
console.log(`생성: ${A.out} — 규칙 ${active.length}개(stage ${A.stage}, 내장 ${builtin.length}: ${builtin.map((r) => r.id).join(', ') || '없음'}), 프레임 규격 ${FRAME.width}×≥${FRAME.min_height} (${FRAME.source}), 번들 ${(bundle.length / 1024).toFixed(1)}KB, 규칙당 위반 기록 ≤${A.cap}, 반환 예산 ${A.budget}B`);
