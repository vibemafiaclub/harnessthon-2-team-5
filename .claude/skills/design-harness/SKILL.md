---
name: design-harness
description: 디자인 하네스 진입점(오케스트레이터). 명령 하나로 PRD → 인터뷰(0단계) → 토큰·가이드(1단계) → HTML 초안 승인(2단계) → Figma 구현·검증(3단계) → Figma 링크까지 진행한다. design/state.json 을 읽어 중단된 곳부터 재시작한다. 사용자와 대화가 필요한 지점만 메인 세션이 처리하고 나머지는 서브에이전트(design-judge/design-maker/design-worker)에 파일 기반으로 위임한다. "디자인 하네스 시작 / 이 PRD 로 디자인 만들어 / design-harness" 트리거.
argument-hint: "<PRD 경로> [figma url] [--budget 40m]"
---

# design-harness — 진입점

> **한 줄.** `/design-harness docs/prd.md [figma-url] [--budget 40m]` 하나로 끝까지 간다. 사람이 답하는 지점은 아래 5곳뿐이고, 그 밖에서는 사용자를 부르지 않는다. 부른 횟수는 `interview_raw.md` 의 `H-nn` 원장과 `state.human_gates.calls[]` 로 세고, `scripts/check-brief.js` B-24 가 판정한다.
> **철학.** 디자이너의 작업 **순서**를 흉내내지 않는다. 각 단계가 실제로 하려던 **판단**만 뽑아, 에이전트가 잘하는 방식(병렬 생성·교차 비평·파일 기반 위임)으로 다시 구현한다. 인터뷰 대상은 디자인 비전문가다. 사용자는 반응하고, 기준은 하네스가 만든다.
> **결과물이 전부다.** 채점은 세 축 — **UI(심미적인가) · UX(직관적인가) · 적합성(그 도메인·회사의 실제 서비스 같은가)** — 이고 1점 = AI 슬롭, 3점 = 신입, 5점 = 시니어다. 모든 단계의 판정 항목은 이 세 축에 매핑된다. PRD 는 그대로 따르지 않는다 — 훌륭한 디자이너처럼 **반박**하고, 사용자에게 쉬운 말로 확인받는다.

## 시간 예산과 심사 모드

`--budget <분>` 을 받으면 상한을 자동으로 줄인다. **심사 상황(처음 보는 PRD 를 비전문가가 한 번에 실행)은 `--budget 40m` 이 기본**이다. 인자가 없으면 full.

| 상한 | full | fast (`--budget ≤ 45m`) |
|---|---|---|
| 인터뷰 본질문(페이지 항목 수) | ≤12 | **≤10** — full·fast 세트의 정본은 `design-interview/references/interview_prompts.md` §6 한 곳(여기와 design-interview SKILL 은 값을 복제하지 않고 §6 참조). PRD 가 답한 것은 확인형으로 |
| 갤러리 타일 | ≤24 | **≤12** (축 6 × 2) |
| 월드컵 | ≤7 라운드 | **always 축(fast 는 진술 질문이 없는 5축: 밀도·형태·타이포·강조·채도) 각 1쌍 + 갤러리에서 갈리지 않은 축 ≤2개 각 1쌍, 합계 ≤7** (`human_worldcup_rounds_max`) |
| 규칙 전량표 ack(0-H 한 화면) | 전체 표 | **RULE 표는 confirmed 만 표시, 1문장 ack** — '제가 대신 정한 것' 다이제스트·진술≠반응 고지 블록은 fast 에서도 생략하지 않는다 |
| 토큰 세트 후보 | 3 | **2** |
| 열린 축 | ≤3 | **≤1** |
| HTML 자체 점검(2-G) | 실행 | **`check-html.js` 전 항목 + 대표 화면 1장(brief §2 첫 화면 normal) 스크린샷만 C-5·C-7 점검, 나머지 스크린샷 생략** |
| C단계 라운드 | ≤3 | **1 + 국소 수정 1회 + `direction` 1건에 한해 2-B 재발산 1회** |
| 0단계 시간 | 30분 | **12분** |

