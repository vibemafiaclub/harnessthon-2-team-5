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
- **바인딩 paint 의 리터럴 color 도 변수 값과 같게 쓴다.** Figma 는 리터럴을 그대로 렌더한다 — 바인딩만 걸고 리터럴을 검정으로 두면 검정으로 보인다(팀 디자이너 실측 사고). A검사 1 이 바인딩·리터럴 일치를 함께 본다.
- 날짜·카운트·D-day·시간 스타일은 tabular numerals 를 켠다. 면 전용 색 변수는 설명에 "면 전용 — 텍스트 금지".
- **호출 예산**: Figma MCP 는 하루 200회·분당 10회(Pro 좌석 기준). 시작 전에 예상 호출 수를 상태 파일에 적고, 노드를 하나씩 만지지 말고 화면·컴포넌트 묶음 단위로 실행한다. **토큰·변수를 바꾼 직후에는 반드시 스크린샷을 렌더한다** — 노드 속성으로는 대비 사고가 안 잡힌다.

## 3-B. 컴포넌트 (`design-maker`)

브리프: **입력 화이트리스트 = `design/drafts/components.md`, 해당 컴포넌트가 쓰인 초안 HTML 1개, `tokens.json`, `figma_nodes.json`**.
- 컴포넌트마다 별도 호출, 병렬 가능. 페이지 `Components` 에 배치. **배치 좌표는 앞 세트의 `y + height + 여백(64)` 으로 계산**한다 — 고정 간격으로 나열하면 키 큰 세트가 다음 라벨을 덮는다(실측). 각 호출은 자기 산출을 **`design/figma_nodes.<컴포넌트슬러그>.json` 별도 파일**에 쓰고, 병합은 3-B 종료 후 `design-worker` 단일 호출이 한다(D-8: 공유 JSON 동시 쓰기로 파일 무효화 실측).
- **크기 sanity**: 컴포넌트 크기와 패딩은 초안 HTML 의 대응 요소 ±30% 이내. `spacing.scale` 은 **키가 아니라 값**을 읽는다(실측: 인덱스 20 을 20px 로 착각해 padding 80/64px, 버튼 343×155px).
- **아이콘**: 벡터 위에 불투명 fill 을 가진 프레임을 두지 않는다. 아이콘 컨테이너 fill 은 없음 또는 투명. 제작 후 **인스턴스를 화면 프레임 안에 넣은 상태**로 스크린샷을 찍어 확인한다 — 마스터에서는 정상으로 보이고 인스턴스에서만 덮이는 사례가 실측됐다(D-10).
- 모든 fill·stroke·gap·padding·radius 는 **Variables 바인딩**. 하드코딩 색 0.
- 상태는 variant 로: components.md 에 적힌 상태(default/hover/pressed/disabled, 상태 칩은 상태 N종, 목록 행은 normal/empty-placeholder/long-text). 초안 HTML 의 상태 3종이 그대로 variant 가 된다.
- 레이어 이름은 semantic(`Card/MeetingRow`, `Chip/Status`), `Frame 123` 류 0.
- auto-layout 필수. 절대 좌표 배치 금지.
- 컴포넌트 description 에 "어느 화면에서 쓰이는지" 한 줄.
- **반환값에 구조 실측치 필수**: 컴포넌트마다 `{id, children_count, vectors_visible, size, container_fill, opacity}`. ID 만 돌아오면 미완료로 간주하고 되돌린다(D-15).

## 3-C. 화면 조립 (`design-maker`)

