# 평가 기준 커버리지 감사 결과와 변경 명세 (2026-09-07)

> 워크플로 wf_4a15bf81-651 (감사 14 + 반박 14 + 비평 1). 원본 JSON: 세션 스크래치 `coverage_result.json`.
> **이 문서의 §2 규약이 구현의 단일 정본이다.** 구현 에이전트는 자기 담당 파일의 §4 계획 항목을 §2 규약대로 적용한다. 규약과 계획이 충돌하면 규약이 이긴다.

## 0. 재감사 (2026-09-07 저녁, 오너 지시 "모두 상이 되도록") — 항목별 현재 장치와 실측 상태

| 기준 | 장치(정본) | 검사기 | 실측 |
|---|---|---|---|
| I-1 완충 | 장면형 선택지·모르겠음·금지어 26·effect 한 줄·추천대로 | P-3·P-4·P-15 | 검증 3: 타이핑 0줄 3분 31초. 새 스키마 미실측 |
| I-2 시각 | 폰 프레임 갤러리·대비쌍·패턴 선택지 그림·투어 | P-5~P-9·P-16·P-17 | 폰 프레임 미실측(headless 렌더만) |
| I-3 재검증 | 진술 vs 반응·always 쌍·Q5 verifies·감사·되묻기 | P-10·B-5·B-23·0-G | 검증 3: 반응이 진술을 덮음 실측 |
| I-4 방향 | 결정형 추천 선명시(Q2·Q10·Q11·Q4')·추천 수락 구분 | P-3·B-12 | 검증 3: Q11 추천 → 사용자 B 선택 실측 |
| U-1 핵심 UX | 반박 트리거 5·핵심 과업 §2b·경로 완결 data-next | H-18·B-4·CR-7 | H-18 신설, 미실측 |
| U-2 레퍼런스 | 0-A2 직접≥3/간접≥1·과업당≥2·스크린샷 수집 | check-references R-1~R-6 | 미실측 |
| U-3 레퍼런스 피드백 | 패턴 질문 그림 + 추천 → §9 채택 | P-17·B-18 | 미실측 |
| U-4 필수 플로우 | §2c 10행(계정 진입 포함)·초대 두 행·투어 | B-16·H-12·F-2 | 검증 2: 8/10 화면(CR-1) |
| U-5 강조·수준 | 1등 정보 사슬(Q2→§2→top-info→Info/Top→1콜)·상태 순위·사용자 수준 | H-15·A-17·CR-8·B-26 | A-17 미실측 |
| U-6 질문 수준 | 3분류 호출·H 원장·상한·대신 정한 것 합본·external catch 원장 | B-24·F-12 | F-12 미실측 |
| V-1 UI 피드백 | 갤러리·대비쌍·토큰 세트·축 비교·좌우 2안 | H-13·D-1~D-5 | 검증 1·2 실측 |
| V-2 구현 검증 | A검사 22규칙·충실도 F-9·원장 F-11·mtime CR-3·메인 직접 F-6 | audit·check-figma | 검증 2: 실제 결함 4종 검출 |
| V-3 미감 | 부정형·긍정형 7항목·검출력 시험(fast 포함)·인용 대조·레퍼런스 병행 | CR-6·CR-11·CR-12 | 검증 2: 오독 1건(CR-12 가 잡는 유형) |

## 1. 커버리지 (반박 검증 후)

| 기준 | 최종 | 근거 검증 | 갭 수 |
|---|---|---|---|
| I-1 | partial | 16/39 | 15 |
| I-2 | partial | 18/24 | 11 |
| I-3 | partial | 25/31 | 19 |
| I-4 | partial | 16/26 | 15 |
| I-5 | partial | 7/33 | 14 |
| U-1 | partial | 11/22 | 15 |
| U-2 | none | 0/22 | 12 |
| U-3 | partial | 20/20 | 13 |
| U-4 | partial | 7/22 | 15 |
| U-5 | partial | 18/33 | 13 |
| U-6 | partial | 17/43 | 15 |
| V-1 | partial | 27/36 | 12 |
| V-2 | partial | 31/35 | 12 |
| V-3 | partial | 10/27 | 15 |

결과: full 0 / partial 13 / none 1 (U-2 레퍼런스 수집).

## 2. 규약 (비평가가 충돌을 정리한 결과 — 구현 정본)

### 충돌: 앵커링 방지(선택 기록 후 추천 공개 — design-tokens:64, draft-html:62, harness:109) vs I-5 '전문가로서 내가 보기에 무엇이 맞다를 먼저 명확히'. 호출 품질 게이트 ③(추천과 이유)은 선공개를 요구하고 1-C·2-E 는 후공개를 요구해 같은 문서 안에서 충돌한다. 감사·반박은 결정형/취향형 2분류만 제안했다.
**결정**: 호출을 3분류로 고정한다. ①결정형(PRD 반박·[CONSTRAINT] 충돌·BLOCKED 승격·taste_gap·상한 초과 시 진행/보정/중단): 추천을 질문 문장 안에 먼저 — '저는 A 가 맞다고 봅니다. B 가 꼭 필요할까요?' ②취향형(토큰 세트·열린 축·갤러리·초안 승인): 선택 기록 후 추천 공개(앵커링 방지 유지) ③바닥선(WCAG 대비·스케일 단조성·프레임 규격·c_checks 부정형): 묻지 않는다 — I-5 의 '반드시 물어야만 하는 것만 추린다' 는 바닥선을 묻지 않는 것으로 실현된다. design-harness/SKILL.md 호출 품질 게이트 문단에 3분류 표와 고정 메시지 골격 4줄을 넣고, interview_page pushback 은 결정형이므로 recommended 배지를 렌더한다.

### 충돌: '무엇이 좋은 디자인인가에 대한 답이 하네스에 없다'(harness:151, interview:169, design-judge:21 '취향을 발명하지 않는다') vs U-2/U-3 레퍼런스 수집 · V-3 미감 검증. 이 선언은 자기모순이다 — c_checks §1 은 15°·5개·1.5배 같은 내장 수치를, answer_translation 은 기본 번역값을, design.md §3 은 4.5:1 을 갖는다. 서브가 읽는 것은 design-judge.md:21 이므로 SKILL.md 만 고치면 judge 가 자기 규칙으로 레퍼런스 수집·패턴 근거를 거부한다.
**결정**: 세 곳을 같은 문장으로 교체한다: '없는 것은 취향의 값(색·간격·서체)이다. 값은 사용자 반응에서, 같은 과업을 실제 서비스가 어떻게 푸는가(패턴)는 0-A2 레퍼런스에서, 바닥선(접근성·규격·슬롭 패턴)은 c_checks·design.md §3 에서 온다.' design-judge.md 규칙 5 에 '`design/references.md` 와 c_checks.md 에 근거한 판정은 취향 발명이 아니다' 를 덧붙인다.

### 충돌: rule_schema.md:50-51 overfit_warning(특정 앱 유래 근거 35% 초과면 confirmed 금지) vs 레퍼런스 유래 패턴 근거. 레퍼런스를 수집해도 규칙 스키마가 그 근거를 적극 할인한다.
**결정**: overfit 분모에서 하네스 수집 레퍼런스(`REF-n` 접두)를 제외하고 사용자가 언급한 앱(Q4, borrow_scope) 만 계수한다. 레퍼런스 패턴은 §2 IA·§2b 과업·2-B 축 후보에만 흐르고 §3 시각 6축 정본에는 흐르지 않는다고 rule_schema 에 명시한다.

### 충돌: interview_prompts.md:37 '레퍼런스 앱 스크린샷을 찍어다 주세요 라고 시키는 순간 실패' 를 하네스가 '레퍼런스 자체 금지' 로 읽었다. 그러나 같은 문서 35행 오너 원문은 '네가 전부 근거 자료를 주거나 아니면 스크린샷 같은 것을 보내 주던가 해야 돼' — 하네스 측 수집을 요구하는 문장이다. 감사·반박 모두 이 원문 충돌을 짚지 않았다.
**결정**: interview_prompts.md §2 에 한 줄 추가: '→ 레퍼런스는 하네스가 수집해 장면으로 보여 준다(0-A2). 금지되는 것은 사용자에게 찾아오게 하는 것이지 레퍼런스 자체가 아니다.' 0-A2 절의 근거 인용으로 35행을 쓴다.

### 충돌: fast 본질문 상한 6(caps_fast) vs 기준 커버리지에 필요한 질문. Q4'(U-2)·Q7'(U-5)·Q10 첫 진입(U-4)·pattern ≤2(U-3)·Q11 누락형(U-1) 을 넣으면 9~11 이 된다. 게다가 full 상한도 harness:19 ≤8 / interview:12 ≤12 / state.json 8 로 불일치.
**결정**: 상한을 페이지 기준으로 재산정한다 — 검증 3 실측: 19항목 3분 31초·타이핑 0줄. full 12 / fast 10 으로 통일하고 state.json·harness:19·interview:12 를 같은 값으로. 질문 세트 정본은 interview_prompts.md §6 한 곳에만 두고 나머지 세 곳은 '§6 참조' 로 바꾼다. check-interview-page P-13 이 페이지의 skeleton 집합을 §6 정본과 대조한다.

### 충돌: '판정자는 제작 의도를 듣지 않는다'(design-judge:23, c_checks 4행, figma-build:99 2콜 화이트리스트에서 drafts 제외) vs V-2 '의도된 바와 맞게 구현됐는지'. 승인된 HTML 초안이 곧 의도인데 판정자가 볼 수 없다.
**결정**: 충실도(fidelity)는 판정이 아니라 산술이다. judge 2콜은 계속 블라인드로 두고, 승인본↔구현본 대조는 check-figma.js F-9(초안 상태 섹션의 텍스트 집합·primary-action 수·상태 수 vs Figma 프레임 텍스트·Action/Primary·프레임 수) 로 worker 가 센다. 2콜에는 초안 렌더 PNG(draft_shots) 만 '비교 대상' 으로 추가하고 decisions.md 는 여전히 주지 않는다.

### 충돌: templates/interview_page.html 마크업·스크립트 불변(D-6·D-28, SKILL:64) vs I-1·I-3·I-4·I-5·U-3 가 요구하는 템플릿 변경(고정 힌트·recommended 배지·always 쌍·skeleton/payload 필드).
**결정**: 불변은 maker 에 대한 규칙이지 커밋에 대한 규칙이 아니다. 템플릿은 이 계획의 커밋으로 한 번 바꾸고, check-interview-page P-1 은 `git show HEAD:` 골격과 비교하므로 새 골격이 자동으로 기준점이 된다. maker 브리프 문장('템플릿을 쓰기 대상으로 열지 않는다')은 그대로.

### 충돌: 제안된 brief 섹션 번호 충돌 — §2c 가 세 가지(U-1 여정 커버리지 표 / U-4 필수 플로우 커버 / U-5 상태 강조 순위), §9 는 U-2 레퍼런스.
**결정**: §2c = 사용자 여정·필수 플로우 커버리지 표(U-1 과 U-4 병합: 고정 행 = 첫 진입·온보딩 / 초대 보내기·공유 / 초대받은 쪽 첫 진입 / 역할별 랜딩 / 알림·리마인드 진입 / 설정·탈퇴 / 상태 순위표의 각 상태 / 시나리오 까다로운 상황 / 되돌리기·오류 복구; 열 = 출처(PRD-Fn·S-n·상태#·역할·P-nn) / 담당 화면 # / 없으면 사유). §2d = 상태 강조 순위(Q5 원문 ID). §9 = 레퍼런스 UX 패턴. §2 표에 '역할' 열 추가.

### 충돌: check-brief.js 신규 검사 ID 충돌 — B-16·B-17·B-18 이 I-1·I-2·I-4·U-1·U-2·U-3·U-4·U-5·U-6·V-1 열 곳에서 서로 다른 뜻으로 제안됐다.
**결정**: 단일 번호표: B-3b 1등 정보 / B-3c 역할 커버 / B-4 강화 / B-5 확장 / B-7b 근거 종류 / B-12 확장 / B-16 §2c / B-17 §2d / B-18 §9 / B-19 §4 plain / B-20 반응 하한 / B-21 exit_interview_page / B-22 answered 일치 / B-23 되묻기 / B-24 호출 원장 / B-25 답변 활용률·UNCLEAR 비율 / B-26 §11 수준. 이 표를 check-brief.js 헤더 주석과 SKILL 종료조건에 같은 순서로 쓴다.

### 충돌: raw 태그 충돌 — 되묻기 `RQ-/RA-`(I-1) vs `F-/A-F-`(U-6), 호출 원장 `H-nn`(U-6) vs `[CALL-n]`(I-5), 고지 `N-<축>`(I-4).
**결정**: `F-n`/`A-F-n`(되묻기), `H-nn [<stage>/<kind>]`(호출 원장, 4줄 골격 포함), `N-<축>`(진술≠반응 고지), `A-nn [PATTERN]`(레퍼런스 패턴 답), `REF-n`(레퍼런스 행) 로 확정. 0-D 회수 형식과 check-brief 정규식이 같은 표를 쓴다.

### 충돌: 0-A2 레퍼런스 수집 순서 — U-2 갭 12 는 '0-A 뒤면 화면 도출이 이미 끝나 늦다' 고 하면서 fix 는 0-A 뒤 별도 호출을 제안했다. U-3 는 0-A 안 9번 항목으로 제안했다(만든 쪽 ≠ 대조하는 쪽 위반).
**결정**: 0-A2 를 0-A 와 같은 메시지에 병렬 호출한다. 입력은 PRD 만(+ 웹). 과업(T-n) 매핑은 0-F 가 §9 를 채울 때, 화면 대조(screen_derivation 6b)는 0-F 브리프 화이트리스트에 references.md 를 넣어 §2 확정 시 한다. 0-A 재실행 없음.

### 충돌: V-3 제안 Q6b('회사가 정식으로 낸 앱이네 / 직접 만든 것 같지만 쓸 만하네') vs I-5·interview_prompts §1-8. 답이 뻔한 취향형 질문이다.
**결정**: 채택하지 않는다. 목표 수준은 시니어(5점) 고정(harness:11)으로 두고, 3-G ack 문구에 3축 자체 채점을 쉬운 말(1=AI 가 만든 티, 3=신입, 5=시니어)로 고지해 '이 정도면 됐다' 를 정보 있는 결정으로 만든다.

### 충돌: interview_prompts §1-4 '모르겠음 눌리면 1회 재작성, 2회차에도 눌리면 폐기' vs D-27 페이지 내 되묻기(sample) 제외. 도달 불가능한 사문이 감사에서 '있는 규칙' 으로 세어졌다.
**결정**: 규칙을 0-E 로 옮긴다: check-brief B-25 의 [UNCLEAR] 비율 ≥1/2 FAIL 시 걸린 질문만 장면을 바꿔 0-B 1회 재생성·재발행(상한 1, 되묻기 3턴과 별도). 2회차에도 UNCLEAR 면 폐기 + §6 '질문 실패' 기록. §1-4 는 '0-E 참조' 로.

### 충돌: check-html.js:42 H-4 가 `#000`·`#fff` 를 hex 검출에서 제외 vs c_checks C-8 '본문·제목에 순수 검정 실패'. 유일한 결정론 검사가 슬롭 패턴을 화이트리스트에 넣었다.
**결정**: H-4 예외는 `#fff` 만. `color:#000|#000000|black` 은 신설 H-16(C-5/C-8 grep) 에서 FAIL.

### 충돌: U-4 제안 'B-3 정규식을 X-nn/P-nn 까지 넓힘' vs 현재 정규식 `/\d|F|기능|§/` 이 이미 P-01·X-01 을 통과시킴.
**결정**: 정규식은 손대지 않고 표기법만 규정한다: brief §2 주석·screen_derivation 19행·SKILL 54·154행을 'PRD 기능 번호 또는 §10 P-nn(누락)' 으로.

### 충돌: fast C 라운드 '1 + 국소 수정 1회'(harness:26) vs U-5 최적화·V-3 direction 급 실패. direction 은 2-B 재발산이라 fast 에서 사실상 되돌릴 수 없어 보고로 끝난다.
**결정**: fast 에서도 `direction`(tasks 불가·top_info 불일치·C-2/C-4/C-5/C-7) 1건에 한해 2-B 재발산 1회 허용. 축 선택은 ai_pick 자동 채택 + delegations 기록이라 사람 개입 지점은 늘지 않는다.

### 충돌: 탈출구 4종 — 모르겠음→기본값(0-E), Q12 위임, ack 시간상한→전부 provisional 진행(interview:136), 60% 예산 자동확정(harness:45) — 이 서로 다른 곳에 있고 아무도 세지 않는다. I-1 완충으로는 옳지만 I-4·U-6 관점에서는 사용자 검증 0 으로 완주 가능한 경로다.
**결정**: 네 탈출구 전부를 `state.human_gates.delegations[]` 한 원장에 {stage, item, kind: unknown|q12|timeout|budget60, default_taken} 으로 기록하고, 0-H ack 화면에 '제가 대신 정한 것 N개' 다이제스트(§6 가정 + delegations, 쉬운 말 한 줄씩, '바꾸고 싶은 번호') 를 RULE 표 위에 붙인다. 추가 호출 0.

## 3. 개념 부재·구조적 결함 (참고)

### 개념 부재
- 레퍼런스 수집 단계 — 같은 카테고리 실제 서비스가 같은 과업을 어떻게 푸는가(패턴)를 하네스가 웹으로 수집하는 절차·파일(design/references.md)·상한(agent_references_*)·도구(judge WebSearch/WebFetch)·brief 칸(§9)·검사(B-18). 현재 0 (U-2·U-3)
- 레퍼런스에서 도출한 UX 패턴을 장면형 선택지로 사용자에게 보이는 질문 종류(kind: pattern) 와 그 답의 회수 태그(A-nn [PATTERN])·brief 소비처(§9 → §2·§2b·2-B 축) (U-3)
- '제가 대신 정한 것' 사용자 다이제스트 — §6 가정 로그·위임·시간상한·60% 자동확정으로 하네스가 대신 결정한 항목을 쉬운 말로 사용자에게 한 번 보이는 화면. 0-H 는 RULE 만 보이고 결정은 보이지 않는다 (I-5·I-4·U-6; 감사·반박 모두 누락)
- 위임·탈출구 원장(state.human_gates.delegations[]) — 모르겠음/Q12/시간상한/예산60% 네 경로를 하나로 세는 칸 (I-4·U-6)
- 사람 호출 원장(H-nn 태그 + state.human_gates.calls[]) 과 호출당 4필드 고정 골격 — '5곳 + 예외 2' 를 셀 수단 (U-6)
- 결정형/취향형/바닥선 호출 3분류 — 어떤 질문에 추천을 먼저 밝히고, 어떤 질문은 후공개하고, 어떤 것은 묻지 않는지 (I-5·U-6·V-1)
- 질문→페이로드→소비처 매핑(skeleton·payload 필드, §6 표 소비처 열) 과 사후 측정(답변 활용률·UNCLEAR 비율) (I-2)
- 필수 플로우 체크리스트 — 첫 진입·온보딩 / 초대 보내기 / 초대받은 쪽 진입 / 역할별 랜딩 / 알림 진입 / 설정·탈퇴 를 PRD 와 무관하게 대조하는 표(brief §2c)·트리거('필수 플로우 부재')·PRD 밖 화면 표기(X-nn→P-nn) (U-4·U-1)
- 사용자 수준(익숙함·연령·기기) 입력 — fast 에서 물을 확인형 Q7', brief §11 필수 줄, answer_translation 번역 행 (U-5)
- 역할별 화면·과업 추적 — brief §2 역할 열, design.md §7 역할 열, 2-G 과업×역할 추적, 인터뷰이≠최종 사용자 구분 (U-5·U-4)
- 오류(error) 상태 — c_checks C-6 에만 있고 HTML(H-6)·Figma 프레임·brief·design.md 어디에도 요구되지 않는다 (U-1)
- 승인본↔구현본 충실도 검사 — HTML 초안의 텍스트 집합·주 행동·상태 수와 Figma 프레임 대조(check-figma F-9), 승인 시점 초안 렌더 보존(draft_shots) (V-2)
- 검사기 자체의 검출력 시험 픽스처(scripts/selftest.sh) — 빈 템플릿은 FAIL, 골든 픽스처는 PASS 여야 한다. A-7 만 합성 시험이 있고 check-brief(빈 템플릿 B-4·B-12 PASS 실측)·check-html·C 판정은 검출력이 검증된 적 없다 (구조; 감사·반박 모두 누락)
- 긍정형 매력 판정의 게이트화 — c_report.json positive 7항목을 종료조건에 넣는 스크립트(check-c-report.js)와 예외 승인 칸(final_ack.exceptions) (V-3)
- 사용자에게 쉬운 말로 고지하는 3축 자체 채점(3-G ack 문구) — '이 정도면 됐다' 를 정보 있는 결정으로 (V-3)
- 3단계 사람 확인 기록 형식(final_review.md 표: 스크린샷·노드 id·본 것·PASS/FAIL, requires_human_review 항목별 행) (V-2)
- UX 흐름의 비전문가용 시각 자료(flows[]: 시나리오 아래 실제 화면 조각을 순서대로) — 다이어그램 금지가 IA 질문을 시각 자료 밖에 남겼다 (I-3)
- 2-D UI 심미 페르소나 — 채점 3축 중 UI 축만 2단계 후보 선택에서 판정되지 않는다 (V-3)
- 제작자용 미감 규칙 추출본(aesthetic_rules.md) — maker 화이트리스트에 슬롭·균일함 카탈로그가 없고 layout_rules.md 가 존재하지 않는 aesthetic-checks.md 를 가리킨다 (V-3)
- 인터뷰 페이지·비교 페이지의 발행 전 렌더 확인 — grep 은 렌더를 보장하지 않는데 사용자가 반응할 시각물을 하네스가 먼저 보지 않는다 (I-3·V-1)

### 구조적
- 문서-스크립트 드리프트: design-interview/SKILL.md:146·151 은 '아래 목록은 스크립트가 검사하는 항목' 이라 선언하지만 163행(answered 일치·갤러리 반응 ≥5 또는 Q12 위임)·164행(exit_interview_page.md 존재·PASS)은 check-brief.js 에 없다. 더해 check-brief.js 는 손대지 않은 templates/brief.md 에서 B-4·B-12 를 PASS 시킨다(실행 확인: tableRows 가 ID 셀만 있는 placeholder 행을 세고, /반박 없음/ 이 HTML 주석에 매치). I-1·I-3·U-1·U-3·U-6·V-1·I-5 7개 기준의 '스크립트 강제' 주장이 이 두 결함 위에 서 있다.
- worker(Haiku) 판정 종료조건 잔존: D-30 처방(세는 일은 스크립트)이 0단계 brief 에만 적용됐다. 0-B 인터뷰 페이지 검증 ①~⑥, 0-A 종료조건, 1단계 전 항목, 2단계 PRD 매핑·개수 대조, 3단계 6항목이 전부 worker 판정이고 D-30 은 그 판정이 3회 연속 틀렸다고 기록한다. I-1·I-3·U-4·U-6·V-1·V-2·V-3 에 걸린다.
- fast 질문 세트가 4곳 3버전(interview:12 Q5 없음 / interview:65 Q12 없음 / prompts:83·harness:19 7개, 상한 6). full 상한도 harness:19 ≤8 vs interview:12 ≤12 vs state 8. Q5(상태 순위)·Q12(위임 탈출구) 존재가 문서마다 달라 I-1·I-2·I-5·U-3·U-5·U-6 의 실제 형태가 미정.
- 금지어 grep 이 0-B 페이지 한 곳에만 있고 목록 14개를 '13개' 라 적는다(SKILL:65·79). 1-C 세트 설명·2-E 비교 페이지·0-H ack 표·3-F taste_gap·상한 초과 브리핑(C-n·A검사 번호 그대로)에는 검사가 없다. I-1·U-3·U-6·V-1.
- 심사 기본 모드(fast, harness:15-16)가 기준 커버리지를 담당하는 장치를 잘라낸다: Q4(U-2/U-3)·Q7(U-5)·Q10(U-1/U-4)·Q11b·2-G 스크린샷(V-3)·2-D(열린 축 ≤1 조건부, U-5)·ack confirmed 만(I-4)·C 1+1(U-5/V-3)·60% 자동확정(U-3). fast 캡은 D-1(에이전트 산출 폭주) 대응으로 설계됐는데 사람 쪽 커버리지까지 같이 잘랐다. 평가자가 실행할 모드에서 8개 기준의 핵심 장치가 비활성이다.
- 추천 정책 불일치: 호출 품질 게이트 ③(선공개) / 1-C·2-E(후공개) / 인터뷰 pushback·§10·screen_derivation §3(추천 없음) / 2-H '하네스 의견'(자체 점검 요약이지 입장 아님). I-5·U-6·V-1.
- 완전성의 기준 집합이 PRD 기능 번호다(screen_derivation:19, draft-html:93·108, check-brief B-3). PRD 가 침묵한 여정(온보딩·초대·오류 복구)은 매핑 검사를 100% 통과하고, 반박 질문 형태가 '문제' 형(PRD 가 이미 말한 것을 뒤집기)에 고정돼 '누락' 형을 묻는 형태가 없다. `누락` 정의(SKILL:49)는 0-A judge 화이트리스트 밖이다. U-1·U-4.
- 탈출구 4종(모르겠음→기본값·Q12 위임·ack 시간상한·60% 자동확정)이 각각 다른 문서에 있고 계수·상한·고지가 없다. 사용자 검증 0 으로 완주 가능한 경로가 규칙으로 열려 있다. I-1·I-4·U-3·U-6.
- 인터뷰이(오너)=최종 사용자 혼동: Q1·Q5 는 오너의 상황이고, 다역할 제품의 다른 역할(초대받은 쪽·참여자)의 상황·수준·진입 화면은 사람 입력 0 + 조건부 LLM 페르소나(2-D)뿐. brief §2·design.md §7 에 역할 열이 없다. U-4·U-5.
- 템플릿·상태 파일에 SKILL 이 기록을 약속한 칸이 없다: state.json 에 rule_ack·calls·delegations·final_review·draft_hash·interview.answered 없음, brief 에 plain·추천 열·§2c·§2d·§9·수준 줄 없음, c_report.json 에 top_info·fidelity·positive 7항목 없음. 칸이 없으면 스크립트가 셀 대상이 없다. I-4·I-5·U-2·U-6·V-2·V-3.
- '만든 쪽 ≠ 판정하는 쪽'·'판정자는 의도를 듣지 않는다' 원칙이 품질 판정용으로 설계됐는데 충실도(의도 대비 구현) 검사까지 막는다 — 2콜 화이트리스트에 승인 HTML 이 없다. V-2.
- 감사 산출물(proposed_fixes) 자체가 서로 충돌한다 — brief 섹션 번호(§2c ×3, §9), check-brief ID(B-16~18 ×10), raw 태그(RQ/F, H/CALL), 템플릿 불변 vs 변경, 0-A2 순서. 그대로 적용하면 서로 덮어쓴다.
- 실측 결함 4건(D-11 앱 화면으로 안 보임·D-26 주 버튼 잘림·D-33 탭바 회색 상자·D-34 두 벌 프레임)이 전부 오너의 '다른 앱과 비교' 로 잡혔다 = 레퍼런스 부재의 실측인데 결함 로그가 이를 한 뿌리로 분류하지 않아 U-2 실측이 0 으로 남는다.
- 검사기 검출력 시험이 A-7(D-15 시험 2) 뿐이다. check-brief·check-html·C 판정은 '결함 없을 때 PASS' 와 '검출 작동' 을 구분한 적 없고, 그 결과 빈 템플릿 PASS(B-4·B-12)가 커밋된 채 남았다. 하네스가 서브에 요구하는 '만든 직후 실측' 원칙이 자기 검사기에는 적용되지 않았다.

## 4. 파일별 변경 계획 (우선순위순)

### 계획 1 [P1] `scripts/check-brief.js` — tableRows·B-12·B-4 결함 수정 + B-3b/B-3c/B-5/B-7b/B-12/B-16~B-26 신설 — 기준 I-1, I-2, I-4, I-5, U-1, U-2, U-3, U-4, U-5, U-6, V-1

①tableRows 에서 채운 셀이 1개(ID)뿐인 행을 데이터 행에서 제외, sec() 는 `<!-- -->` 주석을 먼저 제거(빈 템플릿에서 B-4·B-12 PASS 나는 결함 — 실행 확인됨). ②B-3b §2 '1등 정보' 열 공백 0. B-3c §11 '누가 쓰는가' 의 역할 명사(·,/ 분리) 각각이 §2 역할 열에 ≥1. ③B-4 강화: T-1~T-3 각 행의 시작 화면·기대 경로 비어 있지 않음, T-1 시작 화면 == §2c 첫 진입 행의 화면 #. ④B-5 확장: 진술·반응 중 하나 비면 정본 열에 provisional 필수; 둘 다 있고 다르며 constraint=false 면 raw 에 `^N-<축앞2글자>`; constraint=true 면 raw 에 `[CONSTRAINT]` 와 `^N-` 둘 다. ⑤B-7b: confidence confirmed 인데 source_refs <3 또는 접두 종류(A/R/W/D/T) <2 면 FAIL. ⑥B-12 확장: 행마다 '하네스 이의·대안'·'하네스 추천'(신설 열) 비어 있지 않음, '사용자 확인 원문' 비어 있지 않거나 /사용자 위임|모르겠음/; 행 수 ≤ cap('agent_prd_pushback_max'); '반박 없음' 이면 같은 줄에 `— 사유:` 뒤 텍스트; 유형 열에 `누락` ≥1 또는 본문에 '누락 없음 — 사유'. ⑦B-16 §2c: 고정 행 전부 존재(≥9), 각 행 담당 화면 # 가 §2 번호 집합에 있거나 사유 열 비어 있지 않음; 초대·초대받은 쪽 행이 둘 다 '해당 없음' 인데 §2 역할 열 값이 2종 이상이면 FAIL. ⑧B-17 §2d 상태 순위 ≥2행, raw 에 `^A-05` 있으면 1순위 행에 A-05 참조. ⑨B-18 §9 레퍼런스: 행 수 cap('agent_references_min')~cap('agent_references_max'), 출처 열 공백 0, T-1~T-3 각각 '우리 과업' 열에 ≥1(fast)/≥2(full); `--refs` 로 design/references.md 존재·줄 수 ≥10. ⑩B-19 §4 각 RULE: `plain:` 필드 존재 또는 statement 에 forbidden-words 매치 0. ⑪B-20 raw `^R-.*(좋다|싫다)` + `^W-\d+: (left|right)` ≥5 또는 delegations 에 q12. ⑫B-21 `--page-report`(기본 design/verify/exit_interview_page.md) 존재·비어 있지 않음·`| FAIL |` 0. ⑬B-22 state.stages.interview.answered 있으면 raw A-/R-/W- 합계와 일치(없으면 N/A). ⑭B-23 `^F-` ≤3, 같은 원 질문 id ≤2. ⑮B-24 `^H-\d+` 각 블록에 '결정할 것·선택지·추천·안 정하면' 4라벨, kind ∈ {interview_page,followup,constraint,token_choice,axis_choice,draft_approval,taste_gap,cap_exceeded,repeat_brief,final_ack}, 건수 ≤ cap('human_calls_max',7). ⑯B-25 답변 활용률: raw 의 `^A-\d+` ID 가 brief §2/§3/§4/§5/§6/§9/§10 어디든 등장하는 비율 ≥2/3; `[UNCLEAR]` 수 / 본질문 수 <1/2. ⑰B-26 §11 '누가 쓰는가'·'사용자 수준·기기' 줄 공백 0. 헤더 주석에 B-번호표 전체를 적고 `require('./lib/forbidden-words')`.

### 계획 2 [P1] `scripts/lib/forbidden-words.js` — 신규 — 기준 I-1, I-2, U-3, U-6, V-1

금지어 14개(정보 밀도·위계·톤앤매너·그리드·여백·대비·무드·컨셉·미니멀·모던·레이아웃·컴포넌트·플로우·\bIA\b) 정규식 하나 + `scanText(str) → [{word, index, context}]` + `scanFile(path, {stripTags:true})` + CLI(`node scripts/lib/forbidden-words.js <file…>` 종료 코드 0/1, 매치 원문 출력). 취향형·라벨형 패턴(`느낌이 좋|어떤 느낌|선호|취향|스타일이`) 은 별도 export `TASTE_PATTERN` 으로. check-brief·check-html·check-interview-page·design-tokens 종료조건·0-H·3-F 가 전부 이 파일을 쓴다. SKILL 의 '13개' 표기를 '14개(forbidden-words.js 정본)' 로 고친다.

### 계획 3 [P1] `scripts/check-interview-page.js` — 신규 (check-brief.js 형식, 종료 코드 0/1/2) — 기준 I-1, I-2, I-3, I-5, U-2, U-3, U-6, V-1

입력 `--page design/stimuli/interview.html --template-ref HEAD:templates/interview_page.html --index design/stimuli/gallery_index.json --state design/state.json --refs design/references.md --prompts .claude/skills/design-interview/references/interview_prompts.md --out design/verify/exit_interview_page.md`. P-0 `git diff --quiet -- templates/`; P-1 HEAD 골격과 harness-data 블록 제거 후 바이트 동일; P-2 JSON 유효, questions ≤ human_interview_questions_max, questions[0].id 가 Q1 skeleton·[1] 이 Q5, tiles ≤ human_gallery_tiles_max, pairs ≤6; P-3 questions 전건 `unknown===true && free===true`, options 전건 scene ≥8자, kind:pushback 은 options 3개 + `recommended`(options.value 중 하나) + `why` 비어 있지 않음, kind:pattern 은 options ≥2; P-4 title·intro·banner·text·value·scene·tile/pair html 텍스트 노드에서 forbidden-words 매치 0 + `text`·`scene` 에 TASTE_PATTERN 0; P-5 축 차이: 타이포=font-family, 형태=border-radius, 밀도=자식 div 수, 색온도·채도=hex hue/sat, 강조=font-weight|font-size|order 가 변형 간 다름; P-6 축 격리: 같은 축 타일의 style 선언 집합에서 P-5 축 속성 제거 후 나머지 동일; P-7 타일 여는 태그 수 ≤ agent_gallery_tile_elements_max; P-8 tile 텍스트에 /lorem ipsum|홍길동|항목 \d|제목을 입력/ 0 + prd_analysis §1 화면표 1열 명사 ≥1; P-9 tile 인접 color/background hex 대비 ≥4.5:1(hex 없으면 N/A); P-10 questions 전건 `skeleton`·`payload` 존재, payload ∈ prompts §6 키 집합, 같은 payload 2건이면 FAIL; P-11 fast 필수 payload {mood_axis,state_priority,top_info,constraint,ia,pushback,delegation,audience} 중 빠진 키마다 gallery_index.json.skipped[] 에 'PRD 가 답함: <원문>' 존재; P-12 kind:pattern 수 == references.md 과업 수(fast ≤2) 또는 references.md 에 '레퍼런스 없음'; P-13 페이지 skeleton 집합 ⊆ prompts §6 fast/full 정본 세트; P-14 파일 크기 ≤ agent_gallery_html_kb_max. 리포트 표 형식.

### 계획 4 [P1] `templates/interview_page.html` — harness-data 스키마·고정 힌트·renderQuestions·undecidedPairs·샘플 데이터 — 기준 I-1, I-2, I-3, I-4, I-5, U-3

①92행 intro 아래 고정 `<p class="hint">디자인 용어를 몰라도 됩니다. 모르면 '모르겠음'을 누르세요. 답하기 싫은 항목은 건너뛰어도 됩니다.</p>`, 95행 step1 banner 앞에 고정 `<p class="hint">전부 하지 않아도 됩니다. 눈에 띄는 것부터 눌러 주세요.</p>`. ②questions[] 필수 필드 `skeleton`("Q5")·`payload`("state_priority"), pushback 에 `recommended`·`why`, 새 kind `pattern`(마크업 변경 없음). save() 레코드(172·173·175행)에 `skeleton, payload, recommended` 포함. ③170행 pushback 힌트를 '저희 추천은 표시해 두었습니다 — 실제로 쓸 때를 떠올려 다르게 보이면 골라 주세요.' 로, 172행 옵션 렌더에서 `o.value===q.recommended` 면 `<span class="rec">하네스 추천</span>` + `q.why` 한 줄. ④pairs[] 선택 플래그 `always:true`, undecidedPairs() 필터 첫 줄 `if (p.always) return true;`, 96행 힌트 '앞에서 갈리지 않았거나 한 번 더 확인할 것만 다시 묻습니다.' ⑤샘플: Q-05 options 를 장면 2개로, Q-11 에 recommended:"A"·why, 모든 샘플 질문에 skeleton·payload; G-01/G-02 를 단일축 격리로 수정(padding·font 동일, 행 수와 행 간격만 다름). ⑥`.rec` 스타일 1줄. 커밋 후 P-1 기준점은 HEAD 이므로 maker 규칙 불변.

### 계획 5 [P1] `templates/brief.md` — §2 표·§2c·§2d 신설·§4 plain·§9 신설·§10 표·§11 — 기준 I-4, I-5, U-1, U-2, U-3, U-4, U-5

①§2 헤더 `| # | 화면 | 역할 | 진입 경로 | 이 화면의 1등 정보 | PRD 기능 요구사항 매핑 |`, 주석에 'PRD 에 없는 화면은 매핑 열에 `X-nn → §10 P-nn`'. ②`## 2c. 사용자 여정·필수 플로우 커버리지` 표 `| 여정 항목 | 출처(PRD-Fn / S-n / 상태 #n / 역할 R-n / 누락 P-nn) | 담당 화면 # | 없으면 사유 |` 고정 행 9: 첫 진입·온보딩(등록 0건) / 초대 보내기·공유 / 초대받은 쪽 첫 진입(미가입·링크) / 역할별 랜딩(역할마다 1행) / 알림·리마인드 진입 / 설정·탈퇴 / 상태 순위표의 각 상태(상태마다 1행) / 시나리오의 까다로운 상황(시나리오마다 1행) / 되돌리기·오류 복구. ③`## 2d. 상태 강조 순위` 표 `| 순위 | 상태 | 할 일 있음 | 손실 크기(Q5 원문 ID) | 시각 처리(강조/대기/약화) |`. ④§4 RULE 블록에 `- plain: `(디자인 용어 없는 한 줄, 0-H 표가 이것을 보인다) 추가, 예시에도. ⑤`## 9. 레퍼런스 UX 패턴 (0-A2 수집본)` 표 `| REF-n | 서비스 | 화면 | 우리 과업 T-n | 처리 방식(진입·1등 정보·상태·빈 상태) | 출처 | 사용자 반응(A-nn [PATTERN]) | 채택/보류 |` + 주석 '색·로고·카피 금지, 출처 없는 행 무효, 서비스명은 사용자 노출 금지'. ⑥§10 헤더 `| # | PRD 항목 | 유형(문제/누락/과잉) | 하네스 이의·대안 | 하네스 추천 | 사용자 확인 원문 | 결정 |`, 주석 '추천 = A/B 중 하나 + 이유, 비면 FAIL; 확인 원문은 raw 인용 또는 `사용자 위임`/`모르겠음`'. ⑦§11 에 `- 사용자 수준·기기(Q7 원문 또는 PRD 인용 — 익숙함: 처음/가끔/매일 · 기기: 폰/PC): ` 추가, '같은 카테고리…' 줄을 `(§9 REF 번호로 인용)` 로.

### 계획 6 [P1] `templates/state.json` — human_gates·stages·caps — 기준 I-3, I-4, U-2, U-3, U-6, V-2, V-3

①human_gates 에 `rule_ack: {acked:false, at:"", quote:"", fixes:[]}`, `calls: []`({stage,kind,ts}), `delegations: []`({stage,item,kind:"unknown|q12|timeout|budget60",default_taken,ts}), token_set_choice·axis_choice 에 `delegated:false`, draft_approval 에 `draft_hash`·`screen_count`, final_ack 에 `exceptions: []`·`level_ack: ""`, `final_review: {file:""}`. ②stages.interview 에 `answered: 0`. ③caps/caps_fast: `human_interview_questions_max` 12/10, `human_worldcup_rounds_max` 6/6(always 4 + 미결 ≤2), `human_calls_max` 7/7, `agent_references_min` 8/4, `agent_references_max` 16/8, `agent_references_lines_max` 80/40, `agent_reference_patterns_max` 6/3, `agent_flow_steps_max` 4/3. _note 에 '레퍼런스는 패턴만, 값은 사용자 반응' 한 줄.

### 계획 7 [P1] `.claude/skills/design-interview/SKILL.md` — 0-A2 레퍼런스 수집 (신설, 0-A 와 병렬) — 기준 U-2, U-3, U-1

`## 0-A2. 레퍼런스 수집 (design-judge, 0-A 와 같은 메시지에 병렬 호출)` 신설. 브리프: 입력 화이트리스트 = PRD 경로 + WebSearch/WebFetch 허용(브리프에 '레퍼런스 수집 위임' 명시). 출력 `design/references.md`. 요구 산출: 표 `| REF-n | 서비스 | 화면 | PRD 유저스토리 동사(등록·제안·확정…) | 처리 방식(진입·1등 정보·상태 표현·빈 상태) | 출처(URL 또는 앱명+화면명) | 차용(패턴만) |`, 같은 카테고리 ≥3 + 인접 카테고리 ≥1, 유저스토리 동사마다 ≥2 서비스. 상한 문장 '행 {agent_references_min}~{agent_references_max}, 전체 ≤{agent_references_lines_max}줄'. 금지: 색 hex·로고·카피 기록, 서비스명 사용자 노출. 0건이면 '레퍼런스 없음 — 사유'. 종료조건(worker 실행): 표 존재·행 수 범위·출처 열 공백 0·`node scripts/lib/forbidden-words.js design/references.md` 는 처리 방식 열에만 적용. 근거 인용: interview_prompts §2 원문 35행('네가 전부 근거 자료를 주거나 스크린샷을 보내 주던가'). 0-F 화이트리스트에 `design/references.md` 추가(§9 채우기 + screen_derivation 6b 대조). 0-B 화이트리스트에도 추가(pattern 질문 생성).

### 계획 8 [P1] `.claude/agents/design-judge.md` — tools·불변 규칙 0c·규칙 5 — 기준 U-2, U-3, V-3

①6행 tools 에 `WebSearch, WebFetch` 추가. ②규칙 0 아래 `0c. web 도구는 브리프가 '레퍼런스 수집' 으로 명시한 위임에서만 쓴다. 검색·열람 결과는 출처와 함께 출력 파일에만 적고 색 hex·로고·카피는 옮기지 않는다. 그 외 위임에서 web 을 열면 화이트리스트 위반이다.` ③규칙 5 끝에 '`design/references.md`(0-A2 수집 패턴)·c_checks.md·design.md §3 에 근거한 판정은 취향 발명이 아니다. 발명은 이 세 곳 어디에도 없는 기준으로 탈락시키는 것이다.' 추가.

### 계획 9 [P1] `.claude/skills/design-harness/SKILL.md` — 호출 품질 게이트·사람 개입 지점·예산표·단계 표·'이 하네스에 없는 것' — 기준 I-5, U-2, U-3, U-5, U-6, V-1, V-3

①'호출 품질 게이트' 문단 뒤에 3분류 표: 결정형(PRD 반박·[CONSTRAINT] 충돌·BLOCKED 승격·taste_gap·상한 초과 진행/보정/중단) = 추천을 질문 문장 안에 먼저 / 취향형(토큰 세트·열린 축·갤러리·초안 승인) = 선택 기록 후 추천 공개 / 바닥선(WCAG·단조성·규격·c_checks 부정형) = 묻지 않는다. 고정 메시지 골격 코드블록 4줄: '결정할 것: / 선택지: ① ② (하네스 추천: ①) / 추천 이유: / 안 정하면:'. '사용자를 부르기 전에 `interview_raw.md` 에 `H-nn [<stage>/<kind>]` + 4줄을 append 하고 state.human_gates.calls[] 에 기록. kind 허용 목록 11종(정본 check-brief KINDS). check-brief B-24 가 센다 — 이것이 "그 외에 부르면 결함" 의 판정 수단.' ②게이트 미충족 BLOCKED: '4항을 못 채우는 BLOCKED 는 보내지 않는다. 메인이 가장 보수적 기본값으로 `ASSUMPTION:` 강등 + delegations 기록 + brief §6 후 재호출.' ③45행 60% 자동확정에 'delegations[] 에 kind budget60 으로 기록' 추가. ④19행 인터뷰 행을 '≤12 / ≤10 — 세트 정본은 interview_prompts.md §6' 으로, 21행 월드컵 fast 를 'always 축(진술 질문 없는 4축) 각 1쌍 + 갈리지 않은 축 ≤2, 합계 ≤6' 으로, 예산표에 `0-A2 references.md 행/전체 | 8~16 / ≤80줄 | 4~8 / ≤40줄`·`0-B 흐름 조각 | ≤4 | ≤3` 행 추가. ⑤단계 표 종료조건 칸을 '0: check-interview-page.js(발행 전)+check-brief.js / 1: 종료조건 grep 목록 / 2: check-html.js / 3: check-figma.js+check-c-report.js — worker 는 실행만' 으로. ⑥사람 개입 #2 형식 칸에 '진술≠반응 고지·"제가 대신 정한 것" 다이제스트는 0-H 한 화면에 포함(추가 호출 아님)'. ⑦'이 하네스에 없는 것' 을 '없는 것은 취향의 값(색·간격·서체)이다. 값은 사용자 반응에서, 패턴(같은 과업을 실제 서비스가 어떻게 푸는가)은 0-A2 레퍼런스에서, 바닥선(접근성·규격·슬롭)은 c_checks·design.md §3 에서 온다. 미리 채우면 안 되는 것은 값뿐이다.' 로 교체. ⑧실패 라우팅에 'fast 에서도 direction 1건은 2-B 재발산 1회 허용(ai_pick 자동 채택, delegations 기록)'.

### 계획 10 [P1] `.claude/skills/design-interview/references/interview_prompts.md` — §1 규칙·§2·§6 표·fast 세트 정본 — 기준 I-1, I-2, I-5, U-1, U-2, U-3, U-4, U-5

①§1-4 를 '모르겠음은 1급 옵션. 눌리면 질문이 나쁜 것. 재작성·폐기 절차는 SKILL 0-E(B-25) 참조' 로. §1-10 신설 '열린 결정 질문 금지 — 무엇을 넣을까요/몇 개/어떻게 보이면 좋을까요 형 폐기. 하네스가 의견을 가진 항목은 저는 X 가 맞다고 봅니다 — 이유. 그래도 Y 가 필요한 상황이 있을까요? 형.' §1-6 '13개' → '14개(scripts/lib/forbidden-words.js 정본)'. ②§2 에 '→ 레퍼런스는 하네스가 수집해 장면으로 보여 준다(0-A2). 금지는 사용자에게 찾아오게 하는 것이지 레퍼런스가 아니다.' ③§6 표에 열 2개 추가 `payload`(mood_axis·top_info·density_axis·borrow_scope·state_priority·dislike_list·expression_axis·constraint·audience·ia·edge_state·pushback·open_item·delegation·pattern) 와 `이 답이 없으면 막히는 것`(소비처). 표 위 규칙 '질문 1개 = 소비처 1개 이상, 같은 payload 두 질문이면 하나 삭제'. Q7 에 fast 확인형 장면 2×2('처음 써 보는 사람이 대부분 — 어른도 열어 봐요 / 매일 여는 사람' · '주로 폰 한 손 / 주로 PC'). Q10 에 '`누락` 유형은 PRD 에는 없지만 실제로 쓰다 보면 Y 를 해야 할 때가 올 것 같아요. 그 화면을 넣을까요, 없어도 될까요? 형'. Q11 형태를 'PRD 에는 X 인데 실제로는 Y 한 상황이 생깁니다. **저는 Z 가 낫다고 봅니다 — 이유.** 그래도 PRD 대로가 나은 경우가 있을까요? (Z / PRD대로 / 모르겠음)' + 태그 recommended. Q8 에 '시나리오 1 은 첫 진입(등록 0건)에서 시작, 역할 둘 이상이면 초대받은 쪽이 링크를 여는 장면 포함'. Q4' 축약형과 kind:pattern 행(references.md 과업마다 장면형 2~3택, 서비스명 숨김) 추가. ④§6 fast 세트를 **유일한 정본**으로: 'Q1 → Q5 → Q2 → pattern(≤2, references.md 있을 때; 없으면 Q4') → Q6 → Q7'(확인형) → Q8 → Q11(누락 1 + 문제 1, 추천 포함) → Q12 — 상한 10(caps_fast), PRD 가 답한 것은 확인형. 다른 문서는 이 절을 참조만 한다.'

### 계획 11 [P1] `.claude/skills/design-interview/SKILL.md` — 0-B·0-C·0-D·0-E·0-H·종료조건·12행·169행 — 기준 I-1, I-2, I-3, I-4, I-5, U-3, U-5, U-6, V-1

①12행 상한을 'full 12 / fast 10, 세트는 interview_prompts §6 정본' 으로, 65행 끝 'fast 는 …' 삭제 → '§6 참조'. 65행에 'questions[] 전건 skeleton·payload 필수, pushback 은 recommended·why 필수(0-A §6 추천을 그대로), kind:pattern 은 references.md 과업마다 1개(fast ≤2), unknown·free·scene 누락은 check-interview-page P-3 FAIL'. 76행 pairs 에 '진술형 질문 없는 4축(형태·타이포·강조·채도)은 `always:true`'. 77행 banner '사전 고정' 삭제(고정 힌트는 골격에 있음). ②79행 검증 문단을 `node scripts/check-interview-page.js …` 한 줄 + 'worker 는 실행만, 종료 코드 0 통과, FAIL 은 해당 타일·질문만 maker 재생성 1회' 로 교체. ③0-C 에 2번 삽입 '메인이 발행 페이지 2단계(골라 보기)를 직접 연다 — aside-browser 가능 시 `design/verify/shots/interview_gallery.png` 저장 후 Read, 불가 시 브라우저. 타일 전부 렌더·축 라벨 비노출 확인 기록 없이 링크를 보내지 않는다.' ④0-D 회수 형식: `Q-nn [<skeleton>/<payload>]: <question>`, pushback `A-nn [PRD-PUSHBACK]: <선택> (추천 <recommended>) — "<free>"`, pattern `A-nn [PATTERN]: <value> — "<free>"`, 되묻기 `F-n: <원문>` / `A-F-n: <답>`, 고지 `N-<축>: 고지 — "말씀은 A, 고르신 건 B → B" / 답`, 호출 `H-nn [<stage>/<kind>]` + 4줄. state.stages.interview.answered 기록. ⑤0-E: 'F- 총 ≤3, 같은 원 질문 ≤2. B-25 UNCLEAR 비율 FAIL 시 걸린 질문만 장면 바꿔 0-B 1회 재생성·재발행(상한 1), 2회차도 UNCLEAR 면 폐기 + §6 질문 실패. Q12 답에서 위임 범위 추출 → delegations[] + token_set_choice/axis_choice.delegated. 모르겠음→기본값은 delegations kind unknown.' ⑥0-H 를 한 화면 세 블록으로: (a) "제가 대신 정한 것 N개" — §6 가정 + delegations 를 쉬운 말 한 줄씩, (b) §3 진술≠반응 축만 `축 | 말씀하신 것 | 고르신 것 | 저희가 잡은 것`, (c) RULE 전량표는 statement 대신 `plain` 열. 질문 하나 '바꾸고 싶은 번호 또는 없음'. 표를 보이기 전 `node scripts/lib/forbidden-words.js` 로 (a)(b)(c) 텍스트 grep 0건, 답은 raw `N-`·`H-` 로, state.rule_ack 기록. 시간상한 시 provisional 진행도 delegations kind timeout. ⑦종료조건 목록을 check-brief B-번호표(T-0, B-1~B-15, B-3b/3c/5/7b/12 확장, B-16~B-26) 순서로 재작성. ⑧169행을 harness 와 같은 '값/패턴/바닥선' 문장으로. ⑨0-A 종료조건에 '§6 물을 쉬운 말 전건 forbidden-words 0건 + 추천·이유 존재', 0-B 브리프에 '0-A §6 의 물을 쉬운 말과 추천을 그대로 text·recommended 로 쓴다(다시 쓰지 않는다)'.

### 계획 12 [P1] `.claude/skills/design-interview/SKILL.md` — 0-A 요구 산출·종료조건 — 기준 I-5, U-1, U-4, U-5

①항목 1 끝에 '상태 순위표(`| 상태 | 할 일 있음 | 손실 크기 | 강조 순위 | 담당 화면 후보 |`)와 역할별 진입표(`| 역할 | 진입 화면 | 첫 화면 1등 정보 |`)는 독립 표. 1순위는 `[HYPOTHESIS]`'. ②항목 2 에 '시나리오 1 은 등록 0건 첫 진입에서 시작, 역할 둘 이상이면 시나리오 1개는 초대받은 쪽 시점'. ③항목 6 을 '항목마다 PRD 원문 + 대안 2개 + **하네스 추천 1개(A/B) + 이유 한 줄** + 추천을 포함한 물을 쉬운 말(디자인 용어 없이). `누락` 유형 최소 1건 검토 — 없으면 "누락 없음 — 사유". fast 의 Q11 2건 중 1건은 누락 우선.' ④항목 9 신설 '**필수 플로우 대조표** — screen_derivation 8단계 6항목 각각 화면 # 또는 "해당 없음 — 사유". 사용자가 둘 이상인 PRD 에서 초대·초대받은 쪽이 해당 없음이면 FAIL.' ⑤종료조건(54행)에 '반박 항목마다 추천·이유 존재, 필수 플로우 대조표 6행, 상태 순위표 ≥2행' 추가, '화면 표의 모든 행에 PRD 기능 번호 매핑' 을 'PRD 기능 번호 또는 §10 P-nn' 으로.

### 계획 13 [P1] `.claude/skills/design-interview/references/screen_derivation.md` — §1 8단계·6b·19행·§2 트리거·§3 절차·유형 정의 — 기준 I-5, U-1, U-2, U-4

①§1 에 '6b. **레퍼런스 대조.** `design/references.md` 가 입력에 있으면 화면마다 같은 1차 목적의 REF 행을 ≥1 짝짓고 진입·1등 정보·상태 표현이 다른 곳을 한 줄로. 이유 없이 다른 것이 신호 — [PRD 반박 트리거 후보]' 와 '8. **필수 플로우 대조.** PRD 와 무관하게 (a)첫 진입·온보딩 (b)초대 보내기·공유(사용자 둘 이상이면 필수) (c)초대받은 쪽 첫 진입(미가입·링크) (d)역할별 랜딩 (e)알림·리마인드 진입 (f)설정·탈퇴 마다 화면 있음(#) 또는 해당 없음 — 사유. PRD 에 없으면 §2 에 `X-nn` 화면 + §10 `누락`.' ②19행을 'PRD 번호가 안 붙는 화면은 §10 누락 번호(P-nn)를 대신 붙인다' 로. ③§2 트리거 5행 '**필수 플로우 부재** — 8단계 항목이 PRD 에도 화면표에도 없다'. 트리거 표 아래에 유형 정의 3줄(문제/누락/과잉 — SKILL 49행 그대로) 복사(judge 화이트리스트가 이 파일뿐). ④§3 3번 '물을 쉬운 말에 하네스 추천을 포함한다(저는 A 가 낫다고 봅니다. B 가 꼭 필요한 상황이 있을까요?). 추천 없는 양자택일은 결정 위임.' 4번 '사용자는 추천에 동의하거나 다른 쪽을 고른다. 미응답·모르겠음은 추천 채택 + §6 사용자 위임.'

### 계획 14 [P1] `.claude/skills/design-interview/references/rule_schema.md` — confidence 판정·충돌 처리 표·과적합 경고 — 기준 I-4, U-2, U-3

①24행 confirmed 를 'source_refs ≥3 **이고 근거 종류 ≥2(A-/R-/W-/D-/T- 접두 중 둘 이상)**, 전부 명시 반응, audit=entailed' 로. ②충돌 표에 행 추가 '진술 0건(질문 없는 축) | 반응만으로 정본. always 대비쌍 반응이 타일 반응과 같을 때만 confirmed, 다르면 provisional + 0-H 고지(N-)'. 33행 고지를 '0-H (b) 표에서 1회, raw `N-<축>` 기록' 으로 자리 지정. ③과적합 경고: '분모·분자는 사용자가 언급한 앱 유래 근거(Q4·borrow_scope)만. 하네스 수집 레퍼런스(`REF-n`)는 계수하지 않는다 — 패턴은 §2 IA·§2b 과업·2-B 축 후보에만 흐르고 §3 시각 6축 정본의 근거가 되지 않는다.' ④필드 표에 `plain`(✓, 디자인 용어 없는 한 줄 — 0-H 표시용, B-19) 추가.

### 계획 15 [P2] `scripts/check-html.js` — H-4 수정 + H-11~H-17 신설 + glob 확장 + --brief — 기준 U-1, U-4, U-5, U-6, V-1, V-3

①H-4 예외를 `#fff` 만으로(`#000` 은 H-16). ②`--brief design/brief.md` 옵션. H-11 PRD 매핑: §2 마지막 열 `F\d+|P-\d+` 수집, 각 번호의 담당 행 번호에 대응하는 `screen_<nn>_*.html` 존재. H-12 §2c 담당 화면 # 각각 파일 존재(사유 행은 WARN). ③H-13 `compare_axis*.html`·`index.html`·`design_guide_compare.html`(`--stimuli` 옵션) 사용자 노출 텍스트 forbidden-words 0건(glob 에 compare_axis*·index 추가). H-14 index.html `<a href="screen_` 수 == screen 파일 수. ④H-15 각 screen_* 에 `data-role="top-info"` 정확히 1개, `data-fold` 이전 또는 `data-fixed` 안, font-size 가 `--typography-scale-(heading|display)-` 참조. ⑤H-16 C-5/C-8 grep: `linear-gradient|radial-gradient` 배경 WARN(hue 2종 이상 FAIL), `backdrop-filter` FAIL, `aria-hidden` 밖 \p{Extended_Pictographic} FAIL, `color:\s*(#000|#000000|black)` FAIL, box-shadow 값 1종인데 .card 류 ≥3 WARN, `repeat\(3` WARN. H-17 tokens.css `--typography-scale-heading-1-size / --typography-scale-body-size` ≥1.5. ⑥헤더 주석 갱신. `require('./lib/forbidden-words')`.

### 계획 16 [P2] `.claude/skills/design-draft-html/SKILL.md` — 2-B·2-D·2-E·2-F·2-G·2-H·종료조건·10행 화이트리스트 — 기준 U-2, U-3, U-4, U-5, U-6, V-1, V-3

①10행·43행·73행 maker 화이트리스트에 `references/aesthetic_rules.md` 추가. ②2-B(36행) 끝에 'brief §9 에서 같은 과업을 다르게 푼 REF 가 있으면 그 갈림이 우선 후보 축, 양극단에 REF 번호 병기(패턴 이름만). §9 사용자 반응 ID 가 있는 과업의 축은 이미 좁혀진 것이므로 열지 않는다.' ③2-D: 화이트리스트에 `design/brief.md §9` 추가, 페르소나 2 문장을 'design.md §8 + brief §9 REF 대비 실제 서비스처럼 보이는가' 로, 페르소나 4 '**UI 심미** — aesthetic_rules C-5·C-7·C-8 해당 여부 + 긍정형 7항목 중 있는 것; aside-browser 가능 시 스크린샷, 불가 시 소스 grep 항목만 + C_NOT_RUN' 추가(3→4 고정). ④2-E: 1항 뒤 'open 전 worker 확인 — compare_axis 에 후보 2개 경로 포함(grep)·H-13 0건, FAIL 이면 열지 않는다'. 2항 질문을 "왼쪽/오른쪽 중 어느 쪽이 더 쓰기 편해 보이나요? 보이는 느낌도 한 줄(선택)" 로 고정하고 축 이름·축 값 비노출 명시. 첫 줄에 'state axis_choice.delegated 면 ai_pick 자동 채택 + 고지, raw 에 사용자 위임'. ⑤2-F: 73행 '흐름표에 있으면' 을 'brief §2c 담당 화면 전부를 PRD 기능 화면과 같은 등급으로 만든다' 로. 74행 상태에 `error` 추가(오류: 무엇이 잘못됐고 무엇을 하면 되는지). 규칙 '1등 정보 요소에 `data-role="top-info"`'. fast 에서도 화면당 normal 1장을 `design/verify/draft_shots/<nn>.png` 로(불가 시 `NOT_CAPTURED`). ⑥2-G: 89행 검사 목록에 H-11~H-17 병기, 명령에 `--brief`. 91행 fast 를 '대표 화면 1장(brief §2 첫 화면 normal) 스크린샷을 열어 C-5·C-7 점검, 나머지 생략' 으로. 92행을 '§7 과업 3개 × **역할마다**(PRD 역할 ≥2 면 둘 다) 추적, `불가` FAIL, `헤맴` 은 maker 1회 수정 후 재추적, 재추적 헤맴도 FAIL' 로. 93행 ②를 `check-html.js --brief` H-11·H-12 로 대체. ⑦2-H 3항 '하네스 의견' 을 '이 초안이 맞다/틀리다 입장 1줄 + 자체 점검 요약' 으로, 호출 전 `H-nn [draft/draft_approval]` 기록. ⑧종료조건: H-6 에 error 포함, 'index.html 존재·링크 수 == 화면 수(H-14)', '과업 × 역할 전부 찾음', '§2 각 축에 D-<축> raw ID 또는 사용자 위임' 을 `node scripts/check-decisions.js`(priority 3) 또는 grep 으로.

### 계획 17 [P2] `.claude/skills/design-draft-html/references/aesthetic_rules.md` — 신규 (maker 용, ≤60줄) + layout_rules.md 4행 경로 정정 — 기준 V-3

첫 줄 '판정 기준 정본은 c_checks.md. 이 파일은 제작 측 추출본.' C-5 슬롭 11항목·C-7 균일함 5신호·C-8 시각 교정 6항목을 '하지 말 것' 으로, 긍정형 7항목을 '화면마다 ≥1 넣을 것' 으로, 항목마다 tokens.json 토큰 이름으로 쓰는 해법 한 줄(카드 균일 → elevation.scale.sm/md 중요도별, 제목/본문 ≥1.5배 → typography.scale.heading-1 vs body, 아이콘 뒤 상자 없음 → 컨테이너 fill none). layout_rules.md 4행의 `aesthetic-checks.md` 를 `aesthetic_rules.md` 로 정정.

### 계획 18 [P2] `.claude/skills/design-tokens/SKILL.md` — 1-A·1-B·1-C·1-D·종료조건 — 기준 U-5, U-6, V-1, V-3

①1-A 에 마크업 규칙 '`design_guide_compare.html` 은 세트마다 `<section data-set="SET-X">` 안에 `<p class="set-desc">` 와 `<div data-section="apply">`'. ②1-B 에 미감 정합 3항(세트 노출 전, 미달 세트 비노출): text.primary/secondary 해석값 ≠ #000000 · neutral.900 ≠ #000000(C-8) / neutral 50~900 채도 전부 0 또는 전부 >0(C-1) / elevation sm<md<lg blur·opacity 단조 증가(C-5). ③1-C 첫 줄 'state token_set_choice.delegated 면 ai_pick 자동 채택 + "이렇게 골랐다" 고지, raw `사용자 위임`'. 지시문 뒤 '둘 다 아님 재생성 브리프에도 금지어 조건'. 호출 전 `H-nn [tokens/token_choice]`. ④종료조건 추가: `design_guide_compare.html` 존재·`data-set=` 수 == human_token_sets·각 세트 `data-section="apply"` / `.set-desc`·title 에 forbidden-words 0(명령 원문) / token_sets.json 세트 쌍마다 typography.family.body·color.primitive.primary.500·radius.usage.card·spacing.unit 중 ≥2 다름(같으면 '세트 체감 동일' FAIL) / raw `^T-01` + 이유 원문 / design.md §5 행 수 == brief §2 화면 수, 1등 정보 셀 공백 0 / 미감 정합 3항 PASS. 결과 `design/verify/exit_stage1.md`.

### 계획 19 [P2] `.claude/skills/design-interview/references/answer_translation.md` — 표 행 추가 — 기준 U-3, U-5

수준 행 2개: `| "처음 쓰는 사람이 많아요" / "어른도 봐요" | 아이콘만 있는 조작 0(라벨 병기), 첫 화면·빈 상태에 다음 행동 문구 필수, 본문 ≥16px | A+C |`, `| "매일 쓰는 사람이 많아요" | 첫 화면 = 할 일 우선(2-B 진입 방식 축 고정), 목록 밀도 상향 허용 | C |`. 레퍼런스 행 1개: `| pattern 질문에서 장면 X 선택 | §2 해당 화면의 진입·1등 정보·상태 표현을 REF-n 처리 방식으로, §9 채택 열 기록. 시각 6축 정본에는 영향 없음 | — |`.

### 계획 20 [P2] `scripts/check-c-report.js` — 신규 (check-brief 형식, 종료 코드 0/1/2) — 기준 U-5, V-2, V-3

`--report design/verify/c_report.json --shots design/verify/shots/index.md --state design/state.json --brief design/brief.md --out design/verify/exit_stage3_c.md`. CR-1 JSON 유효, screens ≥ brief §2 화면 수 / CR-2 각 screen ran===true, screenshots == 상태 수(normal·empty·long[·loading·error]) / CR-3 shots/index.md 캡처 시각 ≥ Figma lastModified / CR-4 verdict fail 전건에 diagnosis∈{local,direction,taste_gap,repeat}·elements·evidence 비어 있지 않음 / CR-5 score.ui|ux|fit <3 이면 그 축 매핑 검사(ui=C-1·C-3·C-7·C-8·C-5, ux=C-2·C-4·C-6·tasks, fit=positive.unique_element·brand_device) 중 fail ≥1 / CR-6 positive 7키(unique_element, dominant_number, form_differs_by_kind, surface_layers, brand_device, visual_elements_justified, looks_professional) 전부 boolean, false 는 state.final_ack.exceptions 에 화면·항목·사용자 원문 존재 / CR-7 tasks[] 전 화면·전 역할 `불가` 0·`헤맴` ≤1 / CR-8 top_info.match==true 전 화면 / CR-9 diagnosis repeat 이면 state.c_fail_reasons 에 동일 사유 / CR-10 화면마다 SLOP-SWEEP 항목 존재.

### 계획 21 [P2] `scripts/check-figma.js` — 신규 (3단계 종료조건 결정론 검사기) — 기준 V-2, V-3

`--figma design/figma.md --state design/state.json --nodes design/figma_nodes.json --brief design/brief.md --drafts design/drafts --audit design/verify/audit_screens.json,design/verify/audit_components.json --shots design/verify/shots/final --review design/verify/final_review.md --out design/verify/exit_stage3.md`. F-1 figma.md 링크 == state.figma_url / F-2 figma_nodes.json 유효·3섹션·screens 수 == brief §2 행 × 상태 수 / F-3 shots/final PNG 수 == 같은 수 / F-4 audit 병합 passed_machine / F-5 requires_human_review 항목마다 final_review.md 행 존재 / F-6 final_review.md 행 수 == PNG 수 / F-7 state.final_ack.approved / F-8 `git diff --quiet -- templates/` / F-9 충실도(가능한 범위): drafts 각 screen 의 data-state 섹션 수 == 프레임 수, `data-role="primary-action"` 수 == audit 반환의 `Action/Primary` 수, tokens.json leaf 수 == figma_nodes.variables 수; 번들이 text_inventory 를 반환하면(priority 3) 텍스트 집합 일치율 ≥90% 추가. F-10 `check-c-report.js` 종료 코드 0.

### 계획 22 [P2] `.claude/skills/design-figma-build/SKILL.md` — 3-A·3-D·3-E·3-F·3-G·종료조건 — 기준 U-5, U-6, V-1, V-2, V-3

①35행 '바인딩·리터럴 일치를 A검사 1 이 본다' 를 'audit-core 는 리터럴∈팔레트와 바인딩 존재를 따로 본다 — 리터럴=변수값 대조는 미구현이라 3-A 직후 스크린샷 렌더가 유일한 방어' 로 정정. ②3-D 보완 항목에 15. 승인본 대조(check-figma F-9), 16. 흐름 연결(brief §2 진입 경로 vs reactions — 번들 text_inventory/reactions 반환 후 활성, 전까지 N/A 표기). ③3-E 2콜 화이트리스트에 `design/verify/draft_shots/*.png`(비교 대상, decisions.md 는 여전히 제외). c_report.json 스키마: positive 를 c_checks §2 의 7키로, screens[] 에 `top_info:{declared, blind_first, match, diagnosis}`·`fidelity:{elements_match, primary_position_match}`, tasks[] 에 `role`. 절차 ③ 뒤 '긍정형 false 는 taste_gap(§10 브랜드 장치 미기입) 또는 direction 으로 checks[] fail'. 자체 채점 문장 뒤 'score<3 은 check-c-report CR-5 가 센다'. ④3-F taste_gap 행: '최신 스크린샷(index.md 기록, lastModified 이후) 첨부 필수. 가능하면 maker 가 그 속성만 다른 2안 → worker 좌/우 PNG → "어느 쪽이 더 편한가요? 둘 다 아니어도 됩니다". 문구 forbidden-words 0. raw `W-C-<n>: <left|right|none> — 이유`. 스크린샷 없는 taste_gap 은 게이트 미통과.' 라우팅 표에 'fast 에서 direction 1건은 2-B 재발산 1회'. 상한 초과 브리핑(139행)에 'FAIL 목록은 C-n·A검사 번호를 쉬운 말 한 줄로 바꿔 보인다(0-H 병기 규칙과 동일)'. ⑤3-G 1항 형식 고정: `design/verify/final_review.md` 표 `| 파일명 | 노드 id | 본 것(아이콘/잘림/상태칩/규격/겹침) | PASS·FAIL |` 스크린샷마다 1행, requires_human_review 규칙마다 `| 규칙 id | 확인 방법 | 결과 |` 1행, state.final_review.file. 3항 문구를 '링크 + A 검사 N/N + 보기 좋음/쓰기 쉬움/이 서비스다움 각 1·3·5 를 쉬운 말로(1=AI 가 만든 티, 3=신입, 5=시니어) + 3 미만 축 FAIL 요약 1줄씩 + 남은 것 M개 + 더 다듬을 때 예상 소요' + 호출 골격 4항, 답을 final_ack.level_ack 에. 호출 전 `H-nn [figma/final_ack]`. ⑥종료조건 절을 `node scripts/check-figma.js …` 한 줄 + 'worker 는 실행만' 으로 교체.

### 계획 23 [P2] `.claude/skills/design-figma-build/references/c_checks.md` — C-6·C-10 신설·§2·§3 매핑 — 기준 U-1, U-4, U-5, V-3

①C-6 에 '- [ ] 첫 진입 화면이 존재하고 T-1 이 거기서 시작하는가 — 홈 빈 상태로 대체하면 실패. 사용자 둘 이상이면 초대받은 쪽 첫 화면(링크 진입) 없으면 실패' 와 '- [ ] 오류 상태(error) 프레임이 있고 무엇이 잘못됐고 무엇을 하면 되는지 둘 다 있는가'. ②`### C-10. 1등 정보 일치` 3종 세트: 판정 design.md §5 1등 정보 ≠ 1콜 블라인드 1순위면 실패 / 빈발 상태 칩 4개 같은 강도라 제목이 먼저 읽힘, 주 숫자와 단위 같은 크기 / 수정 1등 정보에 크기·색·여백 중 2가지(local), 구조가 다른 정보를 먼저 보이면 direction. ③§2 브랜드 장치 항목의 'design.md §8' 을 '§10' 으로 정정. ④§3 매핑 UI 축에 C-5 추가, UX 축에 C-10, 적합성에 positive.unique_element·brand_device 명시. §4 라우팅에 C-10 행.

### 계획 24 [P2] `scripts/selftest.sh` — 신규 — 검사기 검출력 시험 — 기준 I-1, I-5, U-1, U-4, V-3

픽스처 `scripts/fixtures/brief_empty.md`(= templates/brief.md 사본)·`brief_golden.md`(전 항목 채운 예시)·`raw_golden.md`·`interview_golden.html`·`interview_bad.html`(unknown 누락·금지어 1건·타일 두 속성 동시 변경)·`c_report_bad.json`(positive false, score 2 with no fail). 실행: check-brief 는 empty 에서 B-3·B-4·B-5·B-12·B-16·B-18 FAIL 이어야 하고 golden 에서 exit 0; check-interview-page 는 bad 에서 P-3·P-4·P-6 FAIL, golden 에서 exit 0; check-c-report 는 bad 에서 CR-5·CR-6 FAIL; forbidden-words 는 14단어 각각 1회 매치. 하나라도 기대와 다르면 exit 1. design-harness '시작 시 반드시' 에 '`bash scripts/selftest.sh` 종료 코드 0 확인' 추가. eval.sh 에서 호출.

### 계획 25 [P2] `docs/harness-defects.md` — D-35~D-37 신설 + 잔여 위험 측정 항목 — 기준 I-5, U-2, U-6, V-1

①`## D-35. 레퍼런스 수집 단계 부재 — 관행 위반 4건(D-11·D-26·D-33·D-34)이 전부 오너의 외부 비교로 잡힘` (처치: 0-A2·references.md·B-18·judge web 도구·값/패턴 문장). ②`## D-36. check-brief 가 빈 템플릿에서 B-4·B-12 PASS`(tableRows placeholder 행·주석 매치, 처치: tableRows 수정·selftest.sh). ③`## D-37. SKILL 이 '스크립트가 센다' 고 선언한 163·164행이 check-brief 에 없음 + fast 세트 4곳 3버전 + 금지어 13/14`(처치: B-20~B-22·정본 단일화·forbidden-words.js). ④잔여 위험에 측정 항목: `[H-]` 건수·kind 분포·`F-` 수·4항 준수율(fast 기대 H ≤7, F ≤3) / pushback 에서 추천과 다른 선택 건수 / 열린 결정 질문 0건 grep / references.md 행 수·T-n 매핑·C FAIL 중 REF 인용 비율 / 1-C·2-E·2-H 타이핑 줄 수·되묻기 횟수(기준 ≤3줄·≤1턴) / delegations 건수.

### 계획 26 [P3] `templates/interview_page.html` — flows[] (IA 시각 자료) — 기준 I-3, U-1

harness-data 선택 필드 `flows[]`: `{id:"F-1", question, narrative, steps:[{label, html}], free:true, unknown:true}`. renderQuestions 뒤 renderFlows — 1단계 안에서 narrative 아래 steps 를 `.flow{display:flex;gap:8px;overflow-x:auto}` 로 나란히, step 클릭 = '여기가 달라요'(kind:flow, step_id, free). 박스+화살표·번호 원 없음. items() 집계·0-D 회수(`F-n: <step|ok> — free`)·check-interview-page P-15(steps ≤ agent_flow_steps_max, step html 에 자리표시자 0) 갱신. interview_prompts §1-3 를 '다이어그램 금지. 대신 시나리오 아래 실제 화면 조각 2~4장을 순서대로(flows[])' 로, Q8·Q9 행에 '(flows[] 병기)'. 0-A 화면 흐름 후보가 steps 입력.

### 계획 27 [P3] `scripts/lib/audit-core.js` — serializeNode·CHECKS·번들 반환 (make-figma-audit.js 와 함께) — 기준 U-5, V-2

①serializeNode 에 `x, y, clipsContent, characters(≤40자, TEXT 만)` 추가. ②CHECKS 에 `within_parent_bounds`(A-14), `primary_action_visible`(A-13: `Action/Primary` 정확히 1 + y+height ≤ 844 또는 조상 `Bar/Action`), `text_overflow`(A-12: `/ long` 프레임의 TEXT textAutoResize NONE 또는 textTruncation ENDING 이면 위반) 구현 후 AUDIT_IMPLEMENTED 에 추가. build-rules.js 가 design.md §2 규격으로 `frame-spec`(A-9) 규칙 생성. ③make-figma-audit.js 반환값에 `text_inventory:[{frame, texts}]`(프레임당 ≤60, 각 ≤40자)·`reactions:[{from_frame,to_frame}]` 추가(20KB 내). check-figma F-9 텍스트 일치율·A-16 흐름 연결이 이것을 읽는다.

### 계획 28 [P3] `.claude/skills/design-figma-build/SKILL.md` — 3-E C 검출력 시험 (full 한정) — 기준 V-3

95행 캡처 절차 뒤 'C 검출력 시험(프로젝트당 1회, full) — maker 가 `__TEST__` 페이지에 합성 프레임 1개(보라→파랑 그라디언트 + 이모지 아이콘 3개 + 동일 그림자 카드 3열 + #000 본문)를 만들고 구조 실측치 반환 → 2콜 판정자에게 실제 PNG 사이에 섞어 준다. 그 프레임을 C-5 ≥2 로 FAIL 하지 않으면 라운드 무효(`C_DETECTOR_FAIL`), 브리프 수정 후 재판정. 리포트 `design/verify/c_detector_test.md` 를 메인이 읽은 뒤 페이지 철거(D-15 순서).' fast 는 생략 + 가정 로그.

### 계획 29 [P3] `.claude/skills/design-interview/SKILL.md` — 0-B ⑦ 자극 미감 QA — 기준 I-3, V-3

check-interview-page 뒤에 '⑦ 자극 미감 QA(design-judge, 0-B maker 와 다른 호출) — interview.html 렌더 스크린샷(불가 시 타일 HTML 원문)으로 타일마다 정렬·간격 스케일·색 역할 일관성·대비 PASS/FAIL, FAIL 타일은 maker 1회 되돌림. `design/verify/stimuli_qa.md`(≤agent_report_lines_max). 사용자에게 점수 비노출. fast 는 타일 6장 표본.' (D-6 에서 실제로 했던 QA 의 복원)

### 계획 30 [P3] `scripts/check-decisions.js` — 신규 (2단계 decisions.md 결정론 검사) — 기준 U-3, U-6, V-1

`--decisions design/decisions.md --raw design/interview_raw.md --state design/state.json`. D-1 §1 축 수 ≤ human_open_axes_max / D-2 §2 각 축에 `D-<축>` raw ID 존재 또는 raw `사용자 위임`(state.axis_choice.delegated) / D-3 §2 각 축에 ai_pick 과 changed_after_reveal 기록 / D-4 §3 승인 원문 == state.draft_approval.quote / D-5 §1·§2 사용자 노출 문구 forbidden-words 0. draft-html 종료조건 첫 항목을 이 명령으로.

### 계획 31 [P3] `.claude/skills/design-interview/references/interview_prompts.md` — §6 full 전용 뼈대 Q3b·Q3c — 기준 I-4

'Q3b | 형태 진술(간접) | 두 장면 제시: 영수증처럼 줄로만 나뉜 목록 / 명함처럼 칸으로 나뉜 목록 중 어느 쪽이 보기 편했나요 (선택+모르겠음) | payload form_axis' 와 'Q3c | 강조 진술(간접) | 급한 것 하나가 있을 때 색으로 튀는 게 좋나요, 맨 위에 크게 오는 게 좋나요 | payload emphasis_axis'. full 만(상한 12 안), fast 는 always 쌍이 대신.

## 5. 기준별 갭 원문 (감사+반박)

### I-1 (partial)
- 조각②(탈출구) 강제 누락: 0-B 검증 ③은 질문 수·Q1/Q5 선두·타일/쌍 수만 세고 `questions[].unknown === true`·`free === true`·`options[].scene` 비어있지 않음을 검사하지 않는다. interview_page.html 173행은 `q.unknown` 이 참일 때만 '모르겠음' 버튼을 렌더하므로 maker 가 필드를 빼면 탈출구가 조용히 사라진다(SKILL 65행 '항상'은 문장일 뿐).
- 조각①(어휘 완충) 검사가 스크립트가 아니다: SKILL 79행의 금지어 13개 grep·골격 바이트 대조·축 구현 검사는 `design-worker` 지시문이고 scripts/ 에 대응 검사기가 없다. check-brief.js 는 SKILL 164행(exit_interview_page.md 존재·전건 PASS)을 구현하지 않아 0단계 PASS 가 나도 인터뷰 페이지 검증이 실제로 돌았는지 아무도 모른다. 하네스 자신의 D-30(worker 판정 3회 연속 오탐) 원칙과 충돌.
- 조각⑥(후속 단계 쉬운 말) 검사 누락: 금지어 grep 이 0단계 페이지에만 있다. 0-H ack 표(statement 쉬운 말 병기)·1-C `design_guide_compare.html` 세트 설명·2-E `compare_axis*.html` 질문·2-H 승인 질문·3-F taste_gap 질의는 규칙(디자인 용어 없이)만 있고 종료조건·grep 이 없다. 특히 0-H 표는 파일로 남지 않아 grep 대상 자체가 없다.
- 조각⑤(되묻기 완충) 서술만: '≤3턴'·'같은 질문 3번 금지'·'모르겠음 1회 재작성 후 폐기'·'Q1/Q5 UNCLEAR 시 장면 바꿔 1회 재질문' 은 interview_raw.md 에 되묻기 태그 형식이 없고 check-brief.js 에 카운트가 없다. 검증 3 실측이 정확히 3턴이었으므로 초과 여부를 기계가 못 본다.
- 조각④ 일부 서술만: prompts §7 '전부 하지 않아도 됩니다. 눈에 띄는 것부터' 가 템플릿 고정 마크업(step1 hint)에 없고 maker 가 채우는 `banner` 에만 의존한다. 시작 안내 '디자인 용어를 몰라도 됩니다 / 모르겠음' 도 페이지에서는 maker 가 채우는 `intro` JSON 이라 빠져도 검증 ④(금지어)로는 안 잡힌다.
- 조각① pushback '물을 쉬운 말' 존재 검사가 0-A 종료조건(worker)에만 있고 문구의 금지어 여부는 0-B 페이지 grep 에 간접 의존한다 — 0-A 산출(prd_analysis.md §6)에 대한 직접 grep 은 없다.
- fast 질문 세트 불일치: SKILL 12행(Q1·Q2·Q6·Q8·Q11·Q12, Q5 없음) / SKILL 65행(Q1·Q5·Q2·Q6·Q8·Q11, Q12 없음) / prompts 83행(Q1→Q5→Q2→Q6→Q8→Q11→Q12 7개, 상한 6) / harness 19행(7개). Q12(위임 탈출구)가 페이지에 오르는지, Q5가 선두인지가 문서마다 달라 조각 ③·④ 의 실제 형태가 미정이다.
- B-10 은 §6 행 수(1~15)만 센다. raw 의 [UNCLEAR]·[UNANSWERED]·'모르겠음' 건수와 §6 행의 대응은 검사하지 않으므로, '모르겠음' 5건 + 무관한 가정 1건이어도 PASS — 감사관이 ③의 '강제' 라고 부른 것은 존재 검사이지 침묵 처리 방지가 아니다.
- SKILL 163행(meta-status.answered 와 raw 항목 수 일치, 갤러리 반응 ≥5 또는 Q12 위임 기록)도 check-brief.js 에 없다. 감사관은 164행만 지적했다. 151행 '아래 목록은 스크립트가 검사하는 항목의 사람용 설명' 은 163·164 두 줄에 대해 거짓이다.
- SKILL 77행은 banner 를 '사전 고정' 이라 부르지만 template 162행 `$('banner').textContent = DATA.banner` — maker 가 채우는 JSON 이다. 문서가 실물에 없는 고정성을 주장한다.
- prompts 17행 '1회 재작성, 2회차에도 눌리면 폐기' 는 서술만이 아니라 도달 불가능하다: 페이지는 단일 패스이고 페이지 내 되묻기(sample)는 D-27 에서 제외됐으며 0-E 는 Q1·Q5 만 1회 재질문한다. 사문 규칙은 감사 시 '있는 것' 으로 세어지므로 삭제하거나 0-E 로 옮겨야 한다.
- 사용자에게 고지하는 소요시간이 세 값이다: SKILL 36행 '약 30분', 84행 '약 10분', 12행 fast '전체 12분'. 부담 상한 고지(④) 가 일관되지 않아 비전문가가 시작 전에 받는 부담 신호가 흔들린다.
- 3-F taste_gap 질의에는 쉬운 말 규칙 자체가 없다(figma-build 135행: '호출 품질 게이트 4항' 뿐). 감사관 갭 ⑥ 은 '규칙만 있다' 고 썼으나 3단계는 규칙도 없다.
- B-15 는 raw 에 `^Q-` 줄이 0개면 무조건 PASS(qs === 0 || as >= qs). 0-D 가 다른 형식으로 회수하면 미답 검사가 무음으로 꺼진다.
- 0-B 발행 전 검증이 한 번이라도 돌았다는 기록이 없다. defects 387행은 exit_interview_page.md 를 '처치로 추가했다' 고만 하고, 392행 검증 3 실측에는 그 파일 언급이 없다. 검사 항목 존재와 검사 실행은 다르다.

### I-2 (partial)
- (b) 질문→인사이트 매핑이 생성물에 없다: interview_prompts §6 의 '캐내는 것·기록 태그' 는 참조표에만 있고, design/stimuli/interview.html 의 questions[] 스키마와 0-D 회수 형식(Q-nn/A-nn)에 페이로드 필드가 없어 worker·check-brief 가 '이 질문이 무엇을 위한 것인가' 를 검사할 수 없다. 같은 페이로드를 겨냥한 중복 질문, 페이로드 없는 질문이 상한 6 안에서 통과한다.
- (c) '핵심만 묻는다' 가 서술뿐이다: 'PRD 가 이미 답한 질문은 넣지 않는다'(SKILL.md:65)·'디자인에 영향을 주는 미확정만'(:48) 을 prd_analysis.md §5·§6 과 대조하는 검사가 없고, kind:pushback 질문의 text 가 prd_analysis §6 의 '물을 쉬운 말' 과 일치하는지·건수가 상한(fast 2) 이내인지도 0-B 검증에 없다. fast 필수 페이로드 집합(무드·상태순위·1등정보·제약·IA·반박·위임) 중 무엇이 빠졌고 왜(PRD 가 답함) 빠졌는지 기록·검사가 없다.
- (d) 질문 생성 품질의 사후 측정이 없다: ①'죽은 질문' — 답변 A-nn 이 brief §2/§3/§4/§5/§6/§10 어디에도 인용되지 않은 비율(check-brief B-15 는 답변 수 ≥ 질문 수만) ②'모르겠음' 비율 — interview_prompts §1 규칙 4(눌리면 질문이 나쁜 것, 1회 재작성·2회 폐기)의 구현이 0-E 의 Q1·Q5 되묻기 외에 없고 임계값도 없다 ③'취향 말고 상황'(규칙 8)·'라벨형 금지'(규칙 2)를 잡는 grep 이 없다 — 금지어 13개는 전문 용어(밀도·위계·모던…)만 잡고 '어떤 느낌이 좋으세요' 류는 통과한다.
- (a)+(b) 동시 충족의 강제가 없다: 템플릿 예시 Q-05 가 options:[] 이고 0-B 검증 ③이 질문당 장면 선택지 ≥2 를 확인하지 않아, 가장 페이로드가 큰 질문(Q5 실수의 대가)이 자유서술 전용(비전문가에게 가장 어려운 형식)으로 발행될 수 있다. 실측 '타이핑 0줄'(D 로그 392) 은 자유서술이 비어 있었음을 뜻하므로 free-only 질문은 답이 0 이 된다.
- 핵심 질문 세트의 정본이 없다: design-interview SKILL.md:12 (Q1·Q2·Q6·Q8·Q11·Q12 — Q5 없음), SKILL.md:65 (Q1·Q5·Q2·Q6·Q8·Q11 — Q12 없음), interview_prompts:83·design-harness:19 (7종 + Q11 1~2건, 상한 6). maker 의 화이트리스트에는 interview_prompts 만 들어가므로 maker 가 보는 목록은 상한을 넘고, 검증 ③은 '개수 ≤6·Q1/Q5 선두' 만 보아 어느 세트를 골랐든 통과한다. '핵심만 고른다' 가 기계로 정의되지 않은 상태.
- 심사 기본 모드(fast, harness:15)에서 PRD 특화 인사이트 질문이 구조적으로 제거된다: Q11b(0-A §5 미확정 사항)는 fast 에서 생략(prompts:78)이고 실측 미확정 12건 중 0건 소비(defects:14). 남는 PRD 특화 질문은 Q11 반박 ≤2건뿐이며 나머지 4~5문항은 PRD 와 무관한 고정 뼈대다. 'PRD 를 보고 핵심 질문을 만들어낸다' 는 주장이 심사 모드에서는 반박 2건으로 축소된다.
- 질문에서 나온 인사이트는 구현 강제 규칙이 되지 못한다: rule_schema:25 '진술만 있고 반응 없음 → provisional', :24 confirmed 는 명시 반응 ≥3 요구. 즉 §4 규칙의 confirmed(구현 강제)는 자극 반응에서만 나오고, 질문 답은 §2 IA·§6 가정·§10 반박으로만 흐른다. 그 경로의 검사(B-3·B-10·B-12)는 존재·개수만 세고 답에서 유래했는지 보지 않는다 — 감사관 갭 (d)① 의 원인이 스키마 수준에 있다.
- 유도 질문 통제가 없다: D-4 처치(defects:107, SKILL.md:121) '질문에 담긴 내용도 합의된 것으로 본다' 에 따라 Q6 "큰 글씨·고대비가 필요한 사용자가 있나요?" → "있음" 이 큰 글씨 요구의 근거가 된다. 질문 문구가 페이로드를 심고 한 단어 답이 이를 합의로 승격시키는데, 질문이 중립적인지(대안 장면이 대등한지) 검사하는 항목이 0-B 검증에 없다. 쉬운 질문의 '유의미함' 이 사용자가 아니라 하네스에서 나올 위험.
- 0-A 종료조건(SKILL.md:54, 반박마다 '물을 쉬운 말' 존재)은 유일하게 강제되는 I-2 조각인데 판정 주체가 design-worker(Haiku) 다. D-30 은 같은 worker 의 종료조건 판정이 3회 연속 틀려 brief 검사를 check-brief.js 로 대체했다고 기록하지만 prd_analysis.md 용 스크립트는 없다. 반박 질문의 '쉬움' 은 신뢰도가 낮은 경로로만 검사된다.
- Q2(1등 정보)의 소비처 검사가 비어 있다: brief §2 표에 '이 화면의 1등 정보' 열이 있으나 check-brief B-3(:49) 은 마지막 열(기능 매핑)만 검사해 1등 정보 열이 전부 비어도 PASS. Q2 → §2 → design.md §5 → C 블라인드 1차 인상 체인의 첫 고리가 검사 없이 끊길 수 있다.
- '모르겠음' 버튼 문구가 위임을 유도한다: interview_page.html:173 '모르겠음 — 기본값으로 진행해도 돼요'. 쉬움 쪽으로는 완충이지만, [UNCLEAR] 비율 검사가 없는 상태에서 이 문구는 질문이 나빠서 눌린 것과 사용자가 위임한 것을 구분 못 하게 만든다 — 규칙 4(눌리면 질문이 나쁜 것)의 신호를 스스로 흐린다.

### I-3 (partial)
- 조각③ '단일축 격리' 의 절반만 강제: 0-B 검증 ⑥ 은 축 속성(font-family·border-radius·행 수)이 변형 간에 '다른가'만 grep 하고, 같은 축의 타일들이 그 밖의 속성에서 '같은가'(SKILL.md:66 '축 하나씩만 바꾼 타일', 축 표 '나머지 동일')는 검사하지 않는다. 두 속성이 함께 바뀐 타일은 통과하고, 그 반응은 어느 축에도 귀속할 수 없다.
- 타일 복잡도 상한(design-harness/SKILL.md:36 요소 ≤6/≤5)은 브리프 상한 문장과 state.caps 에만 있고 0-B 생성물 검증 ①~⑥ 에 항목이 없다(⑤ 는 파일 크기만). 요소가 많은 타일은 비전문가가 '무엇을' 보고 반응하는지 흐려진다.
- 타일 내용이 PRD 도메인 화면 조각인지(SKILL.md:66)를 확인하는 검사가 없다. 2단계 check-html H-8(Lorem·'제목을 입력') 같은 자리표시자 검사도, PRD 어휘 포함 검사도 0-B 에는 없다 — 범용 더미 타일이면 '이 앱' 에 대한 반응이 아니다.
- 타일 대비 '4.5:1 미만 조합 금지'(SKILL.md:66)에 검사가 없다. D-6 이 기술한 페이지 내 getComputedStyle 대비 배지도 현재 interview_page.html 에 없다. 대비가 낮은 타일은 축이 아니라 가독성 때문에 '싫다' 를 받는다.
- 발행 전·후 타일이 실제로 렌더되는지 확인하는 절차가 없다. 0-B 검증은 전부 grep 이고, 0-C 는 read_db 빈 목록 확인만 한다. 깨진 inline HTML·서체 미로드면 사용자는 결함에 반응하게 되는데, 3-G 처럼 '메인이 직접 열어 본다' 규칙이 인터뷰 페이지에는 없다.
- 화면 흐름 확인(Q8·Q9)과 1등 정보(Q2)는 시각 자료 없이 서술(시나리오 내러티브·질문 문장)로만 묻는다. interview_prompts.md:16 의 다이어그램 금지는 타당하지만, 비전문가용 시각 대안(실제 화면 조각을 순서대로 나란히)이 정의되지 않아 IA 라는 가장 지식이 부족한 영역이 오히려 시각 자료 밖에 있다.
- 종료조건 SKILL.md:163 '갤러리 반응 ≥5 또는 Q12 위임 기록', :164 'exit_interview_page.md 존재·전건 PASS' 가 check-brief.js 에 구현되지 않았다(B-15 는 ^Q-/^A- 만 셈). 문서는 '스크립트가 센다'(:146)고 하나 시각 자료가 실제로 사용됐는지는 아무것도 세지 않는다.
- 0-B 생성물 검증 ①~⑥ 자체가 design-worker(Haiku)의 수동 grep 이다. D-30 실측(worker 종료조건 판정 3회 연속 오류·파일 미생성)으로 brief 검사는 스크립트화했으나 인터뷰 페이지 검사는 같은 구조로 남아 있다.
- 템플릿의 본보기 타일이 단일축 격리를 어긴다: templates/interview_page.html:75-76 의 밀도 축 G-01(카드 border-radius:8, padding 14, font 13px)과 G-02(border-top 구분선, padding 6, font 12px)는 밀도 외에 형태 축(카드 vs 구분선 — SKILL.md:72 정의)과 글자 크기까지 동시에 바꾼다. maker 는 이 골격을 입력 화이트리스트로 받아 패턴을 복사하므로, 규칙(:66)과 본보기가 서로 반대다. 검사 ⑥ 은 이를 통과시킨다.
- 검사 ⑥ 은 6축 중 타이포·형태·밀도 3축만 명시한다(SKILL.md:79). 색온도·채도·강조 축은 변형 간 hue/채도/강조 방식이 실제로 다른지 검사 항목이 없어, D-32 와 같은 '축이 자극이 아닌' 실패가 나머지 3축에서는 검출되지 않는다. 감사관의 P-5 제안은 이를 암시하나 gaps 에는 적지 않았다.
- 0-B 검사 ③ 은 타일·쌍 '수 ≤상한' 만 세고 축 커버리지 하한(6축 × ≥2 변형, 축당 쌍 1)이 없다. 12타일이 2축에 몰려도 통과하고, 나머지 축은 시각 자료 없이 §6 가정으로 채워진다. check-brief B-5 는 §3 정본 기입만 세므로 정본이 반응에서 왔는지도 안 본다.
- 금지어 grep ④ 의 대상이 title·intro·banner·질문·value·scene 뿐이고 tile/pair 의 `html` 텍스트가 빠져 있다. maker 가 타일 제목에 '밀도 높음' 같은 축 라벨을 쓰면 사용자에게 그대로 보여 axis_hidden 이 무의미해지는데 검출되지 않는다.
- D-32 처치(축 표 + ⑥)는 커밋 f6f1579 이후 실측이 0회다(이후 커밋은 D-33·D-34 뿐, harness-defects.md 에 검증 4 없음). 현재 페이지에 대한 유일한 런(:392 검증 3)은 처치 이전이며 그 런에서 ③ 이 실패했다. 따라서 ③ 의 강제 장치는 '있다' 가 아니라 '아직 검증되지 않았다'.
- fast 모드 '월드컵은 갈리지 않은 축 ≤2개' (SKILL.md:12, design-harness:21) 를 페이지가 강제하지 않는다. undecidedPairs() 는 갈리지 않은 쌍을 전부 노출하고 human_worldcup_rounds_max 는 state.json 외 어디서도 참조되지 않는다. 피로 상한이 문서에만 있다.
- undecidedPairs() 의 `Object.keys(v).length === 1` 분기(interview_page.html:156): 한 변형에만 '좋다' 를 주고 짝 타일을 건너뛰면 그 축은 '갈림' 으로 처리돼 대비쌍이 숨는다. 지시문(:88 '전부 하지 않아도 됩니다')이 건너뛰기를 허용하므로 반응 1건으로 축이 확정되는 경로가 열려 있다.
- Q4(레퍼런스 앱 — interview_prompts.md:68)와 Q10(빈 상태·늦은 회신 — :76)도 시각 자료 없이 서술로만 묻는다. 특히 Q4 는 비전문가가 기억만으로 '어느 화면의 어느 부분' 을 지목해야 하고 하네스가 그 앱을 보여 줄 장치가 없다(U-2/U-3 과 겹치는 영역이나 I-3 관점에서도 공백).
- banner '보이는 느낌만' 지시(:61, :77 '사전 고정')는 템플릿 기본값일 뿐이며 maker 가 harness-data 전체를 새로 채운다. 발행본 banner 가 그 지시를 유지하는지 검사하는 항목이 없다(④ 는 금지어 부재만 본다).
- D-6 실측(:126)은 D-27 이전의 갤러리 전용 아티팩트(getComputedStyle 대비 배지·QA 점수 판정 후 공개 포함)에 대한 것이다. 현재 templates/interview_page.html 은 그 기능을 뺀 재작성본이므로, 감사관이 ①② 실측으로 든 D-6 는 현재 페이지의 실측이 아니다.
- 문서 충돌: design-harness/SKILL.md:57 은 0단계 종료조건을 'design-worker 가 판정' 이라 하고 design-interview/SKILL.md:146 은 'check-brief.js 가 센다' 고 한다. 메인이 어느 쪽을 따르느냐에 따라 시각 자료 관련 종료조건(:163-164)이 worker 판단으로 대체될 수 있다.

### I-4 (partial)
- 조각② '다른 각도의 같은 주제 질문' — §3 6축 중 진술형 질문이 있는 축은 full 에서 무드(Q1)·밀도(Q3) 2축뿐이고 fast(심사 기본)는 Q1 1축. 형태·타이포·강조 방식·색 채도 4축은 어느 모드에서도 두 번째 각도가 없어 '인터뷰 진술값' 칸이 비고 반응 1종으로 정본이 확정된다. '축마다 근거 종류 ≥2' 를 요구하는 규칙이 없다.
- 조각② — 대비쌍(월드컵)은 갤러리로 갈린 축을 page.html :156 이 숨긴다. 즉 재검증이 아니라 미결 보충. 타일 하나에 '좋다' 하나(이유 없음이어도)면 그 축은 다른 각도 확인 없이 정본이 된다.
- 조각② — '장면을 바꿔 1회 재질문'은 Q1·Q5 [UNCLEAR] 에만 발동(SKILL :99). 답이 있는 경우 그 답을 다른 각도로 재확인하는 규칙이 없다.
- 조각③ '재검증 과정' — rule_schema :33 의 "진술≠반응 → 사용자 1회 고지"가 절차 어디에도 슬롯이 없다: 0-E 되묻기 허용 목록(:99)·design-harness 개입 지점 #2(:108) 에 없고 :113 은 그 외 호출을 결함으로 규정한다. 0-H ack 표는 RULE 행만 보여 주고 §3 충돌 축은 보여 주지 않는다. raw 기록 태그(Q/A/R/W)에도 고지·확인 태그가 없다.
- 강제 장치 — check-brief.js B-5(:56) 는 §3 '정본' 칸만 센다. 진술·반응 두 칸 충족, 다를 때 정본=반응, constraint 축의 raw 확인 기록(SKILL :155 서술) 은 스크립트에 없다.
- 강제 장치 — rule_schema 의 'confirmed = source_refs ≥3'(:13·:24) 을 B-7(:69) 이 `[]` 여부로만 본다. 근거 개수·종류(A-/R-/W-) 다양성 검사가 없어 같은 종류 근거 1~2건으로 confirmed 가 통과한다.
- 실측 — 조각③ 의 constraint 분기(BLOCKED)는 1회 작동 기록이 있으나(defects :393), non-constraint 분기의 '고지' 가 실제로 일어난 기록은 없다.
- 실측 공백: docs/harness-defects.md 전체에 '§3·대조표·진술·재질문·전량표·장면을 바꿔' 가 0건이고 'ack' 는 pushback 안의 오탐뿐이다. I-4 의 핵심 장치(진술 vs 반응 대조표 두 칸, 0-H ack, Q1/Q5 재질문)가 실제로 작동한 기록이 없다. 감사관이 실측으로 든 것 중 I-4 에 해당하는 것은 :393 BLOCKED 1건뿐이다.
- templates/state.json human_gates(:49-72)에 0-H 규칙 전량표 ack 를 기록할 필드가 없다(interview_answers.count·stimulus_reactions·token_set_choice·draft_approval·final_ack 만). SKILL:136 '상태 파일에 기록' 이 갈 곳이 없고 check-brief.js 도 ack 를 세지 않아 0-H 는 서술만이다.
- design-harness/SKILL.md:22 — fast 모드 ack 는 'confirmed 만 표시'. provisional·proposed(근거가 얇아 재검증이 가장 필요한 규칙)는 심사 기본 모드에서 사용자에게 한 번도 보이지 않는다.
- design-interview/SKILL.md:136 — 'ack 못 받은 상태로 시간 상한이 오면 전부 provisional 로 두고 진행' → 유일한 사용자 재확인 절차가 시간으로 우회 가능하다.
- design-tokens/SKILL.md:38 '정본이 확정된 축은 고정… 정본을 뒤집는 세트를 만들지 않는다', design-draft-html/SKILL.md:34 'brief §3 에서 정본이 확정된 축은 다시 열지 않는다' — 타일 반응 1종으로 잡힌 정본을 1·2단계가 명시적으로 잠근다. 뒤 단계의 시각 확인이 §3 재검증 역할을 하지 못하게 규칙이 막고 있다. 유일한 후행 되돌림은 figma-build:136 repeat 에스컬레이션(같은 이유 C FAIL 2회)뿐.
- Q3(§3 축에 대한 유일한 직접 진술 질문)는 full 에서도 보장되지 않는다: interview_prompts:61 '0-A 에서 답 나온 것은 건너뜀', SKILL:65 'PRD 가 이미 답한 질문은 넣지 않는다', worker 검사③(SKILL:79)은 'Q1·Q5 선두' 만 확인하고 Q3 존재를 검사하지 않는다.
- 기준 의도 오독(부분): I-4 는 비전문가의 '답변' 전부를 의심하라는 것인데 하네스는 진술만 의심하고 반응은 진실값으로 취급한다(SKILL:108 '다르면 반응이 정본', page:156 갈리면 쌍 숨김). 재검증이 진술→반응 한 방향이며, 반응→(다른 형식) 재확인 규칙은 constraint 축 외에 없다.
- 감사관이 조각① 근거로 든 0-G 3건(rule_schema:46, defects:394, defects:102)은 하네스 해석의 과대 일반화를 잡는 장치로, 답변을 더 문자 그대로 믿게 하는 방향이다. I-4 근거로 세면 조각①이 실제보다 두터워 보인다. 이를 제외하면 조각①의 강제 장치는 brief §3 칸 + B-5(정본 칸만) 하나다.

### I-5 (partial)
- 조각② '내가 보기에 무엇이 맞다를 먼저 명확히': 하네스가 실제로 의견을 갖는 PRD 반박(Q11)에 추천 필드가 없다 — interview_prompts.md §6 Q11 형식, 0-A §6 요구 산출(대안 2개+쉬운 말만), screen_derivation.md §3(대안 2개→사용자가 고른다), interview_page.html pushback 스키마(A/B/PRD대로 중립 3택, `recommended` 없음) 전부. I-5 예시 형식('A 가 좋아 보입니다. B 도 필수일까요?')을 구조적으로 만들어내는 곳이 없다.
- 조각② 강제 장치 부재: '호출 품질 게이트 ③하네스 추천과 이유'는 design-harness/SKILL.md 의 문장뿐이다. 추천이 담겼는지 확인하는 템플릿 칸·raw 기록 형식·종료조건 검사가 없다. 인터뷰 페이지(게이트 1)의 질문은 maker 가 뼈대에서 생성하므로 이 게이트가 애초에 적용되지 않는다.
- 조각② 결정형/취향형 미구분: 토큰 세트·축 선택은 앵커링 방지로 추천을 '선택 기록 후' 공개한다(취향형에는 타당). 그러나 결정형 호출(PRD 반박·[CONSTRAINT] 충돌·BLOCKED 승격·taste_gap)과 취향형을 가르는 규칙이 없어, 결정형에서도 추천이 후공개되거나 아예 빠진다. 호출 품질 게이트 ③과 '추천 후공개' 규칙이 서로 충돌하는데 조정 문장이 없다.
- 조각③ 'PRD 가 이미 답한 질문은 넣지 않는다'는 0-B 브리프 문장뿐 — 0-B 생성물 검증 ③은 질문 수와 Q1·Q5 순서만 센다. 어떤 뼈대 질문을 왜(PRD 어느 절이 답함) 생략했는지 기록·검사하지 않아, 불필요한 질문이 들어가도 잡히지 않는다.
- 조각③ 사람 개입 5곳+예외 2 상한이 문장뿐 — 실제 호출 횟수를 세는 검사(state·raw 기록·종료조건)가 없어 초과 호출이 '하네스 결함'으로 선언만 되고 검출되지 않는다.
- 조각①③ brief §10 '사용자 확인 원문 또는 사용자 위임' 요건은 SKILL 종료조건 문장에만 있고 check-brief.js B-12 는 행 수 ≥1 만 세어 '하네스 이의·대안'·'사용자 확인 원문' 열이 비어도 통과한다.
- 실측 결핍: harness-defects.md 4개 런 어디에도 I-5 를 직접 잰 항목(사용자 호출 건수, 그중 추천이 문장에 포함된 비율, '무엇을 넣을까요' 형 열린 결정 질문 0건 여부)이 없다. 조각①③은 간접 실측(QA 채점 하네스 담당, 반박 2건 소비, BLOCKED 승격)만 있고 조각②는 취향형 후공개 실측(anchoring 4건→1건)만 있다.
- 질문 뼈대 자체가 I-5 위반을 담고 있다: interview_prompts.md §6 Q10 은 '무엇이 보이면 좋겠어요? / 어떻게 보이면 좋겠어요?' 형 열린 결정 질문이고, templates/interview_page.html 샘플 Q-11 이 이 문구를 그대로 쓴다. 0-A 가 이미 상태 순위·빈 상태를 도출하는데(screen_derivation §1-4) 그 결과를 입장으로 제시하지 않고 사용자에게 백지로 묻는다. 감사관의 fix #1 은 형식을 금지하지만 현재 위반 지점(Q10)을 지목하지 않는다.
- check-brief.js B-12 는 손대지 않은 템플릿에서 PASS 한다(실행 확인): tableRows 가 빈 placeholder 행 `| P-01 | | | | | |` 을 행으로 세고, /반박 없음/ 정규식이 템플릿의 HTML 주석에 매치해 s10none=true 가 된다. §10 은 감사관 지적('행 수만 센다')보다 더 무력하다 — 0행이어도 통과.
- design-interview/SKILL.md 164행은 종료조건에 'exit_interview_page.md 존재·전건 PASS' 를 넣었으나 check-brief.js 에는 그 검사가 없다. 조각③의 유일한 기계 검사(질문 수 상한)는 Haiku worker 가 수행하고 아무도 그 결과를 재확인하지 않으며, D-30 이 worker 검사 오탐을 3회 기록했다.
- fast 질문 세트가 4곳에서 서로 다르게 정의된다: design-interview/SKILL.md:12 는 Q1·Q2·Q6·Q8·Q11·Q12(Q5 누락), :65 는 Q1·Q5·Q2·Q6·Q8·Q11, design-harness:19 와 interview_prompts:83 은 7개(Q1·Q5·Q2·Q6·Q8·Q11·Q12)를 열거하며 상한 6. 4회차가 'Q5 를 앞에 둔 이유가 실측됨'이라 했는데 12행 세트는 Q5 를 빼고 있다 — '반드시 물어야 하는 것만 추린다'는 규칙의 정본이 없다.
- 결정형 호출 중 감사관이 다루지 않은 것: design-harness:63 '그대로 진행/보정/중단', design-harness:135·figma-build:139 "'이 정도면 됐다'는 항상 사람이 정한다". 둘 다 하네스가 어느 쪽을 권하는지 없이 중립 선택지를 던지는 형식으로 명시돼 있다.
- 의도 오해의 뿌리: design-harness:149-150·design-interview:169 는 하네스에 '무엇이 좋은 디자인인가'가 한 줄도 없어야 하고 미리 채우면 사용자가 하네스의 답을 검토하게 된다고 선언한다. 시각 취향에는 맞는 원칙이나 제품·UX 결정(PRD 반박·엣지 상태·1등 정보)에까지 적용돼, I-5 가 요구하는 '전문가로서 내가 보기에 무엇이 맞다'를 하네스 철학이 명시적으로 금지하는 구조다. 감사관 fix #7 의 결정형/취향형 분리는 이 두 문장을 함께 고치지 않으면 서브·메인이 149행을 근거로 추천을 빼도 규칙 위반이 아니다.
- design-draft-html 2-H 의 '하네스 의견'은 '자체 점검 요약 3줄'로 정의돼 있어(100행) 검사 결과 요약이지 '이 초안이 맞다/틀리다'는 입장이 아니다. 감사관이 조각② 절차 근거로 인용했으나 실제로는 추천이 아니다.

### U-1 (partial)
- 조각③ '전부 포함' 의 완전성 기준 집합이 PRD 기능 번호다(screen_derivation 19행, draft-html 93·108행, check-brief B-3). PRD 가 침묵한 여정(온보딩·이해관계자 초대·역할별 진입·상태별 화면·오류 복구·되돌리기)은 매핑 검사를 100% 통과한다 — 'PRD 를 신뢰하지 않는다' 는 기준 취지와 반대 방향의 검사만 강제된다.
- PRD-침묵 영역을 잡는 유일한 규칙인 `누락` 유형(design-interview 49행)은 0-A judge 재량이고, 상한(fast ≤4/full ≤10) 안에서 문제·과잉과 경쟁한다. '누락 0건' 에 사유를 요구하거나 검사하는 장치가 없고, check-brief B-12 는 §10 행 수만 센다(유형 열 값을 보지 않음).
- screen_derivation 11·15·17행의 '상태 하나가 화면 어디에도 없으면 미충족'·'역할마다 진입 화면'·'상태 프레임(빈/로딩/오류/도메인 예외)' 은 서술뿐이다. templates/brief.md §2 표에 상태·역할 열이 없고(상태 순위표는 prd_analysis 에만), check-brief.js 에 상태→화면·역할→화면 대조 항목이 없으며, 0-A 종료조건(54행)은 스크립트 없이 worker 판정에 의존한다(D-30 에서 신뢰 불가로 실측된 방식).
- §10 각 행의 '사용자 확인 원문 또는 사용자 위임'(design-interview 160행)과 '반박 없음 — 사유' 의 사유 존재가 check-brief.js 에 없다 — 사용자 확인 없이 하네스가 PRD 를 임의로 바꾼 상태가 PASS 될 수 있다(screen_derivation 39행 '하네스가 임의로 PRD 를 무시하지 않는다' 의 강제 장치 부재).
- 2-G 승인 전 구조 검사 ②(PRD 기능 전부 매핑)가 check-html.js 에 구현되어 있지 않고(H-1~H-10 뿐) worker grep 에 의존한다. D-12 시험 3 은 1회 수동 확인이며 스크립트 회귀 검사가 아니다.
- 핵심 과업 3개가 'PRD 유저스토리에서' 도출된다(52행). 시나리오의 까다로운 상황(중복 소속·늦은 회신)이나 `누락` 반박 결과가 과업·화면표로 승격되는 규칙이 없어, 과업 추적(2-D/2-G/C)의 검증 대상 자체가 PRD 의존이다.
- draft-html 73행 '온보딩·첫 진입 화면이 흐름표에 있으면 포함' 은 조건부다. 흐름표 밖의 필수 첫 진입 화면을 요구하는 장치가 없다(U-4 와 겹치는 지점이지만 U-1 의 '전부 포함' 점검 대상에서도 빠진다).
- Q10(상태·엣지: 빈 첫 화면·답 늦은 사람)이 fast 질문 세트(design-harness 19행, interview_prompts 83행)에 없어, 심사 기본 모드에서는 사용자에게 PRD-침묵 상태를 직접 확인하는 채널이 Q11 반박 2건뿐이다.
- check-brief B-12 가 손대지 않은 템플릿에서 PASS 한다(실행 확인: `node scripts/check-brief.js --brief templates/brief.md --raw <더미>` → 'B-12 PASS §10 PRD 반박 1건 (반박 없음 명시) | P-01'). 원인 둘: tableRows(31~32행) 가 ID 셀 하나만 채워진 빈 행을 데이터 행으로 세고, §10 템플릿 HTML 주석(119행) 의 '반박 없음' 이 84행 정규식 /반박 없음/ 에 걸린다. 조각①의 유일한 스크립트 검사가 공허하다.
- check-brief B-4 도 같은 이유로 빈 T-1/T-2/T-3 행을 '3행 (≥3)' PASS 로 센다(실행 확인). SKILL 159행이 요구하는 '각각 시작 화면·기대 경로 존재' 는 검사되지 않는다 — 핵심 과업 장치의 0단계 존재 검사가 공허하다.
- `누락` 유형의 정의(design-interview SKILL 49행) 는 0-A judge 가 읽을 수 없다. 0-A 화이트리스트는 PRD + screen_derivation.md(40행) 뿐이고, 28행·design-harness 78~79행이 SKILL.md 를 브리프에 얹지 말라고 한다. screen_derivation 32행은 태그 이름만 언급하고 정의하지 않는다. 메인이 요구 산출 8항목을 브리프에 옮겨 적지 않는 한, PRD 침묵 영역을 잡는 유일한 규칙을 실행 에이전트가 모르는 채 0-A 가 돈다.
- 반박 질문의 형태가 `문제` 형에 고정되어 있다: screen_derivation 38행·interview_prompts 77행 'PRD에는 X라고 되어 있는데…PRD대로가 나을까요' 와 페이지 170행 힌트 'PRD와 다르게 갈 수도 있는 지점' 은 PRD 가 이미 무엇인가를 말했음을 전제한다. `누락`(PRD 가 말하지 않은 것) 을 넣을지 말지 묻는 형태가 없어, 기준의 '그대로 신뢰하지 않는다' 를 '반박' 으로 오독한 흔적이다.
- 상태 완전성의 기계 검사(H-6) 는 normal/empty/long 뿐이다. draft-html 74행의 `loading`(목록형) 과 screen_derivation 17행·c_checks 60행의 오류 상태는 check-html.js 어디에도 없고 brief·design.md 템플릿 칸도 없다 — 오류 복구 여정은 C단계 육안 판정 전까지 어떤 장치도 요구하지 않는다.
- C단계에서 과업 `불가` 는 c_report.json tasks[] 에 기록만 된다(figma-build 105·117행). 2-G 와 달리 '불가 → FAIL' 또는 라우팅 규칙이 없어, 3-F 분류(local/direction/taste_gap) 어디로도 자동 연결되지 않는다.
- B-12 는 SKILL 160행의 상한 '항목 1~agent_prd_pushback_max' 도 검사하지 않는다(하한 ≥1 만). 하한·상한 모두 검사한다는 하네스 원칙(design-harness 100행) 과 어긋난다.

### U-2 (none)
- [조각① 수집] 하네스 측 레퍼런스 수집 단계가 0·1·2·3단계 어느 SKILL.md 에도 없다. 유입 경로는 Q4(사용자가 편한 앱을 말함)뿐이며 fast 모드(심사 기본)에서는 Q4 도 빠진다. 서브에이전트 3종에 WebSearch/WebFetch 가 없고 화이트리스트 강제라 외부 자료를 볼 수단 자체가 없다.
- [조각② 충분히] 레퍼런스 개수 하한·상한이 없다. state.caps 에 `agent_references_*` 키 없음, design-harness 산출 상한표에 행 없음, check-brief.js 에 검사 항목 없음. brief §11 의 '같은 카테고리 실제 서비스' 는 한 줄 자유 서술이고 서비스명·화면·출처 칸이 없어 비어 있어도 B-13 이 PASS 한다.
- [조각③ 좋은 UX 로 연결] 갤러리·월드컵은 6개 UI 축의 자체 생성 자극이고 배너가 '보이는 느낌만' 평가하라고 지시해 UX 판단을 배제한다. screen_derivation 7단계는 PRD 텍스트만 입력이라 다른 서비스가 같은 과업을 어떻게 풀었는지 대조하는 단계가 없다. 2-D 적합성 페르소나와 C단계 적합성 판정은 '실제 서비스처럼 보이는가' 를 수집물 없이 판정자 기억으로 한다.
- [대체 주장 검토] 2-B 후보 축 메뉴(정보량·주도권·표현 강도·진입 방식·상태 노출)가 UX 패턴 레퍼런스의 부분 대체물이지만 고정 5개이고 프로젝트마다 수집되지 않는다. design-tokens 의 '공개 디자인 시스템 참조' 는 선택 사항이며 토큰 구조(UI)용이라 UX 레퍼런스가 아니다.
- [원칙 충돌] design-harness §'이 하네스에 없는 것' 의 '취향을 미리 채우지 않는다' 원칙이 UX 패턴(구조) 레퍼런스까지 배제하는 것으로 읽힌다. 취향 값(색·간격)과 패턴(진입·상태·빈 상태 처리)을 구분해 후자는 수집한다는 문장이 없다.
- [실측] D-11·D-33·D-34 세 건이 '관행에 없는 산출을 사람의 외부 비교가 잡음' 이라는 같은 뿌리인데 결함 로그가 이를 레퍼런스 부재로 분류하지 않아 U-2 에 대한 작동/미작동 실측이 없다.
- [Q4 채널이 UI 로만 흐름] 유일한 레퍼런스 유입(Q4)의 출력은 borrow_scope(element/whole_style 차용, rule_schema :17) → §4 판단기준 → 'UI 심미' 축(design-interview :142)이다. 사용자가 말한 앱의 흐름·진입·상태 처리(UX)가 §2 IA·§2b 핵심 과업에 들어가는 경로가 없다. full 모드에서도 U-2 의 '좋은 UX' 조각은 0.
- [판정자 기억은 공식 금지] design-judge :21 규칙5·:23 규칙7 이 brief·design.md·c_checks·픽셀 밖의 근거를 금지한다. 감사관이 de facto 레퍼런스로 인정한 '판정자 기억' 은 규칙상 쓸 수 없고 '취향 공백' 으로 사람에게 넘겨야 한다 — D-11·D-33·D-34 가 전부 사람 지적으로 잡힌 기전이 바로 이것이며, 이는 레퍼런스 부재의 실측 증거로 결함 로그에 등록돼야 한다.
- [자발 제공 레퍼런스의 유입 경로도 없음] 0-D 회수 schema(:90~93)는 question/pushback/tile/pair 4종뿐이고 interview_page 에 링크·이미지 입력 칸이 없다. 사용자가 스스로 스크린샷이나 앱 링크를 내밀어도 받는 단계가 없다 — :37 의 '시키지 않는다' 가 '받지도 않는다' 로 굳어 있다.
- [심사 모드 커버리지 0] design-harness :16 심사 기본 = fast. fast 에서 Q4 부재(:83, SKILL :12·:65, design-harness :17). 평가자가 실행할 모드에서 U-2 관련 산출물이 하나도 생성되지 않는다.
- [§11→§8→C단계 전달 사슬 무검증] brief :132 한 줄(출처 없음) → design.md :85 §8 복사 → draft-html :59 2-D 페르소나2 → figma-build :106 C단계 적합성 판정. 세 단계가 같은 출처 없는 한 줄을 근거로 '실제 서비스처럼 보이는가' 를 판정하며 어느 검사도 그 줄이 서비스명을 하나라도 담는지 보지 않는다.
- [제안 수정안의 순서 약점] 0-A2 를 0-A 뒤에 두면 첫 실행의 화면 도출(UX/IA 결정)은 여전히 레퍼런스 없이 끝나고 0-F 에서만 대조된다. U-2 의 '좋은 UX 를 생각해내기 위해' 를 충족하려면 레퍼런스가 화면 도출 이전 또는 병행 입력이어야 한다(예: 0-A2 를 0-A 와 병렬 호출 후 0-A 재실행 1회를 표준으로).

### U-3 (partial)
- 조각① '수집한 레퍼런스' 가 없다. 하네스 어느 단계도 같은 카테고리 실제 서비스의 UX 패턴(과업을 어떻게 푸는가)을 수집하지 않는다. 갤러리 타일은 PRD 화면 조각을 6개 시각 축으로 변형한 자체 생성 취향 자극이고, 시나리오(Q8)·반박(Q11)·2단계 후보는 PRD/design.md 에서 도출한 것이다. 취향 자극과 UX 패턴 레퍼런스는 다르다.
- 조각① 의 유일한 접점 Q4(자주 쓰는 앱 + 어느 부분)는 사용자가 레퍼런스를 제공하는 방향이며, 심사 기본값 fast 모드(--budget 40m)에서 삭제된다. brief §11 '같은 카테고리의 실제 서비스들이 공통으로 갖는 것' 은 judge 가 PRD 텍스트만 보고 채우는 한 줄이고 사용자에게 보여 주지 않는다.
- 조각② 의 강제장치(금지어 13개 grep FAIL)는 인터뷰 페이지(0-B 생성물 검증 ④)에만 있다. UX 구조 축을 묻는 2-E compare_axis 페이지·질문문과 1-C 세트 선택 지시문에는 금지어 검사가 없다.
- 조각③ 최소 입력량 하한이 검사되지 않는다. design-interview SKILL.md:163 의 '갤러리 반응 ≥5 또는 Q12 위임 기록', 'meta-status.answered 와 raw 항목 수 일치' 가 scripts/check-brief.js 에 구현돼 있지 않다(B-15 는 Q-/A- 개수만 센다). 반응 0건이어도 §3 정본만 채우면 B-5 통과.
- 조각③ 의 UX 구조 축 좁히기(2-B/2-E)는 종료조건이 worker 서술 판정('§2 각 축에 사용자 선택·이유 원문 존재')뿐이다. 0단계 B-5 처럼 decisions.md 를 세는 스크립트가 없다.
- 레퍼런스에서 도출한 UX 패턴 선택지를 사용자에게 장면형으로 보여 주고 고르게 하는 질문 종류(kind)가 interview_page 의 questions[] 스키마·0-B 브리프·0-D 회수 태그·brief 반영 경로 어디에도 없다.
- 조각① 은 결손이 아니라 설계 배제다. design-harness SKILL.md:151, design-interview SKILL.md:169 가 '좋은 디자인이 무엇인가는 하네스에 없다' 를 원칙으로 선언하고 rule_schema.md:50~51 이 앱 유래 근거를 overfit 으로 할인한다. 감사관 수정안 1(judge 가 references.md 수집)은 이 원칙과 정면 충돌하므로, 취향 '값'(사용자 반응에서만) 과 UX '패턴'(하네스가 수집해 장면으로 보여 줌) 을 구분하는 문장을 세 곳에 함께 넣지 않으면 judge 가 design-judge.md:21 을 근거로 수집을 거부하거나 수집물을 proposed 로 강등한다.
- design-interview SKILL.md:164 후반 '`design/verify/exit_interview_page.md` 존재·전건 PASS' 도 check-brief.js 에 없다(scripts/ grep 0건). 따라서 조각② 의 유일한 기계적 강제장치인 금지어 grep(0-B ④) 결과가 0단계 종료 시점에 검증되지 않는다 — worker(Haiku) 지시문에만 의존하며, 이는 D-30 이 3회 연속 실패했다고 기록한 바로 그 패턴이다.
- B-5 + rule_schema.md:35 조합: 자극 반응이 0건이어도 진술을 provisional 정본으로 채우면 B-5 통과. 갭4(≥5 하한 미구현)와 결합하면 '방향성을 좁히는' 0단계가 사용자 자극 피드백 없이 진술만으로 완주 가능하다. B-5 는 정본 열의 confidence 또는 근거 열의 R-/W- ID 존재까지 봐야 한다.
- design-harness SKILL.md:45 — fast 모드에서 예산 60% 소진 시 남은 열린 축을 하네스가 추천 픽으로 자동 확정하고 고지만 한다. 심사 기본 모드에서 2단계 조각③(축 좁히기)이 사용자 피드백 0건으로 끝날 수 있는 경로가 규칙으로 존재한다. 시간 압박 대응으로 타당하지만 U-3 관점에선 갭이다.
- 이중 계상: 감사관의 조각② 근거(interview_page 187·205, 금지어 grep, 실측 126·392)는 전부 시각 취향 타일·대비쌍으로 V-1 의 근거와 동일하다. U-3 고유의 UX 방향 피드백은 Q11 pushback 장면 3택(interview_page.html:68~71)과 2-E 뿐이며 둘 다 레퍼런스 유래가 아니다. U-3 채점은 이 둘에만 크레딧을 줘야 한다.
- Q4 경로가 full 모드에서 살아 있어도 흔적이 남지 않는다: 0-D 회수 규칙(SKILL.md:90~93)에 앱 언급 전용 태그가 없고, brief 에 사용자 언급 레퍼런스를 적는 칸이 없으며, templates/brief.md:82 가 `borrow_scope: element` 를 기본값으로 미리 채워 두어 B-7 은 항상 통과한다. 실측 4회 런에서 앱 언급 0건이라 이 경로는 한 번도 검증된 적 없다.
- fast 질문 세트가 세 문서에서 불일치: design-interview SKILL.md:12 는 Q1·Q2·Q6·Q8·Q11·Q12(Q5 없음), :65 는 Q1·Q5·Q2·Q6·Q8·Q11(Q12 없음), design-harness SKILL.md:19·interview_prompts.md:83 은 Q1·Q5·Q2·Q6·Q8·Q11·Q12. Q4 는 어디에도 없어 감사관 결론은 유지되지만, Q12(위임) 유무는 SKILL.md:163 '갤러리 반응 ≥5 또는 Q12 위임' 하한의 대안 경로가 fast 에서 존재하는지를 가른다.

### U-4 (partial)
- 조각④(필수 플로우를 체계적으로 찾는 장치): 0-A 에 '필수 플로우 대조 체크리스트'(첫 진입/온보딩·초대 보내기·초대받은 쪽 진입·미가입자 진입·역할별 랜딩·알림/리마인드·설정)가 없다. PRD 반박 트리거 4개(screen_derivation.md:25-30) 어디에도 '필수 플로우 부재'가 없어 `누락` 유형이 이 사유로 발동할 규정이 없다.
- 조각② (온보딩): §2 흐름표에 첫 진입/온보딩 화면을 반드시 넣으라는 규칙이 없다. design-draft-html:73 은 '흐름표에 있으면 포함'이라는 조건부이며, check-brief·check-html 어디에도 온보딩 화면 존재 검사가 없다. 강제된 것은 화면별 empty 상태(H-6)뿐이다.
- 조각② (온보딩, fast): 첫 화면을 묻는 Q10(interview_prompts.md:76)이 심사 기본인 fast 세트(:83)에서 빠지고, 시나리오(0-A 항목 2)에도 '첫 진입(빈 상태)부터 시작'이라는 요건이 없다.
- 조각③ (이해관계자 초대): screen_derivation.md:15 는 초대받은 쪽의 진입 화면 필요 여부를 '판단한다'고만 하고, 초대를 보내는 행위·공유 링크·참여자 관리 화면에 대한 규칙이 없다. 이 판단에 대응하는 check-brief 항목도 없다(역할 수·진입 경로 열은 검사하지 않음).
- 조각④ 역압력: screen_derivation.md:19 '번호가 안 붙는 화면은 없어야' 와 check-brief.js:49 B-3 이 PRD 번호 없는 화면 행을 FAIL 로 몰아, PRD 가 침묵하는 온보딩·초대 화면을 §2 에 넣지 않는 쪽으로 서브를 유도한다. PRD 밖 화면의 매핑 표기법(예: `X-nn`, `누락 P-nn`)이 정해져 있지 않다.
- 조각⑤ (구현 보장) 방향성: 2-G ②·2단계 종료조건·3단계 종료조건의 매핑·개수 검사가 전부 'PRD 기능 번호 → 화면' 한 방향이다. §10 에서 `누락·수정` 으로 결정된 플로우가 §2 → HTML → Figma 로 실제 이어졌는지 대조하는 검사가 없다.
- 실측 공백: docs/harness-defects.md 에 PRD 기능 누락(D-12·시험 3)은 검증됐지만 온보딩/초대 플로우 누락을 표적 시험한 기록이 없다. 2회차 런의 onboarding·guest_reply 화면(:262)은 규칙 없이 나온 재량 결과라 재현이 보장되지 않는다.
- ①⑤의 '검사' 가 스크립트가 아니다: check-html.js 는 H-1~H-10 만 있고 PRD 매핑·§2 개수 대조가 없다(28·30줄은 files.length 보고만). 2-G ②·종료조건 108·110·figma 150 은 전부 design-worker(Haiku) 판정 — D-30 이 '3회 연속 오판' 이라 기록해 0단계는 check-brief.js 로 대체했는데 2단계 매핑 검사는 같은 처방을 받지 않았다. 시험 3 도 검사기 실행이 아니라 가정 대조.
- 폐쇄 구조: design-maker.md:24(브리프에 없는 화면 추가 금지) + design-judge.md:21(근거 없는 탈락 금지) + design-interview/SKILL.md:54(0-A 종료조건 'PRD 기능 번호 매핑'). 이 셋이 결합하면 0-A 에서 §2 에 온보딩/초대가 빠진 순간 이후 어느 단계의 어느 에이전트도 그것을 추가하거나 FAIL 로 낼 권한이 없다. 감사관은 역압력을 screen_derivation:19·B-3 두 곳으로만 봤다.
- 라우팅 공백: C단계에서 '과업 불가' 로 화면 부재가 드러나도 c_checks §4 분류(local/direction/taste_gap/repeat) 중 §2 화면 추가로 돌아가는 lane 이 없다. direction 은 2-B 축 재발산(design-harness:139), repeat 는 사용자 브리핑. D-12 처치도 2-F 규칙 추가였지 '화면 부재 → 0-A §2 보강' lane 신설이 아니다.
- check-brief.js:53 B-4 는 §2b 행 수(≥3)만 센다. SKILL.md:159 사람용 설명('각각 시작 화면·기대 경로 존재')과 어긋나며, 시작 화면 열이 비어 있어도 PASS. 감사관 proposed_fix (4) 'B-4 확장' 은 B-4 가 현재 시작 화면을 읽지도 않는다는 전제부터 적어야 한다.
- full 모드에서도 Q10 보장 없음: design-harness/SKILL.md:19 는 full 본질문 ≤8(실제 2~4)인데 interview_prompts 질문 종류는 15개. design-interview/SKILL.md:12 는 full ≤12 라 두 문서가 불일치. 감사관은 fast 만 문제 삼았다.
- 0-A 항목 5 '미확정 사항 — PRD 가 침묵하는 것'(SKILL.md:48)은 누락 외 두 번째 통로인데 감사관이 언급하지 않았다. 다만 fast 는 Q11b 생략(interview_prompts:78)·상한 ≤3 이라 온보딩/초대가 여기 올라도 §6 가정으로 침묵 처리된다 — 통로가 아니라 하수구.
- proposed_fix (1) 'B-3 정규식을 /\d|F|기능|§|X-\d+|P-\d+/ 로 넓힘' 은 불필요 — 현재 /\d|F|기능|§/ 가 이미 P-01·X-01 을 통과시킨다. 필요한 것은 표기법 규정(brief §2 주석)과 SKILL.md:54·154 문구를 'PRD 기능 번호 또는 §10 P-nn' 으로 고치는 것.
- 2-D 페르소나 비평은 2-C 후보(대표 화면 1개, design-draft-html:43)만 보므로 '한 번 들어왔다 나가는 사람' 페르소나가 초대받은 쪽 진입 화면의 존재를 검토할 기회가 구조적으로 없다. 전체 화면 세트를 보는 것은 2-G 핵심 과업 추적(92줄)뿐이고 그것도 §2b 과업 범위 안이다.

### U-5 (partial)
- 조각① '각 사용자의 수준': Q7(연령·기기·익숙함)이 fast 세트(interview_prompts.md:83, design-harness:19)에 없어 심사 기본 모드에서 사용자 수준 입력이 0. brief §11 에 수준 필수 칸이 없고 check-brief B-13 은 줄 수만 센다. answer_translation.md 에 수준→디자인 결정 행이 없어 답을 받아도 규칙화 경로가 없다.
- 조각① '각 사용자의 상황(역할)': 역할별 페르소나 비평(draft-html 2-D:57)은 열린 축이 있을 때만 돈다(2-B:39). 열린 축 0 인 fast 런에서는 역할 반대편 사용자 검증이 한 번도 없다. brief §2·design.md §7 에 역할 열이 없고, check-brief 는 §11 의 역할이 §2 화면에 매핑됐는지 보지 않는다. 2-G·3-E 과업 추적은 '첫 사용자' 단일 관점.
- 조각② '직관적': 2-G(draft-html:92)·종료조건(:113)은 `불가` 만 FAIL 이고 `헤맴` 은 통과. 3-E 의 '첫 클릭 3순위 안'(figma-build:105)에 FAIL 결과가 정의되지 않고 종료조건(:153)이 c_report.json `tasks` 를 참조하지 않는다.
- 조각③ '필요한 정보 강조' 강제 사슬 구멍: (a) check-brief B-3(:49)가 §2 '1등 정보' 열을 검사하지 않음 (b) design-tokens 종료조건(:88)이 §5 행 수 == 화면 수·셀 공백 0 을 세지 않음 (c) 0-A 종료조건(interview:54)이 상태 순위표 존재·Q5 반영을 검사하지 않음 (d) fast 2-G 가 스크린샷을 생략(draft-html:91)해 1등 정보 대조가 Figma 뒤로 밀림 (e) c_report.json 스키마(figma-build:113-119)에 '§5 1등 정보 == 1콜 1순위' 필드·FAIL 라우팅이 없음. check-html H-9 는 주 행동만 보고 1등 정보 요소는 보지 않는다.
- 조각④ '최적화': local/direction 루프는 있으나 fast 상한(design-harness:26 'C 1 + 국소 수정 1회')에서 UX `direction` 실패는 재발산 없이 사용자에게 넘어간다 — 최적화가 아니라 보고로 끝난다.
- Q5 답·상태 강조 순위가 C 판정자에게 도달하지 않는다. screen_derivation:14 는 순위표를 brief §2 에 두라고 하지만 templates/design.md 에 그 칸이 없고 design-tokens 1-D(:73-81)가 복사하지 않으며, 2콜 화이트리스트(figma-build:99)와 2-G 화이트리스트(draft-html:88)는 brief 를 제외한다. 따라서 c_checks C-6 '사용자가 가장 자주 마주치는 상태(Q5 답)' 는 판정자가 알 수 없는 항목이다.
- fast ≤6 문항에서 Q2 '화면별로'는 화면 1개에만 가능하다. 나머지 화면의 1등 정보는 0-A judge 의 '후보'(SKILL:44)가 확인 없이 brief §2→design.md §5 정답지가 되는데, 후보에 [HYPOTHESIS] 태그·§6 가정 로그 기록을 요구하는 검사가 없다. 3-E 블라인드 대조는 결국 '하네스 가설 == 하네스 1차 인상' 대조가 된다.
- H-9 above-fold 분기는 maker 의 `data-above-fold="true"` 자기선언을 PASS 로 치고 '(judge 가 스크린샷으로 확인)'에 기댄다(check-html:63). fast 는 2-G 스크린샷을 생략하므로(draft-html:91) 하단 고정 바 밖의 주 행동은 승인 전에 한 번도 실물로 확인되지 않고 Figma A검사 13 까지 밀린다.
- design-interview/SKILL.md:12 의 fast 세트(Q1·Q2·Q6·Q8·Q11·Q12)에 Q5 가 없다. harness:19·interview_prompts:83·0-B(:65) 와 불일치 — 상태 강조 순위의 유일한 입력이 문서 드리프트로 빠질 수 있는 상태.
- 2-D 페르소나 비평(과업별 찾음/헤맴/불가)의 산출을 검사하는 종료조건이 없다. draft-html 종료조건(:107)은 §2 의 사용자 선택·이유만 보므로 judge 가 페르소나 1 추적을 생략해도 통과한다.
- harness:45 — 예산 60% 시점에 열린 축을 자동 확정하면 2-C~2-E 가 통째로 생략되어 fast 에서 2-D 역할별 검증이 실행될 확률이 감사관 추정보다 더 낮다.
- 기준 해석 오해 가능성: 하네스는 인터뷰이(오너)의 사용 순간(Q1)·손실(Q5)을 최종 사용자의 것으로 간주한다. 다역할 제품(작성자/수신자)에서 오너가 아닌 역할의 '상황·수준'은 사람 입력이 0 이고 LLM 페르소나(2-D)로만 대체되는데 그것도 조건부다. '각 사용자'를 '인터뷰이'로 좁혀 읽은 셈이다.
- c_report.json 종료조건(:153) '미분류 FAIL 0' 은 분류된 FAIL 이 남아도 통과로 읽힐 수 있는 문구다. tasks 의 헤맴/불가가 FAIL 항목으로 승격되는 조건은 UX 점수 <3(:108) 뿐이라 헤맴 2건·불가 0건은 점수 3 으로 FAIL 없이 종료될 수 있다.

### U-6 (partial)
- [이 모든 과정 — 총 호출 수] '사람 개입 지점 5곳 + 예외 2, 그 외는 하네스 결함'(design-harness:9,113) 이 서술뿐이다. 런 전체에서 사용자를 부른 횟수·종류를 기록하는 칸(state.json·interview_raw.md 전용 태그)이 없고, 허용 목록 밖 호출을 FAIL 로 잡는 종료조건도 없다. 결함으로 정의만 하고 검출할 수 없다.
- [적절한 수준 — 형식] 호출 품질 게이트 4항(design-harness:115)은 산문이다. 채팅으로 나가는 질문 전부(되묻기·[CONSTRAINT] 충돌·taste_gap·BLOCKED 승격·상한 초과 시 '진행/보정/중단'·repeat 브리핑)에 4항을 강제하는 메시지 골격·기록 태그·검사가 없다. 2-H(design-draft-html:100)만 4항을 열거하지만 역시 산문.
- [적절한 수준 — 어휘] 금지어 13개 grep 은 0단계 인터뷰 페이지에만 있다(design-interview:79 ④). 1단계 세트 설명(design-tokens:39 '디자인 용어 없이')·design_guide_compare.html, 2단계 compare_axis<n>.html·index.html 승인 질문, 3단계 taste_gap 질의문에는 서술만 있고 종료조건 grep 이 없다.
- [적절한 수준 — 양] 되묻기 ≤3턴·같은 질문 3회 금지(design-interview:99)는 서술뿐이다. raw 에 되묻기 전용 태그가 없어 셀 수 없고 check-brief.js B-15 는 답변≥질문만 센다. 인터뷰 페이지의 질문 수 ≤ human_interview_questions_max 검사(design-interview:79 ③)는 스크립트가 아니라 worker(Haiku) 판정이다 — D-30 이 worker 판정의 오탐·파일 미생성을 실측했는데 인터뷰 페이지 검증은 아직 check-brief.js 처럼 스크립트화되지 않았다.
- [적절한 수준 — 위임 수준 반영] Q12(interview_prompts:79)로 사용자가 '이 외는 네가 정해' 라고 답해도 그 답이 1단계 토큰 선택·2단계 축 선택 호출을 줄이는 규칙이 없다. 위임 답은 0-E 의 미답 처리(design-interview:101)에만 쓰인다. design-harness:45 의 '60% 예산 시 자동 확정·고지만' 규칙은 위임 답과 연결되지 않는다.
- [BLOCKED 가 게이트를 못 넘을 때] design-harness:99 는 '게이트 통과 시 승격' 만 정하고, 4항을 채울 수 없는 BLOCKED 의 처리(기본값 가정으로 강등·§6 기록)가 없다. 침묵 정지 또는 게이트 미달 질문 둘 다 가능하다.
- [실측 공백] harness-defects.md 에 '타이핑 0줄·되묻기 3턴·BLOCKED→사용자 해소' 는 있으나 런 전체의 사용자 호출 총수·게이트 4항 준수율은 어느 런에서도 측정되지 않았다. D-10(같은 지적 3회)·D-26/D-33(오너 지적) 은 하네스가 묻기 전에 사용자가 결함을 찾아야 했던 반례로 남아 있다.
- [모르겠음 완충 미강제] interview_page.html:173 의 '모르겠음' 버튼은 `if (q.unknown)` 조건부이고, design-interview:79 생성물 검증 ③ 에는 '전 질문 unknown:true' 항목이 없다. maker 지시(:65 '항상')뿐이라 감사관 evidence 의 '형식으로 강제됨' 은 성립하지 않는다.
- [0단계 스크립트 게이트가 인터뷰 페이지 검증을 안 본다] design-interview:146 은 종료조건 목록을 '스크립트가 검사하는 항목' 이라 하지만 check-brief.js(T-0·B-1~B-15)에는 :163 의 meta-status 일치·갤러리≥5 또는 Q12 위임, :164 의 exit_interview_page.md 존재·전건 PASS 가 없다. 질문 수 ≤상한·금지어 grep 이 한 번도 안 돌아도 0단계는 PASS 다. 감사관 gap 4 는 'worker 판정이라 약하다' 까지만 봤고 '스크립트가 그 결과를 요구하지 않는다' 는 못 봤다.
- [Q12 fast 포함 여부 불일치] 위임 질문 Q12 가 fast 세트에 있는지가 design-harness:19(있음)·design-interview:12(있음, 대신 Q5 누락)·design-interview:65(없음)·interview_prompts:83(있음) 에서 다르다. 페이지 세트(:65)를 따르면 답변이 절반 이상일 때 Q12 는 아예 묻지 않아 조각 ④ 의 진입점이 사라진다.
- [BLOCKED 승격에 '사용자 수준' 필터 없음] design-harness:99 는 게이트 4항 통과 시 BLOCKED 를 사용자 질문으로 승격한다. 4항은 완결성(무엇·선택지·추천·영향)만 보고 '비전문가가 답할 질문인가'(I-5) 를 보지 않으며, design-maker:18 의 문턱도 영향 크기다. 3회차 시험 1 의 BLOCKED(한글 키 슬러그화)는 메인이 해소했지만 규칙 문장대로면 사용자에게 갔을 질문이다.
- [상한 초과·repeat 브리핑의 어휘] design-harness:67·design-figma-build:139 는 상한 초과 시 FAIL 목록(C-1~C-9·A검사 번호)을 그대로 들고 사용자에게 '진행/보정/중단' 을 묻는다. 0-H(:136)의 '디자인 용어는 괄호로 쉬운 말 병기' 같은 변환 규칙이 여기엔 없어 조각 ① 이 3단계 끝에서 깨진다.
- [Q11 반박에 하네스 추천 슬롯 없음] 인터뷰 페이지 pushback 형식은 A/B/PRD대로 3택이고(templates/interview_page.html:68~72 샘플, design-interview:65 규정) 하네스가 어느 쪽을 권하는지 표시하는 필드가 없다. 결정 질문에는 추천을 먼저 밝히라는 게이트 4항 ③·I-5 원칙이 채팅 호출에만 있고 페이지 형식에는 빠졌다. 반대로 취향 질문(1-C·2-E)에는 추천 후공개(앵커링 방지)가 있어 하네스가 두 종류를 구분은 하되 Q11 만 누락된 형태다.
- [2-E 축 선택은 반응 형식의 결정 위임] design-draft-html:36~38 의 열린 축은 내비게이션 구조·주도권·진입 방식 같은 UX 구조 결정인데 :67 은 '어느 쪽이 더 쓰기 편해 보이나요' 로 사용자에게 고르게 하고 추천은 뒤에 공개한다. I-5·U-5 의 취지(구조는 전문가가 정하고 방향·취향만 묻는다)와 긴장 관계 — 최소한 '추천 후공개' 가 취향 질문에만 맞는 장치인지 재검토 필요.
- [감사관 confidence 과대] 근거 43건 중 강제 장치가 실제로 있는 것은 0단계 소수이고, 0단계 '기계 판정' 주장도 위 2번처럼 스크립트-문서 불일치가 있다. coverage=partial 은 맞지만 confidence=high 는 medium 으로 낮추는 것이 근거 무게에 맞다.

### V-1 (partial)
- [0단계 — 문서와 스크립트 불일치] design-interview/SKILL.md 종료조건(163~164행)의 '갤러리 반응 ≥5 또는 Q12 위임' · 'meta-status.answered == raw 항목 수' · 'exit_interview_page.md 존재·전건 PASS' 가 check-brief.js(T-0, B-1~B-15)에 구현되어 있지 않다. UI 방향 피드백이 실제로 수집됐는지·발행 전 검사가 실제로 통과했는지를 기계가 세지 않는다.
- [1단계 토큰 세트 — 강제 장치 없음] '설명은 체감으로·디자인 용어 없이'(39행), '⑦ 적용 예시 나란히'(42행), '축 이름·감성 키워드 숨김'(43행), '세 후보는 체감이 달라야'(39행)가 전부 서술이다. 종료조건(85~90행)은 `chosen` 기입만 본다. design_guide_compare.html 존재·세트 수·적용 예시 포함·사용자 문구 금지어 0건·세트 간 실제 차이(서체/primary/radius) 검사가 없어 0단계 ⑥(D-32 처방)에 해당하는 검사가 1단계에 없다. T-01 원문이 raw 에 있는지도 검사하지 않는다.
- [3단계 taste_gap — 시각 자료 없이 질문] 3-F 표(135행)는 '사용자에게 질의(호출 품질 게이트 4항)'만 규정한다. C 판정에서 취향 공백은 정확히 UI 방향성을 묻는 순간인데 최신 스크린샷 첨부·좌/우 대안 렌더 제공·raw 기록 형식(W-/R- 처럼) 규정이 없고, design-harness 호출 품질 게이트(115행)에도 '시각 판단은 렌더 첨부' 항이 없다.
- [2단계 2-E·2-H — 사전 검사·문구 규정 부족] compare_axis<n>.html 이 후보 2개를 실제로 포함하는지, 사용자에게 보이는 문구에 금지어가 없는지 검사가 없다. 2-E 질문이 '쓰기 편해 보이나요'(UX)뿐이라 보이는 느낌(UI 방향)에 대한 반응 칸이 없다. 종료조건(105~114행)에 index.html 존재·링크 수 == 화면 수 항목이 없다(2-F 84행은 요구만).
- [0-H 규칙표 ack] '디자인 용어 statement 는 괄호로 쉬운 말 병기'(136행)가 서술뿐이며 금지어 grep 이나 병기 존재 검사가 없다.
- [실측 공백] harness-defects.md 의 '쉬운 수준' 실측(D-6·D-27·검증 3)은 전부 0단계 인터뷰 페이지에 대한 것이다. 1-C 세트 선택·2-E 축 선택·2-H 승인에서 사용자가 실제로 쉽게 답했는지(타이핑 줄 수·소요·되묻기)의 기록이 없다.
- [0단계 ⑥ 검사 범위] 0-B 표(68~75행)는 6축 전부에 '변형 사이에 반드시 달라야 하는 것' 을 정했지만 발행 전 검사 ⑥(79행)은 타이포(font-family)·형태(border-radius)·밀도(행 수) 3축만 grep 한다. 색온도(hue)·강조 방식·채도 축은 D-32 형 '자극이 아닌 타일' 이 0단계에서도 통과한다.
- [0단계 발행 전 검사가 스크립트가 아님] ①~⑥(exit_interview_page.md)은 worker(Haiku) 절차다. ⑥ 은 JSON 타일을 축별로 묶어 CSS 값을 대조해야 하므로 한 줄 grep 이 아니며, D-30 이 '세는 일을 worker 판단에 맡기면 3회 연속 틀렸다' 고 기록한 것과 같은 형태다. check-brief.js 를 만든 이유가 인터뷰 페이지 검사에는 적용되지 않았다(check-interview-page.js 부재).
- [금지어 개수 불일치] interview_prompts.md 19행 목록은 14개(정보 밀도·위계·톤앤매너·그리드·여백·대비·무드·컨셉·미니멀·모던·레이아웃·컴포넌트·플로우·IA)인데 design-interview/SKILL.md 65·79행은 '금지어 13개' 라 적는다. 숫자를 보고 grep 패턴을 만드는 worker 가 하나를 빠뜨려도 검사 항목 수로는 맞는다.
- [2-E 시각 자료 미게이트] check-html.js 28행 glob 은 screen_*·axis* 만 잡고 compare_axis<n>.html 은 제외하며, 스크립트 실행 시점은 2-G(2-E 선택 이후)다. 즉 2-E 에서 사용자가 보는 후보 HTML(axis*_a/b)과 비교 페이지는 어떤 결정론 검사도 거치지 않은 채 열린다 — 미선언 변수·hex 리터럴로 깨진 렌더에 대한 반응이 D-<축> 로 기록될 수 있다.
- [시간 예산이 V-1 수집 지점을 삭제] design-harness 45행: 예산 60% 시점에 2단계 승인 전이면 남은 열린 축을 하네스가 추천 픽으로 자동 확정하고 '고지만' 한다. fast 모드(열린 축 ≤1)에서는 2-E 피드백이 통째로 사라질 수 있는데, 이 경우 가정 로그 외에 사용자 피드백 대체 기록 요구가 없다.
- [0-H ack 가 텍스트 표] 0단계에서 사용자가 UI 방향 해석을 최종 확인하는 지점(0-H)이 'RULE-ID | statement | source_quote | confidence' 텍스트 표다. 비전문가가 '같은 위계의 목록 행은 한 가지 구분 방식만' 같은 statement 를 텍스트로 검증하는 것은 라벨형에 가깝다 — 규칙마다 근거 타일(G-xx) 썸네일을 옆에 붙이는 것이 자연스러운데 규정도 검사도 없다. 감사관은 괄호 병기 미검사만 지적했다.

### V-2 (partial)
- 조각① '의도된 바'=2-H 에서 사용자가 승인한 HTML 초안: Figma 가 그 승인본과 같은지 직접 대조하는 장치가 없다. 3-E 2콜 화이트리스트(L99)와 c_checks L4 에 초안 HTML·초안 렌더 PNG 가 없고, 승인본↔구현본 다리는 A-8(components.md 크기 ±30%)·A-6(variant)·종료조건 화면 수 대조뿐이다. 화면별 요소 구성·순서·텍스트 내용·1등 정보 위치·상태 3종(normal/empty/long) 내용이 초안과 일치하는지는 어디서도 세지 않는다.
- 조각② A단계 보완 항목 8~14(크기 sanity·프레임 규격·고정 요소 겹침·텍스트 오버플로·주 행동 가시성·내용 절단)는 SKILL 서술 + design-worker(Haiku) 즉석 스크립트에 기대며 audit-core 카탈로그에 없거나(8·9·10·13·14) 미구현(text_overflow)이다. 검출력이 실측된 것은 A-7 뿐이다. '검사만 지켜진다'는 하네스 원칙 기준으로 절반 충족.
- 조각② 3단계 종료조건 6항목은 design-worker 가 판정한다(harness L65, figma-build L147~154). 0단계는 D-30 으로 check-brief.js 로 옮겼으나 3단계에는 check-figma.js 같은 결정론 검사기가 없다 — 링크 일치·JSON 유효·개수 대조·passed_machine·c_report 미분류 FAIL 0·final_ack 는 전부 산술인데 worker 판단에 남아 있다.
- 조각② 3-G '메인 직접 확인 기록'과 requires_human_review 확인 기록의 형식·파일이 정해져 있지 않다(L143, L152 는 '기록 존재'만). 하네스 원칙(근거를 적으려면 열 수밖에 없게 형식으로 막는다)이 여기에는 적용되지 않았고, defects L375 가 '다음 런 관전 포인트'로 미검증 표시.
- 조각① 흐름 의도(brief §2 진입 경로)의 구현 정확도 검사가 없다. 3-C 는 '프로토타입 연결(brief §2 진입 경로)까지'를 요구하지만(L57) A검사 항목에 reactions 존재·목적지 대조가 없고, C UX 과업 추적은 스크린샷 순서 기반이다.
- 조각③ 승인 대상인 HTML 초안 자체의 시각(§4C·§5) 점검은 aside-browser 가능 시에만, fast 모드는 생략(draft-html L91). 사용자가 승인하는 근거물이 시각 검증 없이 승인될 수 있어 3-E 대조의 기준 이미지가 남지 않는다.
- c_report.json 고정 스키마(figma-build L113~119)에 '§5 1등 정보 == 1콜 1순위' 판정·전량 대조 시트·SLOP-SWEEP 을 담을 칸이 없다(checks[]는 C-n id, positive/tasks/score 뿐). 의도 대조의 핵심 결과가 c_report.md 자유 서술로만 남아 메인이 파싱·라우팅할 수 없고, c_first_impression.json 도 스키마가 없다.
- figma-build L35 '바인딩·리터럴 일치를 A검사 1 이 본다' 는 검사기 실체와 다르다. audit-core 는 color_allowlist(리터럴∈팔레트)와 style_bound fill(바인딩 존재)을 독립으로 볼 뿐이고 serializeNode(L174)가 boundVariables 의 키만 직렬화해 변수값 대조가 불가능하다. 바인딩은 primary 인데 리터럴이 팔레트 내 neutral 이면 둘 다 통과 — 실측 사고(리터럴 검정)와 같은 부류가 팔레트 내 색이면 재현된다.
- templates/state.json 에 3단계 종료조건이 요구하는 칸이 없다: L151 '메인 직접 확인 기록', L152 'requires_human_review 확인 기록', draft-html L103 '승인 후 변경 감지' 용 승인 시점 초안 해시/화면 수. figma 섹션은 c_rounds·c_fail_reasons 뿐, human_gates 는 draft_approval(approved/at/quote)·final_ack 뿐이라 worker 가 셀 수 없는 종료조건이다.
- A-8(크기 ±30%)의 기준값은 maker 가 components.md 4열에 자기 선언한 크기다(2-F L74~80). HTML 렌더 실측이 아니므로 승인본→구현본 유일 다리조차 서브 자기 보고에 기대고, D-22 처럼 산문으로 쓰면 미발동한다.
- 3-A 변수 생성 뒤 'tokens.json leaf 수 == Figma Variables 수' 대조가 없다. 2-A 는 leaf 수 검사(L29)로 HTML 쪽 누락을 잡지만, 종료조건 L150 은 variables 섹션 '존재' 만 본다 — Figma 쪽 토큰 누락은 A검사 1 이 간접적으로만(누락 토큰을 쓴 노드가 있을 때만) 잡는다.
- audit-core `passed`(미구현 blocker 까지 사람 확인 후 참)를 누가 어떤 절차로 올리는지 규정이 없다(L152~153 주석 '리포트에서 사람이 올린다' 뿐). 종료조건은 passed_machine 만 쓰므로 unchecked blocker 확인은 '기록 존재' 라는 형식 없는 항목에만 남는다.

### V-3 (partial)
- [검증·강제] c_checks §2 긍정형 매력 판정은 '이걸 통과해야 최종 PASS' 라고 쓰였지만 3단계 종료조건(figma-build 153줄)은 '미분류 FAIL 0' 만 본다. c_report.json 의 positive 5항목이 false 여도 FAIL·진단·라우팅으로 이어지는 규칙이 없고, §2 의 7항목과 JSON 5항목이 불일치한다.
- [검증·강제] 자체 채점 1·3·5 는 '신호일 뿐 게이트 아님'(c_checks 102, figma-build 108). 'score<3 이면 FAIL 항목 필수' 는 서술만 있고, c_report.json 을 세는 결정론 스크립트(check-brief.js·check-html.js 에 상응하는 check-c-report.js)가 없다 — 이 하네스의 원칙(문장은 안 지켜지고 검사만 지켜진다)에 비추면 절반 충족.
- [검증·시점] 심사 기본인 fast 모드에서 Figma 전 유일한 미감 육안 점검(2-G §4C 스크린샷)이 생략되고(harness 25줄) C 라운드가 1+1(26줄)이다. 미감은 Figma 구현 뒤 한 번만 검증되며, `direction` 급(C-2·C-4·C-5·C-7) 실패는 2-B 재발산으로 가야 하므로 40분 예산에서 사실상 되돌릴 수 없다.
- [검증·2단계] 2-D 교차 비평 페르소나 3개(UX·적합성·구현 호환)에 UI 심미 관점이 없다(draft-html 57~60줄). 채점 3축 중 UI 축만 2단계 후보 선택에서 판정되지 않는다.
- [검증·기계] check-html.js 에 grep 으로 잡히는 C-5 항목(linear-gradient 배경·backdrop-filter·이모지 아이콘·#000 텍스트 색·모든 카드 동일 box-shadow·repeat(3,…) 균등 grid)과 C-7 제목/본문 배율(tokens.css 에서 계산 가능)이 없다. audit-core 의 contrast_ratio·saturation_max 는 미구현이라 사람 게이트로 넘어간다. 1-B 토큰 검사는 대비·단조성만 보고 순수 검정 텍스트(C-8)·순수 회색+유채색 회색 혼용(C-1)·그림자 3단계 차이(C-5) 를 세트 노출 전에 걸러내지 않는다.
- [보조] design-maker 의 HTML·Figma 브리프 화이트리스트(draft-html 43·73줄, figma-build 41·54줄)에 슬롭·균일함 카탈로그(c_checks C-5·C-7·C-8, §2)가 없다. maker 가 받는 layout_rules.md 는 스스로 '미감이 아니라 실데이터 붕괴' 문서라고 선언하고(4줄) 존재하지 않는 aesthetic-checks.md 를 가리킨다. 생성 측 미감 지침은 design.md §10 의 5줄 서술뿐이라 '높게 구현되도록 보조' 조각이 얇다.
- [보조·자극 QA] 2회차 런(D-6, 129줄)에서 judge 가 갤러리 자극의 미감을 5축으로 채점했으나 현재 0-B 발행 전 검증(interview 79줄 ①~⑥)에는 이 QA 가 없다. 사용자가 반응할 자극이 조잡하면 역추출된 미감 기준도 조잡해지는데 이를 막는 장치가 빠졌다.
- [사용자 수준] 미감 **방향**(6축·§4C·금지 목록·taste_gap)은 잡지만 **수준**은 잡지 않는다. 인터뷰 뼈대(interview_prompts §6, fast 세트 83줄)에 원하는 완성도를 장면형으로 묻는 질문이 없고, 3-G ack(figma-build 145줄)에서 사용자는 1·3·5 자체 채점·긍정형 판정 결과를 쉬운 말로 보지 못한 채 'C 판정 요약 3줄' 로 마무리를 결정한다. 실측(391줄)에서 UI 축이 3(신입)에 머물렀는데 그것이 사용자에게 고지되거나 재작업을 촉발했다는 기록이 없다.
- [검출력 검증] A검사는 합성 케이스로 검출력을 시험했지만(D-15 시험 2) C단계는 심어 놓은 슬롭을 잡는지 시험한 기록이 없다. 미감 결함 4건(D-10·D-11·D-26·D-33)이 모두 오너가 먼저 잡았고 카탈로그는 사후에만 자랐다.
- [검증·기계 모순] scripts/check-html.js:42 H-4 가 `#000`·`#fff` 를 hex 리터럴 검출에서 명시적으로 제외한다(`!/^#(fff|000)/i`). c_checks C-8(74줄) '본문·제목에 순수 검정 실패' 와 정면 충돌 — 유일한 결정론 HTML 검사가 슬롭 패턴 하나를 화이트리스트에 넣어 둔 셈이다.
- [문서 불일치] c_checks.md:90 긍정형 '브랜드 장치' 항목이 'design.md §8 의 브랜드 장치' 를 가리키지만 templates/design.md 는 §8 을 적합성 기준, 브랜드 장치를 §10(108줄)에 둔다. 2콜 판정자는 design.md+c_checks 만 받으므로(figma-build:99) 엉뚱한 절에서 장치를 찾게 된다.
- [채점 매핑 누락] c_checks.md §3(96~100줄) 3축 매핑에 C-5(AI 슬롭)가 어느 축에도 없다. harness:11 의 'UI 1점 = AI 슬롭' 정의와 판정 항목이 연결되지 않아 자체 채점 UI=1 의 근거 항목이 문서상 없다.
- [fast 구조] c_checks §2 는 '부정형을 다 통과한 뒤에만' 적용된다(82줄). fast 는 C 라운드 1 + 국소 수정 1회(harness:26)라, 1라운드에서 local FAIL 하나라도 있던 화면은 긍정형('높게') 판정을 끝내 받지 못한 채 종료될 수 있다 — 감사관 갭 #1·#3 보다 더 구조적이다.
- [리포트 상한] c_report.md 는 fast ≤50줄(harness:41)인데 화면 8×상태 3 = 24프레임에 1차 목적·긍정형 7항목·3축·FAIL ≤5건을 담아야 한다(실측 44줄). JSON 은 상한이 없으므로 md 는 요약으로 퇴화하고, 메인·사용자가 읽는 것은 md 다.
- [2-D 렌더 부재] draft-html 2-D 화이트리스트(57줄)는 후보 HTML + design.md 뿐이고 스크린샷·aside-browser 언급이 없다. design-judge 규칙 4(PNG 를 열지 않은 육안 판정 무효)에 따르면 2-D 는 §4C 를 판정할 자격 자체가 없다 — UI 페르소나를 추가해도 렌더 경로가 없으면 동일.
