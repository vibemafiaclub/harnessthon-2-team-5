# 판단기준 8필드 스키마와 감사 절차

> 출처: harness-redesign D5 규칙 스키마. 취향 **내용**은 가져오지 않고 **형식**만 가져왔다.
> brief.md §4 의 모든 기준은 이 8필드(+ `plain` + 감사 필드)를 전부 채워야 유효하다.
> 없는 것은 취향의 값(색·간격·서체)이다. 값은 사용자 반응에서, 같은 과업을 실제 서비스가 어떻게 푸는가(패턴)는 0-A2 레퍼런스(`design/references.md`)에서, 바닥선(접근성·규격·슬롭 패턴)은 c_checks·design.md §3 에서 온다. 이 스키마는 그 세 출처를 근거 필드로 구분하는 형식이다.

## 필드

| 필드 | 필수 | 값 | 왜 필요한가 |
|---|---|---|---|
| `rule_id` | ✓ | `RULE-NN` | 이후 단계(design.md·A/C 검증·decisions.md)가 이 ID 로 참조 |
| `statement` | ✓ | 한 문장, 판정 가능한 형태 | "자연스러워야 한다" 는 판정문이 아니다. "같은 목록 안 구분 방식은 1종" 처럼 예/아니오가 갈려야 한다 |
| `plain` | ✓ | 같은 규칙을 디자인 용어 없이 쓴 한 줄 | 0-H ack 표가 statement 대신 이것을 사용자에게 보인다. 금지어 14개(`scripts/lib/forbidden-words.js` 정본)가 들어가면 FAIL(check-brief B-19). 예: statement "같은 목록 안 구분 방식은 1종" → plain "목록의 줄들은 전부 같은 모양으로 나눈다 — 어떤 줄은 카드, 어떤 줄은 선처럼 섞지 않는다" |
| `source_quote` | ✓ | `interview_raw.md` 에 **실제로 존재하는** 원문 인용 | 근거 없는 기준은 하네스가 발명한 취향이다. grep 으로 존재 확인 |
| `source_refs` | ✓ | `[R-05, W-2-1, A-03]` | 근거 개수·종류 → confidence. 3건 미만 또는 종류 1가지 = provisional |
| `axis` | ✓ | 6축 중 하나 또는 `IA` / `domain` | 진술 vs 반응 대조표와 연결 |
| `exception` | ✓ | 이 기준이 적용되지 않는 조건 | **예외 없는 규칙은 반려.** 에이전트가 과잉 적용해 슬롭을 만든다. 정말 예외가 없으면 "없음 — 사유: …" 로 사유를 쓴다 |
| `verdict_method` | ✓ | `A` 또는 `C` | A = 노드 속성·데이터로 판정(A단계). C = 스크린샷을 봐야 판정(C단계). 검증 단계가 이 값으로 갈린다 |
| `borrow_scope` | ✓ | `element` / `whole_style` | "토스처럼" 은 whole_style. 사용자 명시 승인이 raw 에 없으면 `confidence: proposed` |
| `confidence` | ✓ | `confirmed` / `provisional` / `proposed` | 구현 강제 대상은 `confirmed` 만. provisional 은 참고, proposed 는 미적용 |
| `audit` | ✓ (0-G 후) | `entailed` / `over_generalized` / `unsupported` | 인용 정합성 감사 결과 |
| `narrowed` | ✓ (0-G 후) | 근거가 지지하는 만큼으로 좁힌 statement | over_generalized 면 statement 를 이것으로 교체 |

## 근거 종류 (source_refs 접두)

| 접두 | 종류 | 무엇을 가리키는가 |
|---|---|---|
| `A-` | 답변 | 질문 답 원문(`A-nn`, `A-F-n` 되묻기 답, `A-nn [PATTERN]` 은 §9 에만 흐른다 — 아래 과적합 경고) |
| `R-` | 타일 반응 | 갤러리 타일의 좋다/싫다/애매 + 이유(`R-<타일>`) |
| `W-` | 대비쌍 선택 | 월드컵 쌍의 선택 + 이유(`W-n`), `always` 쌍 포함 |
| `D-` | 문서 인용 | PRD·`prd_analysis.md` 의 원문 인용(사용자가 쓴 PRD 문장, `[CONSTRAINT]` 출처) |
| `T-` | 과업·시나리오 | §2b 과업(`T-n`)·시나리오 체험 답(Q8·Q9 의 흐름 확인) |

`Q-nn`(질문 원문)은 종류가 아니다 — 답 `A-nn` 과 짝지어 `qa` 증거가 된다(check-brief B-7b 는 A/R/W/D/T 접두만 센다). `REF-n` 도 종류가 아니다(아래 과적합 경고).

## confidence 판정 규칙

- `confirmed`: source_refs ≥3 **이고 근거 종류 ≥2(A-/R-/W-/D-/T- 접두 중 둘 이상)**, 전부 명시 반응(좋다/싫다 + 이유, 또는 질문과 짝지어진 답), audit = entailed. 같은 종류 근거만 3건이면 provisional — 한 각도로만 본 것이다(check-brief B-7b).
- `provisional`: source_refs <3, 또는 근거 종류 1가지, 또는 '애매'·`[NO_REASON]` 유래, 또는 진술만 있고 반응 없음, 또는 반응만 있고 진술 0건인데 always 쌍과 타일 반응이 다름(아래 표)
- `proposed`: audit ≠ entailed, 또는 whole_style 미승인, 또는 사용자 ack 에서 "잘못 이해" 지적

