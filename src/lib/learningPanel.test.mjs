import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function render(correct, mode = 'EXCERPT', hasQuestion = true) {
  const create = (type, props) => ({ type, props, children: props?.children });
  const Value = class { setValue() {} };
  let reset = false, reviewOpened = false;
  const exports = {};
  const source = readFileSync(new URL('../screens/home/NewsDetailScreen/LearningPanel.tsx', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: name => name === 'react/jsx-runtime' ? { jsx: create, jsxs: create, Fragment: 'Fragment' }
      : name === 'react' ? { useRef: value => ({ current: value }), useState: () => [1, () => {}] }
      : name === 'react-native' ? { Animated: { Value, View: 'AnimatedView' }, Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: s => s } }
      : name === '@tanstack/react-query' ? {
        useQueryClient: () => ({}), useQuery: () => ({ data: { mode, glossary: [], summary: '', question: hasQuestion ? { term: '금리', prompt: '질문', options: ['정답', '오답', '다른 오답'] } : null } }),
        useMutation: () => ({ data: { correct, definition: correct ? '오답' : '정답', message: '이 개념의 숙련도 추정에 반영했어요', termDefinition: '돈을 빌릴 때 내는 이자의 비율이에요' }, reset: () => { reset = true; } })
      } : {}
  });
  const tree = exports.LearningPanel({ newsId: 1, level: 'normal', onTermPress() {}, onReviewPress() { reviewOpened = true; } });
  const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === 'object' ? [node, ...visit(node.children)] : [];
  return { nodes: visit(tree), reset: () => reset, reviewOpened: () => reviewOpened };
}

test('quiz locks answered options and marks chosen right/wrong plus the correct option', () => {
  for (const correct of [true, false]) {
    const rendered = render(correct);
    const buttons = rendered.nodes.filter(n => n.type === 'Pressable');
    assert.equal(buttons.length, correct ? 3 : 5);
    assert(buttons.slice(0,3).every(n => n.props.disabled));
    const backgrounds = buttons.slice(0,3).map(n => n.props.style.filter(Boolean).at(-1).backgroundColor);
    assert.equal(backgrounds[correct ? 1 : 0], '#DCFCE7');
    if (!correct) assert.equal(backgrounds[1], '#FEE2E2');
    const labels = rendered.nodes.filter(n => n.type === 'Text').flatMap(n => n.children ?? []);
    assert(labels.includes(' ✓'));
    if (!correct) assert(labels.includes(' ✕'));
    assert(labels.includes('오늘의 퀴즈'));
    assert(!labels.includes('이 개념의 숙련도 추정에 반영했어요')); assert(labels.includes('돈을 빌릴 때 내는 이자의 비율이에요'));
    assert(labels.includes(correct ? '정답이에요!' : '아쉬워요'));
    if (!correct) {
      assert(labels.includes("'금리'를 다시 볼 개념에 담았어요 · 학습 탭에서 보기 →"));
      buttons[3].props.onPress(); assert(rendered.reviewOpened());
      buttons[4].props.onPress(); assert(rendered.reset());
    } else { assert(!labels.includes('다시 풀기')); }
  }
});

test('excerpt disclosure is visible only for excerpts', () => {
  const labels = mode => render(true, mode).nodes.filter(node => node.type === 'Text').flatMap(node => node.children ?? []);
  assert(labels('EXCERPT').includes('원문에서 핵심 문장을 골라 보여드려요'));
  assert(!labels('REWRITTEN').includes('원문에서 핵심 문장을 골라 보여드려요'));
  assert(labels('REWRITTEN').includes('핵심 사실과 비교 기준을 확인해보세요.'));
});

test('an article without an eligible concept explains the absent quiz', () => {
  const labels=render(true,'EXCERPT',false).nodes.filter(node=>node.type==='Text').flatMap(node=>node.children ?? []);
  assert(labels.includes('이 기사는 퀴즈로 낼 개념이 없어요'));
  assert(!labels.includes('오늘의 퀴즈'));
});
