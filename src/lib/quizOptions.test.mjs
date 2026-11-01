import test from 'node:test';import assert from 'node:assert/strict';
import {reshuffleQuizOptions} from './quizOptions.ts';
test('retry changes displayed order while preserving original server answer indices',()=>{
 const first=reshuffleQuizOptions(3,[0,1,2],()=>.99);
 assert.notDeepEqual(first,[0,1,2]);assert.deepEqual([...first].sort(),[0,1,2]);
 const next=reshuffleQuizOptions(3,first,()=>.99);assert.notDeepEqual(next,first);
});