브리프: **입력 화이트리스트 = `design/drafts/screen_<nn>.html`, `components.md`, `figma_nodes.json`, `design.md`** (§5 의 이 화면 1등 정보를 문장으로 병기).
- 페이지 `Screens`, 화면마다 프레임 3개(`<nn> <이름> / normal`, `/ empty`, `/ long`). 목록형은 `/ loading` 추가.
- 3-B 컴포넌트 **인스턴스**로 조립. 새로 그리는 요소는 components.md 에 없는 것만, 그리고 그것도 Variables 바인딩.
- 프레임 위치는 겹치지 않게(오른쪽으로 순차). 화면 간 이동은 프로토타입 연결(brief §2 진입 경로)까지.
- 화면별 호출을 병렬로 내되 **한 호출 안에서 페이지 전환은 1회**.
- 생성 노드 ID → **화면별 별도 파일 `design/figma_nodes.<화면슬러그>.json`**. 병합은 3-C 종료 후 `design-worker` 단일 호출(D-8).
- 프레임 규격은 `design.md` §2 의 값(모바일 390×844, 상태바·탭바 포함)으로 고정. hug 금지. 내용이 넘치면 프레임에 clip content 를 켜고 내용 컨테이너를 세로 스크롤(프로토타입 overflow scrolling)로 둔다.
- **주 행동 노드는 `Action/Primary` 로 이름 짓고**, 첫 화면(y+height ≤ 프레임 높이) 안에 있거나 `Bar/Action` 하단 고정 컨테이너(프로토타입 "fix position when scrolling") 안에 둔다. 잘리거나 스크롤 뒤에 있으면 A검사 13 FAIL.
- **내용 높이가 프레임을 넘는 화면은 `<nn> <이름> / full` 프레임을 함께 만든다** — 내용 길이만큼 늘린 프레임(이 프레임만 hug 허용), 844 위치에 점선 가이드 `Guide/Fold`. 심사자가 잘린 부분을 못 보는 일이 없게 한다.

## 3-D. A단계 — 기계 검사 (`design-worker`)

**결정론 검사기 먼저, 즉석 스크립트는 보완.** (팀 디자이너 A 의 대전제 채택: 프롬프트는 준수를 보장하지 못한다, 검사기만 보장한다.)

1. **번들 생성**(`design-worker`): `node scripts/make-figma-audit.js --project design/project.rules.json --stage design --page Screens --out design/verify/figma_audit.js`. 규칙을 Figma 안으로 들여보내는 방식이다 — `use_figma` 반환값은 약 20KB 에서 잘리고 로컬 파일에 쓸 수 없어 노드 덤프(실측 553KB)를 밖으로 꺼낼 수 없다(D-17). 컴파일 실패(종료 2)면 화면이 아니라 규칙 문제 → 1단계로.
2. **Figma 안에서 판정**(`design-worker`, `figma-use` 스킬 로드 후): 번들을 **페이지마다 하나씩** 만들어(`--page Screens`, `--page Components`) 각각 `use_figma` **1회**로 실행한다(호출당 페이지 전환은 1회가 원칙. 사람이 프레임을 선택해 둘 필요 없다 — 페이지의 자식 전부를 순회한다). 반환 JSON(수 KB)을 `design/verify/audit_screens.json`·`audit_components.json` 에 저장하고 `node scripts/audit.js --render design/verify/audit_screens.json,design/verify/audit_components.json` 으로 **병합** 리포트를 만든다. variant 규칙은 Components 페이지에서만 발동하므로 두 페이지를 다 돌리지 않으면 리포트에 `적용 대상 0개 (N/A)` 로 표시된다 — N/A 는 통과가 아니다. 종료 코드 0 통과(`passed_machine`) / 1 미통과. 반환에 `error` 가 있으면 그것이 결과다.
3. 게이트 판정은 `passed_machine`(구현된 검사 기준 blocker 0)으로 한다. 리포트의 `unchecked_blockers`(검사기 미구현 타입: contrast 계열·image_fill·text_overflow·reuse_ratio)는 **통과도 실패도 아니다** — 아래 즉석 스크립트로 보완 측정하고, 그래도 못 본 blocker 는 `requires_human_review` 목록으로 3-G 사람 게이트에 올린다. "못 봤다"를 "통과했다"로 적지 않되, 미구현 때문에 문이 영원히 안 열리는 상태도 만들지 않는다(실측: `passed` 하나로 묶었을 때 어떤 프로젝트도 통과 불가).
4. `severity: blocker` 만 게이트를 막는다. `warning` 은 기록만. 심각도를 안 나누면 사소한 위반으로 무한루프에 빠진다.

출력 `design/verify/a_report.md`(audit.json 요약 + 보완 항목 / 기준값 / 측정값 / PASS·FAIL / 위반 노드 ID / 실행 스크립트 원문). **≤`agent_report_lines_max`줄** — 위반 노드 ID 가 많으면 항목당 10개까지만 적고 나머지는 개수만.

