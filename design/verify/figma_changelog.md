
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
