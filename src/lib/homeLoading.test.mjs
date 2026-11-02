import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {waitMessage,probeLiveness} from './serverHealth.ts';
test('wake-up wording depends on liveness rather than any slow data request',async()=>{
 assert.match(waitMessage('pending'),/서버를 깨우는 중/);
 assert.match(waitMessage('slow'),/최대 1분/);
 assert.doesNotMatch(waitMessage('ready'),/깨우는/);
 assert.match(waitMessage('failed'),/연결/);
 const original=globalThis.fetch;let requested, options;
 globalThis.fetch=async(url,config)=>{requested=url;options=config;return {ok:true};};
 try {const signal=new AbortController().signal;assert.ok(await probeLiveness('https://fixture.test/api',signal)>=0);assert.equal(requested,'https://fixture.test/actuator/health/liveness');assert.equal(options.signal,signal);}finally{globalThis.fetch=original;}
});
test('home skeleton supports cancelling the actual requests and explicit retry',()=>{
 const exports={},values=[],cancelled=[];let slot=0,pending=true,refetched=0;
 const React={createElement:(type,props,...children)=>({type,props,children}),useState:initial=>{const i=slot++;values[i]??=initial;return [values[i],v=>values[i]=v];}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/home/HomeScreen/HomeDataGate.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React,require:name=>name==='react'?React:name==='@tanstack/react-query'?{useQuery:()=>({isPending:pending,refetch:()=>refetched++}),useQueryClient:()=>({cancelQueries:q=>cancelled.push(q.queryKey[0])})}:name==='react-native'?{SafeAreaView:'SafeAreaView',Text:'Text',View:'View',Pressable:'Pressable'}:{RequestWaitNotice:'WaitNotice'}});
 const render=()=>{slot=0;return exports.HomeDataGate({children:'home'});};
 const first=render();assert.equal(first.props.accessibilityLabel,'홈 전체 불러오는 중');
 const notice=first.children.find(n=>n?.type==='WaitNotice');notice.props.onCancel();assert.deepEqual(cancelled,['today-briefing','market-summary']);
 const retry=render().children.find(n=>n?.type==='Pressable');retry.props.onPress();assert.equal(refetched,2);
 pending=false;assert.equal(render(),'home');
});
