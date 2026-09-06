#!/usr/bin/env node
/**
 * 2단계 HTML 초안 정적 검사기 — 승인 전 게이트. 결정론(LLM 아님).
 *
 * 사용법: node scripts/check-html.js --drafts design/drafts [--tokens-css design/drafts/tokens.css]
 *         [--frame 390x844] [--format text|json] [--out design/verify/html_check.json]
 *
 * 검사 항목 (layout_rules.md 의 "빌드가 거부" 칸 + 우리 실측 D-9·D-11·D-14):
 *   H-1  var(--x) 참조가 tokens.css 에 선언되어 있는가                 (L-9)
 *   H-2  루트에 word-break: keep-all 이 있는가                          (L-7)
 *   H-3  overflow-wrap: anywhere 를 쓰지 않았는가                       (L-13)
 *   H-4  tokens.css 밖에 hex 색·px 리터럴이 없는가                       (토큰 규율)
 *   H-5  루트 프레임 규격이 전 화면 동일하고 --frame 과 같은가           (D-11·D-14)
 *   H-6  data-state="normal|empty|long" 섹션이 전부 있는가              (상태 3종)
 *   H-7  고정 높이 + overflow:hidden 이면서 스크롤 컨테이너가 없는가      (L-8, 경고)
 *   H-8  "Lorem ipsum" / "제목을 입력" 류 자리표시자가 없는가            (C-5)
 *   H-9  주 행동(data-role=primary-action)이 하단 고정 바(data-fixed=bottom) 안이거나 above-fold 선언인가 (D-26)
 *   H-10 data-overflow=true 화면에 data-state="full" 섹션이 있는가              (D-26)
 * L-6 라벨 폭 예산·L-8 높이 초과량은 렌더가 필요하므로 여기서 계산하지 않는다(judge + 브라우저).
 */
