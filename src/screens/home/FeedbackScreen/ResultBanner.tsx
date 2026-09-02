import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { formatPercent } from "../../../lib/format";

interface ResultBannerProps {
  aligned: boolean;
  actualChangePercent: number;
  symbolName: string;
}

export function ResultBanner({ aligned, actualChangePercent, symbolName }: ResultBannerProps) {
  return (
    <View style={[styles.banner, aligned ? styles.bannerAligned : styles.bannerMissed]}>
      <View style={styles.titleRow}>
        <Ionicons name={aligned ? "checkmark-circle" : "alert-circle"} size={20} color={aligned ? "#12B76A" : "#175CD3"} />
        <Text style={[styles.title, { color: aligned ? "#12B76A" : "#175CD3" }]}>
          {aligned ? "정확한 판단입니다!" : "판단과 실제 결과가 달랐어요"}
        </Text>
      </View>
      <Text style={styles.subtitle}>
        {symbolName} 실제 변동률{" "}
        <Text style={[styles.change, { color: actualChangePercent >= 0 ? "#D92D20" : "#175CD3" }]}>{formatPercent(actualChangePercent)}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 6
  },
  bannerAligned: {
    backgroundColor: "#ECFDF3",
    borderColor: "#ABEFC6"
  },
  bannerMissed: {
    backgroundColor: "#EFF4FF",
    borderColor: "#D1E9FF"
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  title: {
    fontSize: 17,
    fontWeight: "800"
  },
  subtitle: {
    color: "#475467",
    fontSize: 14
  },
  change: {
    fontWeight: "800"
  }
});
