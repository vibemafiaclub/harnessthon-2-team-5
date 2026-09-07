---
name: design-draft-html
description: 2단계 HTML 초안(B단계 발산·수렴). design.md 와 tokens.json 만 근거로, 아직 열린 독립 축마다 HTML 후보를 병렬 생성해 4개 페르소나(UX 직관·적합성·구현 호환·UI 심미)로 교차 비평하고 사용자 선택을 받아 decisions.md 를 쓴 뒤, 전체 화면 세트를 HTML 로 만들어 승인받는다. Figma MCP 직접 구현은 비싸고 느리므로 여기서 싸게 발산하고 승인된 것만 다음 단계로 넘긴다. design-harness 가 호출하거나 "화면 초안 / HTML 초안 / 후보 만들어" 로 단독 호출.
argument-hint: "[--axes 3] [--variants 2]  (fast 모드: 축 ≤1, 2-G 는 grep + 대표 화면 1장)"
---

# design-draft-html — HTML 초안 발산·수렴·승인

> **입력**: `design/design.md`, `design/tokens.json`, `design/brief.md`(§2 IA·§2c 여정 커버리지·§9 레퍼런스 패턴). **출력**: `design/decisions.md`, `design/drafts/*.html`, `design/drafts/tokens.css`, `design/verify/draft_shots/*.png`.
> **레이아웃 규칙**: `references/layout_rules.md`(실제로 깨진 사례 14건, 판정 기준·빈발 사례·수정 방침 3종 세트). 모든 `design-maker` HTML 브리프에 이 경로를 넣는다 — 간격의 소유자는 컨테이너 gap 하나(L-1), 후행 열 max-width + 선행 열 truncate(L-4), 액션바 균등 분할 금지(L-5), 라벨 폭 예산(L-6), 한글 keep-all(L-7), 히트영역은 ::after 로(L-11), 상태 선택자 명시도(L-14).
> **미감 규칙**: `references/aesthetic_rules.md`(c_checks C-5 슬롭 11항목·C-7 균일함 5신호·C-8 시각 교정 6항목을 '하지 말 것' 으로, 긍정형 7항목을 '화면마다 ≥1 넣을 것' 으로 추출하고 항목마다 tokens.json 토큰 이름으로 쓰는 해법을 붙인 제작 측 추출본). layout_rules.md 와 함께 **모든 `design-maker` HTML 브리프 화이트리스트에 넣는다** — 판정 기준 정본은 c_checks.md 이고 이 파일은 maker 가 만들기 전에 읽는 쪽이다.
> **왜 HTML 인가.** 생성이 싸고 빨라 병렬 발산이 가능하고, 비전문가가 브라우저로 보고 승인할 수 있고, Figma MCP 호출은 승인된 하나만 구현하면 되기 때문이다. 단 **HTML 과 Figma 는 같은 tokens.json 을 읽어야** 승인본과 구현본이 어긋나지 않는다.

## 분담

| 단계 | 누가 |
|---|---|
| 2-A tokens.json → tokens.css 변환 | `design-worker` |
| 2-B 열린 축 식별 | `design-judge` |
| 2-C 축별 후보 병렬 생성 | `design-maker` × 후보 수 (**병렬, 각자 다른 호출**) |
| 2-D 페르소나 교차 비평 + 추천 | `design-judge` (후보를 만든 호출과 다름) |
| 2-E 축별 선택 | **메인 세션** |
| 2-F 전체 화면 세트 생성 | `design-maker` (화면별 병렬 가능) |
| 2-G 초안 자체 점검 | `design-judge` |
| 2-H 승인 | **메인 세션** |
| 2-I 종료조건 | `design-worker` |

## 2-A. tokens.css (`design-worker`)

`design/tokens.json` 의 값 leaf 를 `--<경로-하이픈>` CSS 변수로 평탄화해 `design/drafts/tokens.css` 에 쓴다(예: `color.semantic.text.primary` → `--color-semantic-text-primary`, `typography.scale.body.size` → `--typography-scale-body-size`). `{…}` 참조는 `var(--…)` 로 변환. **설명용 키는 건너뛴다**: `rationale`, `_note`, `$schema_note`, `usage`, `concentric_rule`, `label`, `meta.*`, `color.wcag.*`. **키는 ASCII 만 허용** — 한글 키가 있으면 변환하지 말고 `BLOCKED: 한글 키 <경로>` 로 되돌린다(tokens.json 은 영문 슬러그 + `label` 규칙). 변환 후 **입력 값 leaf 수 == 출력 변수 수** 를 검사해 출력에 첨부한다(D-9 실측: `[^a-z0-9]` 제거로 상태 9종이 3종으로 충돌, 화면은 정상으로 보여 눈으로도 안 잡힘). 숫자 leaf 는 px 단위 없이 그대로 두고 소비 측에서 `calc(var(--x) * 1px)` 로 쓴다(단 `lineHeight`·`weight`·`opacity` 는 무단위). 스크립트와 출력 첨부. 모든 초안 HTML 은 이 파일 하나를 `<link>` 하고, **HTML 안에 색·간격·라운딩 리터럴을 쓰지 않는다.**

