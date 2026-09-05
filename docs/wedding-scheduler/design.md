---
kind: project-design-guide
project: 청첩장모임 스케줄러
schema: design-md v1
reference: guide/reference/toss.design.md
source_prd: docs/wedding-schedular-PRD.md
surface: mobile-product
status: draft
---

# 청첩장모임 스케줄러 — Design Guide

> 증거 등급: `reference` (toss.design.md 검증치) · `prd` (PRD 명시) · `assumption` (가정, 검증 가능하게 기록)
> · `extension` (근거에 없어 새로 만든 것 — 반드시 이 등급으로 표시)
>
> **표면은 `mobile-product` 하나다.** `toss.im` 마케팅 지오메트리(7px radius, 40/46px 높이)는
> 이 프로젝트에 상속하지 않는다. 두 표면의 값을 평균내지 않는다.

<!-- design-md:section experience -->
## 1. Experience

### Visual Theme & Atmosphere

이 앱이 줄여야 할 인지 비용은 **"지금 내가 무엇을 결정해야 하는가"** 다. 사용자는 결혼 3개월 전부터
40~100명을 모임 단위로 묶고, 회신을 기다리고, 겹치는 주말을 피해야 한다(`prd` §1·§3). 화면은 축제가 아니라
**답할 수 있는 질문 하나**를 내밀어야 한다.

레퍼런스의 자세를 그대로 가져온다 — 파랑은 장식이 아니라 **행동**이고, 나머지는 조용하다(`reference`).
청첩장의 정서는 색이나 서체가 아니라 **문장**이 담당한다(§6).

**Key Characteristics:**
- Primary `#1F6F63` — PRD에서 도출한 값. 화면당 주 행동 1개에만 (`prd`)
- Pretendard Variable 고정, 별도 디스플레이 서체 없음 (`client-quote` — 레퍼런스 서체를 덮음)
- 그림자 토큰 없음 — 평면 색 레이어링으로만 층을 만든다 (`reference`)
- 상태를 색으로 늘리지 않는다 — semantic 색은 `danger` 하나뿐 (§2 참조)
- Spacing 4·6·8·16·24·32 — 12와 20은 없다 (`reference`)

### Do's and Don'ts

### Do
- 주 행동을 화면당 1개로 두고 `#1F6F63`을 거기에만 쓴다.
- 상태(확정·대기·겹침·완료)를 **뱃지 형태와 문장**으로 구분한다. 새 색을 만들지 않는다.
- 버튼은 documented 4단계(32/38/48/56px)에서만 고른다.
- 로딩 중에도 버튼 너비를 유지한다 (`reference`).
- 근거에 없는 컴포넌트는 §4에 `extension`으로 이름을 붙여 등록한 뒤에만 쓴다.

### Don't
- 참조 시스템의 색을 옮겨 적지 않는다. 구조는 빌리되 색은 도출한다.
- 마케팅 CTA 지오메트리(7px / 40px / 46px)를 제품 화면에 쓰지 않는다.
- 16px와 7px를 11px로 절충하지 않는다.
- success/warning/info 색을 발명하지 않는다 — 값이 문서화되어 있지 않다(§7 Unknowns).
- 카드·그림자·탭·토스트·다이얼로그를 업계 관행으로 채우지 않는다.
- 청첩장 정서를 세리프·파스텔·금박으로 표현하지 않는다. 서체 하나로 간다.

### Principles

1. **답할 수 있게 만든다.** 화면은 "무엇을 정해야 하는가"를 한 문장으로 제시한다 (`reference` Easy to answer).
2. **가치를 먼저, 비용을 나중에.** 회신을 요청하기 전에 왜 필요한지 보인다 (`reference`).
3. **파랑은 기능이다.** 상태·장식에 파랑을 쓰지 않는다 (`reference`).
4. **상태를 명시한다.** 중단된 흐름에서 지금 상태·결과·다음 안전한 행동 셋을 모두 쓴다 (`reference`).
5. **모르면 비운다.** 확인 안 된 값은 가장 작은 단위만 생략하고 Unknowns에 남긴다 (`reference`).

### Personas

`prd` §2의 유저스토리를 그대로 쓴다. 인구통계 페르소나를 발명하지 않는다.

