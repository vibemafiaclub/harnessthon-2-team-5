/**
 * 노드 덤프 추출기 — `use_figma` 안에서 실행하는 코드.
 *
 * 이 파일은 Node.js로 직접 돌리지 않는다. 본문을 use_figma 의 코드로 전달한다.
 * (호출 전 `figma-use` 스킬 로드 필수 — 선택이 아니다.)
 *
 * 규약: Figma MCP rate limit 때문에 **1회 호출로 전체 노드를 순회**한다.
 * 규칙마다 따로 호출하면 바로 걸린다(docs/plan.md 5장).
 *
 * ⚠ use_figma 반환값은 약 20KB 에서 잘리고 로컬 파일에 쓸 수 없다(실측 553KB). 그래서 **A게이트 정본 경로는
 * make-figma-audit.js 가 만든 번들을 use_figma 로 실행해 위반 목록만 받는 것**이다. 이 파일은 작은 프레임
 * 하나를 사람이 들여다볼 때만 쓴다.
 * 출력을 nodes.json 으로 저장한 뒤:
 *   node scripts/audit.js --project <project.rules.json> --nodes nodes.json --stage design
 */

const MAX_NODES = 4000; // 방어선. 초과하면 대상 프레임을 좁혀서 다시 돌린다.

function toHex(c) {
  const ch = (x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0');
  return ('#' + ch(c.r) + ch(c.g) + ch(c.b)).toUpperCase();
}

function paints(list) {
  if (!list || list === figma.mixed) return [];
  return list.map((p) => ({
    type: p.type,
    visible: p.visible !== false,
    opacity: p.opacity,
    hex: p.type === 'SOLID' && p.color ? toHex(p.color) : undefined,
    hasImage: p.type === 'IMAGE' ? !!p.imageHash : undefined,
  }));
}

function serialize(node) {
  const o = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: 'visible' in node ? node.visible !== false : true,   // PAGE 에는 visible 이 없다 (실측 크래시)
    width: 'width' in node ? node.width : undefined,
    height: 'height' in node ? node.height : undefined,
    fills: 'fills' in node ? paints(node.fills) : [],
    strokes: 'strokes' in node ? paints(node.strokes) : [],
    fillStyleId: 'fillStyleId' in node && node.fillStyleId !== figma.mixed ? node.fillStyleId : undefined,
    textStyleId: 'textStyleId' in node && node.textStyleId !== figma.mixed ? node.textStyleId : undefined,
    boundVariables: node.boundVariables ? Object.keys(node.boundVariables) : undefined,
    // 레이아웃 — multiple_of 가 읽는 속성
    layoutMode: 'layoutMode' in node ? node.layoutMode : undefined,
    itemSpacing: 'itemSpacing' in node ? node.itemSpacing : undefined,
    paddingTop: 'paddingTop' in node ? node.paddingTop : undefined,
    paddingRight: 'paddingRight' in node ? node.paddingRight : undefined,
    paddingBottom: 'paddingBottom' in node ? node.paddingBottom : undefined,
    paddingLeft: 'paddingLeft' in node ? node.paddingLeft : undefined,
    cornerRadius: 'cornerRadius' in node && node.cornerRadius !== figma.mixed ? node.cornerRadius : undefined,
    // 텍스트
    characters: node.type === 'TEXT' ? node.characters : undefined,
    fontSize: node.type === 'TEXT' && node.fontSize !== figma.mixed ? node.fontSize : undefined,
    fontName: node.type === 'TEXT' && node.fontName !== figma.mixed ? node.fontName : undefined,
    textAutoResize: node.type === 'TEXT' ? node.textAutoResize : undefined,
    // 컴포넌트 — reuse_ratio / variant_states_present 가 나중에 읽는다
    isInstance: node.type === 'INSTANCE',
    mainComponent: node.type === 'INSTANCE' && node.mainComponent ? node.mainComponent.name : undefined,
    variantProperties: node.variantProperties || undefined,
    // 상호작용 — applies_to.interactive_only
    interactive: !!(node.reactions && node.reactions.length),
  };
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
}

function dump(root) {
  let count = 0;
  const walk = (node) => {
    if (++count > MAX_NODES) throw new Error(`노드 ${MAX_NODES}개 초과 — 대상 프레임을 좁혀라`);
    const o = serialize(node);
    if ('children' in node && node.children.length) o.children = node.children.map(walk);
    return o;
  };
  return walk(root);
}

// 선택된 프레임이 있으면 그것을, 없으면 현재 페이지의 자식 전부를 덤프한다.
// PAGE 노드 자체를 serialize 에 넣지 않는다 — visible 등 속성이 없어 즉시 터진다. 사람 손 선택을 전제하지 않는다.
const roots = figma.currentPage.selection.length
  ? figma.currentPage.selection
  : figma.currentPage.children;

return JSON.stringify(roots.map(dump));
