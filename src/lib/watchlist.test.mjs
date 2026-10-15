import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { initialChartSymbol, lastWatchlistKey, withoutWatchlistNews, watchlistNewsState } from './watchlist.ts';
const model={initialChartSymbol,lastWatchlistKey,withoutWatchlistNews,watchlistNewsState};
const list=[{symbol:'000660',name:'SK하이닉스',addedAt:'2026-10-15'},{symbol:'035720',name:'카카오',addedAt:'2026-10-15'}];
const compile=path=>ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):n&&typeof n==='object'?[n,...nodes(n.children)]:[];
const React={createElement:(type,props,...children)=>({type,props:props??{},children})};
const native=Object.fromEntries(['Text','View','Pressable','TouchableOpacity','ScrollView','SafeAreaView','ActivityIndicator'].map(n=>[n,n]));native.StyleSheet={create:s=>s};
function component(path,exportsName){const exports={};vm.runInNewContext(compile(path),{exports,React,require:n=>n==='react'?React:n==='react-native'?native:n.endsWith('/watchlist')?model:n.endsWith('/format')?{formatPercent:String,formatPrice:String}:n.endsWith('/NewsCard')?{NewsCard:'NewsCard'}:{}});return exports[exportsName];}

test('first chart priority, removed saved symbol and per-owner storage keys',()=>{
 assert.equal(initialChartSymbol('005930',list,'035720'),'005930');
 assert.equal(initialChartSymbol(undefined,list,'035720'),'035720');
 assert.equal(initialChartSymbol(undefined,list,'999999'),'000660');
 assert.equal(initialChartSymbol(undefined,[],null),'005930');
 assert.equal(lastWatchlistKey(31),'finsight:lastWatchlistSymbol:31');
 assert.notEqual(lastWatchlistKey(31),lastWatchlistKey(8));
});
test('home empty/loading/error messages and visible-only feed deduplication',()=>{
 assert.equal(watchlistNewsState(false,false,0,0),'차트에서 ☆를 눌러 관심종목을 추가해보세요');
 assert.equal(watchlistNewsState(false,false,1,0),'최근 관심종목 소식이 없어요');
 assert.equal(watchlistNewsState(false,false,1,2),null);
 const Section=component('../screens/home/HomeScreen/WatchlistNewsSection.tsx','WatchlistNewsSection');let chart=0,retry=0;
 let tree=nodes(Section({items:[],count:0,loading:false,failed:false,onChart:()=>chart++,onRetry:()=>retry++,onSelectNews(){}}));
 tree.find(n=>n.type==='Pressable').props.onPress();assert.equal(chart,1);
 tree=nodes(Section({items:[],count:1,loading:false,failed:true,onChart(){},onRetry:()=>retry++,onSelectNews(){}}));
 tree.find(n=>n.type==='Pressable').props.onPress();assert.equal(retry,1);assert(tree.some(n=>n.props.accessibilityRole==='alert'));
 const feed=[{id:1},{id:2},{id:3}],ids=[2];
 assert.deepEqual(withoutWatchlistNews(feed,ids),[{id:1},{id:3}]);
 assert.deepEqual(withoutWatchlistNews(feed,[]),feed); // failed/loading watchlist section excludes nothing
 assert.deepEqual(feed,[{id:1},{id:2},{id:3}]);
});
test('star accessibility, index hidden and empty chips absent',()=>{
 const Header=component('../screens/chart/ChartScreen/StockHeader.tsx','StockHeader');
 for(const [watched,label] of [[false,'관심종목 추가'],[true,'관심종목 해제']]) {
  const tree=nodes(Header({name:'삼성전자',symbol:'005930',price:1,changePercent:0,changeLabel:'',watched,onToggleWatchlist(){}}));
  assert(tree.some(n=>n.type==='Pressable'&&n.props.accessibilityLabel===label));
 }
 assert(!nodes(Header({name:'코스피',symbol:'KOSPI',price:1,changePercent:0,changeLabel:'',onToggleWatchlist(){}})).some(n=>n.type==='Pressable'));
 const Chips=component('../screens/chart/ChartScreen/WatchlistChips.tsx','WatchlistChips');
 assert.equal(Chips({items:[],selectedSymbol:'',onSelect(){}}),null);
});

