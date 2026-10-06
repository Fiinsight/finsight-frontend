import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function compile(path, context) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true }
  }).outputText, { exports, ...context });
  return exports;
}
const visit = (node) => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === 'object' ? [node, ...visit(node.children)] : [];

test('reading panel shows provenance and sends the selected answer to server grading', async () => {
  let mutation, invalidated, submitted;
  const react = { createElement: (type, props, ...children) => ({ type, props, children }) };
  const exports = compile('../screens/home/NewsDetailScreen/LearningPanel.tsx', { React: react, require: (name) =>
    name === '@tanstack/react-query' ? {
      useQuery: () => ({ data: { mode: 'RULE_FALLBACK', summary: '12.5% 증가했다.', glossary: [], question: { term: '환율', prompt: '정의는?', options: ['정의1', '정의2'] } } }),
      useQueryClient: () => ({ invalidateQueries: (value) => { invalidated = value; } }),
      useMutation: (options) => { mutation = options; return { mutate: (index) => { submitted = index; }, data: { correct: false, definition: '통화 교환 비율', message: '복습 저장' } }; }
    } : name === 'react-native' ? { Text: 'Text', View: 'View', Pressable: 'Pressable', StyleSheet: { create: (s) => s } }
      : name.endsWith('/api') ? { answerLearningQuestion: (...args) => args } : { ArticleBody: 'ArticleBody' }
  });
  const tree = visit(exports.LearningPanel({ newsId: 115, level: 'analyst', onTermPress() {} }));
  const texts = tree.filter((n) => n.type === 'Text').flatMap((n) => n.children).join(' ');
  assert.doesNotMatch(texts, /fallback|무료 규칙 기반/);
  assert.match(texts, /기사에 추가된 사실이 아닙니다/);
  assert.match(texts, /다시 살펴볼까요/);
  tree.find((n) => n.type === 'Pressable').props.onPress();
  assert.equal(submitted, 0);
  assert.deepEqual(Array.from(await mutation.mutationFn(1)), [115, 'analyst', '환율', 1]);
  mutation.onSuccess();
  assert.equal(invalidated.queryKey[0], 'learning-reviews');
});

test('only rejection of the current token expires a session, never network failures or stale requests', async () => {
  const auth = compile('./auth.ts', { require: () => ({ storageSetItem: async () => {}, storageGetItem: async () => null }) });
  let expired = 0;
  auth.setAuthFailureHandler(() => { expired++; });
  await auth.saveAuthSession({ accessToken: 'current' });
  auth.notifyAuthFailure(503, 'Bearer current');
  auth.notifyAuthFailure(undefined, 'Bearer current');
  auth.notifyAuthFailure(403, 'Bearer old');
  assert.equal(expired, 0);
  assert.equal(auth.getActiveAccessToken(), 'current');
  auth.notifyAuthFailure(403, 'Bearer current');
  auth.notifyAuthFailure(403, 'Bearer current');
  assert.equal(expired, 1);
  assert.equal(auth.getActiveAccessToken(), null);
});

test('learning focus callbacks run without invoking hooks inside an effect', () => {
  const effects = [];
  let inEffect = false;
  const hook = (value) => { assert.equal(inEffect, false, 'hook called inside focus callback'); return value; };
  const react = { createElement: () => null, useState: (value) => hook([value, () => {}]), useCallback: (fn) => hook(fn) };
  const screen = compile('../screens/learn/LearnScreen/index.tsx', { React: react, require: (name) => {
    if (name === 'react') return react;
    if (name === 'react-native') return { StyleSheet: { create: (s) => s } };
    if (name === '@react-navigation/native') return { useNavigation: () => hook({}), useFocusEffect: (fn) => { hook(null); effects.push(fn); } };
    if (name === '@tanstack/react-query') return { useQuery: () => hook({}) };
    if (name.endsWith('/auth')) return { loadAuthSession: async () => null };
    if (name.endsWith('/api')) return { getLearningPreferences: async () => ({}) };
    if (name.endsWith('/onboarding')) return { getDefaultLearningPreferences: () => ({}) };
    return {};
  } });
  screen.LearnScreen();
  inEffect = true;
  for (const effect of effects) effect();
});

test('profile updates reading level only after successful server persistence', async () => {
  const values = ['analyst', true, false, ''];
  let cursor = 0, fail = true, requested;
  const react = { createElement: (type, props, ...children) => ({ type, props, children }), useEffect() {}, useState: (initial) => {
    const index = cursor++;
    return [values[index] ?? initial, (value) => { values[index] = value; }];
  } };
  const screen = compile('../screens/profile/ProfileScreen/index.tsx', { React: react, require: (name) => {
    if (name === 'react') return react;
    if (name === 'react-native') return { Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: (s) => s } };
    if (name.endsWith('/onboarding')) return { getDefaultLearningPreferences: () => ({ level: 'analyst' }) };
    if (name.endsWith('/api')) return { setDefaultReadingLevel: async (level) => { requested = level; if (fail) throw new Error('offline'); } };
    return {};
  } });
  const render = () => { cursor = 0; return visit(screen.ProfileScreen({ session: {}, onLogout() {} })); };
  render().find((node) => node.type === 'Pressable').props.onPress();
  await new Promise(setImmediate);
  assert.equal(requested, 'beginner');
  assert.equal(values[0], 'analyst');
  assert.match(values[3], /저장하지 못했습니다/);
  fail = false;
  render().find((node) => node.type === 'Pressable').props.onPress();
  await new Promise(setImmediate);
  assert.equal(values[0], 'beginner');
  assert.equal(values[1], false);
  assert.match(values[3], /저장했어요/);
});
