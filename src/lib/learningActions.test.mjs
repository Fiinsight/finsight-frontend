import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as theme from '../theme/index.ts';
import * as actions from './learningActions.ts';
import { kstDate } from './historyRecords.ts';
function load(path, react, extra={}) {
 const exports={};const native=Object.fromEntries(['Text','View','Pressable','TouchableOpacity','ScrollView','Image','Modal'].map(name=>[name,name]));native.StyleSheet={create:s=>s};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React:react,require:name=>extra[name]??(name==='react'?react:name==='react-native'?native:name.endsWith('/theme')?theme:name.endsWith('/learningActions')?actions:name.endsWith('/readingProgressModel')?{localDateKey:kstDate}:name==='@expo/vector-icons'?{Ionicons:'Icon'}:{})});return exports;
}
const visit=n=>Array.isArray(n)?n.flatMap(visit):n&&typeof n==='object'?[n,...visit(n.children)]:[];
const text=nodes=>nodes.filter(n=>n.type==='Text').flatMap(n=>n.children).join(' ');
function hooks(){const state=[];let slot=0;return {state,reset(){slot=0},createElement:(type,props,...children)=>({type,props,children}),useState(initial){const id=slot++;if(!(id in state))state[id]=initial;return[state[id],v=>state[id]=v]}};}

