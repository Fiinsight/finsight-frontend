import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { loadAuthSession } from "../lib/auth";
import { getReadingLog } from "../lib/readingProgress";
import { countDailyReads, isAttendanceComplete, localDateKey, type DailyReadLog } from "../lib/readingProgressModel";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

function mondayOffset(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function AttendanceCard() {
  const [readingLog, setReadingLog] = useState<DailyReadLog>({});
  const [today, setToday] = useState(() => new Date());
  const todayKey = localDateKey(today);
  const offset = mondayOffset(today);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    setToday(new Date());
    void loadAuthSession()
      .then((session) => session ? getReadingLog(session.userId) : {})
      .then((log) => { if (!cancelled) setReadingLog(log); })
      .catch(() => { if (!cancelled) setReadingLog({}); });
    return () => { cancelled = true; };
  }, []));

  const week = WEEKDAYS.map((label, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - offset + index);
    return { label, key: localDateKey(day), isToday: index === offset };
  });
  const completed = week.filter((day) => isAttendanceComplete(readingLog, day.key)).length;
  const todayReadCount = Math.min(countDailyReads(readingLog, todayKey), 3);
  const checkedIn = isAttendanceComplete(readingLog, todayKey);

  return (
    <LinearGradient colors={["#0D1B4C", "#1746B8", "#2A72E8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>기록을 이어가는 중</Text>
          <Text style={styles.title}>오늘의 출석체크 <Text style={styles.titleAccent}>{completed}/7</Text></Text>
          <Text style={styles.subtitle}>{checkedIn ? "오늘 읽기 목표를 달성했어요!" : "기사 상세 3개를 12초 이상 읽으면 수달 배지가 자동으로 찍혀요."}</Text>
        </View>
      </View>

      <View style={styles.readProgress}>
        <Text style={styles.readProgressLabel}>오늘 읽은 기사</Text>
        <Text style={styles.readProgressCount}>{todayReadCount}/3</Text>
      </View>

      <View style={styles.days}>
        {week.map((day) => {
          const done = isAttendanceComplete(readingLog, day.key);
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

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, overflow: "hidden", shadowColor: "#0D1B4C", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  header: { minHeight: 78, flexDirection: "row", alignItems: "center" },
  headerCopy: { flex: 1 },
  kicker: { color: "#B8CBFF", fontSize: 12, fontWeight: "700", letterSpacing: 0.4, marginBottom: 7 },
  title: { color: "#FFFFFF", fontSize: 21, fontWeight: "800", letterSpacing: -0.6 },
  titleAccent: { color: "#86F2DA" },
  subtitle: { color: "#D5E1FF", fontSize: 12, marginTop: 8 },
  readProgress: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 9, marginTop: 14 },
  readProgressLabel: { color: "#D5E1FF", fontSize: 12, fontWeight: "600" },
  readProgressCount: { color: "#86F2DA", fontSize: 13, fontWeight: "800" },
  days: { flexDirection: "row", justifyContent: "space-between", marginTop: 17, marginBottom: 2 },
  dayItem: { alignItems: "center", gap: 6 },
  dayStamp: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,24,76,0.3)" },
  dayToday: { borderColor: "#FFFFFF", borderWidth: 2 },
  stampImage: { width: 32, height: 32, borderRadius: 16 },
  dayMark: { color: "#AFC3F2", fontSize: 20, lineHeight: 22 },
  dayLabel: { color: "#B8CBFF", fontSize: 11, fontWeight: "700" },
  dayLabelToday: { color: "#FFFFFF" },
});
