import test from 'node:test';
import assert from 'node:assert/strict';
import {learningChecklist,LEARNING_TASK_GOALS,conceptReviewKey} from './learningChecklist.ts';
test('checklist uses actual progress, caps displayed values and requires explicit review',()=>{
 assert.deepEqual(LEARNING_TASK_GOALS,{read:1,quiz:3,review:1});
 assert.deepEqual(learningChecklist(0,2,false).map(t=>t.done),[false,false,false]);
 assert.deepEqual(learningChecklist(1,3,false).map(t=>t.done),[true,true,false]);
 assert(learningChecklist(9,8,true).every(t=>t.done));
 assert(learningChecklist(null,null,null).every(t=>!t.done&&t.count===null));
 assert.notEqual(conceptReviewKey(4),conceptReviewKey(27));
});
