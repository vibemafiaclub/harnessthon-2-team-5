# scripts/fixtures — 검사기 자체 시험(계획 24) 픽스처

`bash scripts/selftest.sh` 가 읽는다. 도메인은 하네스 본 프로젝트(청첩장 모임)가 아니라 **반려동물 복약 알림**이다 — 검사기가 도메인 단어에 기대지 않는지도 같이 본다.
값은 전부 예시이며 실제 판단기준이 아니다. 골든끼리는 서로 맞물려 있다(아래 '정합' 참고) — 하나를 고치면 selftest 가 어디가 어긋났는지 항목 id 로 알려 준다.

| 파일 | 무엇 | 쓰는 검사기 | 기대 |
|---|---|---|---|
| `brief_empty.md` | `templates/brief.md` 사본(selftest 가 라이브 템플릿과 같은지 확인) | check-brief | FAIL — B-3·B-4·B-5·B-12·B-16·B-18 포함 |
| `raw_empty.md` | 태그 줄이 없는 빈 interview_raw | check-brief·check-decisions | (빈 템플릿 검사의 입력) |
| `brief_golden.md` | §1~§12 전부 채운 brief — §2 역할 열·§2c 11행·§2d·§4 plain(8 RULE)·§9·§10 추천 열·§11 수준 줄 | check-brief | 전건 PASS |
| `raw_golden.md` | Q-/A-/R-/W-/N-/F-/A-F-/H-/[CONSTRAINT]/[PATTERN]/[PRD-PUSHBACK] + 2-E `D-1`·2-H `A-20` | check-brief·check-decisions | (골든의 원문) |
| `references_golden.md` | 0-A2 수집본 — '우리 과업 T-n' 열이 있는 표(P-12 가 과업 수를 센다) + 비어 있지 않은 줄 ≥10(B-18) | check-brief·check-interview-page | |
| `prd_analysis_golden.md` | §1 화면표(첫 열 명사가 P-8 의 도메인 명사) | check-interview-page | |
| `exit_interview_page_golden.md` | 전건 PASS 인 페이지 검사 리포트(B-21 입력) | check-brief | |
| `state_full.json` | `templates/state.json`(version 2) 골격에 골든 값을 채운 것 — mode full, answered 19(= raw A 11 + R 5 + W 3), calls[] 2(= raw H- 2), delegations q12, axis_choice·draft_approval·final_ack(exceptions 1) | 모든 검사기 | |
| `interview_golden.json` / `interview_bad.json` | harness-data(질문 11·흐름 1·타일 4·쌍 4). bad 는 골든에서 Q-06 `unknown:false`·intro 금지어 1건·G-02 타일이 서체까지 같이 바꿈 | — | |
| `interview_golden.html` / `interview_bad.html` | `build-interview-fixtures.js` 가 `templates/interview_page.html` 골격에 위 JSON 을 주입해 생성. **템플릿 골격이 바뀌면 재생성**: `node scripts/fixtures/build-interview-fixtures.js` | check-interview-page | golden PASS / bad 는 P-3·P-4·P-6 만 FAIL |
| `gallery_index_golden.json` | `skipped: []`(골든은 필수 payload 8종을 다 싣는다) | check-interview-page | |
| `figma_good/` | 3단계 픽스처 한 벌 — brief(화면 2·역할 R-1/R-2)·figma.md·figma_nodes.json·tokens.json·drafts·verify(a/c_report, c_report.json, final_review, audit_*.json, shots/index.md). PNG 는 selftest 가 임시 폴더에 만든다 | check-figma·check-c-report | 전건 PASS |
| `c_report_bad.json` | `figma_good/verify/c_report.json` 에서 02 화면 `unique_element:false`(예외 승인 없음)·`score.ui:2`(fail 항목 없음) | check-c-report | CR-5·CR-6 만 FAIL |
| `forbidden_14.txt` / `forbidden_clean.txt` | 금지어 14개 각 1회 / 0건 | forbidden-words CLI | 종료 1(14건, 단어별 1회) / 종료 0 |
| `decisions_empty.md` / `decisions_golden.md` | `templates/decisions.md` 사본 / 축 1·후보 2·선택 b·승인 2화면 | check-decisions | FAIL(D-1~D-4) / PASS |
| `html_good/` / `html_bad/` | 2단계 초안(화면 2·축 후보·index·compare·stimuli) / 결함 초안(gradient·backdrop·이모지·#000·자리표시자·고아 화면·금지어 index·배율 1.25) | check-html | PASS(WARN 1) / FAIL |

## 정합(골든끼리 맞물린 값)
- `brief_golden.md` §4 source_quote ⊂ `raw_golden.md` 원문(B-9) · §2d 1순위 A-05 ⊂ raw `^A-05`(B-17) · §3 N-정보/N-색채 ⊂ raw `^N-`(B-5) · §10 사용자 위임 (A-12) ↔ state delegations q12(B-20).
- `state_full.json` answered 19 = raw `^A-nn` 11 + `^R-` 5 + `^W-n` 3(B-22) · calls[] 2 = raw `H-01`·`H-02`(B-24) · draft_approval.quote = `decisions_golden.md` 승인 원문 = raw `A-20`(D-4) · axis_choice.chosen ["b"] = decisions §2 사용자 선택(D-2) · final_ack.exceptions[0] = `figma_good/verify/c_report.json` 01_home brand_device:false(CR-6) · figma_url 파일 키 = `figma_good/figma.md`(F-1).
- `interview_golden.json` kind:pattern 3건 = `references_golden.md` 과업 {T-1,T-2,T-3}(P-12) · 타일 텍스트 '오늘 복약' ⊂ `prd_analysis_golden.md` §1 첫 열(P-8).
- `figma_good/` drafts 텍스트 = `verify/audit_screens.json` text_inventory(F-9d) · drafts data-state 수(3·4) = figma_nodes 프레임 수 = shots 7장(F-2·F-3·F-6).

## selftest 가 골든에 심는 변이(check-brief, 심은 항목만 FAIL 이어야 한다)
B-3b 1등 정보 공백 · B-3c §11 역할 R-3 추가 · B-7b confirmed 근거 1건 · B-12 추천 공백 · B-16 첫 진입 행 삭제(B-4 도 같이 FAIL — T-1 대조 대상이 사라지므로) · B-17 §2d 1행 · B-18 REF-5 삭제 · B-19 plain 금지어 · B-26 수준 공백 · B-5 N- 삭제 · B-24 kind 미허용 / calls 불일치 · B-25 [UNCLEAR] 5/9 · B-23 되묻기 3회 · B-22 answered 18 · B-21 리포트 FAIL 행.

## 환경 행
T-0(check-brief)·P-0(check-interview-page)·F-8(check-figma)은 `git diff --quiet -- templates/` 라 픽스처와 무관하게 워킹트리를 본다. templates/ 가 미커밋이면 selftest 는 이 세 행을 '환경' 으로 표시만 하고 판정에서 뺀다. 커밋 후에는 종료 코드 0 까지 요구한다.
