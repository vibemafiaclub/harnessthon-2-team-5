---
name: design-figma-build
description: 3단계 Figma 구현과 검증. 승인된 HTML 초안(design/drafts)과 tokens.json 을 Figma MCP(use_figma)로 실제 파일에 구현한다 — Variables·텍스트 스타일·컴포넌트(variant 포함)·화면 프레임 순. 구현 후 A단계(노드 속성 기계 검사)와 C단계(스크린샷 육안 판정, 2콜 블라인드)를 돌리고, C 실패는 국소/방향/반복 3갈래로 라우팅한다. 최종 산출물은 Figma 파일 링크. design-harness 가 호출하거나 "Figma 에 구현 / 피그마로 만들어" 로 단독 호출.
argument-hint: "<figma file url | --new>"
---

# design-figma-build — Figma 구현 + A/C 검증

> **입력**: `design/drafts/*.html`, `design/drafts/components.md`, `design/tokens.json`, `design/design.md`, `design/decisions.md`. **출력**: Figma 파일(링크는 `design/figma.md`), `design/figma_nodes.json`, `design/verify/a_report.md`, `design/verify/c_report.md`.
> **전제**: Figma MCP 연결. 플러그인 스킬 `figma:figma-use`(모든 `use_figma` 호출 전 필수), `figma:figma-generate-library`(컴포넌트), `figma:figma-generate-design`(화면 조립)을 **구현 에이전트가** 로드한다. 이 스킬은 순서와 게이트만 정한다.
> **파일**: URL 이 없으면 `create_new_file` 로 새 파일을 만들고 상태 파일 `figma_url` 에 기록. 사용자에게 파일을 만들어 오라고 시키지 않는다.

## 분담

| 단계 | 누가 |
|---|---|
| 3-A Variables·텍스트 스타일 | `design-maker` |
| 3-B 컴포넌트 + variants | `design-maker` (컴포넌트별 병렬 가능) |
| 3-C 화면 프레임 조립 | `design-maker` (화면별 병렬, **페이지 전환은 호출당 1회**) |
| 3-D A단계 기계 검사 | `design-worker` (read-only `use_figma` 스크립트) |
| 3-E C단계 육안 판정 | `design-judge` × 2 호출(블라인드/대조) |
| 3-F 라우팅·수정 | 메인이 분류, 수정은 `design-maker` |
| 3-G 최종 확인 | **메인 세션** |

구현 에이전트와 판정 에이전트는 **항상 다른 호출**이다. 구현 에이전트의 "확인했습니다" 는 근거가 아니다.

## 3-A. Variables·텍스트 스타일 (`design-maker`)

브리프: **입력 화이트리스트 = `design/tokens.json`** + `figma_url`. 출력 `design/figma_nodes.json`(variables 섹션). 다른 파일은 읽지 않는다.
- 컬렉션 2개: `primitive`, `semantic`. semantic 은 primitive 를 alias. 이름은 tokens.json 경로를 `/` 로(`color/semantic/text/primary`).
- **scopes 를 반드시 명시**(배경은 FRAME_FILL·SHAPE_FILL, 텍스트 색은 TEXT_FILL, 간격은 GAP 등). 기본 ALL_SCOPES 금지.
- 타이포 scale 9단계(display~overline)는 텍스트 스타일로. **먼저 `figma.listAvailableFontsAsync()` 로 tokens.json 의 `typography.family.body/display` 가 로드 가능한지 확인**한다. 불가하면 `typography.family.fallback` 으로 교체하고, 교체 사실을 `figma_nodes.json` 의 `font_substitution` 과 brief §6 가정 로그에 기록한다. 사용자에게 폰트 설치를 요청하지 않는다.
- 라이트/다크 모드는 brief 에 요구가 있을 때만. 없으면 단일 모드.
- 생성한 variable ID·style ID 전부 반환·기록. 한 호출에 컬렉션 하나씩.

## 3-B. 컴포넌트 (`design-maker`)

