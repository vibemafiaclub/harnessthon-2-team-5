---
name: design-figma-build
description: 3단계 Figma 구현과 검증. 승인된 HTML 초안(design/drafts)과 tokens.json 을 Figma MCP(use_figma)로 실제 파일에 구현한다 — Variables·텍스트 스타일·컴포넌트(variant 포함)·화면 프레임 순. 구현 후 A단계(노드 속성 기계 검사)와 C단계(스크린샷 육안 판정, 2콜 블라인드)를 돌리고, C 실패는 국소/방향/반복 3갈래로 라우팅한다. 최종 산출물은 Figma 파일 링크. design-harness 가 호출하거나 "Figma 에 구현 / 피그마로 만들어" 로 단독 호출.
argument-hint: "<figma file url | --new>"
---

# design-figma-build — Figma 구현 + A/C 검증

> **입력**: `design/drafts/*.html`, `design/drafts/components.md`, `design/tokens.json`, `design/design.md`, `design/decisions.md`, `design/verify/draft_shots/*.png`(2-H 승인 시점의 초안 렌더 — C 2콜의 **비교 대상**). **출력**: Figma 파일(링크는 `design/figma.md`), `design/figma_nodes.json`, `design/verify/a_report.md`, `design/verify/c_report.md` + `c_report.json`, `design/verify/final_review.md`, 검사기 산출 `design/verify/exit_stage3.md`·`exit_stage3_c.md`, full 에서는 `design/verify/c_detector_test.md`.
> **전제**: Figma MCP 연결. 플러그인 스킬 `figma:figma-use`(모든 `use_figma` 호출 전 필수), `figma:figma-generate-library`(컴포넌트), `figma:figma-generate-design`(화면 조립)을 **구현 에이전트가** 로드한다. 이 스킬은 순서와 게이트만 정한다.
> **파일**: URL 이 없으면 `create_new_file` 로 새 파일을 만들고 상태 파일 `figma_url` 에 기록. 사용자에게 파일을 만들어 오라고 시키지 않는다.

## 분담

| 단계 | 누가 |
|---|---|
| 3-A Variables·텍스트 스타일 | `design-maker` |
| 3-B 컴포넌트 + variants | `design-maker` (컴포넌트별 병렬 가능) |
| 3-C 화면 프레임 조립 | `design-maker` (화면별 병렬, **페이지 전환은 호출당 1회**) |
| 3-D A단계 기계 검사 | `design-worker` (read-only `use_figma` 스크립트) |
| 3-E C단계 육안 판정 | `design-judge` × 2 호출(블라인드/대조). full 에서는 C 검출력 시험 1회(`design-maker` 합성 프레임 → 같은 2콜 → 메인 열람) 선행 |
| 3-F 라우팅·수정 | 메인이 분류, 수정은 `design-maker` |
| 3-G 최종 확인 | **메인 세션** |
| 종료조건 | `node scripts/check-figma.js` — `design-worker` 는 **실행만** |

구현 에이전트와 판정 에이전트는 **항상 다른 호출**이다. 구현 에이전트의 "확인했습니다" 는 근거가 아니다.

## 3-A. Variables·텍스트 스타일 (`design-maker`)

