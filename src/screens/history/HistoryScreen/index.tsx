import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getArticleNotes, getJudgementHistory } from "../../../lib/api";
import { toRelativeTimeKorean } from "../../../lib/format";
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
  const notesQuery = useQuery({
    queryKey: ["article-notes"],
    queryFn: getArticleNotes,
    retry: 0
  });

  const history = data ?? sampleJudgementHistory;
  const notes = notesQuery.data ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>기록</Text>
          <Text style={styles.subtitle}>출석과 투자 판단을 함께 돌아보세요</Text>
        </View>

        <AttendanceCard />

        <Text style={styles.sectionTitle}>기사 메모 복습</Text>
        <Text style={styles.sectionSubtitle}>기사에서 남긴 생각을 다시 읽고, 원문으로 돌아가 복습해보세요.</Text>
        {notesQuery.isLoading ? <Text style={styles.emptyText}>메모를 불러오는 중이에요.</Text> : null}
        {notesQuery.isError ? <Text style={styles.errorText}>메모를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</Text> : null}
        {!notesQuery.isLoading && !notesQuery.isError && notes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 저장한 기사 메모가 없어요</Text>
            <Text style={styles.emptyText}>기사를 읽다가 기억하고 싶은 내용을 메모하면 여기에 쌓여요.</Text>
          </View>
        ) : null}
        {notes.map((note) => (
          <TouchableOpacity
            key={note.id}
            style={styles.noteCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("NewsDetail", { newsId: note.newsId })}
          >
            <View style={styles.noteHeader}>
              <Text style={styles.noteSource} numberOfLines={1}>{note.source || "뉴스"}</Text>
              <Text style={styles.noteDate}>{toRelativeTimeKorean(note.updatedAt)}</Text>
            </View>
            <Text style={styles.noteTitle} numberOfLines={2}>{note.newsTitle}</Text>
            <Text style={styles.noteContent} numberOfLines={4}>{note.content}</Text>
            <Text style={styles.reviewLink}>기사 다시 읽기 →</Text>
          </TouchableOpacity>
        ))}

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
    marginTop: 8
  },
  sectionSubtitle: { color: "#667085", fontSize: 13, lineHeight: 19, marginTop: -6 },
  noteCard: { backgroundColor: "#FFFFFF", borderColor: "#D0D5DD", borderWidth: 1, borderRadius: 14, padding: 16, gap: 9 },
  noteHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  noteSource: { color: "#175CD3", fontSize: 12, fontWeight: "700", flex: 1 },
  noteDate: { color: "#98A2B3", fontSize: 11 },
  noteTitle: { color: "#101828", fontSize: 15, lineHeight: 21, fontWeight: "800" },
  noteContent: { color: "#475467", fontSize: 14, lineHeight: 21 },
  reviewLink: { alignSelf: "flex-start", color: "#175CD3", fontSize: 12, fontWeight: "800", marginTop: 2 },
  emptyCard: { backgroundColor: "#EEF4FF", borderRadius: 14, padding: 18, gap: 6 },
  emptyTitle: { color: "#182B59", fontSize: 15, fontWeight: "800" },
  emptyText: { color: "#667085", fontSize: 13, lineHeight: 19 },
  errorText: { color: "#B42318", fontSize: 13, lineHeight: 19 }
});
