#!/usr/bin/env bash
# 검사기 검출력 자체 시험 (계획 24) — 검사기가 "빈 것을 통과시키지 않고, 채운 것을 막지 않고, 심은 결함을 정확히 잡는가" 를 픽스처로 확인한다.
#
# 왜: 검사기는 하네스의 종료조건 판정 수단이다. 검사기 자체가 틀리면(빈 템플릿 PASS — 실제로 있었던 결함, B-4·B-12) 그 위의 모든 종료조건이 무의미하다.
#     그래서 하네스를 시작하기 전에 이 스크립트가 종료 코드 0 이어야 한다(design-harness '시작 시 반드시', eval.sh 첫 단계).
#
# 사용법: bash scripts/selftest.sh [-v]      (-v: 검사기 리포트 경로를 함께 출력)
# 종료 코드: 0 전건 기대와 일치 / 1 하나라도 기대와 다름
#
# 픽스처(scripts/fixtures/, 도메인은 청첩장이 아닌 '반려동물 복약 알림' — 검사기가 도메인 단어에 기대지 않음을 겸해서 본다):
#   brief_empty.md(= templates/brief.md 사본)·raw_empty.md         → check-brief FAIL (B-3·B-4·B-5·B-12·B-16·B-18 포함) — 라이브 templates/brief.md 도 같이 돌린다
#   brief_golden.md·raw_golden.md·references_golden.md·state_full.json·exit_interview_page_golden.md → check-brief 전건 PASS
#   골든에서 sed 로 결함 하나씩 심은 변이 15종                      → 심은 항목만 정확히 FAIL (다른 항목은 흔들리지 않음)
#   interview_golden.html / interview_bad.html (build-interview-fixtures.js 가 템플릿 골격 + interview_*.json 으로 생성)
#                                                                    → golden PASS / bad 는 P-3(unknown 누락)·P-4(금지어 1건)·P-6(타일 두 속성 동시 변경) 만 FAIL
#   templates/interview_page.html 의 샘플 데이터                    → 그대로는 통과하면 안 된다(P-11 필수 payload 누락)
#   figma_good/verify/c_report.json / c_report_bad.json             → check-c-report PASS / CR-5·CR-6 만 FAIL
#   forbidden_14.txt / forbidden_clean.txt                          → 14단어 각각 정확히 1회 매치·종료 1 / 0건·종료 0
#   decisions_empty.md(= templates/decisions.md 사본) / decisions_golden.md → check-decisions FAIL(D-1~D-4) / PASS
#   html_good/ · html_bad/                                           → check-html PASS(WARN 허용) / FAIL(H-6·H-8·H-11·H-12·H-13·H-15·H-16·H-17 포함)
#   figma_good/                                                      → check-figma PASS (F-10 이 check-c-report 를 실제로 부른다)
#
# 환경 행: T-0(check-brief)·P-0(check-interview-page)·F-8(check-figma)은 `git diff --quiet -- templates/` 라서 픽스처가 아니라 워킹트리 상태를 본다.
#   templates/ 가 미커밋이면 이 세 행은 FAIL 이 정상이므로 판정에서 빼고 '환경' 으로만 표시한다. templates/ 가 깨끗하면 종료 코드 0 까지 요구한다.
set -u
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
FX="scripts/fixtures"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
VERBOSE=0; [ "${1:-}" = "-v" ] && VERBOSE=1

ENV_DIRTY=0; git diff --quiet -- templates/ 2>/dev/null || ENV_DIRTY=1
ENV_IDS='^(T-0|P-0|F-8)$'
PASS_N=0; FAIL_N=0; RC=0
ok() { PASS_N=$((PASS_N+1)); echo "[ok] $1"; }
ng() { FAIL_N=$((FAIL_N+1)); echo "[NG] $1"; }

# 명령을 실행하고 종료 코드를 RC 에 남긴다(파이프 없이 — 종료 코드가 파이프에 가려지지 않게).
run() { "$@" > "$TMP/last.log" 2>&1; RC=$?; [ "$VERBOSE" = 1 ] && echo "      \$ $* → exit $RC"; return 0; }
# 리포트 표에서 FAIL 행의 항목 id 만 뽑는다(정렬·중복 제거). templates/ 미커밋이면 환경 행(T-0·P-0·F-8)은 뺀다.
fails_of() {
  [ -f "$1" ] || { echo "(리포트 없음)"; return; }
  grep -E '^\| *[A-Z]+-[0-9]+[a-z]?[^|]*\| *FAIL *\|' "$1" | sed -E 's/^\| *([A-Z]+-[0-9]+[a-z]?).*/\1/' \
    | { if [ "$ENV_DIRTY" = 1 ]; then grep -Ev "$ENV_IDS"; else cat; fi; } | sort -u | tr '\n' ' ' | sed 's/ $//'
}
env_rows() { [ -f "$1" ] && grep -E '^\| *(T-0|P-0|F-8) *\| *FAIL' "$1" | sed -E 's/^\| *([A-Z]+-[0-9]+).*/\1/' | tr '\n' ' '; }
norm() { echo "$1" | tr ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' ' | sed 's/ $//'; }

# expect_pass <라벨> <리포트> <명령…> : FAIL 행 0 (환경 행 제외). templates/ 가 깨끗하면 종료 코드 0 도 요구.
expect_pass() {
  local label="$1" rep="$2"; shift 2; run "$@"
  local f; f="$(fails_of "$rep")"; local e; e="$(env_rows "$rep")"
  if [ -n "$f" ]; then ng "$label — FAIL 행이 있음: $f ($rep)"; [ "$VERBOSE" = 1 ] && grep -E '\| *FAIL *\|' "$rep"; return; fi
  if [ "$ENV_DIRTY" = 0 ] && [ "$RC" != 0 ]; then ng "$label — 종료 코드 $RC (기대 0)"; return; fi
  ok "$label — FAIL 0${e:+ (환경 행 ${e}제외: templates/ 미커밋)}"
}
# expect_fail_exact <라벨> <기대 FAIL id들> <리포트> <명령…> : 종료 1 이고 FAIL 집합이 기대와 정확히 같다.
expect_fail_exact() {
  local label="$1" want="$2" rep="$3"; shift 3; run "$@"
  local f; f="$(fails_of "$rep")"
  if [ "$RC" != 1 ]; then ng "$label — 종료 코드 $RC (기대 1)"; return; fi
  if [ "$(norm "$f")" != "$(norm "$want")" ]; then ng "$label — FAIL 집합 [$f] ≠ 기대 [$want]"; return; fi
  ok "$label — 정확히 [$want] 만 FAIL"
}
# expect_fail_subset <라벨> <반드시 FAIL 이어야 하는 id들> <리포트> <명령…> : 종료 1 이고 기대 id 전부가 FAIL 안에 있다.
expect_fail_subset() {
  local label="$1" want="$2" rep="$3"; shift 3; run "$@"
  local f; f="$(fails_of "$rep")"; local miss=""
  if [ "$RC" != 1 ]; then ng "$label — 종료 코드 $RC (기대 1)"; return; fi
  for id in $want; do echo " $f " | grep -q " $id " || miss="$miss $id"; done
  if [ -n "$miss" ]; then ng "$label — 잡아야 할 항목이 PASS 로 나옴:$miss (실제 FAIL: $f)"; return; fi
  ok "$label — FAIL [$f] ⊇ [$want]"
}
# expect_rc <라벨> <기대 종료 코드> <명령…>
expect_rc() { local label="$1" want="$2"; shift 2; run "$@"; if [ "$RC" = "$want" ]; then ok "$label — 종료 $RC"; else ng "$label — 종료 $RC (기대 $want)"; fi; }

echo "# selftest — 검사기 검출력 시험 ($(date '+%Y-%m-%d %H:%M'))"
[ "$ENV_DIRTY" = 1 ] && echo "  환경: templates/ 미커밋 → T-0·P-0·F-8 은 환경 행으로 표시만 하고 판정에서 뺀다 (커밋 후엔 종료 코드 0 까지 요구)"

