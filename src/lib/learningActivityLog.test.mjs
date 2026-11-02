import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compile=(name,require)=>{const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(name,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require,Date,Math,Map});return exports;};
function harness(){
 const stored=new Map(),servers=new Map(),calls=[];let owner=1,fail=false;
 const model=compile('./readingProgressModel.ts',()=>({kstDate:date=>new Date(date.getTime()+9*3600000).toISOString().slice(0,10)}));
 const api={getServerReadingLog:async token=>{calls.push('get');if(fail)throw Error('offline');return servers.get(token)||{};},mergeServerReadingLog:async(token,id,days)=>{calls.push('merge');if(fail)throw Error('offline');servers.set(token,{...(servers.get(token)||{}),...days});return servers.get(token);},putServerReading:async(token,id)=>{calls.push('put');const log=servers.get(token)||{};const day=model.localDateKey(new Date());servers.set(token,{...log,[day]:[...new Set([...(log[day]||[]),id])]});return servers.get(token);}};
 const log=compile('./readingProgress.ts',name=>name==='./auth'?{loadAuthSession:async()=>({userId:owner,accessToken:String(owner)})}:name==='./storage'?{storageGetItem:async key=>stored.get(key),storageSetItem:async(key,value)=>stored.set(key,value)}:name==='./api'?api:model);
 return {stored,servers,calls,log,setOwner:id=>owner=id,setFail:()=>fail=true};
}
test('login imports once, deduplicates concurrent import and server wins after another device changes it',async()=>{
 const h=harness();h.stored.set('finsight.learning.reading.v1:1',JSON.stringify({'2026-10-12':[1,1,null,-1,2]}));
 await Promise.all([h.log.getReadingLog(1),h.log.getReadingLog(1)]);assert.equal(h.calls.filter(x=>x==='merge').length,1);
 assert.equal(JSON.stringify(h.servers.get('1')),JSON.stringify({'2026-10-12':[1,2]}));
 h.servers.set('1',{'2026-10-13':[3]});assert.equal(JSON.stringify(await h.log.getReadingLog(1)),JSON.stringify({'2026-10-13':[3]}));
 assert.equal(h.calls.filter(x=>x==='merge').length,1);
 h.setOwner(2);assert.equal(JSON.stringify(await h.log.getReadingLog(2)),'{}');await assert.rejects(h.log.getReadingLog(1));
});
test('a failed import leaves its marker unset and never reports unconfirmed local attendance',async()=>{
 const h=harness();h.setFail();await assert.rejects(h.log.getReadingLog(1));assert.equal(h.stored.get('finsight.learning.reading.server-import.v1:1'),undefined);
});
test('reading writes use server day and judgement view logs remain local and owner scoped',async()=>{
 const h=harness();await h.log.recordArticleRead(10);await h.log.recordArticleRead(10);
 const server=await h.log.getReadingLog(1);assert.equal(Object.values(server)[0].length,1);
 const date=new Date('2026-10-11T15:01:00Z');await h.log.recordJudgementView(10,date);await h.log.recordJudgementView(10,date);
 assert.equal(JSON.stringify(await h.log.getJudgementViewLog(1)),JSON.stringify({'2026-10-12':[10]}));
 h.setOwner(2);await h.log.recordJudgementView(20,date);assert.equal(JSON.stringify(await h.log.getJudgementViewLog(2)),JSON.stringify({'2026-10-12':[20]}));
});


test('an account change during import never marks the next account or caches the prior response',async()=>{
 const h=harness();const job=h.log.getReadingLog(1);h.setOwner(2);await assert.rejects(job);
 assert.equal(h.stored.get('finsight.learning.reading.server-import.v1:1'),undefined);assert.equal(h.stored.get('finsight.learning.reading.v1:2'),undefined);
});
