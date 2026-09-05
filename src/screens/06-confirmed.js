/** prd §4-4 확정과 공유 */
const C = require('../components');
const { P } = require('./_data');
const p = (k, o = {}) => C.Person(P[k].n, { owner: P[k].o, ini: P[k].i, ...o });

module.exports = C.Screen({
  id: 'confirmed', title: '대학 동기 모임', back: true,
  body: C.Group(
    `<div class="stack">`
      + `<span class="note">확정되었습니다</span>`
      + `<span class="t-h4" style="font-variant-numeric:tabular-nums">11월 8일 토요일 오후 6:00</span>`
      + `<span class="note">6명 중 4명 참석</span></div>`,
  ) + C.Group(
    C.Sec('참석', '4명'),
    `<div class="people">${['jihyeon', 'yujin', 'hyunwoo', 'taeho'].map(k => p(k)).join('')}</div>`,
  ) + C.Group(
    C.Sec('불참', '2명'),
    `<div class="people">${p('minsu', { note: '12월 희망', muted: true })
      + p('seoyeon', { note: '무응답', muted: true })}</div>`,
  ) + C.Group(
    C.Note('정민수님은 12월을 희망하셨어요. 따로 모임을 잡을까요?'),
  ),
  action: C.ActionBar(C.Button('장소 정하기', { fill: 'light' })
    + C.Button('참석자에게 공유', { leading: 'share' })),
});