- **모임을 편성하는 예비신부** — 접점 없는 사람들을 묶어야 하고, 한 사람이 여러 무리에 걸쳐 있다 (§2-1).
- **여러 커플에게 동시에 요청받은 지인** — 자기 가능 시간을 한 번에 파악하고 응답하고 싶다 (§2-2).
- **각자 지인 풀을 관리하는 예비신랑** — 최종적으로 둘의 일정이 한 화면에서 겹치지 않는지 봐야 한다 (§2-3).

<!-- design-md:section foundations -->
## 2. Foundations

### Color Palette & Roles

**참조 시스템의 색은 하나도 가져오지 않았다.** 참조에서 빌린 것은 역할 구성과 상태 계약이고,
hex는 전부 PRD에서 도출했다(`core.rules.json / no-reference-color-copy`).
참조 팔레트 11개 값은 `tokens._reference_palette`에 **금지 목록**으로 등록되어 있다.

| 역할 | 값 | 어느 PRD 문장에서 나왔나 | 등급 |
|---|---|---|---|
| Primary | `#1F6F63` | §5 "두 사람이 함께 쓰는 것을 전제로" → 어느 한쪽 성별 코드로 기울지 않는 색. §3 "3개월 전부터 매주 주말마다" → 3개월 내내 보는 색이라 채도를 낮춘다 | `prd` |
| Primary Strong | `#17564D` | pressed. 명도만 낮춘다 | `prd` |
| On Primary | `#FCFBF9` | Canvas와 같은 값. 순백 `#ffffff`는 참조 팔레트와 겹쳐 금지된다 | `prd` |
| Canvas | `#FCFBF9` | §1 "청첩장을 직접 건네려면" → 종이의 온기. 순백이 아닌 옅은 크림 | `prd` |
| Surface | `#F3F1EC` | §4-6 "이미 다녀온 모임"을 담는 조용한 층 | `prd` |
| Border | `#E2DED7` | 장식 구분선. 비인터랙티브 | `assumption` |
| Border Strong | `#94897B` | 입력 필드·체크박스의 **인터랙티브 외곽선**. `core / contrast-nontext-aa` 3.0을 만족해야 해서 Border와 분리했다 — 참조는 border가 하나뿐이지만 그 값으로는 3.0을 못 넘는다 | `extension` |
| Foreground | `#1C1A17` | 가장 강한 텍스트 | `prd` |
| Body | `#4A453E` | 본문 | `prd` |
| Muted | `#736C61` | §3 "며칠씩 답이 없는 사람이 꼭 있어" → 무응답은 정상 상태라 조용하되 AA는 지킨다 | `prd` |
| Danger | `#B3261E` | §4-5 "특정 날짜에 모임이 겹치는지" → 이 앱의 유일한 경고 | `prd` |

**검증**: 필수 조합 17개 전부 WCAG 통과(본문 4.5 / 비텍스트 3.0), 미달 0건.
Primary와 Danger는 색상환에서 **168° 분리**되어 같은 행에 놓여도 섞이지 않는다.

**상태 색을 늘리지 않는다.** `prd` §4-6은 4개 상태를 요구하지만 이 팔레트의 semantic 색은 `danger` 하나다.
상태는 **뱃지 variant(fill/weak) + 중성 명도 + 문장**으로 구분한다. 배정은 §4 Status Badge에 있다.

### Depth & Elevation

**그림자 토큰 없음** (`reference`). 층은 `Canvas` / `Surface` / `Border` 세 값의 평면 레이어링으로만 만든다.
떠 있는 요소가 필요해지면 그때 `extension`으로 등록한다.

### Motion & Easing

**모션 토큰 없음** (`reference`). 상태 전환은 즉시 반영하고, `prefers-reduced-motion`을 존중한다.
지속시간·이징이 필요해지면 `extension`으로 표시한다.

<!-- design-md:section typography-assets -->
## 3. Typography & Assets

### Font Family

