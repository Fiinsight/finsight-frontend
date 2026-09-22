import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Option = { label: string; description?: string };

const steps: Array<{ title: string; options: Option[] }> = [
  {
    title: "지금 투자 여정을\n어디쯤 걷고 있나요?",
    options: [
      { label: "이제 막 시작했어요" },
      { label: "조금씩 알아가고 있어요" },
      { label: "직접 투자하고 있어요" },
      { label: "아직 잘 모르겠어요" },
    ],
  },
  {
    title: "투자할 때 가장\n알고 싶은 것은 무엇인가요?",
    options: [
      { label: "뉴스 내용을 쉽게 이해하고 싶어요" },
      { label: "투자 판단 기준을 만들고 싶어요" },
      { label: "시장 흐름을 읽고 싶어요" },
      { label: "내 투자 기록을 돌아보고 싶어요" },
    ],
  },
  {
    title: "나에게 맞는 투자 공부 방식은\n어떤 모습인가요?",
    options: [
      { label: "짧게, 매일 조금씩", description: "부담 없이 이어가는 루틴" },
      { label: "한 번에 깊이 있게", description: "근거와 맥락까지 차분하게" },
      { label: "궁금한 것부터 자유롭게", description: "필요한 순간에 바로 배우기" },
      { label: "아직 정하지 않았어요", description: "핀사이트가 함께 찾아볼게요" },
    ],
  },
  {
    title: "투자 소식을 접할 때\n가장 어려운 점은 무엇인가요?",
    options: [
      { label: "용어가 어려워요" },
      { label: "정보가 너무 많아요" },
      { label: "판단할 근거가 부족해요" },
      { label: "기록하고 돌아보기 어려워요" },
    ],
  },
  {
    title: "오늘 핀사이트에서\n어떤 습관을 시작해볼까요?",
    options: [
      { label: "뉴스 하나 읽기" },
      { label: "내 생각 한 줄 기록하기" },
      { label: "투자 판단 돌아보기" },
      { label: "매일 5분 이어가기" },
    ],
  },
];

type OnboardingAnswer = { question: string; answer: string };
type Props = { onComplete: (answers: OnboardingAnswer[]) => void };

