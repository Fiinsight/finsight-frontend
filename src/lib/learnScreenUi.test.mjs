import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { kstDate } from './historyRecords.ts';
const model = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('./readingProgressModel.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: model, require: () => ({ kstDate }) });
const { resumeLearningIds, DAILY_ARTICLE_GOAL } = model;

function harness({ count = 1, completed = [], reviewItems, weak = [], pending = false, error = false, painPoint, goal, mastery, recommendations = [], suggestion = null } = {}) {
  const reviews = reviewItems ?? [{ newsId: 232, term: '코스피', definition: '시장 흐름을 보여주는 지수예요.', title: '기사 제목', level: 'analyst' }];
  const preferences = { level: 'beginner', focus: 'news', pace: 'micro', dailyGoal: '뉴스 하나 읽기', source: 'onboarding', painPoint };
  const values = [{ '2026-10-12': [100,101,102,103] }, 1, preferences, 4, true];
  const navigation = [], retries = [], changes = [];
  let slot = 0;
  const React = { createElement: (type, props, ...children) => ({ type, props, children }), useCallback: fn => fn, useState(initial) {
    const index = slot++;
    if (!(index in values)) values[index] = initial;
    return [values[index], next => { values[index] = next; }];
  }};
  const exports = {};
  const query = (data, key) => ({ data: pending || error ? undefined : data, isPending: pending, isLoading: pending, isError: error, refetch: () => retries.push(key) });
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/learn/LearnScreen/index.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, { exports, React, require: name => {
    if (name === 'react') return React;
    if (name === 'react-native') return { SafeAreaView:'SafeAreaView', ScrollView:'ScrollView', Text:'Text', Pressable:'Pressable', View:'View', Modal:'Modal', StyleSheet:{create:value=>value} };
    if (name === '@react-navigation/native') return { useFocusEffect() {}, useIsFocused:()=>true, useNavigation:()=>({ navigate:(...args)=>navigation.push(args) }) };
    if (name === '@tanstack/react-query') return { useQuery: options => options.queryKey[0] === "learning-recommendations" ? query({items:recommendations}, "recommendations") : options.queryKey[0] === "daily-learning-terms" ? query([{term:"금리",definition:"이자 비율"},{term:"환율",definition:"통화 교환 비율"},{term:"물가",definition:"평균 가격"}], "terms") : options.queryKey[0] === 'learning-reviews' ? query(reviews, 'reviews') : query({today:{answeredCount:count,accuracy:1},week:{answeredCount:count,accuracy:1},activityStreakDays:3,completedNewsIds:completed,weakAreas:weak,goal,mastery,levelSuggestion:suggestion}, 'progress'), useQueryClient: () => ({ invalidateQueries() {} }), useMutation: () => ({ mutate(level) { changes.push(level); }, isPending:false, isError:false }), useQueries: ({queries}) => queries.map((options,index)=>query({id:options.queryKey[1],title:`복습할 기사 ${index}`,category:'국내증시',rawContent:'본문'}, 'article')) };
    if (name.endsWith('/readingProgressModel')) return { resumeLearningIds, DAILY_ARTICLE_GOAL };
    if (name.endsWith('/onboarding')) return { getDefaultLearningPreferences:()=>preferences };
    if (name.endsWith('/GuideList')) return { GuideList:'GuideList' };
    if (name.endsWith('/DailyTips')) return { DailyTips:'DailyTips' };
    if (name.endsWith('/TabScreenHeader')) return { TabScreenHeader:'TabScreenHeader' };
    return {};
  }});
  const visit = node => Array.isArray(node) ? node.flatMap(visit) : !node || typeof node !== 'object' || node.type === 'Modal' && !node.props.visible ? [] : [node,...visit(node.children)];
  const render = () => { slot=0; return visit(exports.LearnScreen()); };
  const text = nodes => nodes.filter(node=>node.type==='Text').flatMap(node=>node.children).join(' ');
  return {render,text,navigation,retries,values,changes};
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
  button(sheet,'코스피 기사에서 다시 풀기').props.onPress();
  assert.equal(screen.navigation[0][1].newsId,232); assert.equal(screen.navigation[0][1].readingLevel,'analyst');
  assert.equal(screen.values[5],null);
});

