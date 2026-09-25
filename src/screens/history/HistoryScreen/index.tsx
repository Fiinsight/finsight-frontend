import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { getDailyNotes, getJudgementHistory, saveTodayNote } from "../../../lib/api";
import { sampleJudgementHistory } from "../../../lib/sampleData";
import type { HistoryStackParamList } from "../../../navigation/types";
import { AttendanceCard } from "../../../components/AttendanceCard";
import { HistoryItem } from "./HistoryItem";

type Props = NativeStackScreenProps<HistoryStackParamList, "History">;

export function HistoryScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const { data } = useQuery({
    queryKey: ["judgement-history"],
    queryFn: getJudgementHistory,
    retry: 0
  });
  const { data: notes = [] } = useQuery({
    queryKey: ["daily-notes"],
    queryFn: getDailyNotes,
    retry: 0
  });
  useEffect(() => {
    setNote(notes[0]?.content ?? "");
  }, [notes]);
  const saveNote = useMutation({
    mutationFn: () => saveTodayNote(note.trim()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily-notes"] })
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

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>오늘의 한 줄</Text>
          <Text style={styles.noteSubtitle}>오늘 읽은 뉴스와 내 생각을 짧게 남겨보세요.</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={280}
            placeholder="오늘 시장을 보며 든 생각은?"
            placeholderTextColor="#98A2B3"
            style={styles.noteInput}
          />
          <View style={styles.noteFooter}>
            <Text style={styles.noteCount}>{note.length}/280</Text>
            <Pressable disabled={!note.trim() || saveNote.isPending} onPress={() => saveNote.mutate()} style={[styles.saveButton, (!note.trim() || saveNote.isPending) && styles.saveButtonDisabled]}>
              <Text style={styles.saveButtonText}>{saveNote.isPending ? "저장 중" : "저장"}</Text>
            </Pressable>
          </View>
          {saveNote.isError ? <Text style={styles.noteError}>기록을 저장하지 못했어요. 잠시 후 다시 시도해주세요.</Text> : null}
        </View>

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
  },
  noteCard: { backgroundColor: "#EEF4FF", borderRadius: 14, padding: 16, gap: 8, marginTop: 4 },
  noteTitle: { color: "#175CD3", fontSize: 16, fontWeight: "800" },
  noteSubtitle: { color: "#667085", fontSize: 12 },
  noteInput: { backgroundColor: "#FFFFFF", borderColor: "#D0D5DD", borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, color: "#101828", fontSize: 14 },
  noteFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  noteCount: { color: "#98A2B3", fontSize: 11 },
  saveButton: { backgroundColor: "#175CD3", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  saveButtonDisabled: { backgroundColor: "#98A2B3" },
  saveButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  noteError: { color: "#B42318", fontSize: 12 }
});