const fs = require('fs'); const path = require('path');
function args(argv) { const o = { format: 'text', frame: '390x844' }; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; } return o; }
const A = args(process.argv);
if (!A.drafts) { console.error('--drafts <dir> 필요'); process.exit(2); }
const tokensCss = A['tokens-css'] || path.join(A.drafts, 'tokens.css');
const declared = new Set();
if (fs.existsSync(tokensCss)) for (const m of fs.readFileSync(tokensCss, 'utf8').matchAll(/--([a-zA-Z0-9-]+)\s*:/g)) declared.add(m[1]);
const files = fs.readdirSync(A.drafts).filter((f) => /^screen_.*\.html$/.test(f) || /^axis.*\.html$/.test(f)).sort();
const [FW, FH] = A.frame.split('x').map(Number);
const report = { frame: A.frame, files: files.length, tokens_css: fs.existsSync(tokensCss), checks: [], passed: true };
function add(id, file, status, detail) { report.checks.push({ id, file, status, detail }); if (status === 'FAIL') report.passed = false; }
if (!fs.existsSync(tokensCss)) add('H-1', '(all)', 'FAIL', 'tokens.css 없음');
const frames = new Map();
for (const f of files) {
  const src = fs.readFileSync(path.join(A.drafts, f), 'utf8');
  const local = new Set(declared); for (const m of src.matchAll(/--([a-zA-Z0-9-]+)\s*:/g)) local.add(m[1]);
  const undef = new Set(); for (const m of src.matchAll(/var\(--([a-zA-Z0-9-]+)/g)) if (!local.has(m[1])) undef.add(m[1]);
  add('H-1', f, undef.size ? 'FAIL' : 'PASS', undef.size ? '미선언 변수: ' + Array.from(undef).join(', ') : 'var 전부 선언됨');
  add('H-2', f, /word-break\s*:\s*keep-all/.test(src) ? 'PASS' : 'FAIL', 'word-break: keep-all');
  add('H-3', f, /overflow-wrap\s*:\s*anywhere/.test(src) ? 'FAIL' : 'PASS', 'overflow-wrap: anywhere 금지');
  const body = src.replace(/<style[^>]*data-tokens[^>]*>[\s\S]*?<\/style>/g, '');
  const hex = (body.match(/#[0-9a-fA-F]{6}\b/g) || []).filter((h) => !/^#(fff|000)/i.test(h));
  const px = (body.match(/\b\d{2,4}px\b/g) || []).length;
  add('H-4', f, hex.length ? 'FAIL' : (px > 6 ? 'WARN' : 'PASS'), `hex 리터럴 ${hex.length}건${hex.length ? ' (' + Array.from(new Set(hex)).slice(0, 5).join(', ') + ')' : ''}, px 리터럴 ${px}건(프레임·상태바 규격 외에는 0 이어야)`);
  const fm = src.match(/data-frame\s*=\s*"(\d+)x(\d+)"/) || src.match(/\.screen\s*\{[^}]*width\s*:\s*(\d+)px[^}]*height\s*:\s*(\d+)px/);
  const fr = fm ? `${fm[1]}x${fm[2]}` : null; frames.set(f, fr);
  add('H-5', f, fr === A.frame ? 'PASS' : 'FAIL', fr ? `프레임 ${fr} (기대 ${A.frame})` : '루트 프레임 규격 미표기 — data-frame="WxH" 또는 .screen{width;height} 필요');
  const states = ['normal', 'empty', 'long'].filter((s) => !new RegExp(`data-state\\s*=\\s*"${s}"`).test(src));
  if (/^screen_/.test(f)) add('H-6', f, states.length ? 'FAIL' : 'PASS', states.length ? '누락 상태: ' + states.join(', ') : '상태 3종 존재');
  add('H-7', f, (/overflow\s*:\s*hidden/.test(src) && !/overflow(-y)?\s*:\s*auto|scroll/.test(src)) ? 'WARN' : 'PASS', '고정 높이+hidden 인데 스크롤 컨테이너 없음 → 무음 절단 가능');
  add('H-8', f, /lorem ipsum|제목을 입력|텍스트를 입력|placeholder text/i.test(src) ? 'FAIL' : 'PASS', '자리표시자 텍스트');
  if (/^screen_/.test(f)) {
    const noPrimary = /data-no-primary\s*=\s*"true"/.test(src);
    const pa = [...src.matchAll(/<[^>]+data-role\s*=\s*"primary-action"[^>]*>/g)];
    if (noPrimary) add('H-9', f, 'PASS', '주 행동 없음 선언(data-no-primary)');
    else if (pa.length !== 1) add('H-9', f, 'FAIL', `data-role="primary-action" 가 ${pa.length}개 (정확히 1개, 없으면 data-no-primary="true")`);
    else {
      const idx = src.indexOf(pa[0][0]);
      const before = src.slice(0, idx);
      const opens = (before.match(/data-fixed\s*=\s*"bottom"/g) || []).length;
      const inFixed = opens > 0 && /data-fixed\s*=\s*"bottom"/.test(before.slice(Math.max(0, before.lastIndexOf('data-fixed'))));
      const aboveFold = /data-above-fold\s*=\s*"true"/.test(pa[0][0]);
      add('H-9', f, (inFixed || aboveFold) ? 'PASS' : 'FAIL', inFixed ? '주 행동이 하단 고정 바 안' : aboveFold ? '주 행동 above-fold 선언 (judge 가 스크린샷으로 확인)' : '주 행동이 하단 고정 바 밖이고 above-fold 선언도 없음 — 스크롤/잘림 위험');
    }
    const overflow = /data-overflow\s*=\s*"true"/.test(src);
    if (overflow) add('H-10', f, /data-state\s*=\s*"full"/.test(src) ? 'PASS' : 'FAIL', 'overflow 화면인데 full 상태 없음');
  }
}
const distinct = new Set(Array.from(frames.values()));
if (distinct.size > 1) add('H-5', '(all)', 'FAIL', '화면 간 프레임 규격 불일치: ' + Array.from(distinct).join(' / '));
if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, JSON.stringify(report, null, 2)); }
if (A.format === 'json') console.log(JSON.stringify(report, null, 2));
else {
  console.log(`check-html: ${files.length} 파일, 프레임 기대 ${A.frame}, tokens.css ${report.tokens_css ? '있음' : '없음'}`);
  for (const c of report.checks) if (c.status !== 'PASS') console.log(`  [${c.status}] ${c.id} ${c.file} — ${c.detail}`);
  console.log(report.passed ? '통과' : '미통과 — 승인 화면을 열지 않는다');
}
process.exit(report.passed ? 0 : 1);
