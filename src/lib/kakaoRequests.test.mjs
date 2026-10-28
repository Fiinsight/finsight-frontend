import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('Kakao preparation, connectivity and one-use exchange have dedicated bounded request deadlines',async()=>{
 const source=fs.readFileSync(new URL('./api.ts',import.meta.url),'utf8');
 const code=source.slice(source.indexOf('export async function getKakaoLoginUrl'),source.indexOf('export async function syncOnboardingProfile'));
 const calls=[],exports={};
 const api={get:async(path,options)=>{calls.push({method:'get',path,options});return{data:{authorizationUrl:'fixture-url'}}},post:async(path,data,options)=>{calls.push({method:'post',path,options});return{data:{accessToken:'fixture-only'}}}};
 vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,api});
 assert.equal(await exports.getKakaoLoginUrl('exp://fixture/--/auth/kakao'),'fixture-url');
 await exports.getKakaoConnectionStatus();await exports.loginWithKakao('fixture-code');
 assert.equal(calls[0].options.timeout,30000);assert.equal(calls[1].options.timeout,15000);assert.equal(calls[2].options.timeout,45000);
 assert.equal(calls.filter(x=>x.method==='post').length,1);
});