**에이전트 산출 상한** — 사람 개입만 줄이면 예산은 지켜지지 않는다. 40분에서 시간을 실제로 쓰는 쪽은 에이전트다(실측: fast 모드 0-A 한 건이 6분 15초, 278줄, 그중 소비된 것은 반박 2건). 아래 상한은 `state.caps` 의 `agent_*` 키이며 **서브 브리프에 숫자 문장으로 반드시 넣는다** — 표에만 있으면 서브는 못 본다.

| 산출 | full | fast |
|---|---|---|
| 0-A `prd_analysis.md` 전체 | ≤120줄 | **≤60줄** |
| 0-A PRD 반박 / 미확정 | ≤10 / ≤8 | **≤4 / ≤3** (fast 는 Q11 에서 2건만 묻는다) |
| 0-A 화면 흐름 후보 / 시나리오 / 감성 키워드 | 2 / 3 / 5 | **1 / 2 / 3** |
| 0-A2 `references.md` REF 행 / 전체 | 4~10 / ≤80줄 | **3~6 / ≤40줄** |
| 0-B 인터뷰 페이지 타일 1장 복잡도 / 파일 크기 | 요소 ≤10 / ≤200KB | **≤8 / ≤120KB** (폰 프레임 본문 조각, `agent_gallery_tile_elements_max`) |
| 0-B 흐름 조각(`flows[]` 한 흐름의 화면 조각 수) | ≤4 | **≤3** |
| 0-F 판단기준 개수 | 8~20 | **6~12** |
| 0-F `brief.md` 전체(§2c·§2d·§9·plain 포함) | ≤320줄 | **≤220줄** |
| 1-D `design.md` 전체 | ≤160줄 | **≤100줄** |
| 2-C/2-F 초안 HTML 1파일(상태 3종 포함) | ≤400줄 | **≤300줄** |
| 모든 검사·비평 리포트 1파일 | ≤80줄 | **≤50줄** |

상한 초과는 `design-worker` 종료조건 검사에서 **FAIL** 이다(하한 미달과 같은 등급). 초과 시 같은 서브에 "상한 이내로 압축, 내용 추가 금지" 로 1회 되돌리고, 그래도 초과면 초과분을 잘라 `TRUNCATED` 표시 후 진행한다.

fast 에서 잘린 항목은 전부 brief §6 가정 로그에 "시간 예산으로 생략" 으로 남긴다. 예산의 60% 를 쓴 시점에 아직 2단계 승인 전이면 남은 열린 축을 하네스가 추천 픽(`axis_choice.ai_pick`)으로 자동 확정하고 사용자에게 그 사실만 고지한다(결정을 묻지 않는다). 자동 확정한 축마다 `state.human_gates.delegations[]` 에 `{stage: "draft", item: <축>, kind: "budget60", default_taken: <ai_pick>, ts}` 로 기록한다 — 모르겠음→기본값(`unknown`)·Q12 위임(`q12`)·ack 시간상한(`timeout`)과 같은 원장이고, 0-H·2-H 의 '제가 대신 정한 것' 다이제스트가 이 원장을 읽는다. 상태 파일 `budget_minutes`·`mode` 에 기록.

## 시작 시 반드시

1. `design/state.json` 이 있으면 읽고 `next_stage` 부터 이어간다. 없으면 `templates/state.json` 을 복사해 `prd`·`figma_url`·`started_at`·`budget_minutes`·`mode` 를 채우고, fast 면 `caps` 를 `caps_fast` 값(위 표와 같은 값)으로 덮어쓴다.
2. 사용자의 **어떤 입력이든** 진행 중인 자율 루프를 멈추는 신호다(kill-switch). 멈춘 뒤 상태 파일을 갱신하고 무엇까지 됐는지 3줄로 보고한다. 재개는 사용자가 말할 때만.
3. 시작·재시작 안내는 **한 번**만: 지금 어느 단계인지, 사람이 답할 지점이 몇 개 남았는지, 예상 시간.

## 단계와 위임

