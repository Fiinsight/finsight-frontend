import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface ReasonInputProps {
  recommended?: boolean;
  candidates?: string[];
  editable?: boolean;
  value: string;
  onChange: (text: string) => void;
}

export function ReasonInput({ value, onChange, editable = true, recommended = false, candidates = [] }: ReasonInputProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>판단 근거 ({recommended ? "추천" : "선택"})</Text>
      {recommended ? candidates.map((sentence) => <Pressable key={sentence} accessibilityRole="button" accessibilityLabel={`근거로 인용: ${sentence}`} disabled={!editable} onPress={() => onChange([value, `“${sentence}”`].filter(Boolean).join("\n"))} style={styles.candidate}><Text style={styles.label}>{sentence}</Text></Pressable>) : null}
      <TextInput
        accessibilityLabel="판단 근거 입력"
        editable={editable}
        style={styles.input}
        placeholder="어떤 점이 이런 예상으로 이어졌나요?"
        placeholderTextColor="#98A2B3"
        value={value}
        onChangeText={onChange}
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  candidate: { padding: 12, borderRadius: 8, backgroundColor: "#EFF4FF", minHeight: 44 },
  box: {
    gap: 8
  },
  label: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "700"
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 70,
    textAlignVertical: "top",
    color: "#101828",
    fontSize: 14
  }
});
