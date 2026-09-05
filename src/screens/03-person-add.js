/** prd §4-1 등록. Text Field의 기본·도움말·에러 상태를 실제로 쓴다. */
const C = require('../components');

module.exports = C.Screen({
  id: 'person-add', title: '지인 등록', back: true,
  body: `<div class="stack" data-gap="24">`
    + `<div class="stack" data-gap="16">`
      + C.Field({ label: '이름', value: '이현우' })
      + C.Field({ label: '연락처', placeholder: '010-0000-0000',
          error: '이미 등록된 번호예요. 강태호님과 같은 번호입니다.' })
    + `</div>`
    + C.Group(C.Sec('관계', '여러 개 고를 수 있어요'), `<div>`
      + C.Row({ lead: C.Check({ on: true }), name: '대학', rowName: 'Row/group' })
      + C.Row({ lead: C.Check({ on: true }), name: '직장', rowName: 'Row/group' })
      + C.Row({ lead: C.Check(), name: '가족', rowName: 'Row/group' })
      + C.Row({ lead: C.Check(), name: '동네', rowName: 'Row/group' })
      + `</div>`)
    + C.Group(C.Sec('만나는 방식'),
      + C.Row({ lead: C.Check({ on: true }), name: '모임으로 함께', rowName: 'Row/group' })
      + C.Row({ lead: C.Check(), name: '1:1로 따로', sub: '모임 편성에서 자동으로 빠집니다', rowName: 'Row/group' }))
    ,
  action: C.ActionBar(C.Button('취소', { fill: 'light' }) + C.Button('등록하기')),
});
