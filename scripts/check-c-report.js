#!/usr/bin/env node
/**
 * 3단계 C 판정 종료조건 결정론 검사기 — c_report.json 의 기계 판정 항목을 스크립트가 센다.
 * 왜: c_checks §2 긍정형 7항목·자체 채점 <3·tasks 헤맴/불가·1등 정보 일치는 전부 산술인데 종료조건이 '미분류 FAIL 0' 만 봐서
 *     positive 가 false 여도, 점수 2 에 FAIL 항목이 없어도, 헤맴 2건이어도 통과로 읽혔다(V-3·U-5 갭). 세는 일은 판단이 아니라 산술이다.
 *     스크립트가 세고, worker 는 실행만 한다(D-30 처방을 3단계에 적용).
 *
 * 사용법: node scripts/check-c-report.js --report design/verify/c_report.json
 *          [--shots design/verify/shots/index.md] [--state design/state.json] [--brief design/brief.md]
 *          [--out design/verify/exit_stage3_c.md]
 * 종료 코드: 0 전건 PASS / 1 FAIL 있음 / 2 입력 오류(--report 없음·파일 없음)
 * 선택 입력은 플래그로 지정했는데 파일이 없으면 그 검사 FAIL, 지정 없이 기본 경로에도 없으면 N/A(내용에 명시).
 *
 * 검사 ID (계획 20 단일 번호표):
 *   CR-1  JSON 유효, screens[] ≥1, screens 수 ≥ brief §2 화면 수
 *   CR-2  각 screen ran===true, screenshots == 상태 수(states[] → shots/index.md 의 그 화면 파일 수 → 3~5 범위)
 *   CR-3  shots/index.md 파일마다 캡처 시각 ≥ Figma lastModified, 리포트의 화면마다 index 행 존재.
 *         **PNG 가 index.md 옆에 있으면 캡처 시각은 파일의 실제 mtime 이다**(D-42 — index 에 적힌 시각은 자기 신고라 위조된다). index 시각이 mtime 보다 2분 넘게 미래면 FAIL(위조 의심),
 *         index 의 sha(≥8 hex)가 파일 sha256 접두와 다르면 FAIL. PNG 가 없으면 index 시각으로 판정하되 근거에 '자기 신고' 를 남긴다.
 *   CR-4  verdict 는 pass|fail 뿐(중간값 금지). fail 전건에 diagnosis∈{local,direction,taste_gap,repeat}·elements·evidence
 *   CR-5  score.ui|ux|fit <3 이면 그 축 매핑 검사에 fail ≥1 — ui=C-1·C-3·C-5·C-7·C-8 / ux=C-2·C-4·C-6·C-10·tasks 헤맴/불가 / fit=positive.unique_element·brand_device
 *   CR-6  positive 7키(unique_element, dominant_number, form_differs_by_kind, surface_layers, brand_device, visual_elements_justified, looks_professional)
 *         전부 boolean, false 마다 state.human_gates.final_ack.exceptions[] 에 {screen, item, quote} 존재
 *   CR-7  tasks[] 전 화면·전 역할: 불가 0, 헤맴 ≤1(리포트 전체), task 마다 role, brief §2b T-n 전부 추적, §2 역할 열의 역할마다 추적 ≥1
 *   CR-8  top_info.match===true 전 화면 (declared·blind_first 비어 있지 않음)
 *   CR-9  diagnosis repeat(또는 repeat:true) 이면 state.stages.figma.c_fail_reasons 에 같은 화면·같은 검사 id
 *   CR-11 C 검출력 시험(3-E, full·fast 공통): state.stages.figma.c_detector === 'PASS' + 리포트(--detector, 기본 리포트 폴더/c_detector_test.md) 존재 — 판정자가 심은 슬롭을 잡았다는 증거 없이 실제 화면 판정을 채택하지 않는다(V-3)
 *   CR-12 fail 의 evidence 에 따옴표(「」·'' ·"")로 인용한 화면 문자열이 --texts(text_inventory.json, --texts-only 번들) 또는 --audit 의 text_inventory 에 실제로 있어야 한다 — 판정자 오독(없는 오타 '서배') 차단. 인용이 없으면 N/A, 목록이 잘렸으면 FAIL(텍스트 전용 번들로 다시)
 *   CR-10 화면마다 SLOP-SWEEP 항목(checks[] id "SLOP-SWEEP" 의 evidence/elements 또는 screen.slop_sweep) 존재
 *
 * c_report.json 스키마(3-E 고정 스키마 + 계획 22 확장):
 *   { "screens": [ { "id": "02_home", "purpose": "현황 파악형", "ran": true, "screenshots": 3, "states": ["normal","empty","long"],
 *       "checks": [ { "id": "C-2", "verdict": "pass|fail", "diagnosis": "local|direction|taste_gap|repeat", "repeat": false, "elements": [], "evidence": "" },
 *                   { "id": "SLOP-SWEEP", "verdict": "pass|fail", "elements": [], "evidence": "" } ],
 *       "positive": { "unique_element": true, … 7키 전부 boolean },
 *       "tasks": [ { "id": "T-1", "role": "예비부부", "result": "찾음|헤맴|불가", "first_click": "" } ],
 *       "score": { "ui": 3, "ux": 3, "fit": 5 },
 *       "top_info": { "declared": "design.md §5 문장", "blind_first": "1콜 1순위", "match": true, "diagnosis": "" },
 *       "fidelity": { "elements_match": true, "primary_position_match": true } } ],
 *     "diagnosis": "local|direction|taste_gap|repeat", "routing": "", "retry_count": 1, "escalate_to_human": false }
 *   state.human_gates.final_ack.exceptions[] 항목: { "screen": "02_home", "item": "brand_device", "quote": "<사용자 원문>", "at": "" }
 *   shots/index.md 행: | 파일 | 노드 id | 캡처 시각(ISO) | lastModified(ISO) | sha | — 같은 파일이 여러 행이면 마지막 행이 최신(재캡처 누적)
 */
