import { StyleSheet, Text, View } from "react-native";
import { todayLabelKorean } from "../../../lib/format";

export function HomeHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <Text style={styles.logo}>FinSight</Text>
        <Text style={styles.date}>{todayLabelKorean()}</Text>
      </View>
      <Text style={styles.subtitle}>뉴스를 읽고, 근거 있는 투자 판단으로 연결하세요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    paddingTop: 12
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between"
  },
  logo: {
    color: "#101828",
    fontSize: 32,
    fontWeight: "800"
  },
  date: {
    color: "#98A2B3",
    fontSize: 13,
    fontWeight: "600"
  },
  subtitle: {
    color: "#667085",
    fontSize: 15,
    lineHeight: 22
  }
});
