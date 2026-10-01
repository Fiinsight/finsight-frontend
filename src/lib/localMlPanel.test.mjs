import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Render the actual panel with a completed search; no native runtime is needed.
function render(kind, id, onNewsPress) {
  let slot = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: () => [slot++ === 0 ? { results: [{ id, title: '기사', evidence: '발췌', score: 1 }] } : false, () => {}],
    useEffect: () => {}
  };
  const exports = {};
  const source = readFileSync(new URL('../localml/LocalMlPanel.tsx', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true
  } }).outputText, { exports, require: (name) => name === 'react' ? react : {
    Button: 'Button', Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: (s) => s }
  } });
  const tree = exports.LocalMlPanel({ request: { kind, query: '기사' }, search: async () => {}, onNewsPress });
  const visit = (node) => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === 'object'
    ? [node, ...visit(node.children)] : [];
  return visit(tree).filter((node) => node.type === 'Pressable');
}

test('only news rows with a safe news id invoke detail navigation', () => {
  const opened = [];
  const press = (id) => opened.push(id);
  const rows = render('news', '42', press);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].props.accessibilityRole, 'button');
  rows[0].props.onPress();
  assert.deepEqual(opened, [42]);
  for (const kind of ['term', 'case']) assert.equal(render(kind, '42', press).length, 0);
  for (const id of ['', '0', '-1', '1.5', 'abc', '9007199254740992']) assert.equal(render('news', id, press).length, 0);
  assert.equal(render('news', '42').length, 0);
});

test('onboarding fallback belongs to the signed-in account; pending answers need explicit adoption', async () => {
  let profile = { userId: 1, answers: [], completedAt: '2026-10-01' };
  let session = { userId: 2 };
  const exports = {};
  const source = readFileSync(new URL('./onboarding.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: (name) => name === './auth' ? { loadAuthSession: async () => session }
      : name === './storage' ? { storageGetItem: async () => JSON.stringify(profile), storageSetItem: async () => {}, storageRemoveItem: async () => {} }
      : {} });
  assert.equal(await exports.loadOnboardingProfile(), null);
  session = { userId: 1 };
  assert.equal((await exports.loadOnboardingProfile()).userId, 1);
  delete profile.userId;
  assert.equal(await exports.loadOnboardingProfile(), null);
  assert.ok(await exports.loadOnboardingProfile(true));
  session = null;
  profile.userId = 1;
  assert.equal(await exports.loadOnboardingProfile(), null);
});

test('similar news pushes and pops correctly in every stack that registers NewsDetail', async () => {
  const { StackRouter, StackActions } = await import('@react-navigation/routers');
  for (const [file, entry] of [['HomeStack.tsx', 'Home'], ['ChartStack.tsx', 'Chart'], ['HistoryStack.tsx', 'History']]) {
    const source = readFileSync(new URL(`../navigation/${file}`, import.meta.url), 'utf8');
    const names = [...source.matchAll(/<Stack.Screen name="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(names.includes('NewsDetail'));
    const options = { routeNames: names, routeParamList: {}, routeGetIdList: {} };
    const router = StackRouter({ initialRouteName: entry });
    let state = router.getInitialState(options);
    state = router.getStateForAction(state, StackActions.push('NewsDetail', { newsId: 1 }), options);
    const opened = [];
    render('news', '42', (id) => {
      opened.push(id);
      state = router.getStateForAction(state, StackActions.push('NewsDetail', { newsId: id }), options);
    })[0].props.onPress();
    assert.equal(state.routes[state.index].params.newsId, 42);
    state = router.getStateForAction(state, StackActions.pop(1), options);
    assert.equal(state.routes[state.index].params.newsId, 1);
    state = router.getStateForAction(state, StackActions.pop(1), options);
    assert.equal(state.routes[state.index].name, entry);
  }
});

test('market fallback numbers stay hidden and line prices never become fabricated candles', async () => {
  let payload;
  const api = { get: async () => ({ data: payload }), interceptors: { request: { use() {} } } };
  const exports = {};
  const source = readFileSync(new URL('./api.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, esModuleInterop: true
  } }).outputText, { exports, process: { env: {} }, require: (name) =>
    name === 'axios' ? { create: () => api } : name === 'expo-constants' ? {} : name === 'expo' ? { getExpoGoProjectConfig: () => ({}) }
      : name === './format' ? { formatPercent: (n) => `${n}%` } : {} });
  payload = { kospi: { currentValue: 2650, changePercent: 0, fallback: true },
    usdKrwRate: { value: 1300, changePercent: 1, fallback: false } };
  const market = await exports.getMarketSummary();
  assert.equal(market.kospi.value, '확인할 수 없음');
  assert.equal(market.kospi.change, 'fallback');
  assert.equal(market.exchangeRate.value, '1300');
  assert.equal(market.baseRate.value, '확인할 수 없음');
  payload = { fallback: false, price: 100, changePercent: 1, points: [{ date: '2026-10-01', value: 100 }] };
  assert.equal((await exports.getChartData('TEST')).candles.length, 0);
  payload = { fallback: true, points: [{ date: '2026-10-01', value: 100 }] };
  await assert.rejects(exports.getChartData('TEST'), /fallback/);
});