보완 항목(검사기 미구현분 + 우리 실측분. 항목은 고정, 기준값은 design.md·tokens.json 에서):
1. **팔레트 일관성** — 모든 fill/stroke 가 Variables 바인딩 **이고 리터럴 color 가 변수 값과 일치**. 예외: 이미지 fill. (audit.js `color_allowlist` + 즉석 바인딩 검사)
2. **타이포 스타일 재사용** — 텍스트 노드 전부 텍스트 스타일 적용. 미적용 0.
3. **spacing 그리드** — 모든 gap/padding 이 `spacing.scale` 값. 예외 목록은 design.md exception.
4. **컴포넌트 재사용률** — Screens 페이지의 시각 요소 중 인스턴스 비율. 기준값 design.md(없으면 ≥70% 를 provisional 기준으로 쓰고 명시).
5. **레이어 네이밍** — 정규식(기본 `^[A-Z][A-Za-z]+(/[A-Z][A-Za-z0-9 ]+)*`), `Frame \d+|Rectangle \d+|Group \d+` 0건.
6. **variant 커버리지** — components.md 의 상태가 variant 로 전부 존재.
7. **아이콘 덮임** — 아이콘 컴포넌트·인스턴스 안에 `visible` 한 VECTOR/BOOLEAN_OPERATION 이 ≥1 이고, 그 벡터의 조상 중 벡터 영역을 덮는 불투명 fill(opacity ≥ 0.9, 크기 ≥ 벡터) 을 가진 FRAME/RECTANGLE 이 없다. 화면 프레임 안의 **인스턴스**를 검사 대상으로 한다(D-10: 마스터는 정상, 인스턴스만 네모).
8. **크기 sanity** — 각 컴포넌트 인스턴스의 width/height/padding 이 `drafts/components.md` 에 적힌 초안 HTML 대응 요소 값의 ±30% 이내. 토큰에서 왔는지가 아니라 값이 말이 되는지를 본다(실측: 80px 도 scale 에 있으면 PASS 였다).
9. **프레임 규격** — Screens 페이지의 모든 화면 프레임이 `design.md` §2 규격과 같고 hug 가 아니다.
10. **고정 요소 겹침** — 하단 탭바·고정 액션바가 있으면 스크롤 콘텐츠 하단 여백이 그 높이 이상. 콘텐츠가 가려지면 FAIL.
11. **터치 영역** — 프로토타입 연결(reactions)이 있는 노드는 blocker(`touch-target-min`), 이름으로 추정한 노드(Button·Tab·Input·Checkbox 등, 인터랙티브 조상 없음)는 warning(`touch-target-min-inferred`)으로 3-G 사람 게이트가 본다. 시안에 무엇이 눌리는지는 기계가 이름으로 확신할 수 없다. 시각 크기를 키우지 말고 패딩·히트영역으로.
12. **텍스트 오버플로** — 도메인 최장 문자열·최대 수치를 넣은 `long` 프레임에서 잘림·겹침 0.
13. **주 행동 가시성** — 화면 프레임마다 `Action/Primary` 가 정확히 1개(없으면 프레임 description 에 `no-primary`), 그 노드의 절대 y+height ≤ 프레임 높이 이거나 조상에 `Bar/Action` 존재. 잘림·스크롤 뒤 = FAIL (D-26).
14. **full 프레임 존재** — 내용 컨테이너 높이 > 프레임 높이인 화면은 같은 이름의 `/ full` 프레임이 있고 `Guide/Fold` 가 844 에 있다. 없으면 FAIL.

FAIL 항목은 위반 노드 ID 목록과 함께 3-F 로. 판정자는 고치지 않는다.

## 3-E. C단계 — 육안 판정 (`design-judge` × 2)

화면 프레임마다 `get_screenshot`(또는 `node.exportAsync`) 으로 PNG 를 `design/verify/shots/<nn>_<state>.png` 에 저장(`design-worker`). **캡처마다 `design/verify/shots/index.md` 에 파일명·캡처 시각(ISO)·Figma 파일 `lastModified`·노드 id 를 기록**하고, 판정 브리프에 이 index 를 넣는다. 판정자는 캡처 시각이 Figma `lastModified` 보다 앞서면 판정하지 않고 **`C_STALE`** 을 반환한다(D-29 실측: 수정 전 캡처로 판정해 "이미 고친 결함" 3건을 상위로 보고 — 판정은 정확했고 대상이 낡았을 뿐이라 리포트만으로는 구분이 안 된다). 수정 후 "재캡처" 라며 찍은 파일이 이전 파일과 바이트 동일하면 재캡처가 아니다 — worker 가 `shasum` 으로 대조해 같으면 FAIL. 그 다음 **2콜**:

