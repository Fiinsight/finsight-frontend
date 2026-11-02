import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { selectHomeNews, selectHomeNewsOverflow } from './watchlist.ts';
import { kstDate } from './historyRecords.ts';

const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.children)] : [];
const articles = (...ids) => ids.map(id => ({ id, title: `기사 ${id}` }));
const source = ts.transpileModule(fs.readFileSync(new URL('../screens/home/HomeScreen/NewsSection.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React }
}).outputText;
function mount({ data = articles(1, 2, 3), watchedNews = [], isLoading = false, isError = false, loadMore = async () => [] } = {}) {
  let values = [];
  const requests = [], exports = {};
  let cursor = 0, feedKey, now = new Date('2026-11-02T12:00:00+09:00');
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } }
  const React = {
    createElement(type, props, ...children) {
      if (typeof type !== 'function') return { type, props, children };
      if (feedKey !== props.key) { values = []; cursor = 0; feedKey = props.key; }
      return type(props);
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = initial;
      const storage = values;
      return [storage[index], next => { storage[index] = typeof next === 'function' ? next(storage[index]) : next; }];
    }
  };
  vm.runInNewContext(source, { exports, React, Date: Clock, require: name =>
    name === 'react' ? React :
    name === '@tanstack/react-query' ? { useQuery: () => ({ data, isLoading, isError }) } :
    name.endsWith('/api') ? { getMoreBriefing: async (page, size) => { requests.push([page, size]); return loadMore(page, size); } } :
    name.endsWith('/watchlist') ? { selectHomeNews, selectHomeNewsOverflow } :
    name.endsWith('/historyRecords') ? { kstDate } :
    name.endsWith('/NewsCard') ? { NewsCard: 'NewsCard' } :
    { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: value => value } }
  });
  const render = () => { cursor = 0; return nodes(exports.NewsSection({ watchedNews, onSelectNews() {} })); };
  const ids = () => render().filter(node => node.type === 'NewsCard').map(node => node.props.news.id);
  const button = () => render().find(node => node.type === 'Pressable' && nodes(node).some(n => n.type === 'Text' && ['뉴스 더 보기', '다시 시도', '불러오는 중…'].includes(n.children[0])));
  const click = async () => { button().props.onPress(); await new Promise(resolve => setImmediate(resolve)); };
  return { render, ids, button, click, requests, setData: next => { data = next; }, setDate: next => { now = new Date(next); } };
}

test('home initially shows only the three selectHomeNews articles, including watched news', () => {
  const ui = mount({ watchedNews: articles(8, 9) });
  assert.deepEqual(ui.ids(), [8, 1, 2]);
  assert(ui.button());
  assert.deepEqual(ui.requests, []);
});

test('more news appends pages without repeating visible watched news, core news or prior pages', async () => {
  const pages = [articles(8, 1, 10, 10, 11, 12, 13, 14, 15, 16), articles(10, 16, 17)];
  const ui = mount({ watchedNews: articles(8), loadMore: async page => pages[page] });
  await ui.click();
  assert.deepEqual(ui.ids(), [8, 1, 2, 3, 10, 11, 12, 13, 14, 15, 16]);
  assert(ui.button());
  await ui.click();
  assert.deepEqual(ui.ids(), [8, 1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17]);
  assert.deepEqual(ui.requests, [[0, 10], [1, 10]]);
  assert.equal(ui.button(), undefined);
});

test('empty and short final pages hide the more button based on the raw response count', async () => {
  for (const page of [[], articles(5, 6)]) {
    const ui = mount({ loadMore: async () => page });
    await ui.click();
    assert.deepEqual(ui.ids(), [1, 2, 3, ...page.map(item => item.id)]);
    assert.equal(ui.button(), undefined);
  }
});

test('loading disables the button, prevents another request, and failure retries the same page', async () => {
  let reject;
  const ui = mount({ loadMore: () => new Promise((_, fail) => { reject = fail; }) });
  await ui.click();
  assert.equal(ui.button().children[0].children[0], '불러오는 중…');
  assert.equal(ui.button().props.disabled, true);
  await ui.click();
  assert.equal(ui.requests.length, 1);
  reject(new Error('offline'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ui.button().children[0].children[0], '다시 시도');
  assert.equal(ui.button().props.disabled, false);
  assert.deepEqual(ui.ids(), [1, 2, 3]);
  await ui.click();
  assert.deepEqual(ui.requests, [[0, 10], [0, 10]]);
  reject(new Error('offline'));
  await new Promise(resolve => setImmediate(resolve));
});

test('no more button when the initial briefing is loading, empty or failed, even with watched news', () => {
  for (const state of [{ data: [], isLoading: true }, { data: [] }, { data: undefined, isError: true }, { data: articles(1, 2, 3), isError: true }]) {
    const ui = mount({ ...state, watchedNews: articles(9) });
    assert.equal(ui.button(), undefined);
  }
});


test('overflow restores the hidden third core story before the remaining watched stories, once per id', () => {
  assert.deepEqual(selectHomeNewsOverflow(articles(1, 2, 3), articles(8, 9, 3, 9)).map(item => item.id), [3, 9]);
  assert.deepEqual(selectHomeNewsOverflow(articles(1, 2, 3), []).map(item => item.id), []);
});

test('first more click restores hidden core and watched stories before the server page', async () => {
  const ui = mount({ watchedNews: articles(8, 9), loadMore: async () => articles(3, 9, 10) });
  assert.deepEqual(ui.ids(), [8, 1, 2]);
  await ui.click();
  assert.deepEqual(ui.ids(), [8, 1, 2, 3, 9, 10]);
  assert.deepEqual(ui.requests, [[0, 10]]);
});

test('without watched news the first page still appends directly after the original three', async () => {
  const ui = mount({ loadMore: async () => articles(4, 5) });
  assert.deepEqual(ui.ids(), [1, 2, 3]);
  await ui.click();
  assert.deepEqual(ui.ids(), [1, 2, 3, 4, 5]);
});

test('changed core ids reset loaded stories, final-page state and page number; identical ids preserve them', async () => {
  const ui = mount({ loadMore: async () => articles(10) });
  await ui.click();
  assert.equal(ui.button(), undefined);
  ui.setData(articles(1, 2, 3));
  assert.deepEqual(ui.ids(), [1, 2, 3, 10]);
  ui.setData(articles(4, 5, 6));
  assert.deepEqual(ui.ids(), [4, 5, 6]);
  assert(ui.button());
  await ui.click();
  assert.deepEqual(ui.requests, [[0, 10], [0, 10]]);
});

test('Korea midnight resets pagination even when the briefing ids have not changed', async () => {
  const ui = mount({ loadMore: async () => articles(10) });
  ui.setDate('2026-11-02T23:59:00+09:00');
  await ui.click();
  ui.setDate('2026-11-03T00:00:00+09:00');
  assert.deepEqual(ui.ids(), [1, 2, 3]);
  assert(ui.button());
  await ui.click();
  assert.deepEqual(ui.requests, [[0, 10], [0, 10]]);
});

test('an old pending page cannot appear after the briefing changes', async () => {
  let finish;
  const ui = mount({ loadMore: () => new Promise(resolve => { finish = resolve; }) });
  await ui.click();
  const finishOldPage = finish;
  ui.setData(articles(4, 5, 6));
  assert.deepEqual(ui.ids(), [4, 5, 6]);
  // A state setter from an unmounted feed must not update the replacement feed.
  finishOldPage(articles(99));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(ui.ids(), [4, 5, 6]);
  assert.equal(ui.button().props.disabled, false);
});
