# Figma 변경 원장 (검증 2 자산)

> **왜 이 파일이 있나.** Figma 안에서 한 변경은 git diff 에 나타나지 않는다.
> 노드를 지우고 색을 바꾸고 변수를 다시 묶은 일은 여기에만 남는다.
> 커밋 해시는 함께 바뀐 로컬 파일(리포트·원장·캡처)의 것이다.
>
> **상태: 닫힘 (2026-09-07).** 검증 2 자산의 A검사는 최종치로 종결했다.
> 남은 두 건(`primary-action-visible` 24 · `layer-naming-semantic` 267)은
> 명명 규약이 이 파일 생성 이후 도입된 것이라 소급하지 않고 다음 런(02 픽스처) 대상이다.

---


## 2026-09-07 · 탭바 아이콘 배경 칩 제거 (사용자 지적)

**증상**: 탭 네 칸의 아이콘 뒤에 연한 회색 둥근 박스가 보인다.

**원인**: `duo-bg-chip`(RECTANGLE, 24×24, radius 6, fill opacity 0.14)이
아이콘마다 깔려 있었다. `tokens.json` 의 `icon.style: duotone` 을 제작
에이전트가 "아이콘 뒤에 반투명 사각형을 깐다"로 해석한 결과다. duotone 은
형태를 두 색조로 나누는 것이지 배경 판을 까는 것이 아니다.

**같은 오해가 만든 두 겹의 문제**

| 요소 | 증상 | 처리 |
|---|---|---|
| `duo-fg` 불투명 채우기 | 벡터를 같은 색 면으로 덮어 **초록 네모**로 보임 | 16건 제거(9/7 앞서) |
| `duo-bg-chip` 사각형 | 아이콘 뒤 **회색 박스**, 탭 네 칸이 모두 박스로 보임 | **16건 제거(이번)** |

앞의 것을 고칠 때 뒤의 것도 같이 봤어야 했다. "아이콘이 보이게 됐다"에서
멈춘 것이 원인이다. **보이는 것과 제대로 보이는 것은 다르다.**

**조치**: `Components` 페이지 `Bar/TabBar`(30:155) 마스터에서 `duo-bg-chip`
16개 제거(아이콘 4종 × variant 4).

**확인**: 마스터가 아니라 **화면에 놓인 인스턴스**를 직접 캡처해 확인했다
(D-10 교훈). 탭바가 있는 프레임 9개 전부에서 잔존 칩 **0개**, 각 탭바
보이는 벡터 **10개** 유지.

**남은 구조**: `Icon/*` → `duo-fg`(FRAME, fill 없음) → `Vector`(stroke만).

## 2026-09-07 · 지인 회신 화면 CTA 잘림 수정 (사용자 지적)

**증상**: `03 GuestReply / answering` 하단 "회신 보내기" 버튼이 프레임 밖으로
나가 **24px만 보였다**(y 820~879, 프레임 844, 35px 잘림).

**이미 C 판정이 잡았던 것**: 검증 2 재판정의 `F-1` — "03_answering CTA 프레임 밖
잘림, 가시 24px". **리포트를 받고도 고치지 않았다.** 사용자가 다시 지적해야 했다.

**전수 조사 결과** 하단으로 잘린 최상위 요소 3건:

| 프레임 | 요소 | 잘림 | 판단 |
|---|---|---|---|
| 03 GuestReply / answering | Button/Primary | 35px (24px만 보임) | **결함** |
| 06 GroupCompose / selecting | person-list | 26px | 정상(스크롤 목록) |
| 04 Contacts / normal | Contact List | 3px | 정상(스크롤 목록) |

**조치**: `03 GuestReply` 의 CTA 를 콘텐츠 흐름에서 빼내 프레임 바닥 고정
(`layoutPositioning=ABSOLUTE`, y = 844 - 높이 - 24, 폭 350). empty·answering
두 화면 적용, submitted 는 CTA 없음. 세 화면 모두 잘린 요소 0.

**규칙 공백**: D-11 이 "프레임 844 고정, 넘치면 자름"을 넣었지만 **무엇이 잘려도
되고 무엇이 안 되는지**를 가르지 않았다.

- 잘려도 되는 것: 스크롤되는 목록·카드 (잘림이 곧 스크롤 신호)
- 잘리면 안 되는 것: 하단 고정 CTA·탭바·상태바·헤더

