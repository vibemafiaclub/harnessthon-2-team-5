/** prd §4-3 회신 수합. 무응답은 정상 상태라 Muted, 마감 임박만 fill 뱃지로 승격. */
const C = require('../components');
const { P } = require('./_data');

const opt = (date, time, tally, trail) => C.Row({
  name: date, sub: time, rowName: 'Row/date',
  trail: C.Tally(tally) + (trail ?? ''),
});
const who = (k, sub, trail) => C.Row({
  lead: C.Avatar(P[k].i, { owner: P[k].o }), name: P[k].n, sub, trail, rowName: 'Row/person',
});

module.exports = C.Screen({
  id: 'responses', title: '대학 동기 모임', back: true,
  right: C.Badge('due', { label: 'D-2', size: 'small' }),
  body: C.Group(
    C.Sec('회신 4 / 6', '10월 3일 금 마감'),
    C.Meter(4, 6),
  ) + C.Group(
    C.Sec('날짜 후보', '가능 · 불가 · 무응답'),
    opt('11월 8일 토', '오후 6:00', { y: 3, n: 0, none: 2 }, C.Badge('confirmed', { label: '최다' })),
    opt('11월 15일 토', '오후 6:00', { y: 2, n: 1, none: 2 }),
    opt('11월 22일 토', '낮 12:00', { y: 1, n: 2, none: 2 }),
  ) + C.Group(
    C.Sec('회신 현황'),
    who('jihyeon', '11/8, 11/15 가능', '회신'),
    who('yujin', '11/8만 가능', '회신'),
    who('hyunwoo', '11/8 가능', '회신'),
    who('minsu', '전부 어려움 · 12월 희망', '불가'),
    who('taeho', '아직 답 없음 · 3일째', C.Button('알림', { size: 'small', fill: 'light' })),
    who('seoyeon', '아직 답 없음 · 1일째', C.Button('알림', { size: 'small', fill: 'light' })),
  ) + C.Group(
    C.Note('2명이 아직 답하지 않았지만 지금 확정할 수 있어요.'),
  ),
  action: C.ActionBar(C.Button('더 기다리기', { fill: 'light' }) + C.Button('11월 8일로 확정')),
});
