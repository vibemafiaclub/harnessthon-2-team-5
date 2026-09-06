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
 *   --render <audit.json>  Figma 번들(make-figma-audit.js)이 돌려준 JSON 을 텍스트 리포트로 (project 불필요)
 *
 * 종료 코드:
 *   0  통과 (blocker 0개 + 미검사 blocker 0개)
 *   1  게이트 미통과
 *   2  컴파일 실패 (규칙 자체가 잘못됨 — 화면 문제가 아니다)
 */

const fs = require('fs');
const path = require('path');

/* ── check.type 카탈로그 / 판정 핵심은 lib/audit-core.js 가 단일 출처다.
   Figma 안에서 도는 번들(make-figma-audit.js)도 같은 파일을 인라인한다. */
const core = require('./lib/audit-core');
const CATALOG = new Set(core.AUDIT_CATALOG);
const IMPLEMENTED = new Set(core.AUDIT_IMPLEMENTED);

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

const { normHex, rgbToHex, collectHex } = core;

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

/* ── 2~4) 선택자·검사기·순회는 core ── */
const { matches, CHECKS, audit } = core;

function mergeReports(parts) {
  const sum = (k) => parts.reduce((a, p) => a + (p[k] || 0), 0);
  const perRule = {}, applicable = {};
  for (const p of parts) { for (const [k, v] of Object.entries(p.violations_per_rule || {})) perRule[k] = (perRule[k] || 0) + v; for (const [k, v] of Object.entries(p.applicable_per_rule || {})) applicable[k] = (applicable[k] || 0) + v; }
  const unchecked = []; const seen = new Set();
  for (const p of parts) for (const u of p.unchecked_blockers || []) if (!seen.has(u.rule)) { seen.add(u.rule); unchecked.push(u); }
  const summary = { blocker: 0, warning: 0, skipped_out_of_stage: 0, skipped_unimplemented: 0 };
  for (const p of parts) for (const k of Object.keys(summary)) summary[k] += (p.summary || {})[k] || 0;
  return { stage: parts[0].stage, target: parts.map((p) => p.page || p.target).join(' + '), nodes_inspected: sum('nodes_inspected'),
    passed_machine: summary.blocker === 0, passed: summary.blocker === 0 && unchecked.length === 0,
    requires_human_review: unchecked.map((u) => u.rule), violations: parts.flatMap((p) => p.violations || []), violations_per_rule: perRule,
    applicable_per_rule: applicable, not_applicable: Object.keys(applicable).filter((k) => applicable[k] === 0), unchecked_blockers: unchecked, summary, merged_from: parts.length };
}

function renderText(r) {
  const L = [];
  L.push(`stage=${r.stage} target=${r.target || '-'} nodes=${r.nodes_inspected}`);
  L.push(r.passed_machine ? (r.passed ? '통과' : '기계 검사 통과 — 미검사 blocker 는 사람 게이트로') : '미통과 — 다음 단계 진입 금지');
  const byRule = {};
  for (const v of r.violations) (byRule[v.rule] ||= []).push(v);
  for (const [rule, vs] of Object.entries(byRule)) {
    L.push(`\n[${vs[0].severity}] ${rule} — ${vs.length}건${vs[0].autofix ? ' (autofix 가능)' : ''}`);
    for (const v of vs.slice(0, 10)) L.push(`  ${v.node}  기대=${v.expected}  실제=${v.actual}`);
    if (vs.length > 10) L.push(`  … 외 ${vs.length - 10}건`);
    if (vs[0].fix_hint) L.push(`  수정: ${vs[0].fix_hint}`);
  }
  if (r.not_applicable && r.not_applicable.length) {
    L.push('\n적용 대상 0개 (N/A — 위반 0 이 아니라 검사 대상이 없었다): ' + r.not_applicable.join(', '));
    if (r.not_applicable.includes('variant-state-coverage')) L.push('  → variant 규칙은 Components 페이지를 함께 돌려야 한다: make-figma-audit --page Components 후 --render a.json,b.json');
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
  if (args.render) { /* --render <audit.json>: Figma 번들 반환값을 읽어 텍스트 리포트 */ }
  else if (!args.project) fail('--project <project.rules.json> 이 필요하다');

  const { rules, errors } = args.render ? { rules: [], errors: [] } : compile(args.core, args.project);

  if (errors.length) {
    const report = { passed: false, stage: args.stage, compile_errors: errors };
    const text = ['컴파일 실패 — 파이프라인 진입 거부 (fail-closed)', ...errors.map((e) => '  ' + e)].join('\n');
    process.stdout.write(args.format === 'text' ? text + '\n' : JSON.stringify(report, null, 2) + '\n');
    process.exit(2);
  }

  if (args.render) {
    /* --render a.json[,b.json,...] : 페이지별로 돌린 번들 결과를 병합한다(use_figma 는 호출당 페이지 전환 1회가 원칙이라 페이지마다 따로 돈다) */
    const parts = args.render.split(',').map((p) => readJSON(p.trim()));
    for (const p of parts) if (p.error) { process.stdout.write('use_figma 실행 오류: ' + p.error + '\n'); process.exit(2); }
    const r = parts.length === 1 ? parts[0] : mergeReports(parts);
    process.stdout.write(renderText(r) + '\n');
    process.exit(r.passed_machine ? 0 : 1);
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
  process.exit(report.passed_machine ? 0 : 1);
}

if (require.main === module) main();
module.exports = { compile, audit, CHECKS, matches, CATALOG, IMPLEMENTED, core };
