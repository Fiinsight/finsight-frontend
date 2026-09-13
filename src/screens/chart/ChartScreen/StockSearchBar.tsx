import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";

interface StockSearchBarProps {
  value: string;
  onChange: (text: string) => void;
}

export function StockSearchBar({ value, onChange }: StockSearchBarProps) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={18} color="#98A2B3" />
      <TextInput
        style={styles.input}
        placeholder="종목명 또는 종목코드 검색"
        placeholderTextColor="#98A2B3"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  input: {
    flex: 1,
    color: "#101828",
    fontSize: 14
  }
});
