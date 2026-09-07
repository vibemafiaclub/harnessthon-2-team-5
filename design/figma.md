# 청첩장모임 스케줄러 — 디자인 산출물

**Figma**: https://www.figma.com/design/sbkAu7Vvampc2WR1CozIWb
**HTML 초안 미리보기**: https://claude.ai/code/artifact/03e7bd17-3652-470e-83a0-35f1d4dc6147
생성일 2026-09-05 · 모드 fast(`--budget 40m`)

## 파일 구성

| 페이지 | 내용 |
|---|---|
| `Screens` | 화면 프레임 24개 (8화면 × 상태 3종), 전부 390×844 |
| `Components` | 컴포넌트 8종 · variant 20개 |
| Variables | `primitive` / `semantic` 2컬렉션 · 81개 + 텍스트 스타일 9개 |

## 화면 목록

| # | 화면 | PRD | 이 화면의 1등 정보 | 상태 |
|---|---|---|---|---|
| 00 | 온보딩 (커플 연결) | §5 | 상대를 초대하는 것 | start · invite · connected |
| 01 | 홈 (전체 조망) | F5·F6 | 이번 주말 일정 | normal · empty · loading |
| 02 | 모임 상세 (조율) | F3·F4 | 회신 n/N 과 마감까지 남은 시간 | normal · deadline · confirmed |
| 03 | 지인 회신 (링크) | F3 | 내가 가능한 날짜 고르기 | empty · answering · submitted |
| 04 | 지인 풀 | F1 | 아직 어느 모임에도 안 묶인 사람 수 | normal · empty · loading |
| 05 | 지인 편집 | F1 | 이 사람을 어느 관계로 묶을 것인가 | edit · new · oneonone |
| 06 | 모임 편성 | F2 | 고른 사람과 그중 중복 소속인 사람 | selecting · none · noname |
| 07 | 날짜 후보 | F3 | 언제가 좋을지 후보 고르기 | selected · empty · sent |

탭바는 앱 내부 화면(01·02·04)에만 있다. 온보딩은 탭 진입 전, 지인 회신은 앱 밖(링크)이라 없다.

## PRD 를 그대로 따르지 않은 것 (사용자 확인 완료)

| # | PRD | 하네스 반박 | 사용자 답 | 결과 |
|---|---|---|---|---|
| P-01 | 회신 수합만 있고 지인이 답하는 화면이 없음 (누락) | 설치 없이 링크로 여는 경량 회신 화면이 필요하다 | "링크만 열면 끝" | 03 을 1급 화면으로 신설 |
| P-02 | 모임 상태 4단계를 탭·필터로 (과잉) | 주 2~3건 규모에 4칸은 빈 칸만 보인다 | "아니오, 한 눈에" | 홈에서 탭 제거, 상태는 행 배지로 |

## 0단계에서 뽑은 판단기준 6개

| ID | 기준 | 신뢰도 |
|---|---|---|
| RULE-01 | 제목은 본문보다 뚜렷하게 크되 배경색 박스로 감싸지 않는다 | proposed |
| RULE-02 | 한 가지 색만으로 보이지 않게, 강조색은 선명한 고채도 | **confirmed** |
| RULE-03 | (형태) 근거 부족 — 1단계 세트 선택으로 채움 | proposed |
| RULE-04 | 제목은 크기·굵기로 위계, 본문 서체는 사용자가 싫다 한 것을 피함 | proposed |
| RULE-05 | 홈은 상태별 탭으로 나누지 않고 이번 주말 일정을 최상단에 | proposed |
| RULE-06 | 링크로 열리는 초대·회신 화면은 본문을 크게, 대비를 진하게 | proposed |

RULE-06 은 `[CONSTRAINT]`(양가 어른이 본다)라 반응으로 덮지 않는다. 03 GuestReply 본문만 17px, 나머지 화면은 15px.

## 검증 결과

**A 단계 (기계 검사, 최종)**

| 항목 | 결과 |
|---|---|
| 프레임 24개 · 전부 390×844 | PASS |
| 프레임 겹침 | 0건 |
| fill/stroke Variables 바인딩 | 미바인딩 **0** |
| 텍스트 스타일 적용 | 미적용 **0** |
| 레이어 기본 이름(`Frame 1` 류) | 0건 |
| 탭바 인스턴스·아이콘 | 9프레임 전부 정상, 벡터 10개/바 |
| 명세 라벨 잔존 | 0건 |
| 요소 잘림·탭바 겹침 | 0건 |
| **컴포넌트 재사용률 12.7%** (기준 70%) | **미달 — 사용자 승인 하에 진행** |

**C 단계 (육안 판정, 2콜)** — 자체 채점 UI 3 / UX 3 / 적합성 3 (1=AI 슬롭, 3=신입, 5=시니어)

수정 완료: 명세 라벨 노출 · 버튼 텍스트 줄바꿈 깨짐 · 주 버튼 색 불일치(주황↔초록) · 주황 4역할 겸용 · 경보 hue 불일치 · 비활성 버튼 대비 · 탭바 아이콘 · 하단 버튼 가림

## 남은 것

- **컴포넌트 재사용률 12.7%** — 화면 요소 315개 중 인스턴스 40개. 보이는 품질은 같으나 나중에 일괄 수정이 어렵다. 기준을 채우려면 211개 컴포넌트화가 필요해 사용자가 "그대로 두고 마무리"를 선택했다.
- C 판정의 `taste_gap` 5건(SLOP-SWEEP) — 규칙에 근거가 없어 판정 보류. `design/verify/c_report.md` §7 참조.

## 사용한 모델·에이전트

| 에이전트 | 모델 | 역할 |
|---|---|---|
| 메인 세션 | Opus 5 (1M) | 사용자 대화, 위임, 최종 판단, Figma 직접 수정 |
| `design-judge` | Opus 5 · high | PRD 분석, 갤러리 QA 채점, 규칙화, 인용 감사, C 판정 |
| `design-maker` | Sonnet 5 · medium | 자극 갤러리, 토큰 세트, HTML 초안, Figma 구현 |
| `design-worker` | Haiku 4.5 · low | 종료조건 검사, WCAG 계산, 스크린샷 저장 |

## 산출물 지도

```
design/
  state.json          진행 상태
  prd_analysis.md     0-A PRD 분석 (48줄)
  interview_raw.md    사용자 발화 원문 전량
  brief.md            0단계 판단기준 (138줄)
  tokens.json         값의 단일 정본 — HTML·Figma 공유
  design.md           토큰 근거와 규칙 (88줄)
  figma_nodes.json    Figma 노드 ID
  stimuli/            갤러리·월드컵·토큰 가이드
  drafts/             HTML 초안 8화면 + tokens.css
  verify/             a_report·c_report·wcag·exit_* · shots/
```
