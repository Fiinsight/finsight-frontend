import { StyleSheet, Text, TextInput, View } from "react-native";

interface ReasonInputProps {
  value: string;
  onChange: (text: string) => void;
}

export function ReasonInput({ value, onChange }: ReasonInputProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>판단 근거 (선택)</Text>
      <TextInput
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
