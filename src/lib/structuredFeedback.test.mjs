import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as history from './historyRecords.ts';
const compile=file=>ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
const React={createElement:(type,props,...children)=>({type,props,children}),useEffect(){}};
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):n&&typeof n==='object'?[n,...nodes(n.children)]:[];
const texts=tree=>tree.filter(n=>n.type==='Text').map(n=>n.children.flat().join(''));
const reasons=[{title:'기사 근거',detail:'기사에서는 비용 증가를 알렸어요.'},{title:'판단 근거',detail:'남긴 근거의 비교 시점을 확인해보세요.'},{title:'실제 시장',detail:'카카오 종가는 -1.76% 움직였어요.'}];
const base={id:10,newsId:153,newsTitle:'기업 실적 기사',choice:'DOWN',actualDirection:'DOWN',actualChangePercent:-1.76,comparisonDate:'2026-10-07',judgementClose:100,comparisonClose:98.24,feedbackText:'카카오 2026-10-07 종가 기준 -1.76%.',feedbackReasons:reasons,reasonText:'비용 증가를 예상했어요.',reasons:['비용 증가를 예상했어요.'],nextTip:'다음에도 비교 시점을 확인해보세요.',judgedAt:'2026-10-06T01:00:00Z',feedbackGeneratedAt:'2026-10-07T07:00:00Z',verdict:'CORRECT'};
function render(item=base,latest) {
 const navigation=[],exports={};
 vm.runInNewContext(compile('../screens/history/JudgementDetailScreen.tsx'),{exports,React,require:name=>name==='react'?React:name==='react-native'?{View:'View',Text:'Text',SafeAreaView:'SafeAreaView',ScrollView:'ScrollView',TouchableOpacity:'TouchableOpacity',StyleSheet:{create:s=>s}}:name==='../../lib/historyRecords'?history:name==='@react-navigation/native'?{useIsFocused:()=>true}:name==='@tanstack/react-query'?{useQueryClient:()=>({invalidateQueries(){}}),useQuery:({queryKey})=>({data:queryKey[0]==='judgement-detail'?latest:queryKey[0]==='news-detail'?{relatedSymbol:'035720',relatedSymbolName:'카카오'}:queryKey[0]==='chart'?{points:[{date:'2026-10-06',value:100},{date:'2026-10-07',value:item.comparisonClose??100}]}:[]})}:{MiniLineChart:'MiniLineChart',ScreenTopBar:'ScreenTopBar'}});
 const tree=nodes(exports.JudgementDetailScreen({route:{params:{item}},navigation:{navigate:(...args)=>navigation.push(args),goBack(){}}}));return{tree,navigation};
}
const snapshotFile=new URL('./fixtures/judgement-feedback.json',import.meta.url);
const snapshots={};
for(const [verdict,override] of [['CORRECT',{}],['WRONG',{choice:'UP'}],['PARTIAL',{choice:'UP',actualDirection:'UP',actualChangePercent:.7,comparisonClose:100.7}]]){
 test(`verdict ${verdict} UI snapshot`,()=>{
  const {tree,navigation}=render({...base,...override,verdict});const chart=tree.find(n=>n.type==='MiniLineChart');
  const snapshot={text:texts(tree),markers:chart.props.markers,range:chart.props.highlightRange,showTooltip:chart.props.showTooltip};
  if(process.env.UPDATE_FEEDBACK_SNAPSHOTS==='1'){snapshots[verdict]=snapshot;mkdirSync(new URL('./fixtures/',import.meta.url),{recursive:true});writeFileSync(snapshotFile,JSON.stringify(snapshots,null,2)+'\n');}
  else assert.deepEqual(JSON.parse(JSON.stringify(snapshot)),JSON.parse(readFileSync(snapshotFile,'utf8'))[verdict]);
  const done=tree.find(n=>n.props?.accessibilityLabel==='완료, 판단 기록 목록으로');done.props.onPress();assert.equal(navigation[0][0],'History');
  assert(!texts(nodes(tree.find(n=>n.type==='ScrollView'))).includes('완료'));
 });
}
test('legacy null renders paragraph, waiting shows only user reason, no-reason correct never praises',()=>{
 const legacy=render({...base,feedbackReasons:null,nextTip:null}).tree;
 assert(texts(legacy).includes(base.feedbackText));assert(!texts(legacy).includes('기사 근거'));
 const pending=render({...base,actualDirection:null,comparisonDate:null,verdict:null,feedbackText:'',feedbackReasons:null}).tree;
 assert(texts(pending).includes('아직 채점 전이에요'));assert(!pending.some(n=>n.type==='MiniLineChart'));assert(!texts(pending).includes('기사 근거'));
 const none=render({...base,reasonText:'',reasons:[]}).tree;assert(!texts(none).some(s=>s.includes('정확한 판단')));
 const unavailable=render({...base,actualDirection:'UNKNOWN',comparisonDate:null,verdict:null,feedbackReasons:null}).tree;assert(texts(unavailable).includes('아직 채점되지 않았어요'));assert(!texts(unavailable).some(s=>s.includes('당일 비교')));
 assert.equal(history.feedbackVerdict({...base,verdict:null,choice:'UP',actualDirection:'UP',actualChangePercent:1.0000000000000002}),'PARTIAL');
 const arrival=render({...base,actualDirection:null},base).tree;assert(texts(arrival).includes('하락 예측이 맞았어요'));
});
test('API maps feedback reasons separately from the user reason and preserves legacy null',async()=>{
 let payload= {judgementId:10,...base,reasons};const http={get:async()=>({data:payload}),interceptors:{request:{use(){}},response:{use(){}}}},exports={};
 vm.runInNewContext(compile('./api.ts'),{exports,process:{env:{}},require:name=>name==='axios'?{create:()=>http}:name==='expo'?{getExpoGoProjectConfig:()=>({})}:name==='./historyRecords'?history:{}});
 const item=await exports.getJudgementDetail(10);assert.equal(item.feedbackReasons.length,3);assert.equal(item.reasons[0],base.reasonText);assert.equal(item.verdict,'CORRECT');
 payload={judgementId:10,choice:'UP',reasonText:'내 근거',feedbackText:'이전 문단',reasons:null};const old=await exports.getJudgementDetail(10);assert.equal(old.feedbackReasons,null);assert.equal(old.reasons[0],'내 근거');assert.equal(old.feedbackText,'이전 문단');
});
test('arrival receipts persist per owner, exclude pending/legacy and do not lose concurrent reads',async()=>{
 let owner=1;const store=new Map(),exports={};
 vm.runInNewContext(compile('./feedbackSeen.ts'),{exports,require:name=>name==='./storage'?{storageGetItem:async key=>store.get(key),storageSetItem:async(key,value)=>store.set(key,value)}:name==='./auth'?{loadAuthSession:()=>Promise.resolve({userId:owner})}:history});
 assert(history.hasUnreadFeedback(base,{}));const first=exports.markFeedbackSeen(base);const second=exports.markFeedbackSeen({...base,id:11});owner=2;const third=exports.markFeedbackSeen(base);await Promise.all([first,second,third]);
 assert.deepEqual(Object.keys(await exports.getSeenFeedback(1)),['10','11']);assert.deepEqual(Object.keys(await exports.getSeenFeedback(2)),['10']);
 assert(!history.hasUnreadFeedback(base,await exports.getSeenFeedback(1)));assert(history.hasUnreadFeedback({...base,feedbackGeneratedAt:'2026-10-08T07:00:00Z'},await exports.getSeenFeedback(1)));
 assert(!history.hasUnreadFeedback({...base,actualDirection:null},{}));assert(!history.hasUnreadFeedback({...base,comparisonDate:null},{}));
});
test('comparison chart has judgement line, result dot and a shaded interval',()=>{
 const exports={},hooks={...React,useMemo:f=>f(),useState:()=>[300,()=>{}]};
 vm.runInNewContext(compile('../components/MiniLineChart.tsx'),{exports,React,require:name=>name==='react'?hooks:name==='react-native'?{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:s=>s}}:name==='react-native-svg'?{default:'Svg',Line:'Line',Circle:'Circle',Path:'Path',Rect:'Rect'}:{formatPrice:String,formatShortDate:String}});
 const tree=nodes(exports.MiniLineChart({points:[{date:'2026-10-06',value:100},{date:'2026-10-07',value:98.24}],showTooltip:false,highlightRange:{from:'2026-10-06',to:'2026-10-07',color:'#ECFDF3'},markers:[{date:'2026-10-06',label:'판단',color:'#F79009',kind:'line'},{date:'2026-10-07',label:'결과 -1.76%',color:'#175CD3',kind:'point'}]}));
 assert.equal(tree.filter(n=>n.type==='Line').length,1);assert.equal(tree.filter(n=>n.type==='Circle').length,1);assert(tree.find(n=>n.type==='Rect').props.width>0);assert(texts(tree).includes('결과 -1.76%'));
});
test('history row displays arrival badge only while unread',()=>{
 const exports={};vm.runInNewContext(compile('../screens/history/HistoryScreen/HistoryItem.tsx'),{exports,React,require:name=>name==='react-native'?{View:'View',Text:'Text',TouchableOpacity:'TouchableOpacity',StyleSheet:{create:s=>s}}:name.endsWith('/historyRecords')?history:{toRelativeTimeKorean:()=>''}});
 assert(texts(nodes(exports.HistoryItem({item:base,unread:true,onPress(){}}))).includes('결과 도착'));
 assert(!texts(nodes(exports.HistoryItem({item:base,unread:false,onPress(){}}))).includes('결과 도착'));
});

