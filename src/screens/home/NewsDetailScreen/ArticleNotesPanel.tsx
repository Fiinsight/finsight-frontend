import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { createArticleNote, deleteArticleNote, getArticleNotesForNews, updateArticleNote } from "../../../lib/api";
import { toRelativeTimeKorean } from "../../../lib/format";

export function ArticleNotesPanel({ newsId, sourceUrl }: { newsId: number; sourceUrl?: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const queryKey = ["article-notes", newsId];
  const notesQuery = useQuery({ queryKey, queryFn: () => getArticleNotesForNews(newsId), retry: 0 });
  const refreshNotes = () => {
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: ["article-notes"] });
  };

  const createMutation = useMutation({
    mutationFn: () => createArticleNote(newsId, draft.trim()),
    onSuccess: () => { setDraft(""); refreshNotes(); }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => updateArticleNote(id, content.trim()),
    onSuccess: () => { setEditingId(null); setEditingContent(""); refreshNotes(); }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteArticleNote,
    onSuccess: () => { setConfirmDeleteId(null); refreshNotes(); }
  });

  return (
    <View style={styles.card}>
      <View style={styles.browserWindow}>
        <View style={styles.browserBar} accessibilityElementsHidden>
          <View style={styles.trafficLights}>
            <View style={[styles.trafficLight, styles.redLight]} />
            <View style={[styles.trafficLight, styles.yellowLight]} />
            <View style={[styles.trafficLight, styles.greenLight]} />
          </View>
          <View style={styles.browserControls}>
            <Ionicons name="chevron-back" size={16} color="#B5C0CC" />
            <Ionicons name="chevron-forward" size={16} color="#D3DAE2" />
          </View>
          <View style={styles.addressBar}>
            <Ionicons name="add" size={14} color="#B5C0CC" />
            <Text style={styles.addressText}>FinSight · 기사 메모</Text>
            <Ionicons name="refresh-outline" size={14} color="#C1CAD4" />
          </View>
          <Ionicons name="search-outline" size={17} color="#C1CAD4" />
        </View>
        <View style={styles.paper}>
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.title}>기사 메모</Text>
              <Text style={styles.subtitle}>이 기사에서 기억할 점이나 내 생각을 남겨보세요.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="메모 새로고침"
              onPress={() => { void notesQuery.refetch(); }}
              style={styles.iconButton}
            >
              <Ionicons name="reload-outline" size={18} color="#175CD3" />
            </Pressable>
          </View>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          maxLength={1000}
          multiline
          textAlignVertical="top"
          placeholder="예: 매출 증가뿐 아니라 비용과 영업이익도 같이 확인하기"
          placeholderTextColor="#98A2B3"
          style={styles.input}
        />
        <View style={styles.footer}>
          <Text style={styles.count}>{draft.length}/1000</Text>
          <Pressable
            disabled={!draft.trim() || createMutation.isPending}
            onPress={() => createMutation.mutate()}
            style={[styles.primaryButton, (!draft.trim() || createMutation.isPending) && styles.disabledButton]}
          >
            <Text style={styles.primaryText}>{createMutation.isPending ? "저장 중" : "메모 저장"}</Text>
          </Pressable>
        </View>
        {createMutation.isError ? <Text style={styles.error}>메모를 저장하지 못했어요. 연결을 확인하고 다시 시도해주세요.</Text> : null}

        {notesQuery.isLoading ? <Text style={styles.muted}>이 기사에 남긴 메모를 불러오는 중이에요.</Text> : null}
        {notesQuery.isError ? <Text style={styles.error}>저장된 메모를 불러오지 못했어요.</Text> : null}
        {(notesQuery.data ?? []).map((note) => (
          <View key={note.id} style={styles.note}>
            <Text style={styles.noteDate}>{toRelativeTimeKorean(note.updatedAt)} 기록</Text>
            {editingId === note.id ? (
              <>
                <TextInput
                  value={editingContent}
                  onChangeText={setEditingContent}
                  maxLength={1000}
                  multiline
                  textAlignVertical="top"
                  style={styles.input}
                />
                <View style={styles.actions}>
                  <Pressable onPress={() => { setEditingId(null); setEditingContent(""); }} style={styles.secondaryButton}>
                    <Text style={styles.secondaryText}>취소</Text>
                  </Pressable>
                  <Pressable
                    disabled={!editingContent.trim() || updateMutation.isPending}
                    onPress={() => updateMutation.mutate({ id: note.id, content: editingContent })}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryText}>{updateMutation.isPending ? "저장 중" : "수정 저장"}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.noteContent}>{note.content}</Text>
                {confirmDeleteId === note.id ? (
                  <View style={styles.actions}>
                    <Text style={styles.muted}>이 메모를 삭제할까요?</Text>
                    <Pressable onPress={() => setConfirmDeleteId(null)} style={styles.secondaryButton}>
                      <Text style={styles.secondaryText}>취소</Text>
                    </Pressable>
                    <Pressable onPress={() => deleteMutation.mutate(note.id)} style={styles.deleteButton}>
                      <Text style={styles.deleteText}>{deleteMutation.isPending ? "삭제 중" : "삭제"}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.actions}>
                    <Pressable onPress={() => { setEditingId(note.id); setEditingContent(note.content); }} style={styles.secondaryButton}>
                      <Text style={styles.secondaryText}>수정</Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirmDeleteId(note.id)} style={styles.secondaryButton}>
                      <Text style={styles.secondaryText}>삭제</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
        ))}
        {updateMutation.isError || deleteMutation.isError ? <Text style={styles.error}>변경을 저장하지 못했어요. 다시 시도해주세요.</Text> : null}
        <View style={styles.paperFooter}>
          {sourceUrl ? <Pressable accessibilityRole="link" accessibilityLabel="사이트 방문" onPress={() => { void Linking.openURL(sourceUrl); }} style={styles.sitePill}>
            <Ionicons name="open-outline" size={17} color="#101828" />
            <Text style={styles.sitePillText}>사이트 방문</Text>
          </Pressable> : <View />}
          <Ionicons name="expand-outline" size={21} color="#101828" />
        </View>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "transparent" },
  browserWindow: { backgroundColor: "#FFFFFF", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#E3ECF6" },
  browserBar: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, backgroundColor: "#F4F8FC", borderBottomWidth: 1, borderBottomColor: "#E7EEF5" },
  trafficLights: { flexDirection: "row", gap: 4 },
  trafficLight: { width: 8, height: 8, borderRadius: 4 },
  redLight: { backgroundColor: "#F06C62" },
  yellowLight: { backgroundColor: "#F3C65D" },
  greenLight: { backgroundColor: "#61C554" },
  browserControls: { flexDirection: "row", gap: 5, alignItems: "center" },
  addressBar: { flex: 1, height: 30, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, borderRadius: 7, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4EBF2" },
  addressText: { flex: 1, color: "#98A2B3", fontSize: 11 },
  paper: { backgroundColor: "#FFFFFF", padding: 18, gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleCopy: { flex: 1, gap: 2 },
  title: { color: "#101828", fontSize: 19, fontWeight: "800" },
  subtitle: { color: "#667085", fontSize: 13, lineHeight: 19 },
  iconButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#E8F1FF" },
  input: { minHeight: 92, backgroundColor: "#F8FBFF", borderColor: "#D4E5F7", borderWidth: 1, borderRadius: 10, padding: 12, color: "#101828", fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  count: { color: "#98A2B3", fontSize: 12 },
  primaryButton: { backgroundColor: "#175CD3", borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  disabledButton: { backgroundColor: "#98A2B3" },
  primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  secondaryButton: { borderColor: "#D0D5DD", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#FFFFFF" },
  secondaryText: { color: "#475467", fontSize: 12, fontWeight: "700" },
  deleteButton: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#FEF3F2" },
  deleteText: { color: "#B42318", fontSize: 12, fontWeight: "700" },
  note: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: "#EEF2F6" },
  noteDate: { color: "#667085", fontSize: 11 },
  noteContent: { color: "#344054", fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  paperFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  sitePill: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: "#DCEBFA" },
  sitePillText: { color: "#101828", fontSize: 13, fontWeight: "700" },
  muted: { color: "#667085", fontSize: 12 },
  error: { color: "#B42318", fontSize: 12, lineHeight: 18 }
});
