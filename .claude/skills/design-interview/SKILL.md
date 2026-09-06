---
name: design-interview
description: 0단계 요구사항 정렬. PRD 를 입력으로 디자인 비전문가 사용자를 인터뷰하고, 라벨형 질문 대신 자극(축별 갤러리·이상형 월드컵·시나리오 내러티브)에 대한 반응에서 판단기준을 역추출해 design/brief.md 를 만든다. 사용자와의 대화는 메인 세션이 직접 하고, 자극 생성·규칙화·감사는 서브에이전트에 위임한다. design-harness 오케스트레이터가 호출하거나 "인터뷰 해줘 / 요구사항 정렬 / 취향 캐내기" 로 단독 호출.
argument-hint: "<PRD 경로> [--budget 40m]"
---

# design-interview — 0단계 요구사항 정렬 (인터뷰)

> **역할 분담.** 사용자는 **반응만** 한다(좋다/싫다/애매 + 이유, 시나리오에 대한 "맞다/아니다"). 판단기준을 언어화하는 것은 하네스의 일이다. 사용자에게 "모던한 게 좋으세요?" 같은 **라벨형 질문을 하지 않는다.** 사용자와 하네스의 어휘 이해가 달라 답이 무의미해진다.

> **입력**: PRD 파일. **출력**: `design/brief.md`, `design/interview_raw.md`, `design/prd_analysis.md`, `design/stimuli/*.html`.
> **상한**: 인터뷰 본질문 ≤12, 갤러리 타일 ≤24, 월드컵 ≤6라운드, 전체 ≤30분. **fast 모드(`--budget ≤45m`)** 는 본질문 ≤6(Q1·Q2·Q6·Q8·Q11·Q12), 갤러리 ≤12, 월드컵은 갈리지 않은 축 ≤2개 각 1쌍, ack 는 confirmed 만, 전체 12분. 상한은 사용자 피로를 막는 장치이며 초과·생략 항목은 가정으로 처리하고 §6 에 기록한다.
> **PRD 는 그대로 따르지 않는다.** 훌륭한 디자이너처럼 PRD 에 반박하고, 반박을 사용자에게 쉬운 말로 확인받아 brief §10 에 남긴다.

## 메인 vs 서브 분담

| 단계 | 누가 | 이유 |
|---|---|---|
| 0-A PRD 분석 | `design-judge` | 사용자 개입 없음, 판단 필요 |
| 0-B 인터뷰 | **메인 세션** | 서브에이전트는 사용자에게 질문할 수 없다 |
| 0-C 자극 생성 | `design-maker` | 생성 작업 |
| 0-D 갤러리 반응 수집 | **메인 세션** | 사용자 대화 |
| 0-E 월드컵 | 생성 `design-maker` / 수집 **메인** | |
| 0-F 규칙화 | `design-judge` | 깊은 판단 |
| 0-G 인용 정합성 감사 | `design-judge` (**0-F 와 다른 호출**) | 만든 쪽 ≠ 판정하는 쪽 |
| 0-H 규칙 전량표 ack | **메인 세션** | 사용자 승인 |

서브에이전트 브리프는 항상 세 문장으로 구성한다: **①입력 화이트리스트(아래 각 단계의 "브리프에 넘길 것" 그대로, 그 외 파일 읽기 금지) ②출력 경로 ③산출 상한 숫자(`state.caps` 의 `agent_*`)**. 인터뷰 내용을 프롬프트에 요약해 붙이지 않는다(요약하면 조건절이 빠지고, 빠진 조건절이 함정이 된다). 절차 문서(이 SKILL.md, concept.md)를 브리프에 얹지 않는다. 신규/재시작은 메인이 산출 파일 존재 여부로 판정하고 서브에는 알리지 않는다 — 서브는 항상 신규 작성이다.

## 시작 절차

