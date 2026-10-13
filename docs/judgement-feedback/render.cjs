const fs=require('fs'),path=require('path'),vm=require('vm');
const repo=path.resolve(__dirname,'../..');
const React=require(path.join(repo,'node_modules/react')),DOM=require(path.join(repo,'node_modules/react-dom/server')),native=require(path.join(repo,'node_modules/react-native-web')),ts=require(path.join(repo,'node_modules/typescript'));
const out=path.join(repo,'docs/judgement-feedback');fs.mkdirSync(out,{recursive:true});
const base={id:10,newsId:153,newsTitle:'기업 실적 발표, 매출 증가와 비용 변화',choice:'UP',actualDirection:'UP',actualChangePercent:1.76,comparisonDate:'2026-10-07',judgementClose:100,comparisonClose:101.76,feedbackText:'삼성전자 2026-10-07 종가 기준 +1.76%.',feedbackReasons:[{title:'기사 근거',detail:'기사에서는 매출이 12% 증가했다고 알렸어요.'},{title:'판단 근거',detail:'남긴 근거 “매출 증가에 주목했어요”의 비교 시점을 확인해보세요.'},{title:'실제 시장',detail:'삼성전자 2026-10-07 종가 기준 +1.76% (판단 기준 100 → 결과 101.76).'}],reasonText:'매출 증가에 주목했어요',reasons:['매출 증가에 주목했어요'],nextTip:'다음에도 같은 비교 시점의 기사와 시장 흐름을 확인해보세요.',judgedAt:'2026-10-06T01:00:00Z',feedbackGeneratedAt:'2026-10-07T07:00:00Z',verdict:'CORRECT'};
for(const [scenario,override]of[['01-correct',{}],['02-wrong',{verdict:'WRONG',choice:'DOWN'}],['03-partial',{verdict:'PARTIAL',actualChangePercent:.7,comparisonClose:100.7}],['04-pending',{actualDirection:null,comparisonDate:null,feedbackReasons:null,verdict:null}]]){
 const item={...base,...override};if(scenario==='03-partial')item.feedbackReasons=[...base.feedbackReasons.slice(0,2),{title:'실제 시장',detail:'삼성전자 2026-10-07 종가 기준 +0.70%, 작은 변동은 우연일 수 있어요.'}];
 const cache={};function load(file){if(cache[file])return cache[file];let slot=0;const exports={};cache[file]=exports;const hooks={...React,useState:initial=>React.useState(file.endsWith('/MiniLineChart.tsx')&&slot++===0?301:initial)};
 const requireLocal=name=>{
  if(name==='react')return hooks;
  if(name==='react-native')return native;
  if(name==='react-native-svg'){const component=tag=>({children,...props})=>React.createElement(tag,props,children);return{__esModule:true,default:component('svg'),Line:component('line'),Path:component('path'),Rect:component('rect'),Circle:component('circle')};}
  if(name==='@tanstack/react-query')return{useQueryClient:()=>({invalidateQueries(){}}),useQuery:({queryKey})=>({data:queryKey[0]==='judgement-detail'?undefined:queryKey[0]==='news-detail'?{relatedSymbol:'005930',relatedSymbolName:'삼성전자'}:queryKey[0]==='chart'?{points:[{date:'2026-10-06',value:100},{date:'2026-10-07',value:item.comparisonClose}]}:[]})};
  if(name==='@react-navigation/native')return{useIsFocused:()=>true};
  if(name==='@expo/vector-icons')return{Ionicons:props=>React.createElement(native.Text,{style:{color:props.color,fontSize:props.size}},'‹')};
  if(name.endsWith('/api')||name.endsWith('/readingProgress')||name.endsWith('/feedbackSeen'))return{};
  if(name.startsWith('.')){let resolved=path.resolve(path.dirname(file),name);for(const candidate of[resolved+'.tsx',resolved+'.ts',resolved+'/index.tsx'])if(fs.existsSync(candidate))return load(candidate);}
  return require(name);
 };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{exports,React,require:requireLocal,Date,Math,Map,Set,Intl});return exports;}
 const Component=load(path.join(repo,'src/screens/history/JudgementDetailScreen.tsx')).JudgementDetailScreen;
 const body=DOM.renderToStaticMarkup(React.createElement(Component,{route:{params:{item}},navigation:{navigate(){},goBack(){}}}));native.AppRegistry.registerComponent('FeedbackQA',()=>Component);const app=native.AppRegistry.getApplication('FeedbackQA',{});const css=DOM.renderToStaticMarkup(app.getStyleElement());
 fs.writeFileSync(path.join(out,scenario+'.html'),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>판단 결과 QA ${scenario}</title>${css}<style>html,body{margin:0;width:100%;height:100%;background:#F8FAFC}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif}#root{height:100vh;display:flex;flex-direction:column}</style></head><body><div id="root">${body}</div></body></html>`);
}
