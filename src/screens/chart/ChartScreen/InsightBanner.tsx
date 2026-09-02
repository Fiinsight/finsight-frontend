import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ChartDocentContent } from "../../../lib/sampleData";
import type { ChartRelatedNews } from "../../../types/api";
import { ChartDocentPanel } from "./ChartDocentPanel";

interface InsightBannerProps {
  content: ChartDocentContent;
  relatedNews: ChartRelatedNews[];
  onNewsPress: (item: ChartRelatedNews) => void;
}

export function InsightBanner({ content, relatedNews, onNewsPress }: InsightBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} activeOpacity={0.75} onPress={() => setExpanded((prev) => !prev)}>
        <Ionicons name="information-circle" size={18} color="#175CD3" />
        <Text style={styles.title}>{content.insightTitle}</Text>
        <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={10}>
          <Ionicons name="close" size={18} color="#98A2B3" />
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded ? (
        <ChartDocentPanel
          whatHappened={content.whatHappened}
          whyItMoved={content.whyItMoved}
          marketImpact={content.marketImpact}
          relatedNews={relatedNews}
          onNewsPress={onNewsPress}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#EFF4FF",
    borderColor: "#D1E9FF",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  title: {
    flex: 1,
    color: "#175CD3",
    fontSize: 14,
    fontWeight: "800"
  }
});