export function OnboardingScreen({ onComplete }: Props) {
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const characterProgress = useRef(new Animated.Value(0)).current;
  const isWelcome = step === 0;
  const questionIndex = step - 1;
  const question = steps[questionIndex];
  const selected = answers[questionIndex];
  const isLast = step === steps.length;
  const characterTravel = Math.max(width - 88, 190);

  useEffect(() => {
    Animated.timing(characterProgress, { toValue: step / steps.length, duration: 420, useNativeDriver: false }).start();
  }, [characterProgress, step]);

  const choose = (index: number) => {
    setAnswers((current) => {
      const next = [...current];
      next[questionIndex] = index;
      return next;
    });
  };

  const next = () => {
    if (isWelcome) return setStep(1);
    if (selected === undefined) return;
    if (isLast) return onComplete(buildAnswers());
    setStep((current) => current + 1);
  };

  const buildAnswers = (): OnboardingAnswer[] =>
    steps.flatMap((item, index) => {
      const answerIndex = answers[index];
      const answer = answerIndex === undefined ? undefined : item.options[answerIndex]?.label;
      return answer ? [{ question: item.title, answer }] : [];
    });

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#071B4A", "#0B3D91", "#1769D1"]} locations={[0, 0.52, 1]} style={styles.background}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>FinSight</Text>
            {!isWelcome && <Text style={styles.stepText}>{step}/{steps.length}</Text>}
          </View>

          {isWelcome ? (
            <View style={styles.welcomeArea}>
              <View style={styles.welcomeCopy}>
                <Text style={styles.welcomeTitle}>시장을 읽는 힘은{`\n`}작은 기록에서 시작돼요.</Text>
                <Text style={styles.welcomeBody}>뉴스를 읽고, 내 생각을 남기고,{`\n`}조금씩 나만의 투자 기준을 만들어가요.</Text>
              </View>
            </View>
          ) : (
            <View style={styles.questionArea}>
              <View style={styles.progressArea}>
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, { width: characterProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
                  <Animated.Image
                    source={require("../../../assets/finsight-mascot-face.png")}
                    resizeMode="contain"
                    style={[styles.progressMascot, { transform: [{ translateX: characterProgress.interpolate({ inputRange: [0, 1], outputRange: [0, characterTravel] }) }] }]}
                  />
                </View>
              </View>
              <Text style={styles.questionTitle}>{question.title}</Text>
              <View style={styles.options}>
                {question.options.map((option, index) => {
                  const active = selected === index;
                  return (
                    <Pressable key={option.label} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => choose(index)} style={[styles.option, active && styles.optionActive]}>
                      <View style={styles.optionCopy}>
                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option.label}</Text>
                        {option.description && <Text style={styles.optionDescription}>{option.description}</Text>}
                      </View>
                      <Text style={[styles.check, active && styles.checkActive]}>{active ? "✓" : ""}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <Pressable accessibilityRole="button" onPress={next} style={[styles.primaryButton, !isWelcome && selected === undefined && styles.primaryButtonDisabled]}>
              <Text style={styles.primaryButtonText}>{isWelcome ? "시작하기" : isLast ? "시작하기" : "다음"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onComplete(buildAnswers())} style={styles.skipButton}>
              <Text style={styles.skipText}>{isWelcome ? "이미 계정이 있어요" : "건너뛰기"}</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#071B4A" }, background: { flex: 1 }, content: { flex: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 16 }, topBar: { height: 42, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, brand: { color: "#FFFFFF", fontFamily: "Avenir Next", fontSize: 18, fontWeight: "800", letterSpacing: -0.5 }, stepText: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700" }, welcomeArea: { flex: 1, justifyContent: "center", paddingBottom: 76 }, welcomeCopy: { width: "100%", paddingHorizontal: 3, alignItems: "center" }, welcomeTitle: { color: "#FFFFFF", fontFamily: "Pretendard", fontSize: 31, lineHeight: 42, fontWeight: "700", letterSpacing: -1.1, textAlign: "center" }, welcomeBody: { color: "rgba(255,255,255,0.78)", fontFamily: "Pretendard", fontSize: 15, lineHeight: 26, fontWeight: "500", letterSpacing: -0.2, textAlign: "center", marginTop: 28 }, questionArea: { flex: 1, paddingTop: 30 }, progressArea: { height: 62, justifyContent: "flex-end", marginBottom: 32 }, progressFill: { position: "absolute", left: 0, bottom: 5, height: 5, backgroundColor: "#FFFFFF", borderRadius: 3 }, progressTrack: { height: 42, position: "relative", justifyContent: "flex-end", overflow: "visible", borderBottomWidth: 5, borderBottomColor: "rgba(255,255,255,0.35)" }, progressMascot: { position: "absolute", bottom: -3, left: 0, width: 46, height: 40, zIndex: 2 }, questionTitle: { color: "#FFFFFF", fontSize: 26, lineHeight: 35, fontWeight: "800", letterSpacing: -0.9, marginBottom: 24 }, options: { gap: 10 }, option: { minHeight: 66, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(255,255,255,0.65)", borderRadius: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center" }, optionActive: { borderColor: "#FFFFFF", backgroundColor: "#DCE8FF", shadowColor: "#0C64C9", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, optionCopy: { flex: 1 }, optionLabel: { color: "#25304A", fontSize: 13, fontWeight: "700" }, optionLabelActive: { color: "#294DB6" }, optionDescription: { color: "#6D7B95", fontSize: 11, marginTop: 4 }, check: { width: 24, color: "#D7DDE9", fontSize: 20, fontWeight: "800", textAlign: "center" }, checkActive: { color: "#294DB6" }, footer: { gap: 12, paddingTop: 16 }, primaryButton: { height: 54, borderRadius: 15, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#0C64C9", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 3 }, primaryButtonDisabled: { backgroundColor: "rgba(255,255,255,0.45)", shadowOpacity: 0 }, primaryButtonText: { color: "#0B3D91", fontSize: 15, fontWeight: "800" }, skipButton: { alignItems: "center", paddingVertical: 3 }, skipText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700" },
});
