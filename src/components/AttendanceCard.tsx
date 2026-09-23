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
    <LinearGradient colors={["#0D1B4C", "#1746B8", "#2A72E8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>기록을 이어가는 중</Text>
          <Text style={styles.title}>오늘의 출석체크 <Text style={styles.titleAccent}>{completed}/7</Text></Text>
          <Text style={styles.subtitle}>{checkedIn ? "오늘의 루틴을 기록했어요." : "뉴스 하나 읽고 오늘의 기록을 남겨보세요."}</Text>
        </View>
        <View style={styles.stampPreview}>
          <Image source={require("../../assets/finsight-mascot-face.png")} style={styles.previewImage} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.days}>
        {week.map((day) => {
          const done = attended.includes(day.key);
          return (
            <View key={day.key} style={styles.dayItem}>
              <View style={[styles.dayStamp, day.isToday && styles.dayToday]}>
                {done ? <Image source={require("../../assets/finsight-mascot-face.png")} style={styles.stampImage} resizeMode="contain" /> : <Text style={styles.dayMark}>·</Text>}
              </View>
              <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>{day.label}</Text>
            </View>
          );
        })}
      </View>

      <Pressable accessibilityRole="button" onPress={checkIn} style={[styles.button, checkedIn && styles.buttonDone]}>
        <Text style={styles.buttonText}>{checkedIn ? "오늘 기록 완료" : "오늘 출석하기"}</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, overflow: "hidden", shadowColor: "#0D1B4C", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  header: { minHeight: 86, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerCopy: { flex: 1, paddingRight: 10 },
  kicker: { color: "#B8CBFF", fontSize: 12, fontWeight: "700", letterSpacing: 0.4, marginBottom: 7 },
  title: { color: "#FFFFFF", fontSize: 21, fontWeight: "800", letterSpacing: -0.6 },
  titleAccent: { color: "#86F2DA" },
  subtitle: { color: "#D5E1FF", fontSize: 12, marginTop: 8 },
  stampPreview: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  previewImage: { width: 48, height: 48, borderRadius: 24 },
  days: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, marginBottom: 18 },
  dayItem: { alignItems: "center", gap: 6 },
  dayStamp: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,24,76,0.3)" },
  dayToday: { borderColor: "#FFFFFF", borderWidth: 2 },
  stampImage: { width: 32, height: 32, borderRadius: 16 },
  dayMark: { color: "#AFC3F2", fontSize: 20, lineHeight: 22 },
  dayLabel: { color: "#B8CBFF", fontSize: 11, fontWeight: "700" },
  dayLabelToday: { color: "#FFFFFF" },
  button: { height: 42, borderRadius: 13, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  buttonDone: { backgroundColor: "#DCE6FF" },
  buttonText: { color: "#173A9A", fontSize: 13, fontWeight: "800" }
});