- **UI 서체: `Pretendard Variable`** (`client-quote` — 사용자 직접 지시, Application priority 1).
  레퍼런스의 `Toss Product Sans`를 **의도적으로 덮는다.** 근거 두 가지:
  ① 레퍼런스 스스로 재배포 권한을 확인하지 못했다고 명시한다(§3 Evidence boundary) — 즉 그대로 두면
  이 가이드의 타이포는 어떤 환경에서도 실제로 렌더되지 않고 항상 폴백만 보인다.
  ② Pretendard는 SIL OFL로 재배포가 가능하고, 한글 UI 폭이 균일해 대량 명단(`prd` §4-1)에서 정렬이 흔들리지 않는다.
- 폴백: `Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif` (`assumption`)
- **웹 미리보기 제약**: Pretendard는 Google Fonts에 없고 Artifact CSP는 `fonts.googleapis.com` 외 스타일시트를
  차단한다. 따라서 미리보기는 **로컬에 설치된 사용자에게만** Pretendard로 보이고, 나머지는 폴백으로 렌더된다.
  Figma·제품 구현에는 고정 적용한다. (§7 Unknowns)
- **디스플레이 서체 없음.** 위계는 크기·굵기로만 만든다.
- **Tossface 사용 금지** — 선언만 되고 가시 사용이 관측되지 않았다 (`reference`).
- **모노스페이스 없음** — canonical 주장이 없다 (`reference`).

### Type Scale

| Role | Size | Weight | Line Height | 등급 |
|---|---:|---:|---:|---|
| H1 | 36px | 700 | 54px | `reference` (문서 표면) |
| H2 | 30px | 600 | 45px | `reference` (문서 표면) |
| H3 | 24px | 600 | 36px | `reference` (문서 표면) |
| H4 | 22px | 600 | 33px | `reference` (문서 표면) |
| Body | 16px | 400 | 24px | `reference` (지배적 가시 역할) |
| Body Small | 14px | 400 | 21px | `reference` (보조 가시 역할) |
| Button | 17px | 600 | — | `reference` (TDS xlarge 버튼) |

**표면 경고**: H1~H4는 TDS *문서 사이트*의 계산된 스타일이며 네이티브 모바일 화면 실측치가 아니다
(`reference`가 명시). 393px 폭에서 H1 36px은 화면 제목으로 과하므로, **이 프로젝트는 화면 제목에 H4(22/33)를
기본으로 쓰고 H1~H3은 쓰지 않는다** (`assumption` — 네이티브 실측치가 확인되면 교체).

### Evidence boundary

- ~~Toss Product Sans의 재배포 조건~~ → Pretendard로 교체해 해소됨
- 네이티브 제품 화면의 타입 실측치 (문서 표면 값만 확인됨)
- TDS Badge의 `danger` 외 semantic 색 값
- 그림자·모션 토큰

<!-- design-md:section components-states -->
## 4. Components & States

### Mobile Primary Button
- Background `#3182f6` / Text `#ffffff` / Font 17px·600 / Padding `0 20px`
- Size scale: small 32px·radius 8 / medium 38px·10 / large 48px·14 / **xlarge 56px·16 (기본)**
- Variants: fill · weak / primary · danger · light · dark
- States: default, pressed(`#2272eb`), disabled, loading(**너비 유지**), keyboard focus
- Use: 화면당 주 행동 1개. 보조 행동은 weak 또는 중성 텍스트 액션.
- Evidence: `reference`

### Mobile Text Field
- Variants: box · line · big · hero
- States: focus, error, disabled, read-only
- Use: 라벨 + 도움말 + 에러 문구를 함께 둔다. 문서 사이트 크롬 색을 필드 토큰으로 옮기지 않는다.
- Evidence: `reference`

### Mobile Badge
- Variants: fill · weak / xsmall · small · medium · large
- States: semantic·size variant. **설명용이며 조작 대상이 아니다.**
- Use: 상태·분류 라벨
- Evidence: `reference`

### Mobile Agreement
- States: checked, unchecked, disabled, 중첩 계층
- Use: 약관 선택. 이 프로젝트에서는 **모임 편성의 다중 선택**에 같은 체크 컨트롤을 쓴다.
- Evidence: `reference` (컨트롤) + `extension` (다중 선택 용도로의 전용)

---

아래는 `prd` 요구를 충족하려면 필요하지만 레퍼런스에 없는 컴포넌트다. **전부 `extension`이다.**

### Status Badge — 상태 배정 `extension`
Badge를 상태 표시에 쓰되 색을 늘리지 않는다.

