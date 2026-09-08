#!/usr/bin/env node
/* selftest 보조 — 골든 JSON 에 결함 하나를 심어 템플릿 골격에 주입한 페이지를 만든다.
   사용: node scripts/fixtures/mutate-interview-page.js <golden.json> <out.html> <mode>   mode: effect | press | recommended | verifies | pattern-html | pattern-drop | open-question | taste-recommended | frame | tile-elements | contrast | service-name (구현은 아래 if 목록이 정본) */
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
if (mode === 'frame') delete d.frame;
if (mode === 'tile-elements') d.tiles[0].html = '<div><b>a</b><i>b</i><u>c</u><s>d</s><em>e</em><span>f</span><small>g</small><div>h</div><p>i</p><b>j</b><i>k</i><u>l</u></div>';
if (mode === 'contrast') d.tiles[0].html = d.tiles[0].html.replace(/color:#[0-9A-Fa-f]{6}/, 'color:#DDDDDD').replace('<b', "<b style='color:#EEEEEE'");
if (mode === 'always-drop') d.pairs.forEach((p) => { if (/채도/.test(p.axis)) delete p.always; });
if (mode === 'q-order') { const q0 = d.questions[0]; d.questions[0] = d.questions[1]; d.questions[1] = q0; }
if (mode === 'axis-same') { const same = d.tiles.filter((t) => t.axis === d.tiles[0].axis); same[1].html = same[0].html; }
if (mode === 'placeholder') d.tiles[0].html = d.tiles[0].html.replace('<b>', '<b>Lorem ipsum ');
if (mode === 'payload-bad') { const q = d.questions.find((q) => q.skeleton === 'Q6'); q.payload = 'nonsense_axis'; }
if (mode === 'skeleton-bad') { const q = d.questions.find((q) => q.skeleton === 'Q6'); q.skeleton = 'Q99'; }
if (mode === 'size') d.banner = d.banner + ' ' + 'ㄱ'.repeat(230000);
if (mode === 'service-name') d.intro = d.intro + ' 서비스A 처럼 만들어요.';
fs.writeFileSync(out, tpl.replace(RE, () => '<script id="harness-data" type="application/json">\n' + JSON.stringify(d, null, 1) + '\n</script>'));
