import * as checklistModel from './learningChecklist.ts';
import * as preview from './termDefinitionPreview.ts';
import * as actions from './learningActions.ts';
import * as theme from '../theme/index.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { kstDate } from './historyRecords.ts';
const model = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('./readingProgressModel.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: model, require: () => ({ kstDate }) });
const { resumeLearningIds, DAILY_ARTICLE_GOAL } = model;

function harness({ owner = 1, count = 1, completed = [], reviewItems, weak = [], pending = false, fetching = false, error = false, painPoint, goal = {type:"read1",achievedToday:true,streakDays:3}, reads = 4, mastery, recommendations = [], suggestion = null, section, dailyItems, hasInnerView = true } = {}) {
  const reviews = reviewItems ?? [{ newsId: 232, term: '코스피', definition: '시장 흐름을 보여주는 지수예요.', title: '기사 제목', level: 'analyst' }];
  const preferences = { level: 'beginner', focus: 'news', pace: 'micro', dailyGoal: '뉴스 하나 읽기', source: 'onboarding', painPoint };
  const values = [{ '2026-10-12': [100,101,102,103] }, owner, preferences, reads, true, null, null, {}, owner];
  values[11]=null; values[12]=true; values[13]=null;
  const effects = [], mutations = [];
  const navigation = [], retries = [], changes = [], scrolls = [], params = [];
  let slot = 0;
  const React = { createElement: (type, props, ...children) => ({ type, props, children }), useCallback: fn => fn, useRef: initial => ({ current: initial === null ? { scrollTo: position => scrolls.push(position), getInnerViewNode() { return hasInnerView ? 1 : undefined; }, measureLayout(_node,success) { success(0,480); } } : initial }), useState(initial) {
    const index = slot++;
    if (!(index in values)) values[index] = initial;
    return [values[index], next => { values[index] = next; }];
  }};
  const exports = {};
  const query = (data, key) => ({ data: pending || error ? undefined : data, isPending: pending, isFetching: fetching, isLoading: pending, isError: error, refetch: () => retries.push(key) });
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/learn/LearnScreen/index.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, { exports, React, require: name => {
    if (name.endsWith('/learningChecklist')) return checklistModel;
    if (name.endsWith('/termDefinitionPreview')) return preview;
    if (name.endsWith('/learningActions')) return actions;
    if (name.endsWith('/storage')) return {storageSetItem:async()=>{},storageGetItem:async()=>null};
    if (name.endsWith('/auth')) return {loadAuthSession:async()=>owner === null ? null : {userId:owner}};
    if (name.endsWith('/api')) return {getLearningPreferences:async()=>preferences};
    if (name.endsWith('/readingProgress')) return {getReadingLog:async()=>({'2026-10-12':[100]})};
    if (name.endsWith('/PainPointCard')) return {PainPointCard:'PainPointCard'};
    if (name.endsWith('/theme')) return theme;
    if (name === 'react') return React;
    if (name === 'react-native') return { SafeAreaView:'SafeAreaView', ScrollView:'ScrollView', Text:'Text', Pressable:'Pressable', View:'View', Modal:'Modal', StyleSheet:{create:value=>value} };
    if (name === '@react-navigation/native') return { useFocusEffect(fn) { effects.push(fn); }, useIsFocused:()=>true, useRoute:()=>({params:{section}}), useNavigation:()=>({ navigate:(...args)=>navigation.push(args), setParams: value=>params.push(value) }) };
    if (name === '@tanstack/react-query') return { useQuery: options => options.queryKey[0] === "learning-recommendations" ? query({items:recommendations}, "recommendations") : options.queryKey[0] === "daily-learning-terms" ? query(dailyItems ?? [{term:"금리",definition:"이자 비율",newsId:232,title:"금리 기사",reason:"지난번에 틀린 개념"},{term:"환율",definition:"통화 교환 비율",newsId:233,title:"환율 기사",reason:"처음 보는 개념"},{term:"물가",definition:"평균 가격",newsId:234,title:"물가 기사",reason:"익히는 중인 개념"}], "terms") : options.queryKey[0] === 'learning-reviews' ? query(reviews, 'reviews') : query({today:{answeredCount:count,accuracy:1},week:{answeredCount:count,accuracy:1},activityStreakDays:3,completedNewsIds:completed,weakAreas:weak,goal,mastery,levelSuggestion:suggestion}, 'progress'), useQueryClient: () => ({ invalidateQueries() {} }), useMutation: options => { mutations.push(options); return { mutate(level) { changes.push(level); }, isPending:false, isError:false }; }, useQueries: ({queries}) => queries.map((options,index)=>query({id:options.queryKey[1],title:`복습할 기사 ${index}`,category:'국내증시',rawContent:'본문'}, 'article')) };
    if (name.endsWith('/readingProgressModel')) return model;
    if (name.endsWith('/onboarding')) return { getDefaultLearningPreferences:()=>preferences };
    if (name.endsWith('/GuideList')) return { GuideList:'GuideList' };
    if (name.endsWith('/DailyTips')) return { DailyTips:'DailyTips' };
    if (name.endsWith('/TabScreenHeader')) return { TabScreenHeader:'TabScreenHeader' };
    return {};
  }});
  const visit = node => Array.isArray(node) ? node.flatMap(visit) : !node || typeof node !== 'object' || node.type === 'Modal' && !node.props.visible ? [] : [node,...visit(node.children)];
  const render = () => { slot=0; return visit(exports.LearnScreen()); };
  const text = nodes => nodes.filter(node=>node.type==='Text').flatMap(node=>node.children).join(' ');
  return {render,text,navigation,retries,values,changes,scrolls,params,effects,mutations};
}

