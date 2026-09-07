#!/usr/bin/env node
/* selftest 보조 — 골든 JSON 에 결함 하나를 심어 템플릿 골격에 주입한 페이지를 만든다.
   사용: node scripts/fixtures/mutate-interview-page.js <golden.json> <out.html> <mode>   mode: effect(첫 질문 effect 삭제) | press(첫 장면 press 삭제) */
const fs = require('fs');
const [src, out, mode] = process.argv.slice(2);
const tpl = fs.readFileSync('templates/interview_page.html', 'utf8');
/* 골격 첫 주석에도 '<script id="harness-data">' 문구가 있으므로 type="application/json" 까지 있는 진짜 블록만 잡는다 */
const RE = /<script\b(?=[^>]*\bid=["']harness-data["'])(?=[^>]*\btype=["']application\/json["'])[^>]*>[\s\S]*?<\/script>/;
const d = JSON.parse(fs.readFileSync(src, 'utf8'));
if (mode === 'effect') delete d.questions[0].effect;
if (mode === 'press') delete d.flows[0].steps[0].press;
fs.writeFileSync(out, tpl.replace(RE, () => '<script id="harness-data" type="application/json">\n' + JSON.stringify(d, null, 1) + '\n</script>'));
