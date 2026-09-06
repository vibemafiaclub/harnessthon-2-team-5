# oss-design-harness

**현업 디자이너의 판단 기준(안목)을 추출해, 에이전트에 최적화된 형태로 재구성하는 Figma-네이티브 디자인 하네스.**

VIBE MAFIA CLUB 하네스톤 2회차(2026-09-05)를 계기로 이너서클 코파운더들과 함께 만드는 오픈소스 프로젝트입니다.
지향점: `ui-ux-pro-max` 급, 현업에서 쓸 수 있는 수준의 skill.

## 이 레포의 상태

**절차는 있고 취향은 비어 있습니다.** 4단계 파이프라인·서브에이전트·산출물 양식은 실행 가능한 형태로 갖춰져 있지만, "무엇이 좋은 디자인인가" 에 해당하는 판단 기준 값은 한 줄도 미리 채우지 않았습니다. 전부 사용자 반응에서 나옵니다.

- 판단 기준의 실제 내용(예: "무엇을 보고 고급스럽다고 판단하는가")은 **하네스톤 참가자·코파운더가 실제로 채워야** 의미가 있습니다.
- 미리 채워서 예시로 주면, 참가자가 자기 안목을 꺼내는 대신 이미 있는 답을 검토하는 일이 되어 버려 원래 목적(다양한 디자이너의 독립적 안목 수집)이 오염됩니다.
- 그래서 지금은 각 섹션에 `TODO`만 있고, 예시 2~3개만 남깁니다.

## 프레임워크 — 4단계 판단 구조

디자이너가 일하는 **순서**를 그대로 흉내내지 않습니다. 사람이 순서대로 일하는 이유의 상당수는 사람의 기억력·주의력 한계를 우회하는 것이지, 결과가 좋아지는 진짜 원인이 아닙니다. 대신 각 단계가 실제로 하려던 일(**판단 기준**)만 뽑아서, 에이전트가 잘하는 방식(병렬 생성, 다각도 교차 비평)으로 다시 구현합니다.

| 단계 | 시점 | 하는 일 |
|---|---|---|
| **0. 요구사항 정렬** | 화면을 만들기 **전** | 뭘 만들지 자체가 불확실할 때, 레퍼런스/시나리오를 보여주고 반응(좋다/싫다+이유)을 받아 암묵적 판단기준을 뽑아낸다. 라벨형 질문("모던한 게 좋으세요?") 금지. |
| **B. 발산·수렴** | 만드는 도중, 정답이 여러 개일 때 | 독립적인 축(무드/밀도/난이도 등)을 먼저 나누고, 축마다 후보를 병렬 생성해 비교·수렴한다. |
| **A. 구조적 사실 검증** | 다 만든 후 | 데이터로 예/아니오 확인 가능한 것 (spacing, 컴포넌트 재사용, 네이밍, variant 존재 여부). |
| **C. 미적·게슈탈트 판단** | 다 만든 후 | 스크린샷을 렌더해서 실제로 봐야만 아는 것 (색온도 일관성, 위계, 여백 리듬, 클리셰 여부, 엣지케이스 완성도). |

C단계에서 탈락하면 원인에 따라 세 갈래로 라우팅한다 — ① 국소 결함(그 속성만 고쳐 C 재검) ② 방향 자체가 틀림(B로 회귀) ③ 반복 실패(0으로 에스컬레이션). 재시도 상한을 두고, 최종 판단은 항상 사람이 내린다.

자세한 배경·논리 검증 과정은 킥오프 자료(`docs/concept.md`) 참고.

## 구조