브리프: **입력 화이트리스트 = `design/tokens.json`** + `figma_url`. 출력 `design/figma_nodes.json`(variables 섹션). 다른 파일은 읽지 않는다.
- 컬렉션 2개: `primitive`, `semantic`. semantic 은 primitive 를 alias. 이름은 tokens.json 경로를 `/` 로(`color/semantic/text/primary`).
- **scopes 를 반드시 명시**(배경은 FRAME_FILL·SHAPE_FILL, 텍스트 색은 TEXT_FILL, 간격은 GAP 등). 기본 ALL_SCOPES 금지.
- 타이포 scale 9단계(display~overline)는 텍스트 스타일로. **먼저 `figma.listAvailableFontsAsync()` 로 tokens.json 의 `typography.family.body/display` 가 로드 가능한지 확인**한다. 불가하면 `typography.family.fallback` 으로 교체하고, 교체 사실을 `figma_nodes.json` 의 `font_substitution` 과 brief §6 가정 로그에 기록한다. 사용자에게 폰트 설치를 요청하지 않는다.
- 라이트/다크 모드는 brief 에 요구가 있을 때만. 없으면 단일 모드.
- 생성한 variable ID·style ID 전부 반환·기록. 한 호출에 컬렉션 하나씩. **tokens.json 의 Variables 대상 leaf 수 == 만든 Variables 수**(typography·elevation·icon 은 스타일이라 제외) — check-figma F-9c 가 센다.
- **값 직접 대입 금지 — 정본 노드의 바인딩·스타일 id 를 복사한다.** `n.cornerRadius = 16`, `t.fontSize = 17` 처럼 값을 대입하면 그 속성의 변수 바인딩·텍스트 스타일이 **조용히 끊긴다**(test2 실측 2회: radius 변수 4개, `type/body-large` 스타일). 고칠 때는 정본 노드(같은 컴포넌트의 variant)의 `boundVariables`·`textStyleId` 를 읽어 `setBoundVariable`·`setTextStyleIdAsync` 로 같은 것을 붙인다. 값(#hex)으로 변수를 역추적하지 않는다 — alias 사슬 끝의 primitive 가 잡힌다(A검사 15).
- **바인딩 paint 의 리터럴 color 도 변수 값과 같게 쓴다.** Figma 는 리터럴을 그대로 렌더한다 — 바인딩만 걸고 리터럴을 검정으로 두면 검정으로 보인다(팀 디자이너 실측 사고). **audit-core 는 리터럴∈팔레트(`color_allowlist`)와 바인딩 존재(`style_bound`)를 따로 본다 — 리터럴=변수값 대조는 미구현이라**(serializeNode 가 boundVariables 의 키만 직렬화한다) 바인딩은 primary 인데 리터럴이 팔레트 안의 다른 색이면 둘 다 통과한다. **3-A 직후 스크린샷 렌더가 유일한 방어**다.
- 날짜·카운트·D-day·시간 스타일은 tabular numerals 를 켠다. 면 전용 색 변수는 설명에 "면 전용 — 텍스트 금지".
- **호출 예산**: Figma MCP 는 하루 200회·분당 10회(Pro 좌석 기준). 시작 전에 예상 호출 수를 상태 파일에 적고, 노드를 하나씩 만지지 말고 화면·컴포넌트 묶음 단위로 실행한다. **토큰·변수를 바꾼 직후에는 반드시 스크린샷을 렌더한다** — 노드 속성으로는 대비 사고가 안 잡힌다(위 리터럴 사고도 스크린샷에서만 보인다).

## 3-B. 컴포넌트 (`design-maker`)

브리프: **입력 화이트리스트 = `design/drafts/components.md`, 해당 컴포넌트가 쓰인 초안 HTML 1개, `tokens.json`, `figma_nodes.json`, `.claude/skills/design-draft-html/references/aesthetic_rules.md`**(슬롭·균일함 카탈로그 — 만들면서 피한다). 아이콘 컴포넌트 브리프에는 `tokens.json` 의 `icon.definition` 문장을 **그대로** 넣는다 — 스타일 이름(duotone 등)만 넘기면 제작 에이전트가 해석해 틀린다(D-38: 반투명 배경 칩).
- 컴포넌트마다 별도 호출, 병렬 가능. 페이지 `Components` 에 배치. **배치 좌표는 앞 세트의 `y + height + 여백(64)` 으로 계산**한다 — 고정 간격으로 나열하면 키 큰 세트가 다음 라벨을 덮는다(실측). 각 호출은 자기 산출을 **`design/figma_nodes.<컴포넌트슬러그>.json` 별도 파일**에 쓰고, 병합은 3-B 종료 후 `design-worker` 단일 호출이 한다(D-8: 공유 JSON 동시 쓰기로 파일 무효화 실측).
- **크기 sanity**: 컴포넌트 크기와 패딩은 초안 HTML 의 대응 요소 ±30% 이내. `spacing.scale` 은 **키가 아니라 값**을 읽는다(실측: 인덱스 20 을 20px 로 착각해 padding 80/64px, 버튼 343×155px).
- **아이콘**: 벡터 위에 불투명 fill 을 가진 프레임을 두지 않는다. 아이콘 컨테이너 fill 은 없음 또는 투명(뒤에 있어도 회색 상자로 보인다 — D-33). **탭바**: 배경은 surface 토큰 + 상단 1px border 또는 위쪽 그림자, 아이콘 뒤 상자 없음, 활성 탭 표시는 아이콘·라벨 색 변경 또는 브랜드 계열 옅은 알약(`Indicator`) 하나. 네모 테두리로 활성을 표시하지 않는다. 제작 후 **인스턴스를 화면 프레임 안에 넣은 상태**로 스크린샷을 찍어 확인한다 — 마스터에서는 정상으로 보이고 인스턴스에서만 덮이는 사례가 실측됐다(D-10).
- 모든 fill·stroke·gap·padding·radius 는 **Variables 바인딩**. 하드코딩 색 0.
- 상태는 variant 로: components.md 에 적힌 상태(default/hover/pressed/disabled, 상태 칩은 상태 N종, 목록 행은 normal/empty-placeholder/long-text). 초안 HTML 의 상태 3종이 그대로 variant 가 된다.
- 레이어 이름은 semantic(`Card/MeetingRow`, `Chip/Status`), `Frame 123` 류 0.
- auto-layout 필수. 절대 좌표 배치 금지.
- 컴포넌트 description 에 "어느 화면에서 쓰이는지" 한 줄.
- **반환값에 구조 실측치 필수**: 컴포넌트마다 `{id, children_count, vectors_visible, size, container_fill, opacity}`. ID 만 돌아오면 미완료로 간주하고 되돌린다(D-15).

## 3-C. 화면 조립 (`design-maker`)

브리프: **입력 화이트리스트 = `design/drafts/screen_<nn>.html`, `components.md`, `figma_nodes.json`, `design.md`, `.claude/skills/design-draft-html/references/aesthetic_rules.md`** (§5 의 이 화면 1등 정보를 문장으로 병기).
- 페이지 `Screens`, 화면마다 프레임 3개(`<nn> <이름> / normal`, `/ empty`, `/ long`). 목록형은 `/ loading` 추가. 초안 HTML 에 `error` 상태 섹션(`data-state="error"`)이 있으면 `/ error` 도 만든다 — 상태 수는 초안의 `data-state` 수와 같아야 한다(check-figma F-9a).
- 3-B 컴포넌트 **인스턴스**로 조립. 새로 그리는 요소는 components.md 에 없는 것만, 그리고 그것도 Variables 바인딩.
- 프레임 위치는 겹치지 않게(오른쪽으로 순차). 화면 간 이동은 프로토타입 연결(brief §2 진입 경로)까지 — §2 의 간선(화면 A → 화면 B)마다 reaction 1개. 3-D 16 이 번들 `reactions[]` 로 대조한다.
- 화면별 호출을 병렬로 내되 **한 호출 안에서 페이지 전환은 1회**.
- 생성 노드 ID → **화면별 별도 파일 `design/figma_nodes.<화면슬러그>.json`**. 병합은 3-C 종료 후 `design-worker` 단일 호출(D-8). 병합본 형태는 `scripts/check-figma.js` 헤더 주석의 정본(`screens[].frames[].{state,id,name,primary_action}`)을 따른다.
- 프레임 규격은 `design.md` §2 의 값 — **폭 390 고정 + 상태바 + 탭바, 높이는 내용에 맞춰(최소 844, hug 허용)**. 현업 관행대로 프레임이 길어지고 탭바는 맨 아래, 프로토타입에서 탭바·고정 바에 "fix position when scrolling". clip content 로 내용을 잘라 숨기지 않는다(D-34 정정).
- **1등 정보 노드는 `Info/Top` 으로 이름 짓는다**(초안 `data-role="top-info"` 와 1:1) — 첫 화면 안, 그 안의 글자가 첫 화면에서 가장 크다. A검사 17 이 센다(U-5). 결과·확인 화면처럼 1등 정보가 없으면 이름 접미사 `[no-top-info]`.
- **주 행동 노드는 `Action/Primary` 로 이름 짓고**, 첫 화면(y+height ≤ 프레임 높이) 안에 있거나 `Bar/Action` 하단 고정 컨테이너(프로토타입 "fix position when scrolling") 안에 둔다. 잘리거나 스크롤 뒤에 있으면 A검사 13 FAIL. 초안의 `data-role="primary-action"` 수 × 상태 수 == `Action/Primary` 수(check-figma F-9b).
- 첫 화면 경계를 보이고 싶으면 y=844 에 `Guide/Fold` 점선 하나(선택). **같은 화면을 두 벌(기기 크기 + full) 만들지 않는다** — 현업에서 드문 방식이고 두 벌이 어긋난다(D-34).

## 3-D. A단계 — 기계 검사 (`design-worker`)

**결정론 검사기 먼저, 즉석 스크립트는 보완.** (팀 디자이너 A 의 대전제 채택: 프롬프트는 준수를 보장하지 못한다, 검사기만 보장한다.)

1. **번들 생성**(`design-worker`): `node scripts/make-figma-audit.js --project design/project.rules.json --stage design --page Screens --out design/verify/figma_audit.js`. 규칙을 Figma 안으로 들여보내는 방식이다 — `use_figma` 반환값은 약 20KB 에서 잘리고 로컬 파일에 쓸 수 없어 노드 덤프(실측 553KB)를 밖으로 꺼낼 수 없다(D-17). 컴파일 실패(종료 2)면 화면이 아니라 규칙 문제 → 1단계로.
2. **Figma 안에서 판정**(`design-worker`, `figma-use` 스킬 로드 후): 번들을 **페이지마다 하나씩** 만들어(`--page Screens`, `--page Components`) 각각 `use_figma` **1회**로 실행한다(호출당 페이지 전환은 1회가 원칙. 사람이 프레임을 선택해 둘 필요 없다 — 페이지의 자식 전부를 순회한다). 반환 JSON(수 KB)을 `design/verify/audit_screens.json`·`audit_components.json` 에 저장하고 `node scripts/audit.js --render design/verify/audit_screens.json,design/verify/audit_components.json` 으로 **병합** 리포트를 만든다. variant 규칙은 Components 페이지에서만 발동하므로 두 페이지를 다 돌리지 않으면 리포트에 `적용 대상 0개 (N/A)` 로 표시된다 — N/A 는 통과가 아니다. 종료 코드 0 통과(`passed_machine`) / 1 미통과. 반환에 `error` 가 있으면 그것이 결과다. 반환의 `text_inventory[]`(프레임별 텍스트)·`reactions[]`(프레임 간 간선)는 아래 15·16 의 재료다 — `text_inventory_truncated`·`reactions_truncated` 가 true 면 그 항목은 N/A 로 적는다.
3. 게이트 판정은 `passed_machine`(구현된 검사 기준 blocker 0)으로 한다. 리포트의 `unchecked_blockers`(검사기 미구현 타입: contrast 계열·image_fill·text_overflow·reuse_ratio)는 **통과도 실패도 아니다** — 아래 즉석 스크립트로 보완 측정하고, 그래도 못 본 blocker 는 `requires_human_review` 목록으로 3-G 사람 게이트에 올린다. "못 봤다"를 "통과했다"로 적지 않되, 미구현 때문에 문이 영원히 안 열리는 상태도 만들지 않는다(실측: `passed` 하나로 묶었을 때 어떤 프로젝트도 통과 불가).
4. `severity: blocker` 만 게이트를 막는다. `warning` 은 기록만. 심각도를 안 나누면 사소한 위반으로 무한루프에 빠진다.

출력 `design/verify/a_report.md`(audit.json 요약 + 보완 항목 / 기준값 / 측정값 / PASS·FAIL·N/A / 위반 노드 ID / 실행 스크립트 원문). **≤`agent_report_lines_max`줄** — 위반 노드 ID 가 많으면 항목당 10개까지만 적고 나머지는 개수만. N/A 항목은 `requires_human_review` 에 같이 올린다.

보완 항목(검사기 미구현분 + 우리 실측분. 항목은 고정, 기준값은 design.md·tokens.json·drafts 에서):
1. **팔레트 일관성** — 모든 fill/stroke 가 Variables 바인딩 **이고 리터럴 color 가 변수 값과 일치**. 예외: 이미지 fill. (audit.js `color_allowlist` + 즉석 바인딩 검사. 리터럴=변수값 대조는 즉석 스크립트가 `boundVariables` 의 변수를 `getVariableById` 로 풀어 비교한다 — 번들은 이것을 못 본다, 3-A 참조)
2. **타이포 스타일 재사용** — 텍스트 노드 전부 텍스트 스타일 적용. 미적용 0.
3. **spacing 그리드** — 모든 gap/padding 이 `spacing.scale` 값. 예외 목록은 design.md exception.
4. **컴포넌트 재사용률** — Screens 페이지의 시각 요소 중 인스턴스 비율. 기준값 design.md(없으면 ≥70% 를 provisional 기준으로 쓰고 명시).
5. **레이어 네이밍** — 두 규칙. `layer-naming-semantic`: 컨테이너(FRAME·COMPONENT·COMPONENT_SET·INSTANCE, 루트 화면 프레임·인스턴스 내부 제외)는 `^[A-Z][^/]*(/[^/]+)*$` — 첫 세그먼트만 대문자 시작, 뒤는 자유(`Card/MeetingRow`, `Tab/home`, `Tag/신랑측 지훈`, `Row/Meeting - 대학 동기 모임` 통과; `person-row`·`chip`·`btn-ok` 위반). `layer-naming-auto`: 전 노드에 `Frame \d+|Rectangle \d+|Group \d+` 0건. 둘 다 warning — 사람 게이트가 본다.
6. **variant 커버리지** — components.md 의 상태가 variant 로 전부 존재.
7b. **아이콘 내부 이물** (`icon_foreign_fill`, audit.js 구현, warning) — 아이콘 컨테이너 안에 VECTOR/BOOLEAN_OPERATION 외의 보이는 fill 을 가진 RECTANGLE·FRAME·ELLIPSE 가 있으면 위반. **opacity 와 무관**(0.14 배경 칩도 회색 상자로 보인다 — D-38). 덮개(D-10)·배경 칩 둘 다 이 한 줄로 걸린다. 예외: 활성 `Indicator`. **같은 아이콘 인스턴스가 3개 이상 반복되면(탭바·목록 행) 그 히트는 blocker 로 승격**(`blocker_if_repeats: 3`) — 반복 컴포넌트의 이물은 사실상 항상 실수이고 warning 이면 `passed_machine` 을 막지 않아 지나간다(D-38 실측: 사용자 4회 지적까지 아무도 못 잡음). 한 번 쓰이는 장식 아이콘은 warning 유지.
7. **아이콘 덮임·배경** — 아이콘 컴포넌트·인스턴스 안에 `visible` 한 VECTOR/BOOLEAN_OPERATION 이 ≥1 이고, 그 벡터의 조상 중 벡터 영역을 덮는 불투명 fill(opacity ≥ 0.9, 크기 ≥ 벡터) 을 가진 FRAME/RECTANGLE 이 없다(D-10: 마스터는 정상, 인스턴스만 네모). **아이콘 컨테이너 프레임(`Icon/*`)에 보이는 fill 이 있으면 FAIL** — 벡터 뒤에 있어 아이콘은 보이더라도 회색 네모가 남는다(D-33: 탭바 4개 전부 회색 상자). 예외는 활성 탭 표시(`Tab/*` 의 `Indicator` 노드, 화면당 1개)뿐. 화면 프레임 안의 **인스턴스**를 검사 대상으로 한다.
8. **크기 sanity** — 각 컴포넌트 인스턴스의 width/height/padding 이 `drafts/components.md` 에 적힌 초안 HTML 대응 요소 값의 ±30% 이내. 토큰에서 왔는지가 아니라 값이 말이 되는지를 본다(실측: 80px 도 scale 에 있으면 PASS 였다).
9. **프레임 규격** — Screens 페이지의 모든 화면 프레임이 `design.md` §2 의 폭이고 상태바·탭바가 있다. 높이는 ≥844 이며 내용에 따라 달라도 된다.
10. **고정 요소 겹침** — 하단 탭바·고정 액션바가 있으면 스크롤 콘텐츠 하단 여백이 그 높이 이상. 콘텐츠가 가려지면 FAIL.
11. **터치 영역** — 프로토타입 연결(reactions)이 있는 노드는 blocker(`touch-target-min`), 이름으로 추정한 노드(Button·Tab·Input·Checkbox 등, 인터랙티브 조상 없음)는 warning(`touch-target-min-inferred`)으로 3-G 사람 게이트가 본다. 시안에 무엇이 눌리는지는 기계가 이름으로 확신할 수 없다. 시각 크기를 키우지 말고 패딩·히트영역으로.
12. **텍스트 오버플로** — 도메인 최장 문자열·최대 수치를 넣은 `long` 프레임에서 잘림·겹침 0.
9b. **탭바는 IA 의 성질이다** — brief §2 진입 경로가 '탭 / 앱 실행 직후' 인 루트 화면에만 탭바를 두고, 행 탭·+ 버튼·완료 직후·초대 링크로 들어가는 push·modal·외부 화면에는 두지 않는다(작업 중 다른 탭으로 이탈 방지, iOS·Android 공통 관행). A검사 9 는 `make-figma-audit --brief design/brief.md`(또는 `--tab-screens 01,03`)로 그 목록을 받아 **양방향**으로 본다 — 탭 화면에 탭바 없음 / 비탭 화면에 탭바 있음 둘 다 FAIL. 프레임 이름 앞 두 자리 번호가 brief §2 의 # 와 같아야 매칭된다. 상태바는 전 화면 필수. **FRAME 에는 description 이 없다** — 표시가 필요한 예외(`[no-primary]`·`[no-tabbar]`)는 프레임 이름 끝에 대괄호 접미사로 적고, 파일명·상태 파싱은 대괄호 이후를 버린다(check-figma).
13. **주 행동 가시성** — 화면 프레임마다 `Action/Primary` 가 정확히 1개(없으면 프레임 이름 접미사 `[no-primary]`), 그 노드의 절대 y+height ≤ 프레임 높이 이거나 조상에 `Bar/Action` 존재. 잘림·스크롤 뒤 = FAIL (D-26).
14. **내용 절단 없음** — 화면 프레임 안 모든 자식의 절대 y+height ≤ 프레임 높이(clip content 로 잘린 노드 0). 잘려 있으면 FAIL — 프레임을 늘린다.
15. **승인본 대조(충실도)** — `node scripts/check-figma.js` F-9 가 센다(판정이 아니라 산술 — judge 2콜은 계속 블라인드): a) drafts 각 화면의 `data-state` 수 == 그 화면의 프레임 수 b) `data-role="primary-action"` 수 × 상태 수 == `Action/Primary` 수 c) tokens.json Variables 대상 leaf 수 == `figma_nodes.variables` 수 d) 번들 `text_inventory` 가 있으면 초안 텍스트 집합 일치율 ≥90%(없거나 잘렸으면 N/A). a_report 에는 F-9 의 a~d 행을 기준값·측정값과 함께 옮겨 적는다.
16. **흐름 연결** — brief §2 진입 경로의 간선(화면 A → 화면 B)마다 번들 `reactions[]`(`from_frame` → `to_frame`)에 대응 간선이 있는가. 기준값 = §2 간선 수, 측정값 = 일치 간선 수, 누락 간선 목록. 번들이 `reactions` 를 돌려주지 않거나 `reactions_truncated` 면 **N/A 표기**(통과 아님 — `requires_human_review` 로 3-G 에 올려 사람이 프로토타입을 눌러 본다). 검사기(check-figma)에 이 대조가 들어오기 전까지는 worker 즉석 스크립트가 센다.

