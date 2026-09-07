# 인터뷰 페이지 발행 전 검사 (scripts/check-interview-page.js, 골든 픽스처 — check-brief B-21 입력)

- page: scripts/fixtures/interview_golden.html · template-ref: templates/interview_page.html · mode: full
- 결과: **PASS** (15/15)

| 항목 | 결과 | 내용 | 근거 |
|---|---|---|---|
| P-0 | PASS | templates/ 무변조 | git diff --quiet -- templates/ → 0 |
| P-1 | PASS | harness-data 블록 제외 골격 바이트 동일 | 기준 templates/interview_page.html |
| P-2 | PASS | JSON 유효 · 질문 11(≤12) · 타일 4(≤24) · 쌍 4(≤6) · 흐름 1 | [0]=Q1, [1]=Q5, mode full |
| P-3 | PASS | 탈출구·장면 형식 위반 0건 (질문 11, 흐름 1) | unknown/free 전건 true |
| P-4 | PASS | 금지어 0건 · 취향형 패턴 0건 | 14개 단어 0건 |
| P-5 | PASS | 축 6개 중 자극이 아닌 축 0 | 밀도·타이포·색온도·형태·채도·강조 |
| P-6 | PASS | 축 격리 위반 0건 | 격리됨 |
| P-7 | PASS | 타일 여는 태그 수 > 6 인 타일 0건 | 타일 4장 전부 ≤6 |
| P-8 | PASS | 자리표시자·도메인 명사 위반 0건 | 타일 4장 전부 PRD 명사 포함 |
| P-9 | PASS | 대비 <4.5:1 텍스트 0건 | 전건 ≥4.5:1 |
| P-10 | PASS | skeleton·payload 위반 0건 | payload 11건 |
| P-11 | PASS | 필수 payload 8종 중 페이지에 없음 0 | 8종 전부 페이지에 있음 |
| P-12 | PASS | kind:pattern 3건 == 기대 3 | 과업: T-1, T-2, T-3 |
| P-13 | PASS | §6 full 세트 밖 skeleton 0건 | 페이지 ⊆ §6 |
| P-14 | PASS | 파일 크기 ≤200KB | wc -c |