C 판정이 잡을 수는 있으나 육안 판정이라 놓칠 수 있고, 실제로 이번엔 잡고도
반영이 안 됐다. A검사 항목으로 넣는 것이 맞다.

## 2026-09-07 — A-14(content-not-cut) 위반 2건 수정

`content-not-cut` blocker 를 Figma 내부에서 실행해 프레임 밖으로 나간 자식 2건을 찾았다.

| 프레임 | 위반 | 처리 |
|---|---|---|
| 04 Contacts / normal | `Contact List` 바닥 y=847 (프레임 844, 3px 초과) | 프레임 높이 844→**927**, 탭바 바닥 재배치, `clipsContent=false` |
| 06 GroupCompose / selecting | `person-list` 바닥 y=870 (26px 초과) | 프레임 높이 844→**886**, 동일 처리 |

재실행 결과 `remainingViolations: 0`.

**이 둘은 커밋 60b4c4f 에서 "스크롤되는 목록이라 잘리는 것이 정상" 으로 잘못 분류했던 것이다.**
D-34 가 규칙을 "높이는 내용에 맞춰 늘어난다(최소 844), 내용을 잘라 숨기지 않는다" 로 정정하면서
둘 다 blocker 로 뒤집혔다. Figma 내부 변경이라 git diff 에 나타나지 않아 여기에 기록한다.

## 2026-09-07 — F-9 비활성 CTA 표현 통일

`Button/Primary` COMPONENT_SET 에 `State=Disabled` variant 가 이미 있는데
두 화면 모두 인스턴스를 쓰지 않고 생 FRAME 으로 따로 그려서 표현이 갈렸다.

| 노드 | 수정 전 | 수정 후 |
|---|---|---|
| `44:305` cta-button disabled (06 GroupCompose / none) | fill #CDD1CE, h59, 텍스트 17px — 색은 맞으나 변수 미바인딩 | 정본과 동일 바인딩 |
| `46:354` btn btn-disabled (07 DatePropose / empty) | **fill #FFFFFF + 회색 테두리, h56, 텍스트 15px** | fill·텍스트·높이·radius 전부 정본과 동일 |

정본(`State=Disabled`)의 바인딩을 그대로 복사했다:
fills → `color/semantic/text/disabled`, 텍스트 fills → `color/semantic/text/secondary`,
radius 4개 → `radius/lg`, stroke 없음.

**중간에 낸 회귀 하나**: 첫 시도에서 `n.cornerRadius = 16` 을 대입해 topLeft~bottomRight
radius 의 변수 바인딩 4개가 끊겼고, `#CDD1CE` 값 검색으로 `color/primitive/neutral/300` 을
직접 바인딩해 "semantic 만 직접 사용" 원칙도 어겼다. 정본 variant 의 바인딩을 읽어
그대로 복사하는 방식으로 다시 고쳤다. **값으로 변수를 역추적하면 primitive 가 잡힌다.**

### 별건 (F-9 범위 밖, 미처리)

활성 CTA 도 화면마다 규격이 다르다 — 06 `cta-button` 358×59/17px,
07 `btn btn-primary` **390×56/15px**(좌우 여백 0), 03 `Button/Primary` 350×59/17px.
07 의 폭 390 은 프레임 전폭이라 여백이 없다. C 판정은 비활성만 지적했다.

## 2026-09-07 — 24장 재캡처 (D-44 해결)

`exportAsync` 의 base64 는 use_figma 응답 한도에서 잘려 PNG 를 파일로 만들 수 없다
(33KB PNG → base64 45KB, 15000자씩 3조각). **답은 `get_screenshot` 이었다** —
이 툴은 기본적으로 `figma.com/api/mcp/asset/<uuid>.png` 단명 URL 과 curl 지시를 돌려주고,
그 URL 은 인증 없이 `curl -L` 로 raw PNG 를 준다. 툴 설명이 "URL+curl 경로가 강력히 권장됨"
이라고 적고 있는데 3-E 는 `exportAsync` 를 적어 두었다.

24장 전부 이 경로로 재캡처했다. 검증된 부수 효과:

- `04_contacts_normal` 390×**927**, `06_groupcompose_selecting` 390×**886**
  → A-14 프레임 확장이 캡처에 그대로 나타난다
- `07_datepropose_empty` sha 변경 → F-9 수정 반영
- `06_groupcompose_none` sha 동일 → 이 화면은 원래 색이 정본과 같았고 바꾼 것이
  변수 바인딩뿐이라 픽셀이 안 변하는 것이 맞다

