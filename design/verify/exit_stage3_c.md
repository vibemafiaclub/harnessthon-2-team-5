# 3단계 C 판정 종료조건 검사 (scripts/check-c-report.js, 2026-09-07T06:42:13.692Z)

- report: design/verify/c_report.json · shots: design/verify/shots/index.md · state: design/state.json · brief: design/brief.md · mode: fast
- 결과: **FAIL** (4/10)

| 항목 | 결과 | 내용 | 근거 |
|---|---|---|---|
| CR-1 | FAIL | JSON 유효, screens 8개 (≥ brief §2 10) | 00_onboarding, 01_home, 02_meetingdetail, 03_guestreply, 04_contacts, 05_contactedit, 06_groupcompose, 07_datepropose |
| CR-2 | FAIL | ran·screenshots 불일치 8건 (화면 8) | 00_onboarding:states 누락 normal·empty·long; 01_home:states 누락 long; 02_meetingdetail:states 누락 empty·long; 03_guestreply:states 누락 normal·long; 04_contacts:state |
| CR-3 | FAIL | index 24파일, 낡은 캡처 0, 시각 누락 24, index 에 없는 화면 0 | 00_onboarding_connected.png:시각 누락; 00_onboarding_invite.png:시각 누락; 00_onboarding_start.png:시각 누락; 01_home_empty.png:시각 누락; 01_home_loading.png:시각 누락; 01_home_no |
| CR-4 | PASS | fail 13건 중 진단·요소·근거 누락 0건 | 전건 분류·근거 있음 |
| CR-5 | PASS | 3축 채점 존재, <3 인데 FAIL 근거 없는 축 0건 | 전 화면 채점·근거 정합 |
| CR-6 | FAIL | 긍정형 7키 위반 24건 (예외 원장 0건) | 00_onboarding:dominant_number=false 예외 승인 없음; 00_onboarding:form_differs_by_kind=false 예외 승인 없음; 00_onboarding:looks_professional 비boolean(undefined); 01_home:d |
| CR-7 | FAIL | tasks 0건 — 불가 0(0), 헤맴 0(≤1), role 누락 0, 미추적 과업 3, 미추적 역할 0 (§2 역할 열 없음 — 역할 대조 N/A) | T-1:추적 없음; T-2:추적 없음; T-3:추적 없음 |
| CR-8 | FAIL | 1등 정보 == 1콜 1순위 불일치·미기록 8건 | 00_onboarding:match=null; 01_home:match=null; 02_meetingdetail:match=null; 03_guestreply:match=null; 04_contacts:match=null·blind_first 없음; 05_contactedit:match |
| CR-9 | PASS | repeat 진단 0건, c_fail_reasons(0건)에 없는 것 0건 | repeat 없음 |
| CR-10 | PASS | SLOP-SWEEP 없는 화면 0건 | 전 화면 SLOP-SWEEP 존재 |