```
.claude/skills/design-harness/SKILL.md        # ★ 진입점(오케스트레이터) — 명령 하나로 0→3단계, state.json 으로 재시작
.claude/skills/design-interview/SKILL.md      # 0단계: PRD 기반 인터뷰 → 자극(갤러리·월드컵·시나리오) 반응 → 판단기준 역추출 → brief.md
.claude/skills/design-interview/references/   #   인터뷰 원문 프롬프트·질문 뼈대 / 8필드 규칙 스키마·감사 절차 / 화면 도출·PRD 반박 / 답변 번역표
.claude/skills/design-tokens/SKILL.md         # 1단계: 토큰 세트 후보 → 스와치로 선택 → tokens.json + design.md
.claude/skills/design-draft-html/SKILL.md     # 2단계(B): HTML 후보 병렬 발산·교차 비평·선택·승인 → decisions.md, drafts/
.claude/skills/design-draft-html/references/  #   layout_rules.md — 실제로 깨진 레이아웃 14유형(판정 기준·빈발 사례·수정 방침)
.claude/skills/design-figma-build/SKILL.md    # 3단계(A/C): Figma MCP 구현 → A 기계 검사 → C 육안 판정(2콜 블라인드) → 라우팅 → 링크
.claude/skills/design-figma-build/references/ #   c_checks.md — C단계 판정 기준 원본(1차 목적 선언 → 부정형 C-1~C-9 → 긍정형 매력 판정)
scripts/audit.js · extract-nodes.js           # A게이트 결정론 검사기(LLM 아님) · use_figma 1회 순회 노드 덤프
scripts/build-rules.js · check-html.js        # tokens.json → project.rules.json 생성 · 2단계 HTML 승인 전 정적 검사
guide/core.rules.json · README.md             # L1 고정 하한선(접근성·터치·잘림) · 규칙 스키마/check.type 카탈로그
scripts/eval.sh · evals/                      # 성격이 반대인 픽스처 3종 평가 루프 + 회귀 판정
.claude/skills/oss-design-harness/SKILL.md    # 4단계 판단 원칙 요약(참가자용 뼈대)
.claude/agents/design-judge.md                # 판단형 서브에이전트 — Opus 5 · high
.claude/agents/design-maker.md                # 생성형 서브에이전트 — Sonnet 5 · medium
.claude/agents/design-worker.md               # 기계형 서브에이전트 — Haiku · low
templates/brief.md · design.md · tokens.json · decisions.md · state.json   # 산출물 양식
docs/concept.md                               # 컨셉 스펙 전문
docs/prd.md                                   # 예시 PRD (청첩장모임 스케줄러)
```

## 파이프라인 (명령 하나)

```
/design-harness docs/prd.md [figma-url]
```

```
PRD ─▶ 0 인터뷰 ─▶ brief.md ─▶ 1 토큰·가이드 ─▶ tokens.json + design.md
   ─▶ 2 HTML 초안 (병렬 발산 → 선택 → 승인) ─▶ decisions.md, drafts/
   ─▶ 3 Figma MCP 구현 ─▶ A 기계 검사 ─▶ C 육안 판정 ─▶ 라우팅 ─▶ Figma 링크
```

- **인터뷰 대상은 디자인 비전문가.** 사용자는 보여 주는 것에 반응(좋다/싫다/애매 + 왜)만 하고, 기준은 하네스가 역추출한다. 라벨형 질문("모던한 게 좋으세요?") 금지.
- **HTML 먼저, Figma 는 승인된 것만.** Figma MCP 직접 구현은 비싸고 느려서, HTML 로 싸게 발산·승인한 뒤 한 번만 구현한다. 둘은 같은 `tokens.json` 을 읽는다.
- **사람 개입 지점 5개 고정**: 인터뷰 답변 · 갤러리/월드컵 반응 · 토큰 세트 선택 · 초안 승인 · 최종 확인. 그 밖에서 사용자를 부르면 하네스 결함.
- **메인 세션 = 사용자와 대화하는 것만.** 나머지는 파일 기반 브리프로 서브에이전트에 위임. 만든 쪽 ≠ 판정하는 쪽.
- **재시작 가능**: `design/state.json` 을 읽어 중단된 단계부터 이어간다. 사용자 발화는 1건마다 `design/interview_raw.md` 에 즉시 기록.

## 모델·effort 정책