24장 중 13장의 sha 가 바뀌었다. CR-3 PASS(실측 mtime 24, 자기 신고 0).

## 2026-09-07 — A검사 21규칙 전체 실행

`type-style-reuse` 1건이 **F-9 수정 때 낸 회귀**였다. `x.fontSize = 17` 직접 대입으로
`46:355`(07 비활성 CTA 텍스트)의 `textStyleId` 가 빈 문자열이 됐다.
정본 `State=Disabled` 의 `type/body-large` 를 `setTextStyleIdAsync` 로 재바인딩,
Screens 전체 인라인 텍스트 0건 확인.

**`n.cornerRadius = 16` 때와 같은 패턴이다** — 값을 직접 대입하면 바인딩·스타일이 조용히 끊긴다.
정본 노드의 `boundVariables`·`textStyleId` 를 복사해야 한다(3-B 에 반영됨).

### 최종 결과

| | Screens | Components |
|---|---|---|
| passed_machine | false | **true** |
| 검사 노드 | 1253 | 182 |
| blocker / warning | 27 / 25 | 0 / 0 |

| 규칙 | 위반 | 적용 | 성격 |
|---|---|---|---|
| `primary-action-visible` | 24 | 24 | `Action/Primary` 명명 규약 미도입 — 검증 2 소급 대상 |
| `touch-target-min-inferred` | 25 | 43 | `field-input` 358×40 (기준 44) — warning |
| `frame-spec` | 3 | 24 | **02 MeetingDetail 3장에 탭바가 있다** |
| `type-style-reuse` | 0 | 510 | 회귀 수정됨 |
| `content-not-cut` | 0 | 1213 | A-14 유지 |
| `no-primitive-binding` | 0 | 1253 | A-15 정상 실행 |
| 나머지 11규칙 | 0 | | |

### 02 MeetingDetail 탭바 3건 — 규칙이 옳다

탭바 규칙이 IA 기준 양방향으로 바뀌자 반대 방향 불일치가 드러났다.
`prd_analysis` §1 에서 이 화면의 진입 경로는 **"홈 카드 / 일정 카드"** — push 다.
탭바가 있으면 안 된다. 다음 라운드 수정 대상.

## 2026-09-07 — 02 탭바 제거 + 입력칸 터치 영역 (A검사 지시 2건)

### 02 MeetingDetail 탭바 3개 제거

`prd_analysis` §1 에서 이 화면의 진입 경로는 **"홈 카드 / 일정 카드"** — push 다.
탭 화면이 아니므로 탭바가 있으면 안 된다. IA 기준 양방향 판정이 도입되자 드러났다.
제거 전 확인: `Content` 가 y=780 까지라 탭바(780~844)에 가려진 내용은 없었다.

| 노드 | 프레임 |
|---|---|
| `54:510` | 02 MeetingDetail / normal |
| `54:541` | 02 MeetingDetail / deadline |
| `54:572` | 02 MeetingDetail / confirmed |

→ `frame-spec` **3 → 0**

### 입력칸 10개 세로 패딩 확대 (40 → 48)

`touch-target-min-inferred` warning 25건의 정체는 **입력칸 6 + 체크박스 19** 였다.

입력칸(`field-input` ×6, `search-input` ×1, `name-input` ×3)은 세로 패딩을
`spacing/2`(8) → `spacing/3`(12) **변수 바인딩 교체**로 올려 높이 48 을 만들었다.
값 직접 대입을 피해 바인딩이 끊기지 않았다(cornerRadius·fontSize 회귀와 같은 함정).

→ `touch-target-min-inferred` **25 → 19**

### 체크박스 19건은 처리하지 않았다

전부 24×24 다. fix_hint 는 "노드 크기를 키우지 말고 패딩 또는 히트영역을 확장,
시각 크기는 유지" 인데 **Figma 에는 히트영역 개념이 없다** — 실제 앱 코드의 관심사다.
24px 체크박스를 44px 로 키우면 디자인이 망가지므로 그 처방도 쓸 수 없다.
규칙의 적용 범위 문제로 보고 보류했다.

### 정정

동료 지시는 "`field-input` 은 컴포넌트라 마스터 한 곳 수정으로 전 인스턴스 해소" 였으나,
실측 결과 **컴포넌트가 아니라 생 FRAME 6개**였다(`isInstance: false`). 개별 처리했다.

### A검사 결과 (재실행)