test('result uses stored target, compares the real index figure and opens the selected concept quiz',()=>{
 const item={...base,relatedSymbol:'KOSPI',relatedSymbolName:'코스피',indexName:'코스닥',indexChangePercent:-.76,conceptTerm:'금리',conceptDefinition:'돈을 빌리는 비용'};
 const {tree,navigation}=render(item);const text=texts(tree).join(' ');assert.match(text,/코스피 -1.76%/);assert.match(text,/같은 날 코스닥 -0.76%/);
 tree.find(n=>n.props?.accessibilityLabel==='금리 퀴즈로 확인하기').props.onPress();assert.equal(navigation[0][0],'NewsDetail');assert.equal(navigation[0][1].quizTerm,'금리');assert.equal(navigation[0][1].openQuiz,true);
 const absent=render({...base,indexName:null,indexChangePercent:null,conceptTerm:null}).tree;assert(!absent.some(n=>n.props?.accessibilityLabel?.includes('퀴즈로 확인하기')));assert(!texts(absent).some(t=>t.includes('같은 날')));
});

test('old mismatched target hides its praise and price chart while keeping a return to article',()=>{
 const {tree,navigation}=render({...base,gradingIssue:'TARGET_MISMATCH',comparisonDate:null,verdict:null,feedbackReasons:null,reasonText:'',reasons:[],feedbackText:'잘 연결한 판단입니다.'});
 const text=texts(tree).join(' ');assert.match(text,/아직 채점되지 않았어요/);assert(!text.includes('잘 연결한'));assert(!tree.some(n=>n.type==='MiniLineChart'));
 tree.find(n=>n.props?.accessibilityLabel==='이 기사 다시 읽기').props.onPress();assert.equal(navigation[0][0],'NewsDetail');
});
test('upward outcome shows why it rose and the explanation of an earnings expectation',()=>{
 const {tree}=render({...base,choice:'UP',actualDirection:'UP',actualChangePercent:2,feedbackReasons:[{title:'기사 신호',detail:'기사에서 매출 증가를 전했어요. 실적 개선 소식은 이익 기대를 높여 상승 요인으로 연결될 수 있어요.'},...reasons.slice(1)]});
 const text=texts(tree).join(' ');assert.match(text,/왜 맞았을까요/);assert.match(text,/이익 기대/);
});

