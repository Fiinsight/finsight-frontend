import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { judgementClosingPoints, judgementResult, kstDate, feedbackVerdict } from './historyRecords.ts';
const react = {useEffect() {}, createElement:(type,props,...children)=>({type,props,children})};
let news, chartResponse, queries=[];
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../screens/history/JudgementDetailScreen.tsx',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}
}).outputText,{exports,React:react,require:name=>name==='react'?react:
  name==='../../lib/historyRecords'?{judgementClosingPoints,judgementResult,kstDate,feedbackVerdict}:
  name==='@react-navigation/native'?{useIsFocused:()=>true}:
  name==='@tanstack/react-query'?{useQueryClient:()=>({invalidateQueries(){}}),useQuery:options=>{queries.push(options);return options.queryKey[0]==='news-detail'?news:options.queryKey[0]==='chart'?chartResponse:{data:[]};}}:
  name==='react-native'?{SafeAreaView:'SafeAreaView',ScrollView:'ScrollView',Text:'Text',View:'View',TouchableOpacity:'TouchableOpacity',StyleSheet:{create:s=>s}}:
  name==='../../lib/api'?{getNewsDetail:()=>{},getChartData:(...args)=>args,searchStocks:()=>[]}:
  {MiniLineChart:'MiniLineChart',ScreenTopBar:'ScreenTopBar'}});
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):n&&typeof n==='object'?[n,...nodes(n.children)]:[];
const text=tree=>tree.filter(n=>n.type==='Text').flatMap(n=>n.children).join(' ');
const base={newsId:115,judgedAt:'2026-10-02T01:00:00Z',choice:'UP',actualDirection:'UP',actualChangePercent:1.2,reasons:[],feedbackText:'피드백',comparisonDate:'2026-10-06',judgementClose:100,comparisonClose:101.2};
const daily=[{date:'2026-10-01',value:99},{date:'2026-10-02',value:100},{date:'2026-10-06',value:101.2}];
function render(item=base,symbol='005930',response={data:{points:daily}}) { queries=[];chartResponse=response;news={data:{relatedSymbol:symbol,relatedSymbolName:'삼성전자'}};return nodes(exports.JudgementDetailScreen({route:{params:{item}},navigation:{}})); }
test('daily chart uses shared key and cache policy, DB closes only add comparison',()=>{
  const tree=render();assert.match(text(tree),/삼성전자 005930/);assert.match(text(tree),/비교일 종가 101.2.*\+1.20%/);
  const chart=tree.find(n=>n.type==='MiniLineChart');assert.equal(chart.props.points,daily);assert.deepEqual(Array.from(chart.props.markers,m=>m.label),['판단','결과 +1.20%']);
  const query=queries.find(q=>q.queryKey[0]==='chart');assert.deepEqual(Array.from(query.queryKey),['chart','005930','D']);assert.equal(query.staleTime,60_000);assert.equal(query.retry,0);assert.equal(query.refetchOnWindowFocus,false);assert.equal(query.refetchOnReconnect,false);
  assert.deepEqual(query.queryFn({signal:'signal'}),['005930','D',5,'signal']);
  const source=readFileSync(new URL('../screens/chart/ChartScreen/index.tsx',import.meta.url),'utf8');assert.match(source,/\["chart", selectedSymbol, period\]/);assert.match(source,/staleTime: 60_000/);
});
test('missing closes retain real price flow and judgement marker, errors retain feedback and offer retry',()=>{
  const tree=render({...base,comparisonClose:null});assert.match(text(tree),/저장된 비교 종가를 확인할 수 없어요/);
  assert.deepEqual(Array.from(tree.find(n=>n.type==='MiniLineChart').props.markers,m=>m.label),['판단','결과 +1.20%']);
  let retried=0;const failed=render(base,'005930',{isError:true,refetch:()=>retried++});assert.match(text(failed),/가격 차트를 불러오지 못했어요/);assert.match(text(failed),/피드백/);
  failed.find(n=>n.type==='TouchableOpacity'&&n.props.accessibilityRole==='button').props.onPress();assert.equal(retried,1);
  assert.equal(render(base,'KOSPI').find(n=>n.type==='MiniLineChart').props.markers.length,2);assert.equal(queries.find(q=>q.queryKey[0]==='chart').enabled,false);
});
test('closing points reject missing, invalid and reversed dates or nonpositive prices',()=>{
  for(const override of [{comparisonDate:null},{comparisonDate:'2026-10-01'},{judgementClose:0},{comparisonClose:NaN},{judgedAt:'bad'},{comparisonDate:'2026-02-30'}]) assert.equal(judgementClosingPoints({...base,...override}),null);
});
test('non-trading judgement day gets a vertical marker without fabricated price',()=>{
  const component={};const hooks={...react,useState:()=>[300,()=>{}],useMemo:f=>f()};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../components/MiniLineChart.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{exports:component,React:react,require:name=>name==='react'?hooks:name==='react-native'?{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:s=>s}}:name==='react-native-svg'?{default:'Svg',Circle:'Circle',Line:'Line',Path:'Path'}:{formatPrice:String,formatShortDate:String}});
  const tree=nodes(component.MiniLineChart({points:daily,markers:[{date:'2026-10-05',label:'판단일',color:'#F79009'}]}));
  const line=tree.find(n=>n.type==='Line');assert(line.props.x1>150&&line.props.x1<290);assert.match(text(tree),/판단일/);assert.equal(tree.filter(n=>n.type==='Circle').length,1);
});

test('legacy confirmed result shows prior method and hides future-closing message', () => {
  const rendered = text(render({ ...base, comparisonDate: null, judgementClose: null, comparisonClose: null }));
  assert.match(rendered, /아직 채점되지 않았어요/);
  assert.match(rendered, /다음 거래일 적중 통계에는 포함하지 않아요/);
  assert(!rendered.includes('결과 비교 종가는 다음 판정 때 저장돼요'));
  assert(!rendered.includes('정확한 판단'));assert(!rendered.includes('판단 전후 가격 흐름'));
});