| 규칙 | 전 | 후 |
|---|---|---|
| `frame-spec` | 3 | **0** |
| `touch-target-min-inferred` | 25 | **19** (체크박스만) |
| `type-style-reuse` | 0 | 0 |
| `no-primitive-binding` | 0 | 0 |
| `content-not-cut` | 0 | 0 |
| `primary-action-visible` | 24 | 24 (명명 규약 미도입 — 소급 안 함) |

blocker 27 → **24**, warning 25 → **19**. 24장 전건 재캡처, CR-3 PASS.

## 2026-09-07 — 터치 타깃 해소, 레이어 네이밍 규칙 검증

### touch-target-min-inferred 19 → 0

행 패턴이 경계 매칭으로 바뀌자 `person-row`(358×68) 안의 체크박스 24×24 가
전부 통과했다. 규칙이 실제 터치 대상(행)을 보게 됐다.

### layer-naming-semantic — allow 정규식이 한글·인스턴스 이름을 오탐한다

allow 가 복원되자 288건이 잡혔는데 기록된 10건 전부가 **규약을 잘 지킨 이름**이었다:
`Tag/신랑측 지훈`, `Row/Meeting - 대학 동기 모임`, `Button/Primary - 모임 만들기`.

원인은 `^[A-Z][A-Za-z0-9 ]*(/[A-Z][A-Za-z0-9 ]+)*$` 가
①한글을 문자로 인정하지 않고 ②슬래시 뒤 **모든** 세그먼트에 대문자 시작을 요구하는 것이다.
한국어 서비스에서 레이어 이름에 실제 데이터명이 들어가는 것은 자연스럽고,
Figma 인스턴스는 `Component - Variant` 형식 이름이 기본이다.

컨테이너 533개 전수 비교:

| 정규식 | 위반 | 성격 |
|---|---|---|
| 현재 `^[A-Z][A-Za-z0-9 ]*(/[A-Z][A-Za-z0-9 ]+)*$` | 364 | 한글·하이픈 전부 오탐 |
| B `^[A-Z][^/]*(/[A-Z][^/]*)*$` | 355 | 내용 문자는 풀렸으나 세그먼트 대문자 요구 유지 |
| **C `^[A-Z][^/]*(/[^/]+)*$`** | **319** | 첫 세그먼트만 대문자, 뒤는 자유 |

C안이 구제하는 것(전부 좋은 이름): `Tab/home` ×6, `Tag/신랑측 지훈` ×4,
`Row/Meeting - 대학 동기 모임`, `RoleCard/지훈`, `Button/Primary - 시작하기`, `BtnSecondary/링크 복사`

C안이 여전히 잡는 것(전부 진짜 위반): `chip` ×45, `duo-fg` ×24, `person-row` ×19,
`person-main` ×19, `topbar` ×9, `contact-row` ×8, `avatar` ×8, `btn-ok` ×6 — 66종.

규칙의 본질은 "첫 글자가 대문자인가"(자동 생성·소문자 코드형 이름 배제)이지
모든 세그먼트가 아니다. 남은 319건은 이 파일의 실제 상태이며 소급하지 않는다(warning).

## 2026-09-07 — A검사 최종치 (검증 2 자산)

네이밍 규칙 분리(semantic/auto) + C안 정규식 반영. **이 값이 검증 2 자산의 A검사 최종치다.**

```
passed_machine: false
blocker  24 = primary-action-visible
warning 267 = layer-naming-semantic
bytes 14763, violations_truncated_cap 10, over_budget 없음
```

| 규칙 | 위반 | applicable |
|---|---|---|
| `primary-action-visible` | **24** | 24 |
| `layer-naming-semantic` | **267** | 429 |
| `layer-naming-auto` | 0 | 1172 |
| `touch-target-min-inferred` | 0 | 43 |
| `frame-spec` | 0 | 24 |
| `type-style-reuse` | 0 | 498 |
| `no-primitive-binding` | 0 | 1172 |
| `content-not-cut` | 0 | 1132 |
| `text-not-clipped` | 0 | 498 |
| `no-zero-size-node` | 0 | 1172 |
| `text-size-min` | 0 | 498 |
| `no-reference-color-copy` | 0 | 1172 |
| `color-palette-allowlist` | 0 | 1172 |
| `spacing-grid` | 0 | 506 |
| `radius-scale` | 0 | 1172 |
| `icon-foreign-fill` | 0 | 1172 |

