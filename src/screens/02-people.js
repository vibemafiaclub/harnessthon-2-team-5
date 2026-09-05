/** prd §4-1 지인 풀. 한 사람이 여러 그룹에 동시 소속된다. */
const C = require('../components');
const { P } = require('./_data');

const r = (k, trail) => C.Row({
  lead: C.Avatar(P[k].i, { owner: P[k].o }), name: P[k].n,
  sub: `${P[k].g} · ${P[k].o === 'bride' ? '신부' : '신랑'} 쪽`, trail, rowName: 'Row/person',
});

module.exports = C.Screen({
  id: 'people', title: '지인 62명', tab: 'people',
  right: C.Button('추가', { size: 'small', fill: 'weak', leading: 'plus' }),
  body: `<div class="stack" data-gap="16">`
    + C.Field({ label: '', placeholder: '이름 또는 관계로 찾기', variant: 'box', name: 'Field/search' })
    + `<div>` + r('jihyeon', '모임 2') + r('yujin', '모임 1') + r('hyunwoo', '모임 2')
      + r('bujang', '모임 1') + r('seoyeon', '모임 1') + r('taeho', '묶기')
      + r('sera', '모임 0') + `</div>`
    + C.Note('<b>이현우</b>님처럼 두 그룹에 걸친 분은 어느 모임에 넣어도 됩니다. 넣은 쪽에서만 초대가 갑니다.')
    + `</div>`,
});