const fs = require('fs'); const path = require('path');
function args(argv) { const o = {}; for (let i = 2; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; } return o; }
const A = args(process.argv);
if (!A.report) { console.error('--report <c_report.json> 필요'); process.exit(2); }
if (!fs.existsSync(A.report)) { console.error('파일 없음: ' + A.report); process.exit(2); }
const DEF = { shots: 'design/verify/shots/index.md', state: 'design/state.json', brief: 'design/brief.md', detector: 'design/verify/c_detector_test.md', audit: 'design/verify/audit_screens.json', texts: 'design/verify/text_inventory.json' };
/* detector·audit 의 기본 경로는 리포트(c_report.json)와 같은 폴더 — 픽스처·복사본 폴더에서도 같이 움직이게 */
function input(k) { let p = A[k] || DEF[k]; if (!A[k] && (k === 'detector' || k === 'audit' || k === 'texts') && A.report) p = path.join(path.dirname(A.report), path.basename(DEF[k])); const exists = fs.existsSync(p); return { path: p, explicit: !!A[k], text: exists ? fs.readFileSync(p, 'utf8') : null }; }
const shotsIn = input('shots'), stateIn = input('state'), briefIn = input('brief');
let state = null; if (stateIn.text != null) { try { state = JSON.parse(stateIn.text); } catch (e) { stateIn.err = e.message; } }

const checks = []; const add = (id, ok, detail, evidence) => checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail, evidence });
const skip = (id, inp, what) => add(id, !inp.explicit, `${what} — ${inp.explicit ? '지정한 파일 없음' : '입력 없음(N/A)'}`, inp.path);
const str = (v) => typeof v === 'string' && v.trim().length > 0;
const arr = (v) => Array.isArray(v) ? v : [];
const nonEmpty = (v) => Array.isArray(v) ? v.length > 0 : str(v);
const nn = (s) => { const m = String((s && s.id) || '').match(/^(\d+)/); return m ? m[1].padStart(2, '0') : null; };
const norm = (v) => String(v == null ? '' : v).replace(/\s+/g, '').toLowerCase();
const STATES = ['normal', 'empty', 'long', 'loading', 'error'];

