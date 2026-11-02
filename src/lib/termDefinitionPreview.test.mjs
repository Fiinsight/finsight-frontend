import test from 'node:test';
import assert from 'node:assert/strict';
import {termDefinitionPreview} from './termDefinitionPreview.ts';
test('previews keep whole Korean words and full short definitions',()=>{
 assert.equal(termDefinitionPreview('통화 교환 비율입니다.'),'통화 교환 비율입니다.');
 const text='기업이 일정 기간 동안 사업을 운영하며 얻은 성과를 뜻합니다. 이후 수익성도 확인할 수 있습니다.';
 const preview=termDefinitionPreview(text);assert(preview.length<=40);assert(!preview.includes('있습니…'));assert(preview.endsWith('뜻합니다.')||preview.endsWith(' …'));
 assert.equal(termDefinitionPreview('가'.repeat(100)),'정의를 펼쳐서 읽어보세요.');
});