test('unknown, legacy and mismatched outcomes show review explanations and limits without a chart or praise',()=>{
 const review=[{title:'기사의 핵심과 의미',detail:'기사에서 신규 투자를 전했어요. 성장 기대와 비용 부담을 함께 봐야 해요.'},{title:'내 판단 돌아보기',detail:'근거가 기사 사실인지 예상인지 나눠보세요.'}];
 for(const status of [{actualDirection:'UNKNOWN',comparisonDate:null},{gradingIssue:'LEGACY_COMPARISON',comparisonDate:null},{gradingIssue:'TARGET_MISMATCH'}]){
  const item={...base,...status,verdict:null,feedbackReasons:review,unavailableReason:'저장된 비교 자료가 부족해 적중 통계에 포함하지 않아요.',nextTip:'기사 사실과 예상 방향을 나눠보세요.'};
  const {tree,navigation}=render(item);const text=texts(tree).join(' ');
  assert.match(text,/기사에서 볼 근거/);assert.match(text,/성장 기대와 비용 부담/);assert.match(text,/적중 통계에 포함하지 않아요/);assert.match(text,/기사 사실과 예상 방향/);
  assert(!text.includes('정확한 판단'));assert(!text.includes('왜 내렸을까요'));assert(!tree.some(n=>n.type==='MiniLineChart'));
  tree.find(n=>n.props?.accessibilityLabel==='이 기사 다시 읽기').props.onPress();assert.equal(navigation[0][0],'NewsDetail');
 }
});


