import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as theme from '../theme/index.ts';
test('partial market fallback can be retried and recovered data removes the button',()=>{
 let retried=0;const stat={value:'1',fallback:false};let data={kospi:{...stat,fallback:true},exchangeRate:stat,baseRate:stat};
 const React={createElement:(type,props,...children)=>({type,props,children})};const exports={};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../screens/home/HomeScreen/MarketPanel.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React,require:n=>n.endsWith('/theme')?theme:n==='@react-navigation/native'?{useIsFocused:()=>true}:n==='@tanstack/react-query'?{useQuery:()=>({data,isError:false,isFetching:false,refetch:()=>retried++})}:n==='react-native'?{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:s=>s}}:{}});
 const nodes=n=>Array.isArray(n)?n.flatMap(nodes):n&&typeof n==='object'?[n,...nodes(n.children)]:[];
 const button=()=>nodes(exports.MarketPanel()).find(n=>n.type==='Pressable');
 assert(button());button().props.onPress();assert.equal(retried,1);
 data={...data,kospi:stat};assert(!button());
});
