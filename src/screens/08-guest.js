/** prd §2-2 초대받은 지인. 여러 커플의 요청을 한 화면에서 처리한다. */
const C = require('../components');

const ans = (v) => C.Button('가능', { size: 'small', fill: v === 'yes' ? 'fill' : 'light' })
  + C.Button('불가', { size: 'small', fill: v === 'no' ? 'fill' : 'light',
                      tone: v === 'no' ? 'danger' : 'primary' });

module.exports = C.Screen({
  id: 'guest', title: '받은 요청 3건',
  body: C.Group(
    C.Note('<b>박지현</b>님, 이번 달에 세 커플이 청첩장모임을 요청했어요.'),
  ) + C.Group(
    C.Sec('수민 & 태현', '대학 동기 · 6명'),
    C.Row({ name: '11월 8일 토', sub: '오후 6:00', trail: ans('yes'), rowName: 'Row/date' }),
    C.Row({ name: '11월 15일 토', sub: '오후 6:00', trail: ans('yes'), rowName: 'Row/date' }),
    C.Row({ name: '11월 22일 토', sub: '낮 12:00', trail: ans('no'), rowName: 'Row/date' }),
  ) + C.Group(
    C.Sec('은지 & 준영', '동네 친구 · 4명'),
    C.Row({ name: '11월 15일 토', sub: '오후 7:00', trail: ans(), rowName: 'Row/date' }),
    C.Note('11월 15일은 위에서 <b>가능</b>이라고 답한 날이에요.'),
  ) + C.Group(
    C.Sec('현아 & 도윤', '회신 완료'),
    C.Row({ name: '12월 6일 토요일로 확정', sub: '오후 6:00 · 참석으로 답하셨어요',
            trail: C.Badge('confirmed'), rowName: 'Row/event' }),
  ),
  action: C.ActionBar(C.Button('회신 보내기')),
});