FAIL 항목은 위반 노드 ID 목록과 함께 3-F 로. 판정자는 고치지 않는다.

## 3-E. C단계 — 육안 판정 (`design-judge` × 2)

화면 프레임마다 `get_screenshot` 으로 **단명 URL** 을 받아 `curl -L -o design/verify/shots/<nn>_<state>.png <url>` 로 저장(`design-worker`; D-44 실측 — `get_screenshot` 은 기본적으로 `figma.com/api/mcp/asset/<uuid>.png` URL 을 돌려주고 인증 없이 curl 이 된다. `node.exportAsync` 의 base64 는 응답 한도에서 잘리므로 쓰지 않는다. 파일 존재·크기·mtime 이 캡처의 증거이고 index.md 에 적은 시각은 증거가 아니다 — CR-3 은 mtime 을 읽는다, D-42). **캡처마다 `design/verify/shots/index.md` 에 한 행 `| 파일 | 노드 id | 캡처 시각(ISO) | lastModified(ISO) | sha |` 를 append** 하고(lastModified 는 Plugin API 로 파일 수정 시각을 읽을 수 없으므로 **A검사 번들의 `generated_at`**(마지막 쓰기 이후·캡처 이전에 Figma 를 읽은 시각)을 쓴다 — 현재 시각을 넣으면 캡처보다 뒤가 되어 전건 stale 이 난다, test2 실측)(같은 파일을 재캡처하면 행을 덮어쓰지 않고 추가 — 마지막 행이 최신. `check-c-report.js` CR-3 이 이 표를 읽는다), 판정 브리프에 이 index 를 넣는다. 판정자는 캡처 시각이 Figma `lastModified` 보다 앞서면 판정하지 않고 **`C_STALE`** 을 반환한다(D-29 실측: 수정 전 캡처로 판정해 "이미 고친 결함" 3건을 상위로 보고 — 판정은 정확했고 대상이 낡았을 뿐이라 리포트만으로는 구분이 안 된다). 수정 후 "재캡처" 라며 찍은 파일이 이전 파일과 바이트 동일하면 재캡처가 아니다 — worker 가 `shasum` 으로 대조해 같으면 FAIL(index 의 sha 열이 그 근거다).

