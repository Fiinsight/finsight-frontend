import { withoutWatchlistNews } from './watchlist.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { evidenceCandidates } from './learningPreferences.ts';
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node,...nodes(node.children)] : [];
const react={ createElement:(type,props,...children)=>({type,props,children}) };
test('evidence candidates quote two distinct article sentences without inventing facts', () => {
 const candidates=evidenceCandidates('매출은 2% 증가했다. 비용이 늘었다. 매출은 2% 증가했다. 전망은 미정이다.');
 assert.deepEqual(candidates,['매출은 2% 증가했다.','비용이 늘었다.']);
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/home/JudgementScreen/ReasonInput.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React:react,require:()=>({Pressable:'Pressable',Text:'Text',TextInput:'TextInput',View:'View',StyleSheet:{create:v=>v}})});
 let quoted='';
 const tree=nodes(exports.ReasonInput({value:'기존 근거',recommended:true,candidates,onChange:value=>{quoted=value;}}));
 assert(tree.some(node=>node.type==='Text' && node.children.includes('추천')));
 tree.find(node=>node.type==='Pressable').props.onPress(); assert.equal(quoted,'기존 근거\n“매출은 2% 증가했다.”');
 const standard=nodes(exports.ReasonInput({value:'',recommended:false,candidates,onChange(){}}));
 assert(!standard.some(node=>node.type==='Pressable'));
});
test('home keeps core article ids and never renders copy underneath cards', () => {
 for(const focus of ['news','decision','market','reflection']) {
  let cursor=0; const values=[]; const exports={};
  const hooks={...react,useState(initial){const id=cursor++;values[id]??=initial;return[values[id],next=>{values[id]=next;}];}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/home/HomeScreen/NewsSection.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React:hooks,require:name=>name==='react'?hooks:name==='@tanstack/react-query'?{useQuery:()=>({data:[{id:1},{id:2},{id:3}]})}:name.endsWith('/learningPreferences')?{}:name.endsWith('/watchlist')?{withoutWatchlistNews}:name.endsWith('/NewsCard')?{NewsCard:'NewsCard'}:{Pressable:'Pressable',Text:'Text',View:'View',StyleSheet:{create:v=>v}}});
  const tree=nodes(exports.NewsSection({preferences:{focus,painPoint:'overload'},onSelectNews(){}}));
  assert.deepEqual(tree.filter(node=>node.type==='NewsCard').map(node=>node.props.news.id),[1,2,3]);
  assert(!tree.some(node=>node.type==='Text' && /판단해볼 만한|시장 지표와 함께|지난 판단과 비교|핵심 내용을 하나씩/.test(node.children.join(''))));
  const toggle=tree.find(node=>node.props?.accessibilityLabel==='추가 뉴스 펼치기'); assert(toggle); assert.equal(toggle.props.accessibilityState.expanded,false);
 }
});