1. `design/` 폴더가 없으면 만들고 `templates/brief.md → design/brief.md`, 빈 `design/interview_raw.md` 를 만든다.
2. `design/interview_raw.md` 에 이미 답변이 있으면 **재시작**이다. 마지막 기록된 단계 다음부터 이어간다. 이미 답한 질문을 다시 묻지 않는다.
3. 사용자에게 시작 안내를 **한 번만** 한다:

> 지금부터 화면을 만들기 전에 무엇을 만들어야 하는지 맞춰 보겠습니다. 디자인 용어를 몰라도 됩니다. 제가 보여 드리는 것에 대해 "좋다/싫다/애매하다" 와 그 이유를 편하게 말해 주시면, 기준을 정리하는 것은 제가 합니다. 모르겠으면 "모르겠음" 이라고 답하셔도 됩니다. 약 30분 걸립니다.

## 0-A. PRD 분석 (`design-judge`)

브리프에 넘길 것: **입력 화이트리스트 = PRD 경로 + `.claude/skills/design-interview/references/screen_derivation.md`** (화면 도출 7단계·반박 트리거 4개·대안 2개 절차). 출력 경로 `design/prd_analysis.md`. 상한 문장: "전체 ≤{agent_prd_analysis_lines_max}줄, 반박 ≤{agent_prd_pushback_max}, 미확정 ≤{agent_prd_open_questions_max}, 화면 흐름 후보 ≤{agent_flow_candidates_max}, 시나리오 ≤{agent_scenarios_max}, 감성 키워드 ≤{agent_emotion_keywords_max}" (값은 state.caps 에서). 신규/재시작 여부는 메인이 `prd_analysis.md` 존재로 판정하며 서브에 알리지 않는다.
실측 기준선(2026-09-05 fast 런): 상한 없이 6분 15초 · 278줄 · 반박 15건 중 소비 2건. 이 수치보다 유의미하게 작아야 한다.
요구 산출(각 항목은 **상한 안에서 가장 중요한 것부터**, 초과분은 쓰지 않는다):

1. **화면 흐름 후보 ≤`agent_flow_candidates_max`개** — `screen_derivation.md` 의 7단계(동사 추출 → 결정 1개 단위 → 데이터 객체마다 목록+상세 → 상태 전이와 **"지금 할 일이 있는가" 강조 순위** → 역할별 진입 → PRD 상한 규모로 채워 보기 → 주 화면 8~12장 상한)로 도출한 표(화면 / 진입 경로 / 이 화면의 1등 정보 후보 / 기능 매핑 / 1차 목적: 빠른 처리형·현황 파악형·선택형·입력형). 상태 순위표는 별도 표로. 흐름이 두 갈래로 갈리고 상한이 2 이상이면 둘 다 적고 무엇이 다른지 한 줄.
2. **시나리오 내러티브 ≤`agent_scenarios_max`개** — "아침에 일어나 앱을 켰다고 해 봅시다…" 형식. PRD §3 의 까다로운 상황(중복 소속·늦은 회신·겹치는 일정 등)이 각 시나리오에 최소 1개 들어가야 한다. 다이어그램·박스+화살표 금지.
3. **토큰 자리 목록** — PRD 에서 도출되는 "있어야 하는 토큰" (예: 진행 상태 N종 → semantic color N개, 두 주체 구분 → 구분 색 2개, 다량 목록 → 밀도 간격). 값은 적지 않는다.
4. **도메인 특수 기준 후보** — 이 도메인에만 있을 법한 기준(예시는 적지 않는다, 판단자가 PRD 에서 도출).
5. **인터뷰에서 확인해야 할 미확정 사항** — PRD 가 침묵하는 것 중 디자인에 영향을 주는 것.
6. **PRD 반박 목록(pushback) ≤`agent_prd_pushback_max`건** — `screen_derivation.md` 의 트리거 4개(기능↔상황 어긋남 / 규모에서 무너짐 / 최빈 상태 미처리 / 동시 만족 불가)에 걸리는 것만. 항목마다 **PRD 원문 인용 + 대안 2개(PRD 최대 준수안 / 요구 변경안)**. 영향이 큰 순서로 정렬하고 상한을 넘는 것은 쓰지 않는다(fast 에서는 Q11 로 2건만 묻는다). 세 종류로 태깅: `문제`(그대로 만들면 사용자 경험이 나빠지는 요구), `누락`(PRD 에 없지만 있어야 사용자 여정이 이어지는 것), `과잉`(있어도 가치가 낮아 빼는 게 나은 것). 항목마다 **대안 한 줄 + 사용자에게 물을 쉬운 말 한 문장**(디자인 용어 없이, 상황 예시로). 0건이면 "반박 없음 — 사유" 를 쓴다. 0건은 의심 신호다.
7. **적합성 단서** — PRD 에 드러난 회사·서비스·도메인의 성격(누가 쓰는가, 어떤 신뢰감·분위기가 기대되는가, 경쟁 서비스 카테고리, 플랫폼: 모바일/데스크톱/반응형). 실제 브랜드 자산(색·로고·글꼴)이 명시되면 `[CONSTRAINT]` 후보로 표시. 이것이 채점 3축 중 **적합성(그 회사의 서비스 같은가)** 의 기준이 된다.
   - **감성 키워드 가설 3~5개**(예: 따뜻한·신뢰감·실용적 — 예시일 뿐) 를 `[HYPOTHESIS]` 태그로 함께 적는다. **하네스 내부용**이다. 사용자에게 묻거나 보여 주지 않는다(라벨형 질문이 된다). 용도는 두 가지: 0-B 인터뷰 페이지의 갤러리 타일에서 각 축의 변형을 고를 때의 기준점, 1단계 토큰 rationale 의 보조 근거. 갤러리 반응이 가설과 어긋나면 반응이 이기고 가설은 폐기 기록.