| 단계 | 스킬 | 사람 개입 | 종료조건 판정(worker 는 실행만) |
|---|---|---|---|
| 0 인터뷰 | `design-interview` | 인터뷰 페이지 답변 · 갤러리/월드컵 반응 · 되묻기 · 규칙표 ack(0-H 한 화면) | 발행 전 `node scripts/check-interview-page.js` → `design/verify/exit_interview_page.md`, 종료 시 `node scripts/check-brief.js` → `design/verify/exit_stage0.md` |
| 1 토큰·가이드 | `design-tokens` | 토큰 세트 선택 | `node scripts/check-tokens.js --tokens design/tokens.json --state design/state.json --design design/design.md --brief design/brief.md --wcag design/verify/wcag_tokens.md --compare design/stimuli/design_guide_compare.html --sets design/stimuli/token_sets.json --raw design/interview_raw.md --out design/verify/exit_stage1.md` (K-1~K-12, K-3b, K-8a/b) |
| 2 HTML 초안 | `design-draft-html` | 축별 선택 · 초안 승인 | `node scripts/check-html.js --brief design/brief.md` (+ `scripts/check-decisions.js`) → `design/verify/exit_stage2.md` |
| 3 Figma | `design-figma-build` | (취향 공백 질의 시) · 최종 확인 | `node scripts/check-figma.js` + `node scripts/check-c-report.js` → `design/verify/exit_stage3.md`·`exit_stage3_c.md` |

각 단계는 **Skill 도구로 해당 스킬을 로드해** 그 문서를 따른다. 이 문서에 단계 내용을 복제하지 않는다.

단계 전환 규칙:
- 종료조건 판정은 위 표의 검사기가 한다. `design-worker` 는 명령을 **실행만** 하고(세는 일은 스크립트 — D-30: worker 판정은 3회 연속 틀렸다) 명령·종료 코드·출력 원문을 결과 파일(`design/verify/exit_<stage>.md`)에 남기며, 메인은 그 파일의 PASS/FAIL 을 읽는다. 메인이 "됐다" 고 스스로 판단하지 않는다. 모든 단계의 종료조건에는 공통 항목이 하나 더 있다: **그 단계가 만들었다고 보고한 리포트·산출 파일이 실제로 존재하고 비어 있지 않은가**(D-13). 보고에만 있고 디스크에 없는 파일은 FAIL.
- 전건 PASS → 상태 파일 `stages.<stage>.status = done`, `next_stage` 갱신 → 다음 단계.
- FAIL 이 있으면 그 단계 스킬의 절차로 보정 후 재판정. 상한을 넘기면 결정형 호출(kind `cap_exceeded`)로 넘긴다 — FAIL 목록은 검사 번호(C-n·A검사 n·H-n)가 아니라 쉬운 말 한 줄씩으로 바꿔 보이고(0-H 병기 규칙과 동일, `node scripts/lib/forbidden-words.js` 0건), "진행 / 보정 / 중단" 중 하네스 추천을 질문 문장 안에 먼저 밝힌다(호출 품질 게이트·3분류 준수).

## 서브에이전트 위임 규칙

| 에이전트 | 모델·effort | 쓰는 곳 |
|---|---|---|
| `design-judge` | Opus 5 · high | PRD 분석, 규칙화, 인용 감사, 열린 축 식별, 교차 비평, C단계 판정 |
| `design-maker` | Sonnet 5 · medium | 자극 갤러리, 토큰 세트, HTML 초안, Figma 구현, 수정 |
| `design-worker` | Haiku · low | 변환, 종료조건 검사, WCAG 계산, A단계 노드 검사, 스크린샷 저장 |

