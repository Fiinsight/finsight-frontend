import test from 'node:test';import assert from 'node:assert/strict';import {cleanArticleText,sourceExcerpt} from './text.ts';
test('source excerpts preserve complete sentences, decimals and paragraphs with a wider budget',()=>{
 assert.equal(sourceExcerpt('매출 12.5% 증가. 비용 감소. 수출 증가. 다음 문장.'),'매출 12.5% 증가. 비용 감소. 수출 증가. 다음 문장.');
 assert.equal(Array.from(sourceExcerpt('가'.repeat(400))).length,400);
 const first='가'.repeat(700)+'.';const second='나'.repeat(700)+'.';
 assert.equal(sourceExcerpt(first+' '+second),first);
 assert.equal(sourceExcerpt('첫 문장입니다. 다음 문장입니다.\n\n두 번째 문단입니다.'),'첫 문장입니다. 다음 문장입니다.\n\n두 번째 문단입니다.');
});
test('article and judgement cleanup share byline, photo and copyright filtering',()=>{
 const raw='(서울=연합뉴스) 홍길동 기자 = 매출이 12.5% 늘었다. 이익도 증가했다.\n\n자료사진입니다. 재판매 및 DB 금지.\n\n두 번째 핵심 문단이다.';
 assert.equal(cleanArticleText(raw),'매출이 12.5% 늘었다. 이익도 증가했다.\n\n두 번째 핵심 문단이다.');
 assert.equal(cleanArticleText('사진 촬영 기술의 수출이 늘었다.'),'사진 촬영 기술의 수출이 늘었다.');
});