8. **핵심 과업 3개** — PRD 유저스토리에서 "첫 사용자가 반드시 해낼 수 있어야 하는 일" 3개(예: 무엇을 등록하고 → 누구를 묶고 → 날짜를 확정한다). 과업마다 시작 화면·기대 경로. 채점 3축 중 **UX(직관적인가)** 의 검증 대상이 된다.

종료조건(`design-worker`, 하한·상한 모두 검사): 위 8개 섹션이 전부 존재 · 화면 표의 모든 행에 PRD 기능 번호 매핑 · 반박 항목마다 "물을 쉬운 말" 존재 · **전체 줄 수 ≤`agent_prd_analysis_lines_max`** · 반박 ≤`agent_prd_pushback_max` · 미확정 ≤`agent_prd_open_questions_max` · 흐름 후보 ≤`agent_flow_candidates_max` · 시나리오 ≤`agent_scenarios_max`. 상한 초과는 FAIL — 같은 서브에 "상한 이내로 압축, 추가 금지" 1회 되돌림.

## 0-B ~ 0-E. 인터뷰 페이지 — 링크 하나로 질문·갤러리·월드컵을 받는다

사용자 입력 전부를 **아티팩트 페이지 하나**(`templates/interview_page.html` 골격)로 받는다. 채팅으로 12번 답을 치게 하지 않는다. 질문·갤러리·월드컵이 한 페이지 4단계이고, 답은 누르는 즉시 `db` 에 저장되며, 진행률이 보인다. 되묻기 1~2건만 회수 후 채팅으로 한다(3턴 상한 유지).

### 0-B. 페이지 생성 (`design-maker`)

브리프에 넘길 것: **입력 화이트리스트 = `design/prd_analysis.md`, `templates/interview_page.html`, `.claude/skills/design-interview/references/interview_prompts.md`** (그 외 금지). 출력 `design/stimuli/interview.html` + `design/stimuli/gallery_index.json`(타일·쌍 ID → 축·변형). 상한 문장: "질문 ≤{human_interview_questions_max}, 타일 ≤{human_gallery_tiles_max}(축 6 × 2~3, 타일 1장 요소 ≤{agent_gallery_tile_elements_max}), 대비쌍 축당 1(≤6), 파일 ≤{agent_gallery_html_kb_max}KB".