| 상태 | 표현 | 근거 |
|---|---|---|
| 확정 | Badge weak · `Surface` 배경 + `Foreground` 텍스트 | `prd` §4-4 |
| 회신 대기 | 뱃지 없음 · `Muted` 문장 + 회신 수 | `prd` §4-3 |
| 마감 임박 | Badge fill · `Foreground` 배경 + `Canvas` 텍스트 + D-day 숫자 | `prd` §4-3 |
| 겹침 · 마감 초과 | Badge weak · `Danger` 텍스트 + 아이콘 + 사유 문장 | `prd` §4-5 |
| 다녀옴 | 행 전체 `Muted` | `prd` §4-6 |

### List Row `extension`
- 컨테이너 없음. `Border` 1px 구분선과 정렬로 구조를 만든다. 최소 높이 56px(터치)
- Variants: person · event · date-option
- States: default, pressed, selected, disabled, empty
- Use: 명단·일정·날짜 후보. **카드로 만들지 않는다** — 레퍼런스에 카드 토큰이 없다.

### Day Gutter `extension`
- 왼쪽 48px 날짜 열 + 오른쪽 이벤트 열. `prd` §4-5의 "특정 날짜에 겹치는지"를 축으로 만든 구조
- States: weekend(`Foreground`) / weekday(`Muted`)

### Owner Mark `extension`
- 신랑/신부를 **색이 아니라 테두리 스타일(실선/파선) + 라벨**로 구분. `prd` §2-3·§5
- 색을 쓰면 상태 색과 충돌하고, 검증된 색이 부족해 애초에 불가능하다.

### State contract

| Component | 필수 상태 |
|---|---|
| Button | default, pressed, disabled, loading, focus |
| Text Field | default, focus, error, disabled, read-only |
| Badge | fill, weak × 크기 4단계 |
| Agreement / Checkbox | checked, unchecked, disabled, nested |
| List Row `ext` | default, pressed, selected, disabled, empty |

빈 상태·에러 상태·로딩 상태가 정의되지 않은 컴포넌트는 미완성으로 취급한다.

<!-- design-md:section layout-platforms -->
## 5. Layout & Platforms

### Spacing System

간격에는 **두 개의 독립된 축**이 있다. 하나로 합치면 레퍼런스의 Button 스펙(내부 패딩 20)과
Spacing 스케일(20 없음)이 서로를 위반해, 어떤 코드도 두 blocker를 동시에 만족할 수 없다.

- **레이아웃 축** — 요소·행·섹션 사이. 스케일: **4 · 6 · 8 · 16 · 24 · 32** (`reference`). **12와 20은 없다.**
- **컨트롤 축** — 컴포넌트 내부 치수. 버튼 패딩 20, 버튼 높이 32·38·48·56, 아이콘 16·20·24 (`reference`).
  `spacing-scale` 규칙은 이 축을 검사하지 않는다(`applies_to.exclude_name_matches`).
- 용도: 4 아이콘–텍스트 / 6 뱃지 내부 / 8 인접 요소 / 16 화면 좌우·행 내부 / 24 섹션 내부 / 32 섹션 사이
- 32를 넘는 값이 필요하면 `extension`으로 등록한다.
- **합성 여백 금지**: 부모의 `gap`과 자식의 `padding`을 동시에 쓰지 않는다. 둘이 더해지면
  스케일 밖 값(24+16=40, 24+24=48)이 생기고 같은 컴포넌트가 위치에 따라 다른 간격을 만든다.
  간격의 소유자는 **컨테이너 gap 한쪽으로 고정**한다.

### Grid & Container
- 뷰포트 **393 × 825** (`prd` 외 사용자 지시)
- 화면 좌우 여백 16, 하단 액션바는 스크롤과 분리
- 터치 대상 최소 높이는 버튼 size scale로 확보한다(small 32는 단독 터치 대상에 쓰지 않는다)

### Border Radius Scale
- 작은 표면: **4 · 6** (`reference`)
- 버튼: **8 · 10 · 14 · 16** (`reference`)
- **full: 9999** (`extension`) — 아바타·사람 칩·미터바의 알약 형태.
  레퍼런스에 pill 값이 없다. 근사값(16 등)으로 때우면 알약이 아니게 되므로
  **그럴듯한 기본값 대신 명시적으로 등록**한다(§7 Unknowns 정책의 반대 방향 처리 — 값을 지어낸 것이 아니라 필요를 문서화한 것).
