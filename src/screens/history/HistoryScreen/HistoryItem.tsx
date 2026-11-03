import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { judgementResult, feedbackVerdict } from "../../../lib/historyRecords";
import { toRelativeTimeKorean } from "../../../lib/format";
import type { JudgementChoice, JudgementHistoryItem } from "../../../types/api";

const choiceLabel: Record<JudgementChoice, string> = {
  UP: "상승 예측",
  NEUTRAL: "중립 예측",
  DOWN: "하락 예측"
};

const choiceColor: Record<JudgementChoice, string> = {
  UP: "#027A48",
  NEUTRAL: "#667085",
  DOWN: "#175CD3"
};

export function HistoryItem({ item, onPress, unread = false, compactReview = false }: { item: JudgementHistoryItem; onPress: () => void; unread?: boolean; compactReview?: boolean }) {
  const [expanded,setExpanded] = useState(false);
  const result = judgementResult(item);
  const partial = feedbackVerdict(item) === "PARTIAL";
  if (compactReview) return <View style={styles.card}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${item.newsTitle} 복습 설명`} accessibilityState={{expanded}} onPress={() => setExpanded(!expanded)} style={styles.reviewRow}>
      <Text style={styles.reviewTitle} numberOfLines={1}>{item.newsTitle}</Text><Text style={styles.date}>{toRelativeTimeKorean(item.judgedAt)}</Text><Text style={styles.date}>{choiceLabel[item.choice]}</Text>
    </Pressable>
    {expanded ? <><Text style={styles.feedback}>{result.feedbackText}</Text><Pressable accessibilityRole="button" onPress={onPress}><Text style={styles.link}>기록 상세 보기 →</Text></Pressable></> : null}
  </View>;
  return (
    <View style={styles.card}>
      {result.example ? <Text style={styles.arrived}>예시</Text> : null}
      {unread ? <Text style={styles.arrived} accessibilityLabel="새 판단 결과 도착">결과 도착</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={`${item.newsTitle} 판단 상세`} onPress={onPress}><Text style={styles.title} numberOfLines={2}>
        {item.newsTitle}
      </Text></Pressable>
      <View style={styles.row}>
        <Text style={[styles.choice, { color: choiceColor[item.choice] }]}>내 예측: {choiceLabel[item.choice]}</Text>
        <Text style={result.pending ? styles.pending : styles.result}>{result.label}</Text>
        {result.correct !== null ? (
          <View style={[styles.badge, { backgroundColor: partial ? "#F2F4F7" : result.correct ? "#ECFDF3" : "#FEF3F2" }]}>
            <Text style={[styles.badgeText, { color: partial ? "#667085" : result.correct ? "#027A48" : "#D92D20" }]}>{partial ? "방향 같음·소폭 변동" : result.correct ? "맞음" : "틀림"}</Text>
          </View>
        ) : null}
      </View>
      {result.pending && item.expectedResultDate && item.pendingReason!=="NOT_DUE" ? <Text style={styles.date}>예정일 {item.expectedResultDate} 15:40 이후</Text>:null}
      {result.feedbackText && !result.pending ? <><View style={styles.feedbackBox}><Text style={[styles.feedback,!expanded&&styles.feedbackPreview]} numberOfLines={expanded ? undefined : 2}>{result.feedbackText}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={expanded ? "피드백 접기" : "피드백 자세히"} accessibilityState={{expanded}} onPress={() => setExpanded(!expanded)}><Text style={styles.link}>{expanded ? "접기" : "자세히"}</Text></Pressable></> : null}
      <Text style={styles.date}>{toRelativeTimeKorean(item.judgedAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewRow: {flexDirection:"row",alignItems:"center",gap:8,minHeight:44},
  reviewTitle: {flex:1,fontSize:15,color:"#101828",fontWeight:"600"},
  link: {fontSize:15,color:"#175CD3",paddingVertical:8},
  arrived: { color: "#175CD3", backgroundColor: "#EEF4FF", alignSelf: "flex-start", fontSize: 12, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 8
  },
  title: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  choice: {
    fontSize: 13,
    fontWeight: "700"
  },
  result: {
    color: "#475467",
    fontSize: 13
  },
  pending: {
    color: "#667085",
    fontSize: 13
  },
  feedbackBox: {backgroundColor:"#F8FAFC",borderRadius:6,padding:10},
  feedbackPreview: {maxHeight:40,overflow:"hidden"},
  feedback: {
    color: "#344054",
    fontSize: 13,
    lineHeight: 20
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800"
  },
  date: {
    color: "#667085",
    fontSize: 12
  }
});
