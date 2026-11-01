import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultNickname} from './nickname.ts';
test('email defaults use the local part within the API nickname bounds',()=>{
 assert.equal(defaultNickname(' subin@example.com '),'subin');
 assert.equal(defaultNickname('a@example.com'),'a님');
 assert.equal(defaultNickname(''),'사용자');
 assert.equal(defaultNickname('x'.repeat(40)+'@test.com').length,30);
});