**1콜 블라인드** (`design-judge`, brief·design.md 를 **주지 않는다**): PNG 만 주고 "시선이 가는 순서대로 요소 3개 + 각각 근거(위치·크기·색)" → `design/verify/c_first_impression.json`. 정답을 알려 주고 묻는 것은 유도 질문이다.

**2콜 대조** (`design-judge`, 별도 호출): 입력 화이트리스트 = 1콜 결과 + `design.md` + PNG 전부 + **`.claude/skills/design-figma-build/references/c_checks.md`**(판정 기준 원본 — 다른 곳에서 기준을 새로 만들지 않는다). **decisions.md·제작 브리프·서브 완료 보고는 주지 않는다** — 판정자는 제작 의도를 듣지 않고, 설계 의도 문장이 섞여 있어도 판정 근거로 쓰지 않는다. 절차: ①화면마다 **1차 목적 선언**(빠른 처리형/현황 파악형/선택형/입력형 — design.md §7·brief §2) ②c_checks 의 부정형 C-1~C-9 를 순서대로 ③전부 통과한 화면만 **긍정형 매력 판정** ④3축 매핑. 스크린샷을 못 얻은 화면은 `C_NOT_RUN` 이며 통과가 아니다. 판정은 통과/실패만 — "대체로 괜찮음" 같은 중간값 금지. 판정은 **채점 3축**으로 묶어 리포트한다:
- §5 1등 정보 == 1콜의 1순위인가 (화면별)
- §4C 각 RULE (근거: 파일명 + 위치)
- 하네스 내장 C 항목: 섹션 간 색온도 일관성 / 위계가 한눈에 읽히는가 / 여백 리듬 체감 일관성 / 밀도 번잡함 / 클리셰·AI 슬롭 여부 / empty·long 상태의 실제 완성도
- **SLOP-SWEEP 1건 고정**: "규칙에 걸리지 않지만 AI 가 만든 것처럼 보이는 요소" 를 능동 열거. 고치지 말고 `취향 공백` 으로 분류.
- **전량 대조 시트**: 행=화면, 열=구분 방식/라운딩/강조색/본문 크기. 불일치 셀 열거.
- **UX 직관 (§7 핵심 과업)**: 과업 3개를 스크린샷 순서대로 따라가 `찾음/헤맴/불가`. 첫 클릭 위치가 화면에서 3순위 안에 보이는가(1콜 결과와 대조).
- **적합성 (§8)**: 이 화면 세트가 그 도메인의 실제 서비스처럼 보이는가. 범용 관리자 템플릿·기본 컴포넌트 나열처럼 보이게 하는 요소를 지목. §8 의 "함정" 항목 각각 해당 여부.

**자체 채점**(신호일 뿐 게이트 아님): UI 심미 / UX 직관 / 적합성 각각 1·3·5 (1 = AI 슬롭처럼 보임, 3 = 신입 디자이너, 5 = 시니어). 3 미만인 축은 그 이유를 FAIL 항목으로 반드시 낸다. 점수만 적고 이유가 없는 채점은 무효.

출력 `design/verify/c_report.md` (**≤`agent_report_lines_max`줄**, 화면당 FAIL 은 심각한 순 ≤5건) **+ `design/verify/c_report.json`** (고정 스키마 — 메인이 파싱한다):

```json
{ "screens": [ { "id": "02_home", "purpose": "현황 파악형", "ran": true, "screenshots": 3,
    "checks": [ { "id": "C-2", "verdict": "fail", "elements": ["Card/conflict","Card/pending"],
                  "evidence": "카드 5개 동일 radius/그림자, 3초 내 최우선 지목 불가, primary 2개 동등" } ],
    "positive": { "unique_element": false, "dominant_number": true, "form_differs_by_kind": false, "surface_layers": true, "brand_device": false },
    "tasks": [ { "id": "T-1", "result": "찾음|헤맴|불가", "first_click": "..." } ],
    "score": { "ui": 3, "ux": 3, "fit": 1 } } ],
  "diagnosis": "local|direction|taste_gap|repeat", "routing": "...", "retry_count": 1, "escalate_to_human": false }
```

각 FAIL 에 **진단 분류** 필수:
- `local` 국소 결함 — 표면 속성 하나(간격·색 하나)
- `direction` 방향 오류 — 국소 조정으로 안 고쳐지는 구조 문제
- `taste_gap` 취향 공백 — design.md 에 근거 없음 → 사람 질의
- 그리고 같은 이유가 이전 라운드에도 있었는지(`repeat: true/false`, 상태 파일 `c_fail_reasons` 대조)

