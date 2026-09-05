---
name: design-draft-html
description: 2단계 HTML 초안(B단계 발산·수렴). design.md 와 tokens.json 만 근거로, 아직 열린 독립 축마다 HTML 후보를 병렬 생성해 3개 페르소나(UX 직관·적합성·구현 호환)로 교차 비평하고 사용자 선택을 받아 decisions.md 를 쓴 뒤, 전체 화면 세트를 HTML 로 만들어 승인받는다. Figma MCP 직접 구현은 비싸고 느리므로 여기서 싸게 발산하고 승인된 것만 다음 단계로 넘긴다. design-harness 가 호출하거나 "화면 초안 / HTML 초안 / 후보 만들어" 로 단독 호출.
argument-hint: "[--axes 3] [--variants 2]  (fast 모드: 축 ≤1, 2-G 는 grep 만)"
---

# design-draft-html — HTML 초안 발산·수렴·승인

> **입력**: `design/design.md`, `design/tokens.json`, `design/brief.md`(§2 IA 만). **출력**: `design/decisions.md`, `design/drafts/*.html`, `design/drafts/tokens.css`.
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

`design/tokens.json` 의 값 leaf 를 `--<경로-하이픈>` CSS 변수로 평탄화해 `design/drafts/tokens.css` 에 쓴다(예: `color.semantic.text.primary` → `--color-semantic-text-primary`, `typography.scale.body.size` → `--typography-scale-body-size`). `{…}` 참조는 `var(--…)` 로 변환. **설명용 키는 건너뛴다**: `rationale`, `_note`, `$schema_note`, `usage`, `concentric_rule`, `meta.*`, `color.wcag.*`. 숫자 leaf 는 px 단위 없이 그대로 두고 소비 측에서 `calc(var(--x) * 1px)` 로 쓴다(단 `lineHeight`·`weight`·`opacity` 는 무단위). 스크립트와 출력 첨부. 모든 초안 HTML 은 이 파일 하나를 `<link>` 하고, **HTML 안에 색·간격·라운딩 리터럴을 쓰지 않는다.**

## 2-B. 열린 축 식별 (`design-judge`)

브리프: `design/brief.md`, `design/design.md`, `templates/decisions.md`, 출력 `design/decisions.md` §1 만.
- brief §3 에서 정본이 확정된 축은 **다시 열지 않는다.**
- 남은 것 중 "화면 구조를 갈라 놓는" 축만 고른다. 예: 내비게이션 구조(탭 vs 단일 흐름), 목록 표현 방식, 두 주체(신랑/신부 등)의 구분 표현. **예시일 뿐, 프로젝트마다 다시 뽑는다.**
- 최대 3축. 각 축은 후보 2개(필요시 3). 축을 나누지 않고 화면 전체를 통째로 비교하지 않는다 — 무엇 때문에 골랐는지 뒤섞인다.
- 축이 0개면(전부 확정) 2-C~2-E 를 건너뛰고 decisions §1 에 "열린 축 없음" 기록.

## 2-C. 후보 병렬 생성 (`design-maker` × N)

축마다, 후보마다 **별도 `design-maker` 호출**을 한 메시지에 병렬로 낸다. 브리프에는 **입력 화이트리스트 = `design/design.md`, `design/tokens.json`, `design/drafts/tokens.css`** (그 외 금지), brief §2 의 **대표 화면 1개**(행 내용을 문장으로), 그리고 **이 후보가 취할 축 값 한 줄**만 넘긴다. 다른 후보가 무엇인지 알려 주지 않는다. 상한 문장: "HTML 1파일 ≤{agent_draft_html_lines_max}줄(상태 3종 포함), 인라인 SVG 아이콘 ≤8개".

- 출력: `design/drafts/axis<n>_<a|b>.html`. 모바일 뷰포트(360×780) 기본, PRD 가 데스크톱이면 1280.
- 상태 3종 필수: 같은 파일 안에 `normal / empty / long`(최장 텍스트) 섹션. 빈 상태를 안 만들면 첫 사용 화면이 무너진다.
- design.md §3 제약·§4 규칙 준수, §6 금지 목록 회피. 위반해야만 축 값을 표현할 수 있으면 `ASSUMPTION:` 주석 대신 `BLOCKED:` 반환.
- 더미 텍스트·아이콘은 자체 조달(인라인 SVG, 실제 도메인 문장). "Lorem ipsum" 금지.

## 2-D. 교차 비평 (`design-judge`)

브리프: **입력 화이트리스트 = 후보 파일 전부, `design/design.md`** (그 외 금지). 출력 `design/decisions.md` §2 의 비평 열 + `ai_pick`. 상한 문장: "후보당 페르소나별 3줄 이내, 리포트 전체 ≤{agent_report_lines_max}줄". 페르소나 3개 고정(프로젝트가 덮어쓸 수 있음). 각각 채점 축 하나를 맡는다:
1. **첫 사용자 관점 (UX 직관)** — design.md §7 핵심 과업 3개를 **실제로 따라가 본다**: 이 후보에서 과업의 첫 클릭이 어디인지 3초 안에 보이는가, 기대 경로대로 다음 화면이 예측되는가. 과업마다 `찾음/헤맴/불가` + 근거 위치.
2. **도메인 실무자 관점 (적합성)** — design.md §8 기준으로, 이 화면이 그 도메인의 실제 서비스처럼 보이는가 아니면 범용 관리자 템플릿처럼 보이는가. 범용처럼 보이게 만드는 요소를 지목.
3. **구현 호환성 관점** — Figma 컴포넌트·variant 로 옮길 때 무리가 없는가, 상태 3종이 같은 구조로 표현되는가.

