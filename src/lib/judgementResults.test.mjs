import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as history from './historyRecords.ts';
const compile=file=>ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
function helpers(){const exports={};vm.runInNewContext(compile('./judgementResults.ts'),{exports,require:()=>history,Date,Intl});return exports;}
const helpersApi=helpers();
const record={id:1,newsId:10,newsTitle:'원문 기사',choice:'UP',reasonText:'원문 수치를 비교했어요',actualDirection:'UP',actualChangePercent:1.2,comparisonDate:'2026-10-13',feedbackGeneratedAt:'2026-10-13T07:00:00Z',feedbackText:'결과',reasons:[],correct:true,judgedAt:'2026-10-12T05:00:00Z',relatedSymbolName:'삼성전자'};
const React={createElement:(type,props,...children)=>({type,props,children}),useState:value=>[typeof value==="function"?value():value,()=>{}],useCallback:f=>f,useEffect(){}};
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):n&&typeof n==='object'?[n,...nodes(n.children)]:[];
const native={View:'View',Text:'Text',SafeAreaView:'SafeAreaView',ScrollView:'ScrollView',Pressable:'Pressable',TouchableOpacity:'TouchableOpacity',StyleSheet:{create:s=>s}};
test('unseen results exclude seen, pending, legacy and unavailable records',()=>{
 const list=[record,{...record,id:2,actualDirection:null},{...record,id:3,comparisonDate:null},{...record,id:4,actualDirection:'UNKNOWN'},{...record,id:5,actualChangePercent:null}];
 assert.deepEqual(Array.from(helpersApi.unreadJudgements(list,{}),r=>r.id),[1]);
 assert.equal(helpersApi.unreadJudgements(list,{'1':history.feedbackVersion(record)}).length,0);
 assert.equal(helpersApi.unreadJudgements([{...record,feedbackGeneratedAt:'2026-10-14T07:00:00Z'}],{'1':history.feedbackVersion(record)}).length,1);
});
test('banner uses real verdict and dates, delayed results never say they have arrived',()=>{
 assert.match(helpersApi.resultBannerMessage(record,new Date('2026-10-13T08:00:00Z')),/어제 판단한 삼성전자 결과가 나왔어요 · 정확한 판단이에요/);
 assert(!helpersApi.resultBannerMessage({...record,reasonText:''}).includes('정확한 판단'));
 assert.match(helpersApi.resultBannerMessage({...record,choice:'DOWN'}),/다르게 움직였어요/);
 assert.match(helpersApi.resultBannerMessage({...record,actualChangePercent:.7}),/변동이 작았어요/);
 const delayed={...record,actualDirection:null,expectedResultAt:'2026-10-13T06:40:00Z'};
 assert.equal(helpersApi.overdueJudgement([delayed],Date.parse('2026-10-13T06:39:59Z')),null);
 assert.equal(helpersApi.overdueJudgement([delayed],Date.parse('2026-10-13T06:40:00Z')).id,1);
 assert.equal(helpersApi.resultDateLabel('2026-02-30'),null);
});
test('home shows an unseen result or delayed notice and opens the actual history detail',()=>{
 let value={unseen:[record],pending:null,refresh(){}};const navigation=[];const exports={};
 vm.runInNewContext(compile('../screens/home/HomeScreen/index.tsx'),{exports,React,require:name=>name==='react'?React:name==='react-native'?native:name==='@react-navigation/native'?{useFocusEffect(){}}:name==='@tanstack/react-query'?{useQuery:()=>({data:[],isPending:false})}:name.endsWith('/JudgementResultsProvider')?{useJudgementResults:()=>value}:name.endsWith('/JudgementResultBanner')?{JudgementResultBanner:'Banner'}:name.endsWith('/learningPreferences')?{getDefaultLearningPreferences:()=>({})}:{HomeHeader:'HomeHeader',MarketPanel:'MarketPanel',NewsSection:'NewsSection'}});
 const render=()=>nodes(exports.HomeScreen({navigation:{getParent:()=>({navigate:(...args)=>navigation.push(args)})}}));
 let banner=render().find(n=>n.type==='Banner');assert(banner);assert.equal(banner.props.pending,false);banner.props.onPress();assert.equal(navigation[0][0],'HistoryTab');assert.equal(navigation[0][1].params.item.id,1);
 value={...value,unseen:[],pending:record};banner=render().find(n=>n.type==='Banner');assert.equal(banner.props.pending,true);
 value={...value,pending:null};assert(!render().some(n=>n.type==='Banner'));
});
test('root history dot only exists while there are unseen results',()=>{
 let value={unseen:[record]};const exports={};
 vm.runInNewContext(compile('../navigation/RootNavigator.tsx'),{exports,React,require:name=>name==='react-native'?native:name==='@react-navigation/bottom-tabs'?{createBottomTabNavigator:()=>({Navigator:'Navigator',Screen:'Screen'})}:name.endsWith('/JudgementResultsProvider')?{JudgementResultsProvider:'Provider',useJudgementResults:()=>value}:name.endsWith('/JudgementResultBanner')?{HistoryResultDot:'Dot'}:name==='@expo/vector-icons'?{Ionicons:'Icon'}:{}});
 const root=exports.RootNavigator({session:{userId:1},onLogout(){}});const tabs=root.children[0].type(root.children[0].props);const options=tabs.props.screenOptions({route:{name:'HistoryTab'}});
 assert.match(options.tabBarAccessibilityLabel,/안 본/);assert(nodes(options.tabBarIcon({color:'#667085',focused:false,size:24})).some(n=>n.type==='Dot'));
 value={unseen:[]};const empty=root.children[0].type(root.children[0].props).props.screenOptions({route:{name:'HistoryTab'}});
 assert(!nodes(empty.tabBarIcon({color:'#667085',focused:false,size:24})).some(n=>n.type==='Dot'));
});
test('failed history query shows retry instead of an empty history',()=>{
 let slot=0,retries=0;const exports={};const hooks={...React,useState:v=>[slot++===4?8:typeof v==="function"?v():v,()=>{}]};
 vm.runInNewContext(compile('../screens/history/HistoryScreen/index.tsx'),{exports,React:hooks,require:name=>name==='react'?hooks:name==='react-native'?native:name==='@react-navigation/native'?{useFocusEffect(){},useIsFocused:()=>true}:name==='@tanstack/react-query'?{useInfiniteQuery:()=>({data:{pages:[]},isError:true,isLoading:false,refetch:()=>{retries++;}})}:name.endsWith('/historyRecords')?history:{AttendanceCard:'AttendanceCard',TabScreenHeader:'Header',HistoryItem:'HistoryItem'}});
 const tree=nodes(exports.HistoryScreen({route:{params:{}},navigation:{}}));const words=tree.filter(n=>n.type==='Text').flatMap(n=>n.children).join('');assert.match(words,/기록을 불러오지 못했어요 · 다시 시도/);assert(!words.includes('이 기간에는 판단 기록이 없어요'));
 tree.find(n=>n.type==='Pressable'&&nodes(n).some(child=>child.type==='Text'&&child.children.includes('다시 시도'))).props.onPress();assert.equal(retries,1);
});
test('notification permission is off by default, cancellation precedes rescheduling and web never imports native module',async()=>{
 const store=new Map(),events=[];let os='ios',owner=1,next=0;
 const nativeNotifications={__esModule:true,setAutoServerRegistrationEnabledAsync:async flag=>events.push(['server-registration',flag]),setNotificationHandler(){},getPermissionsAsync:async()=>({granted:true}),requestPermissionsAsync:async()=>({granted:false}),cancelScheduledNotificationAsync:async id=>events.push(['cancel',id]),scheduleNotificationAsync:async request=>{events.push(['schedule',request]);return `id-${++next}`;},SchedulableTriggerInputTypes:{DATE:'date'}};
 const clock=class extends Date{static now(){return Date.parse('2026-10-13T01:00:00Z');}};
 const exports={};vm.runInNewContext(compile('./judgementNotifications.ts'),{exports,Date:clock,require:name=>name==='react-native'?{Platform:{get OS(){return os;}}}:name==='expo-notifications'?nativeNotifications:name==='./storage'?{storageGetItem:async key=>store.get(key),storageSetItem:async(key,value)=>store.set(key,value)}:name==='./auth'?{loadAuthSession:async()=>({userId:owner})}:helpersApi});
 const ack={newsId:10,judgementId:1,expectedResultDate:'2026-10-14'};
 assert.equal(await exports.judgementNotificationsEnabled(1),false);await exports.scheduleJudgementReminder(1,ack);assert.equal(events.length,0);
 await exports.setJudgementNotificationsEnabled(1,true);await exports.scheduleJudgementReminder(1,ack);await exports.scheduleJudgementReminder(1,ack);
 const calls=events.filter(e=>['schedule','cancel'].includes(e[0]));assert.deepEqual(calls.map(e=>e[0]),['schedule','cancel','schedule']);assert.equal(calls[1][1],'id-1');assert.equal(calls[0][1].trigger.date.toISOString(),'2026-10-14T07:00:00.000Z');assert.match(calls[0][1].content.body,/결과를 확인하고 있어요/);assert(!calls[0][1].content.body.includes('결과가 나왔'));
 await exports.setJudgementNotificationsEnabled(1,false);assert.equal(await exports.judgementNotificationsEnabled(1),false);assert.equal(events.at(-1)[1],'id-2');
 const previous=events.length;os='web';await exports.setJudgementNotificationsEnabled(1,true);await exports.scheduleJudgementReminder(1,ack);assert.equal(events.length,previous);
 os='ios';await exports.setJudgementNotificationsEnabled(1,true);owner=2;const before=events.length;await exports.scheduleJudgementReminder(1,ack);assert.equal(events.length,before);
 assert(events.filter(e=>e[0]==='server-registration').every(e=>e[1]===false));
});
test('seen receipt emits immediately for its owner and unsubscribe stops updates',async()=>{
 const store=new Map(),events=[],exports={};
 vm.runInNewContext(compile('./feedbackSeen.ts'),{exports,require:name=>name==='./storage'?{storageGetItem:async key=>store.get(key),storageSetItem:async(key,value)=>store.set(key,value)}:name==='./auth'?{loadAuthSession:async()=>({userId:8})}:history});
 const unsubscribe=exports.subscribeFeedbackSeen((owner,seen)=>events.push([owner,seen]));await exports.markFeedbackSeen(record);
 assert.equal(events[0][0],8);assert.equal(helpersApi.unreadJudgements([record],events[0][1]).length,0);
 unsubscribe();await exports.markFeedbackSeen({...record,id:2});assert.equal(events.length,1);
});
test('saved judgement ACK survives notification scheduling failure',async()=>{
 const exports={};let request;
 const http={post:async(path,payload)=>{request=payload;return {data:{judgementId:12,newsId:10,choice:'UP',expectedResultDate:'2026-10-14',expectedResultAt:'2026-10-14T06:40:00Z'}};},interceptors:{request:{use(){}},response:{use(){}}}};
 vm.runInNewContext(compile('./api.ts'),{exports,process:{env:{}},require:name=>name==='axios'?{create:()=>http}:name==='expo'?{getExpoGoProjectConfig:()=>({})}:name==='./auth'?{loadAuthSession:async()=>({userId:8})}:name==='./judgementNotifications'?{scheduleJudgementReminder:async()=>{throw new Error('OS unavailable');}}:name==='./historyRecords'?history:{}});
 const ack=await exports.submitJudgement({newsId:10,choice:'UP'});assert.equal(request.newsId,10);assert.equal(ack.judgementId,12);assert.equal(ack.expectedResultDate,'2026-10-14');assert.match(ack.notificationWarning,/판단은 저장됐지만/);
});
test('denied notification permission leaves the setting off and the serial queue usable',async()=>{
 const store=new Map();let granted=false;
 const api={__esModule:true,setAutoServerRegistrationEnabledAsync:async()=>{},setNotificationHandler(){},getPermissionsAsync:async()=>({granted}),requestPermissionsAsync:async()=>({granted}),IosAuthorizationStatus:{AUTHORIZED:2,PROVISIONAL:3,EPHEMERAL:4}};
 const exports={};vm.runInNewContext(compile('./judgementNotifications.ts'),{exports,require:name=>name==='react-native'?{Platform:{OS:'ios'}}:name==='expo-notifications'?api:name==='./auth'?{loadAuthSession:async()=>({userId:8})}:name==='./storage'?{storageGetItem:async key=>store.get(key),storageSetItem:async(key,value)=>store.set(key,value)}:helpersApi});
 await assert.rejects(exports.setJudgementNotificationsEnabled(8,true),/알림 권한/);
 assert.equal(await exports.judgementNotificationsEnabled(8),false);
 granted=true;await exports.setJudgementNotificationsEnabled(8,true);assert.equal(await exports.judgementNotificationsEnabled(8),true);
 await assert.rejects(exports.scheduleJudgementReminder(8,{newsId:1,expectedResultDate:'bad'}));
});
