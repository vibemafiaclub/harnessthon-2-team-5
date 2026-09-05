---
name: design-tokens
description: 1단계 토큰·디자인 가이드 확정. design/brief.md 의 축별 정본과 토큰 자리에서 토큰 세트 후보 2~3개를 만들어 HTML 스와치로 나란히 보여 주고, 사용자가 고른 세트를 design/tokens.json 으로 확정한 뒤 design/design.md(토큰 원칙·제약·퀄리티 규칙)를 작성한다. 접근성 대비율은 사용자 선택과 무관하게 강제한다. design-harness 가 호출하거나 "토큰 정리 / 디자인 가이드 만들어" 로 단독 호출.
argument-hint: "[--sets 3]  (fast 모드는 2)"
---

# design-tokens — 토큰 세트 확정과 디자인 가이드

> **입력**: `design/brief.md`, `design/prd_analysis.md`. **출력**: `design/tokens.json`, `design/design.md`, `design/stimuli/design_guide_<SET>.html`, `design/stimuli/design_guide_compare.html`.
> **분류 체계 출처**: 팀 디자이너의 `prd-to-design-guide` 스킬(6카테고리 + 결정 근거 규율). Figma 캔버스 시각화는 채택하지 않고 HTML 가이드 페이지로 대체한다. Figma 쪽은 3단계에서 Variables 로 들어간다.
> **원칙**: 인터뷰 반응은 방향(따뜻함·덜 빽빽함)을 주고 값(#F5EFE6, 8pt)은 주지 않는다. 값은 하네스가 후보로 만들고, 확정은 **사용자가 나란히 보고** 한다. 값을 사용자에게 묻지 않는다.

## 분담

| 단계 | 누가 |
|---|---|
| 1-A 토큰 세트 후보 생성 + 세트별 디자인 가이드 HTML | `design-maker` |
| 1-B 접근성 대비율 검사·보정 | `design-worker` (검사) → `design-maker` (보정) |
| 1-C 세트 선택 | **메인 세션** |
| 1-D tokens.json 확정 + design.md 작성 | `design-maker` |
| 1-E 종료조건 검사 | `design-worker` |

## 1-A. 토큰 세트 후보 (`design-maker`)

브리프에 넘길 것: **입력 화이트리스트 = `design/brief.md`, `design/prd_analysis.md`, `templates/tokens.json`** (그 외 금지). 출력 `design/stimuli/token_sets.json`(세트 `human_token_sets`개 배열), 세트별 `design/stimuli/design_guide_<SET>.html`. 상한 문장: "세트 {human_token_sets}개, 가이드 HTML 1파일 ≤{agent_draft_html_lines_max}줄, rationale 은 카테고리당 2문장 이내".

요구 사항:

- 각 세트는 `templates/tokens.json` 스키마의 **6카테고리(컬러·타이포·스페이싱·래디어스·엘리베이션·아이콘)를 전부** 채운다. 빈 문자열 금지. 상태 색 개수는 brief §7 토큰 자리 표를 따른다.
- **카테고리별 `rationale` 필수.** "왜 이 값인가" 를 brief 근거 ID(R-/W-/A-), 적합성 단서(brief §11), PRD 원문 중 하나 이상과 연결해 한두 문장. 근거 없는 값은 만들지 않는다. prd_analysis 의 감성 키워드 가설은 근거로 인용 가능하되 반응 정본과 충돌하면 반응이 이긴다.
- 카테고리별 세부 규칙:
  - **컬러**: primary 6단계 스케일, secondary 3단계, neutral 8단계, feedback 4쌍(배경+텍스트), 도메인 상태 N쌍, surface 3계층. 모든 텍스트/배경 쌍에 WCAG 통과 여부 표기.
  - **타이포**: 본문용 1 + 디스플레이용 1(필요시), 한글 서비스는 한글 웹폰트 우선, fallback 명시. 스케일 9단계(display~overline) 각각 size·lineHeight·weight·letterSpacing. 모바일/데스크톱이 다르면 양쪽 기입.
  - **스페이싱**: 4 또는 8 기반, 스케일 + **용도 매핑** + 주요 컴포넌트(버튼·카드·인풋·모달·목록 행) 내부 패딩.
  - **래디어스**: 스케일 + 컴포넌트별 용도 매핑 + **동심원 규칙**(outer = inner + padding).
  - **엘리베이션**: sm/md/lg 3단계, 각 offset·blur·spread·color·opacity·용도.
  - **아이콘**: outlined/filled/duotone 중 선택 + 근거, 크기 16/20/24, 스트로크는 본문 weight 에 맞춤.
- 세트 간 차이는 brief §3 대조표에서 **정본이 확정된 축은 고정**하고, 남은 자유도(정확한 색상값·라운딩 크기·글꼴 계열)에서만 낸다. 정본을 뒤집는 세트를 만들지 않는다.
- 세트마다 한 줄 설명은 디자인 용어 없이("조금 더 따뜻한 쪽", "선이 더 또렷한 쪽").
- **세트별 디자인 가이드 HTML** (`design_guide_<SET>.html`), 7섹션 세로 배치: ①헤더(서비스명·생성일, 감성 키워드는 **표시하지 않는다**) ②컬러 팔레트 스워치(사각형+HEX+이름+WCAG 표기) ③타입 스케일을 실제 크기로 렌더 ④스페이싱을 길이가 다른 바로 ⑤래디어스를 실제 적용된 사각형으로 ⑥그림자 3단계 카드 ⑦**적용 예시** — brief §2 첫 화면의 화면 조각(목록 행 3개 + 상태 칩 + 버튼 + 인풋)을 그 세트 토큰으로 렌더. **메타 일관성**: 가이드 페이지 자체가 그 세트의 토큰으로 만들어져야 한다(제목 글꼴·여백·색 전부).
- 사용자 선택 화면은 **⑦ 적용 예시를 세트별로 나란히** 놓은 `design_guide_compare.html`. 색 칩 나열로는 사용자가 판단하지 못한다. 각 세트에서 전체 가이드 페이지로 가는 링크.
- 외부 리소스 없는 단일 HTML(웹폰트는 로컬 시스템 폰트 스택 fallback 포함). 세트 ID 는 `SET-A/B/C`. 사용자에게 보이는 설명은 디자인 용어 없이 한 줄, 축 이름·감성 키워드는 숨긴다.
- fast 모드: 세트 2개, 가이드 페이지는 ②③⑦ 만.
- 하드 제약(brief §5)에 브랜드 색이 있으면 모든 세트가 그 값을 포함한다.

## 1-B. 접근성 검사 (`design-worker` → 필요시 `design-maker`)

`design-worker` 브리프: `design/stimuli/token_sets.json` 을 읽고 세트마다 아래 쌍의 WCAG 대비율을 계산해 `design/verify/wcag_tokens.md` 에 기록.

- `text.primary` / `bg.page`, `text.primary` / `bg.surface`, `text.secondary` / `bg.page` → 4.5:1 이상
- `text.on-brand` / `brand.default` → 4.5:1 이상
- 각 `status.*` 위 텍스트(어떤 텍스트 토큰을 쓰는지 세트에 명시) → 4.5:1 이상
- `border.default` / `bg.page` → 3:1 이상

계산은 파이썬 한 파일로(상대 휘도 → 대비율), 명령과 출력 원문 첨부. 미달 쌍이 있으면 `design-maker` 에 되돌리되 보정 브리프에 다음을 **문장으로** 넣는다: **"primitive 값을 바꾸지 않는다. 미달 semantic 토큰의 참조를 스케일의 다른 단계로 옮기거나, 단계를 신설해 참조한다. 다른 값 불변."** (D-7 실측: primitive 를 어둡게 만들어 neutral.200 이 300 보다 어두워지고 `border.strong` 이 `default` 보다 연해짐 — 대비 검사는 통과하므로 기계로 안 잡힌다.) 보정 후 재검사에 아래 두 항목을 추가한다:
- **스케일 단조성**: 각 primitive 스케일(neutral·primary·secondary)이 50→900 으로 갈수록 휘도가 단조 감소한다.
- **강·약 관계**: `border.strong` 대비 > `border.default` 대비, `text.primary` 대비 > `text.secondary` 대비 > `text.disabled` 대비. **미달 세트는 사용자에게 보여 주지 않는다** — 사용자가 고른 뒤 바꾸면 승인이 무효가 된다.

## 1-C. 세트 선택 (메인 세션)

1. `open design/stimuli/design_guide_compare.html`.
2. 지시문: "세 가지 중 어느 쪽이 이 앱에 맞아 보이나요? 왜 그런지 한 줄. 둘 다 아니면 그렇게 말해 주세요."
3. **사용자 선택을 먼저 `interview_raw.md` 에 `T-01` 로 기록한 뒤**, 하네스 추천(`design-maker` 가 `token_sets.json` 에 `ai_pick` 과 이유를 넣어 둔다)을 공개한다. 공개 후 바꾸면 `changed_after_reveal: true` 로 상태 파일에 남긴다. 추천을 먼저 보이면 앵커링이다.
4. "둘 다 아님" 이면 이유를 받아 `design-maker` 에 1회 재생성(상한 1). 그래도 아니면 가장 가까운 세트를 `provisional` 로 채택하고 가정 로그에 기록.

## 1-D. 확정 (`design-maker`)

브리프: **입력 화이트리스트 = `design/stimuli/token_sets.json`, `design/brief.md`, `templates/design.md`** + 선택된 세트 ID. 출력 `design/tokens.json`, `design/design.md`. 상한 문장: "design.md ≤{agent_design_md_lines_max}줄".

- `tokens.json` = 선택 세트 그대로 + `meta.chosen_set`, `meta.platform`, `meta.wcag_checked_at`, `color.wcag` 측정값 기입. `rationale` 유지. 참조 문법 `{color.primitive.…}` 은 유지(소비 측이 해석).
- `design.md`:
  - §2 토큰 원칙: semantic 만 직접 사용, primitive 는 참조 전용, scale 타이포만 사용 — 이 셋은 고정. **화면 규격 한 줄**(모바일 390×844 + 상태바 44 + 탭바 83, 또는 데스크톱 1440×900)을 여기 적는다 — 2단계 HTML 과 3단계 Figma 프레임이 이 값을 읽는다. 나머지는 brief 에서.
  - §2b **결정 근거 요약**(prd-to-design-guide 4단계 채택): "왜 이 primary 인가"(도메인·반응 정본), "왜 이 폰트인가"(사용자층·가독성·한글), "왜 이 스페이싱 체계인가"(정보 밀도·플랫폼), "왜 이 래디어스·그림자인가". 각 항목은 tokens.json 의 `rationale` 을 사용자가 읽을 수 있는 말로 옮긴 것이며, 1-C 에서 선택 뒤 사용자에게 이 요약을 3~5줄로 보여 준다.
  - §3 제약: 하네스 고정 하한선 2개 + brief §5 하드 제약 전부.
  - §4A/§4C: brief §4 의 기준 중 `confidence: confirmed` 와 `provisional` 을 `verdict_method` 로 갈라 표에 옮긴다. RULE-ID 유지. `proposed` 는 §4 에 넣지 않고 §9 가정 아래 "미적용 기준" 으로만 나열. **A 규칙에는 기준값을 tokens.json 토큰 이름으로 적는다**(예: 간격은 `spacing.scale` 값만 허용).
  - §5 화면별 1등 정보: brief §2 복사.
  - §6 금지 목록: brief 에서 '싫다' 로 확정된 것만. 하네스가 추가하지 않는다.
  - §7 핵심 과업: brief §2b 복사. §8 적합성 기준: brief §11 + §10 반박 결정 요약. 이 둘이 없으면 뒤 단계가 UX·적합성을 판정할 근거가 없다.

## 종료조건 (`design-worker`)

- [ ] `design/tokens.json` 유효 JSON, 빈 문자열 값 0개(`_note`·`$schema_note` 제외), 6카테고리 `rationale` 전부 비어 있지 않음, `typography.family.fallback` 존재
- [ ] `design/verify/wcag_tokens.md` 에 선택 세트 전 쌍 PASS, 스케일 단조성 PASS, 강·약 관계 PASS
- [ ] `design/design.md` §1~§9 전부 존재, **전체 ≤`agent_design_md_lines_max`줄**, §2b 결정 근거 4항목, §4A+§4C 행 수 = brief §4 의 confirmed+provisional 기준 수, §7 과업 3개, §8 적합성 ≥2줄
- [ ] `design.md` 안에 hex 색상값 직접 표기 0건(토큰 이름만) — `grep -c '#[0-9A-Fa-f]\{6\}'` == 0
- [ ] 상태 파일 `human_gates.token_set_choice.chosen` 기입

## 하지 않는 것

- 화면 초안 생성(→ `design-draft-html`), Figma Variables 생성(→ `design-figma-build`)
- 사용자에게 색상값·픽셀값을 묻는 것
