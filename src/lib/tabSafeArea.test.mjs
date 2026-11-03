import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
test('tab bar keeps content height and bottom padding for web, iOS and Android insets',()=>{
 let bottom=0;const exports={};const React={createElement:(type,props,...children)=>({type,props,children})};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../navigation/RootNavigator.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React,require:n=>n==='react-native-safe-area-context'?{useSafeAreaInsets:()=>({bottom})}:n==='@react-navigation/bottom-tabs'?{createBottomTabNavigator:()=>({Navigator:'Navigator',Screen:'Screen'})}:n.endsWith('/JudgementResultsProvider')?{JudgementResultsProvider:'Provider',useJudgementResults:()=>({unseen:[]})}:n==='react-native'?{View:'View'}:n==='@expo/vector-icons'?{Ionicons:'Icon'}:{}});
 for(bottom of [0,34,24]) {
  const root=exports.RootNavigator({session:{userId:1},onLogout(){}});const tabs=root.children[0].type(root.children[0].props);
  const style=tabs.props.screenOptions({route:{name:'HomeTab'}}).tabBarStyle;
  assert.equal(style.height,56+bottom);assert.equal(style.paddingBottom,Math.max(bottom,8));assert.equal(style.paddingTop,8);
  assert(style.height-style.paddingBottom-style.paddingTop>=40);
 }
 assert.match(readFileSync(new URL('../../public/index.html',import.meta.url),'utf8'),/viewport-fit=cover/);
});
