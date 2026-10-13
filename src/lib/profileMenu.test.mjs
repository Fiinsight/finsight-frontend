import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const React={createElement:(type,props,...children)=>({type,props,children})};
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):n&&typeof n==='object'?[n,...nodes(n.children)]:[];
test('profile menus are flat sections with inset separators and quiet account actions',()=>{
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/profile/ProfileScreen/SettingsList.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React,require:name=>name==='@expo/vector-icons'?{Ionicons:'Icon'}:{Pressable:'Pressable',Text:'Text',View:'View',StyleSheet:{create:s=>s}}});
 const props={level:'normal',onLogout(){},onDeleteAccount(){},onEditLevel(){},onEditLearning(){},onTerms(){},onPrivacy(){}};
 const tree=nodes(exports.SettingsList(props));
 assert.deepEqual(tree.filter(n=>n.type==='Text'&&n.props?.style?.fontSize===13&&n.props.style.marginTop===24).map(n=>n.children[0]),['학습','알림','약관 및 정보','계정']);
 const rows=tree.filter(n=>n.type==='Pressable');assert.equal(rows.length,7);
 assert(rows.every(row=>row.props.style.height===56&&row.props.style.paddingHorizontal===0));
 const notification=rows.find(n=>n.props.accessibilityLabel==='알림 설정, 준비 중');assert(!nodes(notification).some(n=>n.props?.name==='chevron-forward'));
 for(const label of ['로그아웃','회원 탈퇴']) {const row=rows.find(n=>n.props.accessibilityLabel===label);assert(!nodes(row).some(n=>n.props?.name==='chevron-forward'));}
 assert(!nodes(rows.find(n=>n.props.accessibilityLabel==='회원 탈퇴')).some(n=>n.type==='Icon'));
 assert.equal(tree.filter(n=>n.type==='View'&&n.props?.style?.marginLeft===32).length,3);
 assert(!tree.some(n=>n.type==='View'&&n.props?.style?.backgroundColor==='#FFFFFF'));
});
test('profile no longer expands level choices beneath menus or contains an unused white menu style',()=>{
 const source=fs.readFileSync(new URL('../screens/profile/ProfileScreen/index.tsx',import.meta.url),'utf8');
 assert(source.includes('<Modal visible={editing} transparent'));
 assert(source.includes('FinSight v0.1.0'));
 assert(!source.includes('menu: {'));
 assert(!/backgroundColor:\s*"#FFFFFF"[^\n]*borderRadius/.test(source));
});