**메인이 지킬 것 (브리프 작성 규칙)**
- 브리프에는 정확히 세 가지를 문장으로 넣는다: ①**입력 화이트리스트**(읽어도 되는 파일 경로 목록 — 각 스킬의 "브리프에 넘길 것" 그대로) ②**출력 경로** ③**산출 상한 숫자**(`state.caps` 의 해당 `agent_*` 값). 셋 중 하나라도 빠진 브리프는 보내지 않는다.
- 절차 문서(`SKILL.md`, `docs/concept.md`, `README.md`)를 브리프에 얹지 않는다. 서브가 절차 문서를 읽으면 남의 단계 규칙으로 자기 단계를 판단한다(실측: 0-A 서브가 `interview_raw.md` 공백을 근거로 신규 작성을 정당화 — 그 판정은 메인의 시작 절차 규칙이지 0-A 의 규칙이 아니다).
- 신규/재시작 판정은 메인이 산출 파일 존재 여부로 하고 서브에는 알리지 않는다. 서브는 항상 "브리프대로 신규 작성" 이다.
- 인터뷰 내용·판단을 프롬프트에 요약해 넣지 않는다. 파일 경로로 넘긴다.
- 모든 브리프에 공통 문장을 넣는다: **"각 항목은 상한 안에서 가장 중요한 것부터 쓰고, 초과분은 쓰지 않는다."** 실측에서 상한 숫자보다 이 문장이 약한 근거를 스스로 버리게 만들었다(0-F 가 `[NO_REASON]` 근거뿐인 축을 자진 삭제).
- **병렬 위임의 산출은 에이전트마다 별도 파일**로 받는다(`<이름>.<슬러그>.json`). 공유 JSON 을 여러 서브가 동시에 쓰면 중복 키로 파일이 깨진다(실측). 합치는 것은 메인 또는 단일 `design-worker` 호출만 한다.
- **완료 보고의 수치를 사용자에게 인용하지 않는다.** "하드코딩 0건", "30개 바인딩" 같은 서브의 자기 보고는 검사 결과와 4건 중 4건 달랐다(실측). 사용자에게 말하는 숫자는 `design/verify/` 검사 파일의 숫자뿐이다.
- **`templates/` 는 읽기 전용이다.** 서브는 템플릿을 복사해 산출 경로에만 쓴다. 모든 단계의 종료조건 검사에 `git diff --quiet -- templates/ && echo intact` 를 넣고, 변경이 있으면 그 단계는 FAIL 이며 `git checkout -- templates/` 로 되돌린 뒤 산출물을 다시 검증한다.
- **생성물 검증의 기준점은 워킹트리가 아니라 `git show HEAD:<템플릿 경로>` 다.** 워킹트리 템플릿은 그 서브가 방금 변조했을 수 있다 — 오염된 원본과 오염된 사본을 비교하면 오염이 안 보인다(D-28 실측: 통과 신호까지 받았다).
- **diff 보고는 종료 코드가 아니라 출력 줄 수로 받는다.** `git diff` 의 종료 코드 0 은 "명령 성공"이지 "차이 없음"이 아니다. `git diff --stat` 또는 `| wc -l` 원문을 EVIDENCE 에 넣게 한다.
- **모든 완료 보고는 근거 필드가 있어야 유효하다.** 서브의 반환 마지막에 `EVIDENCE:` 블록 — 읽은 파일은 `경로:줄범위`, 본 노드는 `node_id + 실측치`, 본 스크린샷은 `파일명 + 어느 위치에서 무엇을 봤는지`, 실행한 명령은 `명령 + 종료 코드`. 근거 블록이 없거나 항목이 비어 있는 보고는 메인이 **미완료로 되돌린다**. "실물을 열어 확인하라" 는 문장이 세 번 어겨졌다(D-10 마스터만 보고 판정, D-15 합성 케이스 미확인, D-22 파일 안 열고 형식 전언) — 문장으로는 막히지 않고, 근거를 적으려면 열 수밖에 없게 형식으로 막는다. 메인이 사용자에게 하는 보고도 같다: 수치·형식·존재 여부를 말할 때는 그 근거(검사 파일·줄·실측치)를 함께 적는다.
- **보고 메시지의 파일 경로도 인용하지 않는다.** 리포트 산출을 요구한 위임은 메인이 그 파일의 **존재와 줄 수(비어 있지 않음)** 를 `ls -l`·`wc -l` 로 확인한 뒤에만 완료로 친다(D-13 실측: 서브가 "세부: verify/a7_….md" 라고 보고했는데 파일이 없었다 — 판정은 맞았지만 근거 파일이 없으면 나중에 아무도 검증할 수 없다).
- **만든 것은 만든 직후 구조를 실측해 반환하게 한다.** 노드 ID 만 돌려받는 것으로는 만들어졌는지 알 수 없다. Figma 생성 브리프는 반환값에 실측치(자식 수·visible·크기·fill/opacity)를 요구하고, 검증 도구(합성 케이스·시험 페이지)에도 같은 규칙을 적용한다(D-15 실측: 합성 케이스에 벡터가 들어갔는지 확인하지 않은 채 "검출기 작동" 을 보고했고, 뒤늦게 반대 보고가 겹쳐 리포트가 덮어써짐).
- **시험용 자산(시험 페이지·합성 케이스)은 리포트가 파일로 확정되고 메인이 그것을 읽은 뒤에** 철거한다. 서브는 나중에 다시 실행될 수 있고, 철거된 대상을 검사한 보고는 무효인데 최신처럼 보인다.
- **같은 task 의 완료 보고가 두 번 이상 오면** 나중 것을 최신으로 가정하지 않는다. 두 보고의 전제(대상 파일·노드가 그 시점에 존재했는가)를 먼저 대조하고, 전제가 깨진 보고는 버린다. 리포트 파일은 덮어쓰기 대신 `<이름>.<n>.md` 로 남긴다.
- **같은 사용자 지적이 2회 반복되면 위임을 멈춘다.** 메인이 최종 산출물(화면 프레임)을 직접 열고 노드 트리를 직접 읽어 원인을 찾은 뒤에만 수정을 다시 위임한다. 실측에서 탭바 아이콘 결함이 서브 보고 두 번을 거쳐 세 번째 지적에서야 잡혔다.