const button = (nodes, name) => nodes.find(node=>node.type==='Pressable' && node.props.accessibilityLabel?.startsWith(name));

test('first incomplete checklist task routes to reading then quiz then review',()=>{
 const reading=harness({reads:0,count:0});button(reading.render(),'기사 읽기').props.onPress();assert.equal(reading.navigation[0][0],'HomeTab');
 const quiz=harness({reads:1,count:0,completed:[100,101,102]});button(quiz.render(),'퀴즈 풀기').props.onPress();assert.equal(quiz.navigation[0][1].newsId,103);
 const review=harness({reads:1,count:3});button(review.render(),'개념 복습').props.onPress();assert(review.text(review.render()).includes('시장 흐름을 보여주는 지수예요.'));
});
test('checklist uses one quiz progress count and hides zero streaks',()=>{
 const small=harness({reads:1,count:1,goal:{streakDays:0}});const text=small.text(small.render());assert(text.includes('1/3'));assert(!text.includes('개 남음'));assert(!text.includes('0일 연속'));assert(!text.includes('더 풀면 정답률'));
 const enough=harness({count:5});assert(enough.text(enough.render()).match(/오늘 정답률\s+100%/));
});

test('review chip opens definition sheet and returns to its original reading level', () => {
  const screen=harness(); button(screen.render(),'코스피 뜻과').props.onPress();
  const sheet=screen.render(); assert(screen.text(sheet).includes('시장 흐름을 보여주는 지수예요.'));
  button(sheet,'코스피 이 개념이 나온 기사 다시 풀기').props.onPress();
  assert.equal(screen.navigation[0][1].newsId,232); assert.equal(screen.navigation[0][1].readingLevel,'analyst'); assert.equal(screen.navigation[0][1].quizTerm,'코스피'); assert.equal(screen.navigation[0][1].openQuiz,true);
  assert.equal(screen.values[5],null);
});

test('checklist has no repeated info controls and weak areas only appear when present',()=>{
 const screen=harness();const initial=screen.render();assert(!initial.some(n=>n.props?.accessibilityLabel?.includes('기준 안내')));assert(!screen.text(initial).includes('판단 결과가 엇갈린 분야'));
 const weak=harness({weak:[{category:'국내증시',decidedCount:3,hitCount:1,recentNewsIds:[232]}]});assert(weak.text(weak.render()).includes('판단 결과가 엇갈린 분야'));
});

test('loading reserves article cards, error retries are local, and buttons have names', () => {
  const loading=harness({pending:true}); const loadingNodes=loading.render();
  assert.equal(button(loadingNodes,'오늘 할 일 확인 중').props.disabled,true);
  assert.equal(loadingNodes.filter(node=>node.props?.accessibilityLabel==='이어서 풀 퀴즈 기사 불러오는 중').length,2);
  const error=harness({error:true}); const nodes=error.render();
  button(nodes,'학습 진행도 다시 시도').props.onPress(); button(nodes,'다시 볼 개념 다시 시도').props.onPress();
  assert.deepEqual(error.retries,['progress','reviews']);
  for (const node of nodes.filter(node=>node.type==='Pressable')) { assert.equal(node.props.accessibilityRole,'button'); assert(node.props.accessibilityLabel); }
});