echo "## 0. 문법·정본"
for f in scripts/*.js scripts/lib/*.js scripts/fixtures/*.js; do
  if node --check "$f" 2>"$TMP/chk.log"; then :; else ng "node --check $f — $(head -1 "$TMP/chk.log")"; fi
done; ok "node --check scripts/*.js scripts/lib/*.js scripts/fixtures/*.js"
N="$(node -e 'process.stdout.write(String(require("./scripts/lib/forbidden-words").FORBIDDEN_WORDS.length))')"
[ "$N" = 14 ] && ok "forbidden-words FORBIDDEN_WORDS 14개" || ng "forbidden-words FORBIDDEN_WORDS ${N}개 (정본 14)"
ND="$(node -e 'process.stdout.write(String(require("./scripts/lib/forbidden-words").DOC_WORDS.length))')"
[ "$ND" = 12 ] && ok "forbidden-words DOC_WORDS 12개(문서·내부 용어)" || ng "forbidden-words DOC_WORDS ${ND}개 (정본 12)"
if node scripts/fixtures/check-kinds.js > "$TMP/kinds.log" 2>&1; then ok "사람 호출 kind — 스킬 문서 ⊆ check-brief KINDS ($(tail -1 "$TMP/kinds.log"))"; else ng "kind 정본 불일치 — $(grep -v "^ok" "$TMP/kinds.log" | head -3 | tr '\n' ' ')"; fi
cmp -s templates/brief.md "$FX/brief_empty.md" && ok "brief_empty.md == templates/brief.md" || echo "[warn] brief_empty.md 가 templates/brief.md 와 다름 — cp templates/brief.md $FX/brief_empty.md (라이브 템플릿도 아래에서 같이 검사한다)"
cmp -s templates/decisions.md "$FX/decisions_empty.md" && ok "decisions_empty.md == templates/decisions.md" || echo "[warn] decisions_empty.md 가 templates/decisions.md 와 다름 — cp templates/decisions.md $FX/decisions_empty.md"

echo "## 1. forbidden-words (scripts/lib/forbidden-words.js)"
expect_rc "forbidden_14.txt → 종료 1" 1 node scripts/lib/forbidden-words.js "$FX/forbidden_14.txt"
if node -e '
  const f=require("./scripts/lib/forbidden-words"); const t=require("fs").readFileSync(process.argv[1],"utf8");
  const c={}; for (const h of f.scanText(t)) c[h.word]=(c[h.word]||0)+1;
  const bad=f.FORBIDDEN_WORDS.filter(w=>c[w]!==1); const extra=Object.keys(c).filter(w=>!f.FORBIDDEN_WORDS.includes(w));
  if (bad.length||extra.length){ console.error("1회가 아닌 단어: "+bad.join(",")+" / 목록 밖: "+extra.join(",")); process.exit(1); }
  console.log(Object.keys(c).length+"단어 각 1회");' "$FX/forbidden_14.txt" > "$TMP/fw.log" 2>&1; then ok "forbidden_14.txt — 14단어 각각 정확히 1회 매치"; else ng "forbidden_14.txt — $(cat "$TMP/fw.log")"; fi
expect_rc "forbidden_clean.txt → 종료 0" 0 node scripts/lib/forbidden-words.js "$FX/forbidden_clean.txt"
expect_rc "forbidden_doc12.txt(문서 용어 12) → 종료 1" 1 node scripts/lib/forbidden-words.js "$FX/forbidden_doc12.txt"
if node -e 'const f=require("./scripts/lib/forbidden-words"); const t=require("fs").readFileSync(process.argv[1],"utf8"); const c={}; for (const h of f.scanText(t)) c[h.word]=(c[h.word]||0)+1; const bad=f.DOC_WORDS.filter(w=>c[w]!==1); if (bad.length||Object.keys(c).length!==12) { console.log("불일치: "+JSON.stringify(c)); process.exit(1);} ' "$FX/forbidden_doc12.txt" > "$TMP/fwd.log" 2>&1; then ok "forbidden_doc12.txt — 문서 용어 12개 각각 정확히 1회 매치"; else ng "forbidden_doc12.txt — $(cat "$TMP/fwd.log")"; fi
printf '어떤 느낌이 좋으세요?\n' > "$TMP/taste.txt"
expect_rc "취향형 문장, --taste 없이 → 종료 0" 0 node scripts/lib/forbidden-words.js "$TMP/taste.txt"
expect_rc "취향형 문장, --taste → 종료 1" 1 node scripts/lib/forbidden-words.js --taste "$TMP/taste.txt"
expect_rc "없는 파일 → 종료 2" 2 node scripts/lib/forbidden-words.js "$TMP/nope.txt"

echo "## 2. check-brief"
CB="node scripts/check-brief.js"
G="$FX/brief_golden.md"; R="$FX/raw_golden.md"; S="$FX/state_full.json"; PR="$FX/exit_interview_page_golden.md"; REFS="$FX/references_golden.md"
expect_fail_subset "빈 템플릿(brief_empty.md)" "B-3 B-4 B-5 B-12 B-16 B-18" "$TMP/cb_empty.md" $CB --brief "$FX/brief_empty.md" --raw "$FX/raw_empty.md" --out "$TMP/cb_empty.md"
expect_fail_subset "빈 템플릿(라이브 templates/brief.md)" "B-3 B-4 B-5 B-12 B-16 B-18" "$TMP/cb_live.md" $CB --brief templates/brief.md --raw "$FX/raw_empty.md" --out "$TMP/cb_live.md"
AUD="$FX/audit_result_golden.json"
expect_pass "골든(brief_golden.md, full)" "$TMP/cb_golden.md" $CB --brief "$G" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/cb_golden.md"
expect_fail_exact "B-14 0-G 감사 미실행(--audit 없음)" "B-14" "$TMP/cb_noaudit.md" $CB --brief "$G" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --out "$TMP/cb_noaudit.md"
expect_rc "--state 가 없는 경로 → 종료 2" 2 $CB --brief "$G" --raw "$R" --state "$TMP/nope.json"
# 변이: 골든에서 결함 하나씩 심는다 → 심은 항목만 FAIL
mut() { local name="$1" want="$2" brief="$3" raw="$4" state="$5" pr="$6"; expect_fail_exact "변이 $name" "$want" "$TMP/cb_$name.md" $CB --brief "$brief" --raw "$raw" --state "$state" --refs "$REFS" --page-report "$pr" --audit "$AUD" --out "$TMP/cb_$name.md"; }
sed -E 's/^\| 4 \| 돌봄 공유 링크 \| R-1 \| 약 등록 완료 직후 \| 공유 링크 \|/| 4 | 돌봄 공유 링크 | R-1 | 약 등록 완료 직후 |  |/' "$G" > "$TMP/m_b3b.md";  mut "B-3b 1등 정보 공백"            "B-3b" "$TMP/m_b3b.md" "$R" "$S" "$PR"
sed -E 's/R-2 돌봄 대리인\(가족·펫시터\)$/R-2 돌봄 대리인(가족·펫시터) · R-3 수의사/' "$G" > "$TMP/m_b3c.md";           mut "B-3c §11 역할이 §2 에 없음"     "B-3c" "$TMP/m_b3c.md" "$R" "$S" "$PR"
sed -E 's/^- source_refs: \[A-05, R-G-03, W-1\]$/- source_refs: [A-05]/' "$G" > "$TMP/m_b7b.md";                       mut "B-7b confirmed 근거 1건"        "B-7b" "$TMP/m_b7b.md" "$R" "$S" "$PR"
sed -E 's/\| ① — 등록 0건 상태가 PRD 에 없음 \|/|  |/' "$G" > "$TMP/m_b12.md";                                          mut "B-12 하네스 추천 공백"          "B-12" "$TMP/m_b12.md" "$R" "$S" "$PR"
grep -v '^| 첫 진입·온보딩(등록 0건) |' "$G" > "$TMP/m_b16.md";                                                            mut "B-16 첫 진입 행 삭제(+B-4 T-1 대조)" "B-4 B-16" "$TMP/m_b16.md" "$R" "$S" "$PR"
grep -v '^| A-05 | 추천 수락' "$G" > "$TMP/m_b27.md";                                                             mut "B-27 §6 추천 수락 행 삭제"      "B-27" "$TMP/m_b27.md" "$R" "$S" "$PR"
grep -v '^| 역할별 랜딩 — R-2 |' "$G" > "$TMP/m_b16r.md";                                                          mut "B-16 역할별 랜딩 행 < 역할 수"   "B-16" "$TMP/m_b16r.md" "$R" "$S" "$PR"
grep -v '^| 계정 진입(가입·로그인·비로그인 시작) |' "$G" > "$TMP/m_b16g.md";                                              mut "B-16 계정 진입 행 삭제(D-50)"   "B-16" "$TMP/m_b16g.md" "$R" "$S" "$PR"
grep -v '^| 2 | 복약 놓침 |' "$G" > "$TMP/m_b17.md";                                                                     mut "B-17 §2d 1행뿐"                 "B-17" "$TMP/m_b17.md" "$R" "$S" "$PR"
grep -v '^| REF-5 |' "$G" > "$TMP/m_b18.md";                                                                             mut "B-18 §9 과업 T-3 커버 부족"     "B-18" "$TMP/m_b18.md" "$R" "$S" "$PR"
sed -E 's/^- plain: 시간 지난 약은 맨 위 따로 보인다$/- plain: 시간 지난 약은 레이아웃 맨 위 따로 보인다/' "$G" > "$TMP/m_b19.md"; mut "B-19 plain 에 금지어"        "B-19" "$TMP/m_b19.md" "$R" "$S" "$PR"
sed -E 's/^- 사용자 수준\(익숙함·연령·기기\): .*$/- 사용자 수준(익숙함·연령·기기): /' "$G" > "$TMP/m_b26.md";               mut "B-26 사용자 수준 공백"          "B-26" "$TMP/m_b26.md" "$R" "$S" "$PR"
grep -v '^N-정보:' "$R" > "$TMP/m_b5.md";                                                                                mut "B-5 진술≠반응 N- 고지 삭제"     "B-5"  "$G" "$TMP/m_b5.md" "$S" "$PR"
sed -E 's/^H-02 \[interview\/constraint\]$/H-02 [interview\/nonsense]/' "$R" > "$TMP/m_b24.md";                         mut "B-24 H- kind 미허용"            "B-24" "$G" "$TMP/m_b24.md" "$S" "$PR"
grep -v '^H-01 \[interview/interview_page\]' "$R" | grep -v '^  결정할 것: 인터뷰 페이지' > "$TMP/m_b24b.md";              mut "B-24 state.calls 2 ≠ raw H- 1" "B-24" "$G" "$TMP/m_b24b.md" "$S" "$PR"
sed -E 's/^A-05: .*$/A-05: "아침에 먹였는지 기억이 안 나서 한 번 더 먹일 뻔했어요" [UNCLEAR]/; s/^A-01: .*$/A-01: "저녁에 앉아서 약 봉투 세 개를 펼쳐 놓고 뭘 언제 먹였는지 정리해요" [UNCLEAR]/; s/^A-02: .*$/A-02: "오늘 남은 약이 몇 개인지요" [UNCLEAR]/; s/^A-07: .*$/A-07: "저는 가끔, 부모님은 60대인데 폰으로만 봐요" [UNCLEAR]/; s/^A-08: .*$/A-08: "부모님은 그냥 지금 뭘 먹이면 되는지만 알면 돼요" [UNCLEAR]/' "$R" > "$TMP/m_b25.md"; mut "B-25 [UNCLEAR] 5/9" "B-25" "$G" "$TMP/m_b25.md" "$S" "$PR"
{ cat "$R"; printf 'F-2 (Q-05): 하나 더\nA-F-2: "네"\nF-3 (Q-05): 또 하나\nA-F-3: "네"\n'; } > "$TMP/m_b23.md";              mut "B-23 같은 원 질문 되묻기 3회"   "B-23" "$G" "$TMP/m_b23.md" "$S" "$PR"
sed -E 's/"human_calls_max": 9/"human_calls_max": 1/' "$S" > "$TMP/m_b24c.json";                                                mut "B-24 호출 건수 > human_calls_max"  "B-24" "$G" "$R" "$TMP/m_b24c.json" "$PR"
sed -E 's/"answered": 20/"answered": 18/' "$S" > "$TMP/m_b22.json";                                                      mut "B-22 answered ≠ raw 합계"       "B-22" "$G" "$R" "$TMP/m_b22.json" "$PR"
sed -E 's/^\| P-3 \| PASS \|/| P-3 | FAIL |/' "$PR" > "$TMP/m_b21.md";                                                   mut "B-21 페이지 리포트에 FAIL"      "B-21" "$G" "$R" "$S" "$TMP/m_b21.md"

echo "## 3. check-interview-page"
CIP="node scripts/check-interview-page.js"
CIPARGS=(--template-ref templates/interview_page.html --index "$FX/gallery_index_golden.json" --state "$S" --refs "$REFS" --prd "$FX/prd_analysis_golden.md")
expect_pass "골든(interview_golden.html)" "$TMP/cip_golden.md" $CIP --page "$FX/interview_golden.html" "${CIPARGS[@]}" --out "$TMP/cip_golden.md"
grep -qE '^\| P-1 \| FAIL' "$TMP/cip_golden.md" 2>/dev/null && echo "      힌트: 템플릿 골격이 바뀌었다 — node scripts/fixtures/build-interview-fixtures.js 로 interview_golden/bad.html 재생성"
expect_fail_exact "결함(interview_bad.html): unknown 누락·금지어 1건·타일 두 속성" "P-3 P-4 P-6" "$TMP/cip_bad.md" $CIP --page "$FX/interview_bad.html" "${CIPARGS[@]}" --out "$TMP/cip_bad.md"
expect_fail_subset "템플릿 샘플 데이터 그대로는 통과 불가(P-11 필수 payload)" "P-11" "$TMP/cip_tpl.md" $CIP --page templates/interview_page.html "${CIPARGS[@]}" --out "$TMP/cip_tpl.md"
# P-15·P-16 (team-3 비교 반영): effect 한 줄 삭제 → P-15 만, 투어 장면의 press 삭제 → P-16 만 FAIL. 골든 JSON 을 바꿔 템플릿 골격에 다시 주입한다
mutpage() { node scripts/fixtures/mutate-interview-page.js "$FX/interview_golden.json" "$1" "$2"; }
mutpage "$TMP/cip_m15.html" effect; expect_fail_exact "P-15 effect 삭제" "P-15" "$TMP/cip_m15.md" $CIP --page "$TMP/cip_m15.html" "${CIPARGS[@]}" --out "$TMP/cip_m15.md"
mutpage "$TMP/cip_m3r.html" recommended;   expect_fail_exact "P-3 결정형(Q2) recommended 삭제" "P-3" "$TMP/cip_m3r.md" $CIP --page "$TMP/cip_m3r.html" "${CIPARGS[@]}" --out "$TMP/cip_m3r.md"
mutpage "$TMP/cip_m18.html" verifies;      expect_fail_exact "P-18 재검증 질문 삭제" "P-18" "$TMP/cip_m18.md" $CIP --page "$TMP/cip_m18.html" "${CIPARGS[@]}" --out "$TMP/cip_m18.md"
mutpage "$TMP/cip_m17.html" pattern-html;  expect_fail_exact "P-17 패턴 선택지 html 삭제" "P-17" "$TMP/cip_m17.md" $CIP --page "$TMP/cip_m17.html" "${CIPARGS[@]}" --out "$TMP/cip_m17.md"
mutpage "$TMP/cip_m12.html" pattern-drop;  expect_fail_exact "P-12 패턴 질문 삭제(references 과업 수 미달)" "P-12" "$TMP/cip_m12.md" $CIP --page "$TMP/cip_m12.html" "${CIPARGS[@]}" --out "$TMP/cip_m12.md"
mutpage "$TMP/cip_m19.html" service-name;  expect_fail_exact "P-19 레퍼런스 서비스명 노출" "P-19" "$TMP/cip_m19.md" $CIP --page "$TMP/cip_m19.html" "${CIPARGS[@]}" --out "$TMP/cip_m19.md"
mutpage "$TMP/cip_mo.html" open-question;  expect_fail_exact "P-4 열린 결정 질문(추천 없이 '어떤 로그인을 넣을까요')" "P-4" "$TMP/cip_mo.md" $CIP --page "$TMP/cip_mo.html" "${CIPARGS[@]}" --out "$TMP/cip_mo.md"
mutpage "$TMP/cip_mt.html" taste-recommended; expect_fail_exact "P-3 취향형(Q1)에 recommended — 앵커링" "P-3" "$TMP/cip_mt.md" $CIP --page "$TMP/cip_mt.html" "${CIPARGS[@]}" --out "$TMP/cip_mt.md"
mutpage "$TMP/cip_mf.html" frame;          expect_fail_exact "P-15 frame 삭제" "P-15" "$TMP/cip_mf.md" $CIP --page "$TMP/cip_mf.html" "${CIPARGS[@]}" --out "$TMP/cip_mf.md"
mutpage "$TMP/cip_m7.html" tile-elements;  expect_fail_subset "P-7 타일 요소 12개" "P-7" "$TMP/cip_m7.md" $CIP --page "$TMP/cip_m7.html" "${CIPARGS[@]}" --out "$TMP/cip_m7.md"
mutpage "$TMP/cip_m9.html" contrast;       expect_fail_subset "P-9 대비 4.5:1 미만" "P-9" "$TMP/cip_m9.md" $CIP --page "$TMP/cip_m9.html" "${CIPARGS[@]}" --out "$TMP/cip_m9.md"
mutpage "$TMP/cip_m20.html" always-drop;  expect_fail_exact "P-20 always 쌍(채도) 삭제" "P-20" "$TMP/cip_m20.md" $CIP --page "$TMP/cip_m20.html" "${CIPARGS[@]}" --out "$TMP/cip_m20.md"
mutpage "$TMP/cip_m16.html" press;  expect_fail_exact "P-16 투어 press 삭제" "P-16" "$TMP/cip_m16.md" $CIP --page "$TMP/cip_m16.html" "${CIPARGS[@]}" --out "$TMP/cip_m16.md"
expect_rc "없는 페이지 → 종료 2" 2 $CIP --page "$TMP/nope.html"

echo "## 3b. check-references (0-A2)"
CRF="node scripts/check-references.js"
expect_pass "골든(references_golden.md)" "$TMP/crf_good.md" $CRF --refs "$FX/references_golden.md" --state "$S" --out "$TMP/crf_good.md"
mkdir -p "$TMP/refs"; cp -R "$FX/references" "$TMP/refs/"; sed -E 's/\| REF-[0-9]-1\.png \|/| 미확보 — 사유 |/g' "$FX/references_golden.md" > "$TMP/refs/refs_noshot.md"
expect_fail_exact "변이 R-5 전 행 스크린샷 미확보" "R-5" "$TMP/crf_m5.md" $CRF --refs "$TMP/refs/refs_noshot.md" --state "$S" --out "$TMP/crf_m5.md"
sed -E 's/\| 간접 \|/| 직접 |/' "$FX/references_golden.md" > "$TMP/refs/refs_noind.md"; expect_fail_exact "변이 R-3 간접 0" "R-3" "$TMP/crf_m3.md" $CRF --refs "$TMP/refs/refs_noind.md" --state "$S" --out "$TMP/crf_m3.md"
sed -E 's/\| T-1, T-2 \|/| T-9 |/' "$FX/references_golden.md" > "$TMP/refs/refs_thin.md"; expect_fail_exact "변이 R-4 과업당 서비스 1개" "R-4" "$TMP/crf_m4.md" $CRF --refs "$TMP/refs/refs_thin.md" --state "$S" --out "$TMP/crf_m4.md"
printf '# 레퍼런스\n\n레퍼런스 없음 — 검색 결과가 전부 웹 대시보드라 모바일 화면 없음\n' > "$TMP/refs_none.md"
expect_pass "레퍼런스 없음 선언(사유) → R-1 PASS, 나머지 N/A" "$TMP/crf_none.md" $CRF --refs "$TMP/refs_none.md" --state "$S" --out "$TMP/crf_none.md"
{ cat "$FX/references_golden.md"; yes "- 메모 줄" | head -100; } > "$TMP/refs/refs_long.md"; expect_fail_exact "변이 R-7 줄 수 상한 초과" "R-7" "$TMP/crf_m7.md" $CRF --refs "$TMP/refs/refs_long.md" --state "$S" --out "$TMP/crf_m7.md"
expect_rc "없는 파일 → 종료 2" 2 $CRF --refs "$TMP/nope.md"

echo "## 3c. check-prd-analysis (0-A Z-1~Z-8)"
CPA="node scripts/check-prd-analysis.js"
expect_pass "골든(prd_analysis_golden.md)" "$TMP/cpa_good.md" $CPA --prd "$FX/prd_analysis_golden.md" --state "$S" --out "$TMP/cpa_good.md"
node -e 'const fs=require("fs");const L=fs.readFileSync(process.argv[1],"utf8").split("\n").map(l=>l.startsWith("| P-01 ")?l.replace("| B |","|  |"):l);fs.writeFileSync(process.argv[2],L.join("\n"));' "$FX/prd_analysis_golden.md" "$TMP/prd_m5.md"; expect_fail_exact "Z-5 반박 추천 공백" "Z-5" "$TMP/cpa_m5.md" $CPA --prd "$TMP/prd_m5.md" --state "$S" --out "$TMP/cpa_m5.md"
grep -v '^| (g) 계정 진입' "$FX/prd_analysis_golden.md" > "$TMP/prd_m6.md"; expect_fail_exact "Z-6 계정 진입 행 삭제" "Z-6" "$TMP/cpa_m6.md" $CPA --prd "$TMP/prd_m6.md" --state "$S" --out "$TMP/cpa_m6.md"
expect_rc "없는 파일 → 종료 2" 2 $CPA --prd "$TMP/nope.md"

echo "## 4. check-c-report"
CCR="node scripts/check-c-report.js"; FG="$FX/figma_good"
expect_pass "골든(figma_good/verify/c_report.json)" "$TMP/ccr_good.md" $CCR --report "$FG/verify/c_report.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --out "$TMP/ccr_good.md"
expect_fail_exact "결함(c_report_bad.json): positive false 무예외·score 2 무근거" "CR-5 CR-6" "$TMP/ccr_bad.md" $CCR --report "$FX/c_report_bad.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --detector "$FG/verify/c_detector_test.md" --out "$TMP/ccr_bad.md"
# CR-8: top_info.match=false → CR-8 만 FAIL
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));d.screens[0].top_info.match=false;fs.writeFileSync(process.argv[2],JSON.stringify(d));' "$FG/verify/c_report.json" "$TMP/c_report_m8.json"
expect_fail_exact "CR-8 top_info.match=false" "CR-8" "$TMP/ccr_m8.md" $CCR --report "$TMP/c_report_m8.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --detector "$FG/verify/c_detector_test.md" --out "$TMP/ccr_m8.md"
# CR-11: c_detector 없는 state → full 에서 FAIL
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));delete d.stages.figma.c_detector;fs.writeFileSync(process.argv[2],JSON.stringify(d));' "$S" "$TMP/state_nodet.json"
expect_fail_exact "CR-11 검출력 시험 미실행(full)" "CR-11" "$TMP/ccr_m11.md" $CCR --report "$FG/verify/c_report.json" --brief "$FG/brief.md" --state "$TMP/state_nodet.json" --shots "$FG/verify/shots/index.md" --out "$TMP/ccr_m11.md"
# CR-12: fail evidence 가 화면에 없는 문자열을 인용 → 오독으로 FAIL (text_inventory 는 audit_screens.json)
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const c=d.screens[0].checks.find(c=>c.id==="C-2");c.verdict="fail";c.diagnosis="local";c.elements=["title"];c.evidence="제목에 오타 「서배」 가 보임";fs.writeFileSync(process.argv[2],JSON.stringify(d));' "$FG/verify/c_report.json" "$TMP/c_report_m12.json"
expect_fail_exact "CR-12 인용 문자열이 화면 텍스트에 없음(오독)" "CR-12" "$TMP/ccr_m12.md" $CCR --report "$TMP/c_report_m12.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --detector "$FG/verify/c_detector_test.md" --audit "$FG/verify/audit_screens.json" --out "$TMP/ccr_m12.md"
# D-42: PNG 가 있으면 mtime 이 정본 — index 시각을 미래로 적어도 CR-3 이 위조로 잡는다 / sha 불일치도 잡는다
rm -rf "$TMP/shots_forged"; mkdir -p "$TMP/shots_forged"; printf 'PNG' > "$TMP/shots_forged/01_normal.png"; touch -t 202609070100 "$TMP/shots_forged/01_normal.png"
printf '| 파일 | 노드 id | 캡처 시각(ISO) | lastModified(ISO) | sha |\n|---|---|---|---|---|\n| 01_normal.png | 10:1 | 2026-09-07T10:00:00Z | 2026-09-07T09:30:00Z | deadbeef0000 |\n| 01_empty.png | 10:2 | 2026-09-07T10:00:00Z | 2026-09-07T09:30:00Z | c |\n| 01_long.png | 10:3 | 2026-09-07T10:00:00Z | 2026-09-07T09:30:00Z | d |\n| 02_normal.png | 11:1 | 2026-09-07T10:00:00Z | 2026-09-07T09:30:00Z | e |\n| 02_empty.png | 11:2 | 2026-09-07T10:00:00Z | 2026-09-07T09:30:00Z | f |\n| 02_long.png | 11:3 | 2026-09-07T10:00:00Z | 2026-09-07T09:30:00Z | g |\n| 02_error.png | 11:4 | 2026-09-07T10:00:00Z | 2026-09-07T09:30:00Z | h |\n' > "$TMP/shots_forged/index.md"
expect_fail_exact "CR-3 위조: index 시각 미래·sha 불일치 (PNG mtime 정본)" "CR-3" "$TMP/ccr_forged.md" $CCR --report "$FG/verify/c_report.json" --brief "$FG/brief.md" --state "$S" --shots "$TMP/shots_forged/index.md" --out "$TMP/ccr_forged.md"
expect_rc "없는 리포트 → 종료 2" 2 $CCR --report "$TMP/nope.json"

echo "## 5. check-decisions"
CD="node scripts/check-decisions.js"
expect_fail_subset "빈 템플릿(decisions_empty.md)" "D-1 D-2 D-3 D-4" "$TMP/cd_empty.md" $CD --decisions "$FX/decisions_empty.md" --raw "$FX/raw_empty.md" --state "$S" --out "$TMP/cd_empty.md"
expect_pass "골든(decisions_golden.md)" "$TMP/cd_golden.md" $CD --decisions "$FX/decisions_golden.md" --raw "$R" --state "$S" --out "$TMP/cd_golden.md"
sed -E 's/^- \*\*선택 이유\(사용자 원문\)\*\*: .*$/- **선택 이유(사용자 원문)**: /' "$FX/decisions_golden.md" > "$TMP/dec_m2.md"; expect_fail_exact "D-2 선택 이유 공백" "D-2" "$TMP/cd_m2.md" $CD --decisions "$TMP/dec_m2.md" --raw "$R" --state "$S" --out "$TMP/cd_m2.md"
sed -E 's/^- \*\*승인 원문\*\*: .*$/- **승인 원문**: "다른 문장"/' "$FX/decisions_golden.md" > "$TMP/dec_m4.md"; expect_fail_exact "D-4 승인 원문 ≠ state" "D-4" "$TMP/cd_m4.md" $CD --decisions "$TMP/dec_m4.md" --raw "$R" --state "$S" --out "$TMP/cd_m4.md"
expect_rc "--state 가 없는 경로 → 종료 2" 2 $CD --decisions "$FX/decisions_golden.md" --raw "$R" --state "$TMP/nope.json"

echo "## 6. check-html"
CH="node scripts/check-html.js"
expect_pass "골든(html_good/, WARN 허용)" "$TMP/ch_good.md" $CH --drafts "$FX/html_good/drafts" --brief "$FX/html_good/brief.md" --stimuli "$FX/html_good/stimuli" --out "$TMP/ch_good.md"
expect_fail_subset "결함(html_bad/ + 빈 brief)" "H-6 H-8 H-11 H-12 H-13 H-15 H-16 H-17" "$TMP/ch_bad.md" $CH --drafts "$FX/html_bad/drafts" --brief "$FX/brief_empty.md" --out "$TMP/ch_bad.md"
expect_rc "없는 drafts 경로 → 종료 2" 2 $CH --drafts "$TMP/nope"

echo "## 6b. check-html H-18 변이 — data-next 삭제"
rm -rf "$TMP/html_m18"; cp -R "$FX/html_good" "$TMP/html_m18"; sed -i '' 's/ data-next="02"//' "$TMP/html_m18/drafts/screen_01_home.html"
expect_fail_exact "H-18 이동 요소(data-next) 삭제" "H-18" "$TMP/ch_m18.md" $CH --drafts "$TMP/html_m18/drafts" --brief "$TMP/html_m18/brief.md" --stimuli "$TMP/html_m18/stimuli" --out "$TMP/ch_m18.md"

rm -rf "$TMP/html_m11"; cp -R "$FX/html_good" "$TMP/html_m11"; rm "$TMP/html_m11/drafts/screen_02_confirm.html"
expect_fail_subset "H-11 §2 화면 파일 삭제" "H-11" "$TMP/ch_m11.md" $CH --drafts "$TMP/html_m11/drafts" --brief "$TMP/html_m11/brief.md" --stimuli "$TMP/html_m11/stimuli" --out "$TMP/ch_m11.md"
rm -rf "$TMP/html_m12"; cp -R "$FX/html_good" "$TMP/html_m12"; sed -i '' -E 's/^\| 초대 보내기·공유 \| S-1 \| 2 \|/| 초대 보내기·공유 | S-1 | 9 |/' "$TMP/html_m12/brief.md"
expect_fail_exact "H-12 §2c 담당 화면 # 파일 없음" "H-12" "$TMP/ch_m12.md" $CH --drafts "$TMP/html_m12/drafts" --brief "$TMP/html_m12/brief.md" --stimuli "$TMP/html_m12/stimuli" --out "$TMP/ch_m12.md"

rm -rf "$TMP/html_m15"; cp -R "$FX/html_good" "$TMP/html_m15"; sed -i '' 's/ data-role="top-info"//' "$TMP/html_m15/drafts/screen_01_home.html"
expect_fail_exact "H-15 top-info 삭제" "H-15" "$TMP/ch_m15.md" $CH --drafts "$TMP/html_m15/drafts" --brief "$TMP/html_m15/brief.md" --stimuli "$TMP/html_m15/stimuli" --out "$TMP/ch_m15.md"

echo "## 6c. check-tokens (1단계 K-1~K-12)"
TG="$FX/tokens_good"; CT="node scripts/check-tokens.js"; CTARGS=(--tokens "$TG/tokens.json" --state "$S" --design "$TG/design.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TG/interview_raw.md" --rules-out "$TMP/tg_rules.json")
expect_pass "골든(tokens_good/)" "$TMP/ct_good.md" $CT "${CTARGS[@]}" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/ct_good.md"
sed -E 's#<section data-set="SET-C">.*</section></main>#</main>#' "$TG/stimuli/design_guide_compare.html" > "$TMP/cmp_m6.html"; expect_fail_exact "K-6 세트 수 부족" "K-6" "$TMP/ct_m6.md" $CT "${CTARGS[@]}" --compare "$TMP/cmp_m6.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/ct_m6.md"
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));d.sets[1].tokens=JSON.parse(JSON.stringify(d.sets[0].tokens));d.sets[1].tokens.spacing.unit=4;fs.writeFileSync(process.argv[2],JSON.stringify(d));' "$TG/stimuli/token_sets.json" "$TMP/sets_m9.json"; expect_fail_exact "K-9 세트 쌍 1키만 다름" "K-9" "$TMP/ct_m9.md" $CT "${CTARGS[@]}" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TMP/sets_m9.json" --out "$TMP/ct_m9.md"
awk -F'|' 'BEGIN{OFS="|"} /^\| 1 \| 홈/ && $4!="" {$4=" "} {print}' "$TG/design.md" > "$TMP/design_m11.md"; expect_fail_exact "K-11 §5 1등 정보 셀 공백" "K-11" "$TMP/ct_m11.md" $CT --tokens "$TG/tokens.json" --state "$S" --design "$TMP/design_m11.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TG/interview_raw.md" --rules-out "$TMP/tg_rules.json" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/ct_m11.md"
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));d.sets[0].tokens.color.primitive.neutral["900"]="#000000";fs.writeFileSync(process.argv[2],JSON.stringify(d));' "$TG/stimuli/token_sets.json" "$TMP/sets_m1.json"; expect_fail_exact "K-3b M-1 순검정 neutral.900" "K-3b" "$TMP/ct_m3b1.md" $CT "${CTARGS[@]}" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TMP/sets_m1.json" --out "$TMP/ct_m3b1.md"
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));d.sets[0].tokens.elevation.scale.sm.blur=30;fs.writeFileSync(process.argv[2],JSON.stringify(d));' "$TG/stimuli/token_sets.json" "$TMP/sets_m3.json"; expect_fail_exact "K-3b M-3 그림자 단조 위반" "K-3b" "$TMP/ct_m3b3.md" $CT "${CTARGS[@]}" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TMP/sets_m3.json" --out "$TMP/ct_m3b3.md"
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));d.sets[2].tokens.color.primitive.neutral["900"]="#000000";fs.writeFileSync(process.argv[2],JSON.stringify(d));' "$TG/stimuli/token_sets.json" "$TMP/sets_m3c.json"; expect_fail_exact "K-3b 선택 안 된 세트(SET-C)의 M-1 위반도 잡음" "K-3b" "$TMP/ct_m3bc.md" $CT "${CTARGS[@]}" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TMP/sets_m3c.json" --out "$TMP/ct_m3bc.md"
sed -E 's/^T-01 SET-A \| 이유: .*$/T-01 SET-A | 이유: /' "$TG/interview_raw.md" > "$TMP/raw_m10.md"; expect_fail_exact "K-10 T-01 이유 공백" "K-10" "$TMP/ct_m10.md" $CT --tokens "$TG/tokens.json" --state "$S" --design "$TG/design.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TMP/raw_m10.md" --rules-out "$TMP/tg_rules.json" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/ct_m10.md"

echo "## 7. check-figma (F-10 이 check-c-report 를 실제로 부른다)"
mkdir -p "$TMP/shots"; for p in 01_normal 01_empty 01_long 02_normal 02_empty 02_long 02_error; do : > "$TMP/shots/$p.png"; done
expect_pass "골든(figma_good/)" "$TMP/cf_good.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --c-report "$FG/verify/c_report.json" --shots-index "$FG/verify/shots/index.md" --out "$TMP/cf_good.md"
expect_rc "state.json 없음 → 종료 2" 2 node scripts/check-figma.js --state "$TMP/nope.json" --out "$TMP/cf_none.md"
# F-11: c_report 에 fail 1건(local) 을 심고 처리 원장이 없으면 F-11 만 FAIL, 원장(수정+커밋 해시)이 있으면 PASS (F-0 이 c_report 와 같은 폴더의 a_report·c_report.md 를 보므로 verify/ 를 통째로 복사)
rm -rf "$TMP/verify_f11"; cp -R "$FG/verify" "$TMP/verify_f11"
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const c=d.screens[0].checks.find(c=>c.id==="C-2");c.verdict="fail";c.diagnosis="local";c.elements=["Action/Primary"];c.evidence="CTA 가 프레임 아래로 35px 잘려 24px 만 보임";fs.writeFileSync(process.argv[2],JSON.stringify(d,null,1));' "$FG/verify/c_report.json" "$TMP/verify_f11/c_report.json"
CFARGS=(--figma "$FG/figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md")
expect_fail_exact "F-11 C fail 1건, 처리 원장 없음" "F-11" "$TMP/cf_f11a.md" node scripts/check-figma.js "${CFARGS[@]}" --c-report "$TMP/verify_f11/c_report.json" --c-routing "$TMP/nope_routing.md" --out "$TMP/cf_f11a.md"
printf '| 화면 | C-id | 분류 | 처리 | 근거 |\n|---|---|---|---|---|\n| 01_home | C-2 | local | 수정 | CTA 프레임 바닥 고정, 재캡처 01_normal_r2.png, 커밋 60b4c4f |\n' > "$TMP/c_routing_ok.md"
# D-41: 정본 스키마가 아닌 c_report(최상위 fails[]) 는 F-11 이 조용히 PASS 하면 안 된다 — F-10(check-c-report CR-1·CR-4)·F-11 둘 다 FAIL
rm -rf "$TMP/verify_f11c"; cp -R "$FG/verify" "$TMP/verify_f11c"; printf '{"stage":"C","fails":[{"id":"F-1","check":"C-6","diagnosis":"local","screen":"03_answering.png"}],"routing":"local"}' > "$TMP/verify_f11c/c_report.json"
expect_fail_exact "F-11 구 스키마(fails[]) c_report → 조용한 PASS 금지" "F-10 F-11" "$TMP/cf_f11c.md" node scripts/check-figma.js "${CFARGS[@]}" --c-report "$TMP/verify_f11c/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/cf_f11c.md"
# F-12: final_review 에서 '대신 정한 것' 절 삭제 → F-12 만 FAIL
mkdir -p "$TMP/m12"; awk '/^## 대신 정한 것/{exit} {print}' "$FG/verify/final_review.md" > "$TMP/m12/final_review.md"
expect_fail_exact "F-12 대신 정한 것 절 삭제" "F-12" "$TMP/cf_m12.md" node scripts/check-figma.js "${CFARGS[@]}" --review "$TMP/m12/final_review.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/cf_m12.md"
rm -rf "$TMP/drafts_m9e"; cp -R "$FG/drafts" "$TMP/drafts_m9e"; printf '\n<!-- 승인 뒤 수정 -->\n' >> "$TMP/drafts_m9e/screen_01_home.html"
expect_fail_exact "F-9e 승인 뒤 초안 변경(draft_hash 불일치)" "F-9e" "$TMP/cf_m9e.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$TMP/drafts_m9e" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/cf_m9e.md"
# F-9a: 초안의 long 상태 섹션 삭제 → 상태 수 ≠ 프레임 수 (초안이 바뀌므로 F-9e 도 함께 FAIL — subset)
rm -rf "$TMP/drafts_m9a"; cp -R "$FG/drafts" "$TMP/drafts_m9a"; node -e 'const fs=require("fs");const p=process.argv[1];let s=fs.readFileSync(p,"utf8");s=s.replace(/<section[^>]*data-state="long"[\s\S]*?<\/section>/,"");fs.writeFileSync(p,s);' "$TMP/drafts_m9a/screen_01_home.html"
expect_fail_subset "F-9a 초안 상태 수 ≠ 프레임 수" "F-9a" "$TMP/cf_m9a.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$TMP/drafts_m9a" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/cf_m9a.md"
# F-9c: figma_nodes.variables 키 하나 삭제 → tokens leaf 수 ≠ variables 수
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const k=Object.keys(d.variables)[0];delete d.variables[k];fs.writeFileSync(process.argv[2],JSON.stringify(d));' "$FG/figma_nodes.json" "$TMP/nodes_m9c.json"
expect_fail_exact "F-9c 변수 1개 누락" "F-9c" "$TMP/cf_m9c.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$TMP/nodes_m9c.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/cf_m9c.md"
# F-4: audit 에 blocker 주입 → passed_machine false
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));d.passed_machine=false;d.summary=d.summary||{};d.summary.blocker=(d.summary.blocker||0)+1;d.violations=(d.violations||[]).concat([{rule:"frame-spec",node:"01 / width",severity:"blocker",expected:390,actual:375}]);fs.writeFileSync(process.argv[2],JSON.stringify(d));' "$FG/verify/audit_screens.json" "$TMP/audit_m4.json"
expect_fail_exact "F-4 A검사 blocker 1" "F-4" "$TMP/cf_m4.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$TMP/audit_m4.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/cf_m4.md"
expect_pass "F-11 처리 원장 있음(수정+커밋)" "$TMP/cf_f11b.md" node scripts/check-figma.js "${CFARGS[@]}" --c-report "$TMP/verify_f11/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/cf_f11b.md"

echo "## 8. audit-core 규칙 검출력 (fixtures/audit/cases.json)"
if node scripts/fixtures/run-audit-cases.js > "$TMP/audit_cases.log" 2>&1; then ok "audit-core 케이스 $(tail -1 "$TMP/audit_cases.log")"; else ng "audit-core 케이스 — $(grep NG "$TMP/audit_cases.log" | head -3 | tr '\n' ' ')"; fi

echo "## 9. 결함 변이 보강 — 보조 검사 61건 (scripts/fixtures/mut.js)"
M="node scripts/fixtures/mut.js"; mkdir -p "$TMP/m9"
$M "$FX/prd_analysis_golden.md" "$TMP/m9/z1.md" delete-lines "^## 4\. "
expect_fail_exact "Z-1 §4 제목 삭제" "Z-1" "$TMP/m9/z1.md" $CPA --prd "$TMP/m9/z1.md" --state "$S" --out "$TMP/m9/z1.md"
$M "$FX/prd_analysis_golden.md" "$TMP/m9/z2.md" replace "\| 앱 실행 직후 \| 오늘 남은 복약 건수 \| F5 \|" "| 앱 실행 직후 | 오늘 남은 복약 건수 |  |"
expect_fail_exact "Z-2 화면표 매핑 공백" "Z-2" "$TMP/m9/z2.md" $CPA --prd "$TMP/m9/z2.md" --state "$S" --out "$TMP/m9/z2.md"
$M "$FX/prd_analysis_golden.md" "$TMP/m9/z3.md" replace '`\[HYPOTHESIS\]` 인터뷰 Q5로 검증' '인터뷰 Q5로 검증'
expect_fail_exact "Z-3 1순위 [HYPOTHESIS] 삭제" "Z-3" "$TMP/m9/z3.md" $CPA --prd "$TMP/m9/z3.md" --state "$S" --out "$TMP/m9/z3.md"
$M "$FX/prd_analysis_golden.md" "$TMP/m9/z4.md" delete-lines "^\| R-[12] "
expect_fail_exact "Z-4 역할별 진입표 행 삭제" "Z-4" "$TMP/m9/z4.md" $CPA --prd "$TMP/m9/z4.md" --state "$S" --out "$TMP/m9/z4.md"
$M "$FX/prd_analysis_golden.md" "$TMP/m9/z7.md" delete-lines "^\| T-3 "
expect_fail_exact "Z-7 핵심 과업 2행" "Z-7" "$TMP/m9/z7.md" $CPA --prd "$TMP/m9/z7.md" --state "$S" --out "$TMP/m9/z7.md"
$M "$FX/prd_analysis_golden.md" "$TMP/m9/z8.md" append "- 메모 {i}" 200
expect_fail_exact "Z-8 줄 수 상한 초과" "Z-8" "$TMP/m9/z8.md" $CPA --prd "$TMP/m9/z8.md" --state "$S" --out "$TMP/m9/z8.md"
$M "$FX/interview_golden.html" "$TMP/m9/p1.html" replace "<title>디자인 인터뷰</title>" "<title>x</title>"
expect_fail_exact "P-1 골격 변조" "P-1" "$TMP/m9/p1.md" $CIP --page "$TMP/m9/p1.html" "${CIPARGS[@]}" --out "$TMP/m9/p1.md"
mutpage "$TMP/m9/q-order.html" q-order; expect_fail_exact "P-2 Q1 이 첫 질문이 아님" "P-2" "$TMP/m9/q-order.md" $CIP --page "$TMP/m9/q-order.html" "${CIPARGS[@]}" --out "$TMP/m9/q-order.md"
mutpage "$TMP/m9/axis-same.html" axis-same; expect_fail_exact "P-5 같은 축 두 타일이 같음" "P-5" "$TMP/m9/axis-same.md" $CIP --page "$TMP/m9/axis-same.html" "${CIPARGS[@]}" --out "$TMP/m9/axis-same.md"
mutpage "$TMP/m9/placeholder.html" placeholder; expect_fail_exact "P-8 타일 자리표시자" "P-8" "$TMP/m9/placeholder.md" $CIP --page "$TMP/m9/placeholder.html" "${CIPARGS[@]}" --out "$TMP/m9/placeholder.md"
mutpage "$TMP/m9/payload-bad.html" payload-bad; expect_fail_subset "P-10 payload ∉ §6" "P-10" "$TMP/m9/payload-bad.md" $CIP --page "$TMP/m9/payload-bad.html" "${CIPARGS[@]}" --out "$TMP/m9/payload-bad.md"
mutpage "$TMP/m9/skeleton-bad.html" skeleton-bad; expect_fail_exact "P-13 skeleton ∉ §6 세트" "P-13" "$TMP/m9/skeleton-bad.md" $CIP --page "$TMP/m9/skeleton-bad.html" "${CIPARGS[@]}" --out "$TMP/m9/skeleton-bad.md"
mutpage "$TMP/m9/size.html" size; expect_fail_exact "P-14 파일 크기 초과" "P-14" "$TMP/m9/size.md" $CIP --page "$TMP/m9/size.html" "${CIPARGS[@]}" --out "$TMP/m9/size.md"
$M "$FX/references_golden.md" "$TMP/refs/r1.md" delete-lines "^\| REF-[345] "; expect_fail_subset "R-1 REF 행 수 미달" "R-1" "$TMP/m9/r1.md" $CRF --refs "$TMP/refs/r1.md" --state "$S" --out "$TMP/m9/r1.md"
$M "$FX/references_golden.md" "$TMP/refs/r2.md" replace "https://example.com/a" ""; expect_fail_exact "R-2 출처 공백" "R-2" "$TMP/m9/r2.md" $CRF --refs "$TMP/refs/r2.md" --state "$S" --out "$TMP/m9/r2.md"
$M "$FX/references_golden.md" "$TMP/refs/r6.md" replace "빈 상태에 '첫 반려동물 등록' 하나만" "미니멀한 여백"; expect_fail_exact "R-6 처리 방식 금지어" "R-6" "$TMP/m9/r6.md" $CRF --refs "$TMP/refs/r6.md" --state "$S" --out "$TMP/m9/r6.md"
$M "$G" "$TMP/m9/b1.md" append "- 메모 {i}" 400
expect_fail_exact "B-1 브리프 줄 수 초과" "B-1" "$TMP/m9/b-1b.md" $CB --brief "$TMP/m9/b1.md" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-1b.md"
$M "$G" "$TMP/m9/b2.md" delete-lines "^3\. \"시간이 지나면"
expect_fail_subset "B-2 문제 진술 2개" "B-2" "$TMP/m9/b-2b.md" $CB --brief "$TMP/m9/b2.md" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-2b.md"
$M "$G" "$TMP/m9/b7.md" replace "- borrow_scope: element" "- borrow_scope: "
expect_fail_subset "B-7 RULE 필드 공백" "B-7" "$TMP/m9/b-7b.md" $CB --brief "$TMP/m9/b7.md" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-7b.md"
$M "$G" "$TMP/m9/b8.md" replace "- verdict_method: A" "- verdict_method: X"
expect_fail_exact "B-8 verdict_method ∉ A|C" "B-8" "$TMP/m9/b-8b.md" $CB --brief "$TMP/m9/b8.md" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-8b.md"
$M "$G" "$TMP/m9/b9.md" replace "source_quote: \"아침에 먹였는지 기억이 안 나서 한 번 더 먹일 뻔했어요\"" "source_quote: \"raw 에 없는 문장\""
expect_fail_subset "B-9 source_quote 가 raw 에 없음" "B-9" "$TMP/m9/b-9b.md" $CB --brief "$TMP/m9/b9.md" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-9b.md"
$M "$G" "$TMP/m9/b10.md" insert-after "^\| A-05 \|" "| A-9{i} | 가정 {i} | 근거 | 영향 |" 12
expect_fail_exact "B-10 가정 로그 17개" "B-10" "$TMP/m9/b-10b.md" $CB --brief "$TMP/m9/b10.md" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-10b.md"
$M "$G" "$TMP/m9/b11.md" delete-lines "^\| 웜 중립 표면 \|"
expect_fail_exact "B-11 토큰 자리 2개" "B-11" "$TMP/m9/b-11b.md" $CB --brief "$TMP/m9/b11.md" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-11b.md"
$M "$G" "$TMP/m9/b13.md" insert-after "^- 범용 템플릿처럼" "- 추가 단서 {i}: 값" 5
expect_fail_exact "B-13 적합성 단서 10줄" "B-13" "$TMP/m9/b-13b.md" $CB --brief "$TMP/m9/b13.md" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-13b.md"
$M "$R" "$TMP/m9/b15.md" insert-after "^Q-12:" "Q-1{i}9: 추가 질문 {i}" 4
expect_fail_subset "B-15 답변 수 < 질문 수" "B-15" "$TMP/m9/b-15b.md" $CB --brief "$G" --raw "$TMP/m9/b15.md" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-15b.md"
$M "$R" "$TMP/m9/b20r.md" delete-lines "^(R-G-|W-)"; $M "$S" "$TMP/m9/b20s.json" json-set human_gates.delegations "[]"
expect_fail_subset "B-20 반응 0건 + 위임 없음" "B-20" "$TMP/m9/b-20b.md" $CB --brief "$G" --raw "$TMP/m9/b20r.md" --state "$TMP/m9/b20s.json" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-20b.md"
node -e 'const fs=require("fs");let t=fs.readFileSync(process.argv[1],"utf8");const a=t.indexOf("### RULE-05");const b=t.indexOf("## 5. ");t=t.slice(0,a)+t.slice(b);fs.writeFileSync(process.argv[2],t);' "$G" "$TMP/m9/b6.md"
expect_fail_subset "B-6 규칙 수 하한 미달" "B-6" "$TMP/m9/b-6b.md" $CB --brief "$TMP/m9/b6.md" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --audit "$AUD" --out "$TMP/m9/b-6b.md"
$M "$TG/tokens.json" "$TMP/m9/k1.json" json-set color.rationale '""'
expect_fail_exact "K-1 rationale 공백" "K-1" "$TMP/m9/k-1k.md" $CT --tokens "$TMP/m9/k1.json" --state "$S" --design "$TG/design.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TG/interview_raw.md" --rules-out "$TMP/tg_rules.json" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/m9/k-1k.md"
$M "$TG/tokens.json" "$TMP/m9/k2.json" json-set color.semantic.대기 '"#AABBCC"'
expect_fail_subset "K-2 build-rules 거부(한글 키)" "K-2" "$TMP/m9/k-2k.md" $CT --tokens "$TMP/m9/k2.json" --state "$S" --design "$TG/design.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TG/interview_raw.md" --rules-out "$TMP/tg_rules.json" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/m9/k-2k.md"
$M "$TG/verify/wcag_tokens.md" "$TMP/m9/k3.md" replace "\| SET-A \| M-1 \| PASS \|" "| SET-A | M-1 | FAIL |"
expect_fail_exact "K-3 wcag 표 FAIL 행" "K-3" "$TMP/m9/k-3k.md" $CT --tokens "$TG/tokens.json" --state "$S" --design "$TG/design.md" --brief "$FX/brief_golden.md" --wcag "$TMP/m9/k3.md" --raw "$TG/interview_raw.md" --rules-out "$TMP/tg_rules.json" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/m9/k-3k.md"
$M "$TG/design.md" "$TMP/m9/k4.md" delete-lines "^## 13\. "
expect_fail_exact "K-4 design.md §13 없음" "K-4" "$TMP/m9/k-4k.md" $CT --tokens "$TG/tokens.json" --state "$S" --design "$TMP/m9/k4.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TG/interview_raw.md" --rules-out "$TMP/tg_rules.json" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/m9/k-4k.md"
$M "$TG/design.md" "$TMP/m9/k5.md" append "- 강조색 #FF0000"
expect_fail_exact "K-5 design.md hex 직접 표기" "K-5" "$TMP/m9/k-5k.md" $CT --tokens "$TG/tokens.json" --state "$S" --design "$TMP/m9/k5.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TG/interview_raw.md" --rules-out "$TMP/tg_rules.json" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/m9/k-5k.md"
$M "$TG/stimuli/design_guide_compare.html" "$TMP/m9/k7.html" replace "<p class=\"set-desc\">따뜻하고 말 걸듯</p>" "<p>따뜻하고 말 걸듯</p>"
expect_fail_exact "K-7 set-desc 누락" "K-7" "$TMP/m9/k-7k.md" $CT --tokens "$TG/tokens.json" --state "$S" --design "$TG/design.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TG/interview_raw.md" --rules-out "$TMP/tg_rules.json" --compare "$TMP/m9/k7.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/m9/k-7k.md"
$M "$TG/stimuli/design_guide_compare.html" "$TMP/m9/k8a.html" replace "깔끔하고 빠릿" "미니멀한 여백"
expect_fail_exact "K-8a 비교 페이지 금지어" "K-8a" "$TMP/m9/k-8ak.md" $CT --tokens "$TG/tokens.json" --state "$S" --design "$TG/design.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TG/interview_raw.md" --rules-out "$TMP/tg_rules.json" --compare "$TMP/m9/k8a.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/m9/k-8ak.md"
$M "$TG/interview_raw.md" "$TMP/m9/k8b.md" replace "고지: 저희 추천도 SET-A 였습니다." "고지: 레이아웃이 미니멀합니다."
expect_fail_exact "K-8b 1단계 고지 문장 금지어" "K-8b" "$TMP/m9/k-8bk.md" $CT --tokens "$TG/tokens.json" --state "$S" --design "$TG/design.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TMP/m9/k8b.md" --rules-out "$TMP/tg_rules.json" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/m9/k-8bk.md"
$M "$S" "$TMP/m9/k12.json" json-set human_gates.token_set_choice.chosen '"X"'
expect_fail_subset "K-12 chosen 형식 위반" "K-12" "$TMP/m9/k-12k.md" $CT --tokens "$TG/tokens.json" --state "$TMP/m9/k12.json" --design "$TG/design.md" --brief "$FX/brief_golden.md" --wcag "$TG/verify/wcag_tokens.md" --raw "$TG/interview_raw.md" --rules-out "$TMP/tg_rules.json" --compare "$TG/stimuli/design_guide_compare.html" --sets "$TG/stimuli/token_sets.json" --out "$TMP/m9/k-12k.md"
rm -rf "$TMP/m9/h1"; cp -R "$FX/html_good" "$TMP/m9/h1"
$M "$TMP/m9/h1/drafts/screen_01_home.html" "$TMP/m9/h1/drafts/screen_01_home.html" replace "var\(--color-semantic-text-primary\)" "var(--color-nope)"
expect_fail_exact "H-1 미선언 CSS 변수" "H-1" "$TMP/m9/h1.md" $CH --drafts "$TMP/m9/h1/drafts" --brief "$TMP/m9/h1/brief.md" --stimuli "$TMP/m9/h1/stimuli" --out "$TMP/m9/h1.md"
rm -rf "$TMP/m9/h2"; cp -R "$FX/html_good" "$TMP/m9/h2"
$M "$TMP/m9/h2/drafts/screen_01_home.html" "$TMP/m9/h2/drafts/screen_01_home.html" replace "word-break:keep-all;" ""
expect_fail_exact "H-2 keep-all 없음" "H-2" "$TMP/m9/h2.md" $CH --drafts "$TMP/m9/h2/drafts" --brief "$TMP/m9/h2/brief.md" --stimuli "$TMP/m9/h2/stimuli" --out "$TMP/m9/h2.md"
rm -rf "$TMP/m9/h3"; cp -R "$FX/html_good" "$TMP/m9/h3"
$M "$TMP/m9/h3/drafts/screen_01_home.html" "$TMP/m9/h3/drafts/screen_01_home.html" replace "overflow-wrap:break-word" "overflow-wrap:anywhere"
expect_fail_exact "H-3 overflow-wrap:anywhere" "H-3" "$TMP/m9/h3.md" $CH --drafts "$TMP/m9/h3/drafts" --brief "$TMP/m9/h3/brief.md" --stimuli "$TMP/m9/h3/stimuli" --out "$TMP/m9/h3.md"
rm -rf "$TMP/m9/h4"; cp -R "$FX/html_good" "$TMP/m9/h4"
$M "$TMP/m9/h4/drafts/screen_01_home.html" "$TMP/m9/h4/drafts/screen_01_home.html" replace "</style>" ".x{margin:13px;color:#123456}</style>"
expect_fail_exact "H-4 hex·px 리터럴" "H-4" "$TMP/m9/h4.md" $CH --drafts "$TMP/m9/h4/drafts" --brief "$TMP/m9/h4/brief.md" --stimuli "$TMP/m9/h4/stimuli" --out "$TMP/m9/h4.md"
rm -rf "$TMP/m9/h5"; cp -R "$FX/html_good" "$TMP/m9/h5"
$M "$TMP/m9/h5/drafts/screen_01_home.html" "$TMP/m9/h5/drafts/screen_01_home.html" replace "data-frame=\"390x844\"" "data-frame=\"375x844\""
expect_fail_subset "H-5 프레임 폭 불일치" "H-5" "$TMP/m9/h5.md" $CH --drafts "$TMP/m9/h5/drafts" --brief "$TMP/m9/h5/brief.md" --stimuli "$TMP/m9/h5/stimuli" --out "$TMP/m9/h5.md"
rm -rf "$TMP/m9/h9"; cp -R "$FX/html_good" "$TMP/m9/h9"
$M "$TMP/m9/h9/drafts/screen_01_home.html" "$TMP/m9/h9/drafts/screen_01_home.html" replace "data-fixed=\"bottom\" " ""
expect_fail_subset "H-9 주 행동이 고정 바 밖" "H-9" "$TMP/m9/h9.md" $CH --drafts "$TMP/m9/h9/drafts" --brief "$TMP/m9/h9/brief.md" --stimuli "$TMP/m9/h9/stimuli" --out "$TMP/m9/h9.md"
rm -rf "$TMP/m9/h10"; cp -R "$FX/html_good" "$TMP/m9/h10"
$M "$TMP/m9/h10/drafts/screen_01_home.html" "$TMP/m9/h10/drafts/screen_01_home.html" replace ".list{overflow-y:auto}" ".list{overflow:hidden;height:200px}"
expect_fail_subset "H-10 스크롤 영역 절단" "H-10" "$TMP/m9/h10.md" $CH --drafts "$TMP/m9/h10/drafts" --brief "$TMP/m9/h10/brief.md" --stimuli "$TMP/m9/h10/stimuli" --out "$TMP/m9/h10.md"
rm -rf "$TMP/m9/h14"; cp -R "$FX/html_good" "$TMP/m9/h14"
$M "$TMP/m9/h14/drafts/index.html" "$TMP/m9/h14/drafts/index.html" replace "</body>" "<a href=\"screen_99_x.html\">x</a></body>"
expect_fail_exact "H-14 index 링크 ≠ 파일 집합" "H-14" "$TMP/m9/h14.md" $CH --drafts "$TMP/m9/h14/drafts" --brief "$TMP/m9/h14/brief.md" --stimuli "$TMP/m9/h14/stimuli" --out "$TMP/m9/h14.md"
$M "$FX/decisions_golden.md" "$TMP/m9/d5.md" replace-all "진입 방식" "레이아웃 방식"; expect_fail_exact "D-5 노출 문구 금지어" "D-5" "$TMP/m9/d5r.md" $CD --decisions "$TMP/m9/d5.md" --raw "$R" --state "$S" --out "$TMP/m9/d5r.md"
$M "$FG/verify/c_report.json" "$TMP/m9/cr1.json" json-del screens[1]
expect_fail_subset "CR-1 화면 수 < brief §2" "CR-1" "$TMP/m9/cr-1c.md" $CCR --report "$TMP/m9/cr1.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --detector "$FG/verify/c_detector_test.md"  --out "$TMP/m9/cr-1c.md"
$M "$FG/verify/c_report.json" "$TMP/m9/cr2.json" json-set screens[0].screenshots 5
expect_fail_exact "CR-2 screenshots ≠ 상태 수" "CR-2" "$TMP/m9/cr-2c.md" $CCR --report "$TMP/m9/cr2.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --detector "$FG/verify/c_detector_test.md"  --out "$TMP/m9/cr-2c.md"
$M "$FG/verify/c_report.json" "$TMP/m9/cr4.json" json-set screens[0].checks[0].verdict '"maybe"'
expect_fail_exact "CR-4 verdict 중간값" "CR-4" "$TMP/m9/cr-4c.md" $CCR --report "$TMP/m9/cr4.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --detector "$FG/verify/c_detector_test.md"  --out "$TMP/m9/cr-4c.md"
$M "$FG/verify/c_report.json" "$TMP/m9/cr7.json" json-set screens[0].tasks[1].result '"불가"'
expect_fail_subset "CR-7 과업 불가" "CR-7" "$TMP/m9/cr-7c.md" $CCR --report "$TMP/m9/cr7.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --detector "$FG/verify/c_detector_test.md"  --out "$TMP/m9/cr-7c.md"
$M "$FG/verify/c_report.json" "$TMP/m9/cr9.json" json-set screens[0].checks[0] '{"id":"C-2","verdict":"fail","diagnosis":"repeat","repeat":true,"elements":["title"],"evidence":"두 번째 같은 사유"}'
expect_fail_subset "CR-9 repeat 인데 c_fail_reasons 에 없음" "CR-9" "$TMP/m9/cr-9c.md" $CCR --report "$TMP/m9/cr9.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --detector "$FG/verify/c_detector_test.md"  --out "$TMP/m9/cr-9c.md"
$M "$FG/verify/c_report.json" "$TMP/m9/cr10.json" json-del screens[0].checks[2]
expect_fail_exact "CR-10 SLOP-SWEEP 없음" "CR-10" "$TMP/m9/cr-10c.md" $CCR --report "$TMP/m9/cr10.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --detector "$FG/verify/c_detector_test.md"  --out "$TMP/m9/cr-10c.md"
expect_fail_subset "F-0 figma.md 없음" "F-0" "$TMP/m9/f-0f.md" node scripts/check-figma.js --figma "$TMP/m9/nope_figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/m9/f-0f.md"
$M "$FG/figma.md" "$TMP/m9/f1.md" replace "PetMeds01" "Other01"
expect_fail_exact "F-1 Figma 링크 ≠ state.figma_url" "F-1" "$TMP/m9/f-1f.md" node scripts/check-figma.js --figma "$TMP/m9/f1.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/m9/f-1f.md"
$M "$FG/figma_nodes.json" "$TMP/m9/f2.json" json-del screens[0].frames[2]
expect_fail_subset "F-2 프레임 수 ≠ 화면×상태" "F-2" "$TMP/m9/f-2f.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$TMP/m9/f2.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/m9/f-2f.md"
rm -rf "$TMP/m9/shots3"; cp -R "$TMP/shots" "$TMP/m9/shots3"; rm "$TMP/m9/shots3/01_long.png"
expect_fail_subset "F-3 PNG 수 부족" "F-3" "$TMP/m9/f-3f.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/m9/shots3" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/m9/f-3f.md"
mkdir -p "$TMP/m9/f5"; $M "$FG/verify/final_review.md" "$TMP/m9/f5/final_review.md" delete-lines "^\| contrast-text-aa \|"
expect_fail_exact "F-5 requires_human_review 규칙 행 없음" "F-5" "$TMP/m9/f-5f.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$TMP/m9/f5/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/m9/f-5f.md"
mkdir -p "$TMP/m9/f6"; $M "$FG/verify/final_review.md" "$TMP/m9/f6/final_review.md" replace "\| 01_normal.png \| 10:1 \| 아이콘·상태칩·규격 390 \| PASS \|" "| 01_normal.png | 10:1 | 확인 | PASS |"
expect_fail_exact "F-6 '본 것' 한 단어" "F-6" "$TMP/m9/f-6f.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$TMP/m9/f6/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/m9/f-6f.md"
$M "$S" "$TMP/m9/f7.json" json-set human_gates.final_ack.approved false
expect_fail_subset "F-7 final_ack 미승인" "F-7" "$TMP/m9/f-7f.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$TMP/m9/f7.json" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$FG/drafts" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/m9/f-7f.md"
rm -rf "$TMP/m9/d9b"; cp -R "$FG/drafts" "$TMP/m9/d9b"; $M "$TMP/m9/d9b/screen_01_home.html" "$TMP/m9/d9b/screen_01_home.html" replace '(<h1 data-role="top-info">[^<]*</h1>)' '$1<button data-role="primary-action">둘째</button>'
expect_fail_subset "F-9b 주 행동 수 불일치" "F-9b" "$TMP/m9/f-9bf.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$TMP/m9/d9b" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/m9/f-9bf.md"
rm -rf "$TMP/m9/d9d"; cp -R "$FG/drafts" "$TMP/m9/d9d"; $M "$TMP/m9/d9d/screen_02_confirm.html" "$TMP/m9/d9d/screen_02_confirm.html" append "<p>없는 문장 {i}</p>" 6
expect_fail_subset "F-9d 텍스트 일치율 < 90%" "F-9d" "$TMP/m9/f-9df.md" node scripts/check-figma.js --figma "$FG/figma.md" --state "$S" --nodes "$FG/figma_nodes.json" --brief "$FG/brief.md" --drafts "$TMP/m9/d9d" --audit "$FG/verify/audit_screens.json,$FG/verify/audit_components.json" --shots "$TMP/shots" --review "$FG/verify/final_review.md" --tokens "$FG/tokens.json" --shots-index "$FG/verify/shots/index.md" --c-report "$FG/verify/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/m9/f-9df.md"

echo
echo "selftest 결과: 기대 일치 $PASS_N / 불일치 $FAIL_N"
[ "$ENV_DIRTY" = 1 ] && echo "(templates/ 미커밋 — T-0·P-0·F-8 은 환경 행. 커밋 후 다시 돌리면 종료 코드 0 까지 확인된다)"
[ "$FAIL_N" -eq 0 ] || exit 1
exit 0
