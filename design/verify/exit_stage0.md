# Stage 0 Exit Verification

1. brief.md 존재 + 줄 수 ≤140: PASS (138줄, wc -l 실측)
2. §1 문제 진술 3~5개: PASS (3개: A-01·A-02·A-07)
3. §2 화면 표 PRD 매핑: PASS (6행 모두 §5·F5·F6·F1·F2·F3 매핑)
4. §2b 핵심 과업 3개 + 경로: PASS (T-1·T-2·T-3 모두 시작 화면·기대 경로 있음)
5. §3 대조표 6축 전부: PASS (색온도·무드·정보밀도·형태·타이포·강조·색채도 + 부가 접근성)
6. §4 판단기준 6~12개: PASS (6개: RULE-01~06)
7. §4 각 기준 8필드: PASS (실제 9필드 모두: statement·source_quote·source_refs·axis·exception·verdict_method·borrow_scope·confidence·audit)
8. §4 각 기준 audit: PASS (6개 모두 "미실시 (0-G 대기)" 명기)
9. §4 source_quote 실존 (grep -F): PASS (R-G-03·W-2-1·R-G-01·W-1-1·R-G-02·R-G-09·R-G-06·R-G-12·A-07·A-02·A-04·A-06 모두 확인)
10. §4 verdict_method A 또는 C: PASS (RULE-01·03·04·06=A, RULE-02·05=C)
11. §6 가정 로그 1~15개: PASS (5개: A-01~A-05)
12. §7 토큰 자리 표 3~10행: PASS (4행: 진행 상태 색·회신 응답 색·경보 표면·리스트 밀도)
13. §10 PRD 반박 1~4개 + 사용자 확인: PASS (2개 P-01·P-02, 각각 A-06·A-07 원문 기재)
14. §11 적합성 단서 2~6줄: PASS (4줄: 누가 쓰는가·신뢰감 분위기·함정 3항목)
15. interview_raw.md Q/A 동수: PASS (Q-nn 9개, A-nn 9개 동수, grep 실측)

RESULT: PASS
