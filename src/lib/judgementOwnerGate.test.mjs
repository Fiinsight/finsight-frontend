import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('cached news and a draft cannot enable submission before the authenticated owner loads',()=>{
 const exports={};const React={createElement:(type,props,...children)=>({type,props,children}),useState:value=>[value,()=>{}],useEffect:effect=>{effect();}};
 const store={judgementDraftByNewsId:{42:{choice:'UP',reason:'근거'}},readingLevelByNewsId:{}};
 const source=fs.readFileSync(new URL('../screens/home/JudgementScreen/index.tsx',import.meta.url),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{exports,React,require:name=>name==='react'?React:name==='react-native'?{Platform:{OS:'web'},StyleSheet:{create:s=>s}}:name==='@tanstack/react-query'?{useQueryClient:()=>({fetchQuery:async()=>({level:'normal',painPoint:'terms'})}),useMutation:()=>({isPending:false}),useQuery:({queryKey})=>queryKey[0]==='news-detail'?{data:{id:42,title:'기사',rawContent:'기사 본문',judgementTarget:{symbol:'005930',name:'삼성전자'}}}:{data:null,isLoading:false,isError:false}}:name.endsWith('/auth')?{loadAuthSession:()=>new Promise(()=>{})}:name.endsWith('/useAppStore')?{useAppStore:select=>select(store)}:name.endsWith('/text')?{judgementArticleSummary:()=>''}:name.endsWith('/learningPreferences')?{evidenceCandidates:()=>[]}:name.endsWith('/judgementResults')?{resultDateLabel:()=>''}:name.endsWith('/BottomActionBar')?{BottomActionBar:'BottomActionBar'}:{}});
 const tree=exports.JudgementScreen({route:{params:{newsId:42}},navigation:{}});
 const nodes=value=>Array.isArray(value)?value.flatMap(nodes):value&&typeof value==='object'?[value,...nodes(value.children)]:[];
 const button=nodes(tree).find(node=>node.type==='BottomActionBar');assert(button);assert.equal(button.props.disabled,true);
});