maker 는 골격을 **`design/stimuli/interview.html` 로 복사한 뒤 그 사본의 `<script id="harness-data">` JSON 만 채운다.** `templates/interview_page.html` 은 **쓰기 대상으로 열지 않는다**(브리프에 이 문장을 넣는다). 마크업·스크립트는 고치지 않는다(D-6 함정 처리·진행률·폴백이 거기 있다). 채울 것:
- `questions[]`: `interview_prompts.md` §6 뼈대에서 PRD 로 문구를 바꾼 것. **PRD 가 이미 답한 질문은 넣지 않는다**(확인만 필요한 것은 `options` 에 "맞아요/아니에요"). **Q1·Q5 를 맨 앞에.** 선택지는 라벨이 아니라 **장면**(`scene`)으로, 2~3개. 자유서술 `free: true`, "모르겠음" `unknown: true` 는 항상. 금지어 13개가 문구에 들어가면 안 된다. PRD 반박은 `kind: "pushback"` 으로 대안 A/B/PRD대로 3택(0-A §6 의 "물을 쉬운 말"이 `text`). fast 는 Q1·Q5·Q2·Q6·Q8·Q11.
- `tiles[]`: 같은 화면 조각(PRD 도메인의 목록 행 3개 + 제목 + 버튼 + 상태 칩)을 축 하나씩만 바꾼 타일. `axis`·`variant` 는 페이지가 **숨긴다**(월드컵 자동 필터에만 쓴다). 대비 4.5:1 미만 조합 금지. 인라인 스타일만(외부 리소스 없음).
- `pairs[]`: 축마다 대비쌍 1개("옅은 것과 진한 것을 나란히"). 페이지가 갤러리 답으로 갈린 축은 자동으로 감춘다.
- `banner`: "글자 내용이 아니라 보이는 느낌만" 사전 고정.

**생성물 검증(`design-worker`, 발행 전)**: 기준점은 `git show HEAD:templates/interview_page.html` (워킹트리 템플릿이 아니다 — D-28). ①`git diff --quiet -- templates/` 종료 코드 0 이 아니면 FAIL, `git checkout -- templates/` 후 재검 ②HEAD 골격과 생성물에서 `harness-data` 블록을 제거한 나머지가 바이트 단위로 같은가(다르면 FAIL) ③JSON 유효, 질문 ≤상한·Q1·Q5 선두, 타일·쌍 수 ④사용자에게 보이는 텍스트 조각(title·intro·banner·질문·선택지 value·scene) 전부에서 금지어 13개 grep 0건 ⑤파일 크기 ≤상한. 결과는 `design/verify/exit_interview_page.md` 에 명령·출력 원문과 함께.

### 0-C. 발행과 안내 (메인 세션)

1. `artifact-capabilities` 스킬을 로드하고 `design/stimuli/interview.html` 을 **`capabilities: {db: {}}`** 로 발행한다. 발행 직후 `read_db`(collection `answers`)가 빈 목록을 정상 반환하는지 확인한다(연결 검증).
2. 사용자에게 링크와 한 문장: "링크를 열어 순서대로 눌러 주세요. 모르면 '모르겠음'. 끝나면 '다 했어요'라고 말해 주세요. 약 10분."
3. 발행이 불가한 환경(오프라인·권한)이면 `open design/stimuli/interview.html` — 페이지가 브라우저에만 저장하고 "답변 내보내기" 칸을 보여 준다. 사용자가 그 JSON 을 채팅에 붙이면 같은 형식으로 처리한다.

### 0-D. 회수 (메인 세션)

