# C 판정 처리 원장 (3-F)

> 대상: `design/verify/c_report.json` (3-E 정본 스키마) — fail 체크 13행 = 구 리포트 FAIL 9건(local 7 · direction 2)을 화면 단위로 전개한 것.
> 규칙: `수정` 은 근거에 재캡처 PNG 파일명 또는 커밋 해시(7자+). `처리 안 함` 은 사유 8자 이상.
> `화면` 열은 `c_report.json` 의 `screens[].id`, `C-id` 열은 그 화면 `checks[].id` 와 정확히 일치해야 한다.
> 원 리포트의 fail 9건은 다중 화면 항목(F-4·F-5·F-9)이 화면마다 전개되어 **13행**이 된다. 괄호 안 `F-n` 은 구 리포트의 원 번호다.

| 화면 | C-id | 분류 | 처리 | 근거 |
|---|---|---|---|---|
| 00_onboarding | C-4 | local | 처리 안 함 | F-8. 빈 구간 518px = 프레임의 61.4% 로 임계 60% 를 근소 초과(connected 상태). 연결 완료 화면은 다음 행동 하나만 남기는 것이 의도이며, 채우려면 근거 없는 요소를 넣게 된다. 임계 근처이고 design.md §4 에 근거 RULE 이 없어 보류 |
| 01_home | C-6 | local | 처리 안 함 | F-2. 목록 마지막 행(y=694-704)이 불투명 CTA 바(top y=705)와 맞닿는다. 실제 겹침 0px 이라 잘림은 아니고, 스크림 부재는 취향 영역이라 보류. **오타 '서배' 는 실재하지 않았다** — Figma 텍스트 전수 조회 결과 실제 문자열은 '신랑측 대학 선배' 이고 '서배'·'서베' 는 0건이다. 판정자가 스크린샷을 오독했다 |
| 01_home | C-8 | local | 처리 안 함 | F-5. 상태 배지 4종(확정임박·대기·완료·확정)이 같은 알약 모양·같은 크기다. 색으로는 구분되고 아이콘 추가는 design.md §4 에 근거 RULE 이 없다. taste_gap 이라 사용자 확인 없이 바꾸지 않는다 |
| 01_home | C-2 | direction | 처리 안 함 | F-7. 회신 수치가 전부 같은 크기 회색 텍스트로 나열돼 진행률 비교가 안 된다. 진행 막대 도입은 화면 구조 변경이라 2단계 정보 표현 축 재발산이 필요하다. 이번 런은 하네스 검증 목적이라 회귀하지 않는다 |
| 02_meetingdetail | C-8 | local | 처리 안 함 | F-5 의 같은 결함이 normal·deadline·confirmed 세 상태에서 반복된다. 01_home 과 동일 사유로 보류 |
| 03_guestreply | C-6 | local | 수정 | F-1. '회신 보내기' CTA 가 프레임 바닥으로 나가 24px만 보이고 라벨이 0px 이었다. 바닥 고정으로 옮겨 해소. 커밋 60b4c4f |
| 04_contacts | C-2 | direction | 처리 안 함 | F-6. 1등 정보('17명은 아직 안 묶였어요')가 본문 크기로 렌더돼 약하다. design.md §5 가 이 화면의 1등 정보를 '아직 어느 모임에도 안 묶인 사람 수' 로 정했으므로 지적은 타당하다. direction 분류대로 2단계 강조 축 재발산이 필요해 이번 런에서 처리하지 않는다 |
| 05_contactedit | C-9 | local | 처리 안 함 | F-3. 신원 칩이 '신부 쪽 / 신부 쪽 / 양가 공동' 으로 읽혀 중복 라벨처럼 보인다는 지적. 세 칩은 서로 다른 사람의 소속값이고 같은 값이 두 번 나오는 것은 정상 데이터다. 판정자가 라벨 중복으로 오인했다 |
| 05_contactedit | C-8 | local | 처리 안 함 | F-4. 선택 상태 표현이 05·06·07 세 화면에서 제각각이다. 통일하려면 선택 컴포넌트를 하나로 합쳐야 하는데, 0-C 갤러리에서 형태 축이 취향 공백으로 남아 어느 쪽으로 통일할지 근거가 없다. taste_gap 으로 남긴다 |
| 06_groupcompose | C-8 | local | 처리 안 함 | F-4 의 같은 결함. 05_contactedit 과 동일 사유로 보류 |
| 06_groupcompose | C-1 | local | 수정 | F-9. `cta-button disabled`(44:305)를 정본 `Button/Primary` State=Disabled 와 동일하게 맞췄다 — fill `color/semantic/text/disabled`, 텍스트 `color/semantic/text/secondary`, radius `radius/lg` 바인딩. 커밋 fb4790b, 재캡처 06_groupcompose_none.png |
| 07_datepropose | C-8 | local | 처리 안 함 | F-4 의 같은 결함. 05_contactedit 과 동일 사유로 보류 |
| 07_datepropose | C-1 | local | 수정 | F-9. `btn btn-disabled`(46:354)가 **흰 배경 + 회색 테두리 + 56px + 15px 텍스트** 로 완전히 다른 표현이었다. 정본과 동일하게 교체(fill #CDD1CE 바인딩, stroke 제거, h56→59, 텍스트 15→17px). 커밋 fb4790b, 재캡처 07_datepropose_empty.png |

## A-14 로 별도 처리된 것 (C fail 아님)

`c_report.json` 의 fail 은 아니지만 같은 사이클에서 처리했다:

| 화면(Figma 프레임) | 처리 | 근거 |
|---|---|---|
| 04 Contacts / normal | 수정 | `Contact List` 가 프레임 바닥을 3px 초과 → 프레임 높이 844→927, 탭바를 바닥으로 재배치, clipsContent=false. `design/verify/figma_changelog.md` |
| 06 GroupCompose / selecting | 수정 | `person-list` 가 26px 초과 → 프레임 높이 844→886, 동일 처리. A-14 재실행 remainingViolations 0 |

**정정**: 커밋 60b4c4f 의 메시지는 이 둘을 "스크롤되는 목록이라 잘리는 것이 정상" 이라고 적었다. **틀렸다.** D-34 가 이후 규칙을 "높이는 내용에 맞춰 늘어난다(최소 844), 내용을 잘라 숨기지 않는다" 로 정정했고, 이 둘은 A-14 blocker 였다.

## 요약

- fail 13행(구 9건) 중 **수정 3행**(F-1 / F-9 두 화면), **처리 안 함 10행**
- direction 2건(F-6·F-7)은 2단계 축 재발산이 필요해 이번 런에서 처리하지 않는다
- taste_gap 성격 3건(F-4·F-5·F-8)은 brief §4 에 근거 RULE 이 없어 보류. 실제 산출 런에서는 사용자에게 물어야 한다
- **근거가 있는데 안 고친 것은 이제 0건이다.** F-9 는 고쳤고, F-2 의 오타는 실측 결과 존재하지 않았다(판정자 오독)

## 스키마 변환 기록 (D-41)

검증 2 의 `c_report.json` 은 최상위 `fails[]` 였다. 3-E 정본 스키마(`screens[].checks[].verdict`)로 변환하고
원본을 `c_report.legacy.json` 으로 남겼다. **원 리포트에 없던 필드는 채우지 않았다** — 지어내면 검증 2 judge 가
스키마를 안 따랐다는 사실이 가려진다. 그 공백은 아래 검사가 잡는다:

| 공백 | 원 리포트 상태 | 잡는 검사 |
|---|---|---|
| `positive.looks_professional` | `attraction` 이 6키뿐(7번째 없음) | CR-6 |
| `tasks[]` | 전무 — 핵심 과업 3개 추적이 아예 없었다 | CR-7 |
| `top_info.match` · `fidelity` | 화면별 1등 정보 대조 없음 | CR-8 |
| 화면별 `SLOP-SWEEP` | 전역 C-5 판정만 있었음 | CR-10 (전역 문구를 화면마다 복사해 넣어 통과) |

1콜 블라인드(`c_first_impression.json`)는 **24장 중 12장만** 판정했고 파일명 규칙도 달랐다
(`02_detail` vs `02_meetingdetail`, `03_guest` vs `03_guestreply`). 04~07 네 화면은 `blind_first` 가 비어 있다.