**C 검출력 시험(프로젝트당 1회, full 한정)** — 캡처 뒤, 첫 2콜 전에 한다. 판정자가 심어 놓은 슬롭을 실제로 잡는지를 시험하지 않으면 "FAIL 0" 이 검출력 0 과 구분되지 않는다(A검사는 D-15 시험 2 로 검출력을 확인했지만 C 는 한 번도 없었다). 절차: ① `design-maker` 가 `__TEST__` 페이지에 합성 프레임 1개(규격은 화면 프레임과 동일)를 만든다 — **보라→파랑 그라디언트 배경 + 이모지 아이콘 3개 + 동일 그림자 카드 3열 + `#000` 본문 텍스트**. 반환값에 구조 실측치(그라디언트 stop 색 2개·이모지 텍스트 노드 3개의 characters·카드 3개의 effects 동일 여부·본문 fill hex)를 요구한다 — ID 만 돌아오면 만든 것이 아니다(D-15). ② `design-worker` 가 그 프레임을 `design/verify/shots/__test__.png` 로 캡처하고 index.md 에 같은 형식으로 기록한 뒤 **실제 화면 PNG 사이에 섞어**(파일명·순서에서 시험임이 드러나지 않게 브리프에서는 `<nn>` 번호를 하나 더 부여) 2콜 판정자에게 준다. ③ 판정자가 그 프레임을 **C-5 체크 ≥2 로 FAIL(`direction`)** 하지 않으면 그 라운드는 무효 — 결과 `C_DETECTOR_FAIL` 을 상태 파일 `stages.figma.c_detector` 에 기록하고, 판정 브리프(c_checks 전달·PNG 열람 지시·화이트리스트)를 수정한 뒤 재판정한다. 실제 화면의 판정 결과는 검출력이 확인될 때까지 채택하지 않는다. ④ 리포트 `design/verify/c_detector_test.md`(합성 프레임 실측치·판정자가 지목한 C-5 항목·결과 PASS/`C_DETECTOR_FAIL`)를 **메인이 Read 로 읽은 뒤에** `__TEST__` 페이지와 `__test__.png` 를 철거한다(D-15 순서: 리포트가 파일로 확정되고 메인이 읽은 뒤 철거. 서브 재실행으로 리포트가 덮이지 않게 번호를 붙여 보존). 시험 프레임은 종료조건 개수 대조(F-2·F-3)에서 제외되도록 철거 뒤에 최종 캡처(3-G)를 찍는다. **fast 는 생략**하고 brief §6 가정 로그에 'C 검출력 미시험(fast)' 한 줄을 남긴다. 그 다음 **2콜**:

**1콜 블라인드** (`design-judge`, brief·design.md 를 **주지 않는다**): PNG 만 주고 "시선이 가는 순서대로 요소 3개 + 각각 근거(위치·크기·색)" → `design/verify/c_first_impression.json`(고정 스키마: `{ "screens": [ { "id": "02_home", "file": "02_normal.png", "first": [ { "rank": 1, "element": "...", "evidence": "위치·크기·색" } ] } ] }` — 2콜이 `top_info.blind_first` 에 rank 1 의 element 를 그대로 옮긴다). 정답을 알려 주고 묻는 것은 유도 질문이다.

**2콜 대조** (`design-judge`, 별도 호출): 입력 화이트리스트 = 1콜 결과 + `design.md` + PNG 전부 + **`design/verify/draft_shots/*.png`**(2-H 승인 시점의 초안 렌더 — **비교 대상**: 같은 화면·같은 상태의 초안과 나란히 놓고 요소 구성·1등 정보 위치가 같은지 본다) + **`.claude/skills/design-figma-build/references/c_checks.md`**(판정 기준 원본 — 다른 곳에서 기준을 새로 만들지 않는다). **decisions.md·제작 브리프·서브 완료 보고는 여전히 주지 않는다** — 판정자는 제작 의도를 듣지 않고, 설계 의도 문장이 섞여 있어도 판정 근거로 쓰지 않는다. 초안 렌더는 "무엇이 승인됐는가" 의 사실이지 의도 설명이 아니다. 절차: ①화면마다 **1차 목적 선언**(빠른 처리형/현황 파악형/선택형/입력형 — design.md §7·§5) ②c_checks 의 부정형 C-1~C-10 을 순서대로(C-10 은 §5 1등 정보 vs 1콜 1순위) ③전부 통과한 화면만 **긍정형 매력 판정**(c_checks §2 의 7키 전부 boolean) — **긍정형 `false` 는 그냥 두지 않는다**: `brand_device`·`unique_element` 가 false 인데 design.md §10 브랜드 장치 칸이 비어 있으면 `taste_gap`, 그 외의 false 는 `direction` 으로 `checks[]` 에 fail 항목을 함께 낸다(id 는 `POS-<키>`). 예외 승인 없는 false 는 종료를 막는다(check-c-report CR-6) ④3축 매핑. 스크린샷을 못 얻은 화면은 `C_NOT_RUN` 이며 통과가 아니다. 판정은 통과/실패만 — "대체로 괜찮음" 같은 중간값 금지. 판정은 **채점 3축**으로 묶어 리포트한다:
- §5 1등 정보 == 1콜의 1순위인가 (화면별 — `top_info.{declared, blind_first, match, diagnosis}` 로 기록, 불일치는 C-10 fail)
- 초안 렌더 대비 요소 구성·주 행동 위치가 같은가 (화면별 — `fidelity.{elements_match, primary_position_match}`. 다르면 C-10 또는 C-6 fail 로 낸다. 초안 자체가 잘못됐다고 판정하지 않는다 — 승인본이 기준이다)
- §4C 각 RULE (근거: 파일명 + 위치)
- 하네스 내장 C 항목: 섹션 간 색온도 일관성 / 위계가 한눈에 읽히는가 / 여백 리듬 체감 일관성 / 밀도 번잡함 / 클리셰·AI 슬롭 여부 / empty·long·error 상태의 실제 완성도
- **SLOP-SWEEP 1건 고정**: "규칙에 걸리지 않지만 AI 가 만든 것처럼 보이는 요소" 를 능동 열거. 고치지 말고 `취향 공백` 으로 분류. `checks[]` 에 id `SLOP-SWEEP` 항목으로 화면마다 1개(없으면 `verdict: pass` + `evidence: "지목 없음 — 본 요소: …"`). check-c-report CR-10 이 존재를 센다.
- **전량 대조 시트**: 행=화면, 열=구분 방식/라운딩/강조색/본문 크기. 불일치 셀 열거.
- **UX 직관 (§7 핵심 과업)**: 과업 3개를 스크린샷 순서대로 따라가 `찾음/헤맴/불가`. 첫 클릭 위치가 화면에서 3순위 안에 보이는가(1콜 결과와 대조) — 안 보이면 `헤맴`. 과업마다 `role`(design.md §7 의 역할 열, 없으면 brief §2 역할 열의 첫 역할)을 적는다. `불가` 1건 또는 `헤맴` 2건이면 FAIL(check-c-report CR-7).
- **적합성 (§8)**: 이 화면 세트가 그 도메인의 실제 서비스처럼 보이는가. 범용 관리자 템플릿·기본 컴포넌트 나열처럼 보이게 하는 요소를 지목. §8 의 "함정" 항목 각각 해당 여부.

