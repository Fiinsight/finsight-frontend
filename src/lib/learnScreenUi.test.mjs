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

function harness({ owner = 1, count = 1, completed = [], reviewItems, weak = [], pending = false, fetching = false, error = false, painPoint, goal, mastery, recommendations = [], suggestion = null, section, dailyItems, hasInnerView = true } = {}) {
  const reviews = reviewItems ?? [{ newsId: 232, term: '코스피', definition: '시장 흐름을 보여주는 지수예요.', title: '기사 제목', level: 'analyst' }];
  const preferences = { level: 'beginner', focus: 'news', pace: 'micro', dailyGoal: '뉴스 하나 읽기', source: 'onboarding', painPoint };
  const values = [{ '2026-10-12': [100,101,102,103] }, owner, preferences, 4, true, null, null, {}, owner];
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

test('next task prioritizes unfinished quiz, review article, then home news', () => {
  const first = harness(); button(first.render(), '다음 할 일').props.onPress();
  assert.equal(first.navigation[0][0],'NewsDetail'); assert.equal(first.navigation[0][1].newsId,103);
  const second = harness({completed:[100,101,102,103]}); button(second.render(),'다음 할 일').props.onPress();
  assert.equal(second.navigation[0][1].newsId,232); assert.equal(second.navigation[0][1].readingLevel,'analyst');
  const home = harness({completed:[100,101,102,103],reviewItems:[]}); button(home.render(),'다음 할 일').props.onPress();
  assert.equal(home.navigation[0][0],'HomeTab'); assert.equal(home.navigation[0][1].screen,'Home');
});

test('small samples hide accuracy and reading count matches attendance cap', () => {
  const small=harness({count:1}); const text=small.text(small.render());
  assert(text.includes('3/3')); assert(text.includes('퀴즈 4개 더 풀면 정답률이 보여요')); assert(!text.includes('100%'));
  const enough=harness({count:5}); assert(enough.text(enough.render()).includes('오늘 정답률 100%'));
});

test('review chip opens definition sheet and returns to its original reading level', () => {
  const screen=harness(); button(screen.render(),'코스피 뜻과').props.onPress();
  const sheet=screen.render(); assert(screen.text(sheet).includes('시장 흐름을 보여주는 지수예요.'));
  button(sheet,'코스피 이 개념이 나온 기사 다시 풀기').props.onPress();
  assert.equal(screen.navigation[0][1].newsId,232); assert.equal(screen.navigation[0][1].readingLevel,'analyst'); assert.equal(screen.navigation[0][1].quizTerm,'코스피'); assert.equal(screen.navigation[0][1].openQuiz,true);
  assert.equal(screen.values[5],null);
});

test('criteria are kept in the info sheet and weak areas only appear when present', () => {
  const screen=harness(); const initial=screen.render();
  assert(!screen.text(initial).includes('현재 학습 목표를 달성한 날')); assert(!screen.text(initial).includes('판단 결과가 엇갈린 분야'));
  button(initial,'연속 목표 달성 기준 안내').props.onPress(); assert(screen.text(screen.render()).includes('현재 학습 목표를 달성한 날'));
  const weak=harness({weak:[{category:'국내증시',decidedCount:3,hitCount:1,recentNewsIds:[232]}]});
  assert(weak.text(weak.render()).includes('판단 결과가 엇갈린 분야'));
});

test('loading reserves article cards, error retries are local, and buttons have names', () => {
  const loading=harness({pending:true}); const loadingNodes=loading.render();
  assert.equal(button(loadingNodes,'다음 할 일').props.disabled,true);
  assert.equal(loadingNodes.filter(node=>node.props?.accessibilityLabel==='풀다 만 퀴즈 기사 불러오는 중').length,2);
  const error=harness({error:true}); const nodes=error.render();
  button(nodes,'학습 진행도 다시 시도').props.onPress(); button(nodes,'다시 볼 개념 다시 시도').props.onPress();
  assert.deepEqual(error.retries,['progress','reviews']);
  for (const node of nodes.filter(node=>node.type==='Pressable')) { assert.equal(node.props.accessibilityRole,'button'); assert(node.props.accessibilityLabel); }
});

test('pain point terms keeps three definitions after the main learning flow', () => {
 const screen=harness({painPoint:'terms'}); const initial=screen.render();
 assert(screen.text(initial).indexOf('학습 목표') < screen.text(initial).indexOf('오늘의 용어 3개'));
 button(initial,'환율 뜻 보기').props.onPress();
 assert(screen.text(screen.render()).includes('통화 교환 비율'));
});
test('each unmet goal offers one action and five minute approximation is explicit', () => {
 for (const [type,label,target] of [['read1','오늘의 뉴스 읽기','HomeTab'],['memo','기사 메모 남기기','NewsDetail'],['reviewJudgement','판단 돌아보기','HistoryTab'],['minutes5','학습 활동 이어가기','NewsDetail']]) {
  const screen=harness({goal:{type,achievedToday:false,streakDays:2}}); const initial=screen.render();
  assert.match(screen.text(initial), /2일\s+연속 목표 달성/); button(initial,label).props.onPress();
  assert.equal(screen.navigation[0][0],target);
  if(type==='memo') assert.equal(screen.navigation[0][1].openNotes,true);
  if(type==='minutes5') assert(screen.text(initial).includes('활동 3개 = 5분 학습'));
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
 const bars=tree.filter(node=>node.props?.accessibilityRole==='progressbar');
 assert.equal(bars.length,2);assert.equal(bars[0].props.accessibilityValue.now,83);
 assert(text.includes('80% 이상·3번 이상 풀면 잘 아는 개념이에요'));
 assert(/익히는 중\s+1\s*개/.test(text));
 assert(harness({mastery:{strongest:[],weakest:[],totalAttempts:0}}).text(harness().render()).includes('퀴즈를 풀면'));
});

test('empty mastery groups are not padded and daily choices show reasons and link to their source', () => {
 const empty=harness({mastery:{strongest:[],weakest:[],totalAttempts:4,learningCount:2}});
 const nodes=empty.render();assert.equal(nodes.filter(node=>node.type==='Text' && node.children.includes('아직 충분히 풀지 않았어요')).length,2);
 assert.equal(nodes.filter(node=>node.props?.accessibilityRole==='progressbar').length,0);
 const daily=harness({painPoint:'terms'});const initial=daily.render();
 for(const reason of ['지난번에 틀린 개념','처음 보는 개념','익히는 중인 개념']) assert(daily.text(initial).includes(reason));
 button(initial,'금리 뜻 보기').props.onPress();const sheet=daily.render();assert(daily.text(sheet).includes('이자 비율'));
 button(sheet,'금리 오늘 기사에서 읽기').props.onPress();
 assert.equal(daily.navigation.at(-1)[0],'NewsDetail');assert.equal(daily.navigation.at(-1)[1].newsId,232);
 const hidden=harness({painPoint:'evidence'});assert(!hidden.text(hidden.render()).includes('오늘의 용어 3개'));
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
 const titles=['학습 목표','풀다 만 퀴즈','다시 볼 개념','비슷한 기사 더 읽기','내 개념 숙련도'];
 assert(titles.every((title,index)=>!index || text.indexOf(title)>text.indexOf(titles[index-1])));
 for(const description of ['읽었지만 아직 퀴즈를 풀지 않은 기사예요','퀴즈에서 틀렸거나 아직 익숙하지 않은 개념이에요','내가 공부한 기사와 비슷한 주제예요']) assert(text.includes(description));
 const target=tree.find(node=>node.type==='View' && node.props?.onLayout);target.props.onLayout({nativeEvent:{layout:{y:480}}});
 assert.equal(screen.scrolls[0].y,480);assert.equal(screen.params[0].section,undefined);
 const busy=harness({pending:true,section:'reviews'});busy.render().find(node=>node.type==='View' && node.props?.onLayout).props.onLayout({nativeEvent:{layout:{y:800}}});assert.equal(busy.scrolls.length,0);
 const cached=harness({fetching:true,section:'reviews'});cached.render().find(node=>node.type==='View' && node.props?.onLayout).props.onLayout({nativeEvent:{layout:{y:800}}});assert.equal(cached.scrolls.length,0);
 const empty=harness({reviewItems:[],recommendations:[{...item,reasonNewsId:null,basis:'RULE_RECENT'}]});const emptyText=empty.text(empty.render());
 assert(emptyText.includes('지금은 다시 볼 개념이 없어요'));assert(!emptyText.includes('비슷한 기사 더 읽기'));assert(!emptyText.includes('최근 수집된 기사'));
});

test('attendance is separate from the read-one goal and server completions survive a device change', () => {
 const screen=harness({completed:[42],goal:{type:'read1',achievedToday:true,streakDays:2}});
 screen.values[0]={}; screen.values[3]=0;
 const nodes=screen.render(); const text=screen.text(nodes);
 assert(text.includes('출석용 기사 읽기')); assert(text.includes('0/3'));
 assert(text.includes('최근 읽은 기사의 퀴즈를 모두 마쳤어요.'));
 assert(!text.includes('아직 읽은 기사가 없어요.')); assert(!text.includes('연속 학습'));
 button(nodes,'출석용 기사 읽기 기준 안내').props.onPress();
 assert(screen.text(screen.render()).includes('개인 학습 목표와 별개인 출석 기준'));
});


test('focus refresh preserves loaded goal and count, while a missing session ends loaders', async () => {
 const screen=harness();screen.render();const cleanup=screen.effects.at(-1)();
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
