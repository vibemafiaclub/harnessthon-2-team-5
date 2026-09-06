#!/usr/bin/env bash
# 평가 루프 러너 — 고정 픽스처 3종에 A게이트를 일괄 적용하고 결과를 집계한다.
#
# 사용법:
#   scripts/eval.sh <run-id>            # 예: scripts/eval.sh 2026-09-05-a
#   scripts/eval.sh <run-id> --stage wireframe
#
# 전제: 각 픽스처의 산출물이 아래 위치에 있어야 한다.
#   evals/runs/<run-id>/<fixture>/project.rules.json
#   evals/runs/<run-id>/<fixture>/nodes.json         (scripts/extract-nodes.js 로 1회 순회 덤프)
#
# 생성물:
#   evals/runs/<run-id>/<fixture>/audit.json
#   evals/runs/<run-id>/summary.md
#
# A게이트만 자동이다. C게이트는 evals/scorecard.md 를 사람이 채운다.

set -uo pipefail
cd "$(dirname "$0")/.."

RUN_ID="${1:-}"
[ -z "$RUN_ID" ] && { echo "사용법: scripts/eval.sh <run-id> [--stage wireframe|design]"; exit 2; }
shift
STAGE="design"
[ "${1:-}" = "--stage" ] && STAGE="${2:-design}"

RUN_DIR="evals/runs/$RUN_ID"
[ -d "$RUN_DIR" ] || { echo "런 디렉터리가 없다: $RUN_DIR"; exit 2; }

SUMMARY="$RUN_DIR/summary.md"
{
  echo "# 평가 리포트 — $RUN_ID"
  echo
  echo "- stage: \`$STAGE\`"
  echo "- 실행: $(date '+%Y-%m-%d %H:%M')"
  echo
  echo "## A게이트 (자동)"
  echo
  echo "| 픽스처 | 결과 | blocker | warning | 미검사 blocker | 검사 노드 |"
  echo "|---|---|---:|---:|---:|---:|"
} > "$SUMMARY"

TOTAL_FAIL=0
for FIXTURE_DIR in "$RUN_DIR"/*/; do
  [ -d "$FIXTURE_DIR" ] || continue
  FIXTURE="$(basename "$FIXTURE_DIR")"
  RULES="$FIXTURE_DIR/project.rules.json"
  NODES="$FIXTURE_DIR/nodes.json"

  if [ ! -f "$RULES" ]; then
    echo "| $FIXTURE | ⚠️ project.rules.json 없음 | - | - | - | - |" >> "$SUMMARY"
    TOTAL_FAIL=$((TOTAL_FAIL+1)); continue
  fi

  # 1) 컴파일 게이트 — 여기서 막히면 화면 문제가 아니라 가이드가 안 끝난 것이다
  if ! node scripts/audit.js --project "$RULES" --compile-only > "$FIXTURE_DIR/compile.json" 2>&1; then
    echo "| $FIXTURE | ❌ 컴파일 실패 (0단계 미완) | - | - | - | - |" >> "$SUMMARY"
    TOTAL_FAIL=$((TOTAL_FAIL+1)); continue
  fi

  if [ ! -f "$NODES" ]; then
    echo "| $FIXTURE | ⚠️ nodes.json 없음 (덤프 미실행) | - | - | - | - |" >> "$SUMMARY"
    TOTAL_FAIL=$((TOTAL_FAIL+1)); continue
  fi

  # 2) A게이트
  node scripts/audit.js --project "$RULES" --nodes "$NODES" --stage "$STAGE" \
       --target "$FIXTURE" --out "$FIXTURE_DIR/audit.json" > /dev/null 2>&1
  CODE=$?
  IFS=$'\t' read -r PASSED B W U N <<< "$(node -e '
    const r = require("./" + process.argv[1]);
    console.log([r.passed ? "✅ 통과" : "❌ 미통과", r.summary.blocker, r.summary.warning,
                 r.unchecked_blockers.length, r.nodes_inspected].join("\t"));
  ' "$FIXTURE_DIR/audit.json" 2>/dev/null)"
  [ -z "${PASSED:-}" ] && { PASSED="⚠️ 리포트 파싱 실패"; B="-"; W="-"; U="-"; N="-"; }
  [ "$CODE" != "0" ] && TOTAL_FAIL=$((TOTAL_FAIL+1))
  echo "| $FIXTURE | $PASSED | $B | $W | $U | $N |" >> "$SUMMARY"
done

{
  echo
  echo "## C게이트 (사람)"
  echo
  echo "\`evals/scorecard.md\` 를 픽스처별로 복사해 채운다. A게이트를 통과했어도 C게이트는 별도다."
  echo "스크린샷 없이 채운 스코어카드는 무효로 처리한다."
  echo
  echo "## 회귀 판정"
  echo
  echo "직전 런의 summary.md 와 비교한다. 아래 중 하나라도 해당하면 **개선이 아니라 회귀**다."
  echo
  echo "- 이전에 통과하던 픽스처가 미통과로 바뀜"
  echo "- blocker 총합이 늘어남"
  echo "- C게이트 항목 중 이전에 통과하던 것이 실패로 바뀜"
  echo "- 미검사 blocker 수가 늘어남 (검사기 커버리지 후퇴)"
  echo
  echo "## 다음 행동"
  echo
  echo "C게이트에서 새로 발견한 실패 유형은 반드시"
  echo "\`.claude/skills/oss-design-harness/references/aesthetic-checks.md\` 에 추가한다."
  echo "판정 기준(수치) + 빈발 사례 + 수정 방침 3종 세트가 없으면 추가하지 않는다."
} >> "$SUMMARY"

echo "요약: $SUMMARY"
cat "$SUMMARY"
[ "$TOTAL_FAIL" -eq 0 ] || exit 1