**서브가 지킬 것 (에이전트 정의에도 박혀 있다)**
- **입력 화이트리스트 강제** — 브리프에 나열된 경로 외의 파일을 읽지 않는다. 더 필요하면 읽지 말고 `BLOCKED: <어떤 파일이 왜 필요한지>` 로 되돌린다.
- **산출 상한 준수** — 브리프의 상한 숫자를 넘기지 않는다. 브리프에 상한이 없으면 결과 맨 앞에 `WARN: no cap in brief` 를 적고 가장 작은 합리적 분량으로 쓴다.
- 만든 에이전트와 판정하는 에이전트는 **항상 다른 호출**. 같은 컨텍스트가 자기 결과를 평가하지 않는다.
- 서브의 `BLOCKED:` 반환은 사용자 질문으로 승격한다(호출 품질 게이트 4항을 채울 수 있고 비전문가가 답할 수 있는 질문일 때 — kind `blocked`, 결정형이므로 추천 먼저). **4항을 못 채우는 BLOCKED 는 보내지 않는다.** 메인이 가장 보수적 기본값으로 `ASSUMPTION:` 으로 강등하고 `state.human_gates.delegations[]` 에 `{stage, item: <BLOCKED 한 문장>, kind: "unknown", default_taken}` 으로 기록한 뒤 brief §6 가정 로그에 적고 같은 서브를 재호출한다. 서브가 추측으로 진행한 흔적(`ASSUMPTION:`)도 brief §6 가정 로그로 모은다.
- 서브의 완료 보고는 검증 근거가 아니다. 결과 파일을 `design-worker` 로 검사한다. 검사 항목에는 **하한(≥)과 상한(≤) 둘 다** 들어간다.
- 독립인 위임은 **한 메시지에 병렬**로 낸다(축별 후보, 화면별 조립, 컴포넌트별 생성).

## 사람 개입 지점 (5개 고정)

