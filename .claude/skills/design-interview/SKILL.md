---
name: design-interview
description: 0단계 요구사항 정렬. PRD 를 입력으로 디자인 비전문가 사용자를 인터뷰하고, 라벨형 질문 대신 자극(축별 갤러리·이상형 월드컵·시나리오 내러티브)에 대한 반응에서 판단기준을 역추출해 design/brief.md 를 만든다. 사용자와의 대화는 메인 세션이 직접 하고, 자극 생성·규칙화·감사는 서브에이전트에 위임한다. design-harness 오케스트레이터가 호출하거나 "인터뷰 해줘 / 요구사항 정렬 / 취향 캐내기" 로 단독 호출.
argument-hint: "<PRD 경로> [--budget 40m]"
---

# design-interview — 0단계 요구사항 정렬 (인터뷰)

> **역할 분담.** 사용자는 **반응만** 한다(좋다/싫다/애매 + 이유, 시나리오에 대한 "맞다/아니다"). 판단기준을 언어화하는 것은 하네스의 일이다. 사용자에게 "모던한 게 좋으세요?" 같은 **라벨형 질문을 하지 않는다.** 사용자와 하네스의 어휘 이해가 달라 답이 무의미해진다.

> **입력**: PRD 파일. **출력**: `design/brief.md`, `design/interview_raw.md`, `design/prd_analysis.md`, `design/references.md`(0-A2), `design/stimuli/*.html`, `design/verify/exit_interview_page.md`, `design/verify/stimuli_qa.md`, `design/verify/exit_stage0.md`.
> **상한**: 인터뷰 본질문 **full 12 / fast 10**(`caps.human_interview_questions_max` — 페이지 항목 수 기준. **질문 세트와 순서의 정본은 `references/interview_prompts.md` §6 한 곳**이며 이 문서는 세트를 복제하지 않는다), 갤러리 타일 ≤24, 월드컵 ≤7쌍(`human_worldcup_rounds_max` = always 쌍(fast 5축) + 미결 ≤2), 전체 ≤30분. **fast 모드(`--budget ≤45m`)** 는 갤러리 ≤12, 월드컵은 always 쌍(진술형 질문이 없는 축 — 목록은 interview_prompts §7) 각 1 + 갈리지 않은 축 ≤2, 0-H (c) RULE 표는 confirmed 만, 전체 12분. 상한은 사용자 피로를 막는 장치이며 초과·생략 항목은 가정으로 처리하고 §6 에 기록한다 — 하네스가 대신 정한 것은 `state.human_gates.delegations[]` 에도 한 행씩 남긴다.
> **PRD 는 그대로 따르지 않는다.** 훌륭한 디자이너처럼 PRD 에 반박하고, **반박마다 하네스 추천을 먼저 밝힌 채** 사용자에게 쉬운 말로 확인받아 brief §10 에 남긴다.
> **사람 호출 3분류**(정본은 design-harness SKILL 의 호출 품질 게이트 문단): ①**결정형**(PRD 반박 · `[CONSTRAINT]` 충돌 · BLOCKED 승격 · 상한 초과 시 진행/보정/중단) — 추천을 질문 문장 안에 **먼저** 밝힌다("저는 A 가 맞다고 봅니다 — 이유. 그래도 B 가 필요한 상황이 있을까요?") ②**취향형**(갤러리 · 월드컵 · pattern 장면) — 선택 기록 후 추천 공개(앵커링 방지) ③**바닥선**(타일 대비 4.5:1 · 축 격리 · 골격 무변조 같은 형식 요건) — 묻지 않고 하네스가 고친다. "무엇을 넣을까요 / 몇 개 / 어떻게 보이면 좋을까요" 형 열린 결정 질문은 금지. 사용자를 부를 때마다 `interview_raw.md` 에 `H-nn [<stage>/<kind>]` + 4줄 골격을 **먼저** append 하고 `state.human_gates.calls[]` 에 `{stage, kind, ts}` 를 기록한다(check-brief B-24 가 센다 — "그 외에 부르면 결함" 의 판정 수단).

## 메인 vs 서브 분담

| 단계 | 누가 | 이유 |
|---|---|---|
| 0-A PRD 분석 | `design-judge` | 사용자 개입 없음, 판단 필요 |
| 0-A2 레퍼런스 수집 | `design-judge` (**0-A 와 같은 메시지에 병렬 호출**, 웹 허용) | 사용자에게 찾아오게 하지 않는다 — 하네스가 수집한다 |
| 0-B 페이지 생성 | `design-maker` | 생성 작업 |
| 0-B 생성물 검증 | `design-worker` (`scripts/check-interview-page.js` 실행만) | 세는 일은 산술 |
| 0-B ⑦ 자극 미감 QA | `design-judge` (**0-B maker 와 다른 호출**) | 만든 쪽 ≠ 판정하는 쪽 |
| 0-C 발행·안내 | **메인 세션** | 사용자 대화 · 링크 전 직접 열어 본다 |
| 0-D 회수 | **메인 세션** | 사용자 대화 |
| 0-E 되묻기 | **메인 세션** | 서브에이전트는 사용자에게 질문할 수 없다 |
| 0-F 규칙화 | `design-judge` | 깊은 판단 |
| 0-G 인용 정합성 감사 | `design-judge` (**0-F 와 다른 호출**) | 만든 쪽 ≠ 판정하는 쪽 |
| 0-H 규칙 전량표 ack | **메인 세션** | 사용자 승인 |

서브에이전트 브리프는 항상 세 문장으로 구성한다: **①입력 화이트리스트(아래 각 단계의 "브리프에 넘길 것" 그대로, 그 외 파일 읽기 금지) ②출력 경로 ③산출 상한 숫자(`state.caps` 의 `agent_*`)**. 인터뷰 내용을 프롬프트에 요약해 붙이지 않는다(요약하면 조건절이 빠지고, 빠진 조건절이 함정이 된다). 절차 문서(이 SKILL.md, concept.md)를 브리프에 얹지 않는다. 신규/재시작은 메인이 산출 파일 존재 여부로 판정하고 서브에는 알리지 않는다 — 서브는 항상 신규 작성이다.

## 시작 절차

1. `design/` 폴더가 없으면 만들고 `templates/brief.md → design/brief.md`, 빈 `design/interview_raw.md`, `design/verify/shots/` 폴더를 만든다.
2. `design/interview_raw.md` 에 이미 답변이 있으면 **재시작**이다. 마지막 기록된 단계 다음부터 이어간다. 이미 답한 질문을 다시 묻지 않는다.
3. 사용자에게 시작 안내를 **한 번만** 한다:

> 지금부터 화면을 만들기 전에 무엇을 만들어야 하는지 맞춰 보겠습니다. 디자인 용어를 몰라도 됩니다. 제가 보여 드리는 것에 대해 "좋다/싫다/애매하다" 와 그 이유를 편하게 말해 주시면, 기준을 정리하는 것은 제가 합니다. 모르겠으면 "모르겠음" 이라고 답하셔도 됩니다. 다른 앱을 찾아보거나 자료를 정리하실 일은 없습니다 — 보여 드릴 것은 제가 만들어 옵니다. 약 30분 걸립니다.

## 0-A. PRD 분석 (`design-judge`)

