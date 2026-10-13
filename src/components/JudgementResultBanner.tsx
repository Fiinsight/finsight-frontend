import { Pressable, StyleSheet, Text, View } from "react-native";
import { resultBannerMessage } from "../lib/judgementResults";
import type { JudgementHistoryItem } from "../types/api";
export function JudgementResultBanner({item,pending=false,onPress}:{item:JudgementHistoryItem;pending?:boolean;onPress:()=>void}) {
  return <Pressable style={styles.banner} accessibilityRole="button" accessibilityLabel={pending?"결과를 확인하고 있어요, 판단 기록 열기":resultBannerMessage(item)} onPress={onPress}>
    <Text style={styles.title}>{pending?"결과를 확인하고 있어요":resultBannerMessage(item)}</Text>
    <Text style={styles.link}>{pending?"시세가 확인되면 알려드릴게요 · 판단 기록 보기":"판단 결과 확인하기 ›"}</Text>
  </Pressable>;
}
export function HistoryResultDot() { return <View testID="history-unread-dot" style={styles.dot} accessibilityElementsHidden />; }
const styles=StyleSheet.create({
  banner:{backgroundColor:"#EFF4FF",padding:16,borderRadius:12,gap:8},
  title:{fontSize:15,lineHeight:22,fontWeight:"700",color:"#101828"},
  link:{fontSize:13,color:"#175CD3",lineHeight:20},
  dot:{position:"absolute",width:8,height:8,borderRadius:4,top:0,right:-4,backgroundColor:"#D92D20"}
});