test('promotion delay is seven days, separately keyed by owner and level, and malformed storage is safe',()=>{
 const now=Date.parse('2026-10-21T12:00:00Z');const saved=actions.snoozePromotion({},'normal',now);
 assert.equal(actions.promotionVisible(saved,'normal',now+7*86400000-1),false);
 assert.equal(actions.promotionVisible(saved,'normal',now+7*86400000),true);
 assert.equal(actions.promotionVisible(saved,'analyst',now),true);
 assert.notEqual(actions.promotionStorageKey(1),actions.promotionStorageKey(2));
 for(const raw of ['bad','null','[]','{"normal":"forever"}'])assert.deepEqual(actions.parsePromotionSnoozes(raw),{});
 assert.deepEqual(actions.parsePromotionSnoozes(JSON.stringify(saved)),saved);
});
test('evidence candidates are verbatim article sentences and forecasts are separate from observed numbers',()=>{
 const fact='회사는 지난해 매출이 12% 증가했다고 발표했다.';const forecast='전문가는 다음 해 이익이 20% 늘 것으로 예상했다.';
 assert.deepEqual(actions.evidenceSentences(`${fact}\n${forecast}\n${fact}`),[fact,forecast]);
 assert(actions.hasObservedNumber(fact));assert(!actions.hasObservedNumber(forecast));assert(!actions.hasObservedNumber('향후 실적을 살펴보세요.'));assert.deepEqual(actions.evidenceSentences(''),[]);
 assert.equal(actions.learningSummary('요약을 확인할 수 없습니다.',fact).text,fact);
 assert.equal(actions.learningSummary('요약을 확인할 수 없습니다.',fact).fromOriginal,true);
 assert.equal(actions.learningSummary('실제 요약',fact).text,'실제 요약');
 assert(!actions.hasObservedNumber('회사는 3년 안에 매출을 늘릴 계획이라고 말했다.'));
});
test('tip sets stay distinct across reading levels, deep offers two, KST rolls at midnight, on-demand waits for input',()=>{
 const react=hooks();const tips=load('../screens/learn/LearnScreen/DailyTips.tsx',react);
 for(const focus of ['news','decision','market','reflection']) {
  const sets=['beginner','normal','analyst'].map(level=>new Set(Array.from({length:8},(_,day)=>tips.selectDailyTips(level,'micro',focus,new Date(Date.UTC(2026,9,day+1)))[0].tip)));
  assert(sets.every((set,i)=>sets.every((other,j)=>i===j||[...set].every(tip=>!other.has(tip)))));
 }
 const before=new Date('2026-10-21T14:59:59Z'),after=new Date('2026-10-21T15:00:00Z');
 assert.notEqual(tips.selectDailyTips('normal','micro','news',before)[0].tip,tips.selectDailyTips('normal','micro','news',after)[0].tip);
 assert.equal(tips.selectDailyTips('analyst','deep','market',after).length,2);
 let nodes=visit(tips.DailyTips({level:'normal',pace:'on-demand',focus:'news'}));assert(text(nodes).includes('필요한 팁 보기'));assert(!text(nodes).includes('수달이의 한마디'));
 nodes.find(n=>n.type==='Pressable').props.onPress();react.reset();nodes=visit(tips.DailyTips({level:'normal',pace:'on-demand',focus:'news'}));assert(text(nodes).includes('수달이의 한마디'));
});
test('guide modal changes depth and example for every reading level',()=>{
 const contents=[];
 for(const level of ['beginner','normal','analyst']) {
  const react=hooks();const {GuideList}=load('../screens/learn/LearnScreen/GuideList.tsx',react);
  let nodes=visit(GuideList({focus:'decision',level}));nodes.find(n=>n.type==='TouchableOpacity').props.onPress();react.reset();nodes=visit(GuideList({focus:'decision',level}));
  contents.push(text(nodes));
 }
 assert(contents[0].includes('먼저 한 가지 사실'));assert(contents[1].includes('수치의 단위를 같은 기준'));assert(contents[2].includes('반대 가설과 발표 이전 기대'));assert.equal(new Set(contents).size,3);
});
test('pain-point cards use a real briefing and article, route reflection to both histories, and handle empty/error/loading',()=>{
 const article={id:7,title:'실제 기사 제목',summary:'첫 요약. 두 번째 요약. 세 번째 요약.'};const fact='회사는 지난해 매출이 12% 증가했다고 발표했다.';const forecast='전문가는 이익이 20% 늘 것으로 예상했다.';
 for(const painPoint of ['overload','evidence','reflection']) {
  const react=hooks(),routes=[];const {PainPointCard}=load('../screens/learn/LearnScreen/PainPointCard.tsx',react,{'@tanstack/react-query':{useQuery:({queryKey})=>({data:queryKey[0]==='news-detail'?{rawContent:`${fact}\n${forecast}`}:[article]})}});
  const props={painPoint,ownerId:1,focused:true,onArticle:id=>routes.push(id),onHistory:tab=>routes.push(tab)};
  let nodes=visit(PainPointCard(props));
  if(painPoint==='reflection'){for(const b of nodes.filter(n=>n.type==='Pressable'))b.props.onPress();assert.deepEqual(routes,['judgements','notes']);}
  else {assert(text(nodes).includes(article.title));if(painPoint==='overload')assert.equal(nodes.find(n=>n.type==='Text'&&n.children.includes(article.summary)).props.numberOfLines,3);
   if(painPoint==='evidence'){nodes.find(n=>n.type==='Pressable'&&text(visit(n)).includes(forecast)).props.onPress();react.reset();nodes=visit(PainPointCard(props));assert(text(nodes).includes('다시 찾아보세요'));nodes.find(n=>n.type==='Pressable'&&text(visit(n)).includes(fact)).props.onPress();react.reset();assert(text(visit(PainPointCard(props))).includes('근거를 찾았어요'));}
   nodes.find(n=>n.type==='Pressable'&&text(visit(n))==='이 기사 읽기').props.onPress();assert.deepEqual(routes,[7]);}
 }
 for(const [state,expected] of [[{isPending:true},'불러오고'],[{isError:true},'다시 시도'],[{data:[]},'아직 없어요']]) {
  const react=hooks();const {PainPointCard}=load('../screens/learn/LearnScreen/PainPointCard.tsx',react,{'@tanstack/react-query':{useQuery:()=>state}});assert(text(visit(PainPointCard({painPoint:'overload',ownerId:1,focused:true}))).includes(expected));
 }
});