## 2-B. 열린 축 식별 (`design-judge`)

브리프: `design/brief.md`, `design/design.md`, `templates/decisions.md`, 출력 `design/decisions.md` §1 만.
- brief §3 에서 정본이 확정된 축은 **다시 열지 않는다.**
- 축의 조건 3개: 서로 **독립**(한 축의 선택이 다른 축을 결정하면 한 축), **한 문장으로 양극단**을 말할 수 있어야, **화면 구조를 실제로 바꿔야**(색만 바뀌는 건 축이 아니다).
- 후보 축 메뉴(팀 디자이너 실측 — 언제 생기는가): 정보량(한 화면 통합 ↔ 단계 분할: 데이터 규모가 명시됐을 때) / 주도권(A가 제안 ↔ B가 제안: 사용자가 둘 이상일 때) / 표현 강도(도구적 ↔ 표현적: Q6a "보여줄 일" 이 있을 때) / 진입 방식(목록 우선 ↔ 할 일 우선: 반복 사용이고 항목이 쌓일 때) / 상태 노출(전부 ↔ 현재만: 상태 구분 요구가 있을 때). 메뉴는 출발점이고 이 PRD 에서 정답이 갈리는 지점을 찾아 세운다.
- 남은 것 중 "화면 구조를 갈라 놓는" 축만 고른다. 예: 내비게이션 구조(탭 vs 단일 흐름), 목록 표현 방식, 두 주체(신랑/신부 등)의 구분 표현. **예시일 뿐, 프로젝트마다 다시 뽑는다.**
- 최대 3축. 각 축은 후보 2개(필요시 3). 축을 나누지 않고 화면 전체를 통째로 비교하지 않는다 — 무엇 때문에 골랐는지 뒤섞인다.
- 축이 0개면(전부 확정) 2-C~2-E 를 건너뛰고 decisions §1 에 "열린 축 없음" 기록.
- **brief §9 레퍼런스가 있으면 먼저 본다.** §9 에서 **같은 과업(T-n)을 다르게 푼 REF 가 둘 이상** 있으면 그 갈림이 **우선 후보 축**이다 — 양극단에 REF 번호를 병기한다(예: "진입 방식: 목록 우선(REF-2) ↔ 할 일 우선(REF-4)"). 병기하는 것은 **패턴 이름만**이다(서비스의 색·로고·카피는 옮기지 않는다). §9 행에 **사용자 반응 ID(`A-nn [PATTERN]`)가 이미 있는 과업**의 축은 인터뷰에서 좁혀진 것이므로 **다시 열지 않는다** — decisions §1 에 "§9 REF-n 반응으로 확정" 으로 적는다.
- 3단계 C 판정이 `direction`(C-2/C-4/C-5/C-7·tasks 불가·top_info 불일치)으로 되돌아온 경우: 해당 축 **하나만** 재발산한다. **fast 에서도 direction 1건에 한해 재발산 1회 허용** — 이때 축 선택은 사용자를 부르지 않고 2-D `ai_pick` 을 자동 채택하고 `state.human_gates.delegations[]` 에 `{stage:"draft", item:"axis <축>", kind:"budget60", default_taken:<ai_pick>}` 으로 기록한다(사람 개입 지점은 늘지 않는다).

## 2-C. 후보 병렬 생성 (`design-maker` × N)

축마다, 후보마다 **별도 `design-maker` 호출**을 한 메시지에 병렬로 낸다. 브리프에는 **입력 화이트리스트 = `design/design.md`, `design/tokens.json`, `design/drafts/tokens.css`, `.claude/skills/design-draft-html/references/layout_rules.md`, `.claude/skills/design-draft-html/references/aesthetic_rules.md`** (그 외 금지), brief §2 의 **대표 화면 1개**(행 내용을 문장으로), 그리고 **이 후보가 취할 축 값 한 줄**만 넘긴다. 다른 후보가 무엇인지 알려 주지 않는다. 상한 문장: "HTML 1파일 ≤{agent_draft_html_lines_max}줄(상태 3종 포함), 인라인 SVG 아이콘 ≤8개".