브리프에 넘길 것: **입력 화이트리스트 = PRD 경로 + `.claude/skills/design-interview/references/screen_derivation.md`** (화면 도출 8단계 — 6b 레퍼런스 대조·8 필수 플로우 대조 포함 — · 반박 트리거 5개 · 유형 정의 3줄 · 대안 2개 + 하네스 추천 절차). 0-A 는 `design/references.md` 를 읽지 않는다 — 0-A2 와 병렬이라 아직 없고, 레퍼런스 대조는 0-F 가 한다. 출력 경로 `design/prd_analysis.md`. 상한 문장: "전체 ≤{agent_prd_analysis_lines_max}줄, 반박 ≤{agent_prd_pushback_max}, 미확정 ≤{agent_prd_open_questions_max}, 화면 흐름 후보 ≤{agent_flow_candidates_max}, 시나리오 ≤{agent_scenarios_max}, 감성 키워드 ≤{agent_emotion_keywords_max}" (값은 state.caps 에서). 신규/재시작 여부는 메인이 `prd_analysis.md` 존재로 판정하며 서브에 알리지 않는다.
실측 기준선(2026-09-05 fast 런): 상한 없이 6분 15초 · 278줄 · 반박 15건 중 소비 2건. 이 수치보다 유의미하게 작아야 한다.
요구 산출(각 항목은 **상한 안에서 가장 중요한 것부터**, 초과분은 쓰지 않는다):

1. **화면 흐름 후보 ≤`agent_flow_candidates_max`개** — `screen_derivation.md` 의 8단계(동사 추출 → 결정 1개 단위 → 데이터 객체마다 목록+상세 → 상태 전이와 **"지금 할 일이 있는가" 강조 순위** → 역할별 진입 → PRD 상한 규모로 채워 보기 → 주 화면 8~12장 상한 → 필수 플로우 대조)로 도출한 표(화면 / 역할 / 진입 경로 / 이 화면의 1등 정보 후보 / 기능 매핑 — **PRD 기능 번호 또는 §10 P-nn**, PRD 밖 화면은 `X-nn` / 1차 목적: 빠른 처리형·현황 파악형·선택형·입력형). **상태 순위표(`| 상태 | 할 일 있음 | 손실 크기 | 강조 순위 | 담당 화면 후보 |`)와 역할별 진입표(`| 역할 | 진입 화면 | 첫 화면 1등 정보 |`)는 독립 표**로 따로 둔다. 상태 순위 1순위는 인터뷰 Q5 전이므로 `[HYPOTHESIS]`. 흐름이 두 갈래로 갈리고 상한이 2 이상이면 둘 다 적고 무엇이 다른지 한 줄.
2. **시나리오 내러티브 ≤`agent_scenarios_max`개** — "아침에 일어나 앱을 켰다고 해 봅시다…" 형식. **시나리오 1 은 등록 0건 첫 진입에서 시작**한다. 역할이 둘 이상이면 시나리오 1개는 **초대받은 쪽 시점**(링크를 열어 처음 보는 장면)이어야 한다. PRD §3 의 까다로운 상황(중복 소속·늦은 회신·겹치는 일정 등)이 각 시나리오에 최소 1개 들어가야 한다. 다이어그램·박스+화살표 금지.
3. **토큰 자리 목록** — PRD 에서 도출되는 "있어야 하는 토큰" (예: 진행 상태 N종 → semantic color N개, 두 주체 구분 → 구분 색 2개, 다량 목록 → 밀도 간격). 값은 적지 않는다.
4. **도메인 특수 기준 후보** — 이 도메인에만 있을 법한 기준(예시는 적지 않는다, 판단자가 PRD 에서 도출).
5. **인터뷰에서 확인해야 할 미확정 사항** — PRD 가 침묵하는 것 중 디자인에 영향을 주는 것.
6. **PRD 반박 목록(pushback) ≤`agent_prd_pushback_max`건** — `screen_derivation.md` 의 트리거 5개(기능↔상황 어긋남 / 규모에서 무너짐 / 최빈 상태 미처리 / 동시 만족 불가 / 필수 플로우 부재)에 걸리는 것만. 항목마다 **PRD 원문 인용 + 대안 2개(PRD 최대 준수안 / 요구 변경안) + 하네스 추천 1개(A 또는 B) + 추천 이유 한 줄 + 추천을 포함한 "물을 쉬운 말" 한 문장**(디자인 용어 없이, 상황 예시로 — "PRD 에는 X 인데 실제로 쓰다 보면 Y 한 상황이 생깁니다. 저는 Z 가 낫다고 봅니다 — 이유. 그래도 PRD 대로가 나은 경우가 있을까요?"). 추천 없는 양자택일은 결정 위임이므로 FAIL. 영향이 큰 순서로 정렬하고 상한을 넘는 것은 쓰지 않는다(fast 에서는 Q11 로 2건만 묻는다 — **그중 1건은 `누락` 우선**). 세 종류로 태깅: `문제`(그대로 만들면 사용자 경험이 나빠지는 요구), `누락`(PRD 에 없지만 있어야 사용자 여정이 이어지는 것), `과잉`(있어도 가치가 낮아 빼는 게 나은 것). **`누락` 유형은 최소 1건 검토한다** — 항목 9 대조표의 빈 칸이 후보이며, 정말 없으면 "누락 없음 — 사유" 를 쓴다. 전체 0건이면 "반박 없음 — 사유" 를 쓴다. 0건은 의심 신호다.
7. **적합성 단서** — PRD 에 드러난 회사·서비스·도메인의 성격(누가 쓰는가 — 역할마다 R-n 번호, 어떤 신뢰감·분위기가 기대되는가, 경쟁 서비스 카테고리, 플랫폼: 모바일/데스크톱/반응형). 실제 브랜드 자산(색·로고·글꼴)이 명시되면 `[CONSTRAINT]` 후보로 표시. 이것이 채점 3축 중 **적합성(그 회사의 서비스 같은가)** 의 기준이 된다.
   - **감성 키워드 가설 3~5개**(예: 따뜻한·신뢰감·실용적 — 예시일 뿐) 를 `[HYPOTHESIS]` 태그로 함께 적는다. **하네스 내부용**이다. 사용자에게 묻거나 보여 주지 않는다(라벨형 질문이 된다). 용도는 두 가지: 0-B 인터뷰 페이지의 갤러리 타일에서 각 축의 변형을 고를 때의 기준점, 1단계 토큰 rationale 의 보조 근거. 갤러리 반응이 가설과 어긋나면 반응이 이기고 가설은 폐기 기록.
8. **핵심 과업 3개** — PRD 유저스토리에서 "첫 사용자가 반드시 해낼 수 있어야 하는 일" 3개(예: 무엇을 등록하고 → 누구를 묶고 → 날짜를 확정한다). 과업마다 시작 화면·기대 경로. T-1 의 시작 화면은 항목 9 의 (a) 첫 진입 화면과 같아야 한다. 채점 3축 중 **UX(직관적인가)** 의 검증 대상이 된다.
9. **필수 플로우 대조표** — `screen_derivation.md` 8단계의 7항목((a) 첫 진입·온보딩 (b) 초대 보내기·공유 (c) 초대받은 쪽 첫 진입(미가입·링크) (d) 역할별 랜딩 (e) 알림·리마인드 진입 (f) 설정·탈퇴 (g) 계정 진입 — 가입·로그인·비로그인 시작) 각각에 화면 # 또는 "해당 없음 — 사유"(PRD 원문 인용). **(g) 는 판단이다(D-50)**: PRD 명시 / 침묵이지만 필요(기기 이동·타인 데이터·공유·결제·개인정보·서버 알림 신호) / 불필요(단일 기기 개인 도구·링크 게스트) 셋 중 하나를 근거와 함께 고르고, **필요 인데 없을 때만** 추천 방식(카카오·애플·구글 등 — 정본은 screen_derivation (g))을 넣은 `누락` 반박으로 Q11 에 간다. 나머지 둘은 묻지 않고 §2c 행·§6 가정으로 끝낸다. PRD 에 없는데 필요한 항목은 `X-nn` 화면으로 항목 1 표에 올리고 항목 6 에 `누락` 반박을 만든다. **사용자가 둘 이상인 PRD 에서 (b)·(c) 가 "해당 없음" 이면 FAIL.** 이 표가 brief §2c 의 씨앗이다.

