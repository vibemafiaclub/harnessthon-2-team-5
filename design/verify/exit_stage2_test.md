# 2단계 종료조건 검사

## (1) 전체 파일 기준

| PRD 기능 | 매핑된 화면 | 판정 |
|---|---|---|
| F1 (지인 풀 등록·관리) | contacts_list.html, contact_edit.html | ✓ |
| F2 (모임 편성) | group_compose.html | ✓ |
| F3 (일정 후보·회신 수합) | date_propose.html, meeting_detail.html, guest_reply.html | ✓ |
| F4 (확정·공유) | meeting_detail.html | ✓ |
| F5 (전체 일정 조망) | home.html | ✓ |
| F6 (진행 상태 구분) | home.html | ✓ |

**RESULT (1): PASS** — 모든 PRD 기능(F1~F6)이 화면에 매핑됨.

## (2) contacts_list.html, contact_edit.html 제외 가정

제외 시 남은 화면: onboarding.html, home.html, group_compose.html, date_propose.html, meeting_detail.html, guest_reply.html

| PRD 기능 | 매핑된 화면 | 판정 |
|---|---|---|
| F1 (지인 풀 등록·관리) | *없음* | ✗ |
| F2 (모임 편성) | group_compose.html | ✓ |
| F3 (일정 후보·회신 수합) | date_propose.html, meeting_detail.html, guest_reply.html | ✓ |
| F4 (확정·공유) | meeting_detail.html | ✓ |
| F5 (전체 일정 조망) | home.html | ✓ |
| F6 (진행 상태 구분) | home.html | ✓ |

**RESULT (2): FAIL** — **F1이 어느 화면에도 매핑되지 않음** (검사기 정상 작동 확인).

## (3) 프레임 규격 동일성

| 파일 | 폭×높이 | 상태바 | 탭바 |
|---|---|---|---|
| onboarding.html | responsive | NO | NO |
| home.html | responsive | NO | NO |
| contacts_list.html | 390×844 | YES | YES |
| contact_edit.html | 390×844 | YES | NO |
| group_compose.html | 390×844 | YES | NO |
| date_propose.html | 390×844 | YES | NO |
| meeting_detail.html | responsive | NO | NO |
| guest_reply.html | responsive | NO | NO |

**RESULT (3): FAIL** — 프레임 규격 불일치. onboarding(responsive), home(responsive), meeting_detail(responsive), guest_reply(responsive)는 responsive 레이아웃이고, contacts_list/contact_edit/group_compose/date_propose는 390×844 모바일 고정 프레임. 상태바·탭바도 일관성 없음.