test('pain point terms keeps three definitions after the main learning flow', () => {
 const screen=harness({painPoint:'terms'}); const initial=screen.render();
 assert(screen.text(initial).indexOf('오늘 할 일') < screen.text(initial).indexOf('오늘의 용어'));
 button(initial,'환율 뜻 보기').props.onPress();
 assert(screen.text(screen.render()).includes('통화 교환 비율'));
});
test('the primary quiz action is independent of the selected personal goal',()=>{
 for(const type of ['read1','memo','reviewJudgement','minutes5']) {
  const screen=harness({goal:{type,achievedToday:false,streakDays:2}});const nodes=screen.render();assert.match(screen.text(nodes),/2\s*일 연속/);button(nodes,'퀴즈 풀기').props.onPress();assert.equal(screen.navigation[0][0],'NewsDetail');
 }
});
test('level suggestion changes only after the named button is pressed', () => {
 const screen=harness({suggestion:'normal'}); const initial=screen.render();
 assert(screen.text(initial).includes('일반용으로 읽어볼까요?')); assert.deepEqual(screen.changes,[]);
 button(initial,'제안된 읽기 수준으로 변경').props.onPress(); assert.deepEqual(screen.changes,['normal']);
});

test('concept mastery card renders strongest and learning estimates without duplicating review concepts', () => {
 const row={term:'환율',pKnown:.9,effectivePKnown:.83,attempts:8};
 const screen=harness({mastery:{strongest:[row],weakest:[{...row,term:'금리',effectivePKnown:.2}],learning:[{...row,term:'물가',effectivePKnown:.65}],totalAttempts:12,learningCount:1}});
 const tree=screen.render();const text=screen.text(tree);
 assert(text.includes('내 개념 숙련도'));assert(/최근 퀴즈\s+12\s*회 기준 추정/.test(text));
 assert(/83\s*%/.test(text));assert(/65\s*%/.test(text)); assert.equal(tree.filter(node=>node.type==='Text' && node.children.includes('다시 볼 개념')).length,1);
 const bars=tree.filter(node=>node.props?.accessibilityRole==='progressbar' && node.props.accessibilityLabel!=='오늘 할 일 완료율');
 assert.equal(bars.length,2);assert.equal(bars[0].props.accessibilityValue.now,83);
 assert(!text.includes('80% 이상·3번 이상'));
 assert(/익히는 중\s+1\s*개/.test(text));
 assert(harness({mastery:{strongest:[],weakest:[],totalAttempts:0}}).text(harness().render()).includes('퀴즈를 풀면'));
});

test('empty mastery groups are not padded and daily choices show reasons and link to their source', () => {
 const empty=harness({mastery:{strongest:[],weakest:[],totalAttempts:4,learningCount:2}});
 const nodes=empty.render();assert.equal(nodes.filter(node=>node.type==='Text' && node.children.includes('아직 충분히 풀지 않았어요')).length,0);
 assert.equal(nodes.filter(node=>node.props?.accessibilityRole==='progressbar' && node.props.accessibilityLabel!=='오늘 할 일 완료율').length,0);
 const daily=harness({painPoint:'terms'});const initial=daily.render();
 for(const reason of ['지난번에 틀린 개념','익히는 중인 개념']) assert(daily.text(initial).includes(reason));
 assert(!daily.text(initial).includes('처음 보는 개념'));assert(daily.text(initial).includes('통화 교환 비율'));
 button(initial,'금리 뜻 보기').props.onPress();const sheet=daily.render();assert(daily.text(sheet).includes('이자 비율'));
 assert.equal(button(sheet,'금리 뜻 보기').props.accessibilityState.expanded,true);
 button(sheet,'금리 뜻 보기').props.onPress();assert.equal(button(daily.render(),'금리 뜻 보기').props.accessibilityState.expanded,false);
 const hidden=harness({painPoint:'evidence',dailyItems:[]});assert(!hidden.text(hidden.render()).includes('오늘의 용어'));
});

test('recommendation cards show actual behavior reason and open the selected article', () => {
 const items=[{newsId:777,reasonNewsId:115,basis:'RULE_INTEREST',title:'원화와 수출 기업',summary:'매출 기준을 확인했어요.',category:'해외시장',reason:'이전에 읽은 환율 기사의 학습 활동과 비슷해요.'}];
 const screen=harness({recommendations:items});const tree=screen.render();
 assert(screen.text(tree).includes(items[0].reason));
 button(tree,'원화와 수출 기업 추천 기사 읽기').props.onPress();
 assert.equal(screen.navigation.at(-1)[0],'NewsDetail');assert.equal(screen.navigation.at(-1)[1].newsId,777);
});

