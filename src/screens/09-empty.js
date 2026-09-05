/** C-6 엣지케이스. 다음 행동이 하나로 정해져 있다. */
const C = require('../components');

module.exports = C.Screen({
  id: 'empty', title: '우리 둘의 일정', tab: 'schedule',
  body: `<div class="empty" data-name="State/empty">${C.icon('calendar', 24)}`
    + `<span class="t-body" style="font-weight:var(--fw-bodystrong)">아직 잡힌 모임이 없어요</span>`
    + `<p>청첩장을 드릴 분들을 먼저 등록하면, 누구와 누구를 묶을지 함께 정리해 드릴게요.</p></div>`
    + `<div class="stack">${C.Button('지인 등록하기')}${C.Button('연락처에서 가져오기', { fill: 'light' })}</div>`
    + C.Note('신랑 쪽 지인은 <b>태현</b>님이 따로 등록하실 수 있어요. 두 분의 목록은 자동으로 합쳐집니다.'),
});
