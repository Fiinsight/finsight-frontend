import { StyleSheet, Text, View } from "react-native";

interface TabScreenHeaderProps {
  title: string;
  subtitle: string;
}

export function TabScreenHeader({ title, subtitle }: TabScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  }
});
