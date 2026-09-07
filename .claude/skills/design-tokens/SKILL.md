---
name: design-tokens
description: 1단계 토큰·디자인 가이드 확정. design/brief.md 의 축별 정본과 토큰 자리에서 토큰 세트 후보 2~3개를 만들어 HTML 스와치로 나란히 보여 주고, 사용자가 고른 세트를 design/tokens.json 으로 확정한 뒤 design/design.md(토큰 원칙·제약·퀄리티 규칙)를 작성한다. 접근성 대비율은 사용자 선택과 무관하게 강제한다. design-harness 가 호출하거나 "토큰 정리 / 디자인 가이드 만들어" 로 단독 호출.
argument-hint: "[--sets 3]  (fast 모드는 2)"
---

# design-tokens — 토큰 세트 확정과 디자인 가이드

> **입력**: `design/brief.md`, `design/prd_analysis.md`, `design/state.json`(`mode`·`caps`·`human_gates.token_set_choice.delegated`), `design/interview_raw.md`(`T-`·`H-`·`고지:` 기록처). **출력**: `design/tokens.json`, `design/design.md`, `design/stimuli/token_sets.json`, `design/stimuli/design_guide_<SET>.html`, `design/stimuli/design_guide_compare.html`, `design/verify/wcag_tokens.md`, `design/verify/exit_stage1.md`.
> **분류 체계 출처**: 팀 디자이너의 `prd-to-design-guide` 스킬(6카테고리 + 결정 근거 규율). Figma 캔버스 시각화는 채택하지 않고 HTML 가이드 페이지로 대체한다. Figma 쪽은 3단계에서 Variables 로 들어간다.
> **원칙**: 인터뷰 반응은 방향(따뜻함·덜 빽빽함)을 주고 값(#F5EFE6, 8pt)은 주지 않는다. 값은 하네스가 후보로 만들고, 확정은 **사용자가 나란히 보고** 한다. 값을 사용자에게 묻지 않는다. 바닥선(WCAG 대비·스케일 단조성·미감 정합 3항)은 호출 3분류 ③ — 검사기가 잡고 maker 가 고치며, 사용자에게 묻지 않는다.

## 분담

| 단계 | 누가 |
|---|---|
| 1-A 토큰 세트 후보 생성 + 세트별 디자인 가이드 HTML + 비교 페이지 | `design-maker` |
| 1-B 접근성 대비율·스케일 단조성·미감 정합 3항 검사·보정 | `design-worker` (검사) → `design-maker` (보정) |
| 1-C 세트 선택 (위임이면 자동 채택 + 고지) | **메인 세션** |
| 1-D tokens.json 확정 + design.md 작성 | `design-maker` |
| 1-E 종료조건 검사 K-1~K-12 → `design/verify/exit_stage1.md` | `design-worker` |

## 1-A. 토큰 세트 후보 (`design-maker`)

브리프에 넘길 것: **입력 화이트리스트 = `design/brief.md`, `design/prd_analysis.md`, `templates/tokens.json`** (그 외 금지). 출력 `design/stimuli/token_sets.json`(세트 `human_token_sets`개), 세트별 `design/stimuli/design_guide_<SET>.html`, 비교 페이지 `design/stimuli/design_guide_compare.html`. 상한 문장: "세트 {human_token_sets}개, 가이드 HTML 1파일 ≤{agent_draft_html_lines_max}줄, rationale 은 카테고리당 2문장 이내".

`token_sets.json` 형식(1-E K-9·1-B 가 이 키를 그대로 읽는다 — 바꾸지 않는다):

```json
{ "sets": [ { "id": "SET-A", "desc": "<한 줄 체감 — .set-desc 와 같은 문자열>", "tokens": { "<templates/tokens.json 스키마 전체>": "" } } ],
  "ai_pick": "SET-B", "ai_pick_reason": "<한 줄, 반응 ID 인용>" }
```

요구 사항:

- 각 세트는 `templates/tokens.json` 스키마의 **6카테고리(컬러·타이포·스페이싱·래디어스·엘리베이션·아이콘)를 전부** 채운다. 빈 문자열 금지. 상태 색 개수는 brief §7 토큰 자리 표를 따른다.
- **카테고리별 `rationale` 필수.** "왜 이 값인가" 를 brief 근거 ID(R-/W-/A-), 적합성 단서(brief §11), PRD 원문 중 하나 이상과 연결해 한두 문장. 근거 없는 값은 만들지 않는다. prd_analysis 의 감성 키워드 가설은 근거로 인용 가능하되 반응 정본과 충돌하면 반응이 이긴다.
- 카테고리별 세부 규칙:
  - **컬러**: primary 6단계 스케일, secondary 3단계, neutral 8단계, feedback 4쌍(배경+텍스트), 도메인 상태 N쌍, surface 3계층. 모든 텍스트/배경 쌍에 WCAG 통과 여부 표기. **순수 검정 `#000000` 은 어떤 텍스트·neutral 단계에도 쓰지 않는다**(c_checks C-8, 1-B M-1 이 잡는다). neutral 50~900 은 **전부 무채(채도 0)이거나 전부 같은 방향의 유채**(따뜻한 회색이면 전 단계가 따뜻하게) — 섞으면 C-1(M-2) FAIL.
  - **타이포**: 본문용 1 + 디스플레이용 1(필요시), 한글 서비스는 한글 웹폰트 우선, fallback 명시. 스케일 9단계(display~overline) 각각 size·lineHeight·weight·letterSpacing. 모바일/데스크톱이 다르면 양쪽 기입.
  - **스페이싱**: 4 또는 8 기반, 스케일 + **용도 매핑** + 주요 컴포넌트(버튼·카드·인풋·모달·목록 행) 내부 패딩.
  - **래디어스**: 스케일 + 컴포넌트별 용도 매핑 + **동심원 규칙**(outer = inner + padding).
  - **엘리베이션**: sm/md/lg 3단계, 각 offset·blur·spread·color·opacity·용도. **blur 와 opacity 는 sm < md < lg 로 단조 증가**(같은 그림자 3벌은 C-5 '모든 요소에 동일한 그림자', 1-B M-3 이 잡는다).
  - **아이콘**: outlined/filled/duotone 중 선택 + 근거, 크기 16/20/24, 스트로크는 본문 weight 에 맞춤.
- 세트 간 차이는 brief §3 대조표에서 **정본이 확정된 축은 고정**하고, 남은 자유도(정확한 색상값·라운딩 크기·글꼴 계열)에서만 낸다. 정본을 뒤집는 세트를 만들지 않는다.
- 세트마다 한 줄 설명(`desc` = `.set-desc`)은 **체감**으로, 디자인 용어 없이. 좋음: "친근하고 말 걸듯" / "깔끔하고 빠릿". 나쁨: "웜 톤의 프렌들리 미니멀"(설명이 또 하나의 전문 어휘). 금지어 14개(`scripts/lib/forbidden-words.js` 정본)가 들어가면 K-8 FAIL. **세 후보는 서로 체감이 달라야 한다** — 비슷한 셋을 주면 고를 수 없다. 기계 기준(K-9): 세트 쌍마다 `typography.family.body`·`color.primitive.primary.500`·`radius.usage.card`·`spacing.unit` 네 값 중 **2개 이상이 달라야** 한다. 같으면 '세트 체감 동일' FAIL.
- **공개 디자인 시스템을 참조해도 된다** — 단 가져오는 것은 **구조**(역할 구성·스케일의 모양·상태 계약·지오메트리)뿐이다. **색 hex 는 가져오지 않는다.** 참조 팔레트를 `tokens.meta.reference_palette` 에 **금지 목록**으로 적고 `meta.reference_system` 에 출처를 적는다. 로고·아이콘·카피·화면 구성은 복사하지 않는다. (팀 디자이너 두 분의 입장이 갈린 지점 — 색은 그 회사의 브랜드이자 그 도메인의 답이라 복사하면 정체성 도용과 도메인 불일치가 동시에 생긴다는 쪽을 채택.)
- **세트별 디자인 가이드 HTML** (`design_guide_<SET>.html`), 7섹션 세로 배치: ①헤더(서비스명·생성일, 감성 키워드는 **표시하지 않는다**) ②컬러 팔레트 스워치(사각형+HEX+이름+WCAG 표기) ③타입 스케일을 실제 크기로 렌더 ④스페이싱을 길이가 다른 바로 ⑤래디어스를 실제 적용된 사각형으로 ⑥그림자 3단계 카드 ⑦**적용 예시** — brief §2 첫 화면(§2c '첫 진입·온보딩' 담당 화면)의 화면 조각(목록 행 3개 + 상태 칩 + 버튼 + 인풋)을 그 세트 토큰으로 렌더. **메타 일관성**: 가이드 페이지 자체가 그 세트의 토큰으로 만들어져야 한다(제목 글꼴·여백·색 전부).
- 사용자 선택 화면은 **⑦ 적용 예시를 세트별로 나란히** 놓은 `design_guide_compare.html`. 색 칩 나열로는 사용자가 판단하지 못한다. 각 세트에서 전체 가이드 페이지로 가는 링크. **마크업 규칙(고정 — 1-E K-6·K-7·K-8 이 이 선택자로 센다)**: 세트마다 `<section data-set="SET-X">` 하나, 그 안에 `<p class="set-desc">` (한 줄 체감 설명) 와 `<div data-section="apply">` (⑦ 적용 예시). 세트 `<section>` 안에 다른 `<section>` 을 중첩하지 않는다. `<title>` 은 사용자에게 보이는 질문 한 줄(예: "어느 쪽이 이 앱에 맞아 보이나요"). 비교 페이지에는 WCAG 표기·축 이름·감성 키워드·토큰 이름을 넣지 않는다 — 보이는 텍스트 전부가 금지어 검사 대상이다.
- 외부 리소스 없는 단일 HTML(웹폰트는 로컬 시스템 폰트 스택 fallback 포함). 세트 ID 는 `SET-A/B/C`. 사용자에게 보이는 설명은 디자인 용어 없이 한 줄, 축 이름·감성 키워드는 숨긴다.
- fast 모드: 세트 2개, 가이드 페이지는 ②③⑦ 만. 비교 페이지 마크업 규칙은 동일.
- 하드 제약(brief §5)에 브랜드 색이 있으면 모든 세트가 그 값을 포함한다.
- `ai_pick`·`ai_pick_reason` 을 `token_sets.json` 에 넣는다(1-C 가 선택 기록 뒤에 공개). 이유는 반응 ID 를 인용한 쉬운 말 한 줄.

## 1-B. 접근성·미감 정합 검사 (`design-worker` → 필요시 `design-maker`)

**세트를 사용자에게 보이기 전에** 돈다. 미달 세트는 보정이 끝날 때까지 `design_guide_compare.html` 에 올리지 않는다 — 사용자가 고른 뒤 바꾸면 승인이 무효가 된다. 이 절의 항목은 전부 호출 3분류 ③ 바닥선이다: 사용자에게 묻지 않는다.

`design-worker` 브리프: `design/stimuli/token_sets.json` 을 읽고 세트마다 아래 쌍의 WCAG 대비율을 계산해 `design/verify/wcag_tokens.md` 에 기록. 기록 형식은 세트별 표 `| 세트 | 항목 | 결과 | 값 |` 한 가지 — 항목 이름은 아래 표기 그대로(K-3 이 이름으로 찾는다).

- `WCAG text.primary/bg.page`, `WCAG text.primary/bg.surface`, `WCAG text.secondary/bg.page` → 4.5:1 이상
- `WCAG text.on-primary/brand.default` → 4.5:1 이상 (템플릿 키 `text.on-primary`. `on-brand` 라는 키는 없다)
- 각 `WCAG status.<slug>` 위 텍스트(어떤 텍스트 토큰을 쓰는지 세트에 명시) → 4.5:1 이상
- `WCAG border.default/bg.page` → 3:1 이상

계산은 파이썬 또는 node 한 파일로(상대 휘도 → 대비율), 명령과 출력 원문 첨부. 미달 쌍이 있으면 `design-maker` 에 되돌리되 보정 브리프에 다음을 **문장으로** 넣는다: **"primitive 값을 바꾸지 않는다. 미달 semantic 토큰의 참조를 스케일의 다른 단계로 옮기거나, 단계를 신설해 참조한다. 다른 값 불변."** (D-7 실측: primitive 를 어둡게 만들어 neutral.200 이 300 보다 어두워지고 `border.strong` 이 `default` 보다 연해짐 — 대비 검사는 통과하므로 기계로 안 잡힌다.) 보정 후 재검사에 아래 두 항목을 추가한다:
- **스케일 단조성**(`단조성 neutral` · `단조성 primary` · `단조성 secondary`): 각 primitive 스케일이 50→900 으로 갈수록 휘도가 단조 감소한다.
- **강·약 관계**(`강약 border` · `강약 text`): `border.strong` 대비 > `border.default` 대비, `text.primary` 대비 > `text.secondary` 대비 > `text.disabled` 대비.

**미감 정합 3항**(`M-1`·`M-2`·`M-3`) — c_checks 의 바닥선 중 토큰 값만으로 판정되는 셋을 Figma 3단계까지 미루지 않고 여기서 거른다. 아래 명령 한 줄을 그대로 실행해 출력 행을 `wcag_tokens.md` 에 붙인다(세트 전부, 판정은 기계):

```bash
node -e 'const S=JSON.parse(require("fs").readFileSync("design/stimuli/token_sets.json","utf8"));const hex=v=>{const m=/^#([0-9a-f]{6})$/i.exec(String(v).trim());return m?m[1].toUpperCase():null};const chroma=h=>{const c=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return Math.max(...c)-Math.min(...c)};for(const s of S.sets){const t=s.tokens;const res=v=>{let x=v,n=0;while(typeof x==="string"&&/^\{.*\}$/.test(x)&&n++<10)x=x.slice(1,-1).split(".").reduce((a,k)=>a&&a[k],t);return x};const tp=res(t.color.semantic.text.primary),ts=res(t.color.semantic.text.secondary),n9=t.color.primitive.neutral["900"];const m1=[tp,ts,n9].every(v=>hex(v)&&hex(v)!=="000000");const ns=Object.entries(t.color.primitive.neutral).filter(([k])=>k!=="0").map(([k,v])=>[k,hex(v)?chroma(hex(v)):NaN]);const m2=ns.every(([,c])=>c===0)||ns.every(([,c])=>c>0);const e=t.elevation.scale,m3=e.sm.blur<e.md.blur&&e.md.blur<e.lg.blur&&e.sm.opacity<e.md.opacity&&e.md.opacity<e.lg.opacity;console.log(`| ${s.id} | M-1 | ${m1?"PASS":"FAIL"} | text.primary=${tp} text.secondary=${ts} neutral.900=${n9} |`);console.log(`| ${s.id} | M-2 | ${m2?"PASS":"FAIL"} | neutral chroma ${ns.map(([k,c])=>k+":"+c).join(" ")} |`);console.log(`| ${s.id} | M-3 | ${m3?"PASS":"FAIL"} | blur ${e.sm.blur}<${e.md.blur}<${e.lg.blur} opacity ${e.sm.opacity}<${e.md.opacity}<${e.lg.opacity} |`)}'
```

| 항목 | 판정(값만으로) | 출처 | 보정 |
|---|---|---|---|
| M-1 순수 검정 | `text.primary`·`text.secondary` 의 참조 해석값 ≠ `#000000`, `neutral.900` ≠ `#000000`. 참조가 해석되지 않거나 hex 가 아니면 FAIL | C-8 '본문·제목에 순수 검정 실패' | `neutral.900` 을 근검정(예: 청색·갈색 기운의 900)으로 바꾸고 text 참조 유지. primitive 가 바뀌므로 WCAG 전 쌍·단조성·강약을 다시 돈다 |
| M-2 회색 혼용 | `neutral` 50~900 의 채도(RGB max−min)가 **전부 0** 이거나 **전부 > 0** | C-1 '순수 회색과 유채색 회색이 한 화면에 섞이면 실패' | neutral 스케일 전체를 한 방향으로 다시 만든다(단계 하나만 고치지 않는다). WCAG·단조성·강약 재검 |
| M-3 그림자 위계 | `elevation.scale` 의 `blur` 와 `opacity` 가 sm < md < lg 로 **둘 다** 엄격 증가 | C-5 '모든 요소에 동일한 그림자(elevation 위계 없음)' | elevation 값만 수정. 색 토큰 불변이므로 재검은 M-3 만 |

세 항목 중 하나라도 FAIL 인 세트는 사용자에게 보이지 않는다. 보정 상한은 세트당 2회; 2회 뒤에도 FAIL 이면 그 세트를 버리고 `human_token_sets` 에 맞게 새 세트를 1-A 로 재생성한다(사용자에게 '세트가 하나 줄었다' 고 알리지 않는다 — 노출 전 일이다).

## 1-C. 세트 선택 (메인 세션 — 취향형 호출, kind `token_choice`)

0. **위임이면 부르지 않는다.** `state.human_gates.token_set_choice.delegated == true`(0-E 가 Q12 답에서 기록)면 `token_sets.json` 의 `ai_pick` 을 자동 채택하고 사용자에게 "이렇게 골랐다" 를 한 줄로 고지만 한다(`ai_pick_reason` 을 쉬운 말로, 금지어 0 — 결정을 되묻지 않는다). 기록: `interview_raw.md` 에 `T-01 <SET> | 사용자 위임(Q12) — ai_pick 자동 채택` 과 `고지: <보낸 문장 원문>`, `state.human_gates.delegations[]` 에 `{stage: "tokens", item: "token_set", kind: "q12", default_taken: "<SET>", ts}`, `token_set_choice.chosen = ai_pick`, `changed_after_reveal = false`. `H-` 원장에는 넣지 않는다(호출이 아니다). 1~5 를 건너뛰고 1-D 로.
1. 부르기 전에 `design/interview_raw.md` 에 다음 번호로 `H-nn [tokens/token_choice]` 한 줄 + 4줄 골격을 append 하고 `state.human_gates.calls[]` 에 `{stage: "tokens", kind: "token_set", ts}` 를 기록한다(design-harness 호출 품질 게이트). 골격의 `선택지:` 줄에는 세트 ID 와 `.set-desc` 를, `(하네스 추천: ①)` 괄호에는 `ai_pick` 을 **미리 적어 두되** 사용자 메시지에서는 괄호를 뺀다 — 취향형은 선택 기록 후 공개. 4줄과 `고지:` 줄은 사용자에게 보이는 문구이므로 금지어 0(K-8 이 `답:` 줄만 빼고 센다).
   ```
   H-nn [tokens/token_choice]
   결정할 것: <human_token_sets>가지 화면 느낌 중 이 앱에 맞는 쪽 하나
   선택지: ① SET-A(<set-desc>) ② SET-B(<set-desc>) ③ SET-C(<set-desc>) (하네스 추천: <ai_pick 번호>)
   추천 이유: <ai_pick_reason 을 쉬운 말로 한 줄>
   안 정하면: <ai_pick> 으로 진행하고 가정 로그(§6)에 남긴다
   ```
2. `open design/stimuli/design_guide_compare.html` (K-6~K-9 가 이미 PASS 인 페이지만 연다 — 1-E 의 K-6~K-9 는 여기서 먼저 한 번 돌린다).
3. 지시문(고정, 바꾸지 않는다): "이 {human_token_sets}가지 중 어느 쪽이 이 앱에 맞아 보이나요? 왜 그런지 한 줄. 어느 것도 아니면 그렇게 말해 주세요." — 열린 결정 질문("어떻게 보이면 좋을까요")으로 바꾸지 않는다.
4. **사용자 선택을 먼저 `interview_raw.md` 에 기록한 뒤** 추천을 공개한다. 기록 형식(K-10 이 이 정규식으로 센다): `T-01 SET-X | 이유: <사용자 원문>` — 이유 원문은 비울 수 없다(사용자가 이유를 안 말하면 되묻기 1회 "어느 부분이 그래 보였어요?", 그래도 없으면 `이유: (없음 — 되묻기 1회 후) <사용자 원문 그대로>`). 답 원문은 `H-` 블록의 `답:` 줄에도 그대로. 그다음 `ai_pick`·`ai_pick_reason` 을 공개하고 그 문장을 `고지:` 줄로 남긴다. 공개 후 바꾸면 `T-01` 을 고치지 않고 `T-02 SET-Y | 이유: <원문> (추천 공개 후 변경)` 을 추가하고 `changed_after_reveal: true`. 추천을 먼저 보이면 앵커링이다.
5. "어느 것도 아님" 이면 `T-01 없음 | 이유: <원문>` 으로 기록하고 이유를 `design-maker` 재생성 브리프에 넣어 1회 재생성(상한 1). **재생성 브리프에도 1-A 의 조건을 그대로 넣는다**: `.set-desc`·`<title>`·비교 페이지 보이는 텍스트에 금지어 14개(`scripts/lib/forbidden-words.js` 정본) 0건, 마크업 규칙(`data-set`·`.set-desc`·`data-section="apply"`) 유지, 세트 쌍 4키 중 ≥2 다름, 1-B 전 항목 PASS 뒤에만 노출. 재생성본으로 2~4 를 한 번 더 하고 결과를 `T-02` 로 기록한다(H- 는 같은 호출의 연속이므로 새 `H-nn` 을 열지 않는다). 그래도 아니면 가장 가까운 세트를 `provisional` 로 채택하고 `T-02 SET-X | provisional — 가장 가까운 세트, §6 가정 로그 A-nn` 으로 기록, 가정 로그에 적는다.

## 1-D. 확정 (`design-maker`)

브리프: **입력 화이트리스트 = `design/stimuli/token_sets.json`, `design/brief.md`, `templates/design.md`** + 선택된 세트 ID. 출력 `design/tokens.json`, `design/design.md`. 상한 문장: "design.md ≤{agent_design_md_lines_max}줄".

- `tokens.json` = 선택 세트 그대로 + `meta.chosen_set`, `meta.platform`, `meta.wcag_checked_at`, `color.wcag` 측정값 기입. `rationale` 유지. 참조 문법 `{color.primitive.…}` 은 유지(소비 측이 해석). rationale 마다 **증거 등급** 하나를 붙인다: `prd` / `client-quote`(반응 ID) / `measured` / `assumption` / `extension`(근거에 없지만 필요해 추가한 것).
- **`design/project.rules.json` 생성** (`design-worker`): `node scripts/build-rules.js --tokens design/tokens.json --out design/project.rules.json`. 이것이 3단계 결정론 검사기(`scripts/audit.js`)의 입력이다. 스크립트가 빈 값·참조 팔레트 충돌을 잡아 거부하면 tokens.json 을 고치고 다시 생성한다. 손으로 고치지 않는다. 이어서 `node scripts/audit.js --project design/project.rules.json --compile-only` 가 통과해야 이 단계가 끝난다.
- `design.md`:
  - §2 토큰 원칙: semantic 만 직접 사용, primitive 는 참조 전용, scale 타이포만 사용 — 이 셋은 고정. **화면 규격 한 줄**(모바일 390×844 + 상태바 44 + 탭바 83, 또는 데스크톱 1440×900)을 여기 적는다 — 2단계 HTML 과 3단계 Figma 프레임이 이 값을 읽는다. 나머지는 brief 에서.
  - §2b **결정 근거 요약**(prd-to-design-guide 4단계 채택): "왜 이 primary 인가"(도메인·반응 정본), "왜 이 폰트인가"(사용자층·가독성·한글), "왜 이 스페이싱 체계인가"(정보 밀도·플랫폼), "왜 이 래디어스·그림자인가". 각 항목은 tokens.json 의 `rationale` 을 사용자가 읽을 수 있는 말로 옮긴 것이며, 1-C 에서 선택 뒤 사용자에게 이 요약을 3~5줄로 보여 준다 — 보낸 문장은 `interview_raw.md` 에 `고지:` 줄로 남긴다(금지어 0, K-8).
  - §3 제약: 하네스 고정 하한선 2개 + brief §5 하드 제약 전부.
  - §4A/§4C: brief §4 의 기준 중 `confidence: confirmed` 와 `provisional` 을 `verdict_method` 로 갈라 표에 옮긴다. RULE-ID 유지. `proposed` 는 §4 에 넣지 않고 §13 가정 아래 "미적용 기준" 으로만 나열. **A 규칙에는 기준값을 tokens.json 토큰 이름으로 적는다**(예: 간격은 `spacing.scale` 값만 허용).
  - §5 화면별 1등 정보: brief §2 의 화면·1등 정보 열을 **행 수 그대로** 복사(행 수 == brief §2 화면 수, 1등 정보 셀 공백 0 — K-11). brief 에 `[HYPOTHESIS]` 가 붙은 셀은 표시를 지우지 않고 옮긴다(C 판정 1차 인상 대조에서 가설임을 알아야 한다). 표 바로 아래 한 줄 `상태 강조 순위: 1. <상태>(A-nn) 2. … ` — brief §2d 를 순위·Q5 원문 ID 그대로. c_checks C-6 '사용자가 가장 자주 마주치는 상태' 의 정답지가 이 줄이다(2콜 판정자는 brief 를 받지 않는다).
  - §6 금지 목록: brief 에서 '싫다' 로 확정된 것만. 하네스가 추가하지 않는다.
  - §7 핵심 과업: brief §2b 복사 + **역할 열**(`| # | 과업 | 역할 | 시작 화면 | 기대 경로 |`, 역할은 brief §11 의 R-n) — 2-G 과업×역할 추적과 2-D 페르소나가 이 열을 읽는다. §8 적합성 기준: brief §11 + §10 반박 결정 요약 — brief §11 의 `사용자 수준(익숙함·연령·기기):` 줄을 **같은 머리말로 그대로** 옮긴다(공백이면 K-4 FAIL). 이 둘이 없으면 뒤 단계가 UX·적합성을 판정할 근거가 없다.
  - §9 아이콘 체계(출처 패키지·이 프로젝트 아이콘 사전), §10 표현 전략(**브랜드 장치 하나** — 적합성 축의 핵심), §11 Voice & Tone 대조 2쌍, §12 Locale(최장 문자열·최대 수치). 값은 brief 반응·PRD 에서, 근거 없으면 `assumption` 등급으로.

## 종료조건 (`design-worker` — 1-E, 결과 `design/verify/exit_stage1.md`)

아래 K-1~K-12 는 **`node scripts/check-tokens.js --tokens design/tokens.json --state design/state.json --design design/design.md --brief design/brief.md --wcag design/verify/wcag_tokens.md --compare design/stimuli/design_guide_compare.html --sets design/stimuli/token_sets.json --raw design/interview_raw.md --out design/verify/exit_stage1.md` 한 명령이 전부 센다**(worker 는 실행만; 종료 코드 0 이 통과. 아래 명령 블록은 사람이 항목별로 다시 볼 때의 원문이며 스크립트가 정본이다 — selftest 가 골든·변이 3건으로 검출력을 시험한다). 상한(`human_token_sets`·`agent_design_md_lines_max`)은 `design/state.json` 의 `caps` 에서, `mode` 가 fast 면 `caps_fast` 로 덮어써 읽는다. 하나라도 FAIL 이면 1단계는 끝나지 않는다 — worker 가 판단으로 PASS 를 주지 않는다(D-30).

- [ ] **K-1** `design/tokens.json` 유효 JSON, 빈 문자열 값 0개(`_note`·`$schema_note`·`_reference_note` 제외, `meta.reference_system` 이 null 이면 `meta.reference_palette` 도 제외), 6카테고리 `rationale` 전부 비어 있지 않음, `typography.family.fallback` 존재, **`icon.style` 같은 열거형 스타일 이름 토큰에는 `definition`(무엇을 하고 무엇을 하지 않는가) 이 있다** — 이름만 넘기면 제작 에이전트가 해석해 틀린다(D-38: duotone → 배경 칩). build-rules 가 없으면 경고
- [ ] **K-2** `design/project.rules.json` 존재, `node scripts/audit.js --project design/project.rules.json --compile-only` 종료 코드 0 (명령·출력 원문 첨부). build-rules 가 비ASCII 키로 거부하면 tokens.json 의 키를 영문 슬러그로 바꾸고 한글은 `label` 로 — **1단계에서 확정된 뒤에는 tokens.json·tokens.css·Figma Variables 이름이 서로 물리므로 키를 나중에 바꾸지 않는다**
- [ ] **K-3** `design/verify/wcag_tokens.md` 에 선택 세트의 행이 ≥10, FAIL 0, 이름으로 찾는 필수 행 전부 PASS: `WCAG text.primary/bg.page` · `WCAG text.on-primary/brand.default` · `단조성 neutral` · `강약 text` · **`M-1` · `M-2` · `M-3`(미감 정합 3항)**
- [ ] **K-4** `design/design.md` §1~§13 전부 존재, **전체 ≤`agent_design_md_lines_max`줄**, §2b 결정 근거 4항목 채움, §4A+§4C 행 수 == brief §4 의 `confidence: confirmed|provisional` 수, §7 행 3개 + 헤더에 **역할** 열, §8 ≥2줄 + `- 사용자 수준(…):` 줄 채움, §9 `아이콘 사전(…):`·§10 `이 프로젝트의 장치:`·§12 `최장 문자열 / 최대 수치(…):` 자리 채움(템플릿 안내 문장이 아니라 그 줄의 콜론 뒤)
- [ ] **K-5** `design.md` 안에 hex 색상값 직접 표기 0건(토큰 이름만)
- [ ] **K-6** `design/stimuli/design_guide_compare.html` 존재, `<section data-set="SET-X">` 의 서로 다른 세트 수 == `human_token_sets`
- [ ] **K-7** 각 세트 `<section>` 안에 `<div data-section="apply">` 와 `<p class="set-desc">` 둘 다 존재
- [ ] **K-8** 금지어 0건 — (a) 비교 페이지의 보이는 텍스트 전부(`.set-desc`·`<title>` 포함, `node scripts/lib/forbidden-words.js` 종료 코드 0) (b) raw 의 `H-nn [tokens/token_choice]` 블록(`답:` 줄 제외)과 `고지:` 줄
- [ ] **K-9** `token_sets.json` 세트 쌍마다 `typography.family.body`·`color.primitive.primary.500`·`radius.usage.card`·`spacing.unit` 중 **≥2 다름** (같으면 '세트 체감 동일' FAIL)
- [ ] **K-10** raw 에 `^T-01 ` 줄 1개(`SET-X | 이유: <원문>` / `SET-X | 사용자 위임…` / `없음 | 이유: <원문>` 중 하나, 이유 원문 공백 불가), 마지막 `T-0n` 줄의 세트 == `state.token_set_choice.chosen`, `H-nn [tokens/token_choice]` 수 == 1(위임이면 0)
- [ ] **K-11** `design.md` §5 행 수 == brief §2 화면 수, 1등 정보 셀 공백 0, 표 아래 `상태 강조 순위:` 줄 존재
- [ ] **K-12** 상태 파일 `human_gates.token_set_choice.chosen` 이 `SET-X` 형식으로 기입. `delegated == true` 면 `delegations[]` 에 `{stage:"tokens", item:"token_set", kind:"q12"}` 항목 정확히 1개, `default_taken == chosen == ai_pick`

```bash
# K-1
node -e 'const t=JSON.parse(require("fs").readFileSync("design/tokens.json","utf8"));const skip=new Set(["_note","$schema_note","_reference_note"]);const empt=[];(function w(o,p){for(const [k,v] of Object.entries(o)){if(skip.has(k))continue;if(p==="meta."&&k==="reference_palette"&&t.meta.reference_system==null)continue;if(v&&typeof v==="object")w(v,p+k+".");else if(v==="")empt.push(p+k)}})(t,"");const nr=["color","typography","spacing","radius","elevation","icon"].filter(c=>!(t[c]&&String(t[c].rationale||"").trim()));const fb=!!(t.typography&&t.typography.family&&String(t.typography.family.fallback||"").trim());const ok=!empt.length&&!nr.length&&fb;console.log("빈 문자열",empt.length,empt.slice(0,6).join(","),"/ rationale 누락",nr.join(",")||"없음","/ fallback",fb,ok?"PASS":"FAIL");process.exit(ok?0:1)'
# K-2
node scripts/build-rules.js --tokens design/tokens.json --out design/project.rules.json && node scripts/audit.js --project design/project.rules.json --compile-only
# K-3
node -e 'const c=require("./design/state.json").human_gates.token_set_choice.chosen;const L=require("fs").readFileSync("design/verify/wcag_tokens.md","utf8").split("\n").filter(l=>l.startsWith("| "+c+" |"));const fail=L.filter(l=>/\| FAIL /.test(l)).length;const has=n=>L.some(l=>new RegExp("^\\| "+c+" \\| "+n+" \\| PASS ").test(l));const miss=["WCAG text\\.primary/bg\\.page","WCAG text\\.on-primary/brand\\.default","단조성 neutral","강약 text","M-1","M-2","M-3"].filter(n=>!has(n));const ok=L.length>=10&&!fail&&!miss.length;console.log(c,"행",L.length,"/ FAIL",fail,"/ 누락",miss.join(",").replace(/\\\\/g,"")||"없음",ok?"PASS":"FAIL");process.exit(ok?0:1)'
# K-4
node -e 'const fs=require("fs");const s=require("./design/state.json");const cap=(s.mode==="fast"?Object.assign({},s.caps,s.caps_fast):s.caps).agent_design_md_lines_max;const D=fs.readFileSync("design/design.md","utf8"),B=fs.readFileSync("design/brief.md","utf8");const sec=(t,h,end)=>{const i=t.search(new RegExp("^##+ "+h+"[.\\s]","m"));if(i<0)return null;const r=t.slice(i).split("\n").slice(1);const e=r.findIndex(l=>end.test(l));return (e<0?r:r.slice(0,e)).join("\n")};const dS=h=>sec(D,h,/^##+ /),bS=h=>sec(B,h,/^## /);const rows=x=>(x||"").split("\n").filter(l=>/^\|/.test(l)&&!/^\|\s*-/.test(l)).slice(1).filter(l=>l.replace(/[|\s]/g,"").length);const miss=[];for(let i=1;i<=13;i++)if(sec(D,String(i),/^## /)===null)miss.push("§"+i);const lines=D.split("\n").length;const b2=(dS("2b")||"").split("\n").filter(l=>/^- 왜 .+: \S/.test(l)).length;const bc=(bS("4")||"").split("\n").filter(l=>/^- confidence: (confirmed|provisional)\b/.test(l)).length;const d4=rows(dS("4A")).length+rows(dS("4C")).length;const s7=dS("7")||"",h7=s7.split("\n").find(l=>/^\|/.test(l))||"";const r7=rows(s7).length,role7=/역할/.test(h7);const s8=dS("8")||"";const lv=/^- 사용자 수준[^:]*: \S/m.test(s8),n8=s8.split("\n").filter(l=>/^- \S/.test(l)).length;const s9=/아이콘 사전[^:]*: \S/m.test(dS("9")||""),s10=/이 프로젝트의 장치: \S/m.test(dS("10")||""),s12=/최장 문자열[^:]*: \S/m.test(dS("12")||"");const ok=!miss.length&&lines<=cap&&b2===4&&d4>0&&bc===d4&&r7===3&&role7&&lv&&n8>=2&&s9&&s10&&s12;console.log("누락 절",miss.join(",")||"없음","/ 줄",lines,"≤",cap,"/ §2b",b2+"/4","/ §4A+§4C",d4,"vs brief",bc,"/ §7 행",r7,"역할 열",role7,"/ §8 줄",n8,"사용자 수준",lv,"/ §9 아이콘 사전",s9,"§10 장치",s10,"§12 최장",s12,ok?"PASS":"FAIL");process.exit(ok?0:1)'
# K-5
! grep -nE '#[0-9A-Fa-f]{6}' design/design.md
# K-6
node -e 'const s=require("./design/state.json");const c=s.mode==="fast"?Object.assign({},s.caps,s.caps_fast):s.caps;const h=require("fs").readFileSync("design/stimuli/design_guide_compare.html","utf8");const n=new Set([...h.matchAll(/<section[^>]*data-set="(SET-[A-Z])"/g)].map(m=>m[1])).size;console.log("data-set 세트",n,"/ human_token_sets",c.human_token_sets,n===c.human_token_sets?"PASS":"FAIL");process.exit(n===c.human_token_sets?0:1)'
# K-7
node -e 'const h=require("fs").readFileSync("design/stimuli/design_guide_compare.html","utf8");let f=0,n=0;for(const m of h.matchAll(/<section[^>]*data-set="(SET-[A-Z])"[^>]*>([\s\S]*?)<\/section>/g)){n++;const a=/data-section="apply"/.test(m[2]),d=/<p[^>]*class="[^"]*\bset-desc\b/.test(m[2]);if(!a||!d)f++;console.log(m[1],"apply:"+(a?"PASS":"FAIL"),"set-desc:"+(d?"PASS":"FAIL"))}process.exit(f||!n?1:0)'
# K-8 (a)
node scripts/lib/forbidden-words.js design/stimuli/design_guide_compare.html
# K-8 (b)
awk '/^H-[0-9]+ \[tokens\/token_set\]/{p=1;next} p&&/^$/{p=0} p&&!/^답:/{print} /^고지:/{print}' design/interview_raw.md > design/verify/stage1_msgs.txt && node scripts/lib/forbidden-words.js --raw design/verify/stage1_msgs.txt
# K-9
node -e 'const S=JSON.parse(require("fs").readFileSync("design/stimuli/token_sets.json","utf8"));const g=(o,p)=>p.split(".").reduce((a,k)=>a&&a[k],o);const K=["typography.family.body","color.primitive.primary.500","radius.usage.card","spacing.unit"];let f=0;for(let i=0;i<S.sets.length;i++)for(let j=i+1;j<S.sets.length;j++){const d=K.filter(k=>String(g(S.sets[i].tokens,k)).toLowerCase()!==String(g(S.sets[j].tokens,k)).toLowerCase());console.log(S.sets[i].id+" vs "+S.sets[j].id+": 다른 키 "+d.length+" ["+d.join(",")+"] "+(d.length>=2?"PASS":"FAIL 세트 체감 동일"));if(d.length<2)f++}process.exit(f||S.sets.length<2?1:0)'
# K-10
node -e 'const fs=require("fs");const raw=fs.readFileSync("design/interview_raw.md","utf8").split("\n");const st=require("./design/state.json").human_gates.token_set_choice;const t=raw.filter(l=>/^T-0[1-9] /.test(l));const t1=t.filter(l=>/^T-01 (SET-[A-Z] \| (이유: \S.*|사용자 위임.*)|없음 \| 이유: \S.*)$/.test(l)).length;const last=t[t.length-1]||"";const set=(last.match(/^T-0[1-9] (SET-[A-Z])/)||[])[1];const h=raw.filter(l=>/^H-[0-9]{2} \[tokens\/token_set\]/.test(l)).length;const ok=t1===1&&!!set&&set===st.chosen&&(st.delegated?h===0:h===1);console.log("T-01 유효",t1,"/ 최종 T 세트",set,"/ state.chosen",st.chosen,"/ H-nn [tokens/token_choice]",h,"(위임:",st.delegated+")",ok?"PASS":"FAIL");process.exit(ok?0:1)'
# K-11
node -e 'const fs=require("fs");const sec=(f,n)=>{const t=fs.readFileSync(f,"utf8");const i=t.search(new RegExp("^## "+n+"\\. ","m"));if(i<0)return "";const r=t.slice(i).split("\n").slice(1);const e=r.findIndex(l=>/^## /.test(l));return (e<0?r:r.slice(0,e)).join("\n")};const tbl=s=>{const L=s.split("\n").filter(l=>/^\|/.test(l));if(!L.length)return{rows:[],idx:-1};const H=L[0].split("|").map(x=>x.trim());return{rows:L.slice(2).filter(l=>l.replace(/[|\s]/g,"").length),idx:H.findIndex(c=>/1등 정보/.test(c))}};const b=tbl(sec("design/brief.md","2")),d=tbl(sec("design/design.md","5"));const blank=d.rows.filter(l=>!(l.split("|").map(x=>x.trim())[d.idx]||"").length);const rank=/^상태 강조 순위[^:]*: \S/m.test(sec("design/design.md","5"));const ok=b.rows.length>0&&b.rows.length===d.rows.length&&blank.length===0&&d.idx>=0&&rank;console.log("brief §2 화면",b.rows.length,"/ design.md §5 행",d.rows.length,"/ 1등 정보 공백",blank.length,"/ 상태 강조 순위 줄",rank?"있음":"없음",ok?"PASS":"FAIL");process.exit(ok?0:1)'
# K-12
node -e 'const s=require("./design/state.json");const t=s.human_gates.token_set_choice;const d=(s.human_gates.delegations||[]).filter(x=>x.stage==="tokens"&&x.item==="token_set"&&x.kind==="q12");const ok=/^SET-[A-Z]$/.test(t.chosen)&&(!t.delegated||(d.length===1&&d[0].default_taken===t.chosen&&t.ai_pick===t.chosen));console.log("chosen",t.chosen,"/ ai_pick",t.ai_pick,"/ delegated",t.delegated,"/ delegations(tokens/token_set/q12)",d.length,ok?"PASS":"FAIL");process.exit(ok?0:1)'
```

`exit_stage1.md` 머리에 실행 시각·`mode`·읽은 상한 값을 적고, 표 아래에 K-2·K-8 의 명령 출력 원문을 그대로 붙인다. 전건 PASS 면 상태 파일 `stages.tokens.exit_check = "design/verify/exit_stage1.md"`.

## 하지 않는 것

- 화면 초안 생성(→ `design-draft-html`), Figma Variables 생성(→ `design-figma-build`)
- 사용자에게 색상값·픽셀값을 묻는 것
- 바닥선(WCAG 대비·스케일 단조성·강약 관계·미감 정합 M-1~M-3)을 사용자에게 묻는 것 — 검사기가 잡고 maker 가 고친다(호출 3분류 ③)
- 위임(`token_set_choice.delegated`)된 선택을 되묻는 것 — 고지만 한다
