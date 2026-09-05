module.exports = [
  { n: '01', title: '홈 · 전체 조망', prd: '§4-5 · §4-6', note: '날짜가 축, 모임이 항목. 겹침만 danger를 쓴다.', frame: require('./01-home') },
  { n: '02', title: '지인 풀',        prd: '§4-1 · §2-1', note: '다중 그룹 소속. 그룹은 색이 아니라 텍스트.', frame: require('./02-people') },
  { n: '03', title: '지인 등록',      prd: '§4-1',        note: 'Text Field 기본·에러 상태. Agreement 체크 컨트롤.', frame: require('./03-person-add') },
  { n: '04', title: '모임 편성',      prd: '§4-2 · §3',   note: '1:1 관계는 disabled로 잠근다.', frame: require('./04-compose') },
  { n: '05', title: '회신 수합',      prd: '§4-3 · §3',   note: '무응답은 Muted. 마감 임박만 fill 뱃지.', frame: require('./05-responses') },
  { n: '06', title: '확정 · 공유',    prd: '§4-4',        note: '디스플레이 서체 없이 H4와 굵기로 위계.', frame: require('./06-confirmed') },
  { n: '07', title: '겹침 해결',      prd: '§4-5 · §3',   note: '색 + 아이콘 + 사유 문장 3종 세트.', frame: require('./07-conflict') },
  { n: '08', title: '초대받은 지인',  prd: '§2-2',        note: '커플 간 날짜 충돌까지 알린다.', frame: require('./08-guest') },
  { n: '09', title: '빈 상태',        prd: 'C-6',         note: '다음 행동이 하나.', frame: require('./09-empty') },
  { n: '10', title: '상태 점검',      prd: 'C-6',         note: '최장 문자열 · 로딩 · 에러를 실제로 렌더한다.', frame: require('./10-states') },
];
