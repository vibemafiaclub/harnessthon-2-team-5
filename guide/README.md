# 가이드 스키마 명세

파이프라인의 모든 단계는 **이 파일들만** 판단 근거로 삼는다. 대화 맥락에서 기준을 추론하지 않는다.

## 3계층 (concept.md 5장과 1:1 대응)

| 계층 | 파일 | 소유자 | 언제 정해지나 |
|---|---|---|---|
| **L1 완전 고정** | `guide/core.rules.json` | 하네스 | 미리 내장. 프로젝트가 수정하지 않음 |
| **L2 항목 고정 / 값 프로젝트별** | `<project>/project.rules.json` | 프로젝트 | 0단계에서 캘리브레이션 |
| **L3 완전 프로젝트별** | 같은 파일의 `project_specific.rules` | 프로젝트 | 0단계에서 새로 정의 |

**병합 순서**: `core` → `project` → `project_specific`. 뒤가 앞을 덮어쓰지만,
**core의 `blocker`는 덮어쓸 수 없다** — 이것이 "어떠한 상황에서도"의 최후 방어선이다.
프로젝트가 core 규칙을 완화하려 하면 컴파일이 실패한다.

## 규칙 한 개의 모양

```jsonc
{
  "id": "spacing-grid",              // 고유. 위반 리포트·수정 루프가 이 값으로 추적한다
  "title": "Spacing 그리드 준수",
  "rationale": "...",                // 왜 이게 결함인가. 사람이 이의 제기할 때 읽는 자리
  "stage": ["wireframe", "design"],  // 이 규칙이 활성화되는 단계
  "severity": "blocker" | "warning",
  "applies_to": { ... },             // 노드 선택자. 비우면 전체
  "check": { "type": "...", ... },   // 검사기가 dispatch하는 선언
  "autofix": true | false,
  "fix_hint": "...",                 // 자동 수정이든 사람이든 따라야 할 수정 방침
  "status": "filled" | "unfilled",   // project 계층에만 존재
  "source": "..."                    // 이 값이 어디서 나왔는지 (brief.md 인용 또는 '가정')
}
```

### severity 의미

- **`blocker`** — 게이트를 막는다. 자동 수정을 시도하고, 상한 내에 못 고치면 사람에게 에스컬레이션.
- **`warning`** — 막지 않는다. 리포트에 기록만 하고 진행한다.

심각도를 나누지 않으면 게이트가 사소한 위반으로 무한루프에 빠진다.

### `stage` 의미

와이어프레임과 최종 디자인은 지켜야 할 것이 다르다. 와이어프레임에서 색 대비를 검사하는 것은
무의미하고(회색조 강제), 반대로 터치 타깃 크기는 구조 단계부터 확정되어야 한다.
`stage`에 현재 단계가 없는 규칙은 **검사하지 않는다** — 통과시키는 것이 아니라 평가 대상이 아니다.

## `check.type` 카탈로그

검사기(`scripts/audit.js`)가 구현해야 하는 전체 목록이다. 여기 없는 타입을 규칙에 쓰면 컴파일이 실패한다.

| type | 파라미터 | 판정 | v0 구현 |
|---|---|---|---|
| `contrast_ratio` | `min`, `large_text_min?`, `large_text_threshold?` | 전경/배경 대비율이 최소값 이상인가 | v0.2 |
| `min_size` | `width`, `height`, `include_padding?` | 노드 실측 크기가 최소값 이상인가 | v0.2 |
| `min_font_size` | `size_pt` | 폰트 크기가 최소값 이상인가 | v0.2 |
| `image_fill_present` | — | 이미지 fill이 실제 이미지를 가지고 있는가 | v0.2 |
| `text_overflow` | — | 텍스트가 부모 경계에서 잘리는가 | v0.2 |
| `saturation_max` | `max` | 모든 색의 채도가 상한 이하인가 | v0.2 |
| `color_allowlist` | `allowed` | 사용된 색이 전부 허용 팔레트 안에 있는가 | **v0** |
| `color_denylist` | `deny` | 금지 팔레트의 값을 그대로 쓰고 있지 않은가 | **v0** |
| `style_bound` | `style_kind`, `allowed` | 인라인 값이 아니라 스타일/변수에 바인딩되어 있는가 | v0.2 |
| `multiple_of` | `unit`, `properties` | 지정 속성값이 단위의 배수인가 | **v0** |
| `scale_allowlist` | `scale`, `properties` | 지정 속성값이 스케일 배열 안에 있는가 | **v0** |
| `reuse_ratio` | `min` | 인스턴스 / 전체 노드 비율이 최소값 이상인가 | v0.2 |
| `name_pattern` | `deny?`, `allow?` | 레이어 이름이 패턴을 만족하는가 | **v0** |
| `variant_states_present` | `required` | 필수 상태 variant가 존재하는가 | v0.2 |

### `color_denylist`가 필요한 이유 — 참조는 구조를 주고, 색은 도메인이 준다

