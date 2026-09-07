#!/usr/bin/env node
/**
 * selftest 픽스처 생성기 — templates/interview_page.html 골격에 interview_golden.json / interview_bad.json 을 harness-data 로 주입해
 * interview_golden.html / interview_bad.html 을 만든다. 골격(마크업·스크립트)은 템플릿 그대로라 check-interview-page P-1 이 템플릿과 바이트 대조한다.
 * 템플릿 골격이 바뀌면 이 스크립트를 다시 돌려 픽스처를 갱신한다: node scripts/fixtures/build-interview-fixtures.js
 */
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const tplPath = path.join(ROOT, 'templates', 'interview_page.html');
const tpl = fs.readFileSync(tplPath, 'utf8');
const HD_RE = /<script\b(?=[^>]*\bid=["']harness-data["'])(?=[^>]*\btype=["']application\/json["'])[^>]*>[\s\S]*?<\/script>/;
if (!HD_RE.test(tpl)) { console.error('템플릿에 <script id="harness-data" type="application/json"> 블록이 없다: ' + tplPath); process.exit(2); }
for (const name of ['golden', 'bad']) {
  const data = fs.readFileSync(path.join(__dirname, `interview_${name}.json`), 'utf8');
  JSON.parse(data);
  const out = tpl.replace(HD_RE, () => '<script id="harness-data" type="application/json">\n' + data.trim() + '\n</script>');
  fs.writeFileSync(path.join(__dirname, `interview_${name}.html`), out);
  console.log(`interview_${name}.html ← templates/interview_page.html + interview_${name}.json (${Buffer.byteLength(out)} bytes)`);
}
