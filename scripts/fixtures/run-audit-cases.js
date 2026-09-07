#!/usr/bin/env node
/* audit-core 규칙 검출력 시험 — scripts/fixtures/audit/cases.json 의 케이스마다 rules+nodes 로 audit() 을 돌려 expect(규칙별 위반 수·적용 수)와 대조한다.
   사용: node scripts/fixtures/run-audit-cases.js  → 종료 0 전건 일치 / 1 불일치. selftest 8절이 부른다. */
const fs = require('fs'); const path = require('path');
const core = require(path.join(__dirname, '..', 'lib', 'audit-core.js'));
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit', 'cases.json'), 'utf8'));
let bad = 0;
for (const c of cases) {
  const r = core.audit({ rules: c.rules, stage: 'design', nodes: c.nodes, perRuleCap: 25 });
  const diffs = [];
  for (const [id, n] of Object.entries(c.expect.violations || {})) if ((r.violations_per_rule[id] || 0) !== n) diffs.push(`${id}: 위반 ${r.violations_per_rule[id] || 0} ≠ 기대 ${n}`);
  for (const [id, n] of Object.entries(c.expect.applicable || {})) if ((r.applicable_per_rule[id] || 0) !== n) diffs.push(`${id}: 적용 ${r.applicable_per_rule[id] || 0} ≠ 기대 ${n}`);
  for (const sub of (c.expect.actual_contains || [])) if (!r.violations.some((v) => String(v.actual).includes(sub) || String(v.node).includes(sub) || String(v.expected).includes(sub))) diffs.push(`위반 목록에 '${sub}' 없음`);
  if (diffs.length) { bad++; console.log(`[NG] ${c.name} — ${diffs.join('; ')}`); } else console.log(`[ok] ${c.name}`);
}
console.log(`audit cases: ${cases.length - bad}/${cases.length}`);
process.exit(bad ? 1 : 0);
