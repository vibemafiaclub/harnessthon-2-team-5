/** prd §4-5 겹침 해결. 색 단독 경고 금지 — 아이콘 + 사유 문장을 동반한다. */
const C = require('../components');

module.exports = C.Screen({
  id: 'conflict', title: '11월 8일 토요일', back: true,
  body: C.Group(
    C.Alert('양가 상견례(오후 6:00)와 회사 팀 저녁(오후 7:00)이 1시간 간격입니다.'),
  ) + C.Group(
    C.Sec('그날 일정'),
    C.Row({ name: '양가 상견례 겸 인사', sub: '오후 6:00 · 4명 · 예약 완료',
            trail: C.Badge('confirmed'), rowName: 'Row/event' }),
    C.Row({ name: '회사 팀 저녁', sub: '오후 7:00 · 김 부장님 1:1 · 확정 전',
            trail: C.Badge('conflict'), tone: 'danger', rowName: 'Row/event/conflict' }),
  ) + C.Group(
    C.Sec('회사 팀 저녁을 옮긴다면', '김 부장님 가능일'),
    C.Row({ name: '11월 9일 일', sub: '오후 7:00', trail: '비어 있음', rowName: 'Row/date' }),
    C.Row({ name: '11월 12일 수', sub: '오후 7:30', trail: '비어 있음', rowName: 'Row/date' }),
    C.Row({ name: '11월 15일 토', sub: '오후 7:00', trail: '모임 2건', rowName: 'Row/date' }),
  ) + C.Group(
    C.Note('상견례는 양가가 모이는 자리라 옮기기 어려워요.'),
  ),
  action: C.ActionBar(C.Button('그대로 두기', { fill: 'light' }) + C.Button('11월 9일로 옮기기')),
});
