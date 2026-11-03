import test from 'node:test';import assert from 'node:assert/strict';import {splitAroundTerms} from './text.ts';
test('terms allow Korean particles but reject noun substrings and only highlight once per paragraph',()=>{
 const text='금리는 유지됐다. 저금리와 금리인하는 다르다. 기준금리는 바뀌었다. 금리도 살폈다.';
 const parts=splitAroundTerms(text,['금리','기준금리']);
 assert.deepEqual(parts.filter(x=>x.isTerm).map(x=>x.text),['금리','기준금리']);
 assert.equal(parts.map(x=>x.text).join(''),text);
 assert.deepEqual(splitAroundTerms('PER은 개선됐다. per도 비교했다. SUPER는 제품명이다.',['PER']).filter(x=>x.isTerm).map(x=>x.text),['PER']);
 assert.deepEqual(splitAroundTerms('환율',['',' ']),[{text:'환율',isTerm:false}]);
});

import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import * as textHelpers from './text.ts';
test('highlighted terms expose a button, larger touch area, pointer and pressed feedback',()=>{
 let pressed=null,opened;const exports={};
 const React={createElement:(type,props,...children)=>({type,props,children}),useState:()=>[pressed,next=>{pressed=next;}]};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../screens/home/NewsDetailScreen/ArticleBody.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,React,require:n=>n==='react'?React:n==='react-native'?{Platform:{OS:'web'},StyleSheet:{create:s=>s},View:'View',Text:'Text',Pressable:'Pressable'}:n.endsWith('/text')?textHelpers:{articleParagraph:text=>({text})}});
 const visit=n=>Array.isArray(n)?n.flatMap(visit):n&&typeof n==='object'?[n,...visit(n.children)]:[];
 const tree=visit(exports.ArticleBody({text:'금리는 유지됐다. 금리는 중요하다.',terms:['금리'],onTermPress:term=>{opened=term;}}));
 const child=tree.find(n=>typeof n.type==='function');const render=()=>visit(child.type(child.props));
 let buttons=render().filter(n=>n.props?.accessibilityRole==='button');assert.equal(buttons.length,1);
 assert.equal(buttons[0].props.hitSlop,8);assert.equal(buttons[0].props.style({pressed:false})[0].cursor,'pointer');assert(buttons[0].props.style({pressed:false})[0].backgroundColor);
 assert(buttons[0].props.style({pressed:true})[1]);
 buttons[0].props.onPress();assert.equal(opened,'금리');assert.equal(pressed,null);
});
