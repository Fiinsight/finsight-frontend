import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { useState } from "react";
import type { LearningFocus, LearningLevel } from "../../../lib/onboarding";

interface GuideItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  content: string;
  example: string;
  terms: Array<[string, string]>;
}

const guides: GuideItem[] = [
  {
    "icon": "book-outline",
    "title": "뉴스 읽는 법",
    "subtitle": "경제 뉴스를 효과적으로 읽는 방법",
    "content": "제목은 관심을 끄는 요약이므로 본문에서 근거를 확인하세요.\n이미 확인된 사실과 기자·전문가의 전망을 나눠 읽으세요.\n숫자의 기준 시점과 비교 대상이 같은지 확인하세요.\n누가 이익을 얻고 비용을 부담하는지 메모하세요.",
    "example": "기업이 수출 증가를 발표했다면 실제 증가율과 기간을 확인하고, 주가 상승 전망은 별도로 구분합니다.",
    "terms": [
      [
        "수출",
        "국내에서 만든 상품이나 서비스를 다른 나라에 판매하는 활동입니다."
      ],
      [
        "매출",
        "상품이나 서비스를 팔아 얻은 총 수입입니다."
      ]
    ]
  },
  {
    "icon": "bulb-outline",
    "title": "핵심 용어 사전",
    "subtitle": "꼭 알아야 할 투자 용어",
    "content": "먼저 문장 안에서 용어가 무엇을 설명하는지 살펴보세요.\n일반적인 뜻을 확인한 뒤 기사 속 대상과 연결하세요.\n금리·환율·실적은 기업에 서로 다른 영향을 줄 수 있어요.\n헷갈리는 개념은 퀴즈와 복습 카드로 다시 확인하세요.",
    "example": "환율 하락 기사는 수출 기업의 원화 매출과 수입 기업의 비용에 서로 다른 영향을 줄 수 있습니다.",
    "terms": [
      [
        "환율",
        "서로 다른 두 통화를 교환하는 비율입니다."
      ],
      [
        "금리",
        "돈을 빌리거나 맡길 때 적용되는 이자의 비율입니다."
      ]
    ]
  },
  {
    "icon": "trending-up-outline",
    "title": "실적 이해하기",
    "subtitle": "기업 실적 발표 읽는 법",
    "content": "매출과 영업이익이 각각 얼마나 변했는지 확인하세요.\n전년 같은 기간인지 직전 분기인지 비교 기준을 보세요.\n일회성 이익과 지속적인 사업 성과를 구분하세요.\n실제 수치와 시장 기대, 앞으로의 전망을 따로 정리하세요.",
    "example": "매출은 증가했지만 영업이익이 감소한 기업 기사라면 원가·인건비와 사업 전망을 함께 확인합니다.",
    "terms": [
      [
        "매출",
        "상품이나 서비스를 팔아 얻은 총 수입입니다."
      ],
      [
        "영업이익",
        "본업에서 얻은 매출에서 원가와 판매·관리 비용을 뺀 이익입니다."
      ]
    ]
  },
  {
    "icon": "cash-outline",
    "title": "금리와 주가",
    "subtitle": "금리가 주식에 미치는 영향",
    "content": "금리는 자금 조달 비용과 투자 자산 평가에 영향을 줍니다.\n금리 변화의 이유가 물가인지 경기인지 확인하세요.\n대출이 많은 기업과 이자 수익을 얻는 기업을 구분하세요.\n금리만으로 주가 방향을 단정하지 말고 실적·기대를 함께 보세요.",
    "example": "기준금리 동결 기사라도 시장이 인하를 기대했다면 기업과 투자자의 반응은 다를 수 있습니다.",
    "terms": [
      [
        "금리",
        "돈을 빌리거나 맡길 때 적용되는 이자의 비율입니다."
      ],
      [
        "물가",
        "여러 상품과 서비스 가격의 전반적인 수준입니다."
      ]
    ]
  },
  {
    "icon": "stats-chart-outline",
    "title": "차트 기초",
    "subtitle": "주가 차트 보는 법",
    "content": "먼저 일봉·주봉처럼 비교할 기간을 정하세요.\n시가·고가·저가·종가가 각각 무엇인지 확인하세요.\n뉴스 발행 시점과 가격 변화를 시간 순서로 살펴보세요.\n함께 움직였다는 사실만으로 뉴스가 원인이라고 단정하지 마세요.",
    "example": "실적 발표 이후 가격이 올랐더라도 같은 시간의 시장 흐름과 다른 공시를 함께 검토합니다.",
    "terms": [
      [
        "주가",
        "주식 한 주가 시장에서 거래되는 가격입니다."
      ],
      [
        "거래량",
        "정해진 기간에 거래된 주식의 수량입니다."
      ]
    ]
  },
  {
    "icon": "create-outline",
    "title": "기사 메모 복습",
    "subtitle": "내가 남긴 생각을 다시 읽고 연결하기",
    "content": "기사의 사실과 자신의 예상을 다른 문장으로 기록하세요.\n판단 근거가 된 숫자와 출처 링크를 남기세요.\n결과가 나온 뒤 맞힌 이유와 놓친 변수를 구분하세요.\n한 번의 결과보다 반복되는 판단 습관을 살펴보세요.",
    "example": "환율을 근거로 상승을 예상했다면 이후 실제 환율·실적 변화를 확인하고 당시 가정을 메모와 비교합니다.",
    "terms": [
      [
        "환율",
        "서로 다른 두 통화를 교환하는 비율입니다."
      ],
      [
        "영업이익",
        "본업에서 얻은 매출에서 원가와 판매·관리 비용을 뺀 이익입니다."
      ]
    ]
  }
];

