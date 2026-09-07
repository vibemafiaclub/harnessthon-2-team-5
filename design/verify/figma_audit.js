/* figma_audit — 생성물. 손으로 고치지 않는다. 규칙 15개, stage=design, 생성 2026-09-06T16:07:15.212Z */
/* audit-core — 판정 핵심. 순수 함수만. Node(require)와 Figma 플러그인 샌드박스(use_figma, 소스 인라인) 양쪽에서 돈다.
   여기에는 fs/path/process/require 를 쓰지 않는다. 마지막 module.exports 는 Node 에서만 평가된다. */

var AUDIT_CATALOG = ['contrast_ratio', 'min_size', 'min_font_size', 'image_fill_present', 'text_overflow', 'saturation_max',
  'color_allowlist', 'color_denylist', 'style_bound', 'multiple_of', 'scale_allowlist', 'reuse_ratio', 'name_pattern', 'variant_states_present'];
var AUDIT_IMPLEMENTED = ['color_allowlist', 'color_denylist', 'multiple_of', 'scale_allowlist', 'name_pattern', 'min_font_size', 'min_size', 'style_bound', 'variant_states_present'];

var HEX6 = /^#?[0-9a-fA-F]{6}$/;
function normHex(v) { if (typeof v !== 'string' || !HEX6.test(v)) return null; return ('#' + v.replace('#', '')).toUpperCase(); }
function rgbToHex(c) {
  if (!c || typeof c.r !== 'number') return null;
  var ch = function (x) { return Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0'); };
  return ('#' + ch(c.r) + ch(c.g) + ch(c.b)).toUpperCase();
}
function collectHex(node, acc) {
  acc = acc || {};
  if (node == null) return acc;
  if (typeof node === 'string') { var h = normHex(node); if (h) acc[h] = true; return acc; }
  if (Array.isArray(node)) { node.forEach(function (v) { collectHex(v, acc); }); return acc; }
  if (typeof node === 'object') { for (var k in node) { if (k === 'status' || k === 'source' || k === '_note') continue; collectHex(node[k], acc); } }
  return acc;
}
/* 이름으로 인터랙티브를 추정하는 목록. Chip·Icon·Row 는 표시용인 경우가 훨씬 많아 뺐다(실측 오탐 128건 중 대부분).
   진짜 근거는 reactions 다. 터치 타깃은 가장 바깥 것 하나 — 인터랙티브 조상이 있으면 자식은 제외한다. */
var INTERACTIVE_NAME = /^(Button|Btn|Input|Field|Tab|Toggle|Switch|Checkbox|Radio|Link|IconButton|ListItem|Cell|FAB|Menu(Item)?)\b/i;
var AUTO_NAMES = /^(Vector|Union|Subtract|Intersect|Exclude|Boolean|Ellipse|Rectangle|Line|Polygon|Star)\s*\d*$/;
function isInteractive(node) { return node.interactive === true || (node.reactions && node.reactions.length > 0) || INTERACTIVE_NAME.test(node.name || ''); }
function matches(node, sel) {
  if (sel && sel.exclude_name_matches && new RegExp(sel.exclude_name_matches).test(node.name || '')) return false;
  if (!sel) return true;
  if (sel.node_types && sel.node_types.indexOf(node.type) < 0) return false;
  if (sel.name_matches && !new RegExp(sel.name_matches).test(node.name || '')) return false;
  if (sel.has_auto_layout === true && !(node.layoutMode && node.layoutMode !== 'NONE')) return false;
  if (sel.has_image_fill === true && !(node.fills || []).some(function (f) { return f.type === 'IMAGE'; })) return false;
  if (sel.exclude_instance_children === true && node._inInstance) return false;
  if (sel.interactive_only === true) {
    if (!isInteractive(node)) return false;
    if (node._ancestorInteractive) return false;   // 터치 타깃은 가장 바깥 것 하나
  }
  return true;
}
function nodeColors(node) {
  var out = [];
  [['fill', node.fills], ['stroke', node.strokes]].forEach(function (pair) {
    (pair[1] || []).forEach(function (p) {
      if (p.visible === false) return;
      if (p.type && p.type !== 'SOLID') return;
      var hex = normHex(p.hex) || rgbToHex(p.color);
      if (hex) out.push({ prop: pair[0], hex: hex });
    });
  });
  return out;
}
var CHECKS = {
  color_allowlist: function (node, check) {
    var allowed = collectHex(check.allowed); if (!Object.keys(allowed).length) return [];
    return nodeColors(node).filter(function (c) { return !allowed[c.hex]; }).map(function (c) { return { property: c.prop, expected: '팔레트 내 토큰', actual: c.hex }; });
  },
  color_denylist: function (node, check) {
    var denied = collectHex(check.deny); if (!Object.keys(denied).length) return [];
    return nodeColors(node).filter(function (c) { return denied[c.hex]; }).map(function (c) { return { property: c.prop, expected: '참조 팔레트 밖의 도출한 색', actual: c.hex }; });
  },
  multiple_of: function (node, check) {
    var unit = Number(check.unit); if (!unit) return []; var out = [];
    (check.properties || []).forEach(function (prop) { var v = node[prop]; if (typeof v !== 'number') return;
      if (Math.abs(v % unit) > 1e-6 && Math.abs((v % unit) - unit) > 1e-6) out.push({ property: prop, expected: Math.round(v / unit) * unit, actual: v }); });
    return out;
  },
  scale_allowlist: function (node, check) {
    var scale = Array.isArray(check.scale) ? check.scale.map(Number) : []; if (!scale.length) return []; var out = [];
    var nearest = function (v) { return scale.reduce(function (a, b) { return (Math.abs(b - v) < Math.abs(a - v) || (Math.abs(b - v) === Math.abs(a - v) && b < a)) ? b : a; }); };
    (check.properties || []).forEach(function (prop) { var v = node[prop]; if (typeof v !== 'number') return; if (scale.indexOf(v) < 0) out.push({ property: prop, expected: nearest(v), actual: v }); });
    return out;
  },
  name_pattern: function (node, check) {
    var name = node.name || '';
    /* 인스턴스 내부(id 에 ';')와 의미 있는 부모 아래의 자동 생성 벡터(createNodeFromSvg 의 'Vector')는 통과 — 아이콘 path 하나하나에 역할 이름을 요구하지 않는다 */
    if (node._inInstance && check.include_instance_children !== true) return [];
    if (AUTO_NAMES.test(name) && node._parentSemantic) return [];
    for (var i = 0; i < (check.deny || []).length; i++) if (new RegExp(check.deny[i]).test(name)) return [{ property: 'name', expected: 'deny 패턴 위반 없음 (' + check.deny[i] + ')', actual: name }];
    if (check.allow && !new RegExp(check.allow).test(name)) return [{ property: 'name', expected: 'allow 패턴 만족 (' + check.allow + ')', actual: name }];
    return [];
  },
  min_font_size: function (node, check) {
    if (node.type !== 'TEXT' || typeof node.fontSize !== 'number') return [];
    return node.fontSize < Number(check.size_pt) ? [{ property: 'fontSize', expected: '≥' + check.size_pt, actual: node.fontSize }] : [];
  },
  style_bound: function (node, check) {
    var kind = check.style_kind || 'text';
    if (kind === 'text') { if (node.type !== 'TEXT') return []; if (node.textStyleId === 'mixed') return [{ property: 'textStyleId', expected: '단일 텍스트 스타일 바인딩', actual: 'mixed' }]; return node.textStyleId ? [] : [{ property: 'textStyleId', expected: '텍스트 스타일 바인딩', actual: '인라인' }]; }
    if (kind === 'fill') { if (!node.fills || !node.fills.length) return []; return (node.fillStyleId || (node.boundVariables || []).indexOf('fills') >= 0) ? [] : [{ property: 'fillStyleId', expected: '색 스타일/변수 바인딩', actual: '인라인' }]; }
    return [];
  },
  variant_states_present: function (node, check) {
    if (node.type !== 'COMPONENT_SET') return [];
    /* 컴포넌트별 요구 목록(required_by_component)이 있으면 그 이름의 것만, 없으면 전역 required. 목록에 없는 세트는 요구 없음. */
    var req = check.required_by_component ? check.required_by_component[node.name] : check.required;
    if (!req || !req.length) return [];
    var have = (node.variantValues || []).map(function (v) { return String(v).toLowerCase(); });
    var missing = req.filter(function (r) { var k = String(r).toLowerCase(); return !have.some(function (h) { return h === k || h.indexOf(k) >= 0; }); });
    return missing.length ? [{ property: 'variants', expected: req.join(', '), actual: '누락: ' + missing.join(', ') }] : [];
  },
  min_size: function (node, check) {
    if (typeof node.width !== 'number' || typeof node.height !== 'number') return [];
    var w = Number(check.width || 0), h = Number(check.height || 0);
    return (node.width < w || node.height < h) ? [{ property: 'size', expected: w + 'x' + h, actual: Math.round(node.width) + 'x' + Math.round(node.height) }] : [];
  },
};
function flatten(nodes) {
  var out = [];
  var walk = function (n, parent, ancInter, inInst, parentSemantic) {
    if (!n || typeof n !== 'object') return;
    var c = {}; for (var k in n) if (k !== 'children') c[k] = n[k];
    if (n.type === 'COMPONENT_SET' && !n.variantValues && n.children) c.variantValues = n.children.reduce(function (acc, ch) { var vp = ch.variantProperties || {}; for (var q in vp) acc.push(vp[q]); return acc; }, []);
    c._parent = parent; c._ancestorInteractive = ancInter; c._inInstance = inInst || (typeof n.id === 'string' && n.id.indexOf(';') >= 0); c._parentSemantic = parentSemantic;
    out.push(c);
    var semantic = !!(n.name && !AUTO_NAMES.test(n.name) && !/^(Frame|Group)\s*\d*$/.test(n.name));
    (n.children || []).forEach(function (ch) { walk(ch, n.name, ancInter || isInteractive(n), c._inInstance, semantic); });
  };
  (Array.isArray(nodes) ? nodes : [nodes]).forEach(function (n) { walk(n, null, false, false, false); });
  return out;
}
/* rules: compile 이 $tokens 를 이미 해석한 규칙 배열. perRuleCap: 규칙당 기록할 위반 수 상한(반환량 제어). */
function audit(opts) {
  var rules = opts.rules, stage = opts.stage, nodes = opts.nodes, target = opts.target, cap = opts.perRuleCap || 0;
  var flat = flatten(nodes).filter(function (n) { return n.visible !== false; });
  var violations = [], unchecked = [], summary = { blocker: 0, warning: 0, skipped_out_of_stage: 0, skipped_unimplemented: 0 }, perRule = {};
  rules.forEach(function (rule) {
    if ((rule.stage || []).indexOf(stage) < 0) { summary.skipped_out_of_stage++; return; }
    if (AUDIT_IMPLEMENTED.indexOf(rule.check.type) < 0) {
      summary.skipped_unimplemented++;
      if (rule.severity === 'blocker') unchecked.push({ rule: rule.id, title: rule.title, reason: 'skipped_unimplemented', requires_human_review: true, fix_hint: rule.fix_hint });
      return;
    }
    perRule[rule.id] = 0;
    flat.forEach(function (node) {
      if (!matches(node, rule.applies_to)) return;
      CHECKS[rule.check.type](node, rule.check).forEach(function (hit) {
        perRule[rule.id]++;
        summary[rule.severity === 'blocker' ? 'blocker' : 'warning']++;
        if (cap && perRule[rule.id] > cap) return;
        violations.push({ rule: rule.id, node: (node.name || '(unnamed)') + ' / ' + hit.property, node_id: node.id || null, expected: hit.expected, actual: hit.actual, severity: rule.severity, autofix: rule.autofix === true, fix_hint: rule.fix_hint });
      });
    });
  });
  /* passed_machine: 구현된 검사 기준으로 문을 여닫는 값. passed: 미구현 blocker 까지 사람이 확인한 뒤에야 참이 되는 값(리포트에서 사람이 올린다).
     둘을 나누지 않으면 검사기가 반쯤 구현된 동안 어떤 프로젝트도 게이트를 통과할 수 없다(실측). */
  return { stage: stage, target: target || null, nodes_inspected: flat.length,
    passed_machine: summary.blocker === 0, passed: summary.blocker === 0 && unchecked.length === 0,
    requires_human_review: unchecked.map(function (u) { return u.rule; }),
    violations: violations, violations_per_rule: perRule, truncated_per_rule_cap: cap || null, unchecked_blockers: unchecked, summary: summary };
}
/* Figma 노드 → 판정용 평면 객체. PAGE 처럼 속성이 없는 노드도 안전하게. */
function paintsOf(list) {
  if (!list || typeof list.map !== 'function') return [];
  return list.map(function (p) { return { type: p.type, visible: p.visible !== false, opacity: p.opacity, hex: p.hex ? normHex(p.hex) : ((p.type === 'SOLID' && p.color) ? rgbToHex(p.color) : undefined), hasImage: p.type === 'IMAGE' ? !!p.imageHash : undefined }; });
}
function serializeNode(node, mixed) {
  var has = function (k) { return k in node; };
  var o = { id: node.id, name: node.name, type: node.type, visible: has('visible') ? node.visible !== false : true,
    width: has('width') ? node.width : undefined, height: has('height') ? node.height : undefined,
    fills: has('fills') && node.fills !== mixed ? paintsOf(node.fills) : [], strokes: has('strokes') && node.strokes !== mixed ? paintsOf(node.strokes) : [],
    fillStyleId: has('fillStyleId') && node.fillStyleId !== mixed ? node.fillStyleId : undefined,
    textStyleId: has('textStyleId') ? (node.textStyleId === mixed ? 'mixed' : node.textStyleId) : undefined,
    boundVariables: node.boundVariables ? Object.keys(node.boundVariables) : undefined,
    layoutMode: has('layoutMode') ? node.layoutMode : undefined, itemSpacing: has('itemSpacing') ? node.itemSpacing : undefined,
    paddingTop: has('paddingTop') ? node.paddingTop : undefined, paddingRight: has('paddingRight') ? node.paddingRight : undefined,
    paddingBottom: has('paddingBottom') ? node.paddingBottom : undefined, paddingLeft: has('paddingLeft') ? node.paddingLeft : undefined,
    cornerRadius: has('cornerRadius') && node.cornerRadius !== mixed ? node.cornerRadius : undefined,
    fontSize: node.type === 'TEXT' && node.fontSize !== mixed ? node.fontSize : undefined,
    textAutoResize: node.type === 'TEXT' ? node.textAutoResize : undefined,
    isInstance: node.type === 'INSTANCE', variantProperties: node.variantProperties || undefined,
    variantValues: (node.type === 'COMPONENT_SET' && node.children) ? Array.prototype.reduce.call(node.children, function (acc, ch) { var vp = ch.variantProperties || {}; for (var k in vp) acc.push(vp[k]); return acc; }, []) : undefined,
    reactions: (node.reactions && node.reactions.length) ? node.reactions.length : undefined,
    interactive: !!(node.reactions && node.reactions.length) };
  for (var k in o) if (o[k] === undefined) delete o[k];
  return o;
}
function dumpTree(root, mixed, maxNodes, counter) {
  counter = counter || { n: 0 };
  if (++counter.n > maxNodes) throw new Error('노드 ' + maxNodes + '개 초과 — 대상 프레임을 좁혀라');
  var o = serializeNode(root, mixed);
  if ('children' in root && root.children && root.children.length) o.children = root.children.map(function (c) { return dumpTree(c, mixed, maxNodes, counter); });
  return o;
}

var RULES = [{"id":"contrast-text-aa","title":"본문 텍스트 대비율 WCAG AA","stage":["design"],"severity":"blocker","applies_to":{"node_types":["TEXT"]},"check":{"type":"contrast_ratio","min":4.5,"large_text_min":3,"large_text_threshold":{"size_pt":18,"bold_size_pt":14}},"autofix":false,"fix_hint":"전경색을 팔레트 내 다른 토큰으로 교체하거나 배경 surface를 바꾼다. 임의 색상 생성 금지."},{"id":"contrast-nontext-aa","title":"비텍스트 UI 요소 대비율","stage":["design"],"severity":"blocker","applies_to":{"node_types":["VECTOR","RECTANGLE","ELLIPSE","LINE"],"interactive_only":true},"check":{"type":"contrast_ratio","min":3},"autofix":false,"fix_hint":"팔레트 내 border 토큰 중 대비를 만족하는 것으로 교체한다."},{"id":"touch-target-min","title":"터치 타깃 최소 크기","stage":["wireframe","design"],"severity":"blocker","applies_to":{"interactive_only":true,"exclude_instance_children":true},"check":{"type":"min_size","width":44,"height":44,"include_padding":true},"autofix":true,"fix_hint":"노드 크기를 키우지 말고 패딩 또는 히트영역을 확장한다. 시각 크기는 유지."},{"id":"image-fill-valid","title":"이미지 깨짐 없음","stage":["design"],"severity":"blocker","applies_to":{"has_image_fill":true},"check":{"type":"image_fill_present"},"autofix":false,"fix_hint":"플레이스홀더를 채우거나, 의도된 빈 상태라면 empty state 컴포넌트로 교체한다."},{"id":"text-not-clipped","title":"텍스트 잘림 없음","stage":["wireframe","design"],"severity":"blocker","applies_to":{"node_types":["TEXT"]},"check":{"type":"text_overflow"},"autofix":true,"fix_hint":"부모를 hug 또는 auto-height로 바꾼다. 폰트 크기를 줄여서 해결하지 않는다."},{"id":"no-zero-size-node","title":"0 크기 / 보이지 않는 잔여 노드 없음","stage":["wireframe","design"],"severity":"warning","applies_to":{},"check":{"type":"min_size","width":1,"height":1},"autofix":true,"fix_hint":"삭제한다."},{"id":"text-size-min","title":"최소 가독 폰트 크기","stage":["design"],"severity":"warning","applies_to":{"node_types":["TEXT"]},"check":{"type":"min_font_size","size_pt":11},"autofix":false,"fix_hint":"타이포 스케일 내 상위 단계로 올린다. 스케일 밖 임의 값 금지."},{"id":"no-reference-color-copy","title":"참조 시스템 색 복사 금지","stage":["design"],"severity":"blocker","applies_to":{},"check":{"type":"color_denylist","deny":{"source_system":null,"values":[],"status":"filled","_note":"참조 시스템 미선언 — 금지 목록 없음"}},"autofix":false,"fix_hint":"참조 값을 지우고 PRD·클라이언트 반응에서 팔레트를 다시 도출한다. 역할 구성(몇 개의 역할, 어떤 상태 계약)은 참조를 따라도 되지만 hex는 이 도메인의 답이어야 한다. 참조 값과 우연히 같아졌다면 그것도 위반으로 본다 — 도출 과정이 없었다는 뜻이다."},{"id":"color-palette-allowlist","title":"컬러 팔레트 일관성","stage":["design"],"severity":"blocker","applies_to":{},"check":{"type":"color_allowlist","allowed":["#EAF7F5","#D2EFEA","#4DBFA8","#0D7A64","#095C4D","#063D33","#FFE3D9","#FF6F45","#C94A26","#FFFFFF","#F8F9F8","#EFF1F0","#DCE3E2","#CDD1CE","#909391","#6D7570","#414944","#171B18","#E6F5EA","#146C2E","#FFF3DC","#8A5A00","#FCE9E6","#B03A22","#E7F1FD","#1849A9","#E6EEEC","#2A4A44"]},"autofix":false,"fix_hint":"팔레트 밖 색은 가장 가까운 토큰으로 교체. 새 색을 만들지 않는다."},{"id":"spacing-grid","title":"Spacing 스케일 준수","stage":["wireframe","design"],"severity":"blocker","applies_to":{"has_auto_layout":true},"check":{"type":"scale_allowlist","scale":[0,4,8,12,16,20,24,32,40,48,64,80,96,2],"properties":["itemSpacing","paddingTop","paddingRight","paddingBottom","paddingLeft"]},"autofix":true,"fix_hint":"가장 가까운 스케일 값으로. 중간이면 작은 쪽."},{"id":"radius-scale","title":"Radius 스케일 준수","stage":["design"],"severity":"warning","applies_to":{},"check":{"type":"scale_allowlist","scale":[0,6,12,16,20,28,9999],"properties":["cornerRadius"]},"autofix":true,"fix_hint":"가장 가까운 radius 토큰으로."},{"id":"type-style-reuse","title":"타이포 스타일 재사용","stage":["design"],"severity":"blocker","applies_to":{"node_types":["TEXT"]},"check":{"type":"style_bound","style_kind":"text"},"autofix":false,"fix_hint":"인라인 폰트 설정을 스케일 내 텍스트 스타일 바인딩으로."},{"id":"component-reuse-rate","title":"컴포넌트 재사용률","stage":["design"],"severity":"warning","applies_to":{},"check":{"type":"reuse_ratio","min":0.7},"autofix":false,"fix_hint":"기존 컴포넌트로 대체 가능한 신규 노드를 인스턴스로."},{"id":"layer-naming-semantic","title":"레이어 네이밍 semantic","stage":["wireframe","design"],"severity":"warning","applies_to":{},"check":{"type":"name_pattern","deny":["^(Frame|Group|Rectangle|Ellipse|Vector|Line)\\s*\\d*$"]},"autofix":true,"fix_hint":"역할 기반 이름(Card/MeetingRow, Chip/Status)으로."},{"id":"variant-state-coverage","title":"Variant 상태 커버리지","stage":["design"],"severity":"blocker","applies_to":{"node_types":["COMPONENT_SET"]},"check":{"type":"variant_states_present","required":["Waiting","Closing","Confirmed","Done","Yes","No","Pending","Default","Disabled","Overlap","Deadline","Unselected","Selected-Yes","Selected-No","Normal","Long-text","Skeleton"]},"autofix":false,"fix_hint":"누락 상태 variant 추가. 품질은 C단계."}];
var STAGE = "design";
var CAP = 25;
var MAX_NODES = 4000;
var PAGE_NAME = "Screens";
var page = figma.currentPage;
if (PAGE_NAME) { var p = figma.root.children.find(function (x) { return x.name === PAGE_NAME; }); if (!p) return JSON.stringify({ error: '페이지 없음: ' + PAGE_NAME, pages: figma.root.children.map(function (x) { return x.name; }) }); await figma.setCurrentPageAsync(p); page = p; }
var roots = page.selection && page.selection.length ? page.selection : page.children;
var counter = { n: 0 };
var tree;
try { tree = Array.prototype.map.call(roots, function (r) { return dumpTree(r, figma.mixed, MAX_NODES, counter); }); }
catch (e) { return JSON.stringify({ error: String(e && e.message || e), nodes_seen: counter.n }); }
var report = audit({ rules: RULES, stage: STAGE, nodes: tree, target: page.name, perRuleCap: CAP });
report.page = page.name; report.roots = roots.length; report.generated_at = "2026-09-06T16:07:15.213Z";
return JSON.stringify(report);
