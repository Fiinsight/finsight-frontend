import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { ProfileHeader } from "./ProfileHeader";
import { SettingsList } from "./SettingsList";

export function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ProfileHeader />
        <SettingsList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 24
  }
});