- 출력: `design/drafts/axis<n>_<a|b>.html`. **기기 프레임 규격**: 모바일은 **폭 390 고정 + 상태바(44px) + 하단 탭바(83px, 탭 내비게이션이 있는 흐름이면 필수)**, **높이는 내용에 맞춰 늘어난다(최소 844)** — 현업 관행대로 프레임이 길어지고, 탭바는 긴 프레임 맨 아래에 둔다. 내용을 잘라 숨기지 않는다. PRD 가 데스크톱이면 폭 1440. 규격(폭·상태바·탭바)은 `design.md` §2 에 한 줄로 기록하고 이후 모든 화면·Figma 프레임이 같은 값을 쓴다. (D-11 실측에서 "앱 화면으로 안 보인" 원인은 높이 차이가 아니라 상태바·탭바 부재와 폭 불일치였다 — D-34 로 정정. 높이 844 고정은 잘못된 처방이었고 잘림(D-26)을 낳았다.)
- 상태 3종 필수: 같은 파일 안에 `normal / empty / long`(최장 텍스트) 섹션. 빈 상태를 안 만들면 첫 사용 화면이 무너진다.
- design.md §3 제약·§4 규칙 준수, §6 금지 목록 회피. 위반해야만 축 값을 표현할 수 있으면 `ASSUMPTION:` 주석 대신 `BLOCKED:` 반환.
- **더미 콘텐츠 기준**: 이름·명칭은 그 로케일의 실제 분포를 따르고 길이를 섞는다(짧은 것·평균·아주 긴 것). 분류 라벨은 **PRD 에 등장한 어휘** 그대로. 날짜·수량은 PRD 가 서술한 시점·규모에 맞춰 **몰리게** 분포(균등하게 뿌리지 않는다 — 실제 데이터는 몰린다). **예외 케이스를 반드시 섞는다**: 최댓값 1, 최솟값 1, PRD 가 언급한 특수 케이스 1(중복 소속·마감 초과·같은 날 겹침 같은 것). `홍길동`·`항목 1`·"Lorem ipsum" 금지.
- 탭바: 배경 surface 토큰 + 상단 1px 경계, 아이콘 뒤 상자 없음, 활성 탭은 색 변경 또는 옅은 알약 하나(D-33). 아이콘 래퍼 요소에 배경색을 주지 않는다.
- 아이콘은 design.md §9 아이콘 체계를 따른다: **공식 MIT 패키지(기본 Phosphor Regular)의 실제 SVG 만**. SVG path 를 기억으로 재현하지 않는다 — 형태가 틀리고 틀린 건 눈에 보인다. 크기 16/20/24, 굵기 하나, 아이콘만 있는 조작 요소에는 `aria-label`.
- 루트 요소에 `data-frame="390x844"` 를 표기한다(검사기가 읽는다). `word-break: keep-all` + `overflow-wrap: break-word`(`anywhere` 금지).
- **주 행동은 첫 화면 안에 있거나 하단 고정이다.** 화면의 주 행동 요소 하나에 `data-role="primary-action"` 을 붙인다(주 행동이 없는 화면은 루트에 `data-no-primary="true"`). 그 요소는 `data-fixed="bottom"` 인 하단 고정 바 안에 있거나, 스크롤 없이 보이는 위치여야 한다(`data-above-fold="true"` 로 maker 가 선언하고 judge 가 스크린샷으로 확인). 스크롤해야 보이는 주 버튼, 프레임에 잘린 주 버튼은 FAIL(실측: 회신 화면의 "선택 완료" 가 844 아래로 잘림). 하단 고정 바가 있으면 내용 영역 하단 여백을 그 높이 이상 확보한다.
- **내용을 잘라 숨기지 않는다.** 화면 요소에 `overflow:hidden` 으로 내용을 절단하지 않는다(프레임이 길어지면 된다). **`normal` 섹션마다 844 위치에 `data-fold` 점선 가이드 하나를 반드시 둔다** — check-html H-15 가 1등 정보와 주 행동이 첫 화면 안에 있는지 이 마커 기준으로 센다(없으면 FAIL). 같은 화면을 두 벌(기기 크기 + full) 만들지 않는다 — 관리 부담과 불일치가 생긴다.

## 2-D. 교차 비평 (`design-judge`)