test('prediction and measured result appear before reason and explanation, even when verdict copy conflicts',()=>{
 for(const [choice,direction,percent,headline] of [
  ['UP','UP',2,'상승 예측이 맞았어요'],['UP','DOWN',-2,'상승 예측과 달랐어요'],['DOWN','DOWN',-2,'하락 예측이 맞았어요']]){
  const {tree}=render({...base,choice,actualDirection:direction,actualChangePercent:percent,verdict:choice===direction?'CORRECT':'WRONG'});
  const text=texts(tree);assert(text.includes(headline));assert(text.includes(`${direction==='UP'?'상승':'하락'} ${percent>0?'+':''}${percent.toFixed(2)}%`));
  assert(text.indexOf(headline)<text.indexOf('내 예측'));assert(text.indexOf('실제 결과')<text.indexOf('내 근거 점검'));
  assert(text.indexOf('내 근거 점검')<text.indexOf(choice===direction?'왜 맞았을까요?':'왜 빗나갔을까요?'));
  assert(text.includes(base.reasonText));
 }
 const {tree}=render({...base,actualDirection:'UNKNOWN',gradingIssue:'TARGET_MISMATCH',verdict:'CORRECT'});
 const text=texts(tree);assert(text.includes('아직 채점되지 않았어요'));assert(text.includes('확인 전'));assert(!text.some(t=>t.includes('예측이 맞았어요')));
});


test('conflicting stored feedback is hidden while measured outcome stays visible',()=>{
 const {tree}=render({...base,choice:'UP',verdict:'CORRECT',feedbackText:'정확한 판단! 상승이 맞았어요.',feedbackReasons:[{title:'기사 신호',detail:'상승이 맞았어요.'},...reasons.slice(1)]});
 const text=texts(tree).join(' ');assert.match(text,/상승 예측과 달랐어요/);assert(!text.includes('상승이 맞았어요.'));assert.match(text,/저장된 설명 문구가 실제 방향 비교와 달라/);
});


test('new and legacy reason coaching is visible under the user rationale and pending hides it',()=>{
 for(const title of ['내 근거 점검','판단 근거','내 판단 돌아보기','근거 남기기']){
  const detail='방향은 맞혔지만 근거가 약해 운이 섞였을 수 있어요.';
  const feedbackReasons=[reasons[0],{title,detail},reasons[2]];
  const tree=render({...base,feedbackReasons}).tree;
  const card=tree.find(n=>n.type==='View'&&texts(nodes(n))[0]==='내 근거 점검');
  assert(texts(nodes(card)).includes(base.reasonText));assert(texts(nodes(card)).includes(detail));
  assert.equal(texts(tree).filter(t=>t===detail).length,1);
  assert(texts(tree).includes('다음엔 이렇게'));
  const pending=render({...base,actualDirection:null,verdict:null,feedbackReasons}).tree;
  assert(texts(pending).includes(base.reasonText));assert(!texts(pending).includes(detail));
 }
});

test('wrong and partial headings describe the verdict and keep article and market titles',()=>{
 for(const [verdict,override,heading] of [
  ['WRONG',{choice:'UP'},'왜 빗나갔을까요?'],
  ['PARTIAL',{actualChangePercent:-.7},'왜 변동이 작았을까요?']]){
  const tree=render({...base,...override,verdict}).tree;
  assert(texts(tree).includes(heading));assert(texts(tree).includes('기사 근거'));assert(texts(tree).includes('실제 시장'));
 }
});
