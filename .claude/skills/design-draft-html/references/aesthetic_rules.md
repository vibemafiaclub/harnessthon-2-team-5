# 미감 규칙 — 제작 측 추출본 (design-maker 용)

**판정 기준 정본은 `.claude/skills/design-figma-build/references/c_checks.md` 다. 이 파일은 제작 측 추출본**이다 — maker 가 HTML 초안(2-C 후보·2-F 화면 세트)을 만들기 **전**에 읽고, 제출 전에 §1~§4 를 자기 점검한다. 판정은 judge(2-D 페르소나 4·2-G·3-E C단계)가 c_checks 로 한다. 수치가 갈리면 c_checks 와 design.md §4C 가 이긴다.
**형식**: 항목마다 `하지 말 것 → 대신(tokens.json 토큰 이름)`. 토큰은 HTML 에서 `var(--<경로-하이픈>)` 로 쓴다(예: `color.semantic.bg.surface` → `var(--color-semantic-bg-surface)`). 값 리터럴을 쓰는 순간 check-html H-4 FAIL 이다.
`layout_rules.md` 가 "실데이터에서 무너지는가" 를 다룬다면 이 파일은 **"AI 가 만든 티가 나는가"** 를 다룬다(채점 UI 축 1점 = AI 슬롭, 5점 = 시니어).

## 1. 하지 말 것 — C-5 슬롭 11항목 (2개 이상이면 `direction` FAIL, 화면 재발산)

| # | 하지 말 것 | 대신 (토큰 이름) |
|---|---|---|
| 1 | 보라→파랑·청록→핑크 그라디언트 배경 | 배경은 `color.semantic.bg.page` 단색. 강조 면은 `color.semantic.brand.subtle` |
| 2 | 이유 없는 glassmorphism / `backdrop-filter: blur` | 오버레이·모달은 `color.semantic.bg.elevated` + `elevation.scale.lg` |
| 3 | 모든 카드가 동일 크기인 3열 그리드(`repeat(3, 1fr)`) | 1열 목록 + 중요한 것 하나만 카드(`elevation.scale.md`), 나머지 행은 `spacing.component_padding.list-row` |
| 4 | "아이콘 + 굵은 제목 + 회색 본문 2줄" 블록 3회 반복 | 아이콘은 design.md §9 사전 위치(하단 내비·상태·주요 액션·빈 상태)에만. 반복 항목은 아이콘 없는 목록 행 |
| 5 | 이모지를 아이콘 대용으로 | `icon.source`(Phosphor Regular 공식 SVG)만, 크기 `icon.size.sm/md/lg`. 장식 이모지는 `aria-hidden` 이어도 쓰지 않는다 |
| 6 | 근거 없는 다크모드 기본값 | brief §3 반응 정본에 다크가 없으면 `color.semantic.bg.page`(= `neutral.0`) |
| 7 | 모든 요소에 동일한 그림자 | `elevation.scale.none / sm / md / lg` 를 중요도별로. 일반 카드는 `none` + `color.semantic.border.default` 1px |
| 8 | 채움용 통계 숫자("99.9%", "10,000+") | PRD 규모대로 몰린 더미(2-C 더미 규칙: 최댓값 1·최솟값 1·특수 케이스 1) |
| 9 | "Lorem ipsum" / "제목을 입력하세요" 잔존 | 로케일 실제 분포의 이름·명칭, 길이 3종 혼합(check-html H-8 FAIL) |
| 10 | 좌측 컬러 보더로 카드 강조 | 강조는 `color.semantic.brand.subtle` 배경 + `color.semantic.border.strong` 또는 `elevation.scale.md` 중 하나 |
| 11 | 점선 테두리 · 하트·반지·꽃 같은 도메인 클리셰 장식 | 브랜드 장치는 design.md §10 의 **하나**만 반복. 경계는 `color.semantic.border.default` 실선 1px |

## 2. 하지 말 것 — C-7 균일함 5신호 (각각 독립 FAIL)

| # | 신호 | 대신 (토큰 이름) |
|---|---|---|
| 1 | **카드 균일** — 한 화면의 카드가 전부 같은 크기·라운드·그림자 | 중요도별로 `elevation.scale.sm / md`, `radius.scale.md / lg`, 폭(전폭 vs 반폭) 중 최소 한 속성을 다르게 |
| 2 | **강조 개수** — 화면당 0개 또는 3개 이상 | 정확히 1개 = `data-role="top-info"` 요소. 크기(`typography.scale.heading-1` 이상)·색(`color.semantic.brand.default`)·여백(`spacing.scale.8`) 중 **두 가지**로 |
| 3 | **제목/본문 배율** 1.5배 미만(굵기만 다름) | 제목 `typography.scale.heading-1`, 본문 `typography.scale.body` — H-17 이 tokens.css 에서 배율을 센다. 굵기(weight)만 바꾸는 강조는 위계가 아니다 |
| 4 | **시각 요소 부재** — 텍스트 블록만 세로로 쌓임 | 이해를 빠르게 하는 것 1개: 상태 칩(`color.semantic.status.state-n` bg/text) · §9 아이콘 · 비교 목적 숫자만 진행 막대(`color.semantic.brand.default` on `bg.surface`) |
| 5 | **여백 균일** — 전 구간 동일 | 섹션 간 `spacing.scale.8`(32) ≥ 요소 간 `spacing.scale.4`(16) 의 2배. 간격은 컨테이너 `gap` 하나가 소유(L-1) |