브리프: **입력 화이트리스트 = `design/drafts/components.md`, 해당 컴포넌트가 쓰인 초안 HTML 1개, `tokens.json`, `figma_nodes.json`**.
- 컴포넌트마다 별도 호출, 병렬 가능. 페이지 `Components` 에 배치.
- 모든 fill·stroke·gap·padding·radius 는 **Variables 바인딩**. 하드코딩 색 0.
- 상태는 variant 로: components.md 에 적힌 상태(default/hover/pressed/disabled, 상태 칩은 상태 N종, 목록 행은 normal/empty-placeholder/long-text). 초안 HTML 의 상태 3종이 그대로 variant 가 된다.
- 레이어 이름은 semantic(`Card/MeetingRow`, `Chip/Status`), `Frame 123` 류 0.
- auto-layout 필수. 절대 좌표 배치 금지.
- 컴포넌트 description 에 "어느 화면에서 쓰이는지" 한 줄.

## 3-C. 화면 조립 (`design-maker`)

브리프: **입력 화이트리스트 = `design/drafts/screen_<nn>.html`, `components.md`, `figma_nodes.json`, `design.md`** (§5 의 이 화면 1등 정보를 문장으로 병기).
- 페이지 `Screens`, 화면마다 프레임 3개(`<nn> <이름> / normal`, `/ empty`, `/ long`). 목록형은 `/ loading` 추가.
- 3-B 컴포넌트 **인스턴스**로 조립. 새로 그리는 요소는 components.md 에 없는 것만, 그리고 그것도 Variables 바인딩.
- 프레임 위치는 겹치지 않게(오른쪽으로 순차). 화면 간 이동은 프로토타입 연결(brief §2 진입 경로)까지.
- 화면별 호출을 병렬로 내되 **한 호출 안에서 페이지 전환은 1회**.
- 생성 노드 ID → `figma_nodes.json` screens 섹션.

## 3-D. A단계 — 기계 검사 (`design-worker`)

`design.md` §4A 의 각 RULE 과 하네스 내장 6항목을 **read-only `use_figma` 스크립트**로 판정. 출력 `design/verify/a_report.md`(항목 / 기준값 / 측정값 / PASS·FAIL / 위반 노드 ID / 실행 스크립트 원문). **≤`agent_report_lines_max`줄** — 위반 노드 ID 가 많으면 항목당 10개까지만 적고 나머지는 개수만.

내장 6항목(항목은 고정, 기준값은 design.md·tokens.json 에서):
1. **팔레트 일관성** — 모든 fill/stroke 가 Variables 바인딩 또는 tokens.json 값과 일치. 예외: 이미지 fill.
2. **타이포 스타일 재사용** — 텍스트 노드 전부 텍스트 스타일 적용. 미적용 0.
3. **spacing 그리드** — 모든 gap/padding 이 `spacing.scale` 값. 예외 목록은 design.md exception.
4. **컴포넌트 재사용률** — Screens 페이지의 시각 요소 중 인스턴스 비율. 기준값 design.md(없으면 ≥70% 를 provisional 기준으로 쓰고 명시).
5. **레이어 네이밍** — 정규식(기본 `^[A-Z][A-Za-z]+(/[A-Z][A-Za-z0-9 ]+)*`), `Frame \d+|Rectangle \d+|Group \d+` 0건.
6. **variant 커버리지** — components.md 의 상태가 variant 로 전부 존재.

FAIL 항목은 위반 노드 ID 목록과 함께 3-F 로. 판정자는 고치지 않는다.

## 3-E. C단계 — 육안 판정 (`design-judge` × 2)

화면 프레임마다 `get_screenshot`(또는 `node.exportAsync`) 으로 PNG 를 `design/verify/shots/<nn>_<state>.png` 에 저장(`design-worker`). 그 다음 **2콜**:

**1콜 블라인드** (`design-judge`, brief·design.md 를 **주지 않는다**): PNG 만 주고 "시선이 가는 순서대로 요소 3개 + 각각 근거(위치·크기·색)" → `design/verify/c_first_impression.json`. 정답을 알려 주고 묻는 것은 유도 질문이다.