**자체 채점**: UI 심미 / UX 직관 / 적합성 각각 1·3·5 (1 = AI 슬롭처럼 보임, 3 = 신입 디자이너, 5 = 시니어). 3 미만인 축은 그 이유를 FAIL 항목으로 반드시 낸다. 점수만 적고 이유가 없는 채점은 무효 — **score<3 은 check-c-report CR-5 가 센다**(그 축에 매핑된 검사의 fail 이 하나도 없으면 FAIL). 점수는 3-G 에서 사용자에게 쉬운 말로 고지된다.

출력 `design/verify/c_report.md` (**≤`agent_report_lines_max`줄**, 화면당 FAIL 은 심각한 순 ≤5건. 줄 상한 때문에 md 는 요약이고 **정본은 json 이다**) **+ `design/verify/c_report.json`** (고정 스키마 — 메인과 `check-c-report.js` 가 파싱한다):

```json
{ "screens": [ { "id": "02_home", "purpose": "현황 파악형", "ran": true, "screenshots": 3, "states": ["normal", "empty", "long"],
    "checks": [ { "id": "C-2", "verdict": "fail", "diagnosis": "direction", "repeat": false, "elements": ["Card/conflict","Card/pending"],
                  "evidence": "카드 5개 동일 radius/그림자, 3초 내 최우선 지목 불가, primary 2개 동등" },
                { "id": "SLOP-SWEEP", "verdict": "pass", "elements": [], "evidence": "지목 없음 — 본 요소: 상태 칩·D-day 숫자·탭바" } ],
    "positive": { "unique_element": false, "dominant_number": true, "form_differs_by_kind": false, "surface_layers": true,
                  "brand_device": false, "visual_elements_justified": true, "looks_professional": false },
    "tasks": [ { "id": "T-1", "role": "예비부부", "result": "찾음|헤맴|불가", "first_click": "..." } ],
    "score": { "ui": 3, "ux": 3, "fit": 1 },
    "top_info": { "declared": "design.md §5 문장", "blind_first": "1콜 rank 1 element", "match": true, "diagnosis": "" },
    "fidelity": { "elements_match": true, "primary_position_match": true } } ],
  "diagnosis": "local|direction|taste_gap|repeat", "routing": "...", "retry_count": 1, "escalate_to_human": false }
```

