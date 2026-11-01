import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.children)] : [];
function render(level, reasons, mode = 'level', selected = []) {
  const exports = {};
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useRef: value => ({ current: value }), useEffect() {},
    useState: value => [typeof value === 'boolean' ? true : value, () => {}]
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../screens/home/NewsDetailScreen/index.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true }
  }).outputText, { exports, React: react, require(name) {
    if (name === 'react') return react;
    if (name === 'react-native') return { SafeAreaView: 'SafeAreaView', ScrollView: 'ScrollView', Text: 'Text', View: 'View', Pressable: 'Pressable', StyleSheet: { create: x => x } };
    if (name === '@react-navigation/native') return { useIsFocused: () => true };
    if (name === '@tanstack/react-query') return { useQueryClient: () => ({}), useQuery: () => ({ data: { id: 1, title: '기사', rawContent: '매출 2% 증가', importanceReason: '이전 투자 포인트', importanceReasons: reasons } }) };
    if (name.endsWith('/useAppStore')) return { useAppStore: selector => selector({ readingLevelByNewsId: {}, setReadingLevel: (id, value) => selected.push([id, value]) }) };
    const component = name.split('/').at(-1);
    return { [component]: component };
  }});
  return nodes(exports.NewsDetailScreen({ route: { params: { newsId: 1, readingLevel: level, readMode: mode } }, navigation: { setParams: value => selected.push(value.readingLevel) } }));
}
test('investment point follows each reading tab and remains visible beside level content', () => {
  const reasons = { beginner: '초보 포인트', normal: '일반 포인트', analyst: '분석 포인트' };
  for (const level of Object.keys(reasons)) {
    assert.equal(render(level, reasons).find(n => n.type === 'ImportanceReasonCard').props.reason, reasons[level]);
  }
});
test('legacy and blank per-level reasons use the existing article investment point', () => {
  for (const reasons of [undefined, { beginner: '' }, { beginner: '  ' }]) {
    assert.equal(render('beginner', reasons, 'raw').find(n => n.type === 'ImportanceReasonCard').props.reason, '이전 투자 포인트');
  }
});

test('tab selection updates a reading level passed by navigation as well as the saved preference', () => {
  const selected = [];
  const tree = render('beginner', { beginner: '초보', analyst: '분석' }, 'level', selected);
  tree.find(n => n.type === 'LevelTabs').props.onChange('analyst');
  assert.deepEqual(selected, [[1, 'analyst'], 'analyst']);
});
