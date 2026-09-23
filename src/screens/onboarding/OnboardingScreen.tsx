import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import type { OnboardingAnswer } from "../../lib/onboarding";

type Option = { label: string; description?: string };

const steps: Array<{ title: string; options: Option[] }> = [
  { title: "현재 투자 상태는\n어떤가요?", options: [
    { label: "투자를 처음 시작해요" },
    { label: "기본 용어는 알아요" },
    { label: "직접 투자하고 있어요" },
    { label: "분석을 더 깊게 하고 싶어요" }
  ] },
  { title: "FinSight에서\n무엇을 얻고 싶나요?", options: [
    { label: "경제 뉴스 쉽게 읽기" },
    { label: "투자 판단 기록하기" },
    { label: "시장 흐름 이해하기" },
    { label: "나만의 투자 습관 만들기" }
  ] },
  { title: "공부할 때\n어떤 스타일인가요?", options: [
    { label: "짧게, 핵심만 보고 싶어요", description: "하루 5분 루틴" },
    { label: "맥락을 깊게 이해하고 싶어요", description: "근거와 함께 학습" },
    { label: "직접 판단하며 배우고 싶어요", description: "예측과 피드백" },
    { label: "아직 잘 모르겠어요", description: "FinSight가 추천해드려요" }
  ] }
];

type Props = { onComplete: (answers: OnboardingAnswer[]) => void };

export function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const isWelcome = step === 0;
  const questionIndex = step - 1;
  const question = steps[questionIndex];
  const selected = answers[questionIndex];
  const isLast = step === steps.length;

  const choose = (index: number) => setAnswers((current) => { const next = [...current]; next[questionIndex] = index; return next; });
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
      <LinearGradient colors={["#F8FAFF", "#F5F8FF", "#EEF9F5"]} style={styles.background}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.brandRow}><Text style={styles.brand}>FinSight</Text></View>
            {!isWelcome && <Text style={styles.stepText}>{step}/{steps.length}</Text>}
          </View>
          {!isWelcome && <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(step / steps.length) * 100}%` }]} /></View>}

          {isWelcome ? <View style={styles.welcomeArea}>
            <View style={styles.welcomeCopy}><Text style={styles.overline}>YOUR DAILY INVESTING ROUTINE</Text><Text style={styles.welcomeTitle}>뉴스를 읽고,{"\n"}판단을 기록하고,{"\n"}<Text style={styles.accent}>성장해요.</Text></Text><Text style={styles.welcomeBody}>FinSight가 당신의 투자 공부 스타일에 맞춰{"\n"}어려운 시장 이야기를 쉽게 정리해드려요.</Text></View>
            <View style={styles.mascotStage}><View style={styles.stageLine} /><Image source={require("../../../assets/finsight-mascot-premium.png")} style={styles.welcomeMascot} resizeMode="contain" /><View style={styles.stageLabel}><Text style={styles.stageLabelText}>LEARN · JUDGE · GROW</Text></View></View>
          </View> : <View style={styles.questionArea}>
            <Text style={styles.questionKicker}>ABOUT YOUR ROUTINE</Text><Text style={styles.questionTitle}>{question.title}</Text>
            <View style={styles.options}>{question.options.map((option, index) => { const active = selected === index; return <Pressable key={option.label} accessibilityRole="button" onPress={() => choose(index)} style={[styles.option, active && styles.optionActive]}><View style={styles.optionCopy}><Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option.label}</Text>{option.description && <Text style={styles.optionDescription}>{option.description}</Text>}</View></Pressable>; })}</View>
          </View>}

          <View style={styles.footer}><Pressable accessibilityRole="button" onPress={next} style={[styles.primaryButton, !isWelcome && selected === undefined && styles.primaryButtonDisabled]}><Text style={styles.primaryButtonText}>{isWelcome ? "처음 시작하기" : isLast ? "FinSight 시작하기" : "다음"}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => onComplete(buildAnswers())} style={styles.skipButton}><Text style={styles.skipText}>{isWelcome ? "이미 계정이 있어요" : "건너뛰기"}</Text></Pressable></View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFF" }, background: { flex: 1 }, content: { flex: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 16 }, topBar: { height: 42, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, brandRow: { flexDirection: "row", alignItems: "center" }, brand: { color: "#14284B", fontSize: 20, fontWeight: "900", letterSpacing: -0.5 }, stepText: { color: "#8A96B2", fontSize: 12, fontWeight: "800" }, progressTrack: { height: 4, backgroundColor: "#E1E7F2", borderRadius: 2, overflow: "hidden", marginTop: 11 }, progressFill: { height: 4, backgroundColor: "#4263C7", borderRadius: 2 }, welcomeArea: { flex: 1, justifyContent: "space-between", paddingTop: 52 }, welcomeCopy: { paddingHorizontal: 3 }, overline: { color: "#4263C7", fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 16 }, welcomeTitle: { color: "#16213A", fontSize: 36, lineHeight: 45, fontWeight: "900", letterSpacing: -1.5 }, accent: { color: "#4263C7" }, welcomeBody: { color: "#667085", fontSize: 15, lineHeight: 24, marginTop: 20 }, mascotStage: { height: 300, marginHorizontal: -24, overflow: "hidden", backgroundColor: "#EAF0FF", justifyContent: "flex-end", alignItems: "center" }, stageLine: { position: "absolute", left: 0, right: 0, bottom: 63, height: 1, backgroundColor: "#C8D5F6" }, welcomeMascot: { width: 265, height: 265, marginBottom: 24 }, stageLabel: { position: "absolute", bottom: 24, backgroundColor: "#DCE6FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }, stageLabelText: { color: "#4263C7", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, questionArea: { flex: 1, paddingTop: 46 }, questionKicker: { color: "#4263C7", fontSize: 11, fontWeight: "900", letterSpacing: 1.1, marginBottom: 13 }, questionTitle: { color: "#16213A", fontSize: 31, lineHeight: 40, fontWeight: "900", letterSpacing: -1.1, marginBottom: 28 }, options: { gap: 10 }, option: { minHeight: 66, backgroundColor: "rgba(255,255,255,0.82)", borderWidth: 1, borderColor: "#E1E6F0", borderRadius: 14, paddingHorizontal: 16, justifyContent: "center" }, optionActive: { borderColor: "#4263C7", backgroundColor: "#EEF2FF", shadowColor: "#4263C7", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, optionCopy: { flex: 1 }, optionLabel: { color: "#25304A", fontSize: 14, fontWeight: "800" }, optionLabelActive: { color: "#294DB6" }, optionDescription: { color: "#8A96B2", fontSize: 12, marginTop: 4 }, footer: { gap: 12, paddingTop: 16 }, primaryButton: { height: 56, borderRadius: 15, backgroundColor: "#315BEA", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, shadowColor: "#315BEA", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 3 }, primaryButtonDisabled: { backgroundColor: "#B8C1D4", shadowOpacity: 0 }, primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }, skipButton: { alignItems: "center", paddingVertical: 3 }, skipText: { color: "#8A96B2", fontSize: 13, fontWeight: "700" }
});
