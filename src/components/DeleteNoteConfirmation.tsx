import { Pressable, StyleSheet, Text, View } from "react-native";
export function DeleteNoteConfirmation({pending, onCancel, onConfirm}: {pending:boolean;onCancel:()=>void;onConfirm:()=>void}) {
  return <View style={styles.row}><Text style={styles.text}>이 메모를 삭제할까요?</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="메모 삭제 취소" disabled={pending} onPress={onCancel} style={styles.button}><Text style={styles.text}>취소</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="메모 삭제 확인" disabled={pending} onPress={onConfirm} style={styles.button}><Text style={styles.danger}>{pending ? "삭제 중" : "삭제"}</Text></Pressable>
  </View>;
}
const styles=StyleSheet.create({row:{flexDirection:"row",flexWrap:"wrap",alignItems:"center",justifyContent:"flex-end",gap:8},button:{minHeight:44,padding:10,justifyContent:"center"},text:{fontSize:15,color:"#475467"},danger:{fontSize:15,color:"#B42318",fontWeight:"700"}});
