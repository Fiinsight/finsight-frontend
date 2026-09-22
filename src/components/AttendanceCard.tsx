import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const STORAGE_KEY = "finsight.learning.attendance";
const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function mondayOffset(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function AttendanceCard() {
  const [attended, setAttended] = useState<string[]>([]);
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const offset = mondayOffset(today);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => setAttended(value ? JSON.parse(value) : []))
      .catch(() => setAttended([]));
  }, []);

  const week = WEEKDAYS.map((label, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - offset + index);
    return { label, key: dateKey(day), isToday: index === offset };
  });
  const completed = week.filter((day) => attended.includes(day.key)).length;
  const checkedIn = attended.includes(todayKey);

  const checkIn = () => {
    if (checkedIn) return;
    const next = [...attended, todayKey].slice(-60);
    setAttended(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <LinearGradient colors={["#111C3D", "#1E2C66", "#183A67"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>오늘의 투자 루틴</Text>
          <Text style={styles.title}>출석체크 <Text style={styles.titleAccent}>{completed}/7</Text></Text>
          <Text style={styles.subtitle}>{checkedIn ? "오늘의 뉴스 학습을 완료했어요." : "뉴스 하나 읽고 오늘의 루틴을 시작해요."}</Text>
        </View>
        <Image source={require("../../assets/finsight-mascot-premium.png")} style={styles.mascot} resizeMode="contain" />
      </View>
      <View style={styles.days}>
        {week.map((day) => {
          const done = attended.includes(day.key);
          return (
            <View key={day.key} style={styles.dayItem}>
              <View style={[styles.daySquare, done && styles.dayDone, day.isToday && styles.dayToday]}>
                <Text style={[styles.dayMark, done && styles.dayMarkDone]}>{done ? "✓" : "·"}</Text>
              </View>
              <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>{day.label}</Text>
            </View>
          );
        })}
      </View>
      <Pressable accessibilityRole="button" onPress={checkIn} style={[styles.button, checkedIn && styles.buttonDone]}>
        <Text style={styles.buttonText}>{checkedIn ? "오늘 출석 완료" : "오늘 출석하기"}</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 26, padding: 20, overflow: "hidden", shadowColor: "#12204A", shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  accentBar: { position: "absolute", top: 0, left: 20, width: 64, height: 4, backgroundColor: "#61F2C2" },
  header: { minHeight: 104, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: "#AAB8E8", fontSize: 12, fontWeight: "800", letterSpacing: 0.7, marginBottom: 7 },
  title: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", letterSpacing: -0.8 },
  titleAccent: { color: "#61F2C2" },
  subtitle: { color: "#C8D2F1", fontSize: 12, marginTop: 8 },
  mascot: { width: 84, height: 92, marginRight: -2 },
  days: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, marginBottom: 18 },
  dayItem: { alignItems: "center", gap: 6 },
  daySquare: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: "#526392", alignItems: "center", justifyContent: "center", backgroundColor: "#26366A" },
  dayDone: { backgroundColor: "#31D9A3", borderColor: "#31D9A3" },
  dayToday: { borderColor: "#FFFFFF", borderWidth: 2 },
  dayMark: { color: "#90A0D0", fontSize: 20, lineHeight: 22 },
  dayMarkDone: { color: "#10204B", fontSize: 16, fontWeight: "900" },
  dayLabel: { color: "#9EABD6", fontSize: 11, fontWeight: "700" },
  dayLabelToday: { color: "#FFFFFF" },
  button: { height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  buttonDone: { backgroundColor: "#30447F" },
  buttonText: { color: "#1B2A5A", fontSize: 13, fontWeight: "900" }
});