종료조건(`design-worker` 는 **실행만**): `node scripts/check-prd-analysis.js --prd design/prd_analysis.md --state design/state.json --out design/verify/exit_prd_analysis.md` 종료 코드 0 — Z-1 §1~§9 존재 · Z-2 화면표 매핑 · Z-3 상태 순위 ≥2행 + 1순위 [HYPOTHESIS] · Z-4 역할별 진입표 · Z-5 반박(≤상한, 추천·이유·물을 쉬운 말, 금지어·취향형·열린 결정 0, 누락 ≥1 또는 '누락 없음 — 사유') · Z-6 필수 플로우 (a)~(g) 7행 + 계정 진입 ①②③ 판단 · Z-7 핵심 과업 3행 · Z-8 줄·미확정·시나리오 상한(M2 — 0-A 만 worker 서술 판정이던 것을 스크립트로). 아래는 같은 조건의 사람용 원문: 위 9개 섹션이 전부 존재 · 화면 표의 모든 행에 **PRD 기능 번호 또는 §10 P-nn** 매핑 · 상태 순위표 ≥2행(1순위 `[HYPOTHESIS]`) · 역할별 진입표 존재 · 반박 항목마다 "물을 쉬운 말" + **하네스 추천·이유** 존재 · **§6 의 물을 쉬운 말 전건 금지어 0건** — worker 가 §6 의 물을 쉬운 말 줄만 `/tmp/prd_ask.txt` 로 뽑아 `node scripts/lib/forbidden-words.js --taste /tmp/prd_ask.txt` 종료 코드 0(금지어 26개(scripts/lib/forbidden-words.js 정본, 디자인 14 + 문서 용어 12) + 취향형 패턴) · `누락` ≥1 또는 "누락 없음 — 사유" · 필수 플로우 대조표 7행(역할 둘 이상이면 (b)·(c) 에 화면 #) · **전체 줄 수 ≤`agent_prd_analysis_lines_max`** · 반박 ≤`agent_prd_pushback_max` · 미확정 ≤`agent_prd_open_questions_max` · 흐름 후보 ≤`agent_flow_candidates_max` · 시나리오 ≤`agent_scenarios_max`. 상한 초과는 FAIL — 같은 서브에 "상한 이내로 압축, 추가 금지" 1회 되돌림.

## 0-A2. 레퍼런스 수집 (`design-judge`, 0-A 와 같은 메시지에 병렬 호출)

**왜.** 오너 원문(interview_prompts.md §2 35행): "나는 지금 이 대화 세션을 벗어나지 않고 싶거든. 그래서 뭔가 내가 판단해야 되는 게 있으면 **네가 전부 근거 자료를 주거나 아니면 스크린샷 같은 것을 보내 주던가 해야 돼**." 금지되는 것은 사용자에게 레퍼런스를 찾아오게 하는 것이지 레퍼런스 자체가 아니다 — 하네스가 수집해 장면으로 보여 준다. 실측 결함 D-11(앱 화면으로 안 보임)·D-26(주 버튼 잘림)·D-33(탭바 회색 상자)·D-34(두 벌 프레임)는 전부 오너의 "다른 앱과 비교" 로 잡혔다 = 레퍼런스 부재의 실측이다. 가져오는 것은 **패턴**(같은 과업을 실제 서비스가 어떻게 푸는가)이지 **값**(색·간격·서체)이 아니다 — 값은 사용자 반응에서만 온다.

브리프에 넘길 것: **입력 화이트리스트 = PRD 경로**(그 외 파일 금지) **+ WebSearch/WebFetch 허용** — 브리프에 **"레퍼런스 수집 위임: 웹 검색·페이지 열람을 허용한다"** 를 명시한다(이 문장이 없으면 judge 는 화이트리스트 규칙으로 웹을 열지 않는다). 출력 `design/references.md`. 상한 문장: "행 {agent_references_min}~{agent_references_max}, 전체 ≤{agent_references_lines_max}줄". 0-A 와 **같은 메시지에 병렬**로 낸다(입력이 PRD 뿐이라 서로 의존하지 않는다). 0-A 를 재실행하지 않는다 — 과업(T-n) 매핑은 0-F 가 §9 를 채울 때, 화면 대조(screen_derivation 6b)는 0-F 가 §2 를 확정할 때 한다.

요구 산출:

| REF-n | 서비스 | 화면 | PRD 유저스토리 동사(등록·제안·확정…) | 처리 방식(진입·1등 정보·상태 표현·빈 상태) | 출처(URL 또는 앱명+화면명) | 유형(직접/간접) | 스크린샷(파일명 또는 '미확보 — 사유') | 차용(패턴만) |
|---|---|---|---|---|---|---|---|---|

- **같은 카테고리 서비스 ≥3(유형 '직접') + 인접 카테고리 ≥1('간접').** 유저스토리 동사마다 **≥2 서비스**(한 서비스만 보면 관행인지 그 앱의 버릇인지 모른다). check-references R-3·R-4.
- **스크린샷을 모은다(U-2).** judge 는 행마다 앱스토어/플레이스토어/공식 페이지의 화면 이미지 URL 을 적고, `design-worker` 가 `curl -L -o design/references/REF-n-k.png <url>` 로 저장한다(행당 1~3장, 폭 390 리사이즈 `sips -Z 390`). 못 구하면 스크린샷 열에 '미확보 — 사유'. **파일이 있는 행이 전체의 절반 미만이면 FAIL**(R-5) — 수집이 안 된 것이다. 스크린샷은 내부 비교용이다: 0-B 가 패턴 선택지 그림을 그릴 때 보고(P-17), 3-E 2콜이 같은 과업 화면과 나란히 놓고 본다. 사용자 페이지·산출물에 재배포하지 않는다.
- 처리 방식 열은 우리 도메인 말로 옮겨 적는다 — 이 열이 0-B pattern 질문의 장면 재료다.
- **금지**: 색 hex·로고·카피 기록, 서비스명의 사용자 노출(서비스명은 이 파일과 brief §9 에만 남고 인터뷰 페이지에는 장면만 보인다).
- 0건이면 "레퍼런스 없음 — 사유" 한 줄(검색이 막힘·카테고리가 신규 등). 사유 없는 0건은 FAIL.

종료조건(`design-worker`, 실행만): `node scripts/check-references.js --refs design/references.md --state design/state.json --out design/verify/exit_references.md` 종료 코드 0 — R-1 행 수 `agent_references_min`~`max` · R-2 출처 공백 0 · R-3 직접 ≥3 + 간접 ≥1 · R-4 과업마다 서비스 ≥2 · R-5 스크린샷 파일 있는 행 ≥ 전체의 절반(행마다 파일 또는 '미확보 — 사유') · R-6 처리 방식 열 금지어 0(서비스명·화면명 열은 고유명사라 제외). '레퍼런스 없음 — 사유' 한 줄이면 R-1 만 본다. 전체 줄 수 ≤`agent_references_lines_max`. 소비처: 0-B 화이트리스트(pattern 질문 생성), 0-F 화이트리스트(§9 채우기 + screen_derivation 6b 대조), check-brief B-18(`--refs`).

## 0-B ~ 0-E. 인터뷰 페이지 — 링크 하나로 질문·갤러리·월드컵을 받는다

사용자 입력 전부를 **아티팩트 페이지 하나**(`templates/interview_page.html` 골격)로 받는다. 채팅으로 12번 답을 치게 하지 않는다. 질문·갤러리·월드컵이 한 페이지 4단계이고, 답은 누르는 즉시 `db` 에 저장되며, 진행률이 보인다. 되묻기 1~2건만 회수 후 채팅으로 한다(3턴 상한 유지, `F-n` 태그로 check-brief B-23 이 센다).

### 0-B. 페이지 생성 (`design-maker`)

브리프에 넘길 것: **입력 화이트리스트 = `design/prd_analysis.md`, `design/references.md`(0-A2 — pattern 질문의 장면 재료), `templates/interview_page.html`, `.claude/skills/design-interview/references/interview_prompts.md`** (그 외 금지). 출력 `design/stimuli/interview.html` + `design/stimuli/gallery_index.json`(타일·쌍 ID → 축·변형, 쌍의 `always` 플래그, `skipped[]` = 뺀 뼈대와 사유). 상한 문장: "질문 ≤{human_interview_questions_max}(세트·순서는 interview_prompts §6 의 {mode} 정본), pattern 질문 ≤{agent_reference_patterns_max}, 타일 ≤{human_gallery_tiles_max}(축 6 × 2~3, 타일 1장 요소 ≤{agent_gallery_tile_elements_max}), 대비쌍 축당 1(≤{human_worldcup_rounds_max}, 진술형 질문이 없는 축은 always), 파일 ≤{agent_gallery_html_kb_max}KB". 브리프에 한 문장 더: **"0-A §6 의 물을 쉬운 말과 추천·이유를 그대로 `text`·`recommended`·`why` 로 쓴다 — 다시 쓰지 않는다."**

maker 는 골격을 **`design/stimuli/interview.html` 로 복사한 뒤 그 사본의 `<script id="harness-data">` JSON 만 채운다.** `templates/interview_page.html` 은 **쓰기 대상으로 열지 않는다**(브리프에 이 문장을 넣는다). 마크업·스크립트는 고치지 않는다(D-6 함정 처리·진행률·폴백·고정 힌트·추천 배지가 거기 있다). 채울 것:
- `frame`(필수, team-3 비교 반영 ①): 모든 자극은 페이지가 **390×844 폰 프레임**(상태바 44 / 상단 바 56 / 본문 / 하단 버튼 52 / 탭바 56 / 홈 34, 중립색)에 넣어 보인다 — 회색 박스 조각이 아니라 실제 앱처럼 보여야 비전공자가 읽는다. maker 는 `frame: {app_title, cta, tabs[] | false, active_tab}` 만 채우고(P-15), 타일·쌍·장면 단위로 `title`·`cta:false`·`tabs:false` 로 덮어쓸 수 있다. **색 축(색온도·채도·색 진하기)에서만** `chrome: {bg, surface, ink, accent}` 를 본문과 같은 값으로 함께 바꾼다 — 다른 축은 chrome 을 건드리지 않는다(축 격리).
- `questions[]` 공통 필드(후보 ③·④): 질문마다 `effect` 한 줄 — "이걸 정하면 ○○가 달라집니다"(≥6자, P-15). 왜 묻는지 모르면 대충 답한다. **결정형 질문(§1-10: Q2 1등 정보 · Q10 빈 상태 · Q11 반박 · Q4' 패턴 등 하네스가 의견을 가진 것)은 어느 kind 든 `recommended`(options.value 중 하나)·`why` 를 싣는다**(P-3) — 페이지가 배지로 보이고 '아직 안 고른 질문은 추천대로' 버튼이 미응답 질문을 그 값으로 채운다(`accepted_recommended: true`, 회수에서 '추천 수락' 으로 분류 — 직접 답한 것과 섞지 않는다). 취향형(Q1·Q5·Q3 계열·Q6a·갤러리·대비쌍)에는 recommended 를 싣지 않는다(앵커링) — P-3 이 결정형 누락과 취향형 추천을 둘 다 FAIL 로 잡는다. **pattern 은 결정형이다**(references.md 채택 열에서 하네스가 고른 쪽이 있으므로 recommended·why 필수; 앞 문단의 '고르지 못했으면 취향형' 은 폐기 — 고르지 못했으면 그 pattern 질문을 내지 않는다).
- `kind: pattern` 선택지(U-3): `options[].html` 필수 — 그 패턴으로 **우리 도메인 화면을 그린 본문 조각**(≥40자, 자리표시자 0, P-17). references.md 의 스크린샷(`design/references/REF-n-k.png`)을 보고 그리되 **스크린샷 자체를 페이지에 넣지 않는다**(브랜드·서비스명 노출). 페이지가 폰 프레임 안에 그림으로 보인다 — 비전공자는 '표로 한눈에' 를 글로 읽는 것보다 그림을 보고 고른다.
- `tiles[]`: 대표 화면(1등 정보가 있는 첫 화면)의 **본문 조각**(제목 + 목록 행 3개 + 상태 칩; 상단 바·하단 버튼·탭바는 프레임이 그린다)을 축 하나씩만 바꾼 타일. 요소 수 ≤ `agent_gallery_tile_elements_max`(10/8). 사용자가 싫다·애매를 누르면 페이지가 영역 칩 ①제목줄 ②본문·목록 ③아래 버튼 ④색 ⑤글자 를 열고 프레임에 같은 번호 배지를 띄운다(후보 ②: 위치를 말로 설명할 어휘가 없는 사람이 번호로 가리킨다) → `marks[]`. `axis`·`variant` 는 페이지가 **숨긴다**(월드컵 자동 필터에만 쓴다). 대비 4.5:1 미만 조합 금지. 인라인 스타일만(외부 리소스 없음). **축마다 "무엇을 바꾸는가" 가 정해져 있고 변형 사이에 그 속성이 실제로 달라야 하며, 그 밖의 속성은 같아야 한다**(D-32 실측: 타이포 축이 굵기·자간만 바꾸고 서체 계열은 안 바꿔 방향이 안 나옴; 두 속성이 같이 바뀐 타일의 반응은 어느 축에도 귀속할 수 없다 — P-5·P-6):

  | 축 | 변형 사이에 반드시 달라야 하는 것 |
  |---|---|
  | 색온도·무드 | 배경·텍스트의 hue (따뜻 ↔ 차가움), 나머지 동일 |
  | 정보 밀도 | 같은 영역의 항목 수와 행 간격 (3행 ↔ 6행) |
  | 형태 | radius 0 vs 16 이상, 카드(그림자/경계) vs 구분선 |
  | 타이포 성격 | **서체 계열**(serif ↔ sans, 또는 둥근 고딕 ↔ 각진 고딕) + 제목/본문 크기비 |
  | 강조 방식 | 1등 정보를 색으로 vs 크기로 vs 위치로 |
  | 색 채도 | 강조색 채도 (회색조에 가까움 ↔ 선명) |
- `pairs[]`: 축마다 대비쌍 1개("옅은 것과 진한 것을 나란히"). **진술형 질문이 없는 축(정본: interview_prompts §7 — fast 는 밀도·형태·타이포·강조·채도, full 은 타이포·채도 + 건너뛴 축)은 `always: true`** — 갤러리 결과와 무관하게 항상 노출하는 재검증 쌍(같은 축을 타일과 대비쌍 두 형식으로 본다). 나머지 축은 페이지가 갤러리 답으로 갈린 경우 자동으로 감춘다.
- `flows[]`(후보 ⑤, "따라가 보기" 투어): 시나리오 1 을 장면(step) 단위로. 페이지는 **한 번에 장면 하나**를 폰 프레임에 보이고, 오른쪽에 `장면 n/N · label` / 지금 상황(`now` 또는 narrative) / `누를 것: press → then` / 이 화면의 다른 모습(`states[]` 세그먼트: 마감 지남·하나도 안 고름 등) / 여기가 달라요 · 이 흐름이 맞아요 를 둔다. 장면마다 `press`(누를 버튼 문구 — 본문 html 의 `data-press` 요소 또는 그 장면의 `cta` 와 같은 문구가 파란 테두리로 강조된다) · `then`(누르면 어떻게 되는지) · 선택 `states[{label, html}]`. 마지막 장면(결과 화면)만 press 생략(P-16). 화면 조각을 가로로 늘어놓지 않는다 — 초보자에게 그것도 전문 표기법이다.
- `banner`: "글자 내용이 아니라 보이는 느낌만". 고정 힌트 문장 2개(intro 아래 "디자인 용어를 몰라도 됩니다…", 갤러리 배너 앞 "전부 하지 않아도 됩니다…")는 골격 마크업에 박혀 있으므로 maker 가 다시 쓰지 않는다.

**생성물 검증(`design-worker`, 발행 전 — 스크립트가 센다, worker 는 실행만)**:

```
node scripts/check-interview-page.js --page design/stimuli/interview.html --template-ref HEAD:templates/interview_page.html --index design/stimuli/gallery_index.json --state design/state.json --refs design/references.md --prompts .claude/skills/design-interview/references/interview_prompts.md --prd design/prd_analysis.md --out design/verify/exit_interview_page.md
```

종료 코드 0 이 통과다. 기준점은 `git show HEAD:templates/interview_page.html`(워킹트리 템플릿이 아니다 — D-28; P-1). 검사 P-0~P-20 의 사람용 설명은 스크립트 헤더에 있다 — 템플릿 무변조 · 골격 바이트 동일 · 질문 수·Q1/Q5 선두·타일/쌍 수 · unknown/free/scene·pushback recommended/why·pattern options · 금지어·취향형 패턴 · 6축 실제 차이 · 축 격리 · 타일 요소 수 · 자리표시자·PRD 어휘 · 타일 대비 · skeleton/payload · fast 필수 payload · §6 정본 대조 · 파일 크기 · frame·effect 한 줄(P-15) · 투어 press·강조 위치(P-16) · 패턴 선택지 그림(P-17) · 재검증 verifies 존재(P-18) · 레퍼런스 서비스명 비노출(P-19) · always 대비쌍 축 커버(P-20). **FAIL 은 해당 타일·질문만 maker 에 재생성 1회**(전체 재생성 아님 — 브리프에 FAIL 행 원문을 붙인다) 후 재실행. 종전의 worker 수동 grep ①~⑥ 은 이 스크립트로 대체됐다(D-30 과 같은 처방 — 세는 일을 worker 판단에 맡기면 틀린다).

**⑦ 자극 미감 QA(`design-judge`, 0-B maker 와 다른 호출, check-interview-page 종료 코드 0 뒤)**: 사용자가 반응할 자극이 조잡하면 역추출된 미감 기준도 조잡해진다(D-6 2회차 런에서 judge 가 실제로 했던 QA 의 복원). 메인이 먼저 `design/stimuli/interview.html` 을 aside-browser 로 열어 갤러리 단계(2단계 "골라 보기")를 `design/verify/shots/interview_tiles.png` 로 저장한다 — 불가 시 스크린샷 없이 진행하고 브리프 첫 줄에 `RENDER: none` 을 적는다(judge 는 리포트 첫 줄에 같은 표기를 옮긴다). 브리프에 넘길 것: **입력 화이트리스트 = `design/verify/shots/interview_tiles.png`(있으면) + `design/stimuli/interview.html`(타일 HTML 원문 — 스크린샷이 없을 때의 대체 근거, 판정 근거는 style 값) + `design/stimuli/gallery_index.json`**. 출력 `design/verify/stimuli_qa.md`, 상한 문장 "≤{agent_report_lines_max}줄". 타일마다 4항 — 정렬(요소의 좌우·상하 맞춤) / 간격 스케일(간격 값이 2~3단계 안에 있는가) / 색 역할 일관성(같은 역할 = 같은 색, 역할 없는 색 0) / 대비(본문·제목 4.5:1) — PASS/FAIL + 근거(스크린샷 위치 또는 style 값). fast 는 축마다 1장, 6장 표본. FAIL 타일은 **그 타일만** maker 1회 되돌림(브리프에 FAIL 행 원문) → check-interview-page 재실행. 점수·판정은 사용자에게 보이지 않는다(보이면 라벨형이 된다).

### 0-C. 발행과 안내 (메인 세션)

1. `artifact-capabilities` 스킬을 로드하고 `design/stimuli/interview.html` 을 **`capabilities: {db: {}}`** 로 발행한다. 발행 직후 `read_db`(collection `answers`)가 빈 목록을 정상 반환하는지 확인한다(연결 검증).
2. **메인이 발행 페이지의 2단계(골라 보기)를 직접 연다** — aside-browser 가능 시 `design/verify/shots/interview_gallery.png` 로 저장 후 Read, 불가 시 브라우저로 연다. 확인할 것: 타일 전부 렌더(깨진 조각·미로드 서체 없음), 축 라벨(`axis`·`variant`) 비노출, "모르겠음" 버튼이 모든 질문에 있음, pushback 에 "하네스 추천" 배지. 결과를 `design/verify/exit_interview_page.md` 끝에 `메인 확인: <스크린샷 파일 또는 '브라우저'> — 타일 N/N 렌더, 축 라벨 비노출, 모르겠음 N/N` 한 줄로 append 한다. **이 기록 없이 링크를 보내지 않는다.**
3. 사용자를 부르기 전에 `interview_raw.md` 에 `H-01 [interview/interview_page]` + 4줄 골격(결정할 것: 인터뷰 페이지의 질문·갤러리·월드컵 반응 / 선택지: 페이지의 각 항목 (하네스 추천: pushback 항목에만 배지로 표시) / 추천 이유: 결정형 항목마다 `why` / 안 정하면: 기본값 + §6 가정 로그로 진행)을 append 하고 `state.human_gates.calls[]` 에 `{stage: "interview", kind: "interview_page", ts}` 를 넣는다. 그다음 사용자에게 링크와 한 문장: "링크를 열어 순서대로 눌러 주세요. 모르면 '모르겠음'. 끝나면 '다 했어요'라고 말해 주세요. 약 10분."
4. 발행이 불가한 환경(오프라인·권한)이면 `open design/stimuli/interview.html` — 페이지가 브라우저에만 저장하고 "답변 내보내기" 칸을 보여 준다. 사용자가 그 JSON 을 채팅에 붙이면 같은 형식으로 처리한다.

### 0-D. 회수 (메인 세션)

사용자가 "다 했어요" 라고 하면 `Artifact(action: read_db, db_op: list, collection: "answers")` 로 전부 회수해 `design/interview_raw.md` 에 **원문 그대로** append. 태그는 아래 표가 정본이며 check-brief 의 정규식과 같은 표다. `nn` 은 페이지 질문 id 의 번호(뼈대 번호와 같게 매긴다 — Q5 → `Q-05`/`A-05`, B-17 이 `A-05` 를 찾는다):

| 레코드 | raw 형식 |
|---|---|
| `kind: question` | `Q-nn [<skeleton>/<payload>]: <question>` / `A-nn: <value> — "<free>"` (`unknown` 이면 `A-nn: [UNCLEAR]`, 미답이면 `A-nn: [UNANSWERED]`, `accepted_recommended` 면 `A-nn [ACCEPTED]: <value>` — 추천 수락은 직접 답과 구분해 §6 가정 로그 '추천 수락' 행 + `delegations[]` `{kind: "accepted"}` 에도 남긴다) |
| `kind: pushback` | `Q-nn [<skeleton>/pushback]: <text>` / `A-nn [PRD-PUSHBACK]: <A|B|계획대로> (추천 <recommended>) — "<free>"` |
| `kind: pattern` | `Q-nn [<skeleton>/pattern]: <text>` / `A-nn [PATTERN]: <value> — "<free>"` |
| `kind: tile` | `R-<id>: <verdict> [marks: ②본문·목록, ④색] — "<reason>"` (`marks` 도 `reason` 도 없으면 `[NO_REASON]`; marks 만 있으면 방향 증거 — 0-G 에서 `tile` 증거의 '가리킨 영역' 으로 쓴다) |
| `kind: pair` | `W-n: <left|right|none> (chosen <id>) — "<reason>"` (`always` 쌍인지는 `gallery_index.json` 으로 구분) |
| 되묻기(0-E) | `F-n: <원문> (Q-nn)` / `A-F-n: <답>` |
| 고지(0-H) | `N-<축>: 고지 — "말씀은 A, 고르신 건 B → B" / <답>` |
| 사람 호출 | `H-nn [<stage>/<kind>]` 다음 4줄 골격 `결정할 것: / 선택지: ① ② (하네스 추천: ①) / 추천 이유: / 안 정하면:`, 사용자의 답 원문은 같은 블록 바로 아래 `답: <원문>` — kind 는 check-brief B-24 허용 집합 11종(정본 check-brief KINDS): interview_page · followup(0-H 한 화면) · constraint · blocked · token_choice · axis_choice · draft_approval · taste_gap · cap_exceeded · repeat_brief · final_ack. 되묻기 `F-n` 과 반응 `R-`·`W-` 는 H- 원장에 넣지 않는다(각각 B-23·B-20 이 센다) |

`meta-status.summary` 의 세 묶음(직접 답한 것 / 추천대로 둔 것 / 대신 정할 것)은 0-H (a) 다이제스트의 초안이다 — 페이지가 이미 사용자에게 보였으므로 0-H 는 같은 묶음 이름을 쓴다. `meta-status` 의 `answered/total` 을 `state.stages.interview.answered` 에 기록한다(check-brief B-22 가 raw 의 A-/R-/W- 합계와 대조). `gallery_index.json` 으로 타일·쌍의 축·변형을 붙인다(0-G 감사 입력의 "자극의 객관적 속성"). 회수 문서 수와 `ts` 분포가 사용자 세션 시간대와 맞는지 확인한다.

### 0-E. 되묻기 (메인 세션, 채팅, ≤3턴)

회수 결과에서 **되묻기가 필요한 것만** 채팅으로. 기록은 `F-n: <원문> (Q-nn)` / `A-F-n: <답>`. **상한: F- 총 ≤3, 같은 원 질문(같은 Q-nn)에 ≤2** — check-brief B-23 이 센다. 대상: 특정 앱을 언급한 답("어느 부분이?"), `[CONSTRAINT]` 후보(브랜드 색·접근성), `[UNCLEAR]` 가 Q1·Q5 에 걸린 경우(장면을 바꿔 1회 재질문). 되묻기는 사람 개입 지점 #2 의 일부이며 **H- 원장에 넣지 않는다** — `F-n` 을 B-23 이 따로 센다. `[CONSTRAINT]` 충돌 질의(0-F 의 BLOCKED 승격 포함)는 예외 호출이라 `H-nn [interview/constraint]` 4줄 + `calls[]` 기록 후에 묻고, 결정형이므로 추천을 문장 안에 먼저 밝힌다.

- **모르겠음 → 기본값.** 그 외 `[UNCLEAR]` 는 기본값을 선언하고 가정으로 기록한다: "그럼 기본값으로 갈게요 — … 만들어서 보여드릴 테니 보고 말씀해 주세요." 기록은 둘 다 — §6 가정 행 + `state.human_gates.delegations[]` `{stage: "interview", item: "Q-nn", kind: "unknown", default_taken: "<값>", ts}`.
- **질문 실패(UNCLEAR 비율).** check-brief B-25 의 `[UNCLEAR]` 수 / 본질문 수 ≥ 1/2 이면 걸린 질문만 **장면을 바꿔** 0-B 로 1회 재생성·재발행(상한 1, 되묻기 3턴과 별도로 센다, 재발행도 `H-nn [interview/interview_page]`). 2회차에도 UNCLEAR 면 그 질문은 폐기하고 §6 에 `질문 실패 — Q-nn` 행을 쓴다. interview_prompts §1-4 의 "재작성·폐기" 절차는 여기가 정본이다.
- **Q12 위임.** Q12 답에서 위임 범위를 추출한다 — "전부 맡긴다" 면 `delegations[]` `{stage: "interview", item: "all", kind: "q12", default_taken: "하네스 결정", ts}` + `state.human_gates.token_set_choice.delegated = true` · `axis_choice.delegated = true`(1-C·2-E 는 ai_pick 을 자동 채택하고 고지만 한다 — 호출하지 않는다); "X 는 직접 고르겠다" 면 X 를 뺀 범위만 `delegated`. 답한 항목이 total 의 절반 미만인데 Q12 가 미답이면 Q12 를 채팅으로 한 번 묻고(F- 계수에 포함) "네" 면 미답 전부 `사용자 위임`(delegations kind q12, 항목마다 1행).
- 3턴 안에 못 채운 것은 전부 가정(delegations kind unknown). 어떤 경우에도 같은 질문을 3번 하지 않는다.

**말을 아낄 때의 전환 규칙**은 페이지가 흡수한다 — 질문은 건너뛸 수 있고, 갤러리·월드컵은 고르기라서 부담이 낮다.

## 0-F. 규칙화 (`design-judge`, 첫 호출)

브리프에 넘길 것: **입력 화이트리스트 = `design/interview_raw.md`, `design/prd_analysis.md`, `design/references.md`(0-A2 — §9 채우기 + §2 확정 시 screen_derivation 6b 대조), `design/stimuli/*_index.json`, `templates/brief.md`, `.claude/skills/design-interview/references/rule_schema.md`, `.claude/skills/design-interview/references/answer_translation.md`**(비전문가 답변 표준 번역표 — 원문 아래에 번역을 적는다, 요약 대체 금지) (그 외 금지 — 특히 이 SKILL.md 와 concept.md 는 넘기지 않는다). 출력 `design/brief.md`. 상한 문장: "판단기준 {agent_rules_min}~{agent_rules_max}개, brief 전체 ≤{agent_brief_lines_max}줄".
요구 산출 = brief.md 전 섹션(§1~§12 — 번호 정본은 템플릿 머리 주석, 빼거나 바꾸지 않는다). 핵심 규칙:

1. **진술 vs 반응 대조표(§3) 먼저.** 축마다 인터뷰 진술값과 자극 반응값을 나란히 놓고 정본을 정한다. 다르면 **반응이 정본**. 단 `[CONSTRAINT]` 태그가 붙은 축은 반응으로 덮지 않고 `BLOCKED:` 로 메인에 되돌려 사용자에게 묻게 한다. 진술형 질문이 없는 축(always 쌍만 있는 4축)은 반응만으로 정본 — always 쌍 반응이 타일 반응과 같을 때만 confirmed, 다르면 provisional + 0-H (b) 고지 대상. 진술≠반응인 축은 근거 열에 `N-<축>` 자리를 남긴다(고지와 raw 기록은 0-H 에서 메인이 한다).
2. **판단기준은 8필드 전부 채운 것만** 유효. `source_quote` 없는 기준은 만들지 않는다. `exception` 이 없는 기준은 만들지 않는다(예외 없는 규칙은 과잉 적용되어 슬롭을 만든다). 근거 3건 미만이거나 '애매'/`[NO_REASON]` 에서 유래한 것은 `provisional`. `plain`(같은 규칙을 디자인 용어 없이 쓴 한 줄)도 필수 — 0-H 가 statement 대신 이것을 보인다(B-19).
3. `verdict_method` 를 반드시 A(노드 속성으로 판정 가능) 또는 C(스크린샷을 봐야 함) 로 가른다. 이것이 뒤 단계의 검증 방식을 결정한다.
4. 사용자가 특정 앱을 언급한 기준은 `borrow_scope` 판정. 전체 스타일 차용은 사용자 명시 승인이 raw 에 없으면 `proposed`. 과적합 경고의 분모는 사용자가 언급한 앱(Q4·borrow_scope)만 — 하네스가 수집한 레퍼런스(`REF-n`)는 계수하지 않는다.
5. 기준 개수는 `agent_rules_min`~`agent_rules_max`(full 8~20, fast 6~12). 상한을 넘으면 근거가 약한 것부터 **버린다**(provisional 로 내려도 개수에 포함된다). brief 전체는 `agent_brief_lines_max` 줄 이내.
6. 가정 로그(§6)에는 인터뷰에서 "모르겠음"·미응답·추론으로 채운 것을 **전부** 적는다 — `state.human_gates.delegations[]` 와 1:1.
7. **§2c·§2d·§9·§10·§11 을 산술로 채운다.** §2 표에 역할 열(§11 의 R-n)과 1등 정보 열(사용자 확인 없이 0-A 후보를 옮겼으면 `[HYPOTHESIS]` + §6). §2c 는 고정 10행 — prd_analysis 항목 9 대조표에 시나리오·상태·역할 행을 더하고, 담당 화면이 없으면 사유(PRD 원문 또는 `A-nn` 인용). PRD 에 없는 화면은 `X-nn → §10 P-nn`. §2d 는 Q5 원문 ID(`A-05`)로 1순위를 확정한다. §9 는 `references.md` 행 중 §2b 과업(T-n)에 붙는 것만 옮기고 `A-nn [PATTERN]` 반응·채택/보류를 적는다 — **채택 행은 §2 IA·§2b 과업·2-B 축 후보에만 흐르고 §3 시각 6축 정본에는 흐르지 않는다.** §10 행마다 하네스 추천(0-A §6 그대로)과 사용자 확인 원문(`A-nn [PRD-PUSHBACK]`) 또는 `사용자 위임`/`모르겠음`. §11 의 "사용자 수준(익숙함·연령·기기)" 줄은 Q7 원문 또는 PRD 인용으로, 둘 다 없으면 `[HYPOTHESIS]` + §6.

## 0-G. 인용 정합성 감사 (`design-judge`, 별도 호출)

0-F 와 **다른 에이전트 호출**이어야 한다. 입력은 `design/audit_input.json`(`design-worker` 가 brief §4 + `interview_raw.md` + `stimuli/*_index.json` 에서 생성). 형식은 `{rule_id, statement, evidence[]}` 이며 **`evidence` 항목마다 종류와 그 종류에 필요한 사실을 붙인다**(D-4·D-5 실측: 3필드만 주면 답변형 근거 전건이 무근거 판정 — 통과 불가능한 감사는 신호를 주지 못한다).

| 종류 | 반드시 포함하는 것 | 증거력 (브리프에 명시) |
|---|---|---|
| `qa` 질문과 답변 | **질문 원문** + 답변 원문 | 질문에 담긴 내용도 합의된 것으로 본다("큰 글씨가 필요한 사용자가 있나요?" → "있음" 은 큰 글씨 요구의 근거다) |
| `pair` 대비쌍 선택 | 무엇과 무엇 중에서 어느 쪽을 골랐는지(자극의 객관적 속성) + 이유 원문 | 이유가 없어도 **방향** 증거다 |
| `tile` 타일 반응 | 그 타일의 객관적 속성("둥근 카드형, 비교 대상은 각진 구분선형") + 판정 + 이유 원문 | 이유 없는 "애매" 는 선호 정보가 없는 것이다 |

**가리는 것 / 주는 것** — '문맥' 처럼 넓은 말로 쓰지 않는다:

- 가린다: 축 이름, `source_refs` ID, `confidence`, 하네스가 그 반응을 어떻게 해석했는지, 다른 기준의 내용.
- 준다: 위 표의 사실 전부. 자극의 속성은 하네스의 해석이 아니라 자극의 사실이다.

판정은 `entailed` / `over_generalized` / `unsupported` 3택 + **`narrowed`**(근거가 지지하는 만큼으로 좁힌 statement — 실측에서 "1.5배"·"16px"·"4.5:1" 같이 하네스가 채워 넣은 수치가 전부 여기서 걸러졌다). → `design/audit_result.json`.

메인은 결과를 brief.md 의 `audit:` 필드에 반영한다. `over_generalized` 는 **statement 를 `narrowed` 로 교체**하고 confidence 유지, `unsupported` 는 `proposed` 로 강등. **교체로 사라진 수치·조건(예: 18px·4.5:1·hue 20~50°)은 그 규칙을 참조하는 §5 하드 제약·§7 토큰 자리·§8 도메인 기준에서도 지운다** — §4 만 고치면 1단계가 §7 을 읽고 감사가 제거한 수치를 되살린다(D-31 실측). 강등된 기준은 구현 강제 대상이 아니라 참고용이다. 감사 결과가 전건 강등이면 감사 입력 형식을 의심한다(2회차) — 다만 근거가 실제로 얇아서(이유 0건·축 미분리) 전건 강등이 나올 수도 있다(3회차). 둘은 감사 note 로 구분한다.

## 0-H. 규칙 전량표 ack (메인 세션, 1회, 한 화면)

사람 개입 지점 #2(되묻기·규칙표 ack) 안의 한 화면이다 — 추가 호출이 아니며 `H-nn [interview/followup]` 4줄로 기록한다(kind 는 check-brief B-24 허용 집합의 `followup`; F- 상한과는 별도). 한 화면에 세 블록을 **이 순서로** 보인다:

- **(a) "직접 답하신 것 N개 / 추천대로 두신 것 N개 / 제가 대신 정한 것 N개"** (페이지 마무리 화면과 같은 세 묶음, 후보 ③) — 앞 둘은 한 줄씩 짧게, 셋째는 §6 가정 행과 `state.human_gates.delegations[]`(모르겠음→기본값 · Q12 위임 · 시간상한 · 예산 60%) 를 합쳐 번호를 붙이고 **쉬운 말 한 줄씩**("3. 답이 늦는 분은 목록 맨 아래에 회색으로 두기로 했어요"). 0개면 "대신 정한 것은 없습니다" 한 줄.
- **(b) 말씀하신 것과 고르신 것이 다른 축만** — `축 | 말씀하신 것 | 고르신 것 | 저희가 잡은 것`(§3 에서 진술≠반응인 축, `[CONSTRAINT]` 축은 0-E 에서 이미 물었으므로 결과만). 없으면 "말씀과 고르신 것이 다른 부분은 없었습니다" 한 줄.
- **(c) RULE 전량표** — `RULE-ID | plain | source_quote 1줄 | confidence`. statement 대신 `plain` 열을 쓴다(디자인 용어가 든 statement 를 괄호 병기하는 방식은 폐기 — plain 이 없는 규칙은 B-19 FAIL). fast 는 confirmed 만.

질문은 하나: "제 말을 잘못 이해한 것이 있으면 번호를 알려 주세요 — 위 세 표 어디든. 없으면 '없음'." 표를 보이기 전에 (a)(b)(c) 텍스트를 `design/verify/ack_screen.md` 로 저장하고 `node scripts/lib/forbidden-words.js design/verify/ack_screen.md` 종료 코드 0(금지어 26개(scripts/lib/forbidden-words.js 정본, 디자인 14 + 문서 용어 12) 0건)을 확인한다 — 매치가 있으면 그 줄을 고쳐 다시 검사하고, 고친 뒤에만 보인다.

답은 raw 에 남긴다: (b) 의 축마다 `N-<축>: 고지 — "말씀은 A, 고르신 건 B → B" / <답>`, 호출 원장 `H-nn [interview/followup]` + 4줄, 수정 요청은 raw 에 append 후 해당 기준·가정만 고친다. `state.human_gates.rule_ack` 에 `{acked: true, at, quote: <답 원문>, fixes: [<바꾸자고 한 RULE·가정 번호>]}` 를 기록한다. **ack 없이 다음 단계로 가지 않는다.** ack 를 못 받은 채 `human_stage0_minutes_max` 가 오면 전부 `provisional` 로 두고 진행하되, 그것도 원장에 남긴다 — `delegations[]` `{stage: "interview", item: "rule_ack", kind: "timeout", default_taken: "전부 provisional", ts}` + §6 가정 행.

## 채점 3축 매핑

| 채점 축 | 이 단계가 만드는 근거 |
|---|---|
| UI 심미 | §3 대조표 정본 + §4 C 규칙 (+ 0-B ⑦ 자극 미감 QA 가 반응의 입력 품질을 지킨다) |
| UX 직관 | §2 화면 흐름·역할·1등 정보 + §2b 핵심 과업 3개 + §2c 필수 플로우 커버리지 + §2d 상태 강조 순위 + §9 레퍼런스 UX 패턴(채택 행) |
| 적합성 | §11 적합성 단서(사용자 수준 줄 포함) + §8 도메인 특수 기준 + §9 같은 카테고리 실제 서비스 + §10 PRD 반박 결정 |

## 종료조건 (기계 판정 — **`scripts/check-brief.js` 가 센다**, worker 는 실행만)

```
node scripts/check-brief.js --brief design/brief.md --raw design/interview_raw.md --state design/state.json --audit design/audit_result.json --refs design/references.md --page-report design/verify/exit_interview_page.md --out design/verify/exit_stage0.md
```
worker(Haiku)의 판단으로 세게 하면 섹션 경계(§2 vs §2b)·조사 변형·인용 대조에서 반복해서 틀렸고(3회 연속, D-30) 파일도 안 만들었다. 세는 일은 산술이다. 스크립트 종료 코드 0 이 통과이고, 리포트 파일은 스크립트가 쓴다. 아래 목록은 스크립트가 검사하는 항목의 사람용 설명이며 **번호와 순서는 check-brief.js 헤더 주석과 같다** — 여기에 있고 스크립트에 없는 항목은 없다.

- [ ] **T-0** `git diff --quiet -- templates/` 종료 코드 0 (템플릿 무변조)
- [ ] **B-1** `design/brief.md` 존재, **전체 ≤`agent_brief_lines_max`줄**
- [ ] **B-2** §1 문제 진술 3~5
- [ ] **B-3** §2 화면 표 행 전부에 매핑 — **PRD 기능 번호 또는 §10 P-nn**(PRD 밖 화면은 `X-nn → §10 P-nn`)
- [ ] **B-3b** §2 "이 화면의 1등 정보" 열 공백 0
- [ ] **B-3c** §11 "누가 쓰는가" 의 역할(R-n) 각각이 §2 역할 열에 ≥1
- [ ] **B-4** §2b 핵심 과업 T-1~T-3 각각 시작 화면·기대 경로 존재, **T-1 시작 화면 == §2c 첫 진입 행의 화면 #**
- [ ] **B-5** §3 대조표 6축 전부 정본 기입 · 진술·반응 중 한쪽이 비면 정본에 `provisional` · 둘 다 있고 다르면 raw 에 `N-<축>` 고지 기록 · `user_constraint=true` 축은 raw 에 `[CONSTRAINT]` 와 `N-` 둘 다
- [ ] **B-6** §4 기준 `agent_rules_min`~`agent_rules_max`개(**초과도 FAIL**)
- [ ] **B-7** §4 전건 8필드 채움, 전건 `audit` 값 존재
- [ ] **B-7b** `confirmed` 는 `source_refs` ≥3 **이고** 접두 종류(A-/R-/W-/D-/T-) ≥2
- [ ] **B-8** `verdict_method` 전건 A 또는 C
- [ ] **B-9** `source_quote` 가 `interview_raw.md` 에 실제 존재(grep)
- [ ] **B-10** §6 가정 로그 1~15 (0건이면 가정을 침묵 처리한 것, 15 초과면 인터뷰가 실패한 것 — 둘 다 FAIL)
- [ ] **B-11** §7 토큰 자리 표 3~10행
- [ ] **B-12** §10 PRD 반박 로그 — 행마다 "하네스 이의·대안"·"하네스 추천" 비어 있지 않음, "사용자 확인 원문" 비어 있지 않거나 `사용자 위임`/`모르겠음`; 행 수 1~`agent_prd_pushback_max`; 0건이면 "반박 없음 — 사유: …"; 유형 열에 `누락` ≥1 또는 "누락 없음 — 사유"
- [ ] **B-13** §11 적합성 단서 2~6줄
- [ ] **B-14** 감사가 제거한 수치가 §5/§7/§8 에 잔존하지 않음(`--audit` 있을 때)
- [ ] **B-15** `interview_raw.md` 답변 수 ≥ 질문 수 (답 없는 질문은 `[UNANSWERED]` 태그)
- [ ] **B-16** §2c 고정 10행 전부 존재, 각 행 담당 화면 # 가 §2 번호 집합에 있거나 사유 열 비어 있지 않음; 초대·초대받은 쪽 행이 둘 다 "해당 없음" 인데 §2 역할 열 값이 2종 이상이면 FAIL
- [ ] **B-17** §2d 상태 순위 ≥2행, raw 에 `A-05` 가 있으면 1순위 행이 `A-05` 를 참조
- [ ] **B-18** §9 레퍼런스 행 수 `agent_references_min`~`agent_references_max`, 출처 열 공백 0, T-1~T-3 각각 "우리 과업" 열에 ≥1(fast)/≥2(full); `--refs` 의 `design/references.md` 존재·≥10줄
- [ ] **B-19** §4 각 RULE 에 `plain:` 존재, plain 에 금지어 26개(scripts/lib/forbidden-words.js 정본, 디자인 14 + 문서 용어 12) 0건
- [ ] **B-20** 갤러리·월드컵 반응(`R-` 좋다/싫다 + `W-` left/right) ≥5 또는 `delegations[]` 에 kind `q12`
- [ ] **B-21** `--page-report`(`design/verify/exit_interview_page.md`) 존재·비어 있지 않음·`| FAIL |` 0
- [ ] **B-22** `state.stages.interview.answered` 가 raw 의 A-/R-/W- 합계와 일치(없으면 N/A)
- [ ] **B-23** 되묻기 `F-n` 총 ≤3, 같은 원 질문 ≤2
- [ ] **B-24** 사람 호출 `H-nn` 각 블록에 "결정할 것·선택지·추천 이유·안 정하면" 4라벨, kind ∈ 11종(정본 check-brief KINDS), 건수 ≤`human_calls_max`
- [ ] **B-25** 답변 활용률 — raw 의 `A-nn` ID 가 brief §2/§3/§4/§5/§6/§9/§10 어디든 등장하는 비율 ≥2/3; `[UNCLEAR]` 수 / 본질문 수 <1/2
- [ ] **B-27** 추천 수락 정합 — raw `A-nn [ACCEPTED]` 수 == §6 '추천 수락' 행 수 == state delegations kind accepted 수
- [ ] **B-26** §11 "누가 쓰는가"·"사용자 수준(익숙함·연령·기기)" 줄 공백 0
- [ ] 위 모든 상한 초과는 하한 미달과 같은 FAIL 로 보고한다

## 이 스킬이 하지 않는 것

- 토큰 값 결정(→ `design-tokens`), 화면 초안(→ `design-draft-html`), Figma 조작(→ `design-figma-build`)
- 사용자에게 레퍼런스를 찾아오게 하는 것 — 레퍼런스는 0-A2 가 수집하고 장면으로만 보인다.
- 취향의 값을 미리 채우는 것. **없는 것은 취향의 값(색·간격·서체)이다. 값은 사용자 반응에서, 같은 과업을 실제 서비스가 어떻게 푸는가(패턴)는 0-A2 레퍼런스에서, 바닥선(접근성·규격·슬롭 패턴)은 c_checks·design.md §3 에서 온다.**