브리프: **입력 화이트리스트 = 후보 파일 전부, `design/design.md`, `design/brief.md` §9(레퍼런스 UX 패턴 표만), `.claude/skills/design-draft-html/references/aesthetic_rules.md`** (그 외 금지 — 후보를 만든 브리프·축 값 설명도 주지 않는다: 판정자는 제작 의도를 듣지 않는다). 출력 `design/decisions.md` §2 의 비평 열 + `ai_pick`. 상한 문장: "후보당 페르소나별 3줄 이내, 리포트 전체 ≤{agent_report_lines_max}줄". 페르소나 1·2 는 **PRD 의 사용자 역할 중 이해관계가 가장 반대인 둘**로 구체화한다(없으면 "매일 쓰는 사람 / 한 번 들어왔다 나가는 사람"). 각 페르소나에 사용 빈도·한 번에 쓰는 시간·실패했을 때 잃는 것을 적는다. **한쪽에만 좋은 후보는 탈락**시키고, 두 관점이 충돌하면 그 충돌을 decisions §4 트레이드오프에 남긴다. **페르소나 4개 고정**(프로젝트가 이름을 덮어쓸 수 있지만 개수와 채점 축은 고정). 각각 채점 축 하나를 맡는다:
1. **첫 사용자 관점 (UX 직관)** — design.md §7 핵심 과업 3개를 **실제로 따라가 본다**: 이 후보에서 과업의 첫 클릭이 어디인지 3초 안에 보이는가, 기대 경로대로 다음 화면이 예측되는가. 과업마다 `찾음/헤맴/불가` + 근거 위치.
2. **도메인 실무자 관점 (적합성)** — design.md §8 기준 **+ brief §9 의 REF 처리 방식 대비**, 이 화면이 그 도메인의 실제 서비스처럼 보이는가 아니면 범용 관리자 템플릿처럼 보이는가. 범용처럼 보이게 만드는 요소를 지목하고, 같은 과업을 REF-n 은 어떻게 풀었는지 한 줄로 대조한다(REF 가 없으면 "§9 비어 있음" 이라 적는다 — 기억으로 다른 서비스를 인용하지 않는다).
3. **구현 호환성 관점** — Figma 컴포넌트·variant 로 옮길 때 무리가 없는가, 상태 3종이 같은 구조로 표현되는가.
4. **UI 심미 관점** — `aesthetic_rules.md` 기준으로 C-5 슬롭 11항목·C-7 균일함 5신호·C-8 시각 교정 6항목 중 **해당하는 번호**와, 긍정형 7항목 중 **있는 것**을 적는다. `aside-browser` 가 가능하면 후보를 렌더해 스크린샷을 **Read 로 열어** 판정한다(파일명 + 위치 + 본 것). 불가하면 **소스 grep 으로 판정 가능한 항목만**(gradient·backdrop-filter·이모지·`#000`·동일 box-shadow·`repeat(3` — check-html H-16 과 같은 목록) 적고 나머지는 `C_NOT_RUN` 으로 표시한다. 렌더 없이 "보기에 좋다/나쁘다" 를 쓰지 않는다.

각 후보에 페르소나별 2~3줄, 근거는 파일명 + 위치(상/중/하). 추천 픽 1개 + 이유 1줄을 `ai_pick` 에 쓰되 **decisions.md 에는 아직 공개 표시하지 않는다**(2-E 에서 사용자 선택 뒤에 공개). 4개 페르소나 각각의 판정 줄이 없는 후보는 비평 미완료다 — 메인이 되돌린다.

## 2-E. 축별 선택 (메인 세션)

**위임 분기 먼저**: `state.human_gates.axis_choice.delegated == true`(Q12 위임, ack 시간상한, 예산 60% 자동확정 중 하나로 이미 위임됨)면 사용자를 부르지 않는다 — 축마다 2-D `ai_pick` 을 자동 채택하고, `interview_raw.md` 에 `D-<축>: 사용자 위임 — ai_pick <후보> 채택` 을 적고, `state.human_gates.delegations[]` 에 `{stage:"draft", item:"axis <축>", kind:<unknown|q12|timeout|budget60 중 원인>, default_taken:<후보>}` 를 기록한 뒤 사용자에게 **그 사실만 한 줄로 고지**한다(결정을 묻지 않는다). 이것은 취향형 호출(②)이므로 아래 1~4 를 사람에게 열 때도 **추천은 선택 기록 뒤에** 공개한다.

1. `design-worker` 가 후보들을 한 페이지에 나란히 놓은 `design/drafts/compare_axis<n>.html` 을 만든다(iframe 또는 좌우 배치). 페이지에는 "왼쪽 / 오른쪽" 표기와 아래 2항의 질문 문장만 있고 **축 이름·축 값·후보 파일명·페르소나 비평은 노출하지 않는다**(무엇을 비교하는지 알려 주면 답이 라벨을 향한다).
   - **open 전 worker 확인(생략 불가)**: `node scripts/check-html.js --drafts design/drafts --brief design/brief.md --frame <design.md §2 규격> --out design/verify/html_check.md` 를 돌려 ①`compare_axis<n>.html` 에 **후보 2개의 경로가 전부 포함**되는가(`grep -c 'axis<n>_' compare_axis<n>.html` ≥ 2 — iframe src 또는 인라인 표기) ②**H-13 금지어 0건**(compare_axis·index 의 사용자 노출 텍스트, 정본 `scripts/lib/forbidden-words.js` 14개) ③후보 `axis*.html` 의 H-1·H-4·H-8 PASS(깨진 렌더에 대한 반응이 `D-<축>` 로 남는 것을 막는다). 하나라도 FAIL 이면 **열지 않고** worker/maker 에 되돌린다. 명령·종료 코드를 decisions §2 에 첨부.
   - `open design/drafts/compare_axis<n>.html`. 호출 전 `interview_raw.md` 에 `H-nn [draft/axis_choice]` + 4줄 골격('결정할 것: / 선택지: ① 왼쪽 ② 오른쪽 (하네스 추천: ai_pick — 사용자에게는 3항에서 공개) / 추천 이유: / 안 정하면:')을 append 하고 `state.human_gates.calls[]` 에 `{stage:"draft", kind:"axis_choice"}` 기록.
