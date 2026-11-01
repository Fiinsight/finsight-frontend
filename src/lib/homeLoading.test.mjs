import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('home has one skeleton and switches to wake-up guidance after ten seconds',()=>{
 const exports={},effects=[],timers=[];let slow=false,pending=true;
 const React={createElement:(type,props,...children)=>({type,props,children}),useState:()=>[slow,value=>{slow=value}],useEffect:fn=>effects.push(fn)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/home/HomeScreen/HomeDataGate.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React,setTimeout:(fn,ms)=>{timers.push({fn,ms});return 1},clearTimeout(){},require:name=>name==='react'?React:name==='@tanstack/react-query'?{useQuery:()=>({isPending:pending})}:name==='react-native'?{SafeAreaView:'SafeAreaView',Text:'Text',View:'View'}:{}});
 const first=exports.HomeDataGate({children:'home'});assert.equal(first.props.accessibilityLabel,'홈 전체 불러오는 중');effects[0]();assert.equal(timers[0].ms,10000);timers[0].fn();
 assert.match(JSON.stringify(exports.HomeDataGate({children:'home'})),/서버를 깨우는 중/);
 pending=false;assert.equal(exports.HomeDataGate({children:'home'}),'home');
});
