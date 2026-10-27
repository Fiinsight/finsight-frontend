import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const React = { createElement: (type, props, ...children) => ({ type, props, children }) };
const nodes = n => Array.isArray(n) ? n.flatMap(nodes) : n && typeof n === 'object' ? [n, ...nodes(n.children)] : [];
const native = { Platform: { OS: 'web' }, Switch: 'Switch', Modal: 'Modal', Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: s => s } };
function compile(path, mocks) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, { exports, React, require: name => mocks[name] ?? {} });
 return exports;
}
const props = { level: 'beginner', onLogout() {}, onDeleteAccount() {}, onEditLevel() {}, onEditLearning() {}, onTerms() {}, onPrivacy() {} };

test('profile has exactly eight uniform icon rows without sections, separators, boxes or arrows', () => {
 const menu = compile('../screens/profile/ProfileScreen/SettingsList.tsx', { '@expo/vector-icons': { Ionicons: 'Icon' }, 'react-native': native });
 const tree = nodes(menu.SettingsList(props));
 const rows = tree.filter(n => n.type === 'Pressable');
 assert.deepEqual(rows.map(row => nodes(row).find(n => n.type === 'Text').children[0]), ['학습 설정', '읽기 수준 기본값', '알림 설정', '이용약관', '개인정보처리방침', '버전 정보', '로그아웃', '회원 탈퇴']);
 const icons = tree.filter(n => n.type === 'Icon');
 assert.deepEqual(icons.map(n => n.props.name), ['options-outline', 'school-outline', 'notifications-outline', 'document-text-outline', 'shield-checkmark-outline', 'information-circle-outline', 'log-out-outline', 'person-remove-outline']);
 assert(icons.every(n => n.props.size === 22 && n.props.color === '#667085'));
 assert(rows.every(n => n.props.style.height === 56 && n.props.style.gap === 16 && n.props.style.paddingHorizontal === 0));
 assert(rows.every(row => { const s = nodes(row).find(n => n.type === 'Text').props.style; return s.fontSize === 16 && s.color === '#101828' && s.fontWeight === '400'; }));
 assert.deepEqual(rows.filter(n => n.props.disabled).map(n => n.props.accessibilityLabel), ['알림 설정, 준비 중', '버전 정보, v0.1.0']);
 const values = tree.filter(n => n.type === 'Text' && n.props.style.fontSize === 14);
 assert.deepEqual(values.map(n => n.children[0]), ['초보자용', '준비 중', 'v0.1.0']);
 assert(values.every(n => n.props.style.color === '#667085'));
 assert.equal(tree.filter(n => n.type === 'View').length, 1);
 assert(tree.every(n => !n.props?.style?.backgroundColor && !n.props?.style?.borderWidth && !n.props?.style?.borderRadius));
 for (const level of ['normal', 'analyst']) assert(nodes(menu.SettingsList({ ...props, level })).some(n => n.props?.accessibilityLabel === `읽기 수준 기본값, ${level === 'normal' ? '일반용' : '분석용'}`));
});

test('native notification menu opens its sheet while web keeps preparation label', () => {
 const menu = compile('../screens/profile/ProfileScreen/SettingsList.tsx', { '@expo/vector-icons': { Ionicons: 'Icon' }, 'react-native': { ...native, Platform: { OS: 'ios' } } });
 let opened = false;
 const tree = nodes(menu.SettingsList({ ...props, onNotificationsPress() { opened = true; } }));
 const row = tree.find(n => n.props?.accessibilityLabel === '알림 설정, 꺼짐');
 assert.equal(row.props.accessibilityRole, 'button'); row.props.onPress(); assert(opened);
 assert(!tree.some(n => n.type === 'Switch'));
});

