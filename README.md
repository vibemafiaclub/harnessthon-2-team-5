# oss-design-harness — team 5 (josh)

**현업 디자이너의 판단 기준(안목)을 추출해, 에이전트에 최적화된 형태로 재구성하는 디자인 하네스.**

VIBE MAFIA CLUB 하네스톤 2회차(2026-09-05)에서, "청첩장모임 스케줄러" PRD로 하네스를 실제로 1회 완주시키며 채운 버전입니다.

## 이 레포의 상태

`main`의 빈 템플릿(A/B/C/0 4단계 뼈대)을 실제 프로젝트로 채웠습니다.

- **채운 것**: 0/B/A/C 4단계 전부 실제 판단기준과 실측 사례로 채움(`.claude/skills/oss-design-harness/SKILL.md`), A단계는 코드로 실행 가능한 검사기(`scripts/audit.js`)까지 구현, C단계는 전담 서브에이전트(`.claude/agents/design-qa.md`) 정의, 0/B단계 산출물은 실제 프로젝트 예시(`docs/wedding-scheduler/`)로 남김.
- **못 채운 것 / 정직하게 남긴 한계**: 4단계(Figma 구현)는 이번 세션에서 미실행. B단계의 "최소 2개 이상 페르소나 교차비평" 원칙은 시간 예산상 생략하고 하네스 단일 관점 추천 + 사용자 승인으로 대체함. 둘 다 `SKILL.md`에 TODO로 명시.

## 프레임워크 — 4단계 판단 구조 (원본 컨셉 그대로, 배경은 `docs/concept.md`)

| 단계 | 시점 | 하는 일 |
|---|---|---|
| **0. 요구사항 정렬** | 화면을 만들기 **전** | 레퍼런스/시나리오를 보여주고 반응을 받아 암묵적 판단기준을 뽑아낸다. |
| **B. 발산·수렴** | 만드는 도중 | 독립적인 축을 먼저 나누고, 축마다 후보를 생성해 비교·수렴한다. |
| **A. 구조적 사실 검증** | 다 만든 후 | 데이터/코드로 예·아니오 확인 가능한 것(색·spacing·컴포넌트 재사용·네이밍). |
| **C. 미적·게슈탈트 판단** | 다 만든 후 | 스크린샷을 실제로 봐야만 아는 것(위계·여백 리듬·클리셰·엣지케이스). |

C단계 실패는 원인에 따라 ① 국소 결함(그 속성만 고쳐 재검) ② 방향 틀림(B로 회귀) ③ 반복 실패(0으로 에스컬레이션) 셋으로 갈린다. 재시도 상한을 두고, 최종 판단은 항상 사람이 내린다.

이번 프로젝트에서 실제로 A단계 blocker 2건(하드코딩 색상, 폰트 미토큰화)이 걸려서 코드로 고치고 재검을 통과시켰고, C단계에서 국소 결함 2건(탭바 위치, 무응답 표시 대비)을 찾아 재검 없이 즉시 수정했습니다 — 근거는 아래 "실행 증거" 참고.

## 구조

```
.claude/skills/oss-design-harness/SKILL.md   # 하네스 본체 — 4단계 실채움 + 실측 사례
.claude/agents/design-qa.md                  # C단계 전담 서브에이전트 (스크린샷 기반 판정)
scripts/audit.js                             # A단계 검사기 — HTML/CSS 프리뷰 대상 결정론적 검사
templates/brief.md · decisions.md            # 0단계 · B단계 산출물 빈 템플릿 (원본 그대로)
docs/wedding-scheduler/brief.md              # 0단계 실채움 (청첩장모임 프로젝트)
docs/wedding-scheduler/decisions.md          # B단계 실채움 (독립 축 5개, 축별 후보·선택 이유, 확정 화면 15개 인벤토리)
docs/wedding-scheduler/preview/              # 3단계 실제 산출물 (index.html/styles.css) — audit.js 대상 예시
docs/concept.md                              # 컨셉 스펙 원문 (조직 공통 문서)
LICENSE                                      # MIT (조직 공통)
```

## 실행 증거 — `scripts/audit.js`

이 저장소에는 실제 프로젝트 산출물(`docs/wedding-scheduler/preview/`, `.gitignore`로 커밋에서는 제외)에 대해 감사기를 실행한 기록이 있습니다:

```
$ node scripts/audit.js docs/wedding-scheduler/preview/index.html docs/wedding-scheduler/preview/styles.css
=== A단계 구조 감사 리포트 ===
--- 통과 항목 ---
  ✓ 컬러 팔레트 일관성: 위반 없음
  ✓ 타이포 스타일 재사용: 위반 없음
  ✓ 컴포넌트 재사용률: 83% (목표 ≥80% 충족)
--- WARNING (기록만, 진행 차단 안 함) ---
  ⚠ Spacing 그리드 준수, 레이어 네이밍 — 각 프로젝트 캘리브레이션 여지로 남김
총 2건 (blocker 0 / warning 2)
```

최초 실행 시 blocker 2건(`:root` 밖 하드코딩 hex, 토큰화 안 된 `font-family`)이 잡혔고, 코드를 수정해 재검을 통과시켰습니다. 검사기 자체도 1회 보정했습니다 — `@font-face` 안의 폰트 "정의"를 폰트 "사용"으로 잘못 잡던 false positive를 수정.

## 사용법

1. Figma로 갈 프로젝트 폴더를 준비하고, 이 레포를 참조하며 Claude Code(또는 다른 코딩 에이전트)를 실행한다.
2. `.claude/skills/oss-design-harness/SKILL.md`를 새 프로젝트 맥락에 맞게 갱신한다 — 특히 0단계 레퍼런스 소싱과 B단계 축 식별은 프로젝트마다 다시 해야 한다.
3. HTML 프리뷰가 나오면 `node scripts/audit.js <index.html> <styles.css>`로 A단계를 실행하고, blocker가 0이 될 때까지 고친다.
4. `design-qa` 에이전트(또는 직접)로 C단계를 스크린샷 기반으로 판정한다.
5. 0/B단계 산출물은 `templates/brief.md`·`templates/decisions.md`를 프로젝트 폴더로 복사해 채운다.

## 라이선스

MIT — [LICENSE](./LICENSE)
