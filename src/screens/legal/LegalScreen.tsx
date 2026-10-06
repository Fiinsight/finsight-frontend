import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import { ScreenTopBar } from "../../components/ScreenTopBar";

const terms = [
  ["서비스 목적", "FinSight는 경제 뉴스 이해와 판단 기록을 돕는 졸업작품용 학습 서비스입니다. 실제 금융 거래 기능을 제공하지 않습니다."],
  ["투자 관련 안내", "뉴스 설명, 퀴즈, 차트, 예측 비교는 학습 자료이며 투자 자문이나 특정 종목의 매수·매도 권유가 아닙니다. 정보의 최신성·완전성·수익을 보장하지 않으며 투자 판단과 책임은 이용자에게 있습니다."],
  ["콘텐츠 이용", "뉴스는 요약과 짧은 발췌 및 출처 링크를 중심으로 제공합니다. 기사 원문의 권리는 각 작성자와 매체에 있으며 원문은 출처 사이트에서 확인하세요."],
  ["이용 원칙", "다른 사람의 계정을 사용하거나 개인정보를 게시하지 마세요. 서비스 오류를 이용한 반복 호출이나 무단 접근을 금지합니다."],
  ["서비스 제한", "졸업작품의 테스트 운영 환경이므로 기능이 변경되거나 중단될 수 있습니다. 연결 실패나 데이터 부족은 확인 불가 상태로 안내합니다."],
];
const privacy = [
  ["문안 적용 범위", "이 문안은 졸업작품 테스트 운영용 기본 안내입니다. 정식 서비스 운영 전 운영 주체·연락처·보유기간 등 실제 운영 정보와 처리 절차를 확정해 안내해야 합니다."],
  ["처리하는 정보", "가입·로그인에 사용하는 이메일, 닉네임, 인증 정보와 학습 설정, 판단·기사 메모·퀴즈 답변 기록을 계정 관리 및 사용자별 학습 제공에 사용합니다. 비밀번호는 서버에서 해시로 저장합니다."],
  ["기기 저장 정보", "로그인 유지에 필요한 인증 정보와 읽은 기사·출석 정보, 일부 학습 설정은 사용하는 기기에 저장될 수 있습니다. 다른 기기의 읽기 기록과 일치하지 않을 수 있습니다."],
  ["정보 이용", "사용자 기록은 학습·복습과 판단 비교를 위한 것이며 투자 자문에 사용하지 않습니다. 테스트 계정에는 실제 개인 금융정보를 입력하지 마세요."],
  ["외부 연결", "원문 링크를 열거나 외부 로그인 기능을 사용하면 해당 사이트의 정책이 적용됩니다. 시장 정보 등 외부 서비스 연결은 필요한 정보 요청에 사용하며, 이 문안만으로 제공자별 보유기간이나 처리 위치를 보장하지 않습니다."],
  ["삭제 요청과 운영 전 확인", "기록 삭제와 계정 관련 문의를 처리할 운영 연락처는 정식 운영 전에 등록해야 합니다. 현재 앱에 없는 탈퇴·삭제 기능이나 처리 기한을 보장하지 않습니다."],
];
export function LegalScreen({ kind, onBack }: { kind: "terms" | "privacy"; onBack: () => void }) {
  return <SafeAreaView style={styles.screen}><ScreenTopBar title={kind === "terms" ? "이용약관" : "개인정보처리방침"} onBack={onBack} />
    <ScrollView contentContainerStyle={styles.content}><Text style={styles.note}>졸업작품 테스트 운영용 기본 문안</Text>
      {(kind === "terms" ? terms : privacy).map(([heading, body]) => <Text key={heading} style={styles.body}><Text style={styles.heading}>{heading}{"\n"}</Text>{body}</Text>)}
    </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#F8FAFC" }, content: { padding: 20, gap: 20 }, note: { color: "#667085", fontSize: 13 }, heading: { fontWeight: "700", color: "#101828" }, body: { fontSize: 14, lineHeight: 23, color: "#344054" } });