## 3-F. 라우팅 (메인이 분류, 수정은 `design-maker`)

| 분류 | 처리 |
|---|---|
| A FAIL | 위반 노드만 `design-maker` 수정 → 3-D 재검 |
| C `local` | 그 속성만 수정 → **재캡처(index.md 갱신, 이전 파일과 해시 다름 확인)** → 3-E 재검(2콜 다시). 재캡처 없는 재검은 무효. **B단계로 돌아가지 않는다** |
| C `direction` | `design-draft-html` 2-B 로 회귀, 그 축만 재발산. 상태 파일에 기록 |
| C `taste_gap` | 사용자에게 질의(호출 품질 게이트 4항). 답을 raw 에 기록, brief §4 에 RULE 추가(provisional), design.md 갱신 후 재검 |
| C `repeat: true` (같은 이유 2회) | 요구사항 해석 오류 신호. **0단계로 에스컬레이션** — 사용자에게 "이 부분 해석이 어긋난 것 같습니다" 로 브리핑하고 진행 여부 결정 |
| **사용자 지적 2회 반복** (같은 화면·같은 요소) | **위임 중단.** 메인이 화면 프레임 스크린샷을 직접 열고 `use_figma` 로 해당 노드 트리(fills·opacity·visible·children)를 직접 읽어 원인을 특정한 뒤에만 수정을 다시 위임. 서브의 "확인했습니다" 는 이 시점부터 무시(D-10: 세 번째 지적에서야 메인이 직접 봄) |

라운드 상한 `human_c_stage_rounds_max`(기본 3, **fast 모드 1 + 국소 수정 1회**). 초과 시 남은 FAIL 목록과 함께 사용자에게 넘긴다. "이 정도면 됐다" 는 항상 사람이 정한다.

## 3-G. 최종 확인 (메인 세션)

1. **메인이 직접 본다.** Screens 페이지의 화면 프레임(마스터·컴포넌트 페이지가 아니라 **화면**) 전부를 `get_screenshot` 으로 찍어 `design/verify/shots/final/` 에 저장하고 **Read 로 직접 열어** 본다. 아이콘·텍스트·상태 칩이 실제로 보이는지, 프레임 규격이 같은지, 겹침이 없는지. 이 단계는 서브에 위임하지 않는다. 문제가 보이면 3-F 로 돌아간다.
2. `design/figma.md` 작성: 파일 링크, 페이지 구성, 화면 목록, A/C 최종 결과 요약(3축 자체 채점 포함), PRD 대비 변경 사항(brief §10), 미해결 항목(있다면), 사용 모델·에이전트 목록(제출 요건). **수치는 전부 `design/verify/` 검사 파일에서 인용**하고 서브 완료 보고의 수치는 쓰지 않는다.
3. 사용자에게: 링크 + "A 검사 N/N 통과, C 판정 요약 3줄, 메인이 직접 본 화면 N장, 남은 것 M개. 이대로 마무리할까요?" 승인 원문을 상태 파일 `final_ack` 에 기록.

## 종료조건 (`design-worker`)

- [ ] `design/figma.md` 에 링크 존재, 상태 파일 `figma_url` 일치
- [ ] `figma_nodes.json` (병합본) 유효 JSON, variables·components·screens 섹션, screens 수 == brief §2 화면 수 × 상태 수, 화면별 조각 파일 수 == 화면 수
- [ ] `design/verify/shots/final/` 에 화면 프레임 스크린샷 == 화면 수 × 상태 수, 상태 파일에 메인 직접 확인 기록
- [ ] `audit.json` 의 `passed_machine == true`, `requires_human_review` 항목마다 3-G 에서 사람이 확인한 기록 또는 즉석 검사 결과 존재, `a_report.md` 보완 항목 전건 PASS 또는 사용자 승인된 예외 명시
- [ ] `c_report.md` 마지막 라운드에 미분류 FAIL 0
- [ ] `final_ack.approved == true`

## 하지 않는 것

- 사용자에게 Figma 조작을 요청하는 것(파일 생성·폰트 설치 포함). 불가하면 `BLOCKED` 로 보고.
- 규칙에 없는 취향으로 탈락시키는 것. 그건 `taste_gap` 이다.
