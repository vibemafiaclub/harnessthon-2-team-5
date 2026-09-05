#!/usr/bin/env node
/**
 * A게이트 검사기 — 결정론적 디자인 가이드 검사.
 *
 * 이 파일은 LLM이 아니다. 같은 입력에 항상 같은 출력을 낸다.
 * 프롬프트는 준수를 보장하지 못하고, 이 스크립트만 보장한다(docs/plan.md 0장).
 *
 * 사용법:
 *   node scripts/audit.js --project <project.rules.json> --nodes <nodes.json> --stage design
 *   node scripts/audit.js --project <project.rules.json> --compile-only     # W단계 진입 전 fail-closed 검증
 *
 * 옵션:
 *   --core <path>      기본 guide/core.rules.json
 *   --project <path>   필수. 프로젝트 규칙(L2/L3)
 *   --nodes <path>     scripts/extract-nodes.js 가 use_figma에서 뽑아낸 노드 덤프
 *   --stage <name>     wireframe | design (기본 design)
 *   --target <id>      리포트에 기록할 대상 프레임 id
 *   --out <path>       리포트 저장 경로 (미지정 시 stdout)
 *   --format json|text 기본 json
 *
 * 종료 코드:
 *   0  통과 (blocker 0개 + 미검사 blocker 0개)
 *   1  게이트 미통과
 *   2  컴파일 실패 (규칙 자체가 잘못됨 — 화면 문제가 아니다)
 */

const fs = require('fs');
const path = require('path');

/* ── check.type 카탈로그 ─────────────────────────────────────────────
   guide/README.md 의 카탈로그와 1:1로 일치해야 한다.
   여기 없는 타입을 규칙에 쓰면 컴파일 실패다(오타·창작 방지).
   IMPLEMENTED 에 없는 타입은 skipped_unimplemented 로 보고되고,
   그 규칙이 blocker 이면 사람 게이트로 승격된다. 침묵 통과가 아니다. */
const CATALOG = new Set([
  'contrast_ratio', 'min_size', 'min_font_size', 'image_fill_present',
  'text_overflow', 'saturation_max', 'color_allowlist', 'style_bound',
  'multiple_of', 'scale_allowlist', 'color_denylist',
  'reuse_ratio', 'name_pattern', 'variant_states_present',
]);
const IMPLEMENTED = new Set([
  'color_allowlist', 'color_denylist', 'multiple_of', 'scale_allowlist', 'name_pattern',
]);

/* ── 유틸 ───────────────────────────────────────────────────────── */

function parseArgs(argv) {
  const out = { core: 'guide/core.rules.json', stage: 'design', format: 'json' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    if (key === 'compile-only') { out.compileOnly = true; continue; }
    out[key === 'compile-only' ? 'compileOnly' : key] = argv[++i];
  }
  return out;
}

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    fail(`파일을 읽을 수 없다: ${p} — ${e.message}`);
  }
}

function fail(msg) {
  process.stderr.write(`[audit] ${msg}\n`);
  process.exit(2);
}

const HEX = /^#?[0-9a-fA-F]{6}$/;

function normHex(v) {
  if (typeof v !== 'string' || !HEX.test(v)) return null;
  return ('#' + v.replace('#', '')).toUpperCase();
}

function rgbToHex(c) {
  if (!c || typeof c.r !== 'number') return null;
  const ch = (x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0');
  return ('#' + ch(c.r) + ch(c.g) + ch(c.b)).toUpperCase();
}

/** 토큰 객체 안의 모든 hex 문자열을 재귀 수집.
 *  `_full_palette` 같은 중첩 그룹도 팔레트의 일부이므로 포함한다.
 *  status / source 는 메타데이터라 제외한다. */
function collectHex(node, acc = new Set()) {
  if (node == null) return acc;
  if (typeof node === 'string') { const h = normHex(node); if (h) acc.add(h); return acc; }
  if (Array.isArray(node)) { node.forEach((v) => collectHex(v, acc)); return acc; }
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'status' || k === 'source' || k === '_note') continue;
      collectHex(v, acc);
    }
  }
  return acc;
}

/* ── 1) 로드 · 병합 · $tokens 해석 · fail-closed 검증 ────────────── */

function resolveTokenRef(ref, tokens, errors, ruleId) {
  const p = ref.slice('$tokens.'.length).split('.');
  let cur = tokens;
  for (const seg of p) {
    if (cur == null || typeof cur !== 'object' || !(seg in cur)) {
      errors.push(`[${ruleId}] $tokens 참조가 존재하지 않는 경로를 가리킨다: ${ref}`);
      return null;
    }
    cur = cur[seg];
  }
  if (cur === null) {
    errors.push(`[${ruleId}] $tokens 참조가 null 을 가리킨다: ${ref} — 0단계에서 값을 채워야 한다`);
    return null;
  }
  return cur;
}

