import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const react = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useMemo: (fn) => fn()
};
let queries;
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../screens/history/JudgementDetailScreen.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true }
}).outputText, { exports, React: react, require: (name) => name === 'react' ? react
  : name === '@tanstack/react-query' ? { useQuery: () => queries.shift() }
  : name === 'react-native' ? { SafeAreaView: 'SafeAreaView', ScrollView: 'ScrollView', Text: 'Text', View: 'View', TouchableOpacity: 'TouchableOpacity', StyleSheet: { create: (s) => s } }
  : { MiniLineChart: 'MiniLineChart' } });
const candles = [{ date: '2026-09-30', close: 100 }, { date: '2026-10-01', close: 101 }];
const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.children)] : [];
function render(chart, judgedAt = '2026-10-01T01:00:00Z', news = { data: { relatedSymbol: '005930' } }) {
  queries = [news, chart];
  return nodes(exports.JudgementDetailScreen({ route: { params: { item: { judgedAt, newsId: 115, reasons: [], feedbackText: '저장된 피드백' } } }, navigation: {} }));
}
const text = (tree) => tree.filter((n) => n.type === 'Text').flatMap((n) => n.children).join(' ');

test('actual judgement screen distinguishes waiting, successful chart, fallback and fetch failure', () => {
  const waiting = render({ data: { candles } });
  assert.match(text(waiting), /비교할 데이터가 부족/);
  assert.equal(waiting.some((n) => n.type === 'MiniLineChart'), false);
  const ready = render({ data: { candles } }, '2026-09-30T01:00:00Z');
  assert.equal(ready.some((n) => n.type === 'MiniLineChart'), true);
  assert.equal(exports.chartWindow([candles[1]], '2026-10-01T01:00:00Z').waiting, true);
  assert.equal(exports.chartWindow(candles, 'invalid'), null);
  assert.equal(exports.chartWindow(candles, '2026-08-01T00:00:00Z'), null);
  // KST midnight, rather than UTC date, controls the comparison day.
  assert.equal(exports.chartWindow(candles, '2026-09-30T16:00:00Z').waiting, true);
  let retries = 0;
  const failed = render({ isError: true, error: new Error('timeout'), refetch: () => { retries++; } });
  assert.match(text(failed), /조회에 실패/);
  assert.doesNotMatch(text(failed), /데이터가 부족/);
  failed.find((n) => n.props?.accessibilityRole === 'button').props.onPress();
  assert.equal(retries, 1);
  assert.match(text(render({ isError: true, error: { name: 'ChartFallbackError' } })), /시세 데이터가 없습니다/);
  assert.match(text(render({}, undefined, { isError: true })), /조회에 실패/);
});
