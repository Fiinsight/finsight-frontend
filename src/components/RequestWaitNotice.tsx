import React,{useEffect,useState} from "react";
import {Pressable,Text,View} from "react-native";
import {api} from "../lib/api";
import {probeLiveness,waitMessage} from "../lib/serverHealth";

export function RequestWaitNotice({loading,onRetry,onCancel}:{loading:boolean;onRetry:()=>void;onCancel:()=>void}) {
 const [attempt,setAttempt]=useState(0);
 const [slow,setSlow]=useState(false);
 const [health,setHealth]=useState<"pending"|"slow"|"ready"|"failed">("pending");
 useEffect(()=>{
  setSlow(false);setHealth("pending");
  if(!loading)return;
  let active=true;const controller=new AbortController();
  const timer=setTimeout(()=>setSlow(true),10_000);
  const deadline=setTimeout(()=>controller.abort(),60_000);
  void probeLiveness(api.defaults.baseURL??"",controller.signal).then(ms=>{if(active)setHealth(ms>=10_000?"slow":"ready");}).catch(()=>{if(active)setHealth("failed");});
  return()=>{active=false;clearTimeout(timer);clearTimeout(deadline);controller.abort();};
 },[loading,attempt]);
 if(!loading||!slow)return null;
 return <View accessibilityLiveRegion="polite" style={{padding:16,gap:8}}>
  <Text>{waitMessage(health)}</Text>
  <Pressable accessibilityRole="button" onPress={()=>{setAttempt(value=>value+1);onRetry();}} style={{minHeight:44,justifyContent:"center"}}><Text>다시 시도</Text></Pressable>
  <Pressable accessibilityRole="button" onPress={onCancel} style={{minHeight:44,justifyContent:"center"}}><Text>취소</Text></Pressable>
 </View>;
}