/* ---- brief §2·§2b (주석 제거 후 섹션 분할, ID 셀만 있는 자리표시자 행 제외) ---- */
function briefTables(txt) {
  const sections = {}; let cur = null;
  for (const line of txt.replace(/<!--[\s\S]*?-->/g, '').split('\n')) { const m = line.match(/^##\s+(\d+[a-z]?)\.\s+(.*)$/); if (m) { cur = m[1]; sections[cur] = []; continue; } if (cur) sections[cur].push(line); }
  return (id) => { const rows = []; let header = null; for (const l of (sections[id] || [])) { if (!/^\s*\|/.test(l)) continue; const cells = l.split('|').slice(1, -1).map((c) => c.trim()); if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; if (!header) { header = cells; continue; } if (cells.filter(Boolean).length <= 1) continue; rows.push(cells); } return { header: header || [], rows }; };
}
let briefScreens = null, briefTasks = [], briefRoles = [];
if (briefIn.text != null) {
  const T = briefTables(briefIn.text); const t2 = T('2'), t2b = T('2b');
  const s2 = t2.rows.filter((r) => /^\d+$/.test(r[0])); briefScreens = s2.length;
  briefTasks = t2b.rows.map((r) => r[0]).filter((x) => /^T-\d+$/.test(x));
  const ri = t2.header.findIndex((h) => /역할/.test(h));
  if (ri >= 0) briefRoles = [...new Set(s2.flatMap((r) => (r[ri] || '').split(/[·,/]/).map((x) => x.trim()).filter(Boolean)))];
}

/* ---- shots/index.md: 파일 → 최신 행 {captured, modified} ---- */
const ISO = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/g;
function parseIndex(txt) {
  const rows = new Map(); let header = null, capIdx = -1, modIdx = -1, globalMod = null;
  for (const line of txt.split('\n')) {
    if (/^\s*\|/.test(line)) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      if (!header && !cells.some((c) => /\.png/i.test(c))) { header = cells; capIdx = cells.findIndex((c) => /캡처|captur|shot/i.test(c)); modIdx = cells.findIndex((c) => /lastModified|수정|modified/i.test(c)); continue; }
      const fileCell = cells.find((c) => /\.png/i.test(c)); if (!fileCell) continue;
      const file = (fileCell.match(/[\w.\-\/]+\.png/i) || [fileCell])[0].split('/').pop();
      const ts = line.match(ISO) || [];
      const captured = (capIdx >= 0 && (cells[capIdx] || '').match(ISO) || [])[0] || ts[0] || null;
      const modified = (modIdx >= 0 && (cells[modIdx] || '').match(ISO) || [])[0] || (ts.length > 1 ? ts[1] : null);
      const shaCell = cells.find((c) => /^[0-9a-f]{8,64}$/i.test(c)) || null;
      rows.set(file, { captured, modified, sha: shaCell ? shaCell.toLowerCase() : null });
    } else if (/\.png/i.test(line) && !header) { /* 표 헤더가 이미 있으면 표 밖 줄(주석·예시 URL)은 무시한다 */
      const file = (line.match(/[\w.\-\/]+\.png/i) || [''])[0].split('/').pop(); const ts = line.match(ISO) || [];
      rows.set(file, { captured: ts[0] || null, modified: ts.length > 1 ? ts[1] : null });
    } else { const m = line.match(/lastModified\s*[:=]\s*(\S+)/i); if (m && !globalMod) globalMod = m[1]; }
  }
  for (const r of rows.values()) if (!r.modified && globalMod) r.modified = globalMod;
  return rows;
}
const index = shotsIn.text != null ? parseIndex(shotsIn.text) : null;
const indexFilesOf = (s) => { const n = nn(s); return index && n ? [...index.keys()].filter((f) => f.startsWith(n + '_')) : []; };

/* ---- CR-1 JSON 유효 · screens ≥ §2 ---- */
let report = null, parseErr = null;
try { report = JSON.parse(fs.readFileSync(A.report, 'utf8')); } catch (e) { parseErr = e.message; }
const screens = report && Array.isArray(report.screens) ? report.screens : [];
if (parseErr) add('CR-1', false, 'c_report.json 파싱 실패 — CR-2~CR-10 미검사', parseErr.slice(0, 120));
else add('CR-1', screens.length >= 1 && (briefScreens == null || screens.length >= briefScreens), `JSON 유효, screens ${screens.length}개${briefScreens != null ? ` (≥ brief §2 ${briefScreens})` : ' (brief 없음 — §2 대조 N/A)'}`, screens.map((s) => s.id).join(', ') || 'screens[] 비어 있음');

if (!parseErr) {
  const noScreens = screens.length === 0;
  /* ---- CR-2 ran · screenshots == 상태 수 ---- */
  const bad2 = [];
  for (const s of screens) {
    const id = s.id || '?';
    if (s.ran !== true) { bad2.push(`${id}:ran≠true`); continue; }
    if (typeof s.screenshots !== 'number') { bad2.push(`${id}:screenshots 없음`); continue; }
    let expected = null, basis = '';
    if (Array.isArray(s.states) && s.states.length) { expected = s.states.length; basis = 'states[]'; const base = ['normal', 'empty', 'long'].filter((b) => !s.states.includes(b)); if (base.length) bad2.push(`${id}:states 누락 ${base.join('·')}`); }
    else { const files = indexFilesOf(s).filter((f) => STATES.some((st) => f.toLowerCase().includes('_' + st))); if (files.length) { expected = files.length; basis = 'index.md'; } }
    if (expected != null) { if (s.screenshots !== expected) bad2.push(`${id}:screenshots ${s.screenshots}≠${expected}(${basis})`); }
    else if (s.screenshots < 3 || s.screenshots > 5) bad2.push(`${id}:screenshots ${s.screenshots}∉3~5`);
  }
  add('CR-2', !noScreens && bad2.length === 0, noScreens ? 'screens 없음' : `ran·screenshots 불일치 ${bad2.length}건 (화면 ${screens.length})`, bad2.join('; ') || '전 화면 ran, 상태 수 일치');

  /* ---- CR-3 캡처 시각 ≥ lastModified ---- */
  if (index == null) skip('CR-3', shotsIn, 'shots/index.md 캡처 시각 대조');
  else {
    const stale = [], missing = [], noRow = [], forged = [], shaBad = []; let fromFile = 0, selfReported = 0;
    const shotsDir = path.dirname(shotsIn.path);
    for (const [f, r] of index) {
      const fp = path.join(shotsDir, f); let mtimeISO = null;
      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
        const st = fs.statSync(fp); mtimeISO = st.mtime.toISOString(); fromFile++;
        if (r.captured && !isNaN(Date.parse(r.captured)) && Date.parse(r.captured) - st.mtime.getTime() > 120000) forged.push(`${f}: index 캡처 ${r.captured} > 파일 mtime ${mtimeISO} (자기 신고가 파일보다 미래)`);
        if (r.sha && r.sha.length >= 8) { const real = require('crypto').createHash('sha256').update(fs.readFileSync(fp)).digest('hex'); if (!real.startsWith(r.sha)) shaBad.push(`${f}: index sha ${r.sha} ≠ 파일 sha256 ${real.slice(0, 12)}`); }
        r.captured = mtimeISO; /* 파일이 있으면 mtime 이 정본 */
      } else selfReported++;
      if (!r.captured || !r.modified) { missing.push(f); continue; }
      const c = Date.parse(r.captured), m = Date.parse(r.modified);
      if (isNaN(c) || isNaN(m)) missing.push(f + '(시각 파싱 불가)'); else if (c < m) stale.push(`${f}: 캡처 ${r.captured} < 수정 ${r.modified}`);
    }
    for (const s of screens) if (nn(s) && indexFilesOf(s).length === 0) noRow.push(s.id);
    add('CR-3', index.size > 0 && !stale.length && !missing.length && !noRow.length && !forged.length && !shaBad.length, `index ${index.size}파일(실측 mtime ${fromFile}, 자기 신고 ${selfReported}), 낡은 캡처 ${stale.length}, 시각 위조 의심 ${forged.length}, sha 불일치 ${shaBad.length}, 시각 누락 ${missing.length}, index 에 없는 화면 ${noRow.length}`, [...forged, ...shaBad, ...stale, ...missing.map((f) => f + ':시각 누락'), ...noRow.map((s) => s + ':행 없음')].join('; ') || (fromFile ? `전 파일 mtime ≥ lastModified` : '전 파일 캡처 ≥ lastModified (PNG 없음 — index 자기 신고 기준)'));
  }

  /* ---- CR-4 verdict pass|fail · fail 3필드 ---- */
  const DIAG = ['local', 'direction', 'taste_gap', 'repeat']; const bad4 = []; let fails = 0;
  for (const s of screens) for (const c of arr(s.checks)) {
    const v = String(c.verdict || '').toLowerCase(); const tag = `${s.id}/${c.id}`;
    if (v !== 'pass' && v !== 'fail') { bad4.push(`${tag}:verdict '${c.verdict}'`); continue; }
    if (v !== 'fail') continue; fails++;
    const miss = []; if (!DIAG.includes(c.diagnosis)) miss.push('diagnosis'); if (!nonEmpty(c.elements)) miss.push('elements'); if (!str(c.evidence)) miss.push('evidence');
    if (miss.length) bad4.push(`${tag}:${miss.join('·')} 없음`);
  }
  add('CR-4', !noScreens && bad4.length === 0, noScreens ? 'screens 없음' : `fail ${fails}건 중 진단·요소·근거 누락 ${bad4.length}건`, bad4.join('; ') || '전건 분류·근거 있음');

  /* ---- CR-5 score <3 → 축 매핑 fail ≥1 ---- */
  const AX = { ui: ['C-1', 'C-3', 'C-5', 'C-7', 'C-8'], ux: ['C-2', 'C-4', 'C-6', 'C-10'], fit: [] }; const bad5 = [];
  for (const s of screens) {
    const failed = new Set(arr(s.checks).filter((c) => /^fail$/i.test(String(c.verdict))).map((c) => String(c.id).toUpperCase()));
    const taskBad = arr(s.tasks).some((t) => /헤맴|불가/.test(String(t.result)));
    const posBad = !!s.positive && (s.positive.unique_element === false || s.positive.brand_device === false);
    for (const ax of ['ui', 'ux', 'fit']) {
      const sc = s.score ? s.score[ax] : undefined;
      if (typeof sc !== 'number') { bad5.push(`${s.id}:score.${ax} 없음`); continue; }
      if (sc >= 3) continue;
      const has = ax === 'fit' ? posBad : (AX[ax].some((id) => failed.has(id)) || (ax === 'ux' && taskBad));
      if (!has) bad5.push(`${s.id}:score.${ax}=${sc} 인데 매핑 항목 fail 0`);
    }
  }
  add('CR-5', !noScreens && bad5.length === 0, noScreens ? 'screens 없음' : `3축 채점 존재, <3 인데 FAIL 근거 없는 축 ${bad5.length}건`, bad5.join('; ') || '전 화면 채점·근거 정합');

  /* ---- CR-6 positive 7키 boolean · false 는 예외 승인 ---- */
  const POS = ['unique_element', 'dominant_number', 'form_differs_by_kind', 'surface_layers', 'brand_device', 'visual_elements_justified', 'looks_professional'];
  const exceptions = arr(state && state.human_gates && state.human_gates.final_ack && state.human_gates.final_ack.exceptions);
  const exFor = (s, key) => exceptions.find((e) => { const sc = String(e.screen || e.screen_id || e['화면'] || ''); const it = String(e.item || e.key || e['항목'] || ''); const q = e.quote || e.user_quote || e['원문']; return (sc === s.id || (nn(s) && sc.startsWith(nn(s)))) && it === key && str(q); });
  const bad6 = [];
  for (const s of screens) {
    if (!s.positive || typeof s.positive !== 'object') { bad6.push(`${s.id}:positive 없음`); continue; }
    for (const k of POS) { const v = s.positive[k]; if (typeof v !== 'boolean') bad6.push(`${s.id}:${k} 비boolean(${JSON.stringify(v)})`); else if (v === false && !exFor(s, k)) bad6.push(`${s.id}:${k}=false 예외 승인 없음`); }
  }
  add('CR-6', !noScreens && bad6.length === 0, noScreens ? 'screens 없음' : `긍정형 7키 위반 ${bad6.length}건 (예외 원장 ${exceptions.length}건${state ? '' : ', state 없음'})`, bad6.join('; ') || '전 화면 7키 boolean, false 전건 예외 승인');

  /* ---- CR-7 tasks 불가 0 · 헤맴 ≤1 · role · T-n 전부 · 역할 전부 ---- */
  const tasks = []; for (const s of screens) for (const t of arr(s.tasks)) tasks.push(Object.assign({ _screen: s.id }, t)); for (const t of arr(report.tasks)) tasks.push(Object.assign({ _screen: '(root)' }, t));
  const impossible = tasks.filter((t) => /불가/.test(String(t.result))), stray = tasks.filter((t) => /헤맴/.test(String(t.result)));
  const noRole = tasks.filter((t) => !str(t.role)), badResult = tasks.filter((t) => !/찾음|헤맴|불가/.test(String(t.result)));
  const need = briefTasks.length ? briefTasks : ['T-1', 'T-2', 'T-3'];
  const untracked = need.filter((id) => !tasks.some((t) => String(t.id).toUpperCase() === id));
  const missingRoles = briefRoles.filter((r) => !tasks.some((t) => norm(t.role).includes(norm(r)) || (norm(t.role) && norm(r).includes(norm(t.role)))));
  const bad7 = [...impossible.map((t) => `${t._screen}/${t.id}:불가`), ...(stray.length > 1 ? stray.map((t) => `${t._screen}/${t.id}:헤맴`) : []), ...noRole.map((t) => `${t._screen}/${t.id}:role 없음`), ...badResult.map((t) => `${t._screen}/${t.id}:result '${t.result}'`), ...untracked.map((id) => `${id}:추적 없음`), ...missingRoles.map((r) => `역할 '${r}':추적 없음`)];
  add('CR-7', tasks.length > 0 && bad7.length === 0, `tasks ${tasks.length}건 — 불가 ${impossible.length}(0), 헤맴 ${stray.length}(≤1), role 누락 ${noRole.length}, 미추적 과업 ${untracked.length}, 미추적 역할 ${missingRoles.length}${briefRoles.length ? '' : ' (§2 역할 열 없음 — 역할 대조 N/A)'}`, bad7.join('; ') || (tasks.length ? '전 과업·전 역할 추적, 불가 0, 헤맴 ≤1' : 'tasks[] 없음'));

  /* ---- CR-8 top_info.match ---- */
  const bad8 = [];
  for (const s of screens) { const t = s.top_info; if (!t || typeof t !== 'object') bad8.push(`${s.id}:top_info 없음`); else { const m = []; if (t.match !== true) m.push(`match=${JSON.stringify(t.match)}`); if (!str(t.declared)) m.push('declared 없음'); if (!str(t.blind_first)) m.push('blind_first 없음'); if (m.length) bad8.push(`${s.id}:${m.join('·')}`); } }
  add('CR-8', !noScreens && bad8.length === 0, noScreens ? 'screens 없음' : `1등 정보 == 1콜 1순위 불일치·미기록 ${bad8.length}건`, bad8.join('; ') || '전 화면 match=true');

  /* ---- CR-9 repeat → c_fail_reasons 동일 사유 ---- */
  const reasons = state ? [...arr(state.stages && state.stages.figma && state.stages.figma.c_fail_reasons), ...arr(state.c_fail_reasons)] : [];
  const reasonText = reasons.map((r) => typeof r === 'string' ? r : JSON.stringify(r));
  const bad9 = []; let repeats = 0;
  for (const s of screens) for (const c of arr(s.checks)) {
    if (!(c.diagnosis === 'repeat' || c.repeat === true)) continue; repeats++;
    const hit = reasonText.some((t) => t.includes(String(c.id)) && (t.includes(String(s.id)) || (nn(s) && t.includes(nn(s)))));
    if (!hit) bad9.push(`${s.id}/${c.id}`);
  }
  add('CR-9', bad9.length === 0, `repeat 진단 ${repeats}건, c_fail_reasons(${reasons.length}건)에 없는 것 ${bad9.length}건${state ? '' : ' (state 없음)'}`, bad9.join('; ') || (repeats ? '전건 원장 일치' : 'repeat 없음'));

  /* ---- CR-10 SLOP-SWEEP ---- */
  const bad10 = [];
  for (const s of screens) {
    const sw = arr(s.checks).find((c) => /^SLOP[-_ ]?SWEEP$/i.test(String(c.id))); const alt = s.slop_sweep;
    const ok = (sw && (str(sw.evidence) || nonEmpty(sw.elements))) || nonEmpty(alt) || (alt && typeof alt === 'object' && Object.keys(alt).length > 0);
    if (!ok) bad10.push(String(s.id));
  }
  add('CR-10', !noScreens && bad10.length === 0, noScreens ? 'screens 없음' : `SLOP-SWEEP 없는 화면 ${bad10.length}건`, bad10.join(', ') || '전 화면 SLOP-SWEEP 존재');
}

