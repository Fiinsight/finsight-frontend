import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { judgementClosingPoints, judgementResult } from './historyRecords.ts';
const react = {createElement:(type,props,...children)=>({type,props,children})};
let news,queries=0;
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../screens/history/JudgementDetailScreen.tsx',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}
}).outputText,{exports,React:react,require:name=>name==='react'?react:
  name==='../../lib/historyRecords'?{judgementClosingPoints,judgementResult}:
  name==='@tanstack/react-query'?{useQuery:()=>{queries++;return news;}}:
  name==='react-native'?{SafeAreaView:'SafeAreaView',ScrollView:'ScrollView',Text:'Text',View:'View',TouchableOpacity:'TouchableOpacity',StyleSheet:{create:s=>s}}:
  name==='../../lib/api'?{getNewsDetail:()=>{},getChartData:()=>{throw Error('Detail must never fetch KIS');}}:
  {MiniLineChart:'MiniLineChart',ScreenTopBar:'ScreenTopBar'}});
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):n&&typeof n==='object'?[n,...nodes(n.children)]:[];
const text=tree=>tree.filter(n=>n.type==='Text').flatMap(n=>n.children).join(' ');
const base={newsId:115,judgedAt:'2026-10-02T01:00:00Z',choice:'UP',actualDirection:'UP',actualChangePercent:1.2,reasons:[],feedbackText:'피드백',comparisonDate:'2026-10-06',judgementClose:100,comparisonClose:101.2};
function render(item=base,symbol='005930') { queries=0;news={data:{relatedSymbol:symbol,relatedSymbolName:'삼성전자'}};return nodes(exports.JudgementDetailScreen({route:{params:{item}},navigation:{}})); }
test('stored closing prices draw judgement/comparison markers without requesting chart API',()=>{
  const tree=render();assert.equal(queries,1);assert.match(text(tree),/삼성전자 005930/);assert.match(text(tree),/비교일 종가 101.2.*\+1.20%/);
  const chart=tree.find(n=>n.type==='MiniLineChart');assert.deepEqual(chart.props.points,judgementClosingPoints(base));assert.deepEqual(Array.from(chart.props.markers,m=>m.label),['판단일','비교일']);
});
test('pending, missing stored closes, index and failed news remain explicit',()=>{
  assert.match(text(render({...base,actualDirection:null,judgementClose:null})),/아직 비교할 데이터가 부족/);
  assert.match(text(render({...base,comparisonClose:null})),/비교 종가가 저장되어 있지/);
  assert.match(text(render(base,'KOSPI')),/지수 차트는 준비 중/);
  assert.equal(render(base,'KOSPI').some(n=>n.type==='MiniLineChart'),false);
});
test('closing points reject missing, invalid and reversed dates or nonpositive prices',()=>{
  for(const override of [{comparisonDate:null},{comparisonDate:'2026-10-01'},{judgementClose:0},{comparisonClose:NaN},{judgedAt:'bad'},{comparisonDate:'2026-02-30'}]) assert.equal(judgementClosingPoints({...base,...override}),null);
});
