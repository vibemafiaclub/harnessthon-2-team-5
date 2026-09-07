/* audit-core — 판정 핵심. 순수 함수만. Node(require)와 Figma 플러그인 샌드박스(use_figma, 소스 인라인) 양쪽에서 돈다.
   여기에는 fs/path/process/require 를 쓰지 않는다. 마지막 module.exports 는 Node 에서만 평가된다.

   A검사 번호 ↔ check.type (design-figma-build/SKILL.md 3-D 보완 항목):
     A-9  프레임 규격        → frame_spec              (규칙 frame-spec, make-figma-audit 가 design.md §2 값으로 주입)
     A-12 텍스트 오버플로    → text_overflow           (규칙 text-not-clipped, guide/core.rules.json)
     A-13 주 행동 가시성     → primary_action_visible  (규칙 primary-action-visible, 주입)
     A-14 내용 절단 없음     → within_parent_bounds    (규칙 content-not-cut, 주입)
   번들 반환의 text_inventory(check-figma F-9 텍스트 일치율)·reactions(A-16 흐름 연결)는 textInventory / reactionEdges 가 만든다. */

var AUDIT_CATALOG = ['contrast_ratio', 'min_size', 'min_font_size', 'image_fill_present', 'text_overflow', 'saturation_max',
  'color_allowlist', 'color_denylist', 'style_bound', 'multiple_of', 'scale_allowlist', 'reuse_ratio', 'name_pattern', 'variant_states_present',
  'within_parent_bounds', 'primary_action_visible', 'frame_spec', 'icon_foreign_fill'];
var AUDIT_IMPLEMENTED = ['color_allowlist', 'color_denylist', 'multiple_of', 'scale_allowlist', 'name_pattern', 'min_font_size', 'min_size', 'style_bound', 'variant_states_present',
  'text_overflow', 'within_parent_bounds', 'primary_action_visible', 'frame_spec', 'icon_foreign_fill', 'binding_name_deny', 'top_info_dominant'];
