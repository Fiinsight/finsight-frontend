import test from 'node:test';import assert from 'node:assert/strict';import {sourceExcerpt} from './text.ts';
test('old full-body responses are limited before rendering without splitting decimals',()=>{
 assert.equal(sourceExcerpt('매출 12.5% 증가. 비용 감소. 수출 증가. 다음 문장.'),'매출 12.5% 증가. 비용 감소. 수출 증가.');
 assert.equal(Array.from(sourceExcerpt('가'.repeat(400))).length,300);
});
