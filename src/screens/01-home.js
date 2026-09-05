/** prd §4-5 전체 조망 + §4-6 상태 구분 */
const C = require('../components');

const ev = (title, sub, trail, opt = {}) => C.Row({ name: title, sub, trail, rowName: 'Row/event', ...opt });

module.exports = C.Screen({
  id: 'home', title: '우리 둘의 일정', tab: 'schedule',
  right: C.Button('모임 만들기', { size: 'small', fill: 'weak', leading: 'plus' }),
  body: C.Group(
    C.Sec('11월 첫째 주', '모임 3건'),
    C.Day({ d: '8', w: '토', weekend: true, items: [
      ev('회사 팀 저녁', '오후 7:00 · 김 부장님 1:1', C.Badge('conflict'), {
        tone: 'danger', rowName: 'Row/event/conflict',
        alert: '같은 날 오후 6시 양가 상견례와 1시간 간격입니다.' }),
      ev('양가 상견례 겸 인사', '오후 6:00 · 4명', C.Badge('confirmed')),
    ] }),
    C.Day({ d: '9', w: '일', weekend: true, items: [
      ev('대학 동기 모임', '후보 3개 발송 · 6명 중 4명 회신', C.Badge('due', { label: 'D-2' })),
    ] }),
  ) + C.Group(
    C.Sec('11월 둘째 주', '모임 2건'),
    C.Day({ d: '15', w: '토', weekend: true, items: [
      ev('동네 친구들', '낮 12:00 · 5명', C.Badge('confirmed')),
      ev('이모네 가족', '오후 5:00 · 6명', C.Badge('confirmed')),
    ] }),
    C.Day({ d: '18', w: '화', items: [
      ev('전 직장 선배', '오후 7:30 · 1:1 · 회신 대기', '3일째'),
    ] }),
  ),
});
