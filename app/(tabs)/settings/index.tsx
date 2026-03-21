import { SegmentedControl } from "@/components/SegmentedControl";
import { Colors } from "@/constants/Colors";
import { useRepositories } from "@/data/database-provider";
import { queryKeys } from "@/data/query-keys";
import {
  useStatsSettings,
  type EarliestDateSource,
} from "@/hooks/useStatsSettings";
import { importData } from "@/services/import-data";
import { useQueryClient } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { Directory, File, Paths } from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { useSQLiteContext } from "expo-sqlite";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const EARLIEST_DATE_OPTIONS: { value: EarliestDateSource; label: string }[] = [
  { value: "earliest_goal", label: "Earliest goal" },
  { value: "first_session", label: "First session" },
];

function exportFilename() {
  return `prajna-export-${formatISO(new Date(), { representation: "date" })}.json`;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { sessionRepository, goalRepository } = useRepositories();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const { earliestDateSource, setEarliestDateSource } = useStatsSettings();

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
      const file = new File(Paths.cache, exportFilename());
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
      const file = directory.createFile(exportFilename(), "application/json");
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

  const handleImport = async () => {
    try {
      const picked = await File.pickFileAsync(undefined, "application/json");
      if (!picked) return;
      const file = Array.isArray(picked) ? picked[0] : picked;
      const text = await file.text();
      const json = JSON.parse(text);

      if (!json || typeof json !== "object") {
        Alert.alert("Invalid file", "The file does not contain valid JSON.");
        return;
      }
      if (!Array.isArray(json.sessions) && !Array.isArray(json.goals)) {
        Alert.alert(
          "Invalid format",
          'The JSON file must contain a "sessions" and/or "goals" array.',
        );
        return;
      }

      const result = await importData(db, json);

      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });

      Alert.alert(
        "Import complete",
        `Imported ${result.sessions} session(s) and ${result.goals} goal(s).`,
      );
    } catch {
      Alert.alert(
        "Import failed",
        "Could not import data. Please make sure the file is a valid JSON export.",
      );
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Delete all data?",
      "This will permanently delete all sessions and goals. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.withTransactionAsync(async () => {
                await db.execAsync("DELETE FROM sessions;");
                await db.execAsync("DELETE FROM goals;");
              });
              queryClient.invalidateQueries({
                queryKey: queryKeys.sessions.all,
              });
              queryClient.invalidateQueries({
                queryKey: queryKeys.sessions.stats,
              });
              queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
              Alert.alert("Done", "All data has been deleted.");
            } catch {
              Alert.alert("Error", "Could not delete data. Please try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={[styles.container, {}]}>
      <Text style={[styles.sectionHeader, { color: colors.text }]}>
        Statistics
      </Text>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
          Starting date for stats calculations
        </Text>
        <SegmentedControl
          options={EARLIEST_DATE_OPTIONS}
          value={earliestDateSource}
          onChange={setEarliestDateSource}
          colors={colors}
        />
      </View>

      <Text
        style={[styles.sectionHeader, { color: colors.text, marginTop: 32 }]}
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
      <Pressable
        onPress={handleImport}
        style={[
          styles.exportButton,
          { borderColor: colors.border, marginTop: 12 },
        ]}
      >
        <Text style={[styles.exportButtonText, { color: colors.text }]}>
          Import data from JSON
        </Text>
      </Pressable>
      <Pressable
        onPress={handleDeleteAllData}
        style={[
          styles.exportButton,
          { borderColor: colors.error, marginTop: 12 },
        ]}
      >
        <Text style={[styles.exportButtonText, { color: colors.error }]}>
          Delete all data
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: "center",
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
