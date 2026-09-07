#!/usr/bin/env node
/* 사람 호출 kind 정본 대조 — check-brief.js 의 KINDS 가 정본. .claude/skills/<스킬>/SKILL.md 에 쓰인 `[<stage>/<kind>]`·"kind `x`" 가 전부 그 안에 있어야 한다(감사 지적: 세 문서가 서로 다른 kind 를 적어 실런에서 B-24 가 하네스 규약을 FAIL 로 잡았다). */
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(root, 'scripts', 'check-brief.js'), 'utf8');
const KINDS = new Set(JSON.parse((src.match(/const KINDS = (\[[^\]]*\]);/) || [])[1].replace(/'/g, '"')));
const files = fs.readdirSync(path.join(root, '.claude', 'skills')).map((d) => path.join(root, '.claude', 'skills', d, 'SKILL.md')).filter((f) => fs.existsSync(f));
let bad = 0, seen = 0;
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8'); const rel = path.relative(root, f);
  for (const m of t.matchAll(/\[(interview|tokens|draft|figma)\/([a-z_]+)\]/g)) { seen++; if (!KINDS.has(m[2])) { bad++; console.log(`[NG] ${rel}: [${m[1]}/${m[2]}] — KINDS 에 없음`); } }
  /* 나열형: 'kind 허용 목록 …: `a` · `b`' / '허용 집합 …: a · b' 줄의 백틱·중점 토큰 전부 */
  for (const line of t.split('\n')) { if (!/kind/.test(line) || !/(허용 목록|허용 집합|KINDS)/.test(line)) continue; for (const m of line.matchAll(/`([a-z_]{4,})`|(?:^|[·:(\s])([a-z]+_[a-z_]+)(?=[\s·).,])/g)) { const k = m[1] || m[2]; if (!k || ['q12', 'unknown', 'accepted', 'budget60', 'human_calls_max', 'check_brief', 'stage', 'kind'].includes(k) || k.length < 5) continue; if (/^(interview|tokens|draft|figma)$/.test(k)) continue; seen++; if (!KINDS.has(k)) { bad++; console.log(`[NG] ${rel}: 나열형 kind '${k}' — KINDS 에 없음`); } } }
  for (const m of t.matchAll(/kind `([a-z_]+)`/g)) { seen++; const k = m[1]; if (['q12', 'unknown', 'accepted', 'budget60'].includes(k)) continue; /* delegations kind 는 별도 어휘 */ if (!KINDS.has(k)) { bad++; console.log(`[NG] ${rel}: kind \`${k}\` — KINDS 에 없음`); } }
}
console.log(`kinds: 문서 참조 ${seen}건, 정본 ${KINDS.size}종, 불일치 ${bad}`);
process.exit(bad ? 1 : 0);
