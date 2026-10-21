import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('settings start at question one, restore answers, and end with save', () => {
  const values = [];
  let slot = 0;
  const React = { createElement: (type, props, ...children) => ({ type, props, children }), useEffect() {}, useState(initial) {
    const index = slot++;
    if (!(index in values)) values[index] = initial;
    return [values[index], value => { values[index] = typeof value === 'function' ? value(values[index]) : value; }];
  }, useRef: value => ({ current: value }) };
  const source = readFileSync(new URL('../screens/onboarding/OnboardingScreen.tsx', import.meta.url), 'utf8');
  const exports = {};
  const native = { ScrollView: 'ScrollView', Pressable: 'Pressable', Text: 'Text', View: 'View', SafeAreaView: 'SafeAreaView', useWindowDimensions: () => ({ width: 375 }), StyleSheet: { create: value => value }, Animated: { Value: class { interpolate() { return 0; } }, View: 'View', Image: 'Image' } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText,
    { exports, React, require: name => name === 'react' ? React : name === 'react-native' ? native : {} });
  const answers = [{ questionId: 'experience', answer: '직접 투자하고 있어요' }];
  let closed = false;
  const render = () => { slot = 0; return exports.OnboardingScreen({ allowSkip: false, initialAnswers: answers, onComplete() {}, onClose: () => { closed = true; } }); };
  const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === 'object' ? [node, ...visit(node.children)] : [];
  let nodes = visit(render());
  assert.equal(values[0], 1);
  const scroll = nodes.find(node => node.type === 'ScrollView');
  assert.equal(scroll.props.contentContainerStyle.flexGrow, 1);
  assert.equal(scroll.props.contentContainerStyle.flex, undefined);
  const close = nodes.find(node => node.props?.accessibilityLabel === '학습 설정 닫기');
  assert(close.props.style.width >= 44 && close.props.style.height >= 44);
  const selected = nodes.filter(node => node.type === 'Pressable' && node.props.accessibilityState?.selected);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].props.accessibilityLabel, '직접 투자하고 있어요');
  nodes.find(node => node.props?.accessibilityLabel === '학습 설정 닫기').props.onPress();
  assert(closed);
  values[0] = 5;
  nodes = visit(render());
  assert(nodes.some(node => node.type === 'Text' && node.children.includes('저장')));
  assert(!nodes.some(node => node.type === 'Text' && node.children.includes('시작하기')));
});