/* ---- CR-11 검출력 시험 (full·fast 공통) ---- */
{
  const det = input('detector');
  const flag = state && state.stages && state.stages.figma ? state.stages.figma.c_detector : undefined;
  add('CR-11', flag === 'PASS' && det.text != null, `c_detector ${flag == null ? '없음' : flag} · 리포트 ${det.text != null ? '있음' : '없음'} (${det.path})`, flag === 'PASS' && det.text != null ? '검출력 확인됨' : '3-E 검출력 시험을 돌려 stages.figma.c_detector=PASS 와 리포트를 남긴다');
}
/* ---- CR-12 인용 문자열 ↔ text_inventory ---- */
{
  /* 우선순위: --texts(텍스트 전용 번들, 잘리지 않음) → --audit 의 text_inventory(예산에 잘렸으면 N/A) */
  const tx = input('texts'); const au = tx.text != null ? tx : input('audit'); let inv = null, truncated = false;
  if (au.text != null) { try { const j = JSON.parse(au.text); inv = (j.text_inventory || []).flatMap((f) => f.texts || []); truncated = !!j.text_inventory_truncated; } catch (e) { inv = null; } }
  const quotes = []; for (const sc of screens) for (const c of arr(sc.checks)) { if (!/^fail$/i.test(String(c.verdict || ''))) continue; const ev = String(c.evidence || ''); const re = /「([^」]{2,40})」|'([^'\n]{2,40})'|"([^"\n]{2,40})"|‘([^’\n]{2,40})’/g; let m; while ((m = re.exec(ev))) { const q = (m[1] || m[2] || m[3] || m[4] || '').trim(); if (/[가-힣A-Za-z]/.test(q)) quotes.push({ tag: `${sc.id}/${c.id}`, q }); } }
  if (!quotes.length) add('CR-12', true, 'fail evidence 에 인용 문자열 없음 — N/A', '인용 0건');
  else if (inv == null) add('CR-12', false, `인용 ${quotes.length}건인데 화면 텍스트 목록 없음 — 오독을 가를 수 없다(FAIL)`, `${DEF.texts}(--texts-only 번들) 또는 ${au.path}`);
  else if (truncated) add('CR-12', false, `text_inventory 가 잘려(truncated) 대조 불가 (인용 ${quotes.length}건)`, `make-figma-audit --texts-only 로 ${DEF.texts} 를 만들어 넘긴다 — 잘린 목록으로는 오독을 못 가른다`);
  else { const bad = quotes.filter(({ q }) => !inv.some((t) => t.includes(q) || q.includes(t) && t.length >= 4)); add('CR-12', bad.length === 0, `인용 ${quotes.length}건 중 화면 텍스트에 없는 것 ${bad.length}`, bad.slice(0, 5).map((b) => `${b.tag}:「${b.q}」`).join(', ') || '전건 화면 텍스트와 일치'); }
}

/* ---- 리포트 ---- */
const passed = checks.every((c) => c.status === 'PASS');
const L = [`# 3단계 C 판정 종료조건 검사 (scripts/check-c-report.js, ${new Date().toISOString()})`, '', `- report: ${A.report} · shots: ${shotsIn.path} · state: ${stateIn.path}${stateIn.err ? '(파싱 실패)' : ''} · brief: ${briefIn.path} · mode: ${state ? state.mode : '-'}`, `- 결과: **${passed ? 'PASS' : 'FAIL'}** (${checks.filter((c) => c.status === 'PASS').length}/${checks.length})`, '', '| 항목 | 결과 | 내용 | 근거 |', '|---|---|---|---|'];
for (const c of checks) L.push(`| ${c.id} | ${c.status} | ${c.detail} | ${String(c.evidence).replace(/\|/g, '/').slice(0, 160)} |`);
const out = L.join('\n') + '\n';
if (A.out) { fs.mkdirSync(path.dirname(A.out), { recursive: true }); fs.writeFileSync(A.out, out); }
console.log(out);
process.exit(passed ? 0 : 1);
