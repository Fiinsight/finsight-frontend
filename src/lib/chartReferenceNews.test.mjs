import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('post-close references have a separate label and remain readable', () => {
  const exports = {}; let opened;
  const React = { createElement: (type, props, ...children) => ({type,props,children}), useState: value => [value, () => {}] };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../screens/chart/ChartScreen/RelatedNewsList.tsx',import.meta.url),'utf8'), { compilerOptions: { module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React } }).outputText, {
    exports, React, require: name => name==='react' ? React : name==='react-native' ? {View:'View',Text:'Text',TouchableOpacity:'Button',StyleSheet:{create:s=>s}} : { toRelativeTimeKorean: () => '방금' }
  });
  const cause={id:'1',title:'장중 원인 후보',source:'매체',publishedAt:'2026-10-12T05:00:00Z',relationType:'DIRECT'};
  const reference={...cause,id:'2',title:'장 마감 해설',relationType:'REFERENCE'};
  const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node==='object' ? [node,...visit(node.children)] : [];
  const nodes=visit(exports.RelatedNewsList({items:[cause,reference],onPress:item=>{opened=item;}}));
  const text=nodes.filter(n=>n.type==='Text').flatMap(n=>n.children);
  assert(text.includes('장 마감 후 참고 기사'));
  assert(text.includes('움직임 이후에 나온 기사예요. 원인 후보와 구분해서 읽어주세요.'));
  assert.equal(nodes.filter(n=>n.type==='Button').length,2);
  const referenceButton=nodes.find(n=>n.type==='Button' && visit(n).some(c=>c.type==='Text' && c.children.includes('장 마감 해설')));
  referenceButton.props.onPress(); assert.equal(opened.id,'2');
});
