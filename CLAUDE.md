# CLAUDE.md

oss-design-harness — 현업 디자이너의 판단 기준을 추출해, Figma MCP로 화면을 만들고
**결정론적 게이트로 검증**하는 디자인 하네스.

## 이 저장소의 대전제

**프롬프트는 가이드 준수를 보장하지 못한다.** 아무리 강하게 써도 확률적 준수에 그친다.
보장하는 것은 게이트다 — 검사기가 위반을 잡으면 다음 단계로 넘어가지 못한다(fail-closed).

따라서 이 저장소의 작업은 "가이드를 잘 지키는 에이전트"를 만드는 것이 아니라,
**가이드를 기계가 검사 가능한 형태로 바꾸고 + 통과 못 하면 멈추는 파이프라인**을 만드는 것이다.
에이전트는 그 파이프라인의 부품이지 보증 주체가 아니다.

퀄리티를 올리는 방법도 여기서 나온다. 프롬프트 문구를 다듬는 것이 아니라,
**탈락 패턴을 카탈로그에 추가하고 검사기 커버리지를 넓히는 것**이다.

## 항상 지키는 4가지

산출물 품질은 대부분 이 4개에서 갈린다. 스킬·템플릿·카탈로그가 모두 이 문장을 공유한다.

1. **증거 등급을 붙인다** — 모든 값에 출처를 남긴다:
   `prd` / `repo` / `client-quote` / `measured` / `assumption` / `extension`
2. **모르면 비운다** — 확인 안 된 값을 그럴듯한 기본값으로 채우지 않는다.
   해결되지 않은 **가장 작은 단위만** 생략하고 Unknowns에 기록한다.
   침묵 통과와 명시적 가정은 다르다. 후자는 나중에 검증 가능하다.
3. **표면을 섞지 않는다** — 모바일 제품 UI와 마케팅 웹을 별도 이름으로 유지한다.
   서로 다른 두 값을 평균내지 않는다 (16px + 7px → 11px 금지).
4. **없는 것을 지어내지 않는다** — 근거에 없는 카드·그림자·탭·토스트·다이얼로그를
   업계 관행으로 채우지 않는다. 필요하면 `extension`으로 명시한다.

우선순위 충돌 시: **사용자 직접 지시 > 저장소 사실 > 시스템 계약 > 참조 영감.**

## 진실의 출처

모든 단계는 아래 파일만 판단 근거로 삼는다. **대화 맥락에서 기준을 추론하지 않는다.**

| 계층 | 파일 | 소유자 |
|---|---|---|
| L1 완전 고정 | `guide/core.rules.json` | 하네스. 프로젝트가 수정 불가 |
| L2 항목 고정/값 프로젝트별 | `<project>/project.rules.json` | 프로젝트. 0단계에서 캘리브레이션 |
| L3 완전 프로젝트별 | 같은 파일의 `project_specific.rules` | 프로젝트 |
| 사람이 읽는 가이드 | `<project>/design-guide.md` | 스키마: `templates/design-guide.md` |
| 참조 디자인 시스템 | `guide/reference/toss.design.md` | 스키마의 준거 + 값의 영감원 |

병합 순서: `core` → `project` → `project_specific`. 뒤가 앞을 덮어쓰지만
**core의 `blocker`는 덮어쓸 수 없다.** 완화를 시도하면 컴파일이 실패한다.

## 파이프라인

```
0. 정렬 ──> guide 컴파일 ──┐
                            │ (모든 하위 단계가 이 파일만 참조)
   ┌────────────────────────┘
   ↓
   W. 와이어프레임 ──> [A-w 게이트] ──> [C-w 게이트] ──┐
   ┌───────────────────────────────────────────────────┘
   ↓
   D. 디자인 구현 ──> [A-d 게이트] ──> [C-d 게이트] ──> 사람 승인
```

| 단계 | 하는 일 | 산출물 |
|---|---|---|
| **0. 요구사항 정렬** | 레퍼런스 반응에서 암묵적 기준 역추출. 라벨형 질문 금지 | `design-guide.md`, `project.rules.json`, `brief.md` |
| **B. 발산·수렴** | 독립 축을 먼저 나누고 축마다 후보 병렬 생성 | `decisions.md` |
| **W. 와이어프레임** | 구조만. 무채색 강제 | Figma 프레임 |
| **A게이트** | 노드 속성으로 예/아니오 판정. `scripts/audit.js` | `audit.json` |
| **D. 디자인** | 비주얼 구현 | Figma 프레임 |
| **C게이트** | 스크린샷을 실제로 보고 판정 | 스코어카드 |

