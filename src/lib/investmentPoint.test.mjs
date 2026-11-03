import { sourceExcerpt } from './text.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.children)] : [];
function render(level, reasons, mode = 'level', selected = [], reviewOnly = false) {
  const exports = {};
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useRef: value => ({ current: value }), useEffect() {},
    useState: value => [typeof value === 'boolean' ? true : value, () => {}]
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/home/NewsDetailScreen/index.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true }
  }).outputText, { exports, React: react, require(name) {
    if (name.endsWith('/text')) return {sourceExcerpt};
    if (name === 'react') return react;
    if (name === 'react-native') return { SafeAreaView: 'SafeAreaView', ScrollView: 'ScrollView', Text: 'Text', View: 'View', Pressable: 'Pressable', StyleSheet: { create: x => x } };
    if (name === '@react-navigation/native') return { useIsFocused: () => true };
    if (name === '@tanstack/react-query') return { useQueryClient: () => ({}), useQuery: () => ({ data: { id: 1, judgementReviewOnly:reviewOnly, title: '기사', rawContent: '매출 2% 증가', importanceReason: '이전 투자 포인트', importanceReasons: reasons } }) };
    if (name.endsWith('/useAppStore')) return { useAppStore: selector => selector({ readingLevelByNewsId: {}, setReadingLevel: (id, value) => selected.push([id, value]) }) };
    const component = name.split('/').at(-1);
    return { [component]: component };
  }});
  return nodes(exports.NewsDetailScreen({ route: { params: { newsId: 1, readingLevel: level, readMode: mode } }, navigation: { setParams: value => selected.push(value.readingLevel) } }));
}
test('investment point follows each reading tab and remains visible beside level content', () => {
  const reasons = { beginner: '초보 포인트', normal: '일반 포인트', analyst: '분석 포인트' };
  for (const level of Object.keys(reasons)) {
    assert.equal(render(level, reasons).find(n => n.type === 'ImportanceReasonCard').props.reason, reasons[level]);
  }
});
test('legacy and blank per-level reasons use the existing article investment point', () => {
  for (const reasons of [undefined, { beginner: '' }, { beginner: '  ' }]) {
    assert.equal(render('beginner', reasons, 'raw').find(n => n.type === 'ImportanceReasonCard').props.reason, '이전 투자 포인트');
  }
});

test('tab selection updates a reading level passed by navigation as well as the saved preference', () => {
  const selected = [];
  const tree = render('beginner', { beginner: '초보', analyst: '분석' }, 'level', selected);
  tree.find(n => n.type === 'LevelTabs').props.onChange('normal');
  assert.deepEqual(selected, [[1, 'normal'], 'normal']);
});

test('server review-only policy replaces judgement action on old articles',()=>{
 const tree=render('beginner',undefined,'level',[],true);
 assert(tree.some(n=>n.type==='Text' && n.children.some(text=>typeof text==='string' && text.includes('복습용'))));
 assert(!tree.some(n=>n.type==='BottomActionBar'));
});

