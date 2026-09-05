# 판단기준 8필드 스키마와 감사 절차

> 출처: harness-redesign D5 규칙 스키마. 취향 **내용**은 가져오지 않고 **형식**만 가져왔다.
> brief.md §4 의 모든 기준은 이 8필드(+감사 필드)를 전부 채워야 유효하다.

## 필드

| 필드 | 필수 | 값 | 왜 필요한가 |
|---|---|---|---|
| `rule_id` | ✓ | `RULE-NN` | 이후 단계(design.md·A/C 검증·decisions.md)가 이 ID 로 참조 |
| `statement` | ✓ | 한 문장, 판정 가능한 형태 | "자연스러워야 한다" 는 판정문이 아니다. "같은 목록 안 구분 방식은 1종" 처럼 예/아니오가 갈려야 한다 |
| `source_quote` | ✓ | `interview_raw.md` 에 **실제로 존재하는** 원문 인용 | 근거 없는 기준은 하네스가 발명한 취향이다. grep 으로 존재 확인 |
| `source_refs` | ✓ | `[R-05, W-2-1, A-03]` | 근거 개수 → confidence. 3건 미만 = provisional |
| `axis` | ✓ | 6축 중 하나 또는 `IA` / `domain` | 진술 vs 반응 대조표와 연결 |
| `exception` | ✓ | 이 기준이 적용되지 않는 조건 | **예외 없는 규칙은 반려.** 에이전트가 과잉 적용해 슬롭을 만든다. 정말 예외가 없으면 "없음 — 사유: …" 로 사유를 쓴다 |
| `verdict_method` | ✓ | `A` 또는 `C` | A = 노드 속성·데이터로 판정(A단계). C = 스크린샷을 봐야 판정(C단계). 검증 단계가 이 값으로 갈린다 |
| `borrow_scope` | ✓ | `element` / `whole_style` | "토스처럼" 은 whole_style. 사용자 명시 승인이 raw 에 없으면 `confidence: proposed` |
| `confidence` | ✓ | `confirmed` / `provisional` / `proposed` | 구현 강제 대상은 `confirmed` 만. provisional 은 참고, proposed 는 미적용 |
| `audit` | ✓ (0-G 후) | `entailed` / `over_generalized` / `unsupported` | 인용 정합성 감사 결과 |

## confidence 판정 규칙

- `confirmed`: source_refs ≥3, 전부 명시 반응(좋다/싫다 + 이유), audit = entailed
- `provisional`: source_refs <3, 또는 '애매'·`[NO_REASON]` 유래, 또는 진술만 있고 반응 없음
- `proposed`: audit ≠ entailed, 또는 whole_style 미승인, 또는 사용자 ack 에서 "잘못 이해" 지적

## 진술 vs 반응 충돌 처리

| 상황 | 처리 |
|---|---|
| 진술과 반응이 같다 | 정본 = 그 값, confidence 상향 근거 |
| 다르고 `user_constraint = false` | **정본 = 반응.** 대조표에 둘 다 남기고 사용자에게 1회 고지("말씀은 A 였는데 고르신 건 B 쪽이라 B 로 잡았습니다") |
| 다르고 `user_constraint = true` (`[CONSTRAINT]` 태그) | 자동 채택 금지. `BLOCKED:` 로 메인에 넘겨 사용자에게 묻는다 |
| 반응 0건 | 진술을 `provisional` 정본으로, 월드컵 대상 |

## 인용 정합성 감사 (0-G)

- **입력을 가린다.** 감사 에이전트에게는 `{rule_id, source_quote, statement}` 만 준다. 축·근거 ID·인터뷰 문맥·PRD 를 주지 않는다. 문맥을 주면 감사자가 문맥으로 빈틈을 메워 준다.
- 질문은 하나: "이 인용문만 읽었을 때, 이 statement 가 그 인용문에서 **따라 나오는가**?"
  - `entailed`: 인용문이 statement 를 직접 지지한다
  - `over_generalized`: 인용문은 특정 사례를 말하는데 statement 가 일반 규칙으로 넓혔다
  - `unsupported`: 인용문에서 statement 가 나오지 않는다
- 판정마다 한 줄 이유.
- **감사 에이전트는 규칙화 에이전트와 다른 호출**이어야 한다. 같은 컨텍스트가 자기 규칙을 감사하면 전부 entailed 가 나온다.

## 과적합 경고

- 특정 앱·서비스에서 유래한 근거가 한 기준의 source_refs 중 **35% 를 넘으면** `overfit_warning: <서비스명>` 을 붙인다. 분모는 그 기준의 근거 수.
- 경고가 붙은 기준은 confirmed 로 올리지 않는다.

## 형식 예시 (내용은 예시일 뿐 — 실제 기준이 아니다)

```
### RULE-04
- statement: 목록 화면의 첫 화면(스크롤 전)에 항목이 6개 이하로 보인다
- source_quote: "G-07 싫다 — 뭐가 이렇게 많아요, 어디를 봐야 할지" (R-07); "오른쪽이 편해요, 숨 쉴 틈이 있어서" (W-2-1)
- source_refs: [R-07, R-12, W-2-1]
- axis: 정보 밀도
- exception: 사용자가 명시적으로 '전체 보기' 를 누른 화면
- verdict_method: A
- borrow_scope: element
- confidence: confirmed
- audit: entailed
```