function resolveDeep(value, tokens, errors, ruleId) {
  if (typeof value === 'string' && value.startsWith('$tokens.')) {
    return resolveTokenRef(value, tokens, errors, ruleId);
  }
  if (Array.isArray(value)) return value.map((v) => resolveDeep(v, tokens, errors, ruleId));
  if (value && typeof value === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(value)) o[k] = resolveDeep(v, tokens, errors, ruleId);
    return o;
  }
  return value;
}

function compile(corePath, projectPath) {
  const errors = [];
  const core = readJSON(corePath);
  const project = projectPath ? readJSON(projectPath) : { rules: [], tokens: {} };

  const tokens = project.tokens || {};
  const coreById = new Map(core.rules.map((r) => [r.id, r]));

  const projectRules = [
    ...(project.rules || []),
    ...((project.project_specific && project.project_specific.rules) || []),
  ];

  // fail-closed 4: 프로젝트 계층이 core 의 blocker 를 완화할 수 없다
  for (const r of projectRules) {
    const c = coreById.get(r.id);
    if (c && c.severity === 'blocker' && r.severity !== 'blocker') {
      errors.push(`[${r.id}] core 의 blocker 를 '${r.severity}' 로 완화할 수 없다`);
    }
  }

  const merged = [];
  const seen = new Map();
  for (const r of [...core.rules.map((r) => ({ ...r, _layer: 'core' })),
                   ...projectRules.map((r) => ({ ...r, _layer: 'project' }))]) {
    if (seen.has(r.id)) { merged[seen.get(r.id)] = { ...merged[seen.get(r.id)], ...r }; continue; }
    seen.set(r.id, merged.length);
    merged.push(r);
  }

  for (const r of merged) {
    // fail-closed 3: 카탈로그에 없는 check.type
    if (!r.check || !CATALOG.has(r.check.type)) {
      errors.push(`[${r.id}] check.type 이 카탈로그에 없다: ${r.check && r.check.type}`);
      continue;
    }
    // fail-closed 1: unfilled 인 blocker
    if (r._layer === 'project' && r.status === 'unfilled' && r.severity === 'blocker') {
      errors.push(`[${r.id}] status 가 'unfilled' 인 blocker 규칙이 남아 있다 — 값을 채우거나 '가정'으로 명시하고 filled 로 올린다`);
    }
    // fail-closed 2: $tokens 참조가 null
    r.check = resolveDeep(r.check, tokens, errors, r.id);
  }

  // 토큰 그룹 자체가 unfilled 인 경우도 W단계 진입을 막는다
  for (const [name, group] of Object.entries(tokens)) {
    if (group && typeof group === 'object' && group.status === 'unfilled') {
      errors.push(`[tokens.${name}] status 가 'unfilled' 이다 — 0단계가 끝나지 않았다`);
    }
  }

  /* fail-closed 6: allowlist ∩ denylist 교집합.
     L3 규칙의 allowed가 core denylist(_reference_palette)와 겹치면 어떤 산출물도
     두 blocker를 동시에 만족할 수 없다 — 규칙이 모순인 것이지 화면 결함이 아니다.
     이 검사가 없어 옛 팔레트가 남은 L3 규칙이 오탐 40건을 만든 적이 있다. */
  const hexes = (v) => {
    const out = new Set();
    const walk = (x) => {
      if (typeof x === 'string') { const m = x.match(/#[0-9a-fA-F]{6}\b/g); (m || []).forEach((h) => out.add(h.toLowerCase())); }
      else if (Array.isArray(x)) x.forEach(walk);
      else if (x && typeof x === 'object') Object.values(x).forEach(walk);
    };
    walk(v); return out;
  };
  const denyRule = merged.find((r) => r.check && r.check.type === 'color_denylist');
  if (denyRule) {
    const denied = hexes(denyRule.check.deny);
    for (const r of merged) {
      if (!r.check || r.check.type !== 'color_allowlist') continue;
      const allowed = hexes(r.check.allowed);
      const clash = [...allowed].filter((h) => denied.has(h));
      if (!allowed.size) continue;
      if (clash.length === allowed.size) {
        errors.push(`[${r.id}] allowed 전부가 denylist와 겹친다 — 두 blocker 동시 충족 불가: ${clash.join(', ')}`);
      } else if (clash.length) {
        errors.push(`[${r.id}] allowed 중 ${clash.length}개가 denylist와 겹친다: ${clash.join(', ')}`);
      }
    }
  }

  return { rules: merged, tokens, errors };
}

/* ── 2) 노드 선택자 ─────────────────────────────────────────────── */

const INTERACTIVE_NAME = /^(Button|Btn|Input|Field|Chip|Tab|Toggle|Switch|Checkbox|Radio|Link|Icon(Button)?|Row|ListItem|Cell)\b/i;

function matches(node, sel) {
  /* 선택자 제외 — 구현하지 않으면 규칙이 침묵 무시되어 오탐이 쏟아진다 */
  if (sel && sel.exclude_name_matches
      && new RegExp(sel.exclude_name_matches).test(node.name || '')) return false;

  if (!sel) return true;
  if (sel.node_types && !sel.node_types.includes(node.type)) return false;
  if (sel.name_matches && !new RegExp(sel.name_matches).test(node.name || '')) return false;
  if (sel.has_auto_layout === true && !(node.layoutMode && node.layoutMode !== 'NONE')) return false;
  if (sel.has_image_fill === true && !(node.fills || []).some((f) => f.type === 'IMAGE')) return false;
  if (sel.interactive_only === true) {
    const interactive = node.interactive === true
      || (node.reactions && node.reactions.length > 0)
      || INTERACTIVE_NAME.test(node.name || '');
    if (!interactive) return false;
  }
  return true;
}

/* ── 3) 검사기 (v0: 3종) ───────────────────────────────────────── */

function nodeColors(node) {
  const out = [];
  for (const [prop, list] of [['fill', node.fills], ['stroke', node.strokes]]) {
    for (const p of list || []) {
      if (p.visible === false) continue;
      if (p.type && p.type !== 'SOLID') continue;
      const hex = normHex(p.hex) || rgbToHex(p.color);
      if (hex) out.push({ prop, hex });
    }
  }
  return out;
}

const CHECKS = {
  color_allowlist(node, check) {
    const allowed = collectHex(check.allowed);
    if (allowed.size === 0) return [];
    return nodeColors(node)
      .filter(({ hex }) => !allowed.has(hex))
      .map(({ prop, hex }) => ({ property: prop, expected: '팔레트 내 토큰', actual: hex }));
  },

  multiple_of(node, check) {
    const unit = Number(check.unit);
    if (!unit || Number.isNaN(unit)) return [];
    const out = [];
    for (const prop of check.properties || []) {
      const v = node[prop];
      if (typeof v !== 'number') continue;
      if (Math.abs(v % unit) > 1e-6 && Math.abs((v % unit) - unit) > 1e-6) {
        out.push({ property: prop, expected: Math.round(v / unit) * unit, actual: v });
      }
    }
    return out;
  },

  /* 참조 시스템 팔레트를 그대로 쓰고 있지 않은가.
     구조는 베끼고 색은 도출한다 — guide/README.md 참조. */
  color_denylist(node, check) {
    const denied = collectHex(check.deny);
    if (denied.size === 0) return [];
    return nodeColors(node)
      .filter(({ hex }) => denied.has(hex))
      .map(({ prop, hex }) => ({
        property: prop, expected: '참조 팔레트 밖의, 도메인에서 도출한 색', actual: hex,
      }));
  },

  /* 등차가 아닌 스케일 검사. multiple_of 로는 4·6·8·16·24·32 를 표현할 수 없다. */
  scale_allowlist(node, check) {
    const scale = Array.isArray(check.scale) ? check.scale.map(Number) : [];
    if (scale.length === 0) return [];
    const nearest = (v) => scale.reduce((a, b) =>
      (Math.abs(b - v) < Math.abs(a - v) || (Math.abs(b - v) === Math.abs(a - v) && b < a)) ? b : a);
    const out = [];
    for (const prop of check.properties || []) {
      const v = node[prop];
      if (typeof v !== 'number') continue;
      if (!scale.includes(v)) out.push({ property: prop, expected: nearest(v), actual: v });
    }
    return out;
  },

  name_pattern(node, check) {
    const name = node.name || '';
    for (const d of check.deny || []) {
      if (new RegExp(d).test(name)) {
        return [{ property: 'name', expected: `deny 패턴 위반 없음 (${d})`, actual: name }];
      }
    }
    if (check.allow && !new RegExp(check.allow).test(name)) {
      return [{ property: 'name', expected: `allow 패턴 만족 (${check.allow})`, actual: name }];
    }
    return [];
  },
};

/* ── 4) 순회 · 리포트 ───────────────────────────────────────────── */

function flatten(nodes) {
  const out = [];
  const walk = (n, parent) => {
    if (!n || typeof n !== 'object') return;
    out.push({ ...n, _parent: parent });
    for (const c of n.children || []) walk(c, n.name);
  };
  (Array.isArray(nodes) ? nodes : [nodes]).forEach((n) => walk(n, null));
  return out;
}

function audit({ rules, stage, nodes, target }) {
  const flat = flatten(nodes).filter((n) => n.visible !== false);
  const violations = [];
  const uncheckedBlockers = [];
  const summary = { blocker: 0, warning: 0, skipped_out_of_stage: 0, skipped_unimplemented: 0 };

  for (const rule of rules) {
    // stage 에 현재 단계가 없으면 통과가 아니라 '평가 대상 아님'이다
    if (!(rule.stage || []).includes(stage)) { summary.skipped_out_of_stage++; continue; }

    if (!IMPLEMENTED.has(rule.check.type)) {
      summary.skipped_unimplemented++;
      if (rule.severity === 'blocker') {
        uncheckedBlockers.push({
          rule: rule.id, title: rule.title,
          reason: 'skipped_unimplemented', requires_human_review: true,
          fix_hint: rule.fix_hint,
        });
      }
      continue;
    }

    for (const node of flat) {
      if (!matches(node, rule.applies_to)) continue;
      for (const hit of CHECKS[rule.check.type](node, rule.check)) {
        violations.push({
          rule: rule.id,
          node: `${node.name || '(unnamed)'} / ${hit.property}`,
          node_id: node.id || null,
          expected: hit.expected,
          actual: hit.actual,
          severity: rule.severity,
          autofix: rule.autofix === true,
          fix_hint: rule.fix_hint,
        });
        summary[rule.severity === 'blocker' ? 'blocker' : 'warning']++;
      }
    }
  }

  return {
    stage,
    target: target || null,
    nodes_inspected: flat.length,
    passed: summary.blocker === 0 && uncheckedBlockers.length === 0,
    violations,
    unchecked_blockers: uncheckedBlockers,
    summary,
  };
}

function renderText(r) {
  const L = [];
  L.push(`stage=${r.stage} target=${r.target || '-'} nodes=${r.nodes_inspected}`);
  L.push(r.passed ? '통과' : '미통과 — 다음 단계 진입 금지');
  const byRule = {};
  for (const v of r.violations) (byRule[v.rule] ||= []).push(v);
  for (const [rule, vs] of Object.entries(byRule)) {
    L.push(`\n[${vs[0].severity}] ${rule} — ${vs.length}건${vs[0].autofix ? ' (autofix 가능)' : ''}`);
    for (const v of vs.slice(0, 10)) L.push(`  ${v.node}  기대=${v.expected}  실제=${v.actual}`);
    if (vs.length > 10) L.push(`  … 외 ${vs.length - 10}건`);
    if (vs[0].fix_hint) L.push(`  수정: ${vs[0].fix_hint}`);
  }
  if (r.unchecked_blockers.length) {
    L.push('\n미검사 blocker — 사람이 육안 확인해야 진행 가능:');
    for (const u of r.unchecked_blockers) L.push(`  ${u.rule} (${u.title || ''}) — ${u.reason}`);
  }
  L.push(`\n합계 blocker=${r.summary.blocker} warning=${r.summary.warning} ` +
         `단계밖=${r.summary.skipped_out_of_stage} 미구현=${r.summary.skipped_unimplemented}`);
  return L.join('\n');
}

/* ── main ───────────────────────────────────────────────────────── */

function main() {
  const args = parseArgs(process.argv);
  if (!args.project) fail('--project <project.rules.json> 이 필요하다');

  const { rules, errors } = compile(args.core, args.project);

  if (errors.length) {
    const report = { passed: false, stage: args.stage, compile_errors: errors };
    const text = ['컴파일 실패 — 파이프라인 진입 거부 (fail-closed)', ...errors.map((e) => '  ' + e)].join('\n');
    process.stdout.write(args.format === 'text' ? text + '\n' : JSON.stringify(report, null, 2) + '\n');
    process.exit(2);
  }

  if (args.compileOnly) {
    const msg = { passed: true, compile_errors: [], rules_active: rules.length };
    process.stdout.write(args.format === 'text'
      ? `컴파일 통과 — 활성 규칙 ${rules.length}개. W단계 진입 가능\n`
      : JSON.stringify(msg, null, 2) + '\n');
    process.exit(0);
  }

  if (!args.nodes) fail('--nodes <nodes.json> 이 필요하다 (scripts/extract-nodes.js 로 1회 순회해 덤프한다)');
  const report = audit({ rules, stage: args.stage, nodes: readJSON(args.nodes), target: args.target });

  const out = args.format === 'text' ? renderText(report) : JSON.stringify(report, null, 2);
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, JSON.stringify(report, null, 2));
    process.stderr.write(`[audit] 리포트 저장: ${args.out}\n`);
  }
  process.stdout.write(out + '\n');
  process.exit(report.passed ? 0 : 1);
}

if (require.main === module) main();
module.exports = { compile, audit, CHECKS, matches, CATALOG, IMPLEMENTED };
