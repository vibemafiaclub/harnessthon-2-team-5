<!--
프로젝트 디자인 가이드 산출물 템플릿 (design-md 스키마 v1).

이 스키마는 `guide/reference/toss.design.md`(참조 디자인 시스템)의 구조를 준거로 한다.
7개 섹션과 섹션 마커는 고정이다. 섹션을 추가·삭제·재배열하지 않는다.

작성 규칙 4가지 — 이 규칙이 이 스키마의 존재 이유다:

1. 증거 등급을 붙인다. 모든 수치·색상·폰트에는 그 값이 어디서 왔는지를 적는다.
   허용 등급: `prd` | `repo` | `client-quote` | `measured` | `assumption` | `extension`
2. 모르면 비운다. 확인되지 않은 값은 그럴듯한 기본값으로 채우지 않고,
   해결되지 않은 가장 작은 단위만 생략한다. (Unknowns 정책)
3. 표면을 섞지 않는다. 모바일 제품 UI와 마케팅 웹은 별도 이름으로 유지한다.
   서로 다른 두 값을 평균내지 않는다. (예: 16px과 7px → 11px 금지)
4. 없는 컴포넌트를 지어내지 않는다. 근거에 없는 카드·그림자·탭·토스트·다이얼로그를
   업계 관행으로 채우지 않는다. 꼭 필요하면 `extension`으로 명시한다.
5. 구조는 베끼고 색은 도출한다. 참조 시스템에서 가져올 것은 역할 구성·스케일의 모양·
   상태 계약·지오메트리다. 색 hex는 가져오지 않는다 — PRD와 클라이언트 반응에서 도출하고,
   참조 팔레트는 금지 목록(`tokens._reference_palette`)에 넣는다.

우선순위 충돌 시: 사용자 직접 지시 > 저장소 사실 > 이 계약 > 참조 영감.
-->

---
kind: project-design-guide
project: TODO
schema: design-md v1
reference: guide/reference/toss.design.md
status: draft
---

# TODO — Design Guide

<!-- design-md:section experience -->
## 1. Experience

### Visual Theme & Atmosphere
TODO — 이 제품이 사용자에게 어떤 느낌이어야 하는지 2~3문장. 형용사 나열이 아니라
"어떤 인지 비용을 줄이려 하는가"로 쓴다.

**Key Characteristics:** (3~5개, 각각 구체적 값 포함)
- TODO

### Do's and Don'ts
### Do
- TODO
### Don't
- TODO — 이 프로젝트에서 특히 하면 안 되는 것. 일반론 금지.

### Principles
1. TODO

### Personas
- **TODO:** 무엇을 필요로 하는지. 인구통계 창작 금지, 제품 맥락으로 쓴다.

<!-- design-md:section foundations -->
## 2. Foundations

<!-- design-md:claim foundations kind=rules-or-constraints -->
### Color Palette & Roles

> 이 표의 hex는 **PRD·클라이언트 반응에서 도출**한다. 참조 시스템의 색을 옮겨 적으면
> `core.rules.json / no-reference-color-copy`가 blocker로 막는다. 참조에서 가져오는 것은
> 역할이 몇 개이고 어떤 상태 계약을 갖는가이지 값이 아니다.
> 각 색에는 **어떤 PRD 문장에서 나왔는지**를 함께 적는다.
| Role | Value | 용도 | Evidence |
|---|---|---|---|
| Primary | TODO | TODO | TODO |
| Canvas | TODO | TODO | TODO |
| Foreground | TODO | TODO | TODO |
| Body | TODO | TODO | TODO |
| Muted | TODO | TODO | TODO |
| Surface | TODO | TODO | TODO |
| Border | TODO | TODO | TODO |
| On Primary | TODO | TODO | TODO |
| Danger | TODO | TODO | TODO |

각 전경/배경 조합의 WCAG AA 대비율 통과 여부를 표기한다 (본문 4.5:1, 큰 텍스트·비텍스트 3:1).
<!-- design-md:claim-end -->

### Depth & Elevation
TODO — 근거가 없으면 "이 리비전에서 승격된 그림자 토큰 없음. 평면 색 레이어링 사용"이라고 쓴다.

### Motion & Easing
TODO — 근거가 없으면 승격하지 않는다. 로컬 확장이면 `extension`으로 표시.

<!-- design-md:section typography-assets -->
## 3. Typography & Assets

### Font Family
- **Canonical UI family**: TODO (한글 지원 여부 명시)
- **Fallback**: TODO
- **Declared-only**: 선언만 되고 실제로 쓰이지 않는 폰트는 토큰이 아니라 맥락으로 분류한다.

### Type Scale
| Role | Size | Weight | Line Height | Evidence |
|---|---:|---:|---:|---|
| H1 | TODO | TODO | TODO | TODO |
| H2 | TODO | TODO | TODO | TODO |
| H3 | TODO | TODO | TODO | TODO |
| Body | TODO | TODO | TODO | TODO |
| Body Small | TODO | TODO | TODO | TODO |
| Caption | TODO | TODO | TODO | TODO |

모바일과 데스크톱 스케일이 다르면 양쪽 모두 표기한다.

### Evidence boundary
TODO — 이 가이드가 답하지 못하는 범위를 명시한다 (예: 라이선스, 네이티브 화면 실측치).

<!-- design-md:section components-states -->
## 4. Components & States

컴포넌트마다 아래 항목을 모두 채운다. 하나라도 못 채우면 그 컴포넌트는 아직 가이드가 아니다.

### TODO — 컴포넌트명 (표면 이름 포함, 예: "Mobile Primary Button")
- Background / Text / Radius / Height / Padding / Font: TODO
- Size scale: TODO
- States: TODO
- Use: TODO
- Evidence: TODO

### State contract
| Component | 필수 상태 |
|---|---|
| TODO | default, hover, pressed, disabled, loading, focus |

빈 상태·에러 상태·로딩 상태가 정의되지 않은 컴포넌트는 미완성으로 취급한다.

<!-- design-md:section layout-platforms -->
## 5. Layout & Platforms

### Spacing System
- 기본 단위: TODO (4px 또는 8px)
- 스케일: TODO
- 용도 매핑: TODO — 각 값이 어디에 쓰이는지

### Grid & Container
TODO

### Border Radius Scale
TODO — 동심원 규칙(outer = inner + padding) 적용 여부 명시

### Responsive Behavior
TODO — 표면별로 분리해서 쓴다. 모바일 컴포넌트 지오메트리를 웹에 그대로 상속시키지 않는다.

<!-- design-md:section content-locales -->
## 6. Content & Locales

### Voice & Tone
TODO — "짧고 명확하게" 같은 문장은 금지. 이 제품에서 나쁜 카피와 좋은 카피를 각 2개씩 대조로 쓴다.

| 나쁜 예 | 좋은 예 | 이유 |
|---|---|---|
| TODO | TODO | TODO |

### Locale
TODO — 한글 줄바꿈, 숫자·통화·날짜 포맷, 최대 문자열 길이

<!-- design-md:section governance -->
## 7. Governance

### Agent Prompt Guide
에이전트가 그대로 복사해 쓸 수 있는 명령 문장 3~5개. 값이 전부 들어가야 한다.
- TODO

### Application priority
1. 요청 범위에 대한 사용자 직접 지시
2. 저장소 사실
3. 이 시스템 계약
4. 참조 영감

### Unknowns
해결되지 않은 가장 작은 값 또는 그룹만 생략한다. 그럴듯한 기본값으로 대체하지 않는다.
현재 미해결 항목: TODO

### Changes
변경은 기록·검토·검증 후에 채택한다.