test('logout and deletion warnings appear only in confirmation sheets and require confirmation', async () => {
 let cursor = 0, loggedOut = 0, deleted = 0;
 const values = [];
 const hooks = { ...React, useEffect() {}, useState(initial) { const id = cursor++; values[id] ??= initial; return [values[id], value => { values[id] = value; }]; } };
 const screen = compile('../screens/profile/ProfileScreen/index.tsx', {
  react: hooks, 'react-native': native, '@tanstack/react-query': { useQueryClient: () => ({}) },
  '@react-navigation/native': { useNavigation: () => ({}), useRoute: () => ({ params: {} }) },
  '../../../lib/onboarding': { getDefaultLearningPreferences: () => ({ level: 'beginner' }) },
  '../../../lib/api': { deleteAccount: async () => { deleted++; } }, './SettingsList': { SettingsList: 'SettingsList' }
 });
 const render = () => { cursor = 0; return nodes(screen.ProfileScreen({ session: {}, onLogout() { loggedOut++; } })); };
 let tree = render();
 assert(!tree.some(n => n.type === 'Text' && n.children.includes('FinSight v0.1.0')));
 assert(tree.filter(n => n.type === 'Modal').every(n => !n.props.visible));
 tree.find(n => n.type === 'SettingsList').props.onLogout(); tree = render();
 assert(tree.some(n => n.type === 'Modal' && n.props.visible)); assert.equal(loggedOut, 0);
 tree.find(n => n.props?.accessibilityLabel === '로그아웃 취소').props.onPress();
 tree = render(); tree.find(n => n.type === 'SettingsList').props.onDeleteAccount(); tree = render();
 assert.equal(deleted, 0); tree.find(n => n.props?.accessibilityLabel === '탈퇴 다음 단계').props.onPress(); tree = render();
 assert(tree.some(n => n.type === 'Text' && n.children[0]?.includes('되돌릴 수 없습니다'))); assert.equal(deleted, 0);
 tree.find(n => n.props?.accessibilityLabel === '회원 탈퇴 최종 확인').props.onPress(); await new Promise(setImmediate);
 assert.equal(deleted, 1); assert.equal(loggedOut, 1);
});

test('app waits for Ionicons font loading before rendering icon screens', () => {
 let loaded = false, error = null, fontMap;
 let index;
 const hooks = { ...React, useEffect() {}, useState: initial => { const values = [false, false, false, { userId: 1 }, false, true]; return [values[index++] ?? initial, () => {}]; } };
 const font = { ionicons: 'bundled-ionicons.ttf' };
 const app = compile('../../App.tsx', {
  react: hooks, 'react-native': native, 'expo-linear-gradient': { LinearGradient: 'Gradient' },
  '@expo/vector-icons': { Ionicons: { font } }, 'expo-font': { useFonts(map) { fontMap = map; return [loaded, error]; } },
  '@tanstack/react-query': { QueryClient: class {}, QueryClientProvider: 'Provider' },
  '@react-navigation/native': { NavigationContainer: 'Navigation' }, './src/navigation/RootNavigator': { RootNavigator: 'Root' }
 });
 const render = () => { index = 0; return nodes(app.default()); };
 assert(!render().some(n => n.type === 'Root')); assert.equal(fontMap, font);
 error = new Error('font unavailable'); assert(render().some(n => n.props?.accessibilityRole === 'alert'));
 loaded = true; error = null; assert(render().some(n => n.type === 'Root'));
});

test('expired login notice and authentication form share a full-width native layout', () => {
 let index = 0;
 const values = [false, false, true, null, true, true];
 const app = compile('../../App.tsx', {
  react: {...React, useEffect() {}, useState: () => [values[index++], () => {}]},
  'react-native': native,
  'expo-font': {useFonts: () => [true, null]},
  '@expo/vector-icons': {Ionicons: {font: {}}},
  '@tanstack/react-query': {QueryClient: class {}},
  './src/screens/auth/AuthScreen': {AuthScreen: 'AuthScreen'}
 });
 const tree = app.default();
 assert.equal(tree.type, 'View');
 assert.equal(tree.props.style.flex, 1);
 assert.equal(tree.children[0].props.accessibilityRole, 'alert');
 assert.equal(tree.children[1].type, 'AuthScreen');
});