function chartHarness({ready=true,watched=list,last='035720',routeSymbol,cached=false,freshWatched}={}) {
 let index=0,slots=[],effects=[],watchReady=ready,cache=watched.map(x=>({...x})),focus,mutationOptions,pending,mutating=false,addResolve,addReject;
 let watchReadyResolve;const watchReadyPromise=new Promise(resolve=>{watchReadyResolve=resolve;});const refetch=async()=>{if(!watchReady)await watchReadyPromise;return{data:cache};};
 let addReadyResolve;const addReady=new Promise(resolve=>{addReadyResolve=resolve;});
 const stored=new Map([[lastWatchlistKey(31),last]]),requests=[],invalidated=[];
 const hooks={...React,useCallback(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((x,j)=>x!==old.deps[j]))slots[i]={fn,deps};return slots[i].fn;},useState(initial){const i=index++;if(!(i in slots)) slots[i]=typeof initial==='function'?initial():initial;return[slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];},useRef(initial){const i=index++;return slots[i]??=( {current:initial} );},useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((x,j)=>x!==old.deps[j])) {effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()};});}}};
 const client={cancelQueries:async()=>{},getQueryData:()=>cache,setQueryData:(_key,update)=>{cache=typeof update==='function'?update(cache):update;},invalidateQueries:async({queryKey})=>invalidated.push(queryKey[0])};
 const api={getApiErrorMessage:(e,f)=>e.message||f,addWatchlist:()=>new Promise((resolve,reject)=>{addResolve=resolve;addReject=reject;addReadyResolve();}),removeWatchlist:async()=>{}};
 const rq={keepPreviousData:undefined,useQueryClient:()=>client,useMutation:options=>{mutationOptions=options;return{isPending:mutating,mutate(args){pending=(async()=>{mutating=true;const context=await mutationOptions.onMutate(args);try {await mutationOptions.mutationFn(args);}catch(error){mutationOptions.onError(error,args,context);}finally{mutating=false;mutationOptions.onSettled();}})();}};},useQuery:({queryKey,enabled})=>{
  if(queryKey[0]==='auth-session') return{data:{userId:31},isPending:false};
  if(queryKey[0]==='watchlist') return{data:watchReady||cached?cache:undefined,isPending:!watchReady&&!cached,isError:false,refetch};
  if(queryKey[0]==='popular-stocks') return{data:[],isPending:false};
  if(queryKey[0]==='chart') {if(enabled) requests.push(queryKey[1]);return{data:enabled?{symbol:queryKey[1],period:'D',candles:[],minuteCandles:[],moveInsights:[],relatedNews:[],symbolName:queryKey[1]}:undefined,isPending:!enabled};}
  return{data:[]};
 }};
 const exports={};vm.runInNewContext(compile('../screens/chart/ChartScreen/index.tsx'),{exports,React:hooks,require:n=>n==='react'?hooks:n==='react-native'?native:n==='@react-navigation/native'?{useFocusEffect:fn=>{focus=fn;hooks.useEffect(fn,[fn]);}}:n==='@tanstack/react-query'?rq:n.endsWith('/watchlist')?model:n.endsWith('/storage')?{storageGetItem:async key=>stored.get(key)??null,storageSetItem:async(key,value)=>stored.set(key,value)}:n.endsWith('/auth')?{loadAuthSession:async()=>({userId:31})}:n.endsWith('/api')?api:n.endsWith('/chartDocent')?{movesByDate:()=>[],strongestMove:()=>null}:n.startsWith('./')?{[n.slice(2)]:n.slice(2)}:{}});
 const props={route:{params:{symbol:routeSymbol}},navigation:{}};
 const h={render(){index=0;effects=[];return nodes(exports.ChartScreen(props));},async flush(){for(const effect of effects)effect();for(let i=0;i<12;i++)await Promise.resolve();return h.render();},setReady(){if(freshWatched)cache=freshWatched;watchReady=true;watchReadyResolve();},focus(){focus();},waitForAdd:()=>addReady,requests,stored,invalidated,get cache(){return cache;},get pending(){return pending;},reject(message){addReject(new Error(message));},resolve(){addResolve({});}};
 return h;
}