2. 축마다 한 질문, 문장 고정: **"왼쪽/오른쪽 중 어느 쪽이 더 쓰기 편해 보이나요? 보이는 느낌도 한 줄 적어 주시면 좋아요(선택)."** 축 이름·축 값을 말하지 않는다("탭 구조 vs 단일 흐름 중…" 같은 설명 금지). 답 원문을 `interview_raw.md` 에 `D-<축>: <left|right> — <원문>` 으로 **즉시 기록**. "둘 다 아니에요/모르겠어요" 도 답이다 — `D-<축>: none — <원문>` 으로 적고 ai_pick 채택 + delegations `kind:"unknown"`.
3. 기록 뒤에 AI 추천(`ai_pick`)과 이유를 공개. 바꾸면 `changed_after_reveal: true` 와 바뀐 뒤 원문을 함께 기록.
4. 결과를 decisions.md §2 에 반영하고 `state.human_gates.axis_choice.chosen[]`·`ai_pick[]` 을 축 순서대로 채운다.

## 2-F. 전체 화면 세트 (`design-maker`)

brief §2 화면 표의 **모든 화면**을 만든다. 시간이 부족해도 화면을 골라 빼지 않는다 — 빼야 하면 화면당 상태 변형을 줄이지 화면 수를 줄이지 않는다(D-12 실측: 핵심 3화면만 골라 PRD F1·F2 화면이 통째로 빠졌고 3단계 끝에서야 드러남). **brief §2c(사용자 여정·필수 플로우 커버리지)의 '담당 화면 #' 에 적힌 화면 전부**(첫 진입·온보딩, 초대 보내기·공유, 초대받은 쪽 첫 진입, 역할별 랜딩, 알림·리마인드 진입, 설정·탈퇴, 상태 순위표의 각 상태, 시나리오 까다로운 상황, 되돌리기·오류 복구)를 **PRD 기능 화면과 같은 등급으로** 만든다 — PRD 가 침묵한 여정이라는 이유로 뒤로 미루지 않는다(`X-nn → §10 P-nn` 매핑 화면 포함). §2c 에 '없으면 사유' 만 있는 행은 만들지 않되 그 사유를 decisions §4 에 옮긴다. 화면별로 병렬 호출 가능, **산출은 화면별 별도 파일**. 브리프: **입력 화이트리스트 = `design.md`, `tokens.json`, `tokens.css`, `decisions.md`(선택된 축 값), `references/layout_rules.md`, `references/aesthetic_rules.md`**, 해당 화면의 §2 행(역할·진입 경로·1등 정보·매핑)과 §2c 해당 행을 문장으로, 그 화면의 1등 정보. 상한 문장 포함.
- 출력 `design/drafts/screen_<nn>_<slug>.html`, **상태 4종** `normal / empty / long / error` 섹션 포함(`data-state="…"`; 목록형 화면은 `loading` 추가). `error` 는 "무엇이 잘못됐는지" 와 "무엇을 하면 되는지" 둘 다 있어야 한다(c_checks C-6) — "오류가 발생했습니다" 한 줄은 상태가 아니다. 입력·네트워크 오류가 구조적으로 불가능한 화면(정적 안내 화면)만 루트에 `data-no-error="true"` 와 사유 주석을 쓴다. **1파일 ≤`agent_draft_html_lines_max`줄.**
- **이동 요소에 `data-next="<다음 화면 번호 2자리>"`** 를 붙인다(주 행동·행 탭·링크처럼 다른 화면으로 가는 요소). brief §2b 기대 경로의 연속 화면 쌍마다 앞 화면 normal 섹션에 그 요소가 있어야 한다 — check-html H-18 이 핵심 과업이 초안에서 실제로 이어지는지 센다(U-1). 기대 경로는 §2 번호 또는 화면명으로만 쓴다(행동 라벨은 화면이 아니다).
- **1등 정보 요소 하나에 `data-role="top-info"`** 를 붙인다(화면당 정확히 1개, brief §2 '이 화면의 1등 정보' 와 같은 내용). 그 요소는 `data-fold` 이전(첫 화면 안) 또는 `data-fixed` 안에 있어야 하고, `font-size` 는 `var(--typography-scale-heading-…)` 또는 `var(--typography-scale-display-…)` 를 참조한다 — check-html H-15 가 세 가지를 전부 센다. 1등 정보가 숫자면 숫자와 단위·라벨을 같은 크기로 쓰지 않는다(aesthetic_rules 긍정형 2).
- **초안 렌더 보존(fast 에서도 생략 불가)**: `design-worker` 가 `aside-browser` 로 화면마다 `normal` 상태 1장을 `design/verify/draft_shots/<nn>.png` 로 저장한다(전체 높이 캡처). 브라우저 불가 시 같은 경로 대신 `design/verify/draft_shots/NOT_CAPTURED` 파일에 화면 번호와 사유를 적는다 — 빈 채로 두지 않는다. 이 PNG 가 3단계 2콜 판정의 '비교 대상'(승인본) 이고 2-G fast 대표 화면 점검의 입력이다.
- 화면 간 공통 요소(상단 바, 하단 탭, 상태 칩, 목록 행)는 **같은 마크업 구조·같은 클래스명**을 쓴다. 다음 단계에서 이것이 Figma 컴포넌트가 된다. 공통 요소 목록을 `design/drafts/components.md` 에 **아래 표 형식으로 고정해** 적는다(`build-rules.js` 가 이 표를 읽어 variant 검사 규칙을 만든다 — 형식이 흔들리면 검사가 미발동한다, 실측 D-22):