/* 검사 타입을 CHECKS 에 넣고 이 목록에 안 넣으면 조용히 skipped_unimplemented 가 된다(D-43 실측: A-15 가 규칙 목록에만 있고 집계에 없음). 두 곳이 어긋나면 audit() 이 시작 시 오류를 낸다. */

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
  if (sel.exclude_node_types && sel.exclude_node_types.indexOf(node.type) >= 0) return false;
  if (sel.name_matches && !new RegExp(sel.name_matches).test(node.name || '')) return false;
  if (sel.has_auto_layout === true && !(node.layoutMode && node.layoutMode !== 'NONE')) return false;
  if (sel.has_image_fill === true && !(node.fills || []).some(function (f) { return f.type === 'IMAGE'; })) return false;
  if (sel.exclude_instance_children === true && node._inInstance) return false;
  /* 루트(페이지 직계 = 화면 프레임) 기준 선택자 — flatten 이 채운 _depth/_root 를 본다.
     root_only: 루트만 / descendants_only: 루트의 자손만 / root_name_matches·root_node_types: 소속 루트의 이름·타입 */
  if (sel.root_only === true && (node._depth || 0) !== 0) return false;
  if (sel.descendants_only === true && !(node._depth > 0)) return false;
  if (sel.root_name_matches && !new RegExp(sel.root_name_matches).test((node._root && node._root.name) || node.name || '')) return false;
  if (sel.root_node_types && sel.root_node_types.indexOf((node._root && node._root.type) || node.type) < 0) return false;
  if (sel.interactive_only === true) {
    /* require_reactions: 프로토타입 연결(reactions)이 있는 노드만 — 시안 단계에서 "무엇이 눌리는가"를 기계가 확신할 수 있는 유일한 근거.
       이름 추정만으로는 blocker 로 문을 잠그지 않는다(실측: Row 를 넣으면 Chip 오탐, 빼면 행 안 체크박스 오탐). */
    var hard = node.interactive === true || (node.reactions && (typeof node.reactions === 'number' ? node.reactions > 0 : node.reactions.length > 0));
    if (sel.require_reactions === true) { if (!hard) return false; }
    else { if (!isInteractive(node)) return false; if (sel.exclude_with_reactions === true && hard) return false; }
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
function visibleDescendants(node) { return (node._descendants || []).filter(function (d) { return d.visible !== false && !d._hidden; }); }
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
    /* allow(semantic 형식)는 컨테이너(check.allow_node_types, 기본 FRAME/COMPONENT/COMPONENT_SET/INSTANCE)와 비루트 노드에만 — TEXT·VECTOR 하나하나에 역할 이름을 요구하면 소음이고, 루트 화면 프레임 이름은 '<nn> <이름> / <state>' 규약이라 별도다(D-48). */
    var allowTypes = check.allow_node_types || ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'];
    if (check.allow && allowTypes.indexOf(node.type) >= 0 && (node._depth || 0) > 0 && !new RegExp(check.allow).test(name)) return [{ property: 'name', expected: 'semantic 이름 (' + check.allow + ')', actual: name }];
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
  /* A검사 7b — 아이콘 내부 이물(D-38): 아이콘 컨테이너 안에 VECTOR/BOOLEAN_OPERATION 외의 "보이는 fill 을 가진" RECTANGLE·FRAME·ELLIPSE 가 있으면 위반.
     opacity 와 무관(0.14 여도 보인다). 덮개(D-10)·배경 칩(D-38) 둘 다 걸린다. 예외: 활성 표시 Indicator, 컨테이너 자신(fill 없음). */
  icon_foreign_fill: function (node, check, ctx) {
    var iconRe = new RegExp(check.icon_name_pattern || '^Icon/', 'i');
    var inIcon = (node._ancestorNames || []).some(function (a) { return iconRe.test(a || ''); });
    if (!inIcon) return [];
    if (['RECTANGLE', 'FRAME', 'ELLIPSE', 'POLYGON', 'STAR'].indexOf(node.type) < 0) return [];
    if (/indicator/i.test(node.name || '')) return [];
    var vis = (node.fills || []).filter(function (f) { return f.visible !== false && f.type !== 'IMAGE' && (f.opacity == null || f.opacity > 0); });
    if (!vis.length) return [];
    var hit = { property: 'fills', expected: '아이콘 안에는 벡터만 (판·칩·테두리 금지)', actual: node.type + ' fill ' + (vis[0].hex || vis[0].type) + (vis[0].opacity != null ? ' @' + vis[0].opacity : '') };
    /* 반복 아이콘(같은 이름의 인스턴스가 blocker_if_repeats 개 이상 — 탭바·목록 행)의 이물은 사실상 항상 실수 → blocker 로 승격 */
    var iconName = (node._ancestorNames || []).filter(function (a) { return iconRe.test(a || ''); }).pop();
    var minRep = Number(check.blocker_if_repeats || 0);
    if (minRep && ctx && ctx.instanceCount && iconName && (ctx.instanceCount[iconName] || 0) >= minRep) { hit.severity = 'blocker'; hit.escalation_reason = iconName + ' 인스턴스 ' + ctx.instanceCount[iconName] + '개 반복'; }
    return [hit];
  },
  /* A-4 터치 타깃 — 노드 자체가 w×h 이상이면 통과. 체크박스·라디오처럼 시각 크기가 규격인 요소는 실제 터치 대상이 그것을 담은 행이므로(test2 실측: 24×24 체크박스 19건, Figma 에는 히트영역 개념이 없다)
     조상 중 이름이 check.container_pattern(기본 Row/ListItem/Cell/Item/Option/Card) 이고 크기가 w×h 이상인 것이 있으면 통과. 단독(행 밖) 요소는 그대로 위반. */
  min_size: function (node, check) {
    if (typeof node.width !== 'number' || typeof node.height !== 'number') return [];
    var w = Number(check.width || 0), h = Number(check.height || 0);
    if (node.width >= w && node.height >= h) return [];
    /* 경계 매칭 — Row/Person · person-row · Card/Meeting · meeting-card · contact_cell 전부(test2 실측: 하네스 명명이 아닌 파일의 person-row 가 ^Row 에 안 걸려 19건 잔존). */
    var contRe = new RegExp(check.container_pattern || '(^|[-_/ ])(row|listitem|list-item|list_item|cell|item|option|card)([-_/ ]|$)', 'i');
    var inRow = check.container_ok !== false && (node._ancestors || []).some(function (a) { return contRe.test(a.name || '') && typeof a.width === 'number' && typeof a.height === 'number' && a.width >= w && a.height >= h; });
    if (inRow) return [];
    return [{ property: 'size', expected: w + 'x' + h + ' (또는 row/item/cell/option/card 조상 ≥ ' + w + 'x' + h + ')', actual: Math.round(node.width) + 'x' + Math.round(node.height) }];
  },
  /* A-12 텍스트 오버플로 — 도메인 최장 문자열을 넣은 `/ long` 프레임(check.frame_matches, 기본 /\/\s*long\s*$/)의 TEXT 가
     고정 크기(textAutoResize NONE)거나 말줄임(textTruncation ENDING, 구 API 의 TRUNCATE)이면 실데이터에서 잘린다. 다른 프레임의 TEXT 는 대상 아님.
     frame_matches 를 '' 로 주면 모든 프레임에 적용. */
  text_overflow: function (node, check) {
    if (node.type !== 'TEXT') return [];
    var fm = (check.frame_matches === undefined || check.frame_matches === null) ? '\\/\\s*long\\s*$' : check.frame_matches;
    var rootName = (node._root && node._root.name) || node.name || '';
    if (fm && !new RegExp(fm).test(rootName)) return [];
    var out = [];
    if (node.textAutoResize === 'NONE') out.push({ property: 'textAutoResize', expected: 'HEIGHT 또는 WIDTH_AND_HEIGHT (내용만큼 늘어남)', actual: 'NONE (고정 크기 — 긴 문자열이 잘림)' });
    if (node.textAutoResize === 'TRUNCATE' || node.textTruncation === 'ENDING') out.push({ property: 'textTruncation', expected: 'DISABLED', actual: 'ENDING (말줄임 — 긴 문자열이 …로 사라짐)' });
    return out;
  },
  /* A-14 내용 절단 없음 — 루트 화면 프레임 기준 상대 좌표(flatten 이 조상 x/y 를 누적)로 자식의 y+height 가 프레임 높이 안에 있는가.
     clipsContent 와 무관하게 센다: clip 이면 잘려 숨고, 아니면 프레임 밖으로 튀어나온다 — 둘 다 결함(D-26·D-34). 처방은 프레임을 늘리는 것.
     check.axis 'xy' 면 x+width 도 본다(기본 'y' — 가로 스크롤 캐러셀 오탐 방지). 좌표가 직렬화되지 않은 덤프(구 extract-nodes)는 판정하지 않는다. */
  /* A-15 바인딩 이름 금지 — 노드에 직접 바인딩된 변수 이름이 check.deny 패턴(기본 primitive 계층)에 걸리면 위반. semantic 만 직접 쓰고 primitive 는 alias 로만 쓴다(D-43: 값으로 변수를 역추적하면 alias 사슬 끝인 primitive 가 잡힌다).
     boundVariableNames 가 없는 덤프(구 번들·Figma 밖)는 판정하지 않는다. */
  binding_name_deny: function (node, check) {
    var names = node.boundVariableNames; if (!names || !names.length) return [];
    var deny = (check.deny && check.deny.length ? check.deny : ['(^|/)primitive/']).map(function (p) { return new RegExp(p, 'i'); });
    var out = [];
    for (var i = 0; i < names.length; i++) { var pair = names[i]; var eq = pair.indexOf('='); var prop = eq >= 0 ? pair.slice(0, eq) : '?', nm = eq >= 0 ? pair.slice(eq + 1) : pair;
      if (deny.some(function (re) { return re.test(nm); })) out.push({ property: prop, expected: 'semantic 변수 (primitive 는 alias 로만)', actual: nm }); }
    return out;
  },
  within_parent_bounds: function (node, check) {
    var root = node._root; if (!root || root === node || (node._depth || 0) === 0) return [];
    if (typeof node.width !== 'number' || typeof node.height !== 'number' || typeof node._relX !== 'number' || typeof node._relY !== 'number') return [];
    if (typeof root.height !== 'number') return [];
    var tol = typeof check.tolerance === 'number' ? check.tolerance : 1;
    var out = [];
    var bottom = node._relY + node.height, right = node._relX + node.width;
    if (node._relY < -tol || bottom > root.height + tol) out.push({ property: 'y+height', expected: '0 ≤ y, y+height ≤ ' + Math.round(root.height) + ' (' + (root.name || '루트') + ' 높이)', actual: 'y=' + Math.round(node._relY) + ', y+height=' + Math.round(bottom) });
    if (check.axis === 'xy' && typeof root.width === 'number' && (node._relX < -tol || right > root.width + tol)) out.push({ property: 'x+width', expected: '0 ≤ x, x+width ≤ ' + Math.round(root.width), actual: 'x=' + Math.round(node._relX) + ', x+width=' + Math.round(right) });
    return out;
  },
  /* A-13 주 행동 가시성 — 루트 화면 프레임마다 `Action/Primary`(check.name) 가 정확히 1개이고, 그 노드가 첫 화면(y+height ≤ check.fold, 기본 844) 안에 있거나
     조상에 `Bar/Action`(check.bar, 하단 고정 바) 이 있다. 주 행동이 없는 화면은 프레임 **이름** 접미사 [no-primary](또는 자식 이름 — FRAME 에는 description 이 없다)로 제외한다(D-26). */
  primary_action_visible: function (node, check) {
    if ((node._depth || 0) !== 0) return [];
    var nameRe = new RegExp(check.name || '^Action\\/Primary$');
    var barRe = new RegExp(check.bar || '^Bar\\/Action');
    var fold = Number(check.fold) || 844;
    var marker = check.no_primary_marker || 'no-primary';
    var desc = visibleDescendants(node);
    var prim = desc.filter(function (d) { return nameRe.test(d.name || ''); });
    if (prim.length === 0) {
      var optOut = [node.description || '', node.name || ''].join(' ').indexOf(marker) >= 0 || desc.some(function (d) { return (d.name || '').indexOf(marker) >= 0; });
      return optOut ? [] : [{ property: 'Action/Primary', expected: '정확히 1개 (주 행동 없는 화면은 프레임 이름 접미사 [' + marker + '])', actual: '0개' }];
    }
    if (prim.length > 1) return [{ property: 'Action/Primary', expected: '정확히 1개', actual: prim.length + '개: ' + prim.map(function (p) { return p.id || p.name; }).join(', ') }];
    var p = prim[0];
    if ((p._ancestorNames || []).some(function (nm) { return barRe.test(nm); })) return [];
    if (typeof p._relY !== 'number' || typeof p.height !== 'number') return [{ property: 'Action/Primary 위치', expected: 'y+height ≤ ' + fold + ' 또는 조상 Bar/Action', actual: '좌표 없음 — x/y 가 직렬화되지 않은 덤프(번들을 다시 생성)' }];
    var bottom = p._relY + p.height;
    if (bottom <= fold + 0.5) return [];
    var cut = typeof node.height === 'number' && bottom > node.height + 0.5;
    return [{ property: 'Action/Primary 위치', expected: 'y+height ≤ ' + fold + ' 또는 조상 Bar/Action', actual: 'y+height=' + Math.round(bottom) + (cut ? ' (프레임 밖으로 잘림)' : ' (첫 화면 아래 — 스크롤해야 보임)') }];
  },
  /* A-17 1등 정보 지배 — 루트 화면 프레임마다 이름 `Info/Top`(check.name) 노드 정확히 1개, 첫 화면(y+height ≤ check.fold) 안, 그 안의 TEXT 최대 fontSize 가
     프레임 첫 화면 안 다른 TEXT 의 최대 fontSize 이상(같으면 통과). brief §2 '이 화면의 1등 정보' → 초안 data-role=top-info(H-15) → Figma Info/Top 으로 이어지는 마지막 고리(U-5). 주 행동만 있는 화면은 description·이름 접미사 [no-top-info] 로 제외. */
  top_info_dominant: function (node, check) {
    if ((node._depth || 0) !== 0) return [];
    var nameRe = new RegExp(check.name || '^Info\\/Top$'); var fold = Number(check.fold) || 844; var marker = check.optout_marker || 'no-top-info';
    if (((node.description || '') + ' ' + (node.name || '')).indexOf(marker) >= 0) return [];
    var desc = visibleDescendants(node); var tops = desc.filter(function (d) { return nameRe.test(d.name || ''); });
    if (tops.length !== 1) return [{ property: 'Info/Top', expected: '정확히 1개 (없는 화면은 이름 접미사 [' + marker + '])', actual: tops.length + '개' }];
    var t = tops[0]; if (typeof t._relY === 'number' && typeof t.height === 'number' && t._relY + t.height > fold + 0.5) return [{ property: 'Info/Top 위치', expected: 'y+height ≤ ' + fold + ' (첫 화면 안)', actual: 'y+height=' + Math.round(t._relY + t.height) }];
    var inTop = desc.filter(function (d) { return d.type === 'TEXT' && typeof d.fontSize === 'number' && (d._ancestorNames || []).some(function (a) { return nameRe.test(a || ''); }); });
    var topMax = inTop.reduce(function (m, d) { return Math.max(m, d.fontSize); }, t.type === 'TEXT' && typeof t.fontSize === 'number' ? t.fontSize : 0);
    var others = desc.filter(function (d) { return d.type === 'TEXT' && typeof d.fontSize === 'number' && inTop.indexOf(d) < 0 && d !== t && (typeof d._relY !== 'number' || d._relY <= fold); });
    var otherMax = others.reduce(function (m, d) { return Math.max(m, d.fontSize); }, 0);
    if (!topMax) return [{ property: 'Info/Top', expected: '안에 TEXT ≥1', actual: 'TEXT 없음' }];
    return topMax + 0.5 < otherMax ? [{ property: 'Info/Top fontSize', expected: '≥ 첫 화면의 다른 TEXT 최대 ' + otherMax, actual: String(topMax) }] : [];
  },
  /* A-9 프레임 규격 — 루트 화면 프레임의 폭 == check.width(design.md §2), 높이 ≥ check.min_height(내용에 맞춰 늘어남, hug 허용),
     required_children 각 패턴(상태바·탭바 이름)에 맞는 보이는 자손 ≥1. 값은 make-figma-audit 가 design.md §2 에서 읽어 넣는다. */
  frame_spec: function (node, check) {
    if ((node._depth || 0) !== 0) return [];
    var out = [];
    var w = Number(check.width) || 0, minH = Number(check.min_height) || 0;
    if (w && typeof node.width === 'number' && Math.abs(node.width - w) > 0.5) out.push({ property: 'width', expected: w, actual: Math.round(node.width) });
    if (minH && typeof node.height === 'number' && node.height < minH - 0.5) out.push({ property: 'height', expected: '≥' + minH + ' (내용에 맞춰 늘림)', actual: Math.round(node.height) });
    var desc = visibleDescendants(node);
    /* 탭바는 화면 하나하나의 예외가 아니라 IA 의 성질이다(test2 반박, D-46): brief §2 진입 경로가 '탭/앱 실행 직후' 인 루트 화면에만 탭바가 있고,
       행 탭·+ 버튼·완료 직후·초대 링크로 들어가는 push/modal/외부 화면에는 없어야 한다. check.tab_screens(['01','03'] — 프레임 이름 앞 번호)가 있으면 그 기준으로
       양방향(있어야 하는데 없음 / 없어야 하는데 있음)을 본다. 없으면 구 동작(전부 요구)이되 이름 접미사 [no-tabbar] 로 뺄 수 있다. FRAME 에는 description 이 없으므로 표시는 이름뿐이다. */
    var nm = String(node.name || ''); var nn = (nm.match(/^\s*(\d{2})\b/) || [])[1] || null;
    var tabScreens = Array.isArray(check.tab_screens) ? check.tab_screens.map(String) : null;
    var optOut = /\[no-tabbar\]/i.test(nm) || nm.indexOf(check.tabbar_optout_marker || 'no-tabbar') >= 0;
    var isTab = function (pat) { return /tab/i.test(pat); };
    (check.required_children || []).forEach(function (pat) {
      var re = new RegExp(pat); var present = desc.some(function (d) { return re.test(d.name || ''); });
      if (isTab(pat)) {
        if (tabScreens) {
          var wantTab = nn != null && tabScreens.indexOf(nn) >= 0;
          if (wantTab && !present) out.push({ property: 'children', expected: '탭바(/' + pat + '/) — brief §2 진입 경로가 탭인 화면 ' + nn, actual: '없음' });
          if (!wantTab && present) out.push({ property: 'children', expected: '탭바 없음 — brief §2 진입 경로가 탭이 아닌(push·modal·외부) 화면' + (nn ? ' ' + nn : ''), actual: '탭바 있음' });
        } else if (!optOut && !present) out.push({ property: 'children', expected: '이름이 /' + pat + '/ 인 보이는 자손 ≥1 (없어야 하는 화면은 이름 접미사 [no-tabbar])', actual: '없음' });
      } else if (!present) out.push({ property: 'children', expected: '이름이 /' + pat + '/ 인 보이는 자손 ≥1', actual: '없음' });
    });
    return out;
  },
};
/* 트리 → 평면 배열. 각 노드에 판정용 컨텍스트를 붙인다:
   _parent·_ancestorInteractive·_inInstance·_parentSemantic(기존) / _depth(루트 0) / _root(소속 루트 객체) / _relX·_relY(루트 기준 상대 좌표, 조상 x/y 누적 — 좌표 없는 조상이 있으면 null)
   / _ancestorNames(루트부터 부모까지 이름) / _hidden(숨은 조상 아래) / _descendants(루트에만: 자손 전부).
   SECTION 은 정리용 컨테이너 — 그 자식(화면 프레임)을 루트로 본다(_depth -1 로 표시). */
