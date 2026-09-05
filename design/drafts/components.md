# 컴포넌트 목록 (Figma `Components` 페이지)

Figma 파일: `sbkAu7Vvampc2WR1CozIWb` — 페이지 id `4:2`
ID·key 상세는 `design/figma_nodes.json` 의 `components` 섹션 참조.

## 1. Chip/Status (id 4:12)
상태 배지. variant: `Status=Waiting`(대기) · `Status=Closing`(확정임박) · `Status=Confirmed`(확정) · `Status=Done`(완료)
- 쓰임: home.html 모임 목록 행 배지, weekend-card / meeting_detail.html 상단 상태 배지
- Row/Meeting 컴포넌트 내부에 인스턴스로 포함됨

## 2. Chip/Response (id 4:19)
회신 응답 배지. variant: `Response=Yes`(가능) · `Response=No`(불가능) · `Response=Pending`(미회신, outline만)
- 쓰임: meeting_detail.html 미회신 목록·확정 참석자 목록

## 3. Button/Primary (id 4:24)
주 버튼. variant: `State=Default` · `State=Disabled`(회색, disabled 배경 토큰 사용)
- 쓰임: home.html '모임 만들기', guest_reply.html '회신 보내기'

## 4. Banner/Alert (id 4:29)
경고 표면. variant: `Type=Overlap`(같은 날 겹침, radius-md) · `Type=Deadline`(마감 임박, radius-lg)
- 쓰임: home.html 겹침 안내, meeting_detail.html 마감 임박 안내 박스

## 5. Field/DateOption (id 4:51)
날짜 후보 선택 항목. variant: `State=Unselected` · `State=Selected-Yes` · `State=Selected-No`
- 쓰임: guest_reply.html 날짜 카드 + 가능/불가능 버튼

## 6. Row/Meeting (id 10:23)
모임 목록 행. variant: `Layout=Normal` · `Layout=Long-text`(긴 모임 이름, 텍스트 wrap) · `Layout=Skeleton`(로딩 뼈대)
- 쓰임: home.html list-card 안 모임 목록, 로딩 상태
- Normal/Long-text 는 Chip/Status(Waiting) 인스턴스 포함

## 규칙 준수
- 모든 fill/stroke/gap/padding/radius: Variables 바인딩 (하드코딩 0건, 감사 완료)
- 모든 텍스트: 텍스트 스타일 적용 (미적용 0건, 감사 완료)
- 전부 auto-layout, 절대좌표 배치 없음
- 레이어명 전부 의미 부여 (`Frame N`/`Rectangle N` 등 잔존 0건)

## ASSUMPTION
Field/DateOption 날짜 텍스트·버튼 라벨이 초안 HTML 에서는 굵게(bold) 표시되나, 별도 bold 텍스트 스타일이 정의돼 있지 않아 기존 body-large/body 스타일(굵기 400)을 그대로 적용했다. "텍스트 스타일 미적용 0건" 규칙을 시각적 굵기 재현보다 우선했다.