```
| 컴포넌트 | variant | 어느 화면에서 | 초안 대응 요소(크기) |
|---|---|---|---|
| `Chip/Status` | Waiting(대기), Closing(확정임박), Confirmed(확정), Done(완료) | 홈·모임 상세 | .chip 62×24 |
| `Button/Primary` | Default, Disabled | 전체 | .btn-primary 343×48 |
```
variant 열은 `Value(설명)` 을 쉼표로. 산문 형식(`## 1. 이름 (id …)` + `variant:` 줄)도 파서가 읽지만 표가 정본이다. 4열의 크기는 A검사 8(크기 상식 ±30%)이 쓴다.
- `design/drafts/index.html` 에 전 화면 링크 + 화면 흐름 순서.

## 2-G. 초안 자체 점검 (`design-judge`)

Figma 로 가기 전 싼 사전 점검. 브리프: **입력 화이트리스트 = `drafts/*.html`, `design.md`, `design/brief.md` §2·§2b·§2c(역할·과업·여정 행만), `design/verify/draft_shots/*.png`, `references/aesthetic_rules.md`**. 출력 `design/verify/draft_review.md` (**≤`agent_report_lines_max`줄**).
- **결정론 검사 먼저(`design-worker` 가 실행만)**: `node scripts/check-html.js --drafts design/drafts --brief design/brief.md --frame <design.md §2 규격> --state design/state.json --out design/verify/html_check.md`. H-1 미선언 CSS 변수(L-9) · H-2 keep-all(L-7) · H-3 anywhere 금지(L-13) · H-4 hex/px 리터럴(예외 `#fff` 만) · H-5 프레임 규격 동일(D-11·D-14) · H-6 상태 섹션(normal/empty/long; `error` 는 아래 grep) · H-7 무음 절단 경고(L-8) · H-8 자리표시자 · **H-9 주 행동 위치**(`primary-action` 이 하단 고정 바 안이거나 above-fold 선언) · **H-10 내용 절단 없음**(`overflow:hidden` 으로 스크롤 영역을 자르지 않음, 높이 고정 금지) · **H-11 PRD 매핑**(brief §2 매핑 열의 `F\d+|P-\d+` 전부가 담당 행의 `screen_<nn>_*.html` 로 존재) · **H-12 §2c 담당 화면 존재**(사유만 있는 행 WARN, 둘 다 없으면 FAIL) · **H-13 사용자 노출 페이지 금지어 0**(compare_axis·index, 정본 14개) · **H-14 index.html 링크 집합 == screen 파일 집합** · **H-15 top-info 1개·위치·크기 토큰** · **H-16 C-5/C-8 grep**(gradient·backdrop-filter·이모지 아이콘·`color:#000|black`·동일 box-shadow·`repeat(3`) · **H-17 제목/본문 배율 ≥1.5**(tokens.css). `error` 상태는 `grep -L 'data-state="error"' design/drafts/screen_*.html` 로 누락 파일을 센다(`data-no-error="true"` 파일만 예외). FAIL 이면 승인 화면을 열지 않는다. 명령·출력 원문 첨부.
- §4A 규칙 중 HTML 소스로 판정 가능한 나머지(공통 요소 구조 일치 등)를 grep 으로 판정.
- 스크린샷 점검: `design/verify/draft_shots/*.png`(2-F 에서 worker 가 저장) 를 **Read 로 열어** §4C 규칙·§5 1등 정보(top-info 요소가 실제로 먼저 읽히는가)·aesthetic_rules C-5·C-7·C-8 을 점검한다. full 은 화면 전부, **fast 는 대표 화면 1장(brief §2 첫 화면 = §2c '첫 진입·온보딩' 담당 화면의 `normal`)만 열어 C-5·C-7 을 점검하고 나머지 화면은 생략**(생략을 brief §6 가정 로그에 "시간 예산으로 생략 — 화면 nn~mm" 으로 기록). PNG 가 `NOT_CAPTURED` 면 "C 점검 미실시 — Figma 단계에서" 라고 명시. 추측 판정 금지.
- **과업 × 역할 경로 추적**: design.md §7 핵심 과업 3개를 전체 화면 세트에서 **역할마다**(brief §2 역할 열에 PRD 역할이 둘 이상이면 둘 다 — 예: 만드는 쪽 / 초대받은 쪽) `index.html` 의 흐름 순서대로 따라가 과업 × 역할별 `찾음/헤맴/불가` 표를 쓴다(시작 화면은 그 역할의 §2c 첫 진입 화면). `불가` 는 FAIL. `헤맴` 은 해당 화면만 `design-maker` 에 1회 되돌려 수정한 뒤 **같은 역할로 재추적**하고, 재추적에서도 `헤맴` 이면 FAIL(3-E 에서 다시 헤매는 것을 승인 뒤로 미루지 않는다). 역할 하나만 추적한 표는 미완료다.
- **승인 전 구조 검사(`design-worker` 실행, fast 에서도 생략 불가)**: ①모든 `screen_*.html` 루트 프레임 규격(**폭·상태바·탭바**, 높이 제외)이 `design.md` §2 값과 동일한가(check-html H-5) ②`check-html.js --brief` 의 **H-11(PRD 기능 번호·P-nn 전부 매핑)·H-12(§2c 담당 화면 전부 존재)** PASS — worker 가 눈으로 대조하지 않는다. 렌더가 필요한 L-6(라벨 폭 예산)·L-8(높이 초과량)은 `aside-browser` 가 가능하면 `design-judge` 가 계산하고, 불가하면 승인 화면에서 사용자에게 "글자가 접히거나 잘린 곳"을 물어 대신한다. 하나라도 FAIL 이면 **2-H 승인 화면을 열지 않는다.** (D-14 실측: 8화면 중 4개가 규격 없이 승인됐고 Figma 만 나중에 일괄 수정되어 "HTML 초안 = 승인 근거" 전제가 깨짐. 종료조건에만 있으면 승인 뒤에 걸린다.)
- 결과가 FAIL 인 항목은 `design-maker` 에 되돌려 고치고 재점검. 상한 2회. **판정자는 고치지 않는다.** 수정된 화면은 draft_shots 를 다시 찍는다(승인본 PNG 가 최신 파일과 어긋나면 3단계 대조가 틀린다).