사용자가 "다 했어요" 라고 하면 `Artifact(action: read_db, db_op: list, collection: "answers")` 로 전부 회수해 `design/interview_raw.md` 에 **원문 그대로** append:
- `kind: question` → `Q-nn: <question>` / `A-nn: <value> — "<free>"` (`unknown` 이면 `[UNCLEAR]`)
- `kind: pushback` → `A-nn [PRD-PUSHBACK]: <A|B|PRD대로> — "<free>"`
- `kind: tile` → `R-<id>: <verdict> — "<reason>"` (`reason` 없으면 `[NO_REASON]`)
- `kind: pair` → `W-n: <left|right|none> (chosen <id>) — "<reason>"`
- `meta-status` 의 `answered/total` 을 상태 파일에 기록.
`gallery_index.json` 으로 타일·쌍의 축·변형을 붙인다(0-G 감사 입력의 "자극의 객관적 속성"). 회수 문서 수와 `ts` 분포가 사용자 세션 시간대와 맞는지 확인한다.

### 0-E. 되묻기 (메인 세션, 채팅, ≤3턴)

회수 결과에서 **되묻기가 필요한 것만** 채팅으로: 특정 앱을 언급한 답("어느 부분이?"), `[CONSTRAINT]` 후보(브랜드 색·접근성), `[UNCLEAR]` 가 Q1·Q5 에 걸린 경우(1회 재질문 — 장면을 바꿔서). 그 외 `[UNCLEAR]` 는 기본값을 선언하고 가정으로 기록한다: "그럼 기본값으로 갈게요 — … 만들어서 보여드릴 테니 보고 말씀해 주세요." 3턴 안에 못 채운 것은 전부 가정. 어떤 경우에도 같은 질문을 3번 하지 않는다.

**말을 아낄 때의 전환 규칙**은 페이지가 흡수한다 — 질문은 건너뛸 수 있고, 갤러리·월드컵은 고르기라서 부담이 낮다. 답한 항목이 total 의 절반 미만이면 Q12(위임)를 채팅으로 한 번 묻고 "네" 면 미답 전부 `사용자 위임`.

## 0-F. 규칙화 (`design-judge`, 첫 호출)

브리프에 넘길 것: **입력 화이트리스트 = `design/interview_raw.md`, `design/prd_analysis.md`, `design/stimuli/*_index.json`, `templates/brief.md`, `.claude/skills/design-interview/references/rule_schema.md`, `.claude/skills/design-interview/references/answer_translation.md`**(비전문가 답변 표준 번역표 — 원문 아래에 번역을 적는다, 요약 대체 금지) (그 외 금지 — 특히 이 SKILL.md 와 concept.md 는 넘기지 않는다). 출력 `design/brief.md`. 상한 문장: "판단기준 {agent_rules_min}~{agent_rules_max}개, brief 전체 ≤{agent_brief_lines_max}줄".
요구 산출 = brief.md 전 섹션. 핵심 규칙:

1. **진술 vs 반응 대조표(§3) 먼저.** 축마다 인터뷰 진술값과 자극 반응값을 나란히 놓고 정본을 정한다. 다르면 **반응이 정본**. 단 `[CONSTRAINT]` 태그가 붙은 축은 반응으로 덮지 않고 `BLOCKED:` 로 메인에 되돌려 사용자에게 묻게 한다.
2. **판단기준은 8필드 전부 채운 것만** 유효. `source_quote` 없는 기준은 만들지 않는다. `exception` 이 없는 기준은 만들지 않는다(예외 없는 규칙은 과잉 적용되어 슬롭을 만든다). 근거 3건 미만이거나 '애매'/`[NO_REASON]` 에서 유래한 것은 `provisional`.
3. `verdict_method` 를 반드시 A(노드 속성으로 판정 가능) 또는 C(스크린샷을 봐야 함) 로 가른다. 이것이 뒤 단계의 검증 방식을 결정한다.
4. 사용자가 특정 앱을 언급한 기준은 `borrow_scope` 판정. 전체 스타일 차용은 사용자 명시 승인이 raw 에 없으면 `proposed`.
5. 기준 개수는 `agent_rules_min`~`agent_rules_max`(full 8~20, fast 6~12). 상한을 넘으면 근거가 약한 것부터 **버린다**(provisional 로 내려도 개수에 포함된다). brief 전체는 `agent_brief_lines_max` 줄 이내.
6. 가정 로그(§6)에는 인터뷰에서 "모르겠음"·미응답·추론으로 채운 것을 **전부** 적는다.

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

