#!/usr/bin/env node
/* selftest 범용 결함 변이 도구 — 골든 사본에 결함 하나를 심는다.
   사용: node scripts/fixtures/mut.js <src> <out> <op> [args…]
   op: replace <regex> <repl>        첫 일치 치환      | replace-all <regex> <repl>   전부 치환
       delete-lines <regex>          일치 줄 삭제      | append <text> [n]            끝에 text 를 n번(기본 1) 추가
       insert-after <regex> <text> [n] 첫 일치 줄 뒤에 text 를 n번 삽입
       json-set <path> <json>        JSON 경로 값 설정(a.b[0].c) | json-del <path>   JSON 경로 삭제
       truncate <n>                  앞 n줄만 남김 */
const fs = require('fs');
const [src, out, op, ...a] = process.argv.slice(2);
let t = fs.readFileSync(src, 'utf8');
const re = (s) => new RegExp(s, 'm');
const walk = (obj, path) => { const ks = path.replace(/\[(\d+)\]/g, '.$1').split('.'); const last = ks.pop(); let o = obj; for (const k of ks) o = o[k]; return [o, last]; };
if (op === 'replace') t = t.replace(re(a[0]), a[1]);
else if (op === 'replace-all') t = t.replace(new RegExp(a[0], 'gm'), a[1]);
else if (op === 'delete-lines') t = t.split('\n').filter((l) => !re(a[0]).test(l)).join('\n');
else if (op === 'append') t = t.replace(/\n?$/, '\n') + Array.from({ length: Number(a[1] || 1) }, (_, i) => a[0].replace(/\{i\}/g, String(i + 1))).join('\n') + '\n';
else if (op === 'insert-after') { const L = t.split('\n'); const i = L.findIndex((l) => re(a[0]).test(l)); if (i < 0) { console.error('insert-after: 일치 줄 없음 ' + a[0]); process.exit(2); } const ins = Array.from({ length: Number(a[2] || 1) }, (_, k) => a[1].replace(/\{i\}/g, String(k + 1))); L.splice(i + 1, 0, ...ins); t = L.join('\n'); }
else if (op === 'json-set' || op === 'json-del') { const j = JSON.parse(t); const [o, k] = walk(j, a[0]); if (op === 'json-set') o[k] = JSON.parse(a[1]); else if (Array.isArray(o)) o.splice(Number(k), 1); else delete o[k]; t = JSON.stringify(j, null, 1); }
else if (op === 'truncate') t = t.split('\n').slice(0, Number(a[0])).join('\n') + '\n';
else { console.error('unknown op ' + op); process.exit(2); }
fs.writeFileSync(out, t);