**사용자에게 보이는 모든 문장의 어휘 규칙.** 채팅·페이지·다이제스트·브리핑·FAIL 설명 전부 `scripts/lib/forbidden-words.js` 26개(디자인 어휘 14 + 문서·내부 용어 12) 0건. 특히 **PRD 는 '지금 계획', PRD대로는 '계획대로'** 로 부른다(interview_prompts §1-11) — 비전공자는 PRD 가 무엇인지 모른다. 검사 번호(B-n·P-n·H-n·C-n)도 사용자 문장에는 쓰지 않는다.

| # | 단계 | 무엇 | 형식 |
|---|---|---|---|
| 1 | 0 | 인터뷰 페이지(질문 ≤12 / fast ≤10 — 세트는 interview_prompts §6 · 갤러리 · 월드컵) | **아티팩트 링크 하나**. 버튼·한 줄 입력, 누르는 즉시 저장, 진행률 표시. 끝나면 "다 했어요". kind `interview_page` — 갤러리·월드컵은 취향형, 페이지 안의 PRD 반박(pushback)은 결정형이라 `recommended` 배지를 렌더한다 |
| 2 | 0 | 되묻기 ≤3턴 · 규칙표 ack | 채팅. 되묻기는 "어느 부분이?"·하드 제약 확인·Q1/Q5 재질문만(raw `F-n`/`A-F-n`, check-brief B-23 이 센다 — H- 원장이 아니다). 규칙표 ack 는 **0-H 한 화면**에 '제가 대신 정한 것 N개' 다이제스트(§6 가정 + `delegations[]`, 쉬운 말 한 줄씩) · 진술≠반응 고지(raw `N-<축>`) · RULE 전량표(`plain` 열)를 함께 담는다 — **추가 호출이 아니다**. 질문은 하나: "바꾸고 싶은 번호 또는 없음". kind `followup` |
| 3 | 1 | 토큰 세트 선택 | 스와치 HTML 보고 선택 → **선택 기록 후** AI 추천 공개(취향형). kind `token_choice` |
| 4 | 2 | 축별 선택 · 초안 승인 | 비교 HTML → 선택 / index.html → 승인(취향형, 선택 기록 후 추천 공개). kind `axis_choice` / `draft_approval` |
| 5 | 3 | 최종 확인 | **메인이 화면 프레임 스크린샷을 직접 열어 본 뒤** Figma 링크 + 검사 파일 수치 + 3축 자체 채점(보기 좋음 / 쓰기 쉬움 / 이 서비스다움)을 쉬운 말로(1=AI 가 만든 티, 3=신입, 5=시니어) 고지 → ack(결정형: '이대로 마무리 / 더 다듬기' 중 추천 먼저). 컴포넌트·마스터 확인은 화면 확인을 대체하지 못한다. kind `final_ack` |

추가 호출이 허용되는 예외 2개: 0단계 `[CONSTRAINT]` 충돌 질의(kind `constraint`), 3단계 `taste_gap` 질의(kind `taste_gap`). 결정형으로만 열리는 호출 2종: 게이트 4항을 채운 BLOCKED 승격(`blocked`), 상한 초과·같은 이유 2회 반복의 진행/보정/중단(`cap_exceeded`). 이 11종(정본 check-brief KINDS) 밖의 kind 로 부르거나 누적이 `caps.human_calls_max`(9 = 고정 6 + UNCLEAR 재발행 1 + 예외 2)를 넘으면 하네스 결함이고, check-brief B-24 가 FAIL 로 잡는다.

**호출 품질 게이트** — 사용자를 부를 때 ①무엇을 결정하는지 ②선택지 ③하네스 추천과 이유 ④결정 안 하면 뭐가 막히는지, 4개를 한 화면에 못 담으면 **부르지 않는다**. 사용자가 자료를 구하거나 정리하는 일은 0이다. 열린 결정 질문("무엇을 넣을까요 / 몇 개로 할까요 / 어떻게 보이면 좋을까요")은 금지다 — 입장은 하네스가 만들고 사용자는 반응한다. 시각 판단을 묻는 호출(`taste_gap`·초안 승인)은 최신 렌더(스크린샷 또는 페이지 링크)를 첨부해야 게이트를 통과한다.