## 진술 vs 반응 충돌 처리

| 상황 | 처리 |
|---|---|
| 진술과 반응이 같다 | 정본 = 그 값, confidence 상향 근거 |
| 다르고 `user_constraint = false` | **정본 = 반응.** 대조표에 둘 다 남기고 사용자에게 1회 고지 — 자리는 0-H (b) 표(`축 | 말씀하신 것 | 고르신 것 | 저희가 잡은 것`)에서 1회, raw 에 `N-<축>: 고지 — "말씀은 A, 고르신 건 B → B" / 답` 기록(check-brief B-5 가 `^N-` 를 센다). 채팅으로 따로 부르지 않는다 |
| 다르고 `user_constraint = true` (`[CONSTRAINT]` 태그) | 자동 채택 금지. `BLOCKED:` 로 메인에 넘겨 사용자에게 묻는다(결정형 호출 — 추천을 먼저 밝힌다). raw 에 `[CONSTRAINT]` 와 `N-<축>` 둘 다 |
| 반응 0건 | 진술을 `provisional` 정본으로, 월드컵 대상 |
| 진술 0건(질문 없는 축 — fast 의 밀도·형태·타이포·강조·채도, full 의 타이포·채도) | **반응만으로 정본.** `always` 대비쌍 반응이 타일 반응과 같을 때만 confirmed, 다르면 provisional + 0-H (b) 표 고지(`N-<축>: 타일은 A, 쌍은 B → provisional`). 진술 칸은 '질문 없음(always 쌍)' 으로 채운다 — 빈 칸이 아니다 |

## 인용 정합성 감사 (0-G)

- **입력은 `{rule_id, statement, evidence[]}`.** evidence 종류는 `qa`(질문 원문 + 답변) / `pair`(무엇과 무엇 중 어느 쪽 + 이유) / `tile`(타일의 객관적 속성 + 판정 + 이유). 종류별 증거력을 브리프에 명시한다 — 질문 내용도 합의로 본다, 대비쌍 선택은 이유 없이도 방향 증거다, 이유 없는 애매는 무정보.
- **가린다**: 축 이름, 근거 ID, confidence, 하네스의 해석. **준다**: 자극의 객관적 속성, 질문 원문. (실측: 3필드만 주면 답변형·타일형 근거가 전건 무근거 판정. 통과 불가능한 감사는 신호가 아니다.)
- 판정 3택 + `narrowed`: 
  - `entailed`: 근거가 statement 를 직접 지지
  - `over_generalized`: 근거는 특정 사례·방향인데 statement 가 수치·범위를 넓혔다 → `narrowed` 로 statement 교체, confidence 유지
  - `unsupported`: 근거에서 statement 가 나오지 않는다 → `proposed`
- 판정마다 한 줄 이유. `narrowed` 는 항상 채운다(entailed 면 statement 그대로).
- **감사 에이전트는 규칙화 에이전트와 다른 호출**이어야 한다. 같은 컨텍스트가 자기 규칙을 감사하면 전부 entailed 가 나온다.

## 과적합 경고

- 특정 앱·서비스에서 유래한 근거가 한 기준의 source_refs 중 **35% 를 넘으면** `overfit_warning: <서비스명>` 을 붙인다. **분모·분자는 사용자가 언급한 앱 유래 근거(Q4 답·`borrow_scope` 판정 대상)만 센다.** 하네스가 수집한 레퍼런스(`REF-n`, `A-nn [PATTERN]`)는 분모에도 분자에도 넣지 않는다.
- 경고가 붙은 기준은 confirmed 로 올리지 않는다.
- 레퍼런스 패턴은 §2 IA(진입·1등 정보·상태 표현)·§2b 과업·2-B 축 후보에만 흐르고 **§3 시각 6축 정본의 근거가 되지 않는다** — 패턴이지 값이 아니다. `A-nn [PATTERN]` 을 6축 `axis` 기준의 source_refs 에 넣으면 그 기준은 `proposed`. `axis: IA` / `domain` 기준에는 넣을 수 있다.

## 형식 예시 (내용은 예시일 뿐 — 실제 기준이 아니다)

```
### RULE-04
- statement: 목록 화면의 첫 화면(스크롤 전)에 항목이 6개 이하로 보인다
- plain: 목록을 열었을 때 스크롤하기 전에는 6줄까지만 보이게 한다
- source_quote: "G-07 싫다 — 뭐가 이렇게 많아요, 어디를 봐야 할지" (R-07); "오른쪽이 편해요, 숨 쉴 틈이 있어서" (W-2-1)
- source_refs: [R-07, R-12, W-2-1]
- axis: 정보 밀도
- exception: 사용자가 명시적으로 '전체 보기' 를 누른 화면
- verdict_method: A
- borrow_scope: element
- confidence: confirmed
- audit: entailed
```

(source_refs 3건, 종류 R/W 2가지 → confirmed 요건 충족. R- 3건뿐이었다면 provisional.)
