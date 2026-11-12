import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {chartLearningParams} from './chartDocent.ts';

test('chart learning uses the representative lesson route and preserves level; absent news keeps the guide',()=>{
  const move={newsId:10,docent:{newsId:20}};
  assert.deepEqual(chartLearningParams(move,'analyst'),{screen:'NewsDetail',params:{newsId:20,openQuiz:true,readMode:'level',readingLevel:'analyst'}});
  assert.equal(chartLearningParams({newsId:10,docent:null}).params.newsId,10);
  assert.equal(chartLearningParams(null),undefined);
  assert.equal(chartLearningParams({newsId:null,docent:{newsId:null}}),undefined);
});

test('insights carry the selected level and cancellation while candles stay independent',async()=>{
  const calls=[];
  const http={interceptors:{request:{use(){}},response:{use(){}}},get:async(path,options)=>{
    calls.push({path,options});return {data:{symbol:'005930',period:'D',fallback:false,candles:[],minuteCandles:[],moveInsights:[],relatedNews:[]}};
  }};
  const exports={};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./api.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,
    {exports,process:{env:{EXPO_PUBLIC_API_BASE_URL:'https://fixture.invalid/api'}},require:name=>name==='axios'?{create:()=>http}:name==='./getRetry'?{installSafeGetRetry(){}}:{}});
  const signal=new AbortController().signal;
  await exports.getChartInsights('005930','MINUTE',5,signal,'analyst');
  assert.equal(calls[0].path,'/charts/005930/insights');
  assert.equal(calls[0].options.params.level,'analyst');assert.equal(calls[0].options.params.interval,5);assert.equal(calls[0].options.signal,signal);
  await exports.getChartInsights('005930','D',5,signal);
  assert.equal('level' in calls[1].options.params,false);
  await exports.getChartCandles('005930','D',5,signal);
  assert.equal(calls[2].path,'/charts/005930/candles');assert.equal('level' in calls[2].options.params,false);
});

test('anonymous charts can load insights; authenticated charts wait for their own level',()=>{
  const theme={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../theme/index.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:theme});
  for(const [owner,level,pending,enabled] of [[null,undefined,true,true],[7,'analyst',false,true],[7,undefined,true,false]]) {
    const queries=[];let state=0;const exports={};
    const React={createElement:(type,props,...children)=>({type,props,children}),useState:value=>{const i=state++;return [i===2?false:i===4?owner:value,()=>{}];},useEffect(){},useCallback:f=>f,useMemo:f=>f(),useRef:value=>({current:value})};
    const chart={symbol:'005930',period:'D',fallback:false,candles:[],minuteCandles:[],moveInsights:[],relatedNews:[]};
    vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../screens/chart/ChartScreen/index.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,
      {exports,React,require:name=>name==='react'?React:name==='react-native'?{StyleSheet:{create:s=>s}}:name==='@react-navigation/native'?{useFocusEffect(){}}:name==='@tanstack/react-query'?{useQueryClient:()=>({}),useMutation:()=>({}),useQuery:options=>{queries.push(options);return options.queryKey[0]==='chart'?{data:chart}:options.queryKey[0]==='learning-preferences'?{data:level?{level}:undefined,isPending:pending}:{data:[]};}}:name.endsWith('/theme')?theme:name.endsWith('/chartDocent')?{movesByDate:x=>x,strongestMove:()=>null}:{} });
    exports.ChartScreen({route:{params:{symbol:'005930'}},navigation:{}});
    const insight=queries.find(q=>q.queryKey[0]==='chart-insights');
    assert.equal(insight.enabled,enabled);assert.equal(insight.queryKey.at(-1),level);
    assert.equal(queries.find(q=>q.queryKey[0]==='chart').enabled,true);
  }
});
