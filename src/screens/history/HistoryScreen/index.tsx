import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getArticleNotesRange, getJudgementHistoryRange } from "../../../lib/api";
import { loadAuthSession } from "../../../lib/auth";
import { groupRecords, judgementSummary, kstDate, recentRange } from "../../../lib/historyRecords";
import { toRelativeTimeKorean } from "../../../lib/format";
import type { HistoryStackParamList } from "../../../navigation/types";
import { AttendanceCard } from "../../../components/AttendanceCard";
import { TabScreenHeader } from "../../../components/TabScreenHeader";
import { HistoryItem } from "./HistoryItem";

type Props = NativeStackScreenProps<HistoryStackParamList, "History">;

export function HistoryScreen({ navigation }: Props) {
  const [tab, setTab] = useState<"judgements" | "notes">("judgements");
  const [today, setToday] = useState(() => kstDate(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<number | null | undefined>();
  useFocusEffect(useCallback(() => {
    let active = true;
    const day = kstDate(new Date());
    if (day !== today) { setToday(day); setSelectedDate(null); }
    void loadAuthSession().then((session) => { if (active) setOwnerId(session?.userId ?? null); }).catch(() => { if (active) setOwnerId(null); });
    return () => { active = false; };
  }, [today]));
  const initialRange = recentRange(today);
  const historyQuery = useInfiniteQuery({
    queryKey: ["judgement-history", ownerId, initialRange],
    initialPageParam: initialRange,
    queryFn: ({ pageParam, signal }) => getJudgementHistoryRange(pageParam, signal),
    getNextPageParam: (page) => page.nextRange,
    enabled: typeof ownerId === "number" && tab === "judgements",
    retry: 0, staleTime: 60_000, refetchOnWindowFocus: false, refetchOnReconnect: false
  });
  const notesQuery = useInfiniteQuery({
    queryKey: ["article-notes", ownerId, "range", initialRange],
    initialPageParam: initialRange,
    queryFn: ({ pageParam, signal }) => getArticleNotesRange(pageParam, signal),
    getNextPageParam: (page) => page.nextRange,
    enabled: typeof ownerId === "number" && tab === "notes",
    retry: 0, staleTime: 60_000, refetchOnWindowFocus: false, refetchOnReconnect: false
  });
  const history = [...new Map((historyQuery.data?.pages.flatMap((page) => page.items) ?? []).map((item) => [item.id, item])).values()];
  const notes = [...new Map((notesQuery.data?.pages.flatMap((page) => page.items) ?? []).map((item) => [item.id, item])).values()];
  const historyGroups = groupRecords(history, (item) => item.judgedAt, today, selectedDate);
  const noteGroups = groupRecords(notes, (item) => item.createdAt, today, selectedDate);
  const activeQuery = tab === "judgements" ? historyQuery : notesQuery;
  const groups = tab === "judgements" ? historyGroups : noteGroups;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TabScreenHeader title="기록" subtitle="출석과 투자 판단을 함께 돌아보세요" />
        <AttendanceCard selectedDate={selectedDate} onSelectDate={(day) => setSelectedDate((current) => current === day ? null : day)} />
        <View style={styles.tabs} accessibilityRole="tablist">
          {(["judgements", "notes"] as const).map((value) => (
            <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }}
              onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.selectedTab]}>
              <Text style={[styles.tabText, tab === value && styles.selectedTabText]}>{value === "judgements" ? "판단 기록" : "기사 메모"}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionSubtitle}>{selectedDate ? `${selectedDate} 기록만 표시합니다. 선택한 요일을 다시 누르면 해제돼요.` : "최근 7일 기록부터 보여드려요."}</Text>
        {selectedDate ? <Pressable accessibilityRole="button" onPress={() => setSelectedDate(null)}><Text style={styles.reviewLink}>날짜 필터 해제</Text></Pressable> : null}
        {ownerId === null ? <Text style={styles.errorText}>로그인 정보를 확인할 수 없습니다.</Text> : ownerId === undefined || activeQuery.isLoading ? <Text style={styles.emptyText}>기록을 불러오는 중이에요.</Text> : null}
        {activeQuery.isError ? <View style={styles.emptyCard}>
          <Text style={styles.errorText}>기록을 불러오지 못했어요. 이미 불러온 기록은 유지합니다.</Text>
          <Pressable accessibilityRole="button" onPress={() => { if (activeQuery.isFetchNextPageError) void activeQuery.fetchNextPage(); else void activeQuery.refetch(); }}><Text style={styles.reviewLink}>다시 시도</Text></Pressable>
        </View> : null}
        {typeof ownerId === "number" && !activeQuery.isLoading && !activeQuery.isError && groups.length === 0 ? <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{tab === "judgements" ? "이 기간에는 판단 기록이 없어요" : "이 기간에는 기사 메모가 없어요"}</Text>
          <Text style={styles.emptyText}>{tab === "judgements" ? "뉴스를 읽고 남긴 판단이 여기에 표시돼요." : "기사에서 기억하고 싶은 내용을 메모해보세요."}</Text>
        </View> : null}
        {tab === "judgements" ? historyGroups.map((group) => {
          const summary = judgementSummary(group.items);
          return <View key={group.key} style={styles.group}>
            <View style={styles.groupHeader}><Text style={styles.sectionTitle}>{group.label}</Text>
              <Text style={styles.groupSummary}>{`판단 ${summary.total}건 · 적중 ${summary.hits} · 결과 대기 ${summary.pending}${summary.unavailable ? ` · 확인 불가 ${summary.unavailable}` : ""}`}</Text>
            </View>
            {group.items.map((item) => <HistoryItem key={item.id} item={item} onPress={() => navigation.navigate("JudgementDetail", { item })} />)}
          </View>;
        }) : noteGroups.map((group) => <View key={group.key} style={styles.group}>
          <View style={styles.groupHeader}><Text style={styles.sectionTitle}>{group.label}</Text><Text style={styles.groupSummary}>메모 {group.items.length}건</Text></View>
          {group.items.map((note) => <TouchableOpacity key={note.id} accessibilityRole="button" style={styles.noteCard} activeOpacity={0.85} onPress={() => navigation.navigate("NewsDetail", { newsId: note.newsId })}>
            <View style={styles.noteHeader}><Text style={styles.noteSource} numberOfLines={1}>{note.source || "뉴스"}</Text><Text style={styles.noteDate}>{toRelativeTimeKorean(note.createdAt)}</Text></View>
            <Text style={styles.noteTitle} numberOfLines={2}>{note.newsTitle}</Text><Text style={styles.noteContent} numberOfLines={4}>{note.content}</Text>
            <Text style={styles.reviewLink}>기사 다시 읽기 →</Text>
          </TouchableOpacity>)}
        </View>)}
        {!selectedDate && activeQuery.hasNextPage && !activeQuery.isError ? <Pressable accessibilityRole="button" disabled={activeQuery.isFetching} style={styles.moreButton} onPress={() => void activeQuery.fetchNextPage()}>
          <Text style={styles.reviewLink}>{activeQuery.isFetchingNextPage ? "이전 기록을 불러오는 중…" : "이전 기록 더 보기"}</Text>
        </Pressable> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", padding: 4, borderRadius: 12, backgroundColor: "#EAECF0" },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center", borderRadius: 9 },
  selectedTab: { backgroundColor: "#FFFFFF" },
  tabText: { color: "#667085", fontSize: 15, fontWeight: "700" },
  selectedTabText: { color: "#175CD3" },
  group: { gap: 10, marginTop: 10 },
  groupHeader: { gap: 5 },
  groupSummary: { color: "#475467", fontSize: 12, lineHeight: 19 },
  moreButton: { padding: 16, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: "#D0D5DD" },
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 12
  },
  sectionTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8
  },
  sectionSubtitle: { color: "#667085", fontSize: 13, lineHeight: 19, marginTop: 0 },
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
