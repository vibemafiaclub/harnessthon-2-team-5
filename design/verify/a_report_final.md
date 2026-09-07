# Figma 최종 검사 보고 (Screens 페이지)

검사 일시: 2026-09-05 | 검사 대상: sbkAu7Vvampc2WR1CozIWb (Screens 페이지)

## 검사 결과 요약

| 항목 | 기준값 | 측정값 | 결과 |
|---|---|---|---|
| 1. 프레임 규격 | 24개, 모두 390×844px | 24개, 모두 390×844px | PASS |
| 2. 프레임 겹침 | 겹침 0건 | 겹침 0건 | PASS |
| 3. 팔레트 일관성 | 모든 fill/stroke Variables 바인딩 | Variables 바인딩 0건 미충족 | PASS |
| 4. 타이포 스타일 | 모든 TEXT에 textStyleId | 89개 노드 미적용 (상태바·탭바 라벨) | **FAIL** |
| 5. 레이어 네이밍 | Frame/Rectangle/Group/Ellipse 기본명 0건 | 기본명 0건 | PASS |
| 6. 탭바 일관성 | INSTANCE, 벡터 ≥8개, 활성 variant 정확 | 01Home/02MeetingDetail/04Contacts 확인, 모두 ≥10개 벡터 | PASS |
| 7. 탭바 없어야 할 곳 | 00/03/05/06/07 프레임 탭바 0건 | 0건 확인 | PASS |
| 8. 요소 잘림·겹침 | 프레임 아래 삐져나간 요소·탭바 겹침 0건 | 0건 | PASS |
| 9. 지인 회신 본문 크기 | 03 GuestReply > 다른 화면 | 17pt > max(15pt) | PASS |
| 10. 명세 라벨 잔존 | 상태1/2/3/상태: 등 0건 | 0건 | PASS |

## 위반 사항 (항목 4만 해당)

**TextStyleId 미적용 노드:** 상태바 LTE 100% 표시(노드 9:41)와 탭바 라벨(홈, 모임, 캘린더, 지인) 전 24프레임 반복 — 총 89건. 

---

**RESULT: FAIL (4)**
