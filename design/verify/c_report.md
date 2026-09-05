READ: c_first_impression.json, shots/*.png (12장 전부 Read 로 열람), design.md, brief.md
NOTE: `tokens.json` 은 화이트리스트 밖이라 주황의 semantic 정본을 못 봤다. design.md §2("status/response/alert 전용, feedback 과 혼용 금지")만 근거로 삼아, §3 은 화면 간 내부 불일치로만 판정했다.
## 1. 1등 정보 대조 (design.md §5 정본)
| 화면 | §5 1등 정보 | eye_order 1순위 | 판정 |
|---|---|---|---|
| 00_start | 상대 초대 | "청첩장 모임, 둘이 함께 정리해요" 제목 | FAIL — 초대 요소가 화면에 아예 없다 (`direction`) |
| 00_invite / 00_connected | 상대 초대 | "상대를 초대하세요" / "연결됐어요" 제목 | PASS / PASS(약) — connected 는 2순위를 초대 결과가 아니라 주황 신원 칩 색이 가져갔다 |
| 01_home_normal | 이번 주말 확정 모임 + 겹침 경고 | "이번 주말" 제목, 2순위 겹침 경고 | PASS — 단 일정 2건 본문이 아래 리스트보다 시각 무게가 낮다 |
| 01_home_empty | 동일 | 주황 '모임 만들기' 버튼 | FAIL — 1순위를 CTA 색이 가져감 (`local`) |
| 02_detail_normal | 회신 현황(n/N) + 마감까지 | "대학 동기" 제목 (회신 4/6·D-2 는 2순위) | FAIL — 제목이 1순위 (`local`) |
| 02_detail_deadline | 동일 | "내일 마감" | PASS(반) — 마감만 잡히고 회신 5/6 은 3순위 밖 |
| 02_detail_confirmed | 동일 | 주황 '확정 소식 공유하기' 버튼 | FAIL — 확정일이 2순위로 밀림 (`local`) |
| 03_guest_empty·answering | 내가 가능한 날짜 고르기 | 인사말 성격의 두 줄 제목 | FAIL — "가능하신 날짜를 골라 주세요"가 3순위 밖 (`local`) |
## 2. §4C RULE-02 + §3 CONSTRAINT
- 고채도 조항 PASS(00_start '시작하기' 채움, 01_home_empty 버튼 모두 파스텔 아님). 단색 지배 FAIL 5건 (`local`): 00_start·00_invite(유채색 초록 1종), 01_home_empty(주황 1종·브랜드 초록 부재), 01_home_loading(우상단 칩 외 전면 무채색), 02_detail_normal(초록 1종). exception 적용으로 03_guest_* 3장은 판정 제외.
- §3 CONSTRAINT(초대·회신 화면 큰 글씨·진한 대비) FAIL (`direction`): 03_guest_* 본문("안녕하세요, 김민준·이서연입니다.", "9월 20일(일) 낮 12시")이 01_home 본문보다 크지 않다. 03_guest_empty 비활성 '회신 보내기'는 연회색 위 연회색이라 글자가 거의 안 읽힌다.
## 3. 색 역할 혼선 (1콜 지적 확인 — FAIL, `direction`)
| 화면 · 위치 | 주황의 역할 |
|---|---|
| 00_connected 상단 칩 / 01_home_* 우상단 칩 | 신원(신부측) |
| 01_home_normal 이번 주말 아래 배경 띠 | 경보 표면(겹침) |
| 01_home_normal '확정임박' 배지 | 진행 상태 |
| 01_home_empty 중앙 버튼 / 02_detail_confirmed 하단 전폭 버튼 | 최상위 CTA |
| 02_detail_deadline "내일 마감" 텍스트 | 위험 강조 |
→ 신원·경보·상태·CTA 4역할이 한 색에 겹친다. 초록도 동일: 브랜드 CTA(00_start) / '완료' 배지(01_home_normal) / '확정' 배지(00_connected·02_confirmed) / 참석자 이름 칩(02_confirmed) / '가능' 응답(03_answering). design.md §2 혼용 금지 위반.
## 4. 전량 대조 시트 — 불일치 셀만
- 강조색: primary CTA 가 초록(00_start·00_connected·01_home_normal·02_deadline·03_answering) ↔ 주황(01_home_empty·02_confirmed). 같은 라벨 '모임 만들기'가 01_home_normal 초록 ↔ 01_home_empty 주황. (`local`)
- 라운딩: 버튼이 pill(00_invite 두 버튼, 01_home_normal '모임 만들기') ↔ 소 radius(02_deadline 두 버튼, 03_guest '가능/불가능'). (`local`)
- 구분 방식: 02_* 만 회색 페이지 + 흰 카드, 나머지 9장은 흰 페이지. 같은 회신 흐름인데 03_empty/answering 은 날짜 카드 3장, 03_submitted 는 카드를 버리고 hairline 리스트. (`direction`)
- 경보 표면 색온도: 01_home_normal 겹침 = 앰버, 02_deadline 미회신 = 분홍. 같은 경보 역할인데 hue 가 다르다. (`local`)
- 본문 크기: 02_deadline 분홍 박스 4줄 본문이 같은 카드 안 다른 본문보다 작고, 두 버튼 모두 "조금 더 기다리 / 기", "10/17로 확정하 / 기" 로 어절 중간에서 줄바꿈해 깨진다. (`local`)
- 여백 리듬: 하단 버튼 폭이 00_start(좁음)·00_connected(중간)·01_home_normal(좁음)·02_confirmed(전폭)·03_answering(좁음)으로 제각각. 03 은 전폭 카드 아래 좁은 버튼이 왼쪽에 홀로 걸려 축이 어긋난다. (`local`)
- empty·loading 완성도 FAIL (`direction`): 01_home_empty 는 화면 대부분이 점선 상자 하나뿐이고 01_home_normal 의 섹션 구조·헤딩이 전부 사라져 "만들다 만 것"으로 읽힌다. 01_home_loading 스켈레톤에는 "이번 주말" 대제목 자리의 큰 블록이 없어 실제 홈과 골격이 다르다.
## 5. UX 직관 (design.md §7)
- T-1 지인 40명 등록·관계 묶기: **불가** — 지인 풀 화면이 12장에 없다.
- T-2 후보 보내고 회신 모아 확정: **헤맴** — 시작 화면(지인 풀)·모임 편성 화면 부재로 홈 '모임 만들기' 이후가 끊긴다. 후반(02_deadline → '10/17로 확정하기', 1콜 2순위)만 성립.
- T-3 겹침 확인: **찾음** — 겹침 경고가 1콜 2순위. 단 경고 박스에 탭 어포던스(화살표·링크색·테두리)가 없어 상세 이동은 아래 리스트 행을 눌러야 한다. (`local`)
## 6. 적합성 (design.md §8)
- 함정 "웨딩 클리셰": 세리프·꽃 없음 PASS, 단 02_deadline 전폭 분홍 박스 + 03 분홍 '불가능'으로 분홍 면적이 커 경계선. 함정 "무채색 대시보드": 01_home_loading·03_guest_submitted·02_detail_normal 이 사실상 무채색이라 부분 저촉.
- 템플릿처럼 보이게 하는 요소 **FAIL (`local`, 최우선)**: 03_guest_* 좌상단 "상태 1 · 미응답 / 상태 2 · 응답 중 / 상태 3 · 제출 완료" 칩 — 손님에게 보일 수 없는 명세서 라벨이 화면에 남았다. §8 격식 톤·"어른도 본다"와 정면 충돌.
- 도메인 티는 살아있음: 신랑측/신부측 신원, 회신 n/N, D-2 마감까지, 날짜별 가능 인원 막대.
## 7. SLOP-SWEEP (규칙 근거 없음 — 전부 `taste_gap`, 사람 확인 필요)
- 01_home_empty 의 점선 라운드 박스 + 중앙정렬 3단(굵은 문구/설명 2줄/버튼): 가장 전형적인 생성형 empty state.
- 03_guest_submitted 의 연초록 원 + 초록 체크: 범용 성공 화면 관용구.
- 02_detail_deadline 분홍 박스 copy("급한 건 아니지만… 정해둘까요? 언제든 다시 물어볼 수 있어요.") — UI 문구가 아니라 4줄짜리 챗봇 대사로 읽힌다.
- 00_invite 의 점선 상자 안 초록 링크 + 나란한 알약 버튼 2개. 02_detail_confirmed 참석자 6명을 뜻 없는 연초록 이름 칩으로 나열(초록이 '가능' 응답색과 같아 오독을 부른다).
## 8. 자체 채점
- UI 심미 **3** — 타이포 위계·여백은 신입 수준으로 성립하나 버튼 줄바꿈 깨짐·radius/폭 불일치·점선 empty box 가 시니어 선을 막는다.
- UX 직관 **3** — 홈 조망과 D-day·회신 n/N 은 즉시 읽히나 primary CTA 색이 화면마다 뒤집혀 "주 행동"이 흔들리고 핵심 과업 2개가 화면 부재로 완주 불가.
- 적합성 **3** — 도메인 어휘는 실제 서비스 티가 나지만 명세 라벨 노출과 empty 상태가 템플릿 티를 낸다.