`positive` 7키는 c_checks §2 의 7항목과 같은 순서·같은 이름이다. 키를 빼거나 boolean 이 아닌 값을 쓰면 CR-6 FAIL.

각 FAIL 에 **진단 분류** 필수:
- `local` 국소 결함 — 표면 속성 하나(간격·색 하나)
- `direction` 방향 오류 — 국소 조정으로 안 고쳐지는 구조 문제
- `taste_gap` 취향 공백 — design.md 에 근거 없음 → 사람 질의
- 그리고 같은 이유가 이전 라운드에도 있었는지(`repeat: true/false`, 상태 파일 `c_fail_reasons` 대조)

## 3-F. 라우팅 (메인이 분류, 수정은 `design-maker`)

| 분류 | 처리 |
|---|---|
| A FAIL | 위반 노드만 `design-maker` 수정 → 3-D 재검 |
| C `local` | 그 속성만 수정 → **재캡처(index.md 행 추가, 이전 파일과 해시 다름 확인)** → 3-E 재검(2콜 다시). 재캡처 없는 재검은 무효. **B단계로 돌아가지 않는다** |
| C `direction` | `design-draft-html` 2-B 로 회귀, 그 축만 재발산. 상태 파일에 기록. **fast 에서도 `direction` 1건에 한해 2-B 재발산 1회 허용** — 축 선택은 사용자를 부르지 않고 `ai_pick` 자동 채택 + `state.human_gates.delegations[]` 에 `{stage:"draft", item, kind:"budget60", default_taken}` 기록(사람 개입 지점은 늘지 않는다). 2건 이상이면 상한 초과 브리핑으로 |
| C `taste_gap` | 사용자에게 질의(호출 품질 게이트 4항, 결정형 — 추천을 질문 문장 안에 먼저). **최신 스크린샷 첨부 필수** — `shots/index.md` 에 기록된, Figma `lastModified` 이후에 찍힌 파일이어야 한다. 스크린샷 없는 taste_gap 질의는 게이트 미통과 — 보내지 않는다. **가능하면 좌/우 2안**: `design-maker` 가 그 속성만 다른 2안을 만들고 `design-worker` 가 좌/우 PNG 로 찍어 "어느 쪽이 더 편한가요? 둘 다 아니어도 됩니다" 로 묻는다(2안을 만들 시간이 없으면 현재 화면 1장 + '이 부분이 맞는지' 확인형). 문구는 `node scripts/lib/forbidden-words.js` 0건. raw 에 `H-nn [figma/taste_gap]` + 4줄 골격, 답은 `W-C-<n>: <left|right|none> — <이유 원문>`. 답을 brief §4 에 RULE 추가(provisional, plain 필드 포함), design.md 갱신 후 재검 |
| C `repeat: true` (같은 이유 2회) | 요구사항 해석 오류 신호. **0단계로 에스컬레이션** — 사용자에게 "이 부분 해석이 어긋난 것 같습니다" 로 브리핑하고 진행 여부 결정(kind `cap_exceeded`, 결정형) |
| **처리 원장 (전건, D-40)** | C 리포트의 `fail` 은 분류를 불문하고 **전건** `design/verify/c_routing.md` 표에 한 행씩 남긴다: `| 화면 id | C-id | 분류 | 처리(수정 / 처리 안 함) | 근거 |`. '수정' 은 근거에 재캡처 파일명 또는 커밋 해시, '처리 안 함' 은 사유. `check-figma` F-11 이 `c_report.json` 의 fail 과 대조한다 — **리포트를 받아 보고만 하는 것은 라우팅이 아니다**(검증 2 에서 C 가 잡은 CTA 잘림이 처리되지 않은 채 넘어갔다) |
| **사용자 지적 2회 반복** (같은 화면·같은 요소) | **위임 중단.** 메인이 화면 프레임 스크린샷을 직접 열고 `use_figma` 로 해당 노드 트리(fills·opacity·visible·children)를 직접 읽어 원인을 특정한 뒤에만 수정을 다시 위임. 서브의 "확인했습니다" 는 이 시점부터 무시(D-10: 세 번째 지적에서야 메인이 직접 봄) |

라운드 상한 `human_c_stage_rounds_max`(기본 3, **fast 모드 1 + 국소 수정 1회 + `direction` 1건 2-B 재발산 1회**). 초과 시 남은 FAIL 목록과 함께 사용자에게 넘긴다 — 결정형 호출(kind `cap_exceeded`, raw `H-nn [figma/cap_exceeded]` + 4줄 골격). **FAIL 목록은 C-n·A검사 번호를 그대로 보이지 않고 쉬운 말 한 줄로 바꿔 보인다**(0-H 병기 규칙과 동일 — 예: `C-7 카드 균일` → "카드가 전부 같은 모양이라 중요한 것이 안 보입니다". `node scripts/lib/forbidden-words.js` 0건), "진행 / 보정 / 중단" 중 하네스 추천을 질문 문장 안에 먼저 밝힌다. "이 정도면 됐다" 는 항상 사람이 정한다.

## 3-G. 최종 확인 (메인 세션)

