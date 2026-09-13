import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BottomActionBarProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/** Fixed bottom CTA bar shared by screens with a single primary action. */
export function BottomActionBar({ label, onPress, disabled, loading }: BottomActionBarProps) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} activeOpacity={0.9} disabled={disabled || loading} onPress={onPress}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{label}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    backgroundColor: "#F8FAFC"
  },
  button: {
    backgroundColor: "#175CD3",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 15
  },
  buttonDisabled: {
    backgroundColor: "#98A2B3"
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800"
  }
});
