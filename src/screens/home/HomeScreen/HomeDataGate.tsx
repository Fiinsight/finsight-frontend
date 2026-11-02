import {RequestWaitNotice} from "../../../components/RequestWaitNotice";
import {useState,type ReactNode} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {SafeAreaView,Text,View,Pressable} from "react-native";
import {getTodayBriefing,getMarketSummary} from "../../../lib/api";

export function HomeDataGate({children}:{children:ReactNode}) {
  const client=useQueryClient();
  const [cancelled,setCancelled]=useState(false);
  const cancel=()=>{setCancelled(true);void client.cancelQueries({queryKey:["today-briefing"]});void client.cancelQueries({queryKey:["market-summary"]});};
  const retry=()=>{cancel();setCancelled(false);void news.refetch();void market.refetch();};
  const news=useQuery({queryKey:["today-briefing"],queryFn:getTodayBriefing,retry:0,staleTime:60_000});
  const market=useQuery({queryKey:["market-summary"],queryFn:getMarketSummary,retry:0,staleTime:60_000});
  const loading=(news.isPending && !news.data) || (market.isPending && !market.data);
  if(!loading&&!cancelled)return children;
  return <SafeAreaView style={{flex:1,padding:24,gap:20,backgroundColor:"#F8FAFC"}} accessibilityLabel="홈 전체 불러오는 중">
    <Text>{cancelled?"불러오기를 취소했어요":"오늘의 뉴스를 준비하고 있어요"}</Text>
    {cancelled?<Pressable accessibilityRole="button" onPress={retry}><Text>다시 시도</Text></Pressable>:<RequestWaitNotice loading={loading} onRetry={retry} onCancel={cancel} />}
    {[60,140,220].map((height,index)=><View key={index} style={{height,borderRadius:16,backgroundColor:"#E4E7EC"}} />)}
  </SafeAreaView>;
}