## 2-H. 승인 (메인 세션)

1. 2-G 의 승인 전 구조 검사(H-5·H-11·H-12)와 과업 × 역할 추적이 PASS 인지 `design/verify/draft_review.md`·`design/verify/html_check.md` 에서 확인한다. FAIL 이면 열지 않고 2-F 로 되돌린다. `index.html` 의 사용자 노출 텍스트는 H-13 이 이미 봤다(금지어 0).
2. **호출 전 기록**: `interview_raw.md` 에 `H-nn [draft/draft_approval]` + 4줄 골격을 append 하고 `state.human_gates.calls[]` 에 `{stage:"draft", kind:"draft_approval"}` 를 기록한다. 골격의 '하네스 추천' 줄에는 **"이 초안이 맞다/틀리다" 입장 1줄과 이유**를 사용자에게 보이기 전에 미리 적는다(사후 합리화 방지). 기록 없이 부르면 결함(check-brief B-24 가 센다). 그 다음 `open design/drafts/index.html`.
3. 호출 품질 게이트 4항을 한 화면에: 결정할 것(이 초안으로 Figma 구현 진행 여부) / 선택지(① 승인 ② 수정 요청 ③ 방향 재검토) / 하네스 의견 / 안 정하면(Figma 구현이 시작되지 않고 3단계 검증 근거물이 없음). **하네스 의견 칸은 두 층이다**: 화면에는 **자체 점검 요약**(check-html N/N PASS·과업 × 역할 추적 결과·스크린샷 점검 화면 수·남은 WARN 을 쉬운 말로 3줄) 을 먼저 보이고, **"이 초안이 맞다/틀리다" 입장 1줄 + 이유**는 사용자 답을 raw 에 기록한 **뒤에** 공개한다 — 초안 승인은 취향형 호출(②)이라 선택 기록 후 추천 공개 규칙을 따른다. 입장이 "틀리다" 면 어느 화면·어느 항목 때문인지 번호로 말하고 선택지 ②를 권한다.
4. "이대로 Figma 에 만들어도 될까요? 고치고 싶은 곳이 있으면 화면 번호와 함께 알려 주세요." — 답 원문을 raw 에 즉시 기록한 뒤 3항의 입장을 공개. 공개 뒤 답이 바뀌면 바뀐 원문도 기록.
5. 수정 요청 → raw 기록 → 해당 화면만 `design-maker` 재생성 → draft_shots 재촬영 → 2-G 재점검 → 다시 승인. `human_draft_revision_max`(기본 2, fast 1) 초과 시 "방향 자체 재검토" 로 분류해 2-B 로 회귀하거나 사용자가 그대로 진행 결정(이 갈림은 결정형 호출 — 추천을 질문 문장 안에 먼저).
6. 승인 원문을 decisions.md §3 과 상태 파일 `draft_approval`(`approved`·`at`·`quote`·`draft_hash`·`screen_count`) 에 기록. `draft_hash` 는 `cat design/drafts/screen_*.html | shasum -a 256` 의 값, `screen_count` 는 screen 파일 수. **승인 후 화면 파일의 규격·화면 수·해시가 바뀌면 그 승인은 무효**이며 재승인을 받는다(check-figma F-9 가 draft_hash 로 감지한다).