test('watchlist recommendations without a prior activity stay visible and open at the current reading level',()=>{
 const item={newsId:901,reasonNewsId:null,basis:'WATCHLIST',title:'관심종목 새 계약',summary:'새 소식을 확인해요.',reason:'관심종목 삼성전자 소식이에요'};
 const screen=harness({recommendations:[item]});const tree=screen.render();
 assert(screen.text(tree).includes('관심종목과 이어 읽기'));assert(screen.text(tree).includes(item.reason));
 button(tree,'관심종목 새 계약 추천 기사 읽기').props.onPress();
 assert.equal(screen.navigation.at(-1)[1].newsId,901);assert.equal(screen.navigation.at(-1)[1].readingLevel,'beginner');
});


test('learning sections explain the flow, keep their order, hide unrelated recommendations and scroll to reviews', () => {
 const item={newsId:777,reasonNewsId:115,basis:'RULE_INTEREST',title:'추천 기사',reason:"'금리' 퀴즈를 틀린 기사와 비슷해요"};
 const screen=harness({recommendations:[item],section:'reviews'});const tree=screen.render();const text=screen.text(tree);
 const titles=['오늘 할 일','이어서 풀 퀴즈','다시 볼 개념','비슷한 기사 더 읽기','내 개념 숙련도'];
 const headings=tree.filter(n=>n.props?.accessibilityRole==='header').flatMap(n=>n.children).join(' ');
 assert(titles.every((title,index)=>!index || headings.indexOf(title)>headings.indexOf(titles[index-1])));
 for(const description of ['읽었지만 아직 퀴즈를 풀지 않은 기사예요','퀴즈에서 틀렸거나 아직 익숙하지 않은 개념이에요','내가 공부한 기사와 비슷한 주제예요']) assert(text.includes(description));
 const target=tree.find(node=>node.type==='View' && node.props?.onLayout);target.props.onLayout({nativeEvent:{layout:{y:480}}});
 assert.equal(screen.scrolls[0].y,480);assert.equal(screen.params[0].section,undefined);
 const busy=harness({pending:true,section:'reviews'});busy.render().find(node=>node.type==='View' && node.props?.onLayout).props.onLayout({nativeEvent:{layout:{y:800}}});assert.equal(busy.scrolls.length,0);
 const cached=harness({fetching:true,section:'reviews'});cached.render().find(node=>node.type==='View' && node.props?.onLayout).props.onLayout({nativeEvent:{layout:{y:800}}});assert.equal(cached.scrolls.length,0);
 const empty=harness({reviewItems:[],recommendations:[{...item,reasonNewsId:null,basis:'RULE_RECENT'}]});const emptyText=empty.text(empty.render());
 assert(emptyText.includes('아직 틀린 개념이 없어요. 퀴즈를 풀면 여기에 모여요'));assert(!emptyText.includes('비슷한 기사 더 읽기'));assert(!emptyText.includes('최근 수집된 기사'));
});

test('an achieved personal goal does not hide remaining quizzes',()=>{
 const screen=harness({reads:0,count:0,completed:[42],goal:{type:'read1',achievedToday:true,streakDays:2}});screen.values[0]={};
 const nodes=screen.render();const text=screen.text(nodes);assert(!text.includes('개 남음'));assert(!text.includes('✓ 오늘 목표 달성'));assert(text.includes('0/3'));
 button(nodes,'기사 읽기').props.onPress();assert.equal(screen.navigation[0][0],'HomeTab');
});

test('focus refresh preserves loaded goal and count, while a missing session ends loaders', async () => {
 const screen=harness();screen.render();const cleanup=screen.effects[1]();
 assert.equal(screen.values[3],4);assert.equal(screen.values[4],true);
 await new Promise(setImmediate);assert.equal(screen.values[4],true);cleanup();
 const guest=harness({owner:null,pending:true});const text=guest.text(guest.render());
 assert(text.includes('로그인하면 다시 볼 개념'));assert(!text.includes('다시 볼 개념 불러오는 중'));
 assert.equal(guest.render().filter(n=>n.props?.accessibilityLabel==='개념 숙련도 불러오는 중').length,0);
});