메인은 결과를 brief.md 의 `audit:` 필드에 반영한다. `over_generalized` 는 **statement 를 `narrowed` 로 교체**하고 confidence 유지, `unsupported` 는 `proposed` 로 강등. 강등된 기준은 구현 강제 대상이 아니라 참고용이다. 감사 결과가 전건 강등이면 감사 입력 형식을 의심한다.

## 0-H. 규칙 전량표 ack (메인 세션, 1회)

사용자에게 표 하나를 보여 준다: `RULE-ID | statement | source_quote 1줄 | confidence`. 디자인 용어가 들어간 statement 는 괄호로 쉬운 말을 병기한다. 질문은 하나: "제 말을 잘못 이해한 것이 있으면 번호를 알려 주세요. 없으면 '없음'." 수정 요청은 raw 에 append 후 해당 기준만 고친다. ack 없이 다음 단계로 가지 않는다(ack 못 받은 상태로 시간 상한이 오면 전부 `provisional` 로 두고 진행, 상태 파일에 기록).

## 채점 3축 매핑

| 채점 축 | 이 단계가 만드는 근거 |
|---|---|
| UI 심미 | §3 대조표 정본 + §4 C 규칙 |
| UX 직관 | §2 화면 흐름·1등 정보 + §2b 핵심 과업 3개 |
| 적합성 | §11 적합성 단서 + §8 도메인 특수 기준 + §10 PRD 반박 결정 |

## 종료조건 (기계 판정 — `design-worker` 에 위임 가능)

- [ ] `design/brief.md` 존재, **전체 ≤`agent_brief_lines_max`줄**, §1 문제 진술 3~5
- [ ] §2 화면 표 행 전부에 PRD 기능 번호 매핑
- [ ] §3 대조표 6축 전부 정본 기입, `user_constraint=true` 축은 raw 에 사용자 확인 기록 존재
- [ ] §4 기준 `agent_rules_min`~`agent_rules_max`개(**초과도 FAIL**), 전건 8필드 채움, 전건 `audit` 값 존재, `source_quote` 가 `interview_raw.md` 에 실제 존재(grep)
- [ ] §6 가정 로그 1~15 (0건이면 가정을 침묵 처리한 것, 15 초과면 인터뷰가 실패한 것 — 둘 다 FAIL)
- [ ] §7 토큰 자리 표 3~10행
- [ ] §2b 핵심 과업 3개, 각각 시작 화면·기대 경로 존재
- [ ] §10 PRD 반박 로그 존재 — 항목 1~`agent_prd_pushback_max` 이거나 "반박 없음 — 사유" 명시, 각 항목에 사용자 확인 원문 또는 `사용자 위임`
- [ ] §11 적합성 단서 2~6줄
- [ ] 위 모든 상한 초과는 하한 미달과 같은 FAIL 로 보고한다
- [ ] `interview_raw.md` 답변 수 ≥ 질문 수 (답 없는 질문은 `[UNANSWERED]` 태그), 회수한 `meta-status.answered` 와 raw 의 항목 수 일치, 갤러리 반응 ≥5 또는 Q12 위임 기록
- [ ] `git diff --quiet -- templates/` 종료 코드 0 (템플릿 무변조), `design/verify/exit_interview_page.md` 존재·전건 PASS

## 이 스킬이 하지 않는 것

- 토큰 값 결정(→ `design-tokens`), 화면 초안(→ `design-draft-html`), Figma 조작(→ `design-figma-build`)
- 취향 내용을 미리 채우는 것. 이 스킬에는 "무엇이 좋은 디자인인가" 가 한 줄도 없다. 전부 사용자 반응에서 나온다.