| 역할 | 모델 | effort | 예 |
|---|---|---|---|
| 메인 세션 | Opus 5 (권장) | medium | 인터뷰, 반응 수집, 승인 게이트 |
| design-judge | Opus 5 | high | 규칙화, 인용 감사, 교차 비평, C단계 판정 |
| design-maker | Sonnet 5 | medium | 갤러리·토큰 세트·HTML 초안·Figma 구현 |
| design-worker | Haiku | low | 변환, 종료조건 검사, WCAG, A단계 노드 검사 |

메인 세션의 모델·effort 는 `/model`, `/effort` 로 사용자가 정한다. 서브에이전트는 `.claude/agents/*.md` frontmatter 로 고정된다.

## 사용법

1. Figma MCP 를 연결하고(플러그인 `figma`), 이 레포를 프로젝트 루트로 Claude Code 를 실행한다.
2. `/design-harness docs/prd.md` (Figma 파일 URL 이 있으면 뒤에 붙인다. 없으면 하네스가 새 파일을 만든다.)
3. 하네스가 보여 주는 것에 반응만 한다. 약 30분 인터뷰 후 나머지는 승인 2회와 최종 확인.
4. 산출물은 `design/` 폴더. 제출은 `design/figma.md` 의 링크와 사용 모델 목록.

단계를 따로 돌릴 수도 있다: `/design-interview docs/prd.md`, `/design-tokens`, `/design-draft-html`, `/design-figma-build <url>`.

### 심사 모드 (처음 보는 PRD 를 비전문가가 한 번에)

```
/design-harness <심사용 PRD 경로> --budget 40m
```

- 상한이 자동으로 줄어든다(질문 ≤6, 갤러리 ≤12, 열린 축 ≤1, C 라운드 1). 생략된 것은 전부 가정 로그에 남는다.
- 사용자는 **답하고 고르기만** 한다. 파일을 열거나 자료를 찾아오는 일은 없다.
- 답이 짧거나 "모르겠음" 이 이어지면 하네스가 질문을 줄이고 고르기(갤러리·대비쌍)로 바꾼다.
- 채점 3축 — UI 심미 · UX 직관 · 적합성(그 회사의 서비스 같은가) — 을 C단계가 자체 채점(1/3/5)해 `design/figma.md` 에 적는다.
- PRD 는 그대로 따르지 않는다. 하네스가 반박하고 사용자에게 쉬운 말로 확인받은 결정이 `design/brief.md` §10 에 남는다.

## 확장 지점 (조별 하네스를 팀 하네스로 합칠 때)

다른 조의 내용을 끼울 자리. 여기만 건드리면 파이프라인은 그대로 돈다.

| 끼울 것 | 파일 | 위치 |
|---|---|---|
| 인터뷰 질문 뱅크 | `.claude/skills/design-interview/references/interview_prompts.md` | §6 표에 행 추가 (캐내는 것 · 질문 형태 · 태그) |
| 자극 갤러리 축 | `.claude/skills/design-interview/SKILL.md` | 0-C "축 6개" 목록 |
| 판단기준 스키마 필드 | `.claude/skills/design-interview/references/rule_schema.md` | 필드 표 |
| 비평 페르소나 | `.claude/skills/design-draft-html/SKILL.md` | 2-D 페르소나 목록 |
| A단계 기계 검사 항목 | `.claude/skills/design-figma-build/SKILL.md` | 3-D 내장 6항목 |
| C단계 육안 판정 항목 | `.claude/skills/design-figma-build/SKILL.md` | 3-E 2콜 대조 목록 |
| 토큰 분류 체계(6카테고리) | `templates/tokens.json` | 그룹 추가 시 `rationale` 필드 유지 — 출처: 팀 디자이너 `prd-to-design-guide` 스킬 |
| 하네스 고정 하한선(접근성 등) | `templates/design.md` | §3 제약사항 |
| 서브에이전트 모델·effort | `.claude/agents/*.md` | frontmatter |
| 기계 검사 규칙(결정론) | `guide/core.rules.json`(L1) · `scripts/build-rules.js`(L2 생성) · `design/project.rules.json` `project_specific`(L3) | 새 `check.type` 은 `guide/README.md` 카탈로그와 `scripts/audit.js` CATALOG 를 **함께** 고친다 |
| 레이아웃 파손 카탈로그 | `.claude/skills/design-draft-html/references/layout_rules.md` | 3종 세트(판정 기준·빈발 사례·수정 방침) 없으면 추가 금지 |
| C단계 판정 카탈로그 | `.claude/skills/design-figma-build/references/c_checks.md` | 〃 |
| 비전문가 답변 번역표 | `.claude/skills/design-interview/references/answer_translation.md` | 행 추가 |
| 화면 도출·PRD 반박 절차 | `.claude/skills/design-interview/references/screen_derivation.md` | 트리거·단계 추가 |

