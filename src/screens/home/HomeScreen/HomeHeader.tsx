import { colors, spacing, typography } from "../../../theme";
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
    paddingTop: spacing.sm
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between"
  },
  logo: {
    color: colors.text,
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold
  },
  date: {
    color: colors.muted,
    fontSize: typography.size.meta,
    fontWeight: typography.weight.semibold
  },
  subtitle: {
    color: colors.secondary,
    fontSize: typography.size.reading,
    lineHeight: typography.lineHeight.body
  }
});
