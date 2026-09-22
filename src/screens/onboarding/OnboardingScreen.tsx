import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

type OnboardingSlide = {
  eyebrow: string;
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const slides: OnboardingSlide[] = [
  {
    eyebrow: "뉴스 이해",
    title: "경제 뉴스를\n쉽게 읽어요",
    body: "오늘 꼭 알아야 할 뉴스만 골라\n초보자 눈높이로 다시 설명해드려요.",
    icon: "newspaper-outline",
    color: "#315BEA"
  },
  {
    eyebrow: "맥락 학습",
    title: "어려운 용어도\n기사 안에서 배워요",
    body: "금리·환율·실적 같은 용어를\n뉴스 맥락과 함께 이해할 수 있어요.",
    icon: "bulb-outline",
    color: "#7A4DE8"
  },
  {
    eyebrow: "판단과 피드백",
    title: "직접 판단하고\n결과를 돌아봐요",
    body: "상승·중립·하락을 선택한 뒤\n실제 시장 결과와 비교해 학습해요.",
    icon: "analytics-outline",
    color: "#18A879"
  }
];

type Props = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <LinearGradient colors={["#F6F7FF", "#F7F9FF", "#ECF9F6"]} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brand}>FinSight</Text>
        </View>

        <View style={styles.hero}>
          <LinearGradient colors={["#17244E", "#253B70"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroPanel}>
            <View style={styles.heroMeta}>
              <Text style={styles.heroNumber}>{String(index + 1).padStart(2, "0")}</Text>
              <Ionicons name={slide.icon} size={22} color="#67E8C3" />
            </View>
            <Image source={require("../../../assets/finsight-mascot-premium.png")} style={styles.mascot} resizeMode="contain" />
          </LinearGradient>
          <Text style={[styles.eyebrow, { color: slide.color }]}>{slide.eyebrow}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((item, itemIndex) => (
              <View
                key={item.eyebrow}
                style={[styles.progressSegment, itemIndex <= index && { backgroundColor: slide.color }]}
              />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLast ? "FinSight 시작하기" : "다음 온보딩 보기"}
            style={[styles.primaryButton, { backgroundColor: slide.color }]}
            onPress={() => (isLast ? onComplete() : setIndex((current) => current + 1))}
          >
            <Text style={styles.primaryButtonText}>{isLast ? "시작하기" : "다음"}</Text>
            <Ionicons name={isLast ? "checkmark" : "arrow-forward"} size={20} color="#FFFFFF" />
          </Pressable>
          {!isLast && (
            <Pressable accessibilityRole="button" style={styles.skipButton} onPress={onComplete}>
              <Text style={styles.skipText}>건너뛰기</Text>
            </Pressable>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 18, paddingBottom: 18, justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#315BEA", alignItems: "center", justifyContent: "center" },
  brand: { color: "#14284B", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  hero: { paddingBottom: 20 },
  heroPanel: { height: 278, borderRadius: 24, padding: 20, overflow: "hidden", shadowColor: "#15234D", shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 5 },
  heroMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroNumber: { color: "#9BAAD7", fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },
  mascot: { position: "absolute", width: 250, height: 250, right: -18, bottom: -10 },
  eyebrow: { fontSize: 15, fontWeight: "800", marginBottom: 12 },
  title: { color: "#16213A", fontSize: 34, lineHeight: 42, fontWeight: "900", textAlign: "left", letterSpacing: -1.2 },
  body: { color: "#667085", fontSize: 16, lineHeight: 25, textAlign: "left", marginTop: 18 },
  footer: { gap: 14 },
  pagination: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#D9DEEA" },
  primaryButton: { height: 56, borderRadius: 17, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  skipButton: { alignItems: "center", paddingVertical: 3 },
  skipText: { color: "#98A2B3", fontSize: 14, fontWeight: "700" }
});