**호출 3분류** — ③'추천을 언제 밝히는가' 는 호출 종류가 정한다. 같은 문서 안의 앵커링 방지(선택 기록 후 공개)와 '전문가로서 무엇이 맞다를 먼저' 는 이 표로 양립한다.

| 분류 | 해당 호출 | 추천 공개 |
|---|---|---|
| ①결정형 | PRD 반박(페이지 pushback — `recommended` 배지) · `[CONSTRAINT]` 충돌 · BLOCKED 승격 · `taste_gap` · 상한 초과·같은 이유 2회의 진행/보정/중단 · 규칙표 ack · 최종 확인 | **질문 문장 안에 먼저** — "저는 A 가 맞다고 봅니다 — 이유. 그래도 B 가 필요한 상황이 있을까요?" |
| ②취향형 | 토큰 세트 · 열린 축 · 갤러리/월드컵 · 초안 승인 | **선택 기록 후 공개**(앵커링 방지). raw 의 H- 4줄에는 추천을 미리 적어 두고, 사용자에게는 선택이 기록된 뒤 추천 줄을 보낸다 |
| ③바닥선 | WCAG 대비 · 스케일 단조성 · 프레임 규격 · c_checks 부정형 | **묻지 않는다** — 검사기가 FAIL 로 잡고 maker 가 고친다. '반드시 물어야만 하는 것만 추린다' 는 바닥선을 묻지 않는 것으로 실현된다 |

고정 메시지 골격(모든 호출, 4줄 — 취향형은 사용자 메시지에서 괄호의 추천만 뒤로 미룬다):

```
결정할 것: <한 문장, 쉬운 말>
선택지: ① <A> ② <B> (하네스 추천: ①)
추천 이유: <한 줄>
안 정하면: <기본값으로 무엇이 진행되는지 / 무엇이 막히는지>
```

사용자를 부르기 전에 `design/interview_raw.md` 에 `H-nn [<stage>/<kind>]` 한 줄 + 위 4줄을 append 하고 `state.human_gates.calls[]` 에 `{stage, kind, ts}` 를 기록한다. 사용자의 답 원문은 같은 블록 바로 아래 `답: <원문>` 줄로. `stage` 는 `interview`·`tokens`·`draft`·`figma`, **kind 허용 목록 11종(정본은 `scripts/check-brief.js` KINDS — 여기 목록은 사본)**: `interview_page` · `followup` · `constraint` · `blocked` · `token_choice` · `axis_choice` · `draft_approval` · `taste_gap` · `cap_exceeded`(같은 이유 2회 반복 브리핑 포함) · `repeat_brief` · `final_ack`. 되묻기(`F-n`)와 갤러리·월드컵 반응(`R-`·`W-`)은 H- 원장에 넣지 않는다. check-brief B-24 가 센다 — H- 항목마다 4줄 골격 존재 · kind 11종 안 · 누적 ≤ `caps.human_calls_max`. 이것이 "그 외에 부르면 결함" 의 판정 수단이다.

**게이트 미충족 BLOCKED** — 4항을 못 채우는 BLOCKED 는 보내지 않는다. 메인이 가장 보수적 기본값으로 `ASSUMPTION:` 강등 + `delegations[]` 기록(kind `unknown`) + brief §6 가정 로그 후 같은 서브를 재호출한다(위 '서브가 지킬 것' 참조).

## 산출물 지도

