import test from 'node:test';
import assert from 'node:assert/strict';
import {judgementArticleSummary} from './text.ts';
import {feedbackVerdict,judgementSummary} from './historyRecords.ts';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as history from './historyRecords.ts';
const exports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('./judgementResults.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:()=>history});
const {resultBannerMessage}=exports;
test('selected-level summary wins and raw captions never become judgement evidence',()=>{
 const detail={levels:{beginner:'매출이 늘었어요. 비용이 줄었어요.'},rawContent:'(서울=연합뉴스) 이지은 기자 = 현황판에 코스피가 표시되고 있다. 삼성전자 매출이 증가했다.',summary:'사진 설명'};
 assert.equal(judgementArticleSummary(detail,'beginner'),'매출이 늘었어요. 비용이 줄었어요.');
 assert.equal(judgementArticleSummary(detail,'analyst'),'삼성전자 매출이 증가했다.');
});
test('partial means matching direction but small move across statistics and banner',()=>{
 const item={id:1,choice:'UP',actualDirection:'UP',actualChangePercent:.8,comparisonDate:'2026-11-02',judgedAt:'2026-10-30T01:00:00Z'};
 assert.equal(feedbackVerdict(item),'PARTIAL');
 assert.equal(judgementSummary([item]).hits,1);
 assert.match(resultBannerMessage(item),/방향은 맞았지만 변동이 작았어요/);
});
