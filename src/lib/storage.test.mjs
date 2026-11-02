import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function storage(os, localStorage) {
  const native = new Map();
  const exports = {};
  const source = fs.readFileSync(new URL('./storage.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true}}).outputText, {
    exports, window: {}, ...(localStorage ? {localStorage} : {}),
    require(name) {
      if (name === 'react-native') return {Platform: {OS: os}};
      if (name === '@react-native-async-storage/async-storage') return {
        getItem: async key => native.get(key) ?? null,
        setItem: async (key, value) => { native.set(key, value); },
        removeItem: async key => { native.delete(key); }
      };
      throw new Error(name);
    }
  });
  return {api: exports, native};
}

test('iOS with window and no localStorage persists and removes the login session natively', async () => {
  const {api, native} = storage('ios');
  await api.storageSetItem('finsight.auth', 'session');
  assert.equal(native.get('finsight.auth'), 'session');
  assert.equal(await api.storageGetItem('finsight.auth'), 'session');
  await api.storageRemoveItem('finsight.auth');
  assert.equal(await api.storageGetItem('finsight.auth'), null);
});

test('web persists in browser storage and reports unavailable storage', async () => {
  const browser = new Map();
  const {api, native} = storage('web', {
    getItem: key => browser.get(key) ?? null,
    setItem: (key, value) => browser.set(key, value),
    removeItem: key => browser.delete(key)
  });
  await api.storageSetItem('finsight.auth', 'session');
  assert.equal(browser.get('finsight.auth'), 'session');
  assert.equal(native.size, 0);
  assert.equal(await api.storageGetItem('finsight.auth'), 'session');
  await api.storageRemoveItem('finsight.auth');
  assert.equal(browser.size, 0);
  await assert.rejects(storage('web').api.storageSetItem('finsight.auth', 'session'), /브라우저 저장소/);
});
