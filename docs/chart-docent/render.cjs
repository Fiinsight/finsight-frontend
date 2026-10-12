const fs=require('fs'),path=require('path'),vm=require('vm');
const repo=path.resolve(__dirname,'../..');
const React=require(path.join(repo,'node_modules/react')),DOM=require(path.join(repo,'node_modules/react-dom/server')),native=require(path.join(repo,'node_modules/react-native-web')),ts=require(path.join(repo,'node_modules/typescript'));
const out=path.join(repo,'docs/chart-docent');fs.mkdirSync(out,{recursive:true});
const fixture=[
 {timestamp:'2026-10-07T00:00:00',changePercent:4.25,newsId:301,newsTitle:'삼성전자 호실적, 영업이익 증가',newsSource:'QA 뉴스',explanation:'',candidateNews:[],docent:{relation:'DIRECT',whatHappened:'삼성전자의 영업이익이 전년 동기보다 12.5% 늘었어요.',possibleReason:'이날 삼성전자 관련 실적 소식이 나왔고, 주가가 +4.25% 움직였어요. 이 소식이 호재로 받아들여졌을 가능성이 있어요.',marketImpact:'실적 변화는 기업 가치 평가에 영향을 줬을 수 있어요.',newsId:301,newsTitle:'삼성전자 호실적, 영업이익 증가',source:'QA 뉴스',mode:'RULE'}},
 {timestamp:'2026-10-09T00:00:00',changePercent:-3.2,newsId:302,newsTitle:'코스피, 외국인 매도에 하락',newsSource:'QA 뉴스',explanation:'',candidateNews:[],docent:{relation:'MARKET',whatHappened:'코스피가 외국인 매도와 함께 하락했어요.',possibleReason:'개별 소식보다 시장 전체 흐름(코스피 -1.20%)이 영향을 줬을 수 있어요.',marketImpact:'매수·매도 수급과 시장 흐름도 함께 확인해야 해요.',newsId:302,newsTitle:'코스피, 외국인 매도에 하락',source:'QA 뉴스',mode:'RULE'}},
 {timestamp:'2026-10-12T00:00:00',changePercent:3.1,newsId:null,newsTitle:'',newsSource:'',explanation:'',candidateNews:[],docent:{relation:'NONE',whatHappened:'이날 수집된 관련 뉴스가 없어요.',possibleReason:'수급이나 시장 전체 요인이 영향을 줬을 수 있어요.',marketImpact:'매수·매도 수급과 시장 흐름도 함께 확인해야 해요.',newsId:null,newsTitle:null,source:null,mode:'RULE'}}
];
const dates=['2026-10-01','2026-10-02','2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09','2026-10-12'];const close=[71000,71200,70800,71400,74435,74200,71826,74053];
const candles=dates.map((date,i)=>({date,open:i?close[i-1]:70500,high:Math.max(close[i],i?close[i-1]:70500)+500,low:Math.min(close[i],i?close[i-1]:70500)-400,close:close[i]}));
fixture.forEach(item => { item.candidateNews = item.newsId ? [{id:item.newsId,title:item.newsTitle,source:item.newsSource,publishedAt:item.timestamp,relationType:item.docent.relation}] : []; });
const data={symbol:'005930',symbolName:'삼성전자',price:74053,changePercent:3.1,period:'D',candles,minuteCandles:[],moveInsights:fixture,relatedNews:fixture.flatMap(item=>item.candidateNews),fallback:false};
function render(scenario,selection){let slot=0;const cache={};function load(file){if(cache[file])return cache[file];let state=0;const exports={};cache[file]=exports;const hooks={...React,useState:initial=>{const i=state++;if(file.endsWith('/ChartScreen/index.tsx'))return React.useState(i===5?selection:initial);if(file.endsWith('/CandlestickChart.tsx'))return React.useState(i===0?301:initial);return React.useState(initial);}};const localRequire=name=>{
 if(name==='react')return hooks;
 if(name==='react-native')return {...native,Modal:()=>null};
 if(name==='react-native-svg'){const comp=tag=>({children,...props})=>React.createElement(tag,props,children);return{__esModule:true,default:comp('svg'),Line:comp('line'),Rect:comp('rect'),Polygon:comp('polygon'),Circle:comp('circle'),Text:comp('text')};}
 if(name==='@tanstack/react-query')return{useQuery:({queryKey})=>({data:queryKey[0]==='chart'?data:queryKey[0]==='popular-stocks'?[{symbol:'005930',name:'삼성전자',price:74053,changePercent:3.1}]:[]}),keepPreviousData:x=>x};
 if(name==='@expo/vector-icons')return{Ionicons:props=>React.createElement(native.Text,{style:{color:props.color,fontSize:props.size}},'ⓘ')};
 if(name.endsWith('/api'))return{};
 if(name.startsWith('.')){let base=path.resolve(path.dirname(file),name);for(let c of[base+'.tsx',base+'.ts',base+'/index.tsx'])if(fs.existsSync(c))return load(c);}
 return require(name);
};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{exports,React,require:localRequire,Date,Math,Map,Set,Intl});return exports;}
const Screen=load(path.join(repo,'src/screens/chart/ChartScreen/index.tsx')).ChartScreen;
const body=DOM.renderToStaticMarkup(React.createElement(Screen,{route:{params:{}},navigation:{navigate(){}}}));native.AppRegistry.registerComponent('ChartQA',()=>Screen);const app=native.AppRegistry.getApplication('ChartQA',{});const css=DOM.renderToStaticMarkup(app.getStyleElement());
fs.writeFileSync(path.join(out,scenario+'.html'),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>삼성전자 차트 QA ${scenario}</title>${css}<style>html,body{margin:0;width:100%;background:#F8FAFC}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif}</style></head><body>${body}</body></html>`);
}
render('01-entry',null);render('02-market',fixture[1]);render('03-none',fixture[2]);