참조 디자인 시스템에서 정당하게 가져올 수 있는 것은 **구조**다: 역할 이름(primary·surface·danger),
스케일의 모양, 상태 계약, 지오메트리. 반면 **색 값 자체는 그 회사의 브랜드이자 그 도메인의 답**이며,
다른 제품에 옮기면 두 가지가 동시에 깨진다.

1. **정체성 도용** — 참조의 브랜드 블루를 그대로 쓰면 그 회사의 제품처럼 보인다.
2. **도메인 불일치** — 색은 그 제품이 무엇을 하는 물건인지에서 나온다. 금융 앱의 신뢰 블루가
   청첩장 앱의 답이 될 이유가 없다. 참조를 복사하면 0단계에서 추출한 판단기준이 색에 반영되지 않는다.

그래서 `color_denylist`는 **참조 팔레트를 금지 목록으로** 받는다. 팔레트는 PRD·클라이언트 반응에서
도출하고, 참조에서는 "역할이 몇 개이고 어떤 계약을 갖는가"만 가져온다.

**구조는 베끼고 색은 도출한다** — 이것이 이 하네스가 참조 시스템을 쓰는 유일한 방식이다.

### `scale_allowlist`가 필요한 이유

`multiple_of`는 **등차 스케일만** 검사할 수 있다. 참조 시스템의 간격이 4·6·8·16·24·32처럼
등차가 아니면 어떤 단위를 골라도 검사가 성립하지 않는다 — 단위 2는 10·12·14를 통과시키고,
단위 4는 6을 위반으로 잡는다. 이럴 때 `scale_allowlist`로 **허용 값 자체를 열거**한다.

`multiple_of`와 `scale_allowlist` 중 하나만 쓴다. 둘을 같은 속성에 걸면 서로 모순된다.

`$tokens.<경로>` 문자열은 같은 파일 `tokens` 블록의 값으로 치환된다. 값 중복을 만들지 않기 위한 참조다.

## 미구현 check.type 처리

`check.type`에는 두 가지 실패 방식이 있고, 거동이 다르다.

- **카탈로그에 없는 타입** (오타·창작) → 컴파일 **실패**. 규칙을 고쳐야 한다.
- **카탈로그에 있으나 검사기가 아직 구현하지 않은 타입** → 검사기가 `skipped_unimplemented`로 보고한다.
  이때 해당 규칙이 `warning`이면 그냥 기록하고 넘어가지만, **`blocker`이면 사람 게이트로 승격**한다 —
  "검사기가 못 봤다"를 "통과했다"로 처리하지 않는다. 리포트에 미검사 blocker 목록을 명시하고
  사람에게 육안 확인을 요청한 뒤에만 다음 단계로 넘어간다.

이 규약 덕분에 검사기를 점진적으로 구현하면서도 fail-closed 성질이 깨지지 않는다.

## fail-closed 규칙

다음 중 하나라도 해당하면 **파이프라인은 W단계 진입을 거부한다.**

1. `status: "unfilled"`인 `blocker` 규칙이 남아 있다
2. `$tokens` 참조가 `null`을 가리킨다
3. `check.type`이 카탈로그에 없다
4. 프로젝트 계층이 core의 `blocker`를 완화하려 한다
5. 참조 시스템을 선언했는데 `tokens._reference_palette`가 비어 있다
   (`no-reference-color-copy`가 검사할 대상이 없으면 그 규칙은 침묵 통과가 된다)
6. `color_allowlist`의 `allowed`가 `color_denylist`의 `deny`와 겹친다
   — 두 blocker를 동시에 만족할 수 있는 산출물이 존재하지 않는다. **규칙이 모순인 것이지 화면 결함이 아니다.**
   팔레트를 개정하면 L3 규칙의 `allowed`도 함께 갱신해야 하며, 이 검사가 그 누락을 잡는다.

"값을 모르니 일단 검사를 건너뛰고 진행" 은 허용하지 않는다. 모르면 **가정으로 명시하고 `source`에
`"가정: ..."`을 기록한 뒤 `filled`로 올린다.** 침묵 통과와 명시적 가정은 다르다 — 후자는 나중에 검증 가능하다.

## 검사기 호출 규약

- **Figma MCP rate limit** 때문에 `audit.js`는 **1회 호출로 전체 노드를 순회**한다. 규칙마다 따로 호출하지 않는다.
- `use_figma` 호출 전에는 **반드시 `figma-use` 스킬을 먼저 로드한다.** 선택이 아니다.

## 위반 리포트 출력 형식

```json
{
  "stage": "design",
  "target": "<frame node id>",
  "passed": false,
  "violations": [
    { "rule": "spacing-grid", "node": "Card / paddingLeft", "node_id": "12:34",
      "expected": 16, "actual": 14, "severity": "blocker", "autofix": true }
  ],
  "unchecked_blockers": [
    { "rule": "contrast-text-aa", "reason": "skipped_unimplemented", "requires_human_review": true }
  ],
  "summary": { "blocker": 1, "warning": 3, "skipped_out_of_stage": 5, "skipped_unimplemented": 1 }
}
```

`passed`는 **`blocker` 개수가 0이고 `unchecked_blockers`가 비어 있을 때만** true다.