function flatten(nodes) {
  var out = [];
  var walk = function (n, ctx) {
    if (!n || typeof n !== 'object') return;
    var c = {}; for (var k in n) if (k !== 'children') c[k] = n[k];
    if (n.type === 'COMPONENT_SET' && !n.variantValues && n.children) c.variantValues = n.children.reduce(function (acc, ch) { var vp = ch.variantProperties || {}; for (var q in vp) acc.push(vp[q]); return acc; }, []);
    c._parent = ctx.parentName; c._ancestorInteractive = ctx.ancInter; c._inInstance = ctx.inInst || (typeof n.id === 'string' && n.id.indexOf(';') >= 0); c._parentSemantic = ctx.parentSemantic;
    c._depth = ctx.depth; c._hidden = ctx.hidden; c._ancestorNames = ctx.ancestorNames; c._ancestors = ctx.ancestors;
    var hasXY = typeof n.x === 'number' && typeof n.y === 'number';
    if (ctx.depth === 0) { c._relX = 0; c._relY = 0; c._root = c; c._descendants = []; }
    else { c._relX = (ctx.relX === null || !hasXY) ? null : ctx.relX + n.x; c._relY = (ctx.relY === null || !hasXY) ? null : ctx.relY + n.y; c._root = ctx.root; ctx.root._descendants.push(c); }
    out.push(c);
    var semantic = !!(n.name && !AUTO_NAMES.test(n.name) && !/^(Frame|Group)\s*\d*$/.test(n.name));
    var childCtx = { parentName: n.name, ancInter: ctx.ancInter || isInteractive(n), inInst: c._inInstance, parentSemantic: semantic, depth: ctx.depth + 1,
      hidden: ctx.hidden || n.visible === false, relX: c._relX, relY: c._relY, ancestorNames: ctx.ancestorNames.concat([n.name || '']), ancestors: ctx.ancestors.concat([{ name: n.name || '', width: n.width, height: n.height }]), root: c._root };
    (n.children || []).forEach(function (ch) { walk(ch, childCtx); });
  };
  var rootCtx = function () { return { parentName: null, ancInter: false, inInst: false, parentSemantic: false, depth: 0, hidden: false, relX: 0, relY: 0, ancestorNames: [], ancestors: [], root: null }; };
  (Array.isArray(nodes) ? nodes : [nodes]).forEach(function (n) {
    if (n && n.type === 'SECTION') {
      var s = {}; for (var k in n) if (k !== 'children') s[k] = n[k];
      s._depth = -1; s._section = true; s._ancestorNames = []; s._ancestors = []; s._hidden = false; out.push(s);
      (n.children || []).forEach(function (ch) { walk(ch, rootCtx()); });
      return;
    }
    walk(n, rootCtx());
  });
  return out;
}
/* rules: compile 이 $tokens 를 이미 해석한 규칙 배열. perRuleCap: 규칙당 기록할 위반 수 상한(반환량 제어). */
function audit(opts) {
  var rules = opts.rules, stage = opts.stage, nodes = opts.nodes, target = opts.target, cap = opts.perRuleCap || 0;
  /* 숨은 노드와 숨은 조상 아래의 노드는 렌더되지 않으므로 판정하지 않는다 */
  var flat = flatten(nodes).filter(function (n) { return n.visible !== false && !n._hidden; });
  var violations = [], unchecked = [], summary = { blocker: 0, warning: 0, skipped_out_of_stage: 0, skipped_unimplemented: 0 }, perRule = {}, applicable = {}, skippedRules = [];
  var missing = Object.keys(CHECKS).filter(function (t) { return AUDIT_IMPLEMENTED.indexOf(t) < 0; });
  if (missing.length) throw new Error('CHECKS 에 있으나 AUDIT_IMPLEMENTED 에 없는 검사 타입: ' + missing.join(', '));
  /* 검사 컨텍스트: 같은 이름의 INSTANCE 개수(반복 컴포넌트 판정용) */
  var instanceCount = {}; flat.forEach(function (n) { if (n.type === 'INSTANCE' && n.name) instanceCount[n.name] = (instanceCount[n.name] || 0) + 1; });
  var ctx = { flat: flat, instanceCount: instanceCount };
  rules.forEach(function (rule) {
    if ((rule.stage || []).indexOf(stage) < 0) { summary.skipped_out_of_stage++; return; }
    if (AUDIT_IMPLEMENTED.indexOf(rule.check.type) < 0) {
      summary.skipped_unimplemented++; skippedRules.push(rule.id + ':' + rule.check.type);
      if (rule.severity === 'blocker') unchecked.push({ rule: rule.id, title: rule.title, reason: 'skipped_unimplemented', requires_human_review: true, fix_hint: rule.fix_hint });
      return;
    }
    perRule[rule.id] = 0; applicable[rule.id] = 0;
    flat.forEach(function (node) {
      if (!matches(node, rule.applies_to)) return;
      applicable[rule.id]++;
      CHECKS[rule.check.type](node, rule.check, ctx).forEach(function (hit) {
        var sev = hit.severity || rule.severity;   /* 검사가 히트별로 severity 를 올릴 수 있다(반복 아이콘의 이물 등) */
        perRule[rule.id]++;
        summary[sev === 'blocker' ? 'blocker' : 'warning']++;
        if (cap && perRule[rule.id] > cap) return;
        violations.push({ rule: rule.id, node: (node.name || '(unnamed)') + ' / ' + hit.property, node_id: node.id || null, expected: hit.expected, actual: hit.actual, severity: sev, autofix: rule.autofix === true, fix_hint: rule.fix_hint, escalated: sev !== rule.severity ? (hit.escalation_reason || true) : undefined });
      });
    });
  });
  /* passed_machine: 구현된 검사 기준으로 문을 여닫는 값. passed: 미구현 blocker 까지 사람이 확인한 뒤에야 참이 되는 값(리포트에서 사람이 올린다).
     둘을 나누지 않으면 검사기가 반쯤 구현된 동안 어떤 프로젝트도 게이트를 통과할 수 없다(실측). */
  return { stage: stage, target: target || null, nodes_inspected: flat.length,
    passed_machine: summary.blocker === 0, passed: summary.blocker === 0 && unchecked.length === 0,
    requires_human_review: unchecked.map(function (u) { return u.rule; }),
    violations: violations, violations_per_rule: perRule, applicable_per_rule: applicable,
    /* 적용 대상 노드가 0개인 규칙 — "위반 0" 과 "대상 없음" 을 구분한다(실측: variant 규칙이 Components 페이지를 안 봐서 0건이 통과처럼 보임) */
    not_applicable: Object.keys(applicable).filter(function (id) { return applicable[id] === 0; }),
    truncated_per_rule_cap: cap || null, unchecked_blockers: unchecked, skipped_unimplemented_rules: skippedRules, summary: summary };
}
/* Figma 노드 → 판정용 평면 객체. PAGE 처럼 속성이 없는 노드도 안전하게. */
function paintsOf(list) {
  if (!list || typeof list.map !== 'function') return [];
  return list.map(function (p) { return { type: p.type, visible: p.visible !== false, opacity: p.opacity, hex: p.hex ? normHex(p.hex) : ((p.type === 'SOLID' && p.color) ? rgbToHex(p.color) : undefined), hasImage: p.type === 'IMAGE' ? !!p.imageHash : undefined }; });
}
/* reactions → 목적지 노드 id 목록(중복 제거, ≤8). 신 API 의 actions[] 와 구 API 의 action 둘 다 읽는다. NODE 이동만 센다(오버레이 열기·뒤로가기는 제외). */
function reactionTargetsOf(list) {
  if (!list || typeof list.length !== 'number' || !list.length) return undefined;
  var ids = [];
  for (var i = 0; i < list.length; i++) {
    var r = list[i]; if (!r) continue;
    var acts = (r.actions && typeof r.actions.length === 'number') ? r.actions : (r.action ? [r.action] : []);
    for (var j = 0; j < acts.length; j++) { var a = acts[j]; if (a && a.type === 'NODE' && a.destinationId && ids.indexOf(a.destinationId) < 0) ids.push(a.destinationId); }
  }
  return ids.length ? ids.slice(0, 8) : undefined;
}
function boundVariableNamesOf(bv) {
  if (!bv || typeof figma === 'undefined' || !figma.variables || typeof figma.variables.getVariableById !== 'function') return undefined;
  var out = [];
  for (var k in bv) { var v = bv[k]; var list = Array.isArray(v) ? v : [v];
    for (var i = 0; i < list.length; i++) { var a = list[i]; if (!a || !a.id) continue; try { var vr = figma.variables.getVariableById(a.id); if (vr && vr.name && out.indexOf(k + '=' + vr.name) < 0) out.push(k + '=' + vr.name); } catch (e) {} } }
  return out.length ? out : undefined;
}
function serializeNode(node, mixed) {
  var has = function (k) { return k in node; };
  var o = { id: node.id, name: node.name, type: node.type, visible: has('visible') ? node.visible !== false : true,
    /* x/y 는 부모 기준 상대 좌표(Figma 규약). flatten 이 루트 기준으로 누적한다 — A-13·A-14 의 근거. */
    x: has('x') && typeof node.x === 'number' ? node.x : undefined, y: has('y') && typeof node.y === 'number' ? node.y : undefined,
    width: has('width') ? node.width : undefined, height: has('height') ? node.height : undefined,
    clipsContent: has('clipsContent') ? node.clipsContent === true : undefined,
    description: has('description') && typeof node.description === 'string' && node.description ? node.description.slice(0, 80) : undefined,
    fills: has('fills') && node.fills !== mixed ? paintsOf(node.fills) : [], strokes: has('strokes') && node.strokes !== mixed ? paintsOf(node.strokes) : [],
    fillStyleId: has('fillStyleId') && node.fillStyleId !== mixed ? node.fillStyleId : undefined,
    textStyleId: has('textStyleId') ? (node.textStyleId === mixed ? 'mixed' : node.textStyleId) : undefined,
    boundVariables: node.boundVariables ? Object.keys(node.boundVariables) : undefined,
    /* 바인딩된 변수의 이름(예: color/primitive/neutral/300). Figma 안에서만 해석된다(figma.variables.getVariableById) — binding_name_deny(A검사 15)의 재료. */
    boundVariableNames: boundVariableNamesOf(node.boundVariables),
    layoutMode: has('layoutMode') ? node.layoutMode : undefined, itemSpacing: has('itemSpacing') ? node.itemSpacing : undefined,
    paddingTop: has('paddingTop') ? node.paddingTop : undefined, paddingRight: has('paddingRight') ? node.paddingRight : undefined,
    paddingBottom: has('paddingBottom') ? node.paddingBottom : undefined, paddingLeft: has('paddingLeft') ? node.paddingLeft : undefined,
    cornerRadius: has('cornerRadius') && node.cornerRadius !== mixed ? node.cornerRadius : undefined,
    /* characters 는 TEXT 만, 40자까지 — text_inventory(F-9 텍스트 일치율)의 재료. 20KB 반환 상한 때문에 전문을 싣지 않는다. */
    characters: node.type === 'TEXT' && typeof node.characters === 'string' ? node.characters.slice(0, 40) : undefined,
    fontSize: node.type === 'TEXT' && node.fontSize !== mixed ? node.fontSize : undefined,
    textAutoResize: node.type === 'TEXT' ? node.textAutoResize : undefined,
    textTruncation: node.type === 'TEXT' && has('textTruncation') ? node.textTruncation : undefined,
    isInstance: node.type === 'INSTANCE', variantProperties: node.variantProperties || undefined,
    variantValues: (node.type === 'COMPONENT_SET' && node.children) ? Array.prototype.reduce.call(node.children, function (acc, ch) { var vp = ch.variantProperties || {}; for (var k in vp) acc.push(vp[k]); return acc; }, []) : undefined,
    reactions: (node.reactions && node.reactions.length) ? node.reactions.length : undefined,
    reactionTargets: has('reactions') ? reactionTargetsOf(node.reactions) : undefined,
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
/* 텍스트 재고 — 루트(화면 프레임)별로 보이는 TEXT 의 characters 를 트리 순서로(공백 정규화·중복 제거·각 maxChars 자·프레임당 perFrame 개).
   total 은 중복 제거 후 전체 수라 texts.length < total 이면 잘린 것. SECTION 은 그 자식을 루트로 편다. check-figma F-9 가 초안 HTML 의 텍스트 집합과 일치율을 센다. */
function textInventory(tree, opts) {
  opts = opts || {}; var perFrame = opts.perFrame || 60, maxChars = opts.maxChars || 40;
  var roots = []; (Array.isArray(tree) ? tree : [tree]).forEach(function (n) { if (n && n.type === 'SECTION') (n.children || []).forEach(function (c) { roots.push(c); }); else if (n) roots.push(n); });
  return roots.map(function (root) {
    var texts = [], seen = {}, total = 0;
    var walk = function (n) {
      if (!n || n.visible === false) return;
      if (n.type === 'TEXT' && typeof n.characters === 'string') {
        var t = n.characters.replace(/\s+/g, ' ').trim().slice(0, maxChars);
        if (t && !seen[t]) { seen[t] = true; total++; if (texts.length < perFrame) texts.push(t); }
      }
      (n.children || []).forEach(walk);
    };
    walk(root);
    return { frame: root.name || '(unnamed)', id: root.id || null, texts: texts, total: total };
  });
}
/* 프로토타입 연결 — 노드의 reactionTargets(목적지 노드 id)를 루트(화면 프레임) 단위 간선 {from_frame, to_frame} 으로(중복 제거, ≤max).
   목적지가 이 트리 밖(다른 페이지·삭제된 노드)이면 to_frame null + to_id. check-figma A-16 이 brief §2 진입 경로와 대조한다. */
function reactionEdges(tree, opts) {
  opts = opts || {}; var max = opts.max || 120;
  var roots = []; (Array.isArray(tree) ? tree : [tree]).forEach(function (n) { if (n && n.type === 'SECTION') (n.children || []).forEach(function (c) { roots.push(c); }); else if (n) roots.push(n); });
  var idToRoot = {};
  roots.forEach(function (root) { var walk = function (n) { if (!n) return; if (n.id) idToRoot[n.id] = root.name || '(unnamed)'; (n.children || []).forEach(walk); }; walk(root); });
  var edges = [], seen = {};
  roots.forEach(function (root) {
    var walk = function (n) {
      if (!n) return;
      (n.reactionTargets || []).forEach(function (id) {
        var to = idToRoot[id] || null; var key = (root.name || '') + '|' + (to || id);
        if (seen[key] || edges.length >= max) return; seen[key] = true;
        var e = { from_frame: root.name || '(unnamed)', to_frame: to }; if (!to) e.to_id = id;
        edges.push(e);
      });
      (n.children || []).forEach(walk);
    };
    walk(root);
  });
  return edges;
}
/* JSON 문자열의 UTF-8 바이트 수 — use_figma 반환 상한(약 20KB)에 맞추기 위한 계측. 한글은 3바이트라 length 로는 부족하다. */
function utf8Len(s) {
  var n = 0;
  for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); if (c < 0x80) n += 1; else if (c < 0x800) n += 2; else if (c >= 0xD800 && c <= 0xDBFF) { n += 4; i++; } else n += 3; }
  return n;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AUDIT_CATALOG: AUDIT_CATALOG, AUDIT_IMPLEMENTED: AUDIT_IMPLEMENTED, normHex: normHex, rgbToHex: rgbToHex, collectHex: collectHex, matches: matches, CHECKS: CHECKS, flatten: flatten, audit: audit,
    serializeNode: serializeNode, dumpTree: dumpTree, paintsOf: paintsOf, reactionTargetsOf: reactionTargetsOf, textInventory: textInventory, reactionEdges: reactionEdges, utf8Len: utf8Len };
}
