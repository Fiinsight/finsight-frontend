import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function screen() {
 const values=[],mutations=[],invalidations=[],cache={pages:[{items:[{id:1,newsId:7,newsTitle:'기사',content:'메모',createdAt:'2026-11-03T01:00:00Z'}]}],pageParams:[{}]};let slot=0,mutationSlot=0,opened=0;
 const note=cache.pages[0].items[0];
 const React={createElement:(type,props,...children)=>({type,props,children}),useState:initial=>{const i=slot++;if(!(i in values))values[i]=initial;return [values[i],v=>values[i]=v];}};
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/history/HistoryScreen/HistoryNoteCard.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React,require:name=>name==='react'?React:name==='react-native'?{Pressable:'Pressable',View:'View',Text:'Text',TextInput:'TextInput',StyleSheet:{create:s=>s}}:name==='@tanstack/react-query'?{useQueryClient:()=>({setQueriesData:(_filter,updater)=>Object.assign(cache,updater(cache)),invalidateQueries:({queryKey})=>invalidations.push(queryKey[0])}),useMutation:options=>{const i=mutationSlot++;const m={...options,isPending:false,isError:false,reset(){},mutate(){m.called=true;}};mutations[i]=m;return m;}}:name.endsWith('/DeleteNoteConfirmation')?{DeleteNoteConfirmation:'DeleteNoteConfirmation'}:name.endsWith('/format')?{toRelativeTimeKorean:()=> '오늘'}:{}});
 const visit=n=>Array.isArray(n)?n.flatMap(visit):n&&typeof n==='object'?[n,...visit(n.children)]:[];
 return {cache,mutations,invalidations,values,render:()=>{slot=0;mutationSlot=0;return visit(exports.HistoryNoteCard({note,onArticle:()=>opened++}));},opened:()=>opened};
}
const button=(nodes,label)=>nodes.find(n=>n.props?.accessibilityLabel===label);
test('history note opens article, edits, asks before delete and updates cached list immediately',()=>{
 const s=screen();let nodes=s.render();button(nodes,'기사 기사로 이동').props.onPress();assert.equal(s.opened(),1);
 button(nodes,'메모 수정').props.onPress();nodes=s.render();assert(button(nodes,'메모 수정 내용'));
 s.mutations[0].onSuccess({...s.cache.pages[0].items[0],content:'수정 메모'});assert.equal(s.cache.pages[0].items[0].content,'수정 메모');
 nodes=s.render();button(nodes,'메모 삭제').props.onPress();nodes=s.render();const confirm=nodes.find(n=>n.type==='DeleteNoteConfirmation');assert(confirm);assert(!s.mutations[1].called);
 confirm.props.onConfirm();assert(s.mutations[1].called);s.mutations[1].onSuccess();assert.equal(s.cache.pages[0].items.length,0);assert(s.invalidations.includes('article-notes'));
});
