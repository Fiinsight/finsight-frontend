import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CandlestickChart } from "../../../components/CandlestickChart";
import type { ChartCandle, ChartRelatedNews } from "../../../types/api";

type ChartPeriod = "D" | "W" | "MINUTE";

interface ChartCardProps {
  candles: ChartCandle[];
  period: ChartPeriod;
  minuteInterval?: number;
  relatedNews?: ChartRelatedNews[];
  onCandlePress?: (candle: ChartCandle) => void;
}

export function ChartCard({ candles, period, minuteInterval, relatedNews = [], onCandlePress }: ChartCardProps) {
  const [showGuide, setShowGuide] = useState(false);
  const markers = relatedNews
    .filter((item) => item.publishedAt)
    .map((item) => ({ date: item.publishedAt.slice(0, 10), title: item.title }));
  const periodLabel = period === "D" ? "하루" : period === "W" ? "일주일" : `${minuteInterval ?? 5}분`;

  return (
    <View style={styles.card}>
      <CandlestickChart candles={candles} height={240} markers={markers} onCandlePress={onCandlePress} showTimeLabels={period === "MINUTE"} />
      <TouchableOpacity style={styles.guideTrigger} onPress={() => setShowGuide(true)} activeOpacity={0.75}>
        <Text style={styles.guideTriggerText}>차트 읽는 법</Text>
        <Ionicons name="information-circle-outline" size={20} color="#175CD3" />
      </TouchableOpacity>

      <Modal visible={showGuide} transparent animationType="slide" onRequestClose={() => setShowGuide(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowGuide(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>차트 읽는 법</Text>
                <Text style={styles.sheetSubtitle}>현재 {periodLabel} 캔들 기준으로 설명해요.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGuide(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#98A2B3" />
              </TouchableOpacity>
            </View>

            <View style={styles.explanationBlock}>
              <View style={styles.explanationTitleRow}>
                <View style={[styles.swatch, styles.upSwatch]} />
                <Text style={styles.explanationTitle}>빨강 · 양봉</Text>
              </View>
              <Text style={styles.explanationText}>
                {periodLabel} 동안 시작 가격보다 마지막 가격이 높거나 같았다는 뜻이에요. 예를 들어 하루를 70,000원에 시작해 72,000원에 마쳤다면 빨강으로 표시돼요.
              </Text>
            </View>

            <View style={styles.explanationBlock}>
              <View style={styles.explanationTitleRow}>
                <View style={[styles.swatch, styles.downSwatch]} />
                <Text style={styles.explanationTitle}>파랑 · 음봉</Text>
              </View>
              <Text style={styles.explanationText}>
                {periodLabel} 동안 시작 가격보다 마지막 가격이 낮았다는 뜻이에요. 예를 들어 70,000원에 시작해 68,000원에 마쳤다면 파랑으로 표시돼요.
              </Text>
            </View>

            <View style={styles.explanationBlock}>
              <Text style={styles.explanationTitle}>몸통과 꼬리</Text>
              <Text style={styles.explanationText}>몸통은 시작 가격과 마지막 가격의 차이, 위아래 꼬리는 해당 기간의 최고가와 최저가까지의 움직임을 보여줘요.</Text>
            </View>

            <View style={styles.noteBox}>
              <Ionicons name="bulb-outline" size={18} color="#175CD3" />
              <Text style={styles.noteText}>색상은 지나간 가격 움직임을 보여주는 표시예요. 다음 가격이 오를지 내릴지를 보장하는 신호는 아니에요.</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowGuide(false)} activeOpacity={0.85}>
              <Text style={styles.closeButtonText}>확인했어요</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16
  },
  guideTrigger: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5
  },
  guideTriggerText: {
    color: "#175CD3",
    fontSize: 12,
    fontWeight: "700"
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2
  },
  upSwatch: {
    backgroundColor: "#D92D20"
  },
  downSwatch: {
    backgroundColor: "#175CD3"
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(16, 24, 40, 0.45)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
    gap: 16
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D0D5DD",
    marginBottom: 2
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  sheetTitle: {
    color: "#101828",
    fontSize: 20,
    fontWeight: "800"
  },
  sheetSubtitle: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4
  },
  explanationBlock: {
    gap: 6
  },
  explanationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  explanationTitle: {
    color: "#101828",
    fontSize: 14,
    fontWeight: "800"
  },
  explanationText: {
    color: "#475467",
    fontSize: 14,
    lineHeight: 21
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EFF4FF",
    borderRadius: 10,
    padding: 12
  },
  noteText: {
    flex: 1,
    color: "#175CD3",
    fontSize: 12,
    lineHeight: 18
  },
  closeButton: {
    backgroundColor: "#175CD3",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center"
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800"
  }
});