**W와 D를 분리하는 이유**: 지켜야 할 것이 다르다. 와이어프레임에서 색 대비를 검사하는 것은
무의미하고(회색조 강제), 터치 타깃 크기는 구조 단계부터 확정되어야 한다.
규칙의 `stage`에 현재 단계가 없으면 **검사하지 않는다** — 통과가 아니라 평가 대상 아님이다.

## 게이트 규칙

1. **게이트 미통과 = 다음 단계 진입 금지.** 예외 없음.
2. **`blocker`는 자동 수정 대상, `warning`은 기록만.** 심각도를 안 나누면 게이트가 사소한 위반으로 무한루프에 빠진다.
3. **재시도 상한 3회.** 초과 시 사람 에스컬레이션. 최종 "이 정도면 됐다" 판단은 항상 사람이 내린다.
4. **미구현 검사는 통과가 아니다.** 검사기가 아직 구현하지 않은 `blocker` 타입은
   `unchecked_blockers`로 보고되고 **사람 게이트로 승격**된다. "못 봤다"를 "통과했다"로 처리하지 않는다.

### fail-closed 조건

다음 중 하나라도 해당하면 파이프라인은 W단계 진입을 거부한다(`audit.js` 종료 코드 2).

1. `status: "unfilled"`인 `blocker` 규칙이 남아 있다
2. `$tokens` 참조가 `null`을 가리킨다
3. `check.type`이 카탈로그에 없다
4. 프로젝트 계층이 core의 `blocker`를 완화하려 한다

"값을 모르니 일단 검사를 건너뛰고 진행"은 허용하지 않는다.
모르면 **가정으로 명시하고 `source`에 `"가정: ..."`을 기록한 뒤 `filled`로 올린다.**

## 검사기 사용법

```bash
# 0단계가 끝났는지 확인 (W 진입 전 필수)
node scripts/audit.js --project <project.rules.json> --compile-only --format text

# A게이트
node scripts/audit.js --project <project.rules.json> --nodes nodes.json \
  --stage design --target <frame-id> --out audit.json --format text
```

종료 코드: `0` 통과 / `1` 게이트 미통과 / `2` 컴파일 실패(화면 문제가 아니라 가이드 문제).

`nodes.json`은 `scripts/extract-nodes.js`를 `use_figma`로 실행해 덤프한다.
게이트 실행은 `design-qa` 서브에이전트에 위임할 수 있다 — 앵커링 방지를 위해
C게이트는 메인 컨텍스트가 아니라 서브에이전트에서 판정하는 것이 낫다.

**v0 구현 완료**: `color_allowlist`, `multiple_of`, `name_pattern`
**카탈로그에 있으나 미구현**: `contrast_ratio`, `min_size`, `min_font_size`, `image_fill_present`,
`text_overflow`, `saturation_max`, `style_bound`, `reuse_ratio`, `variant_states_present`
→ 전부 `skipped_unimplemented`로 보고되고, `blocker`면 사람 게이트로 승격된다.

새 `check.type`을 추가할 때는 `guide/README.md` 카탈로그와 `audit.js`의 `CATALOG` 상수를
**함께** 고친다. 한쪽만 고치면 컴파일이 실패한다.

## Figma 호출 규약

- **`use_figma` 호출 전에 반드시 `figma-use` 스킬을 먼저 로드한다.** 선택이 아니다.
- 새 파일이 필요하면 `create_new_file` 전에 `figma-create-new-file` 스킬을 로드한다.
- `create_design`이라는 툴은 **존재하지 않는다.** `use_figma` 또는 `generate_figma_design`을 쓴다.
- **rate limit** 때문에 검사는 1회 호출로 전체 노드를 순회한다. 규칙마다 따로 호출하면 바로 걸린다.
- B단계 병렬 후보 생성은 후보별 페이지 분리 규약이 정해지기 전까지 보류(동시 쓰기 충돌).

## C게이트 규약