## 3. 하지 말 것 — C-8 시각 교정 6항목

| # | 하지 말 것 | 대신 (토큰 이름) |
|---|---|---|
| 1 | 굵은 검정 테두리·강한 그림자로 강조 | 일반 카드는 `color.semantic.border.default` 1px 또는 `bg.page` / `bg.surface` 표면 차이만 |
| 2 | 선택 상태를 검정으로 칠함 | `color.semantic.brand.subtle` 배경 + `color.semantic.brand.default` 테두리/표시 |
| 3 | 본문·제목에 순수 검정 `#000` / `black` | `color.semantic.text.primary`(check-html H-16 이 `color:#000|black` 을 FAIL) |
| 4 | 다른 의미(충돌·경고·정보·완료·대기)에 같은 색·같은 배지 | `color.semantic.feedback.success/warning/error/info` 와 `status.state-n` 을 의미마다 다르게 + **아이콘도 함께** 다르게 |
| 5 | 아이콘만 있고 텍스트 없음 / 한 화면에 아이콘 종류 5개 초과 / 기능(라인)·장식(컬러) 혼용 | 아이콘 조작 요소는 `aria-label` 필수, 하단 내비는 아이콘+라벨, §9 사전 밖 아이콘 금지, 굵기 하나(`icon.stroke.width`) |
| 6 | 비활성 탭·아이콘 뒤에 회색 상자(D-33) | 아이콘 컨테이너 배경 없음(`fill: none`). 활성은 `color.semantic.brand.default` 색 변경 또는 `brand.subtle` 알약 하나. 탭바는 `bg.surface` + 상단 `border.default` 1px |

## 4. 화면마다 ≥1 넣을 것 — 긍정형 7항목 (부정형 통과 뒤 최종 PASS 조건)

| # | 넣을 것 | 어떻게 (토큰 이름) |
|---|---|---|
| 1 | **이 화면에만 있는 것** — 다른 앱에 그대로 옮겨도 어색하지 않으면 실패 | 1등 정보를 이 도메인의 형태로(brief §9 REF 의 처리 방식을 참고하되 패턴만). 카드+배지+하단 탭 조합만이면 실패 |
| 2 | **가장 중요한 수치가 압도적** — 주변 텍스트의 2배 이상 | 숫자 `typography.scale.display`, 단위·라벨 `typography.scale.caption`. 숫자와 단위를 같은 크기로 쓰지 않는다 |
| 3 | **정보 종류가 다르면 형태도 다름** — 대기/완료/예외가 같은 카드면 실패 | 구조를 다르게(목록 행 vs 카드 vs 상단 배너). 색·배지만 바꾸지 않는다. 예외는 `color.semantic.feedback.warning.bg` 배너 |
| 4 | **표면에 층** — 최소 2단계 | `color.semantic.bg.page` / `bg.surface` / `bg.elevated` 중 2단계 이상, 카드 그림자는 `elevation.scale.sm` |
| 5 | **브랜드 장치가 살아 있음** | design.md §10 '이 프로젝트의 장치' 하나를 이 화면에도 반복. 토큰을 지킨 것은 규격 준수지 브랜드 표현이 아니다 |
| 6 | **시각 요소는 "없으면 이해가 느려지는가"** 에 예일 때만 | 아니면 제거. 넣은 것 자체는 점수가 아니다(design.md §10 정보의 그림화 — 조건부) |
| 7 | **총괄 — 전문 디자이너의 결과물로 보이는가** | 제출 전 §1~§4 를 자기 점검하고, 걸리는 항목이 있으면 고친 뒤 반환 `EVIDENCE:` 에 점검한 항목 번호를 적는다. "그냥 괜찮음" 으로 끝내지 않는다 |

## 5. 제출 전 자기 점검(grep) — judge 가 보기 전에 maker 가 먼저 센다

`grep -nE 'linear-gradient|radial-gradient|backdrop-filter|color:\s*(#000|#000000|black)|repeat\(3' <파일>` 0건, `grep -c 'box-shadow' <파일>` 이 카드 수와 같으면 §2-1 의심, `data-role="top-info"` 정확히 1개. 이 grep 은 check-html H-15·H-16·H-17 과 같은 목록이다 — maker 가 먼저 돌리면 되돌림 1회를 아낀다.