- **12와 20은 없다.** 동심원 규칙은 레퍼런스에 근거가 없어 적용하지 않는다.

### Responsive Behavior
- 이 프로젝트는 `mobile-product` 단일 표면이다. 마케팅 웹 지오메트리를 상속하지 않는다.
- 범용 브레이크포인트·데스크톱 최대 폭·세이프에어리어 값은 레퍼런스가 확립하지 않았다(§7 Unknowns).

<!-- design-md:section content-locales -->
## 6. Content & Locales

### Voice & Tone

결과와 다음 행동을 정확히 이름 붙인다. 막연한 위로·업계 용어·모호한 표현을 쓰지 않는다.

| 나쁜 예 | 좋은 예 | 이유 |
|---|---|---|
| 일정이 충돌합니다 | 11월 8일에 상견례(18:00)와 회사 팀 저녁(19:00)이 1시간 간격입니다 | 무엇이 무엇과 어떻게 겹치는지 없으면 다음 행동을 정할 수 없다 |
| 응답 대기 중 | 6명 중 4명이 답했어요. 강태호님은 3일째 답이 없어요 | 숫자와 이름이 있어야 "더 기다릴지"를 결정한다 |
| 확인해 주세요 | 11월 8일로 확정하기 | 버튼이 무슨 일이 일어나는지 말해야 한다 |
| 오류가 발생했습니다 | 이미 등록된 번호예요. 강태호님과 같은 번호입니다 | 무엇이 잘못됐고 무엇을 하면 되는지 둘 다 필요하다 |

### Locale
- 한글. 줄바꿈은 어절 단위, 조사 앞에서 끊지 않는다.
- 날짜 `11월 8일 토`, 시각 `오후 6:00`, 카운트 `6명 중 4명`, 마감 `D-2`
- 숫자가 세로로 정렬되는 자리(날짜·인원·D-day)는 tabular numerals
- 이름 최대 길이 미확정 → 행은 고정 높이를 쓰지 않고 hug로 둔다

<!-- design-md:section governance -->
## 7. Governance

### Agent Prompt Guide

- "xlarge primary 버튼을 만든다: `#1F6F63` 배경, `#FCFBF9` 텍스트, 높이 56px, radius 16px, 17px/600, 로딩 시 너비 유지."
- "상태 뱃지를 만든다: 확정은 `#F3F1EC` 배경 + `#1C1A17` 텍스트, 겹침은 `#B3261E` 텍스트 + 아이콘 + 사유 문장. 새 색을 만들지 않는다."
- "리스트 행은 카드로 만들지 않는다. `#E2DED7` 1px 구분선과 정렬로 구조를 만들고 최소 높이 56px."
- "간격은 4·6·8·16·24·32에서만 고른다. 12와 20은 이 시스템에 없다."
- "레퍼런스에 없는 컴포넌트를 만들면 §4에 `extension`으로 등록한 뒤 쓴다."

### Application priority
1. 요청 범위에 대한 사용자 직접 지시
2. 저장소 사실
3. 이 시스템 계약
4. 참조 영감 (`guide/reference/toss.design.md`)

### Unknowns

그럴듯한 기본값으로 대체하지 않는다. 현재 미해결:

- TDS Badge의 `danger` 외 semantic 색 값 → 상태를 형태·문장으로 구분해 회피
- 네이티브 모바일 화면의 H1~H4 실측치 → 화면 제목에 H4를 쓰고 H1~H3 미사용
- 그림자·모션 토큰 → 평면 레이어링, 전환 효과 없음
- Pretendard 웹 배달 경로 → Artifact CSP가 Google Fonts 외 스타일시트를 차단. 미리보기는 로컬 설치 시에만 적용
- 세이프에어리어·브레이크포인트 → 393×825 단일 뷰포트만

### Changes
변경은 기록·검토·검증 후에 채택한다. 이 문서를 고치면 `project.rules.json` → 토큰 → 컴포넌트 → 화면 순으로 다시 생성한다.
