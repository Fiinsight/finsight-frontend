import * as theme from '../theme/index.ts';
import { initialChartSymbol, lastWatchlistKey } from './watchlist.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const options={module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true};
const model={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./chartDocent.ts',import.meta.url),'utf8'),{compilerOptions:options}).outputText,{exports:model});
const moves=[{timestamp:'2026-10-07T00:00:00',changePercent:3.25,candidateNews:[],newsTitle:'호실적',docent:{relation:'DIRECT'}},{timestamp:'2026-10-08T00:00:00',changePercent:-6,candidateNews:[],newsTitle:'',docent:{relation:'NONE'}},{timestamp:'2026-10-09T00:00:00',changePercent:4,candidateNews:[],newsTitle:'코스피',docent:{relation:'MARKET'}}];
test('strongest point, descending order and minute identity',()=>{
 assert.equal(model.strongestMove(moves),moves[1]);assert.equal(model.strongestMove([]),null);
 assert.deepEqual(Array.from(model.movesByDate(moves),x=>x.timestamp),[moves[2].timestamp,moves[1].timestamp,moves[0].timestamp]);
 assert.equal(model.moveDate('2026-10-07T11:05:00','MINUTE'),'2026-10-07T11:05:00');assert.equal(model.moveDate(moves[0].timestamp,'W'),'2026-10-07');
});
function harness(fallback = false) {
 let slot=0;const state=[],scrolled=[],navigated=[],retried=[];const React={createElement:(type,props,...children)=>({type,props,children}),useCallback:f=>f,useEffect(){},useRef:value=>({current:value===null?{scrollTo:value=>scrolled.push(value)}:value}),useState:initial=>{const i=slot++;if(!(i in state))state[i]=initial===true?false:initial;return[state[i],value=>state[i]=value];}};
 const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../screens/chart/ChartScreen/index.tsx',import.meta.url),'utf8'),{compilerOptions:options}).outputText,{exports,React,require:name=>name.endsWith('/theme') ? theme : name==='react'?React:name==='react-native'?{SafeAreaView:'SafeAreaView',ScrollView:'ScrollView',Text:'Text',View:'View',TouchableOpacity:'TouchableOpacity',StyleSheet:{create:s=>s}}:name==='../../../lib/chartDocent'?model:name==='@react-navigation/native'?{useFocusEffect(){}}:name==='../../../lib/watchlist'?{initialChartSymbol,lastWatchlistKey}:name==='@tanstack/react-query'?{useQueryClient:()=>({}),useMutation:()=>({isPending:false}),useQuery:({queryKey})=>({data:queryKey[0]==='chart'?{symbol:'005930',period:'D',fallback,candles:[],minuteCandles:[],moveInsights:moves,relatedNews:[]}:[],refetch:()=>retried.push(queryKey[0])})}:name.startsWith('./')?{[name.slice(2)]:name.slice(2)}:{}});
 const visit=n=>Array.isArray(n)?n.flatMap(visit):n&&typeof n==='object'?[n,...visit(n.children)]:[];
 return {render(){slot=0;return visit(exports.ChartScreen({route:{params:{symbol:'005930'}},navigation:{navigate:(...args)=>navigated.push(args)}}));},scrolled,navigated,retried};
}
test('entry auto-selects biggest, point list selects and scrolls, previous/next and news link work',()=>{
 const h=harness();let tree=h.render();let panel=tree.find(x=>x.type==='ChartDocentPanel');assert.equal(panel.props.insight,moves[1]);
 assert.equal(tree.find(x=>x.type==='ChartCard').props.selectedDate,'2026-10-08');
 const rows=tree.filter(x=>x.props?.accessibilityLabel?.includes('급등락 관련 뉴스'));assert.match(rows[0].props.accessibilityLabel,/2026-10-09/);
 rows[2].props.onPress();panel=h.render().find(x=>x.type==='ChartDocentPanel');assert.equal(panel.props.insight,moves[0]);assert.equal(h.scrolled.length,1);
 panel.props.onNext();panel=h.render().find(x=>x.type==='ChartDocentPanel');assert.equal(panel.props.insight,moves[1]);panel.props.onPrevious();assert.equal(h.render().find(x=>x.type==='ChartDocentPanel').props.insight,moves[0]);
 panel.props.onNewsPress(123);assert.equal(h.navigated[0][0],'NewsDetail');assert.equal(h.navigated[0][1].newsId,123);
});
test('markers reserve 44×36 targets with selection ring and no initial tooltip',()=>{
 const React={createElement:(type,props,...children)=>({type,props,children}),useEffect(){},useMemo:f=>f()};let slot=0;React.useState=()=>[slot++===0?300:null,()=>{}];
 const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../components/CandlestickChart.tsx',import.meta.url),'utf8'),{compilerOptions:options}).outputText,{exports,React,require:name=>name.endsWith('/theme') ? theme : name==='react'?React:name==='react-native'?{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:s=>s}}:name==='react-native-svg'?{default:'Svg',Line:'Line',Rect:'Rect',Polygon:'Polygon',Circle:'Circle'}:{formatPrice:String,formatShortDate:String}});
 const visit=n=>Array.isArray(n)?n.flatMap(visit):n&&typeof n==='object'?[n,...visit(n.children)]:[];
 const tree=visit(exports.CandlestickChart({candles:[{date:'2026-10-07',open:100,high:110,low:90,close:105}],selectedDate:'2026-10-07',moveMarkers:[{date:'2026-10-07',changePercent:5}]}));
 const marker=tree.find(x=>x.type==='Pressable'&&x.props.accessibilityLabel.includes('급등락'));
 assert.equal(marker.props.style[0].width,44);assert.equal(marker.props.style[0].height,36);assert.equal(marker.props.accessibilityState.selected,true);assert.equal(tree.filter(x=>x.type==='Circle').length,1);assert(!tree.some(x=>x.props?.style?.[0]?.width===130));
});

test('HTTP 200 fallback chart has a working retry button',()=>{
 const h=harness(true);const tree=h.render();const button=tree.find(n=>n.type==='TouchableOpacity'&&n.children.some(c=>c?.children?.includes('차트 다시 시도')));
 assert(button);button.props.onPress();assert.deepEqual(h.retried,['chart']);
 assert(!harness(false).render().some(n=>n.type==='TouchableOpacity'&&n.children.some(c=>c?.children?.includes('차트 다시 시도'))));
});
