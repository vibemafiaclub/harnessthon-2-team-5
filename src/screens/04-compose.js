/** prd §4-2 편성 + §3 1:1 관계 제외 */
const C = require('../components');
const { P } = require('./_data');

const pick = (k, opt = {}) => C.Row({
  lead: C.Check({ on: opt.on, disabled: opt.disabled, label: P[k].n }),
  name: P[k].n, sub: P[k].g, trail: opt.trail,
  state: opt.disabled ? 'disabled' : (opt.on ? 'selected' : undefined),
  rowName: 'Row/person', interactive: true,
});

module.exports = C.Screen({
  id: 'compose', title: '누구와 만날까요', back: true,
  body: C.Group(
    C.Sec('선택 4명', '3~6명을 권해요'),
    `<div class="people">${['jihyeon', 'yujin', 'minsu', 'hyunwoo']
      .map(k => C.Person(P[k].n, { owner: P[k].o, ini: P[k].i })).join('')}</div>`,
  ) + C.Group(
    C.Sec('대학 그룹', '14명'),
    `<div>`
      + pick('jihyeon', { on: true }) + pick('yujin', { on: true })
      + pick('minsu', { on: true }) + pick('hyunwoo', { on: true })
      + pick('seoyeon') + pick('bujang', { disabled: true, trail: '따로 뵙기' })
      + `</div>`,
  ) + C.Group(
    C.Note('<b>이현우</b>님은 직장 그룹에도 있어요. 이 모임에 넣으면 직장 모임에서는 빠집니다.'),
  ),
  action: C.ActionBar(C.Button('다음 · 날짜 후보 고르기')),
});
