import { StyleSheet, Text, View } from "react-native";
import type { ChartRelatedNews } from "../../../types/api";
import { RelatedNewsList } from "./RelatedNewsList";

interface ChartDocentPanelProps {
  whatHappened: string;
  whyItMoved: string;
  marketImpact: string;
  relatedNews: ChartRelatedNews[];
  onNewsPress: (item: ChartRelatedNews) => void;
}

export function ChartDocentPanel({ whatHappened, whyItMoved, marketImpact, relatedNews, onNewsPress }: ChartDocentPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.block}>
        <Text style={styles.label}>무슨 일이 있었나요?</Text>
        <Text style={styles.body}>{whatHappened}</Text>
      </View>

      <View style={styles.highlightBox}>
        <Text style={styles.highlightLabel}>왜 주가가 올랐나요?</Text>
        <Text style={styles.highlightBody}>{whyItMoved}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>시장 영향</Text>
        <Text style={styles.body}>{marketImpact}</Text>
      </View>

      <RelatedNewsList items={relatedNews} onPress={onNewsPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 16,
    marginTop: 4
  },
  block: {
    gap: 4
  },
  label: {
    color: "#101828",
    fontSize: 14,
    fontWeight: "800"
  },
  body: {
    color: "#475467",
    fontSize: 14,
    lineHeight: 21
  },
  highlightBox: {
    backgroundColor: "#FFFAEB",
    borderRadius: 8,
    padding: 14,
    gap: 4
  },
  highlightLabel: {
    color: "#B54708",
    fontSize: 14,
    fontWeight: "800"
  },
  highlightBody: {
    color: "#93370D",
    fontSize: 14,
    lineHeight: 21
  }
});