export function GuideList({ focus, level }: { focus: LearningFocus; level: LearningLevel }) {
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<[string, string] | null>(null);
  const personalizedGuides = focus === "decision"
    ? [guides[2], guides[0], guides[3], guides[4]]
    : focus === "market"
      ? [guides[3], guides[4], guides[0], guides[2]]
      : focus === "reflection"
        ? [guides[5], guides[0], guides[2], guides[1]]
        : guides;
  const visibleGuides = level === "beginner" ? personalizedGuides.slice(0, 4) : personalizedGuides;
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>나에게 맞는 학습 가이드</Text>
      {visibleGuides.map((guide, index) => (
        <TouchableOpacity
          key={guide.title}
          style={[styles.row, index === visibleGuides.length - 1 && styles.rowLast]}
          activeOpacity={0.7}
          onPress={() => { setSelectedGuide(guide); setSelectedTerm(null); }}
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
          <View style={styles.modalCard}><ScrollView contentContainerStyle={{ gap: 14 }}>
            <Text style={styles.modalTitle}>{selectedGuide?.title}</Text>
            <Text style={styles.modalBody}>{selectedGuide?.content}</Text>
            <Text style={styles.title}>기사 읽기 예시 · 학습용 가상 상황</Text>
            <Text style={styles.modalBody}>{selectedGuide?.example}</Text>
            <Text style={styles.title}>관련 용어 · 눌러서 뜻 확인</Text>
            {selectedGuide?.terms.map((term) => <Pressable key={term[0]} accessibilityRole="button" onPress={() => setSelectedTerm(term)}><Text style={styles.termLink}>{term[0]} →</Text></Pressable>)}
            {selectedTerm ? <Text accessibilityLiveRegion="polite" style={styles.modalBody}>{selectedTerm[0]}: {selectedTerm[1]}</Text> : null}
            <Pressable onPress={() => setSelectedGuide(null)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>확인</Text>
            </Pressable></ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  termLink: { color: "#175CD3", paddingVertical: 12, fontSize: 14 },
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
  modalCard: { maxHeight: "85%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, gap: 14 },
  modalTitle: { color: "#101828", fontSize: 20, fontWeight: "800" },
  modalBody: { color: "#344054", fontSize: 15, lineHeight: 23 },
  closeButton: { backgroundColor: "#175CD3", borderRadius: 10, alignItems: "center", paddingVertical: 13 },
  closeButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }
});