**2콜 대조** (`design-judge`, 별도 호출): 1콜 결과 + `design.md` §4C·§5·§6·§7·§8 + PNG 전부. 판정은 **채점 3축**으로 묶어 리포트한다:
- §5 1등 정보 == 1콜의 1순위인가 (화면별)
- §4C 각 RULE (근거: 파일명 + 위치)
- 하네스 내장 C 항목: 섹션 간 색온도 일관성 / 위계가 한눈에 읽히는가 / 여백 리듬 체감 일관성 / 밀도 번잡함 / 클리셰·AI 슬롭 여부 / empty·long 상태의 실제 완성도
- **SLOP-SWEEP 1건 고정**: "규칙에 걸리지 않지만 AI 가 만든 것처럼 보이는 요소" 를 능동 열거. 고치지 말고 `취향 공백` 으로 분류.
- **전량 대조 시트**: 행=화면, 열=구분 방식/라운딩/강조색/본문 크기. 불일치 셀 열거.
- **UX 직관 (§7 핵심 과업)**: 과업 3개를 스크린샷 순서대로 따라가 `찾음/헤맴/불가`. 첫 클릭 위치가 화면에서 3순위 안에 보이는가(1콜 결과와 대조).
- **적합성 (§8)**: 이 화면 세트가 그 도메인의 실제 서비스처럼 보이는가. 범용 관리자 템플릿·기본 컴포넌트 나열처럼 보이게 하는 요소를 지목. §8 의 "함정" 항목 각각 해당 여부.

**자체 채점**(신호일 뿐 게이트 아님): UI 심미 / UX 직관 / 적합성 각각 1·3·5 (1 = AI 슬롭처럼 보임, 3 = 신입 디자이너, 5 = 시니어). 3 미만인 축은 그 이유를 FAIL 항목으로 반드시 낸다. 점수만 적고 이유가 없는 채점은 무효.

출력 `design/verify/c_report.md` (**≤`agent_report_lines_max`줄**, 화면당 FAIL 은 심각한 순 ≤5건). 각 FAIL 에 **진단 분류** 필수:
- `local` 국소 결함 — 표면 속성 하나(간격·색 하나)
- `direction` 방향 오류 — 국소 조정으로 안 고쳐지는 구조 문제
- `taste_gap` 취향 공백 — design.md 에 근거 없음 → 사람 질의
- 그리고 같은 이유가 이전 라운드에도 있었는지(`repeat: true/false`, 상태 파일 `c_fail_reasons` 대조)

## 3-F. 라우팅 (메인이 분류, 수정은 `design-maker`)

| 분류 | 처리 |
|---|---|
| A FAIL | 위반 노드만 `design-maker` 수정 → 3-D 재검 |
| C `local` | 그 속성만 수정 → 3-E 재검(2콜 다시). **B단계로 돌아가지 않는다** |
| C `direction` | `design-draft-html` 2-B 로 회귀, 그 축만 재발산. 상태 파일에 기록 |
| C `taste_gap` | 사용자에게 질의(호출 품질 게이트 4항). 답을 raw 에 기록, brief §4 에 RULE 추가(provisional), design.md 갱신 후 재검 |
| C `repeat: true` (같은 이유 2회) | 요구사항 해석 오류 신호. **0단계로 에스컬레이션** — 사용자에게 "이 부분 해석이 어긋난 것 같습니다" 로 브리핑하고 진행 여부 결정 |

라운드 상한 `human_c_stage_rounds_max`(기본 3, **fast 모드 1 + 국소 수정 1회**). 초과 시 남은 FAIL 목록과 함께 사용자에게 넘긴다. "이 정도면 됐다" 는 항상 사람이 정한다.

## 3-G. 최종 확인 (메인 세션)

1. `design/figma.md` 작성: 파일 링크, 페이지 구성, 화면 목록, A/C 최종 결과 요약(3축 자체 채점 포함), PRD 대비 변경 사항(brief §10), 미해결 항목(있다면), 사용 모델·에이전트 목록(제출 요건).
2. 사용자에게: 링크 + "A 검사 N/N 통과, C 판정 요약 3줄, 남은 것 M개. 이대로 마무리할까요?" 승인 원문을 상태 파일 `final_ack` 에 기록.

## 종료조건 (`design-worker`)

- [ ] `design/figma.md` 에 링크 존재, 상태 파일 `figma_url` 일치
- [ ] `figma_nodes.json` 에 variables·components·screens 섹션, screens 수 == brief §2 화면 수 × 상태 수
- [ ] `a_report.md` 전건 PASS 또는 사용자 승인된 예외 명시
- [ ] `c_report.md` 마지막 라운드에 미분류 FAIL 0
- [ ] `final_ack.approved == true`

## 하지 않는 것

- 사용자에게 Figma 조작을 요청하는 것(파일 생성·폰트 설치 포함). 불가하면 `BLOCKED` 로 보고.
- 규칙에 없는 취향으로 탈락시키는 것. 그건 `taste_gap` 이다.