`not_applicable`: `touch-target-min`, `variant-state-coverage`
`requires_human_review`: `contrast-text-aa`, `contrast-nontext-aa`, `image-fill-valid`

**applicable 정합 확인**: `layer-naming-semantic` 이 429(컨테이너)로 잡혔다.
분리 전에는 1172(전 노드)였다. 규칙 분리가 의도대로 동작한다.
내 전수 조사(533/319)와 차이는 인스턴스 내부 노드 제외 때문으로 보이며,
위반/적용 비율(267/429 = 62%)은 조사치(319/533 = 60%)와 일치한다.

**남는 두 건은 전부 명명 규약 문제이고 다음 런(02 픽스처) 대상이다.**
- `primary-action-visible` 24: `Action/Primary` 규약이 파일 생성 이후 도입됨
- `layer-naming-semantic` 267: `add-btn`·`chip`·`contact-row` 등 소문자 코드형 이름

두 규칙 다 3-B·3-C 가 처음부터 규약대로 이름을 지으면 자연히 0 이 된다.
검증 2 자산에 소급하지 않기로 합의했다(figma_nodes.json 매핑과 이름 기반 규칙이 얽힘).

---

## 마무리 — 이 세션에서 실제로 고친 것

Figma 에 가한 변경 전부(시간순):

| # | 변경 | 발견 경로 |
|---|---|---|
| 1 | 탭바 아이콘의 회색 배경 칩 16개 제거 | **사용자 눈** |
| 2 | 아이콘을 덮던 불투명 fill 16개 제거 | **사용자 눈** (3회 지적) |
| 3 | 03 GuestReply CTA 잘림 수정 (바닥 고정) | C 판정 F-1 |
| 4 | 04·06 프레임 높이 확장 (844→927, 844→886) | A-14 `content-not-cut` |
| 5 | F-9 비활성 CTA 2개를 정본 variant 로 통일 | C 판정 F-9 |
| 6 | 02 MeetingDetail 탭바 3개 제거 | A검사 `frame-spec` (IA 양방향) |
| 7 | 입력칸 10개 세로 패딩 확대 (40→48) | A검사 `touch-target` |
| 8 | `46:355` 텍스트 스타일 재바인딩 | A검사 `type-style-reuse` — **내 회귀** |

### 두 번 반복한 함정

`n.cornerRadius = 16` → radius 변수 바인딩 4개가 조용히 끊겼다.
`t.fontSize = 17` → 텍스트 스타일 바인딩이 조용히 끊겼다.

**값을 직접 대입하면 바인딩·스타일이 끊긴다.** 정본 노드의 `boundVariables`·`textStyleId` 를
읽어 복사해야 한다. 색을 값(`#CDD1CE`)으로 역추적하면 alias 사슬 끝의 primitive 가 잡혀
"semantic 만 직접 사용" 원칙도 함께 깨진다. 3-B 에 반영됐다.

### 검사기가 준 신호와 소음

이 세션에서 A검사가 낸 것 중 **실제 결함은 4건**(#4·#6·#7·#8)이고, 나머지는 규칙 쪽 문제였다:

| 규칙 쪽 문제 | 오탐/영향 |
|---|---|
| A-15 등록만 되고 미실행 | 0건 보고 → 신호 없음 |
| 탭바 규칙이 IA 를 모름 | 15건 오탐 → 3건이 진짜 |
| 터치 타깃이 실제 대상(행)을 잘못 지목 | 19건 오탐 |
| naming allow 가 한글·인스턴스 이름 배제 | 약 100건 오탐 |
| CR-3 이 자기 신고를 믿음 | 서브에이전트 위조 1회 실제 발생 |
| F-11 이 스키마 불일치로 무조건 PASS | 게이트 무력 |
| 예산 절단이 violations 를 안 줄임 | 결과 JSON 잘림 → 잘린 값이 정상으로 저장될 뻔함 |

**검사기를 늘리는 국면에서는 오탐이 진짜 결함보다 많다.** 이번 실측 비율은 대략 4 : 100+ 이다.

### 사용자 눈이 먼저 잡은 것

#1·#2 는 기계 검사를 전부 통과한 상태에서 사용자가 화면을 보고 지적했다.
#2 는 세 번 지적받고서야 원인(불투명 fill)을 찾았다 — 마스터 컴포넌트만 확인하고
"24개 프레임에 반영됐다" 고 보고한 것이 원인이다. **위임의 완료 보고도, 내 확인도
실물 대조 없이는 근거가 아니다.**
