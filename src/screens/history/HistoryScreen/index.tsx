import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { getJudgementHistory } from "../../../lib/api";
import { sampleJudgementHistory } from "../../../lib/sampleData";
import type { HistoryStackParamList } from "../../../navigation/types";
import { AttendanceCard } from "../../../components/AttendanceCard";
import { HistoryItem } from "./HistoryItem";

type Props = NativeStackScreenProps<HistoryStackParamList, "History">;

export function HistoryScreen({ navigation }: Props) {
  const { data } = useQuery({
    queryKey: ["judgement-history"],
    queryFn: getJudgementHistory,
    retry: 0
  });

  const history = data ?? sampleJudgementHistory;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>기록</Text>
          <Text style={styles.subtitle}>출석과 투자 판단을 함께 돌아보세요</Text>
        </View>

        <AttendanceCard />

        <Text style={styles.sectionTitle}>판단 기록</Text>

        {history.map((item) => (
          <HistoryItem key={item.id} item={item} onPress={() => navigation.navigate("NewsDetail", { newsId: item.newsId })} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 12
  },
  header: {
    gap: 4,
    marginBottom: 4
  },
  title: {
    color: "#101828",
    fontSize: 22,
    fontWeight: "800"
  },
  subtitle: {
    color: "#667085",
    fontSize: 14
  },
  sectionTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6
  }
});
