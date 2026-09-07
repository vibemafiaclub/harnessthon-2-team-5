#!/usr/bin/env node
/**
 * 금지어 정본 — 사용자에게 보이는 문구에서 디자인 어휘 14개를 잡는다.
 * 왜: "금지어 13개 grep" 처럼 숫자로 지시하면 worker 가 하나를 빠뜨려도 항목 수로는 맞는다(interview_prompts §1-6 은 14개, SKILL 은 13개라 적었다).
 *     목록·정규식을 이 파일 한 곳에 두고 모든 검사기가 require 한다. 문서에서 개수를 적을 때는 "14개(scripts/lib/forbidden-words.js 정본)" 로 쓴다.
 * 쓰는 곳: check-brief B-19(§4 plain) · check-html H-13(compare_axis·index·design_guide_compare) · check-interview-page P-4
 *          · design-tokens 종료조건(.set-desc·title) · 0-H ack 표 (a)(b)(c) · 3-F taste_gap 질의 · 0-A2 references.md 처리 방식 열.
 *
 * API:
 *   const { FORBIDDEN_WORDS, FORBIDDEN_RE, TASTE_PATTERN, scanText, scanFile } = require('./lib/forbidden-words');
 *   FORBIDDEN_WORDS : string[14]  — 정보 밀도·위계·톤앤매너·그리드·여백·대비·무드·컨셉·미니멀·모던·레이아웃·컴포넌트·플로우·IA
 *   FORBIDDEN_RE    : RegExp(g)   — 14개를 한 번에 잡는 정규식(IA 는 \bIA\b). 상태(lastIndex)가 있으니 test 만 할 때는 fresh() 로 새로 만들어 쓴다.
 *   TASTE_PATTERN   : RegExp      — 취향형·라벨형 질문 패턴(느낌이 좋|어떤 느낌|선호|취향|스타일이). 질문 text·scene 에만 적용한다.
 *   scanText(str)                 → [{ word, index, context }]  (index 는 str 안의 위치, context 는 앞뒤 20자)
 *   scanFile(path, { stripTags })  → 같은 배열. stripTags 기본 true: 주석·<style>·<script>·태그를 벗기고 보이는 텍스트만 본다(줄 번호는 보존).
 *   scanTaste(str)                → TASTE_PATTERN 매치 배열(같은 모양). stripTags(html) → 텍스트.
 * CLI:
 *   node scripts/lib/forbidden-words.js [--raw] [--taste] <file…>
 *   종료 코드 0 매치 없음 / 1 매치 있음 / 2 입력 오류. 매치마다 "파일:줄:열: 「단어」 …문맥…" 을 원문 그대로 출력한다.
 *   --raw   태그를 벗기지 않고 파일 전체를 본다(JSON·스크립트 안 문구까지)
 *   --taste TASTE_PATTERN 매치도 함께 세어 종료 코드에 반영한다
 */
'use strict';

const FORBIDDEN_WORDS = ['정보 밀도', '위계', '톤앤매너', '그리드', '여백', '대비', '무드', '컨셉', '미니멀', '모던', '레이아웃', '컴포넌트', '플로우', 'IA'];

/* 단어 → 패턴. 띄어쓰기 변형(정보밀도·톤 앤 매너)도 같은 단어로 잡는다. IA 는 영문 경계(\b)로만 — '다이어그램' 류의 부분 일치 방지. */
const PATTERNS = [
  ['정보 밀도', '정보\\s?밀도'],
  ['위계', '위계'],
  ['톤앤매너', '톤\\s?(?:앤|&|and)\\s?매너'],
  ['그리드', '그리드'],
  ['여백', '여백'],
  ['대비', '대비'],
  ['무드', '무드'],
  ['컨셉', '컨셉'],
  ['미니멀', '미니멀'],
  ['모던', '모던'],
  ['레이아웃', '레이아웃'],
  ['컴포넌트', '컴포넌트'],
  ['플로우', '플로우'],
  ['IA', '\\bIA\\b'],
];
const SOURCE = PATTERNS.map(([, p]) => '(?:' + p + ')').join('|');
const FORBIDDEN_RE = new RegExp(SOURCE, 'g');
const fresh = () => new RegExp(SOURCE, 'g');
const ANCHORED = PATTERNS.map(([w, p]) => [w, new RegExp('^(?:' + p + ')$')]);
const wordOf = (hit) => { for (const [w, re] of ANCHORED) if (re.test(hit)) return w; return hit; };

