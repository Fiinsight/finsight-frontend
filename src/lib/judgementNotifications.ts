import { Platform } from "react-native";
import { storageGetItem, storageSetItem } from "./storage";
import { loadAuthSession } from "./auth";
import type { JudgementAck } from "../types/api";
import { resultDateLabel } from "./judgementResults";
const key=(owner:number)=>`finsight.judgement-notifications.v1:${owner}`;
type Preferences={enabled:boolean; scheduled:Record<string,string>};
async function read(owner:number):Promise<Preferences> {
  try {
    const value=JSON.parse(await storageGetItem(key(owner)) || "{}");
    const scheduled=value.scheduled && typeof value.scheduled==="object" && !Array.isArray(value.scheduled)?Object.fromEntries(Object.entries(value.scheduled).filter(([news,id])=>/^\d+$/.test(news)&&typeof id==="string")):{};
    return {enabled:value.enabled===true,scheduled:scheduled as Record<string,string>};
  } catch { return {enabled:false,scheduled:{}}; }
}
let queue=Promise.resolve();
function serial<T>(action:()=>Promise<T>):Promise<T> { const run=queue.catch(()=>{}).then(action);queue=run.then(()=>{},()=>{});return run; }
async function nativeNotifications() {
  const notifications=await import("expo-notifications");
  await notifications.setAutoServerRegistrationEnabledAsync(false);
  notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});
  return notifications;
}
function permitted(permission:{granted:boolean;ios?:{status:number}},notifications:typeof import("expo-notifications")) {
  return permission.granted || !!permission.ios && [notifications.IosAuthorizationStatus.AUTHORIZED,notifications.IosAuthorizationStatus.PROVISIONAL,notifications.IosAuthorizationStatus.EPHEMERAL].some(status=>status===permission.ios!.status);
}
export async function judgementNotificationsEnabled(owner:number) { return Platform.OS!=="web" && (await read(owner)).enabled; }
export function setJudgementNotificationsEnabled(owner:number,enabled:boolean) {
  return serial(async()=>{
    if(Platform.OS==="web") return false;
    const notifications=await nativeNotifications();
    const preferences=await read(owner);
    if(enabled) {
      if(Platform.OS==="android") await notifications.setNotificationChannelAsync("judgement-results",{name:"판단 결과 알림",importance:notifications.AndroidImportance.DEFAULT});
      let permission=await notifications.getPermissionsAsync();
      if(!permitted(permission,notifications)) permission=await notifications.requestPermissionsAsync();
      if(!permitted(permission,notifications)) throw new Error("알림 권한을 허용해 주세요.");
    } else {
      for(const id of Object.values(preferences.scheduled)) await notifications.cancelScheduledNotificationAsync(id);
      preferences.scheduled={};
    }
    await storageSetItem(key(owner),JSON.stringify({...preferences,enabled}));
    return enabled;
  });
}
export function cancelJudgementReminder(owner:number,newsId:number) {
  return serial(async()=>{
    if(Platform.OS==="web") return;
    const preferences=await read(owner);
    const id=preferences.scheduled[String(newsId)];
    if(!id) return;
    await (await nativeNotifications()).cancelScheduledNotificationAsync(id);
    delete preferences.scheduled[String(newsId)];
    await storageSetItem(key(owner),JSON.stringify(preferences));
  });
}
export function scheduleJudgementReminder(owner:number,ack:JudgementAck) {
  return serial(async()=>{
    if(Platform.OS==="web") return;
    const session=await loadAuthSession();
    if(session?.userId!==owner) return;
    const preferences=await read(owner);
    if(!preferences.enabled) return;
    const notifications=await nativeNotifications();
    const old=preferences.scheduled[String(ack.newsId)];
    if(old) {
      await notifications.cancelScheduledNotificationAsync(old);
      delete preferences.scheduled[String(ack.newsId)];
      await storageSetItem(key(owner),JSON.stringify(preferences));
    }
    if(!resultDateLabel(ack.expectedResultDate)) throw new Error("결과 예정일을 확인할 수 없습니다.");
    const date=new Date(`${ack.expectedResultDate}T16:00:00+09:00`);
    if(date.getTime()<=Date.now()) return;
    if(!permitted(await notifications.getPermissionsAsync(),notifications)) throw new Error("기기의 알림 권한을 확인해 주세요.");
    const id=await notifications.scheduleNotificationAsync({
      content:{title:"판단 결과 확인",body:"결과를 확인하고 있어요. 앱에서 실제 결과를 확인해 주세요.",data:{newsId:ack.newsId,judgementId:ack.judgementId,owner}},
      trigger:{type:notifications.SchedulableTriggerInputTypes.DATE,date,...(Platform.OS==="android"?{channelId:"judgement-results"}:{})}
    });
    preferences.scheduled[String(ack.newsId)]=id;
    try { await storageSetItem(key(owner),JSON.stringify(preferences)); }
    catch(error) { await notifications.cancelScheduledNotificationAsync(id);throw error; }
  });
}
