import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GuideItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const guides: GuideItem[] = [
  { icon: "book-outline", title: "뉴스 읽는 법", subtitle: "경제 뉴스를 효과적으로 읽는 방법" },
  { icon: "bulb-outline", title: "핵심 용어 사전", subtitle: "꼭 알아야 할 투자 용어" },
  { icon: "trending-up-outline", title: "실적 이해하기", subtitle: "기업 실적 발표 읽는 법" },
  { icon: "cash-outline", title: "금리와 주가", subtitle: "금리가 주식에 미치는 영향" },
  { icon: "stats-chart-outline", title: "차트 기초", subtitle: "주가 차트 보는 법" }
];

export function GuideList() {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>학습 가이드</Text>
      {guides.map((guide, index) => (
        <TouchableOpacity
          key={guide.title}
          style={[styles.row, index === guides.length - 1 && styles.rowLast]}
          activeOpacity={0.7}
          onPress={() => Alert.alert(guide.title, "준비 중인 콘텐츠입니다.")}
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
  }
});
