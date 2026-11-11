import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { QueryClient } from '@tanstack/react-query';

test('judgement remount reuses preferences and invalidation reloads them', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: 0, gcTime: Infinity } } });
  let calls = 0;
  const hooks = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: value => [value, () => {}], useEffect: effect => { effect(); }
  };
  const store = { judgementDraftByNewsId: {}, readingLevelByNewsId: {} };
  const exports = {};
  const source = fs.readFileSync(process.env.FINSIGHT_QA_JUDGEMENT_SOURCE
    ?? new URL('../screens/home/JudgementScreen/index.tsx', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true
  }}).outputText, { exports, React: hooks, require: name =>
    name === 'react' ? hooks : name === 'react-native' ? { Platform: { OS: 'web' }, StyleSheet: { create: s => s } }
    : name === '@tanstack/react-query' ? { useQueryClient: () => client,
      useQuery: ({ queryKey }) => ({ data: queryKey[0] === 'judgement-existing' ? null : undefined }), useMutation: () => ({}) }
    : name.endsWith('/useAppStore') ? { useAppStore: select => select(store) }
    : name.endsWith('/auth') ? { loadAuthSession: async () => ({ userId: 1 }) } : name.endsWith('/api') ? { getLearningPreferences: async () => { calls++; return { painPoint: 'terms', level: 'normal' }; } } : {} });
  const render = () => exports.JudgementScreen({ route: { params: { newsId: 42 } }, navigation: {} });
  try {
    render(); render();
    await new Promise(resolve => setImmediate(resolve));
    render();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls, 1);
    await client.invalidateQueries({ queryKey: ['learning-preferences'] });
    render();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls, 2);
  } finally { client.clear(); }
});
