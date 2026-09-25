import { useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { getApiErrorMessage, getKakaoLoginUrl, login, loginWithKakao, signup } from "../../lib/api";
import { saveAuthSession } from "../../lib/auth";

interface Props { onAuthenticated: () => void; }

export function AuthScreen({ onAuthenticated }: Props) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const handledCode = useRef<string | null>(null);

  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      const code = new URL(url).searchParams.get("code");
      const error = new URL(url).searchParams.get("error");
      if (error) { setBusy(false); Alert.alert("카카오 로그인 취소", "카카오 로그인 화면에서 인증을 완료해 주세요."); return; }
      if (!code) return;
      if (handledCode.current === code) return;
      handledCode.current = code;
      setBusy(true);
      try { await saveAuthSession(await loginWithKakao(code)); onAuthenticated(); }
      catch (loginError) { handledCode.current = null; Alert.alert("카카오 로그인 실패", getApiErrorMessage(loginError, "카카오 인증 결과를 처리하지 못했습니다.")); }
      finally { setBusy(false); }
    };
    const subscription = Linking.addEventListener("url", handleUrl);
    void Linking.getInitialURL().then((url) => { if (url) return handleUrl({ url }); });
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
      await saveAuthSession(session); onAuthenticated();
    } catch (error: any) {
      const message = getApiErrorMessage(error, "로그인 서버에 연결하지 못했습니다.");
      Alert.alert(isSignup ? "회원가입 실패" : "로그인 실패", message);
    } finally { setBusy(false); }
  }

  async function startKakao() {
    setBusy(true);
    try {
      const redirectUri = Linking.createURL("auth/kakao");
      const loginUrl = await getKakaoLoginUrl(redirectUri);
      if (Platform.OS === "web" && typeof window !== "undefined") {
        // On web, openURL runs after an async API call and can be blocked as a
        // popup. Reuse the current tab so the OAuth callback returns to the
        // same Expo web app instance.
        window.location.assign(loginUrl);
      } else {
        await Linking.openURL(loginUrl);
      }
    }
    catch (error: any) {
      const message = getApiErrorMessage(error, "백엔드와 카카오 로그인 설정을 확인해 주세요.");
      Alert.alert("카카오 로그인 준비 필요", message);
    }
    finally { setBusy(false); }
  }

  return (
    <LinearGradient colors={["#071B4A", "#0B3D91", "#1769D1"]} locations={[0, 0.52, 1]} style={styles.screen}>
      <Text style={styles.logo}>FinSight</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>{isSignup ? "회원가입" : "로그인"}</Text>
        {isSignup && <TextInput autoCapitalize="none" placeholder="닉네임" placeholderTextColor="rgba(255,255,255,0.7)" value={nickname} onChangeText={setNickname} style={styles.input} />}
        <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="이메일 아이디 입력" placeholderTextColor="rgba(255,255,255,0.7)" value={email} onChangeText={setEmail} style={styles.input} />
        <TextInput secureTextEntry placeholder="비밀번호 입력" placeholderTextColor="rgba(255,255,255,0.7)" value={password} onChangeText={setPassword} style={styles.input} />
        <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>{busy ? "처리 중..." : isSignup ? "회원가입" : "로그인"}</Text></Pressable>
        <View style={styles.links}>
          {!isSignup && <Pressable style={styles.linkButton}><Text style={styles.link}>비밀번호 찾기</Text></Pressable>}
          <Pressable style={styles.linkButton} onPress={() => setIsSignup((value) => !value)}><Text style={styles.link}>{isSignup ? "로그인" : "회원가입"}</Text></Pressable>
        </View>
        <Text style={styles.socialLabel}>간편하게 로그인하세요.</Text>
        <Pressable disabled={busy} onPress={startKakao} style={styles.kakao}>
          <View style={styles.kakaoIcon}><Text style={styles.kakaoIconText}>TALK</Text></View>
          <Text style={styles.kakaoText}>카카오로 계속하기</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },
  logo: { color: "#FFFFFF", fontFamily: "Avenir Next", fontSize: 32, fontWeight: "800", letterSpacing: -1.1, textAlign: "center", marginBottom: 38 },
  card: { width: "100%", maxWidth: 340, alignSelf: "center" },
  heading: { color: "#FFFFFF", fontFamily: "Pretendard", fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 18 },
  input: { backgroundColor: "rgba(255,255,255,0.17)", borderRadius: 30, paddingHorizontal: 18, paddingVertical: 14, fontFamily: "Pretendard", fontSize: 14, color: "#FFFFFF", marginBottom: 10 },
  primary: { backgroundColor: "#FFFFFF", borderRadius: 30, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  pressed: { opacity: 0.82 },
  primaryText: { color: "#0B3D91", fontFamily: "Pretendard", fontSize: 15, fontWeight: "800" },
  links: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 18, minHeight: 24 },
  linkButton: { minHeight: 24, justifyContent: "center", alignItems: "center" },
  link: { color: "rgba(255,255,255,0.82)", fontFamily: "Pretendard", fontSize: 12, fontWeight: "700" },
  socialLabel: { color: "rgba(255,255,255,0.82)", fontFamily: "Pretendard", fontSize: 12, textAlign: "center", marginTop: 44, marginBottom: 14 },
  kakao: { backgroundColor: "#FEE500", borderRadius: 30, minHeight: 48, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  kakaoIcon: { width: 27, height: 27, borderRadius: 14, backgroundColor: "#191919", alignItems: "center", justifyContent: "center" },
  kakaoIconText: { color: "#FEE500", fontFamily: "Pretendard", fontSize: 7, fontWeight: "900", letterSpacing: -0.4 },
  kakaoText: { color: "#191919", fontFamily: "Pretendard", fontSize: 14, fontWeight: "800" }
});
