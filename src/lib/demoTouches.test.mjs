import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const jsx = {createElement:(type,props,...children)=>({type,props:props??{},children})};
function compile(path, mocks, globals={}) {
 const exports={}; vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React:jsx,require:name=>mocks[name]??{},...globals});return exports;
}
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):n&&typeof n==='object'?[n,...nodes(n.children)]:[];
test('demo setting defaults off, persists both states and restores only true',async()=>{
 let saved=null; const writes=[];
 const mocks={zustand:require('zustand'),'./storage':{storageGetItem:async()=>saved,storageSetItem:async(k,v)=>{writes.push([k,v]);saved=v;}}};
 let store=compile('./demoTouches.ts',mocks);assert.equal(store.useDemoTouches.getState().enabled,false);
 await store.loadDemoTouches();assert.equal(store.useDemoTouches.getState().enabled,false);
 await store.setDemoTouches(true);assert.equal(saved,'true');
 store=compile('./demoTouches.ts',mocks);await store.loadDemoTouches();assert.equal(store.useDemoTouches.getState().enabled,true);
 await store.setDemoTouches(false);assert.equal(saved,'false');
 assert(writes.every(([key])=>key==='finsight.demoTouches'));
 saved='invalid';store=compile('./demoTouches.ts',mocks);await store.loadDemoTouches();assert.equal(store.useDemoTouches.getState().enabled,false);
});
test('late restore cannot override a new toggle and failed storage is reported',async()=>{
 let resolve; const store=compile('./demoTouches.ts',{zustand:require('zustand'),'./storage':{storageGetItem:()=>new Promise(r=>resolve=r),storageSetItem:async()=>{throw Error('full');}}});
 const loading=store.loadDemoTouches();await store.setDemoTouches(true);resolve('false');await loading;
 assert.equal(store.useDemoTouches.getState().enabled,true);assert.match(store.useDemoTouches.getState().error,/저장/);
});
function harness(platform='ios') {
 let enabled=false,cursor=0,renders=0,now=1000;const slots=[],effects=[],animations=[];
 class Value {constructor(v){this.value=v;}setValue(v){this.value=v;}stopAnimation(){}interpolate(config){return {value:this,config};}}
 class ValueXY extends Value {constructor(){super({x:0,y:0});}getTranslateTransform(){return [{translateX:this.value.x},{translateY:this.value.y}];}}
 const hooks={...jsx,useRef:initial=>{const i=cursor++;return slots[i]??=( {current:initial} );},useState:initial=>{const i=cursor++;slots[i]??={value:initial};return [slots[i].value,value=>{slots[i].value=value;}];},useEffect:(fn,deps)=>{const i=cursor++;const last=slots[i];if(!last||deps.some((v,j)=>v!==last[j])){slots[i]=deps;effects.push(fn);}}};
 const Animated={Value,ValueXY,View:'AnimatedView',timing:(value,config)=>({start:done=>{animations.push({value,config,done});}}),spring:(value,config)=>({start:()=>{animations.push({value,config});}}),parallel:items=>({start:()=>items.forEach(a=>a.start())})};
 const overlay=compile('../components/TouchIndicatorOverlay.tsx',{react:hooks,'react-native':{Animated,View:'View',Platform:{OS:platform},StyleSheet:{create:s=>s}},'../lib/demoTouches':{useDemoTouches:selector=>selector({enabled}),loadDemoTouches:async()=>{}}},{Date:{now:()=>now}}).TouchIndicatorOverlay;
 const child={type:'App',props:{},children:[]};
 function render(){cursor=0;renders++;const result=overlay({children:child});while(effects.length)effects.shift()();return result;}
 return {render,child,animations,setEnabled:value=>{enabled=value;},get renders(){return renders;},tick:ms=>{now+=ms;},finishAnimations:()=>{for(const a of animations.splice(0))a.done?.({finished:true});}};
}
const touch=(identifier,pageX,pageY)=>({identifier,pageX,pageY});
const event=(touches,changedTouches=touches)=>({nativeEvent:{touches,changedTouches}});
test('disabled overlay draws nothing and touch handling never claims the responder',()=>{
 const h=harness();let tree=h.render();tree.props.onTouchStart(event([touch(1,50,80)]));tree=h.render();
 assert.equal(tree.children[0],h.child);assert(!nodes(tree).some(n=>n.type==='AnimatedView'));assert.equal(h.animations.length,0);
 assert(!Object.keys(tree.props).some(k=>/Responder|Capture/.test(k)));
});
test('multitouch follows page coordinates without renders on move and fades at release',()=>{
 const h=harness();h.setEnabled(true);let tree=h.render();tree.props.ref.current={measureInWindow:callback=>callback(0,24)};tree.props.onLayout();
 tree.props.onTouchStart(event([touch(1,50,80),touch(2,100,120)]));tree=h.render();
 assert.equal(nodes(tree).filter(n=>n.type==='AnimatedView'&&n.props.style[0].width===44).length,2);
 const count=h.renders;tree.props.onTouchMove(event([touch(1,70,100),touch(2,110,130)]));assert.equal(h.renders,count);
 tree=h.render();const first=nodes(tree).find(n=>n.type==='AnimatedView');assert.equal(first.props.style[1].transform[0].translateX,48);assert.equal(first.props.style[1].transform[1].translateY,54);
 assert(nodes(tree).some(n=>n.props.pointerEvents==='none'));
 const ripple=nodes(tree).find(n=>n.type==='AnimatedView'&&n.props.style[1]?.backgroundColor==='transparent');
 assert.equal(ripple.props.style[2].opacity.config.outputRange[0],0);
 tree.props.onTouchEnd(event([touch(2,110,130)],[touch(1,70,100)]));
 assert(h.animations.some(a=>a.config.duration===250&&a.config.toValue===0));assert(h.animations.every(a=>a.config.useNativeDriver===true));
 h.finishAnimations();tree=h.render();assert.equal(nodes(tree).filter(n=>n.type==='AnimatedView'&&n.props.style[0].width===44).length,1);
 tree.props.onTouchCancel(event([],[touch(2,110,130)]));h.finishAnimations();assert(!nodes(h.render()).some(n=>n.type==='AnimatedView'));
});
test('short taps ripple, cancellation does not, disabling removes all marks',()=>{
 const h=harness();h.setEnabled(true);let tree=h.render();tree.props.onTouchStart(event([touch(1,30,40)]));h.tick(80);tree.props.onTouchEnd(event([],[touch(1,30,40)]));
 assert(h.animations.some(a=>a.config.duration===250&&a.config.toValue===1));h.finishAnimations();
 tree=h.render();tree.props.onTouchStart(event([touch(2,30,40)]));const count=h.animations.length;tree.props.onTouchCancel(event([],[touch(2,30,40)]));
 assert(!h.animations.slice(count).some(a=>a.config.duration===250&&a.config.toValue===1));
 h.setEnabled(false);h.render();assert(!nodes(h.render()).some(n=>n.type==='AnimatedView'));
});
test('web mouse hover stays empty, pressed mouse follows and release fades',()=>{
 const h=harness('web');h.setEnabled(true);let tree=h.render();const mouse={nativeEvent:{button:0,buttons:1,pageX:45,pageY:60}};
 tree.props.onMouseMove(mouse);assert.equal(h.animations.length,0);
 tree.props.onMouseDown(mouse);tree=h.render();assert(nodes(tree).some(n=>n.type==='AnimatedView'));
 tree.props.onMouseUp(mouse);h.finishAnimations();assert(!nodes(h.render()).some(n=>n.type==='AnimatedView'));
});
test('modal wrapper preserves native props and overlays inside every app modal',()=>{
 const {DemoModal}=compile('../components/DemoModal.tsx',{'react-native':{Modal:'NativeModal'},'./TouchIndicatorOverlay':{TouchIndicatorOverlay:'Overlay'}});
 const child={type:'Sheet'};const close=()=>{};const tree=DemoModal({visible:true,transparent:true,onRequestClose:close,children:child});
 assert.equal(tree.type,'NativeModal');assert.equal(tree.props.onRequestClose,close);assert.equal(tree.children[0].type,'Overlay');assert.equal(tree.children[0].children[0],child);
 function walk(url){return readdirSync(url,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(new URL(e.name+'/',url)):e.name.endsWith('.tsx')?[new URL(e.name,url)]:[]);}
 for(const file of walk(new URL('../',import.meta.url))){if(file.pathname.endsWith('/DemoModal.tsx'))continue;assert(!/<Modal[\s>]/.test(readFileSync(file,'utf8')),file.pathname);}
});