- **판정 기준의 원본은 `.claude/skills/oss-design-harness/references/aesthetic-checks.md` 하나다.**
  다른 곳에서 기준을 새로 만들지 않는다.
- `get_screenshot`으로 전체·상단·하단 3장을 렌더한 뒤 판정한다.
  **스크린샷 없이 "괜찮아 보입니다"는 C단계 미수행**이며 게이트를 통과시키지 않는다.
- 판정은 통과/실패만 쓴다. "대체로 괜찮음" 같은 중간값을 쓰지 않는다.
  실패 시 어느 노드가 어떤 수치로 어긋났는지 쓴다. 서술형 인상은 판정이 아니다.
- 실패 라우팅: ① 국소 결함 → 그 속성만 고쳐 C 재검 ② 방향 오류 → B 회귀
  ③ 반복 실패 → 0단계 에스컬레이션(기준 자체가 잘못 추출됨).

## 평가 루프

스킬을 고쳤으면 **반드시 3개 픽스처를 모두 돌린다.** 하나만 돌리면 그 하나에 과적합된다.

```bash
scripts/eval.sh <run-id>          # A게이트 일괄 + summary.md 생성
```

| 픽스처 | 성격 |
|---|---|
| `01-wedding-scheduler` | 소비자 / 온기 있는 톤 / 관계 데이터 |
| `02-b2b-ops-dashboard` | B2B / 고밀도 / 색 단독 전달 금지 |
| `03-commerce-product-detail` | 커머스 / 이미지 지배 / 전환 CTA |

**01에서 통했던 여백과 톤이 02에서 그대로 통하면 그 자체가 실패 신호다** —
도메인을 읽지 않고 기본값을 재생산하고 있다는 뜻이다.

회귀 판정(하나라도 해당하면 개선이 아니라 회귀): 이전 통과 픽스처가 미통과로 바뀜 /
blocker 총합 증가 / C게이트 통과 항목이 실패로 바뀜 / 미검사 blocker 수 증가.

## 루프를 닫는 규칙 (가장 중요)

C게이트에서 새로 발견한 실패 유형은 **반드시 `aesthetic-checks.md`에 추가한다.**
좋은 예를 늘리는 것보다 **탈락 패턴을 늘리는 것**이 이 하네스의 품질을 올리는 유일한 방법이다.

추가 형식은 `판정 기준(수치) + 빈발 사례 + 수정 방침` 3종 세트다.
셋 중 하나라도 없으면 추가하지 않는다. "위계를 명확히" 같은 문장은 아무 효과가 없다.

## 파일 구조

```
.claude/agents/design-qa.md              A게이트 + C게이트 실행 서브에이전트
.claude/skills/oss-design-harness/       오케스트레이터 (0/B/W/D + 게이트)
  references/aesthetic-checks.md         C게이트 판정 기준 — 유일한 원본
.claude/skills/prd-to-design-guide/      PRD → 디자인 토큰 + Figma 가이드 캔버스
guide/core.rules.json · README.md        L1 규칙 · 스키마/카탈로그/리포트 형식
guide/reference/toss.design.md           참조 디자인 시스템
templates/design-guide.md                디자인 가이드 스키마 (design-md v1)
templates/project.rules.json             L2/L3 빈 템플릿 (brief.md · decisions.md 동봉)
scripts/audit.js                         A게이트 검사기 (결정론, LLM 아님)
scripts/extract-nodes.js · eval.sh       노드 덤프 추출기 · 평가 루프 러너
evals/                                   픽스처 PRD · 스코어카드 · 런 기록
docs/concept.md · plan.md                배경과 작업 계획
```

## 문서 작성 규칙

- 한국어로 쓴다. 코드 식별자·툴 이름은 원문 유지.
- 규칙을 새로 쓸 때는 **판정 가능한 형태**로 쓴다. 두 사람이 같은 화면을 보고
  같은 결론에 도달할 수 없으면 그건 규칙이 아니라 인상이다.
- `SKILL.md` 본문은 100줄 내외로 유지하고, 늘어나는 기준은 `references/`로 뺀다.
  본문에 다 넣으면 컨텍스트가 희석돼 오히려 준수율이 떨어진다.
- 스킬의 `description`은 "무엇을 + 언제(트리거 문구 나열)" 형태로 쓴다.
  스킬 로딩 여부를 판단하는 유일한 근거다.