## 종료조건 (`design-worker` 는 실행만 — 세는 것은 스크립트)

아래 두 명령의 종료 코드가 전부 0 이고, 나머지 grep 항목이 전부 PASS 여야 2단계 종료. 리포트를 `design/verify/exit_stage2.md` 에 남긴다(check-decisions 의 `--out`).

- [ ] `node scripts/check-decisions.js --decisions design/decisions.md --raw design/interview_raw.md --state design/state.json --out design/verify/exit_stage2.md` 종료 0 — D-1 §1 축 수 ≤ `human_open_axes_max`(fast 는 caps_fast) / D-2 **§2 각 축에 `D-<축>` raw ID 존재 또는 사용자 위임 기록**(`axis_choice.delegated` + delegations[]) / D-3 각 축 ai_pick·changed_after_reveal 기록 / D-4 §3 승인 원문 == `draft_approval.quote` / D-5 §1·§2 사용자 노출 문구 금지어 0(정본 14개)
- [ ] `node scripts/check-html.js --drafts design/drafts --brief design/brief.md --frame <design.md §2 규격> --state design/state.json --out design/verify/html_check.md` 종료 0 — 이 한 명령이 아래를 센다: **H-11 PRD 기능 번호·P-nn 전부**가 `screen_*.html` 에 매핑(D-12) / **H-12 §2c 담당 화면 전부 존재** / **H-5 모든 화면 프레임 규격 동일**(폭·상태바·탭바, 높이 제외 — D-11·D-34) / **H-6 상태 섹션**(normal·empty·long) / H-4 hex·px 리터럴 0건(`tokens.css` 제외, `#fff` 만 예외) / **H-14 `index.html` 존재·`<a href="screen_…">` 링크 집합 == screen 파일 집합** / **H-15 화면마다 `data-role="top-info"` 1개** / H-16 슬롭 grep / H-17 제목·본문 배율
- [ ] `error` 상태: `grep -L 'data-state="error"' design/drafts/screen_*.html` 결과가 `data-no-error="true"` 파일뿐 — 원문 첨부(check-html H-6 가 error 를 세게 되면 그 결과로 대체)
- [ ] `design/drafts/screen_*.html` 개수 == brief §2 화면 수 == `draft_approval.screen_count`, **각 파일 ≤`agent_draft_html_lines_max`줄**(`wc -l` 원문)
- [ ] `design/verify/draft_shots/` 에 화면 수만큼 `<nn>.png` 존재, 없으면 `NOT_CAPTURED` 파일에 화면 번호·사유 — 둘 다 없으면 FAIL
- [ ] `design/drafts/components.md` 존재, 공통 요소 ≥3(표 행 수)
- [ ] `design/verify/draft_review.md` 의 A 항목 전건 PASS, **과업 × 역할 표에서 전 칸 `찾음`**(역할 ≥2 면 과업 3 × 역할 수 칸 — `불가`·재추적 `헤맴` 0건), fast 대표 화면 1장 점검 결과 존재
- [ ] `interview_raw.md` 에 `H-nn [draft/axis_choice]`(열린 축이 있고 위임이 아닌 경우)·`H-nn [draft/draft_approval]` 원장 존재, `state.human_gates.calls[]` 와 1:1
- [ ] 상태 파일 `draft_approval.approved == true`, `quote`·`draft_hash`·`screen_count` 채움

## 하지 않는 것

- Figma 조작. 여기서는 브라우저로 보는 HTML 만 만든다.
- 사용자에게 값을 묻는 것. 사용자는 나란히 놓인 것 중 고르기만 한다. 축 이름·축 값·페르소나 비평을 사용자에게 보이는 것도 하지 않는다.
- 레퍼런스(brief §9)에서 색·로고·카피를 옮기는 것. 옮기는 것은 패턴(진입·1등 정보·상태 표현·빈 상태 처리)뿐이고, 그것도 §2 IA·§2b 과업·2-B 축 후보에만 흐른다 — §3 시각 6축 정본은 사용자 반응에서만 온다.
