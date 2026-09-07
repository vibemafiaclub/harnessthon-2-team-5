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
expect_pass "골든(brief_golden.md, full)" "$TMP/cb_golden.md" $CB --brief "$G" --raw "$R" --state "$S" --refs "$REFS" --page-report "$PR" --out "$TMP/cb_golden.md"
expect_rc "--state 가 없는 경로 → 종료 2" 2 $CB --brief "$G" --raw "$R" --state "$TMP/nope.json"
# 변이: 골든에서 결함 하나씩 심는다 → 심은 항목만 FAIL
mut() { local name="$1" want="$2" brief="$3" raw="$4" state="$5" pr="$6"; expect_fail_exact "변이 $name" "$want" "$TMP/cb_$name.md" $CB --brief "$brief" --raw "$raw" --state "$state" --refs "$REFS" --page-report "$pr" --out "$TMP/cb_$name.md"; }
sed -E 's/^\| 4 \| 돌봄 공유 링크 \| R-1 \| 약 등록 완료 직후 \| 공유 링크 \|/| 4 | 돌봄 공유 링크 | R-1 | 약 등록 완료 직후 |  |/' "$G" > "$TMP/m_b3b.md";  mut "B-3b 1등 정보 공백"            "B-3b" "$TMP/m_b3b.md" "$R" "$S" "$PR"
sed -E 's/R-2 돌봄 대리인\(가족·펫시터\)$/R-2 돌봄 대리인(가족·펫시터) · R-3 수의사/' "$G" > "$TMP/m_b3c.md";           mut "B-3c §11 역할이 §2 에 없음"     "B-3c" "$TMP/m_b3c.md" "$R" "$S" "$PR"
sed -E 's/^- source_refs: \[A-05, R-G-03, W-1\]$/- source_refs: [A-05]/' "$G" > "$TMP/m_b7b.md";                       mut "B-7b confirmed 근거 1건"        "B-7b" "$TMP/m_b7b.md" "$R" "$S" "$PR"
sed -E 's/\| ① — 등록 0건 상태가 PRD 에 없음 \|/|  |/' "$G" > "$TMP/m_b12.md";                                          mut "B-12 하네스 추천 공백"          "B-12" "$TMP/m_b12.md" "$R" "$S" "$PR"
grep -v '^| 첫 진입·온보딩(등록 0건) |' "$G" > "$TMP/m_b16.md";                                                            mut "B-16 첫 진입 행 삭제(+B-4 T-1 대조)" "B-4 B-16" "$TMP/m_b16.md" "$R" "$S" "$PR"
grep -v '^| 2 | 복약 놓침 |' "$G" > "$TMP/m_b17.md";                                                                     mut "B-17 §2d 1행뿐"                 "B-17" "$TMP/m_b17.md" "$R" "$S" "$PR"
grep -v '^| REF-5 |' "$G" > "$TMP/m_b18.md";                                                                             mut "B-18 §9 과업 T-3 커버 부족"     "B-18" "$TMP/m_b18.md" "$R" "$S" "$PR"
sed -E 's/^- plain: 시간 지난 약은 맨 위 따로 보인다$/- plain: 시간 지난 약은 레이아웃 맨 위 따로 보인다/' "$G" > "$TMP/m_b19.md"; mut "B-19 plain 에 금지어"        "B-19" "$TMP/m_b19.md" "$R" "$S" "$PR"
sed -E 's/^- 사용자 수준\(익숙함·연령·기기\): .*$/- 사용자 수준(익숙함·연령·기기): /' "$G" > "$TMP/m_b26.md";               mut "B-26 사용자 수준 공백"          "B-26" "$TMP/m_b26.md" "$R" "$S" "$PR"
grep -v '^N-정보:' "$R" > "$TMP/m_b5.md";                                                                                mut "B-5 진술≠반응 N- 고지 삭제"     "B-5"  "$G" "$TMP/m_b5.md" "$S" "$PR"
sed -E 's/^H-02 \[interview\/constraint\]$/H-02 [interview\/blocked]/' "$R" > "$TMP/m_b24.md";                          mut "B-24 H- kind 미허용"            "B-24" "$G" "$TMP/m_b24.md" "$S" "$PR"
grep -v '^H-01 \[interview/interview_page\]' "$R" | grep -v '^  결정할 것: 인터뷰 페이지' > "$TMP/m_b24b.md";              mut "B-24 state.calls 2 ≠ raw H- 1" "B-24" "$G" "$TMP/m_b24b.md" "$S" "$PR"
sed -E 's/^A-05: .*$/A-05: "아침에 먹였는지 기억이 안 나서 한 번 더 먹일 뻔했어요" [UNCLEAR]/; s/^A-01: .*$/A-01: "저녁에 앉아서 약 봉투 세 개를 펼쳐 놓고 뭘 언제 먹였는지 정리해요" [UNCLEAR]/; s/^A-02: .*$/A-02: "오늘 남은 약이 몇 개인지요" [UNCLEAR]/; s/^A-07: .*$/A-07: "저는 가끔, 부모님은 60대인데 폰으로만 봐요" [UNCLEAR]/; s/^A-08: .*$/A-08: "부모님은 그냥 지금 뭘 먹이면 되는지만 알면 돼요" [UNCLEAR]/' "$R" > "$TMP/m_b25.md"; mut "B-25 [UNCLEAR] 5/9" "B-25" "$G" "$TMP/m_b25.md" "$S" "$PR"
{ cat "$R"; printf 'F-2 (Q-05): 하나 더\nA-F-2: "네"\nF-3 (Q-05): 또 하나\nA-F-3: "네"\n'; } > "$TMP/m_b23.md";              mut "B-23 같은 원 질문 되묻기 3회"   "B-23" "$G" "$TMP/m_b23.md" "$S" "$PR"
sed -E 's/"answered": 19/"answered": 18/' "$S" > "$TMP/m_b22.json";                                                      mut "B-22 answered ≠ raw 합계"       "B-22" "$G" "$R" "$TMP/m_b22.json" "$PR"
sed -E 's/^\| P-3 \| PASS \|/| P-3 | FAIL |/' "$PR" > "$TMP/m_b21.md";                                                   mut "B-21 페이지 리포트에 FAIL"      "B-21" "$G" "$R" "$S" "$TMP/m_b21.md"