```
design/
  state.json            진행 상태 (재시작 근거)
  prd_analysis.md       0-A
  interview_raw.md      모든 사용자 발화 원문 (Q/A/R/W/T/D 태그 + 되묻기 F-n/A-F-n · 호출 원장 H-nn · 고지 N-<축> · 패턴 답 A-nn [PATTERN]) — 요약 금지
  references.md         0-A2 — 같은 카테고리 실제 서비스의 UX 패턴 표(REF-n, 출처 포함, 값은 없음)
  stimuli/              갤러리·월드컵·스와치 HTML + index.json (interview.html 은 check-interview-page.js 통과 후에만 발행)
  brief.md              0단계 산출물 (8필드 판단기준·대조표·§2c 여정 커버리지·§2d 상태 순위·§9 레퍼런스 패턴·가정)
  tokens.json           1단계 — HTML 과 Figma 가 공유하는 단일 정본
  design.md             1단계 — 토큰 원칙·제약·퀄리티 규칙(A/C)
  decisions.md          2단계 — 축·후보·선택·승인
  drafts/               2단계 — tokens.css, 화면 HTML, components.md, index.html
  verify/               검사 결과 (wcag·draft_review·a_report·c_report·exit_interview_page·exit_stage0~3·exit_stage3_c·final_review·stimuli_qa·c_detector_test·draft_shots/*.png)
  figma_nodes.json      3단계 — 생성 노드 ID
  figma.md              최종 — 링크·요약·사용 모델
```

## 실패 라우팅 요약

**사용자가 하네스 질문 밖에서 잡은 지적(external catch)** — 사용자가 스크린샷·링크를 보고 하네스가 묻지 않은 것을 지적하면(검증 2: 탭바 아이콘·배경 칩·화면 규격·기능 누락·온보딩·CTA 잘림 7건) 그 자체가 결함이다. raw 에 `X-nn [external]: <원문>` 으로 남기고, `docs/harness-defects.md` 에 **어느 검사·어느 질문이 잡았어야 했는지**를 적은 뒤 그 검사·질문을 고친다. 3-G '대신 정한 것' 합본(F-12)은 이 목록을 미리 줄이기 위한 장치다 — 사용자가 마지막에 훑을 수 있게.

- A FAIL → 위반 노드 수정 → A 재검
- C `local` → 속성 수정 → C 재검 (B 로 안 돌아감)
- C `direction` → 2단계 해당 축만 재발산. **fast 에서도 `direction`(tasks 불가·top_info 불일치·C-2/C-4/C-5/C-7) 1건에 한해 2-B 재발산 1회 허용** — 축 선택은 사용자를 다시 부르지 않고 `axis_choice.ai_pick` 자동 채택, `delegations[]` 에 기록(kind: 사용자가 Q12 로 위임했으면 `q12`, 아니면 `budget60`). 사람 개입 지점은 늘지 않는다
- C `taste_gap` → 사용자 질의 → brief/design.md 갱신 → 재검
- C 같은 이유 2회 → 0단계 해석 오류로 사용자 브리핑(kind `cap_exceeded`, 결정형 — 어느 해석이 틀렸다고 보는지와 추천 보정을 먼저)
- 어떤 루프든 상한(`state.caps`) 초과 → 결정형 호출(kind `cap_exceeded`, 추천 먼저, FAIL 은 쉬운 말로)로 사용자에게 넘김. **"이 정도면 됐다" 는 항상 사람이 정한다** — 단, 하네스가 어느 쪽을 권하는지 없이 넘기지 않는다.

## 컨텍스트 관리

- 메인은 인터뷰 대화를 붙잡고 있으므로 무겁다. 0단계 끝(brief.md 확정)과 2단계 끝(승인)은 **세션을 끊어도 되는 지점**이다. 그 시점에 상태 파일과 인수인계 메모(brief §12 / decisions §5)를 갱신한다.
- 재시작한 세션은 `state.json` + 해당 단계 산출물만 읽고 이어간다. `interview_raw.md` 전문을 다시 읽지 않는다(brief.md 가 요약 역할).

## 이 하네스에 없는 것

없는 것은 취향의 값(색·간격·서체)이다. 값은 사용자 반응에서, 패턴(같은 과업을 실제 서비스가 어떻게 푸는가)은 0-A2 레퍼런스(`design/references.md`)에서, 바닥선(접근성·규격·슬롭)은 c_checks·design.md §3 에서 온다. 미리 채우면 안 되는 것은 값뿐이다 — 값을 미리 채우면 사용자의 안목 대신 하네스의 답을 검토하게 된다. 판정 항목(카테고리)·패턴·바닥선은 내장되어 있고, 그것을 근거로 한 판정은 취향 발명이 아니다(design-judge 규칙 5).
