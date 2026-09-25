import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import type { LearningFocus, LearningLevel } from "../../../lib/onboarding";

interface GuideItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  content: string;
}

const guides: GuideItem[] = [
  { icon: "book-outline", title: "뉴스 읽는 법", subtitle: "경제 뉴스를 효과적으로 읽는 방법", content: "헤드라인보다 본문에서 사실과 전망을 나눠 읽어보세요. 숫자·기간·주체를 먼저 확인하고, 마지막으로 이 뉴스가 누구의 비용과 기대를 바꾸는지 한 문장으로 정리하면 판단의 근거가 선명해집니다." },
  { icon: "bulb-outline", title: "핵심 용어 사전", subtitle: "꼭 알아야 할 투자 용어", content: "용어는 사전 뜻만 외우기보다 뉴스 속 역할을 함께 보세요. 금리·환율·실적처럼 같은 단어도 기업의 매출, 비용, 투자심리 중 어디에 영향을 주는지에 따라 해석이 달라집니다." },
  { icon: "trending-up-outline", title: "실적 이해하기", subtitle: "기업 실적 발표 읽는 법", content: "매출과 영업이익의 방향을 확인한 뒤 시장 기대와 비교해보세요. 숫자가 좋아도 전망이 낮아지면 주가가 약해질 수 있으니, 실적 발표에서는 다음 분기 가이던스까지 함께 읽는 습관이 중요합니다." },
  { icon: "cash-outline", title: "금리와 주가", subtitle: "금리가 주식에 미치는 영향", content: "금리가 오르면 자금 조달 비용과 할인율이 높아져 성장주에 부담이 될 수 있습니다. 반대로 은행처럼 이자 수익과 연결된 업종은 다른 영향을 받을 수 있으므로 시장 전체와 업종별 반응을 나눠 살펴보세요." },
  { icon: "stats-chart-outline", title: "차트 기초", subtitle: "주가 차트 보는 법", content: "차트는 미래를 맞히는 도구가 아니라 가격이 어떻게 반응했는지 확인하는 기록입니다. 기간을 먼저 정하고 추세·거래량·뉴스 시점을 함께 비교하면 숫자 변화의 맥락을 더 잘 이해할 수 있습니다." }
];

export function GuideList({ focus, level }: { focus: LearningFocus; level: LearningLevel }) {
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);
  const personalizedGuides = focus === "decision"
    ? [guides[2], guides[0], guides[3], guides[4]]
    : focus === "market"
      ? [guides[3], guides[4], guides[0], guides[2]]
      : focus === "reflection"
        ? [guides[0], guides[2], guides[4], guides[1]]
        : guides;
  const visibleGuides = level === "beginner" ? personalizedGuides.slice(0, 4) : personalizedGuides;
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>나에게 맞는 학습 가이드</Text>
      {visibleGuides.map((guide, index) => (
        <TouchableOpacity
          key={guide.title}
          style={[styles.row, index === guides.length - 1 && styles.rowLast]}
          activeOpacity={0.7}
          onPress={() => setSelectedGuide(guide)}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={guide.icon} size={18} color="#175CD3" />
          </View>
          <View style={styles.textGroup}>
            <Text style={styles.title}>{guide.title}</Text>
            <Text style={styles.subtitle}>{guide.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
        </TouchableOpacity>
      ))}
      <Modal visible={selectedGuide !== null} transparent animationType="slide" onRequestClose={() => setSelectedGuide(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedGuide?.title}</Text>
            <Text style={styles.modalBody}>{selectedGuide?.content}</Text>
            <Pressable onPress={() => setSelectedGuide(null)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>확인</Text>
            </Pressable>
          </View>
        </View>
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
    padding: 8
  },
  sectionTitle: {
    color: "#101828",
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7"
  },
  rowLast: {
    borderBottomWidth: 0
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center"
  },
  textGroup: {
    flex: 1,
    gap: 2
  },
  title: {
    color: "#101828",
    fontSize: 14,
    fontWeight: "700"
  },
  subtitle: {
    color: "#667085",
    fontSize: 12
  },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(16,24,40,0.35)" },
  modalCard: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, gap: 14 },
  modalTitle: { color: "#101828", fontSize: 20, fontWeight: "800" },
  modalBody: { color: "#344054", fontSize: 15, lineHeight: 23 },
  closeButton: { backgroundColor: "#175CD3", borderRadius: 10, alignItems: "center", paddingVertical: 13 },
  closeButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }
});
