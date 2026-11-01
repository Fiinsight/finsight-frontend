import {useEffect,useState,type ReactNode} from "react";
import {useQuery} from "@tanstack/react-query";
import {SafeAreaView,Text,View} from "react-native";
import {getTodayBriefing,getMarketSummary} from "../../../lib/api";

export function HomeDataGate({children}:{children:ReactNode}) {
  const news=useQuery({queryKey:["today-briefing"],queryFn:getTodayBriefing,retry:0,staleTime:60_000});
  const market=useQuery({queryKey:["market-summary"],queryFn:getMarketSummary,retry:0,staleTime:60_000});
  const loading=(news.isPending && !news.data) || (market.isPending && !market.data);
  const [slow,setSlow]=useState(false);
  useEffect(()=>{if(!loading){setSlow(false);return;}const timer=setTimeout(()=>setSlow(true),10_000);return()=>clearTimeout(timer);},[loading]);
  if(!loading)return children;
  return <SafeAreaView style={{flex:1,padding:24,gap:20,backgroundColor:"#F8FAFC"}} accessibilityLabel="홈 전체 불러오는 중">
    <Text>{slow?"서버를 깨우는 중이에요(최대 1분). 연결 상태에 따라 더 걸릴 수 있어요.":"오늘의 뉴스를 준비하고 있어요"}</Text>
    {[60,140,220].map((height,index)=><View key={index} style={{height,borderRadius:16,backgroundColor:"#E4E7EC"}} />)}
  </SafeAreaView>;
}