test('criteria are kept in the info sheet and weak areas only appear when present', () => {
  const screen=harness(); const initial=screen.render();
  assert(!screen.text(initial).includes('판단·메모·퀴즈를 남긴 날')); assert(!screen.text(initial).includes('다시 살펴볼 분야'));
  button(initial,'연속 학습 기준 안내').props.onPress(); assert(screen.text(screen.render()).includes('판단·메모·퀴즈를 남긴 날'));
  const weak=harness({weak:[{category:'국내증시',decidedCount:3,hitCount:1,recentNewsIds:[232]}]});
  assert(weak.text(weak.render()).includes('다시 살펴볼 분야'));
});

test('loading reserves article cards, error retries are local, and buttons have names', () => {
  const loading=harness({pending:true}); const loadingNodes=loading.render();
  assert.equal(button(loadingNodes,'다음 할 일').props.disabled,true);
  assert.equal(loadingNodes.filter(node=>node.props?.accessibilityLabel==='이어서 학습할 기사 불러오는 중').length,2);
  const error=harness({error:true}); const nodes=error.render();
  button(nodes,'학습 진행도 다시 시도').props.onPress(); button(nodes,'복습 개념 다시 시도').props.onPress();
  assert.deepEqual(error.retries,['progress','reviews']);
  for (const node of nodes.filter(node=>node.type==='Pressable')) { assert.equal(node.props.accessibilityRole,'button'); assert(node.props.accessibilityLabel); }
});

test('pain point terms shows three definitions in the first card', () => {
 const screen=harness({painPoint:'terms'}); const initial=screen.render();
 assert(screen.text(initial).indexOf('오늘의 용어 3개') < screen.text(initial).indexOf('학습 목표'));
 button(initial,'환율 뜻 보기').props.onPress();
 assert(screen.text(screen.render()).includes('통화 교환 비율'));
});
test('each unmet goal offers one action and five minute approximation is explicit', () => {
 for (const [type,label,target] of [['read1','오늘의 뉴스 읽기','HomeTab'],['memo','기사 메모 남기기','NewsDetail'],['reviewJudgement','판단 돌아보기','HistoryTab'],['minutes5','학습 활동 이어가기','NewsDetail']]) {
  const screen=harness({goal:{type,achievedToday:false,streakDays:2}}); const initial=screen.render();
  assert.match(screen.text(initial), /연속 달성\s+2\s*일/); button(initial,label).props.onPress();
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

test('concept mastery card renders strongest and weakest estimates with accessible bars', () => {
 const row={term:'환율',pKnown:.9,effectivePKnown:.73,attempts:8};
 const screen=harness({mastery:{strongest:[row],weakest:[{...row,term:'금리',effectivePKnown:.2}],totalAttempts:12}});
 const tree=screen.render();const text=screen.text(tree);
 assert(text.includes('내 개념 숙련도'));assert(/최근 퀴즈\s+12\s*회 기준 추정/.test(text));
 assert(/73\s*%/.test(text));assert(/20\s*%/.test(text));
 const bars=tree.filter(node=>node.props?.accessibilityRole==='progressbar');
 assert.equal(bars.length,2);assert.equal(bars[0].props.accessibilityValue.now,73);
 assert(harness({mastery:{strongest:[],weakest:[],totalAttempts:0}}).text(harness().render()).includes('퀴즈를 풀면'));
});

test('recommendation cards show actual behavior reason and open the selected article', () => {
 const items=[{newsId:777,title:'원화와 수출 기업',summary:'매출 기준을 확인했어요.',category:'해외시장',reason:'이전에 읽은 환율 기사의 학습 활동과 비슷해요.'}];
 const screen=harness({recommendations:items});const tree=screen.render();
 assert(screen.text(tree).includes(items[0].reason));
 button(tree,'원화와 수출 기업 추천 기사 읽기').props.onPress();
 assert.equal(screen.navigation.at(-1)[0],'NewsDetail');assert.equal(screen.navigation.at(-1)[1].newsId,777);
});
