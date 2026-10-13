import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getJudgementHistory } from "../lib/api";
import { getSeenFeedback, subscribeFeedbackSeen } from "../lib/feedbackSeen";
import { unreadJudgements, overdueJudgement } from "../lib/judgementResults";
import { cancelJudgementReminder } from "../lib/judgementNotifications";
import type { JudgementHistoryItem } from "../types/api";
interface Results { unseen:JudgementHistoryItem[]; pending:JudgementHistoryItem|null; refresh:()=>void }
const ResultsContext=createContext<Results>({unseen:[],pending:null,refresh(){}});
export const useJudgementResults=()=>useContext(ResultsContext);
export function JudgementResultsProvider({owner,children}:{owner:number;children:ReactNode}) {
  const [active,setActive]=useState(AppState.currentState==="active");
  const [seen,setSeen]=useState<Record<string,string>|null>(null);
  const results=useQuery({queryKey:["judgement-history",owner,"results"],queryFn:({signal})=>getJudgementHistory(signal),
    enabled:active,retry:0,staleTime:60_000,refetchInterval:active?60_000:false,refetchIntervalInBackground:false});
  const refresh=useCallback(()=>{if(active && Date.now()-results.dataUpdatedAt>=60_000) void results.refetch();},[active,results.dataUpdatedAt,results.refetch]);
  useEffect(()=>{const listener=AppState.addEventListener("change",state=>setActive(state==="active"));return()=>listener.remove();},[]);
  useEffect(()=>{
    let alive=true,version=0;setSeen(null);
    const unsubscribe=subscribeFeedbackSeen((user,receipts)=>{if(user===owner){version++;setSeen(receipts);}});
    const before=version;void getSeenFeedback(owner).then(value=>{if(alive&&version===before)setSeen(value);});
    return()=>{alive=false;unsubscribe();};
  },[owner]);
  const unseen=useMemo(()=>seen===null?[]:unreadJudgements(results.data ?? [],seen),[results.data,seen]);
  useEffect(()=>{
    if(seen===null)return;
    for(const item of results.data ?? []) if(seen[String(item.id)] && !unseen.some(row=>row.id===item.id)) void cancelJudgementReminder(owner,item.newsId).catch(()=>{});
  },[seen,unseen,results.data,owner]);
  return <ResultsContext.Provider value={{unseen,pending:overdueJudgement(results.data ?? []),refresh}}>{children}</ResultsContext.Provider>;
}
