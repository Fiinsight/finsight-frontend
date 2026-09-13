import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { BottomActionBar } from "../../../components/BottomActionBar";
import { ScreenTopBar } from "../../../components/ScreenTopBar";
import type { NewsFlowParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<NewsFlowParamList, "Feedback">;

const choiceLabel: Record<string, string> = {
  UP: "상승",
  NEUTRAL: "중립",
  DOWN: "하락"
};

// 여기서 "정확했어요!/틀렸어요" 같은 결과나 차트를 바로 보여주지 않는 이유:
// 시장이 아직 움직이지 않은 시점이라 진짜 결과 자체가 존재하지 않음. 실제
// 결과는 다음 거래일 장마감 후 스케줄러가 계산해서 '기록' 탭에 채워짐.
export function FeedbackScreen({ route, navigation }: Props) {
  const { ack } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenTopBar title="판단 완료" onBack={() => navigation.goBack()} />

      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={32} color="#12B76A" />
        </View>
        <Text style={styles.title}>{choiceLabel[ack.choice] ?? ack.choice} 판단이 기록됐어요</Text>
        <Text style={styles.message}>{ack.message}</Text>

        <View style={styles.noticeCard}>
          <Ionicons name="time-outline" size={18} color="#175CD3" />
          <Text style={styles.noticeText}>
            실제 시장 결과와 비교한 AI 피드백은 아직 만들어질 수 없어요(시장이 아직 안 움직였으니까요). 다음
            거래일 장 마감 후 자동으로 계산되고, {"\n"}
            <Text style={styles.noticeStrong}>'기록' 탭</Text>에서 확인할 수 있어요.
          </Text>
        </View>
      </View>

      <BottomActionBar label="완료" onPress={() => navigation.popToTop()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
    paddingTop: 60
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#D1FADF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  title: {
    color: "#101828",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center"
  },
  message: {
    color: "#475467",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  noticeCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EFF4FF",
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    alignItems: "flex-start"
  },
  noticeText: {
    flex: 1,
    color: "#344054",
    fontSize: 13,
    lineHeight: 20
  },
  noticeStrong: {
    fontWeight: "800",
    color: "#175CD3"
  }
});
