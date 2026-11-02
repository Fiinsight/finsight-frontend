import test from 'node:test';
import assert from 'node:assert/strict';
import {cachedNewsSearch} from './relatedNewsCache.ts';
test('same article shares in-flight and completed searches; refresh and private queries bypass',async()=>{
 let count=0;const search=async()=>({results:[],status:String(++count)});const request={kind:'news',query:'기사'};
 const a=cachedNewsSearch(search,request,42),b=cachedNewsSearch(search,request,42);
 assert.equal(a,b);await a;await cachedNewsSearch(search,request,42);assert.equal(count,1);
 await cachedNewsSearch(search,request,43);assert.equal(count,2);
 await cachedNewsSearch(search,request,42,true);assert.equal(count,3);
 await cachedNewsSearch(search,{kind:'case',query:'개인 기록'},42);await cachedNewsSearch(search,{kind:'case',query:'개인 기록'},42);assert.equal(count,5);
});
test('errors do not poison later article searches and entries expire',async()=>{
 let count=0;const search=async()=>{if(++count===1)throw Error('offline');return {results:[],status:'OK'};};const request={kind:'news',query:'기사'};
 await assert.rejects(cachedNewsSearch(search,request,1));await cachedNewsSearch(search,request,1);assert.equal(count,2);
 const now=Date.now;Date.now=()=>now()+301000;
 try{await cachedNewsSearch(search,request,1);assert.equal(count,3);}finally{Date.now=now;}
});