test('no default-chart flash while watchlist loads, last watched choice survives re-entry',async()=>{
 const h=chartHarness({ready:false});let tree=h.render();assert.equal(h.requests.length,0);await h.flush();assert.equal(h.requests.length,0);
 h.setReady();h.render();tree=await h.flush();assert.deepEqual(h.requests,['035720']);
 const chips=tree.find(n=>n.type==='WatchlistChips');chips.props.onSelect('000660','SK하이닉스');h.render();await h.flush();
 assert.equal(h.stored.get(lastWatchlistKey(31)),'000660');
 h.focus();h.render();tree=await h.flush();assert.equal(tree.find(n=>n.type==='StockHeader').props.symbol,'000660');
 assert(!h.requests.includes('005930'));
});
test('optimistic add rolls back on failure, invalidate shared news and recommendations, removal is immediate',async()=>{
 const h=chartHarness({watched:[],routeSymbol:'005930'});h.render();let tree=await h.flush();
 tree.find(n=>n.type==='StockHeader').props.onToggleWatchlist();await h.waitForAdd();
 assert.equal(h.cache[0].symbol,'005930');assert.equal(h.render().find(n=>n.type==='StockHeader').props.watched,true);
 h.reject('관심종목은 20개까지 추가할 수 있어요');await h.pending;
 tree=h.render();assert.equal(h.cache.length,0);assert(tree.some(n=>n.props.accessibilityRole==='alert'&&n.children.includes('관심종목은 20개까지 추가할 수 있어요')));
 assert.deepEqual(h.invalidated,['watchlist','watchlist-news','learning-recommendations']);
 const existing=chartHarness({watched:list,last:'035720'});existing.render();tree=await existing.flush();
 tree.find(n=>n.type==='StockHeader').props.onToggleWatchlist();for(let i=0;i<3;i++)await Promise.resolve();assert(!existing.cache.some(n=>n.symbol==='035720'));await existing.pending;
});

test('home watchlist failure or loading never gates the main feed, and dedup reaches older pages',()=>{
 for(const state of [{isPending:true},{isError:true},{data:list,isError:false}]) {
  const hooks={...React,useState:initial=>[typeof initial==='function'?initial():initial,()=>{}],useCallback:f=>f};const exports={};
  vm.runInNewContext(compile('../screens/home/HomeScreen/index.tsx'),{exports,React:hooks,require:n=>n==='react'?hooks:n==='react-native'?native:n==='@react-navigation/native'?{useFocusEffect(){}}:n==='@tanstack/react-query'?{useQuery:({queryKey})=>queryKey[0]==='watchlist'?state:{isError:true}}:n.endsWith('/JudgementResultsProvider')?{useJudgementResults:()=>({unseen:[],pending:null,refresh(){}})}:n.endsWith('/learningPreferences')?{getDefaultLearningPreferences:()=>({})}:n.startsWith('./')?{[n.slice(2)]:n.slice(2)}:{}});
  const tree=nodes(exports.HomeScreen({navigation:{}}));const feed=tree.find(n=>n.type==='NewsSection');assert(feed);assert.equal(feed.props.excludedIds.length,0);
 }
 let cursor=0;const hooks={...React,useState:initial=>[cursor++===1?[{id:2},{id:4}]:initial,()=>{}]},exports={};
 vm.runInNewContext(compile('../screens/home/HomeScreen/NewsSection.tsx'),{exports,React:hooks,require:n=>n==='react'?hooks:n==='react-native'?native:n==='@tanstack/react-query'?{useQuery:()=>({data:[{id:1},{id:2},{id:3}]})}:n.endsWith('/watchlist')?model:n.endsWith('/NewsCard')?{NewsCard:'NewsCard'}:{}});
 assert.deepEqual(nodes(exports.NewsSection({preferences:{painPoint:'terms'},excludedIds:[2],onSelectNews(){}})).filter(n=>n.type==='NewsCard').map(n=>n.props.news.id),[1,3,4]);
});


test('cached empty list cannot choose Samsung before the fresh owner list arrives',async()=>{
 const h=chartHarness({ready:false,cached:true,watched:[],last:null,freshWatched:list});
 h.render();await h.flush();assert.equal(h.requests.length,0);
 h.setReady();const tree=await h.flush();assert.equal(tree.find(n=>n.type==='StockHeader').props.symbol,'000660');
 assert.deepEqual(h.requests,['000660']);
});
