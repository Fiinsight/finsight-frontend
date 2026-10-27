import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const nodes = n => Array.isArray(n) ? n.flatMap(nodes) : n && typeof n === 'object' ? [n, ...nodes(n.children)] : [];
function setup() {
 let cursor=0; const values=[], effects=[], timers=[], calls=[];
 const React={createElement:(type,props,...children)=>({type,props,children}),useState(initial){const i=cursor++;if(!(i in values))values[i]=initial;return [values[i],v=>{values[i]=typeof v==='function'?v(values[i]):v}]},useEffect(fn,deps){effects.push({fn,deps})}};
 const native=Object.fromEntries(['ActivityIndicator','Text','TextInput','View','Pressable','ScrollView','Modal'].map(k=>[k,k]));Object.assign(native,{StyleSheet:{create:s=>s},Platform:{OS:'web'},Keyboard:{dismiss(){}}});
 const exports={};const source=fs.readFileSync(new URL('../screens/auth/AuthScreen.tsx',import.meta.url),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React,setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},require:name=>name==='react'?React:name==='react-native'?native:name==='expo-linking'?{createURL:()=> 'finsight://auth/kakao'}:name==='expo-linear-gradient'?{LinearGradient:'Gradient'}:name==='../../lib/api'?{signup:async(...args)=>{calls.push(args);return{}},getKakaoLoginUrl:()=>new Promise(()=>{})}:name==='../../lib/auth'?{saveAuthSession:async()=>{}}:{}});
 const render=()=>{cursor=0;effects.length=0;return nodes(exports.AuthScreen({onAuthenticated(){}}))};
 return {render,calls,effects,timers};
}
test('auth defaults to login and signup uses exactly email and password, with legal links but no automatic consent copy',async()=>{
 const h=setup();let tree=h.render();const button=(label)=>tree.find(n=>n.props?.accessibilityLabel===label);
 assert(button('로그인'));button('회원가입으로 전환').props.onPress();tree=h.render();
 assert.equal(tree.filter(n=>n.type==='TextInput').length,2);assert(!JSON.stringify(tree).includes('회원가입하면'));
 assert(button('이용약관 보기'));assert(button('개인정보처리방침 보기'));
 tree.find(n=>n.props?.placeholder==='이메일 아이디 입력').props.onChangeText('qa@example.test');tree.find(n=>n.props?.placeholder==='비밀번호 입력').props.onChangeText('test-password');tree=h.render();await button('회원가입').props.onPress();
 assert.deepEqual(h.calls,[['qa@example.test','test-password']]);
});
test('slow Kakao preparation keeps duplicate actions disabled and explains the wait',()=>{
 const h=setup();let tree=h.render();tree.find(n=>n.props?.accessibilityLabel==='카카오로 계속하기').props.onPress();tree=h.render();
 assert(tree.find(n=>n.props?.accessibilityLabel==='카카오 로그인 진행 중').props.disabled);
 h.effects.find(e=>e.deps?.[0]===true).fn();assert.equal(h.timers[0].ms,8000);h.timers[0].fn();tree=h.render();
 assert(tree.some(n=>n.props?.accessibilityLiveRegion==='polite'&&n.children.join('').includes('로그인 연결이 지연')));
});
