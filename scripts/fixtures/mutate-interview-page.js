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
if (mode === 'recommended') { const q = d.questions.find((q) => q.skeleton === 'Q2'); delete q.recommended; delete q.why; }
if (mode === 'verifies') { d.questions = d.questions.filter((q) => !q.verifies); const pat = d.questions.find((q) => q.kind === 'pattern'); const extra = JSON.parse(JSON.stringify(pat)); extra.id = 'Q-04z'; extra.text = '약을 다 먹였을 때 다른 서비스들은 보통 이렇게 보여 줍니다. 저는 \'체크 하나\' 쪽이 맞다고 봅니다 — 할 일이 끝났다는 게 바로 보여서요. 그래도 다른 쪽이 편할까요?'; extra.options = [{ value: '체크 하나', scene: '약 이름 옆에 체크가 생기고 회색으로 눌러져요', html: pat.options[0].html }, { value: '목록에서 사라짐', scene: '먹인 약은 목록에서 빠지고 남은 것만 보여요', html: pat.options[1].html }]; extra.recommended = '체크 하나'; d.questions.splice(d.questions.indexOf(pat) + 1, 0, extra); } /* 질문 수·pattern 수를 유지해 P-2·P-12 가 흔들리지 않게 */
if (mode === 'pattern-html') { const q = d.questions.find((q) => q.kind === 'pattern'); q.options.forEach((o) => { delete o.html; }); }
if (mode === 'pattern-drop') d.questions = d.questions.filter((q) => q.kind !== 'pattern');
if (mode === 'open-question') { const q = d.questions.find((q) => q.kind === 'pushback'); q.text = '이 앱에는 어떤 로그인을 넣을까요?'; }
if (mode === 'taste-recommended') { const q = d.questions.find((q) => q.skeleton === 'Q1'); q.recommended = q.options[0].value; q.why = '이유'; }
if (mode === 'service-name') d.intro = d.intro + ' 서비스A 처럼 만들어요.';
fs.writeFileSync(out, tpl.replace(RE, () => '<script id="harness-data" type="application/json">\n' + JSON.stringify(d, null, 1) + '\n</script>'));
