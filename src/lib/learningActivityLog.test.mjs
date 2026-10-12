import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compile=(name,require)=>{const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(name,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require});return exports;};
test('judgement views stay owner scoped and count once per KST day without server writes',async()=>{
 const stored=new Map(); let owner=1;
 const model=compile('./readingProgressModel.ts',()=>({kstDate:date=>new Date(date.getTime()+9*3600000).toISOString().slice(0,10)}));
 const log=compile('./readingProgress.ts',name=>name==='./auth'?{loadAuthSession:async()=>({userId:owner})}:name==='./storage'?{storageGetItem:async key=>stored.get(key),storageSetItem:async(key,value)=>stored.set(key,value)}:model);
 const date=new Date('2026-10-11T15:01:00Z');
 await log.recordJudgementView(10,date); await log.recordJudgementView(10,date);
 assert.equal(JSON.stringify(await log.getJudgementViewLog(1)),JSON.stringify({'2026-10-12':[10]}));
 assert.equal(JSON.stringify(await log.getReadingLog(1)),'{}');
 owner=2; await log.recordJudgementView(20,date);
 assert.equal(JSON.stringify(await log.getJudgementViewLog(2)),JSON.stringify({'2026-10-12':[20]}));
 stored.set('finsight.learning.reading.v1:2',JSON.stringify({'bad-date':[10],'2026-02-30':[10],'2026-10-12':[1,1,null,-1,2]}));
 assert.equal(JSON.stringify(await log.getReadingLog(2)),JSON.stringify({'2026-10-12':[1,2]}));
});
