/** C-6 엣지케이스 — 최장 문자열 · 로딩 · 에러를 실제로 렌더한다. */
const C = require('../components');

module.exports = C.Screen({
  id: 'states', title: '상태 점검', back: true,
  body: C.Group(
    C.Sec('최장 문자열', '한글 2배 길이'),
    C.Row({ name: '대학교 동아리 선후배 모임 겸 축하 자리',
            sub: '오후 6:00 · 12명 중 9명 회신',
            trail: C.Badge('due', { label: 'D-14' }), rowName: 'Row/event' }),
    C.Row({ lead: C.Avatar('한나', { owner: 'bride' }), name: '남궁한나비',
            sub: '대학 · 직장 · 동네 · 가족 · 신부 쪽',
            trail: '모임 12', rowName: 'Row/person' }),
    C.Row({ name: '11월 22일 토', sub: '낮 12:00',
            trail: C.Tally({ y: 9, n: 3, none: 4 }), rowName: 'Row/date' }),
    `<div class="people" style="padding-top:var(--sp-8)">`
      + C.Person('남궁한나비', { owner: 'bride', ini: '한나', note: '12월 희망', muted: true })
      + `</div>`,
  ) + C.Group(
    C.Sec('로딩', '너비 유지'),
    C.Button('참석자에게 공유하는 중', { state: 'loading' }),
  ) + C.Group(
    C.Sec('에러', '원인 + 복구 행동'),
    C.Field({ label: '연락처', placeholder: '010-0000-0000',
      error: '이미 등록된 번호예요. 강태호님과 같은 번호입니다.' }),
  ) + C.Group(
    C.Alert('회신을 보내지 못했어요. 네트워크를 확인해 주세요.'),
  ),
  action: C.ActionBar(C.Button('다시 보내기')),
});
