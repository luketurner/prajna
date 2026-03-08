import { View, Text, StyleSheet, useColorScheme, Pressable, Alert, ScrollView } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { useRepositories } from "@/data/database-provider";
import { Colors } from "@/constants/Colors";
import {
  useNotificationSettings,
  type NotificationType,
} from "@/hooks/useNotificationSettings";

const NOTIFICATION_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: "silent", label: "Silent" },
  { value: "vibrate", label: "Vibrate" },
  { value: "chime", label: "Chime" },
  { value: "chime_twice", label: "Chime ×2" },
];

function SegmentedControl({
  value,
  onChange,
  colors,
}: {
  value: NotificationType;
  onChange: (v: NotificationType) => void;
  colors: (typeof Colors)["light"];
}) {
  return (
    <View style={[segStyles.row, { borderColor: colors.border }]}>
      {NOTIFICATION_OPTIONS.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              segStyles.segment,
              selected && { backgroundColor: colors.tint },
              i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border },
            ]}
          >
            <Text
              style={[
                segStyles.segmentText,
                { color: selected ? colors.background : colors.text },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { sessionRepository, goalRepository } = useRepositories();
  const { stageEnd, sessionEnd, setStageEnd, setSessionEnd } =
    useNotificationSettings();

  const prepareExportData = async () => {
    const [sessions, goals] = await Promise.all([
      sessionRepository.getAll(),
      goalRepository.getAll(),
    ]);
    return JSON.stringify({ sessions, goals }, null, 2);
  };

  const handleShareData = async () => {
    try {
      const data = await prepareExportData();
      const file = new File(Paths.cache, "meditation-data.json");
      file.write(data);
      await shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Export meditation data",
      });
    } catch {
      Alert.alert("Export failed", "Could not export data. Please try again.");
    }
  };

  const handleSaveToDevice = async () => {
    try {
      const data = await prepareExportData();
      const directory = await Directory.pickDirectoryAsync();
      if (!directory) return;
      const file = directory.createFile("meditation-data.json", "application/json");
      file.write(data);
      Alert.alert("Saved", "Data exported successfully.");
    } catch {
      Alert.alert("Export failed", "Could not save data. Please try again.");
    }
  };

  const handleExport = () => {
    Alert.alert("Export data as JSON", "Choose how to export your data.", [
      { text: "Share", onPress: handleShareData },
      { text: "Save to device", onPress: handleSaveToDevice },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        Notifications
      </Text>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Stage end
        </Text>
        <SegmentedControl value={stageEnd} onChange={setStageEnd} colors={colors} />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Session end
        </Text>
        <SegmentedControl value={sessionEnd} onChange={setSessionEnd} colors={colors} />
      </View>

      <Text
        style={[
          styles.sectionHeader,
          { color: colors.textSecondary, marginTop: 32 },
        ]}
      >
        Data
      </Text>
      <Pressable
        onPress={handleExport}
        style={[styles.exportButton, { borderColor: colors.border }]}
      >
        <Text style={[styles.exportButtonText, { color: colors.text }]}>
          Export data as JSON
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const segStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingRow: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8,
  },
  exportButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