1. **메인이 직접 본다.** Screens 페이지의 화면 프레임(마스터·컴포넌트 페이지가 아니라 **화면**) 전부를 `get_screenshot` 으로 찍어 `design/verify/shots/final/` 에 저장하고 **Read 로 직접 열어** 본다. 아이콘·텍스트·상태 칩이 실제로 보이는지, 프레임 규격이 같은지, 겹침이 없는지. 이 단계는 서브에 위임하지 않는다. 본 것은 **`design/verify/final_review.md` 에 형식 고정으로 남긴다** — 근거를 적으려면 열 수밖에 없게 한다:
   - 스크린샷마다 1행: `| 파일명 | 노드 id | 본 것(아이콘/잘림/상태칩/규격/겹침) | PASS·FAIL |` — 행 수 == `shots/final/` PNG 수, '본 것' 열에는 다섯 항목 중 실제로 확인한 것을 쓴다(빈 칸·"확인" 한 단어는 FAIL).
   - `requires_human_review` 규칙마다 1행: `| 규칙 id | 확인 방법 | 결과 |` — 확인 방법은 즉석 측정(대비 계산값 등) 또는 '스크린샷 `<파일명>` 육안'. 결과가 FAIL 이면 `final_ack.exceptions[]` 에 사용자 예외 승인이 있어야 종료된다.
   - 상태 파일 `human_gates.final_ack.final_review.file = "design/verify/final_review.md"`. check-figma F-5·F-6 이 이 표를 센다. 문제가 보이면 3-F 로 돌아간다.
2. `design/figma.md` 작성: 파일 링크, 페이지 구성, 화면 목록, A/C 최종 결과 요약(3축 자체 채점 포함), PRD 대비 변경 사항(brief §10), 미해결 항목(있다면), 사용 모델·에이전트 목록(제출 요건). **수치는 전부 `design/verify/` 검사 파일에서 인용**하고 서브 완료 보고의 수치는 쓰지 않는다.
3. 사용자에게 (결정형 호출 kind `final_ack` — 부르기 전에 raw 에 `H-nn [figma/final_ack]` + 4줄 골격, `state.human_gates.calls[]` 기록). 메시지 내용 고정: **링크 + "A 검사 N/N 통과" + 보기 좋음 / 쓰기 쉬움 / 이 서비스다움 각 1·3·5 를 쉬운 말로**(1 = AI 가 만든 티, 3 = 신입 디자이너 수준, 5 = 시니어 수준 — c_report.json `score` 의 ui/ux/fit) **+ 3 미만인 축마다 그 이유 FAIL 을 쉬운 말 1줄씩 + 남은 것 M개(미해결·예외 후보) + 더 다듬을 때 예상 소요**(라운드 1회 ≈ 실측 소요) + 호출 골격 4항:
   ```
   결정할 것: 이대로 마무리할지, 한 번 더 다듬을지
   선택지: ① 이대로 마무리 ② 더 다듬기(<3 미만 축> 을 <예상 소요>) (하네스 추천: ①|②)
   추천 이유: <한 줄 — 예: 세 축 모두 3 이상이고 남은 것은 예외 승인 2건뿐>
   안 정하면: <기본값 — 예: 이대로 마무리로 진행하고 남은 M개는 figma.md 미해결 항목으로 남습니다>
   ```
   문구는 `node scripts/lib/forbidden-words.js` 0건(검사 번호 C-n·A검사 n 은 쓰지 않는다). 답 원문을 상태 파일 `final_ack.quote`·`final_ack.at`, 채점 고지에 대한 답을 **`final_ack.level_ack`** 에, 긍정형 false·requires_human_review FAIL 중 사용자가 그대로 두자고 한 항목을 `final_ack.exceptions[]`(`{screen, item, quote, at}`) 에 기록하고 `approved` 를 올린다. '더 다듬기' 면 3-F 로.

## 종료조건 (판정은 검사기, `design-worker` 는 실행만)

```
node scripts/check-figma.js --out design/verify/exit_stage3.md
```

한 줄이 전부다. F-10 이 `scripts/check-c-report.js --report design/verify/c_report.json` 을 같이 돌려 `design/verify/exit_stage3_c.md` 를 같은 폴더에 쓴다. `design-worker` 는 이 명령을 **실행만** 하고 명령·종료 코드·출력 원문을 결과 파일에 남긴다(세는 일은 스크립트 — D-30: worker 판정은 3회 연속 틀렸다). 종료 코드 0 이면 상태 파일 `stages.figma.status = done`; 1 이면 FAIL 행의 항목을 3-F 로; 2 는 입력 오류(state.json 없음 등)라 화면이 아니라 파일 문제다. 아래는 스크립트가 세는 항목의 사람용 설명이며(정본은 `scripts/check-figma.js`·`check-c-report.js` 헤더 주석) worker 가 이 목록을 판정하지 않는다:

- F-0 산출 파일 존재·비어 있지 않음(figma.md·figma_nodes.json·a_report·c_report.md/json·final_review.md — D-13), 리포트 ≤ `agent_report_lines_max` / F-1 figma.md 링크 == `figma_url` / F-2 figma_nodes.json 3섹션 + 프레임 수 == §2 화면 × 상태 수 / F-3 `shots/final/` PNG 수 == 같은 수 / F-4 audit 병합 `passed_machine` / F-5 `requires_human_review` 규칙마다 final_review 행 / F-6 스크린샷 행 수 == PNG 수·행마다 본 것·`final_review.file` / F-7 `final_ack.approved`·quote·level_ack / F-8 templates/ 무변경 / F-9 충실도 a~d(3-D 15) / F-10 check-c-report 종료 0.
- CR-1 JSON·화면 수 / CR-2 ran·screenshots == 상태 수 / CR-3 캡처 ≥ lastModified / CR-4 verdict pass|fail 만 + fail 마다 diagnosis·elements·evidence / CR-5 score<3 축에 매핑 fail ≥1 / CR-6 positive 7키 boolean + false 마다 `final_ack.exceptions` / CR-7 tasks 불가 0·헤맴 ≤1·role·T-n 전부·역할마다 ≥1 / CR-8 `top_info.match` 전 화면 / CR-9 repeat ↔ `c_fail_reasons` / CR-10 화면마다 SLOP-SWEEP.

## 하지 않는 것

- 사용자에게 Figma 조작을 요청하는 것(파일 생성·폰트 설치 포함). 불가하면 `BLOCKED` 로 보고.
- 규칙에 없는 취향으로 탈락시키는 것. 그건 `taste_gap` 이다.
- 바닥선(WCAG 대비·스케일 단조성·프레임 규격·c_checks 부정형)을 사용자에게 묻는 것. 검사기가 FAIL 로 잡고 maker 가 고친다.