**넣지 말 것**: 특정 취향 값("카드는 라운딩 12", "파란 보더 금지"). 그것은 사용자 반응에서 나와야 하며, 미리 넣으면 심사자의 안목 대신 우리 답을 검토하게 된다. 항목(카테고리)은 넣되 값은 비운다. 예외는 **판정 수치의 기본값**(c_checks.md, answer_translation.md)이다 — 팀 디자이너 두 분의 실측 안목이며, 프로젝트 규칙(design.md §4)이 덮어쓸 수 있다.

## 하네스를 고칠 때 (유지보수 규칙)

팀 디자이너들의 브랜치에서 가져온 규칙이다. 결함 로그(`docs/harness-defects.md`) 운영에도 그대로 적용한다.

- **기록을 요구하는 규칙을 추가할 때는 기록할 자리(템플릿 칸)를 함께 만든다.** 쓸 자리가 없는 규칙은 실행 시점에 무시된다. brief.md·design.md·decisions.md 의 칸은 스킬이 "남긴다"고 요구하는 항목과 1:1 이어야 한다.
- **검증을 요구하는 규칙에는 검증 방법(명령·스크립트·스크린샷)을 함께 적는다.** "확인한다"로 끝나는 규칙은 확인되지 않는다.
- **부정형("~하면 실패")과 긍정형("~가 있는가")을 함께 둔다.** 부정형만 있으면 "틀리지 않은 결과물"이 최대치가 된다.
- **표본 1건으로 규칙을 늘리지 않는다.** 한 프로젝트에서만 나온 발견은 기록해 두고, 다른 도메인에서 재현될 때 승격한다.
- **새 실패 유형은 카탈로그에 3종 세트(판정 기준(수치)·빈발 사례·수정 방침)로 추가한다.** 셋 중 하나라도 없으면 추가하지 않는다. 눈으로 잡는 항목을 빌드·검사기로 옮길 수 있으면 옮긴다 — "사람이 봐야" 칸이 늘어나는 것은 후퇴다.
- **프롬프트 문구를 다듬는 것으로 품질을 올리지 않는다.** 탈락 패턴을 카탈로그에 추가하고 검사기 커버리지를 넓힌다. 프롬프트는 준수를 보장하지 못하고, 검사기만 보장한다.
- **스킬을 고쳤으면 `evals/` 픽스처 3종을 다 돌린다.** 하나만 돌리면 그 하나에 과적합된다. 01에서 통한 여백과 톤이 02에서 그대로 통하면 그 자체가 실패 신호다.

## 출처

이 하네스는 팀 5의 세 갈래를 합친 것이다. 뼈대(인터뷰 반응 역추출·인용 감사·산출 상한·예산 모드·상태 재시작·HTML 승인 게이트·서브에이전트 규율 D-1~D-15)는 `seongho` 브랜치, 결정론 A게이트·규칙 3계층·레이아웃 카탈로그·QA 출력 스키마·평가 루프는 `design-harness` 브랜치(팀 디자이너 A), 화면 도출 알고리즘·PRD 반박 트리거·질문 금지어·답변 번역표·1차 목적 선언·긍정형 매력 판정·표현 전략·아이콘 체계는 `noyunseo` 브랜치(팀 디자이너 B)에서 왔다.

## 라이선스

MIT — [LICENSE](./LICENSE)