echo "## 3. check-interview-page"
CIP="node scripts/check-interview-page.js"
CIPARGS=(--template-ref templates/interview_page.html --index "$FX/gallery_index_golden.json" --state "$S" --refs "$REFS" --prd "$FX/prd_analysis_golden.md")
expect_pass "골든(interview_golden.html)" "$TMP/cip_golden.md" $CIP --page "$FX/interview_golden.html" "${CIPARGS[@]}" --out "$TMP/cip_golden.md"
grep -qE '^\| P-1 \| FAIL' "$TMP/cip_golden.md" 2>/dev/null && echo "      힌트: 템플릿 골격이 바뀌었다 — node scripts/fixtures/build-interview-fixtures.js 로 interview_golden/bad.html 재생성"
expect_fail_exact "결함(interview_bad.html): unknown 누락·금지어 1건·타일 두 속성" "P-3 P-4 P-6" "$TMP/cip_bad.md" $CIP --page "$FX/interview_bad.html" "${CIPARGS[@]}" --out "$TMP/cip_bad.md"
expect_fail_subset "템플릿 샘플 데이터 그대로는 통과 불가(P-11 필수 payload)" "P-11" "$TMP/cip_tpl.md" $CIP --page templates/interview_page.html "${CIPARGS[@]}" --out "$TMP/cip_tpl.md"
expect_rc "없는 페이지 → 종료 2" 2 $CIP --page "$TMP/nope.html"

echo "## 4. check-c-report"
CCR="node scripts/check-c-report.js"; FG="$FX/figma_good"
expect_pass "골든(figma_good/verify/c_report.json)" "$TMP/ccr_good.md" $CCR --report "$FG/verify/c_report.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --out "$TMP/ccr_good.md"
expect_fail_exact "결함(c_report_bad.json): positive false 무예외·score 2 무근거" "CR-5 CR-6" "$TMP/ccr_bad.md" $CCR --report "$FX/c_report_bad.json" --brief "$FG/brief.md" --state "$S" --shots "$FG/verify/shots/index.md" --out "$TMP/ccr_bad.md"
expect_rc "없는 리포트 → 종료 2" 2 $CCR --report "$TMP/nope.json"

echo "## 5. check-decisions"
CD="node scripts/check-decisions.js"
expect_fail_subset "빈 템플릿(decisions_empty.md)" "D-1 D-2 D-3 D-4" "$TMP/cd_empty.md" $CD --decisions "$FX/decisions_empty.md" --raw "$FX/raw_empty.md" --state "$S" --out "$TMP/cd_empty.md"
expect_pass "골든(decisions_golden.md)" "$TMP/cd_golden.md" $CD --decisions "$FX/decisions_golden.md" --raw "$R" --state "$S" --out "$TMP/cd_golden.md"
expect_rc "--state 가 없는 경로 → 종료 2" 2 $CD --decisions "$FX/decisions_golden.md" --raw "$R" --state "$TMP/nope.json"

echo "## 6. check-html"
CH="node scripts/check-html.js"
expect_pass "골든(html_good/, WARN 허용)" "$TMP/ch_good.md" $CH --drafts "$FX/html_good/drafts" --brief "$FX/html_good/brief.md" --stimuli "$FX/html_good/stimuli" --out "$TMP/ch_good.md"
expect_fail_subset "결함(html_bad/ + 빈 brief)" "H-6 H-8 H-11 H-12 H-13 H-15 H-16 H-17" "$TMP/ch_bad.md" $CH --drafts "$FX/html_bad/drafts" --brief "$FX/brief_empty.md" --out "$TMP/ch_bad.md"
expect_rc "없는 drafts 경로 → 종료 2" 2 $CH --drafts "$TMP/nope"

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
expect_pass "F-11 처리 원장 있음(수정+커밋)" "$TMP/cf_f11b.md" node scripts/check-figma.js "${CFARGS[@]}" --c-report "$TMP/verify_f11/c_report.json" --c-routing "$TMP/c_routing_ok.md" --out "$TMP/cf_f11b.md"

echo
echo "selftest 결과: 기대 일치 $PASS_N / 불일치 $FAIL_N"
[ "$ENV_DIRTY" = 1 ] && echo "(templates/ 미커밋 — T-0·P-0·F-8 은 환경 행. 커밋 후 다시 돌리면 종료 코드 0 까지 확인된다)"
[ "$FAIL_N" -eq 0 ] || exit 1
exit 0