각 후보에 페르소나별 2~3줄, 근거는 파일명 + 위치(상/중/하). 추천 픽 1개 + 이유 1줄을 `ai_pick` 에 쓰되 **decisions.md 에는 아직 공개 표시하지 않는다**(2-E 에서 사용자 선택 뒤에 공개).

## 2-E. 축별 선택 (메인 세션)

1. `design-worker` 가 후보들을 한 페이지에 나란히 놓은 `design/drafts/compare_axis<n>.html` 을 만든다(iframe 또는 좌우 배치). `open`.
2. 축마다 한 질문: "왼쪽/오른쪽 중 어느 쪽이 더 쓰기 편해 보이나요? 왜?" → `interview_raw.md` 에 `D-<축>` 즉시 기록.
3. 기록 뒤에 AI 추천과 이유를 공개. 바꾸면 `changed_after_reveal: true`.
4. 결과를 decisions.md §2 에 반영.

## 2-F. 전체 화면 세트 (`design-maker`)

brief §2 화면 표의 **모든 화면**을 만든다. 화면별로 병렬 호출 가능. 브리프: `design.md`, `tokens.json`, `tokens.css`, `decisions.md`(선택된 축 값), 해당 화면 행, 그 화면의 1등 정보.
- 출력 `design/drafts/screen_<nn>_<slug>.html`, 상태 3종 포함(목록형 화면은 `loading` 추가). **1파일 ≤`agent_draft_html_lines_max`줄.**
- 화면 간 공통 요소(상단 바, 하단 탭, 상태 칩, 목록 행)는 **같은 마크업 구조·같은 클래스명**을 쓴다. 다음 단계에서 이것이 Figma 컴포넌트가 된다. 공통 요소 목록을 `design/drafts/components.md` 에 적는다(이름 / 어느 화면에서 / variant 가 될 상태들).
- `design/drafts/index.html` 에 전 화면 링크 + 화면 흐름 순서.

## 2-G. 초안 자체 점검 (`design-judge`)

Figma 로 가기 전 싼 사전 점검. 브리프: **입력 화이트리스트 = `drafts/*.html`, `design.md`**. 출력 `design/verify/draft_review.md` (**≤`agent_report_lines_max`줄**).
- §4A 규칙 중 HTML 소스로 판정 가능한 것(토큰 리터럴 0, 간격 값이 scale 안, 공통 요소 구조 일치)을 grep 으로 판정.
- 스크린샷이 가능하면(`aside-browser` 스킬 사용 가능 시) 화면별 1장을 찍어 §4C 규칙과 §5 1등 정보를 **이미지를 열어** 점검. 불가하면 "C 점검 미실시 — Figma 단계에서" 라고 명시. 추측 판정 금지. **fast 모드에서는 grep 항목만 실행하고 스크린샷 점검은 생략**(가정 로그 기록).
- §7 핵심 과업 3개를 전체 화면 세트에서 경로 추적: `index.html` 의 흐름 순서대로 과업별 `찾음/헤맴/불가`. `불가` 가 있으면 FAIL.
- 결과가 FAIL 인 항목은 `design-maker` 에 되돌려 고치고 재점검. 상한 2회. **판정자는 고치지 않는다.**

## 2-H. 승인 (메인 세션)

1. `open design/drafts/index.html`.
2. 호출 품질 게이트 4항을 한 화면에: 무엇을 결정하는지(이 초안으로 Figma 구현 진행 여부) / 선택지(승인·수정 요청·방향 재검토) / 하네스 의견(자체 점검 요약 3줄) / 결정 안 하면 뭐가 막히는지.
3. "이대로 Figma 에 만들어도 될까요? 고치고 싶은 곳이 있으면 화면 번호와 함께 알려 주세요."
4. 수정 요청 → raw 기록 → 해당 화면만 `design-maker` 재생성 → 2-G 재점검 → 다시 승인. `human_draft_revision_max`(기본 2, fast 1) 초과 시 "방향 자체 재검토" 로 분류해 2-B 로 회귀하거나 사용자가 그대로 진행 결정.
5. 승인 원문을 decisions.md §3 과 상태 파일 `draft_approval` 에 기록.

## 종료조건 (`design-worker`)

- [ ] `design/decisions.md` §1~§3 채움, §2 각 축에 사용자 선택·이유 원문 존재
- [ ] `design/drafts/screen_*.html` 개수 == brief §2 화면 수, 각 파일에 `data-state="normal|empty|long"` 섹션 존재, **각 파일 ≤`agent_draft_html_lines_max`줄**
- [ ] 모든 `drafts/*.html` 에서 hex·px 리터럴 0건(`tokens.css` 제외) — grep 원문 첨부
- [ ] `design/drafts/components.md` 존재, 공통 요소 ≥3
- [ ] `design/verify/draft_review.md` 의 A 항목 전건 PASS, 핵심 과업 3개 전부 `불가` 아님
- [ ] 상태 파일 `draft_approval.approved == true`, 승인 원문 존재

## 하지 않는 것

- Figma 조작. 여기서는 브라우저로 보는 HTML 만 만든다.
- 사용자에게 값을 묻는 것. 사용자는 나란히 놓인 것 중 고르기만 한다.