function detailTabHarness(params = {}) {
  const state=[],effects=[],pending=[],opened=[],saved=[],route={params:{newsId:1,...params}};let slot=0;
  const detail={id:1,title:'실제 기사',source:'연합뉴스',url:'https://www.yna.co.kr/view/article',category:'시장',keyTerms:['금리'],rawContent:'첫 문장이다. 둘째 문장이다. 셋째 문장이다. 넷째 문장은 노출하지 않는다. '+ '긴 본문 '.repeat(150),importanceReason:'기사 확인 포인트',judgementTarget:{symbol:'KOSPI'}};
  const React={createElement:(type,props,...children)=>typeof type==='function'?type(props):({type,props,children}),useRef:v=>({current:v}),useEffect:fn=>effects.push(fn),useState:initial=>{const i=slot++;if(!(i in state))state[i]=initial;return [state[i],value=>state[i]=value];}};
  const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/home/NewsDetailScreen/index.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React,require:name=>{
    if(name==='react')return React;
    if(name==='react-native')return {SafeAreaView:'SafeAreaView',ScrollView:'ScrollView',Text:'Text',View:'View',Pressable:'Pressable',Linking:{openURL:url=>opened.push(url)},StyleSheet:{create:s=>s}};
    if(name==='@react-navigation/native')return {useIsFocused:()=>true};
    if(name==='@tanstack/react-query')return {useQuery:()=>({data:detail}),useQueryClient:()=>({invalidateQueries(){}})};
    if(name.endsWith('/api'))return {getLearningPreferences:()=>new Promise(resolve=>pending.push(resolve))};
    if(name.endsWith('/useAppStore'))return {useAppStore:selector=>selector({readingLevelByNewsId:{},setReadingLevel:(...args)=>saved.push(args)})};
    if(name.endsWith('/text'))return {sourceExcerpt};
    const component=name.split('/').at(-1);return {[component]:component};
  }});
  const render=()=>{slot=0;effects.length=0;return nodes(exports.NewsDetailScreen({route,navigation:{setParams:value=>Object.assign(route.params,value),getParent:()=>({navigate(){}})}}));};
  const load=async (painPoint='terms')=>{render();effects[0]();effects[1]();pending.shift()({painPoint,level:'beginner'});await new Promise(setImmediate);return render();};
  return {load,render,route,opened,saved,detail};
}

test('default body tab follows overload only and explicit route mode always wins',async()=>{
 for(const painPoint of ['overload','terms','reflection','evidence',undefined]) {
  for(const readMode of [undefined,'raw','level']) {
   const screen=detailTabHarness({readMode});const tree=await screen.load(painPoint);
   const expected=readMode??(painPoint==='overload'?'level':'raw');
   const selected=tree.find(n=>n.props?.accessibilityRole==='tab'&&n.props.accessibilityState.selected);
   assert.equal(nodes(selected).find(n=>n.type==='Text').children[0],expected==='raw'?'원문':'내 수준에 맞게 읽기');
   assert.equal(tree.some(n=>n.type==='LevelTabs'),expected==='level');
  }
 }
});
test('restored tabs preserve route reading level, explicit navigation and source excerpt safety',async()=>{
 const screen=detailTabHarness({readMode:'level',readingLevel:'analyst',openQuiz:true,quizTerm:'금리'});let tree=await screen.load('reflection');
 let levels=tree.find(n=>n.type==='LevelTabs');assert.equal(levels.props.value,'analyst');
 assert.equal(tree.find(n=>n.type==='LearningPanel').props.quizTerm,'금리');
 levels.props.onChange('beginner');tree=screen.render();assert.equal(tree.find(n=>n.type==='LevelTabs').props.value,'beginner');assert.deepEqual(screen.saved,[[1,'beginner']]);
 const rawTab=tree.find(n=>n.props?.accessibilityRole==='tab'&&nodes(n).some(c=>c.type==='Text'&&c.children.includes('원문')));rawTab.props.onPress();tree=screen.render();
 const article=tree.find(n=>n.type==='ArticleBody');assert(article.props.text.length<=300);assert(!article.props.text.includes('넷째 문장'));
 assert.equal(tree.filter(n=>n.type==='SourceLinkRow').length,2);
 const heading=tree.findIndex(n=>n.type==='Text'&&n.children.includes(screen.detail.title));assert.equal(tree[heading+1].type,'SourceLinkRow');
 tree.find(n=>n.props?.accessibilityLabel==='원문 전체 보기').props.onPress();assert.deepEqual(screen.opened,[screen.detail.url]);
 assert(tree.some(n=>n.props?.accessibilityRole==='switch'));assert(tree.some(n=>n.type==='TermPopup'));assert(tree.some(n=>n.type==='ArticleNotesPanel'));assert(tree.some(n=>n.type==='BottomActionBar'));
});
test('reusing a detail screen for another article without readMode reapplies its preference default',async()=>{
 const screen=detailTabHarness({readMode:'level'});await screen.load('overload');screen.route.params={newsId:2};const tree=await screen.load('terms');assert(!tree.some(n=>n.type==='LevelTabs'));assert(tree.some(n=>n.type==='ArticleBody'));
});