/* 취향형·라벨형 질문 패턴(interview_prompts §1-2·§1-8: "어떤 느낌이 좋으세요" 는 나쁜 질문). 질문 text·scene 에만 적용. */
const TASTE_PATTERN = /느낌이 좋|어떤 느낌|선호|취향|스타일이/;

const context = (str, index, len) => {
  const s = Math.max(0, index - 20), e = Math.min(str.length, index + len + 20);
  return (s > 0 ? '…' : '') + str.slice(s, e).replace(/\s+/g, ' ') + (e < str.length ? '…' : '');
};

function scanText(str) {
  const out = [];
  if (typeof str !== 'string' || !str) return out;
  for (const m of str.matchAll(fresh())) out.push({ word: wordOf(m[0]), index: m.index, context: context(str, m.index, m[0].length) });
  return out;
}

function scanTaste(str) {
  const out = [];
  if (typeof str !== 'string' || !str) return out;
  for (const m of str.matchAll(new RegExp(TASTE_PATTERN.source, 'g'))) out.push({ word: m[0], index: m.index, context: context(str, m.index, m[0].length) });
  return out;
}

/* 보이는 텍스트만 남긴다. 지운 자리의 줄바꿈은 보존해 index → 줄 번호 계산이 원본과 같게 한다. */
function stripTags(html) {
  const nl = (s) => s.replace(/[^\n]/g, '');
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, nl)
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, nl)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, nl)
    .replace(/<[^>]+>/g, (t) => nl(t) + ' ')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

function scanFile(file, opts) {
  const fs = require('fs');
  const strip = !opts || opts.stripTags !== false;
  const raw = fs.readFileSync(file, 'utf8');
  const text = strip ? stripTags(raw) : raw;
  const hits = scanText(text);
  if (opts && opts.taste) hits.push(...scanTaste(text));
  return hits.sort((a, b) => a.index - b.index).map((h) => Object.assign(h, lineCol(text, h.index)));
}

function lineCol(text, index) {
  const before = text.slice(0, index);
  const line = (before.match(/\n/g) || []).length + 1;
  return { line, col: index - before.lastIndexOf('\n') };
}

module.exports = { FORBIDDEN_WORDS, FORBIDDEN_RE, TASTE_PATTERN, scanText, scanFile, scanTaste, stripTags, fresh };

/* ---- CLI ---- */
if (require.main === module) {
  const fs = require('fs');
  const argv = process.argv.slice(2);
  const raw = argv.includes('--raw'), taste = argv.includes('--taste');
  const files = argv.filter((a) => !a.startsWith('--'));
  if (!files.length) { console.error('사용법: node scripts/lib/forbidden-words.js [--raw] [--taste] <file…>'); process.exit(2); }
  let total = 0;
  for (const f of files) {
    if (!fs.existsSync(f)) { console.error('파일 없음: ' + f); process.exit(2); }
    const hits = scanFile(f, { stripTags: !raw, taste });
    for (const h of hits) console.log(`${f}:${h.line}:${h.col}: 「${h.word}」 ${h.context}`);
    total += hits.length;
  }
  console.log(`금지어${taste ? '·취향형' : ''} 매치 ${total}건 (${files.length}개 파일, ${FORBIDDEN_WORDS.length}개 단어${raw ? ', raw' : ', 보이는 텍스트'})`);
  process.exit(total ? 1 : 0);
}
