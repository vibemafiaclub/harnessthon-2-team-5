# Figma 화면 캡처 원장

> 캡처 경로: `get_screenshot` 이 돌려주는 asset URL 을 `curl -L` 로 받는다(D-44).
> **캡처 시각은 파일의 실제 mtime 이 정본이다** — 여기 적힌 값이 아니라 파일이 근거다(D-42).
> lastModified 는 A검사가 Figma 를 읽은 시각(`audit_screens.json` 의 generated_at)이다.
> Plugin API 로 파일 수정 시각을 읽을 수 없어, 마지막 쓰기 이후이고 캡처 이전인 실측 시각을 쓴다.

| 파일 | 노드 id | 캡처 시각(ISO) | lastModified(ISO) | sha |
|---|---|---|---|---|
| 00_onboarding_connected.png | 14:298 | 2026-09-07T08:06:49Z | 2026-09-07T07:44:06.685Z | cf2d5a74bc5f |
| 00_onboarding_invite.png | 14:294 | 2026-09-07T08:06:49Z | 2026-09-07T07:44:06.685Z | 465fc69f1437 |
| 00_onboarding_start.png | 14:290 | 2026-09-07T08:06:49Z | 2026-09-07T07:44:06.685Z | ce66f85a7f87 |
| 01_home_empty.png | 14:33 | 2026-09-07T08:06:50Z | 2026-09-07T07:44:06.685Z | 50332733d74f |
| 01_home_loading.png | 14:41 | 2026-09-07T08:06:50Z | 2026-09-07T07:44:06.685Z | b2d192d050af |
| 01_home_normal.png | 14:25 | 2026-09-07T08:06:50Z | 2026-09-07T07:44:06.685Z | 5e69d425e7fa |
| 02_meetingdetail_confirmed.png | 14:265 | 2026-09-07T08:06:16Z | 2026-09-07T07:44:06.685Z | 909dec815dd9 |
| 02_meetingdetail_deadline.png | 14:226 | 2026-09-07T08:06:16Z | 2026-09-07T07:44:06.685Z | 281e965e6e72 |
| 02_meetingdetail_normal.png | 14:12 | 2026-09-07T08:06:15Z | 2026-09-07T07:44:06.685Z | 0dba231aa3e7 |
| 03_guestreply_answering.png | 14:160 | 2026-09-07T08:06:50Z | 2026-09-07T07:44:06.685Z | e6744f99c239 |
| 03_guestreply_empty.png | 14:97 | 2026-09-07T08:06:51Z | 2026-09-07T07:44:06.685Z | d9e848b577ea |
| 03_guestreply_submitted.png | 14:204 | 2026-09-07T08:06:51Z | 2026-09-07T07:44:06.685Z | 419bd6e5c35e |
| 04_contacts_empty.png | 36:321 | 2026-09-07T08:06:18Z | 2026-09-07T07:44:06.685Z | e6f2b694150b |
| 04_contacts_loading.png | 36:352 | 2026-09-07T08:06:18Z | 2026-09-07T07:44:06.685Z | 182beb071b91 |
| 04_contacts_normal.png | 35:195 | 2026-09-07T08:06:17Z | 2026-09-07T07:44:06.685Z | 8b3300589f7c |
| 05_contactedit_edit.png | 36:395 | 2026-09-07T08:06:16Z | 2026-09-07T07:44:06.685Z | 54d3b4a873b2 |
| 05_contactedit_new.png | 42:239 | 2026-09-07T08:06:16Z | 2026-09-07T07:44:06.685Z | b1161be4e023 |
| 05_contactedit_oneonone.png | 43:241 | 2026-09-07T08:06:17Z | 2026-09-07T07:44:06.685Z | daae1e9e4007 |
| 06_groupcompose_noname.png | 45:247 | 2026-09-07T08:06:19Z | 2026-09-07T07:44:06.685Z | bbb4c63cd840 |
| 06_groupcompose_none.png | 44:245 | 2026-09-07T08:06:18Z | 2026-09-07T07:44:06.685Z | 528d2dbd865c |
| 06_groupcompose_selecting.png | 43:286 | 2026-09-07T08:06:18Z | 2026-09-07T07:44:06.685Z | abed6055434b |
| 07_datepropose_empty.png | 46:306 | 2026-09-07T08:06:51Z | 2026-09-07T07:44:06.685Z | 9051fd218a2b |
| 07_datepropose_selected.png | 45:441 | 2026-09-07T08:06:51Z | 2026-09-07T07:44:06.685Z | b7f3257a3651 |
| 07_datepropose_sent.png | 46:356 | 2026-09-07T08:06:52Z | 2026-09-07T07:44:06.685Z | b07e8fcaf7b8 |
