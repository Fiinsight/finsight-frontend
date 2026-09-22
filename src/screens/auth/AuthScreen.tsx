import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { getKakaoLoginUrl, login, loginWithKakao, signup } from "../../lib/api";
import { saveAuthSession } from "../../lib/auth";

interface Props {
  onAuthenticated: () => void;
}

export function AuthScreen({ onAuthenticated }: Props) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      const code = new URL(url).searchParams.get("code");
      if (!code) return;
      setBusy(true);
      try {
        await saveAuthSession(await loginWithKakao(code));
        onAuthenticated();
      } catch {
        Alert.alert("카카오 로그인 실패", "카카오 인증 결과를 처리하지 못했습니다.");
      } finally {
        setBusy(false);
      }
    };
    const subscription = Linking.addEventListener("url", handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (url) return handleUrl({ url });
    });
    return () => subscription.remove();
  }, [onAuthenticated]);

  async function submit() {
    if (!email.trim() || password.length < 8 || (isSignup && !nickname.trim())) {
      Alert.alert("입력 확인", isSignup ? "이메일, 8자 이상 비밀번호, 닉네임을 입력해 주세요." : "이메일과 8자 이상 비밀번호를 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const session = isSignup ? await signup(email.trim(), password, nickname.trim()) : await login(email.trim(), password);
      await saveAuthSession(session);
      onAuthenticated();
    } catch (error: any) {
      const message = error?.response?.data?.detail ?? error?.response?.data?.message ?? "로그인 서버에 연결하지 못했습니다.";
      Alert.alert(isSignup ? "회원가입 실패" : "로그인 실패", message);
    } finally {
      setBusy(false);
    }
  }

  async function startKakao() {
    setBusy(true);
    try {
      await Linking.openURL(await getKakaoLoginUrl());
    } catch {
      Alert.alert("카카오 로그인 준비 필요", "백엔드에 KAKAO_CLIENT_ID와 KAKAO_REDIRECT_URI를 설정해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.brandBlock}>
        <Text style={styles.kicker}>FINANCE · INSIGHT · GROWTH</Text>
        <Text style={styles.title}>판단을 기록하면{`\n`}투자가 선명해져요.</Text>
        <Text style={styles.subtitle}>뉴스를 읽고, 내 생각을 남기고, 투자 습관을 키워보세요.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>{isSignup ? "처음 시작하기" : "다시 만나서 반가워요"}</Text>
        {isSignup && <TextInput autoCapitalize="none" placeholder="닉네임" value={nickname} onChangeText={setNickname} style={styles.input} />}
        <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="이메일" value={email} onChangeText={setEmail} style={styles.input} />
        <TextInput secureTextEntry placeholder="비밀번호 (8자 이상)" value={password} onChangeText={setPassword} style={styles.input} />
        <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{busy ? "처리 중..." : isSignup ? "회원가입" : "로그인"}</Text>
        </Pressable>
        <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>또는</Text><View style={styles.line} /></View>
        <Pressable disabled={busy} onPress={startKakao} style={styles.kakao}><Text style={styles.kakaoText}>카카오로 계속하기</Text></Pressable>
        <Pressable onPress={() => setIsSignup((value) => !value)}><Text style={styles.switch}>{isSignup ? "이미 계정이 있어요 · 로그인" : "처음이신가요? · 회원가입"}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F8FC", paddingHorizontal: 24, justifyContent: "center" },
  brandBlock: { marginBottom: 28 },
  kicker: { color: "#175CD3", fontSize: 11, fontWeight: "800", letterSpacing: 1.4, marginBottom: 14 },
  title: { color: "#101828", fontSize: 31, fontWeight: "800", lineHeight: 40, letterSpacing: -1 },
  subtitle: { color: "#667085", fontSize: 14, lineHeight: 22, marginTop: 12 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, shadowColor: "#175CD3", shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  heading: { color: "#101828", fontSize: 20, fontWeight: "800", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#101828", marginBottom: 10 },
  primary: { backgroundColor: "#175CD3", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  pressed: { opacity: 0.82 }, primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 18 }, line: { flex: 1, height: 1, backgroundColor: "#EAECF0" }, or: { color: "#98A2B3", fontSize: 12 },
  kakao: { backgroundColor: "#FEE500", borderRadius: 14, paddingVertical: 15, alignItems: "center" }, kakaoText: { color: "#191919", fontSize: 15, fontWeight: "800" },
  switch: { color: "#175CD3", textAlign: "center", fontSize: 13, fontWeight: "700", marginTop: 18 }
});