test('promotion later hides the suggested level for the current owner and reports success', async () => {
 const screen=harness({suggestion:'normal'});let nodes=screen.render();
 await button(nodes,'수준 변경 제안 7일 뒤에 보기').props.onPress();await new Promise(setImmediate);
 nodes=screen.render();assert(!screen.text(nodes).includes('일반용으로 읽어볼까요?'));assert(screen.text(nodes).includes('7일 뒤에 다시'));
 const other=harness({suggestion:'analyst'});assert(other.text(other.render()).includes('분석용으로 읽어볼까요?'));
});

test('mismatched judgement fields show real article titles without claiming weak knowledge', () => {
 const screen=harness({weak:[{category:'금리',sampleSize:5,hitCount:1,recentNewsIds:[7,8],recentArticles:[{newsId:7,title:'금리 동결 기사'},{newsId:8,title:'이익 변화 기사'}]}]});
 const nodes=screen.render();const text=screen.text(nodes);assert(text.includes('판단 결과가 엇갈린 분야'));assert(text.includes('개념 이해도를 뜻하지 않아요'));
 button(nodes,'이익 변화 기사 다시 읽기').props.onPress();assert.equal(screen.navigation.at(-1)[1].newsId,8);
});


test('successful level change reports the saved level and refreshes preferences', async () => {
 const screen=harness({suggestion:'normal'});screen.render();await screen.mutations[0].onSuccess(undefined,'normal');
 assert(screen.text(screen.render()).includes('일반용으로 변경했어요.'));
});

test('review scrolling waits until the native scroll content exists', () => {
   const screen = harness({section: 'reviews', hasInnerView: false});
   screen.render();
   screen.effects.forEach(effect => effect());
   assert.deepEqual(screen.scrolls, []);
   assert.deepEqual(screen.params, []);
});

test('personalized guides and tips wait for learning preferences', () => {
 const screen=harness(); screen.values[4]=false; const tree=screen.render();
 assert(!tree.some(node=>node.type==='GuideList'||node.type==='DailyTips'));
 assert(tree.some(node=>node.props?.accessibilityLabel==='맞춤 가이드와 팁 불러오는 중'));
 screen.values[4]=true; const ready=screen.render();
 assert(ready.some(node=>node.type==='GuideList')); assert(ready.some(node=>node.type==='DailyTips'));
});

test('quiz completion is not described as completing every personal goal',()=>{
 const screen=harness({reads:3,count:5,completed:[100,101,102,103],goal:{type:'reviewJudgement',achievedToday:false,streakDays:0}});const text=screen.text(screen.render());
 assert(!text.includes('개 남음'));assert(text.match(/오늘 정답률\s+100%/));assert(!text.includes('✓ 오늘 목표 달성'));
});


test('daily definitions expand to full text and empty review has a concrete explanation',()=>{
 const definition='기업이 일정 기간 동안 사업을 운영하며 얻은 성과를 뜻합니다. 매출과 이익을 함께 확인할 수 있습니다.';
 const screen=harness({painPoint:'terms',reviewItems:[],dailyItems:[{term:'실적',definition,newsId:540,title:'실적 기사',reason:'처음 보는 개념'}]});
 const initial=screen.render();assert(!screen.text(initial).includes(definition));assert(screen.text(initial).includes('아직 틀린 개념이 없어요. 퀴즈를 풀면 여기에 모여요'));
 button(initial,'실적 뜻 보기').props.onPress();assert(screen.text(screen.render()).includes(definition));
 const article=button(initial,'복습할 기사');assert(article.children.flat(Infinity).some(n=>n?.children?.includes('퀴즈 풀기 →')));
});

test('all three actual tasks finish together and opening a definition alone never completes review',async()=>{
 const screen=harness({reads:1,count:3});let tree=screen.render();
 button(tree,'개념 복습').props.onPress();tree=screen.render();assert(!screen.text(tree).includes('오늘 할 일을 모두 마쳤어요'));
 button(tree,'개념 복습 완료').props.onPress();await new Promise(setImmediate);tree=screen.render();assert(screen.text(tree).includes('오늘 할 일을 모두 마쳤어요'));assert(!button(tree,'개념 복습'));
 screen.values[11]='2026-01-01';tree=screen.render();assert(!screen.text(tree).includes('오늘 할 일을 모두 마쳤어요'));
});
test('daily terms load for every interest and a truly empty result hides its heading',()=>{
 for(const painPoint of ['evidence','reflection','terms']) {
  const screen=harness({painPoint,dailyItems:[]});assert(!screen.text(screen.render()).includes('오늘의 용어'));
 }
 const screen=harness({painPoint:'reflection'});assert(screen.text(screen.render()).includes('오늘의 용어'));
});
