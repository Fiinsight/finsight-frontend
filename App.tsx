import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "./src/lib/api";

type NewsBrief = {
  id: number;
  title: string;
  summary: string;
  importanceReason: string;
  relatedSymbol: string;
  sentimentHint: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
};

const queryClient = new QueryClient();

function HomeScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["today-briefing"],
    queryFn: async () => {
      const response = await api.get<NewsBrief[]>("/briefings/today");
      return response.data;
    }
  });

  const news = data ?? sampleNews;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>FinSight</Text>
          <Text style={styles.subtitle}>뉴스를 읽고, 근거 있는 투자 판단으로 연결하세요.</Text>
        </View>

        <View style={styles.marketPanel}>
          <Text style={styles.sectionTitle}>국내 시장 현황</Text>
          <View style={styles.marketRow}>
            <MarketStat label="KOSPI" value="2,814.22" change="+0.42%" tone="up" />
            <MarketStat label="USD/KRW" value="1,382.10" change="-0.18%" tone="down" />
            <MarketStat label="기준금리" value="3.50%" change="동결" tone="flat" />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>오늘의 핵심 뉴스</Text>
          <Text style={styles.muted}>{isLoading ? "불러오는 중" : "3개 선별"}</Text>
        </View>

        {news.map((item) => (
          <TouchableOpacity key={item.id} style={styles.newsCard} activeOpacity={0.85}>
            <View style={styles.cardTop}>
              <Text style={styles.symbol}>{item.relatedSymbol}</Text>
              <Text style={[styles.sentiment, sentimentStyle[item.sentimentHint]]}>{sentimentLabel[item.sentimentHint]}</Text>
            </View>
            <Text style={styles.newsTitle}>{item.title}</Text>
            <Text style={styles.summary}>{item.summary}</Text>
            <Text style={styles.reason}>왜 중요한가: {item.importanceReason}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function MarketStat({ label, value, change, tone }: { label: string; value: string; change: string; tone: "up" | "down" | "flat" }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statChange, toneStyle[tone]]}>{change}</Text>
    </View>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomeScreen />
    </QueryClientProvider>
  );
}

const sampleNews: NewsBrief[] = [
  {
    id: 1,
    title: "반도체 수출 회복세, 대형주 실적 기대감 확대",
    summary: "반도체 업황 회복 신호가 이어지며 국내 대형 기술주의 실적 기대가 커지고 있습니다.",
    importanceReason: "수출과 실적 전망은 주가 방향을 판단하는 핵심 근거입니다.",
    relatedSymbol: "005930",
    sentimentHint: "POSITIVE"
  },
  {
    id: 2,
    title: "원달러 환율 변동성 확대, 외국인 수급 주목",
    summary: "환율이 단기적으로 흔들리면서 외국인 매수세와 수입 비용 부담이 함께 관찰됩니다.",
    importanceReason: "환율은 기업 이익과 외국인 자금 흐름에 동시에 영향을 줍니다.",
    relatedSymbol: "KOSPI",
    sentimentHint: "NEUTRAL"
  },
  {
    id: 3,
    title: "금리 동결 전망 우세, 성장주 밸류에이션 부담 완화",
    summary: "기준금리 동결 가능성이 커지며 성장주의 할인율 부담이 일부 낮아질 수 있습니다.",
    importanceReason: "금리 변화는 미래 이익의 현재 가치 평가에 직접 연결됩니다.",
    relatedSymbol: "KQ150",
    sentimentHint: "POSITIVE"
  }
];

const sentimentLabel = {
  POSITIVE: "상승",
  NEUTRAL: "중립",
  NEGATIVE: "하락"
};

const sentimentStyle = StyleSheet.create({
  POSITIVE: { color: "#D92D20", backgroundColor: "#FEE4E2" },
  NEUTRAL: { color: "#475467", backgroundColor: "#F2F4F7" },
  NEGATIVE: { color: "#175CD3", backgroundColor: "#D1E9FF" }
});

const toneStyle = StyleSheet.create({
  up: { color: "#D92D20" },
  down: { color: "#175CD3" },
  flat: { color: "#475467" }
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 20,
    gap: 16
  },
  header: {
    gap: 6,
    paddingTop: 12
  },
  logo: {
    color: "#101828",
    fontSize: 32,
    fontWeight: "800"
  },
  subtitle: {
    color: "#667085",
    fontSize: 15,
    lineHeight: 22
  },
  marketPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "700"
  },
  muted: {
    color: "#98A2B3",
    fontSize: 13
  },
  marketRow: {
    flexDirection: "row",
    gap: 8
  },
  statBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    flex: 1,
    padding: 10
  },
  statLabel: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "700"
  },
  statValue: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6
  },
  statChange: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  newsCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  symbol: {
    color: "#344054",
    fontSize: 12,
    fontWeight: "800"
  },
  sentiment: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  newsTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 25
  },
  summary: {
    color: "#475467",
    fontSize: 14,
    lineHeight: 21
  },
  reason: {
    color: "#175CD3",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  }
});

