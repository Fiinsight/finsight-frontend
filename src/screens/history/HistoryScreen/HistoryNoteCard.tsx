import { useState } from "react";
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { deleteArticleNote, updateArticleNote } from "../../../lib/api";
import type { ArticleNote } from "../../../types/api";
import { toRelativeTimeKorean } from "../../../lib/format";
import { DeleteNoteConfirmation } from "../../../components/DeleteNoteConfirmation";

export function HistoryNoteCard({note,onArticle}:{note:ArticleNote;onArticle:()=>void}) {
  const client=useQueryClient();
  const [editing,setEditing]=useState(false), [draft,setDraft]=useState(note.content), [confirm,setConfirm]=useState(false);
  const refresh = (updated:ArticleNote|null) => {
    client.setQueriesData<InfiniteData<{items:ArticleNote[]}>>({queryKey:["article-notes"],predicate:q=>q.queryKey.includes("range")}, old=>old ? {...old,pages:old.pages.map(page=>({...page,items:page.items.flatMap(item=>item.id!==note.id?[item]:updated?[updated]:[])}))}:old);
    void client.invalidateQueries({queryKey:["article-notes"]});
    void client.invalidateQueries({queryKey:["learning-progress"]});
    void client.invalidateQueries({queryKey:["learning-recommendations"]});
  };
  const update=useMutation({mutationFn:()=>updateArticleNote(note.id,draft.trim()),onSuccess:value=>{setEditing(false);refresh(value);}});
  const remove=useMutation({mutationFn:()=>deleteArticleNote(note.id),onSuccess:()=>refresh(null)});
  const busy=update.isPending||remove.isPending;
  return <View style={styles.card}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${note.newsTitle} 기사로 이동`} onPress={onArticle} style={{gap:6}}><Text style={styles.meta}>{note.source || "뉴스"} · {toRelativeTimeKorean(note.createdAt)}</Text><Text style={styles.title} numberOfLines={2}>{note.newsTitle}</Text>{!editing?<Text style={styles.content} numberOfLines={4}>{note.content}</Text>:null}</Pressable>
    {editing ? <><TextInput accessibilityLabel="메모 수정 내용" multiline maxLength={1000} value={draft} onChangeText={setDraft} style={styles.input}/><View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="메모 수정 취소" disabled={busy} onPress={()=>setEditing(false)} style={styles.button}><Text style={styles.link}>취소</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="메모 수정 저장" disabled={busy||!draft.trim()} onPress={()=>update.mutate()} style={styles.button}><Text style={styles.link}>{update.isPending?"저장 중":"수정 저장"}</Text></Pressable></View></>
    :confirm ? <DeleteNoteConfirmation pending={remove.isPending} onCancel={()=>setConfirm(false)} onConfirm={()=>remove.mutate()}/>
    :<View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="메모 수정" onPress={()=>{setDraft(note.content);setEditing(true);update.reset();remove.reset();}} style={styles.button}><Text style={styles.link}>수정</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="메모 삭제" onPress={()=>{setConfirm(true);remove.reset();}} style={styles.button}><Text style={styles.link}>삭제</Text></Pressable></View>}
    {update.isError||remove.isError?<Text accessibilityRole="alert" style={styles.error}>변경을 저장하지 못했어요. 연결을 확인하고 다시 시도해주세요.</Text>:null}
  </View>;
}
const styles=StyleSheet.create({card:{backgroundColor:"#FFFFFF",borderColor:"#D0D5DD",borderWidth:1,borderRadius:14,padding:16,gap:10},meta:{color:"#667085",fontSize:13},title:{fontSize:16,lineHeight:23,fontWeight:"700",color:"#101828"},content:{fontSize:15,lineHeight:23,color:"#475467"},input:{minHeight:100,borderWidth:1,borderColor:"#D0D5DD",borderRadius:8,padding:12,fontSize:15,color:"#101828"},actions:{flexDirection:"row",justifyContent:"flex-end",gap:8},button:{minHeight:44,padding:10,justifyContent:"center"},link:{color:"#175CD3",fontSize:15,fontWeight:"600"},error:{color:"#B42318",fontSize:15,lineHeight:22}});
