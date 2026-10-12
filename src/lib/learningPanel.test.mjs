import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function render(correct) {
  const create = (type, props) => ({ type, props, children: props?.children });
  const Value = class { setValue() {} };
  let reset = false;
  const exports = {};
  const source = readFileSync(new URL('../screens/home/NewsDetailScreen/LearningPanel.tsx', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: name => name === 'react/jsx-runtime' ? { jsx: create, jsxs: create, Fragment: 'Fragment' }
      : name === 'react' ? { useRef: value => ({ current: value }), useState: () => [1, () => {}] }
      : name === 'react-native' ? { Animated: { Value, View: 'AnimatedView' }, Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: s => s } }
      : name === '@tanstack/react-query' ? {
        useQueryClient: () => ({}), useQuery: () => ({ data: { mode: 'RULE_FALLBACK', glossary: [], summary: '', question: { prompt: '질문', options: ['정답', '오답', '다른 오답'] } } }),
        useMutation: () => ({ data: { correct, correctIndex: correct ? 1 : 0, definition: '정의', message: '저장' }, reset: () => { reset = true; } })
      } : {}
  });
  const tree = exports.LearningPanel({ newsId: 1, level: 'normal', onTermPress() {} });
  const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === 'object' ? [node, ...visit(node.children)] : [];
  return { nodes: visit(tree), reset: () => reset };
}

test('quiz locks answered options and marks chosen right/wrong plus the correct option', () => {
  for (const correct of [true, false]) {
    const rendered = render(correct);
    const buttons = rendered.nodes.filter(n => n.type === 'Pressable');
    assert.equal(buttons.length, 4);
    assert(buttons.slice(0,3).every(n => n.props.disabled));
    const backgrounds = buttons.slice(0,3).map(n => n.props.style.filter(Boolean).at(-1).backgroundColor);
    assert.equal(backgrounds[correct ? 1 : 0], '#DCFCE7');
    if (!correct) assert.equal(backgrounds[1], '#FEE2E2');
    const labels = rendered.nodes.filter(n => n.type === 'Text').flatMap(n => n.children ?? []);
    assert(labels.includes(' ✓'));
    if (!correct) assert(labels.includes(' ✕'));
    assert(labels.includes('오늘의 퀴즈'));
    buttons[3].props.onPress();
    assert(rendered.reset());
  }
});
