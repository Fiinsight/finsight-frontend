import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { createArticleNote, deleteArticleNote, getArticleNotesForNews, updateArticleNote } from "../../../lib/api";
import { toRelativeTimeKorean } from "../../../lib/format";

export function ArticleNotesPanel({ newsId }: { newsId: number }) {
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
      <Text style={styles.title}>이 기사에 메모</Text>
      <Text style={styles.subtitle}>나중에 다시 읽고 싶은 생각이나 배운 점을 남겨보세요.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#EEF4FF", borderRadius: 14, padding: 16, gap: 10 },
  title: { color: "#175CD3", fontSize: 17, fontWeight: "800" },
  subtitle: { color: "#667085", fontSize: 13, lineHeight: 19 },
  input: { minHeight: 92, backgroundColor: "#FFFFFF", borderColor: "#D0D5DD", borderWidth: 1, borderRadius: 10, padding: 12, color: "#101828", fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  count: { color: "#98A2B3", fontSize: 12 },
  primaryButton: { backgroundColor: "#175CD3", borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  disabledButton: { backgroundColor: "#98A2B3" },
  primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  secondaryButton: { borderColor: "#D0D5DD", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#FFFFFF" },
  secondaryText: { color: "#475467", fontSize: 12, fontWeight: "700" },
  deleteButton: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#FEF3F2" },
  deleteText: { color: "#B42318", fontSize: 12, fontWeight: "700" },
  note: { borderTopWidth: 1, borderTopColor: "#D6E4FF", paddingTop: 12, gap: 8 },
  noteDate: { color: "#667085", fontSize: 11 },
  noteContent: { color: "#344054", fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  muted: { color: "#667085", fontSize: 12 },
  error: { color: "#B42318", fontSize: 12, lineHeight: 18 }
});
