import { useQuery } from "@tanstack/react-query";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { explainTerm } from "../lib/api";
import { getFallbackTermExplanation } from "../lib/sampleData";

interface TermPopupProps {
  visible: boolean;
  term: string | null;
  newsId: number;
  onClose: () => void;
}

export function TermPopup({ visible, term, newsId, onClose }: TermPopupProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["term-explain", term, newsId],
    queryFn: () => explainTerm({ term: term as string, newsId }),
    enabled: visible && !!term,
    retry: 0
  });

  if (!term) {
    return null;
  }

  const explanation = data ?? getFallbackTermExplanation(term);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.term}>{explanation.term}</Text>
          {isLoading ? <Text style={styles.loading}>불러오는 중...</Text> : null}

          <View style={styles.block}>
            <Text style={styles.blockLabel}>뜻</Text>
            <Text style={styles.blockBody}>{explanation.definition}</Text>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockLabel}>이 뉴스에서는</Text>
            <Text style={styles.blockBody}>{explanation.contextExplanation}</Text>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockLabel}>시장 영향</Text>
            <Text style={styles.blockBody}>{explanation.marketImpact}</Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(16, 24, 40, 0.45)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
    gap: 14
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D0D5DD",
    marginBottom: 4
  },
  term: {
    color: "#101828",
    fontSize: 20,
    fontWeight: "800"
  },
  loading: {
    color: "#98A2B3",
    fontSize: 12
  },
  block: {
    gap: 4
  },
  blockLabel: {
    color: "#175CD3",
    fontSize: 13,
    fontWeight: "800"
  },
  blockBody: {
    color: "#344054",
    fontSize: 14,
    lineHeight: 21
  },
  closeButton: {
    marginTop: 8,
    backgroundColor: "#F2F4F7",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center"
  },
  closeButtonText: {
    color: "#344054",
    fontSize: 15,
    fontWeight: "700"
  }
});
