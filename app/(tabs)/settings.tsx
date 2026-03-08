import { View, Text, StyleSheet, useColorScheme, Pressable, Alert } from "react-native";
import { File, Paths } from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { useRepositories } from "@/data/database-provider";
import { Colors } from "@/constants/Colors";

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { sessionRepository, goalRepository } = useRepositories();

  const handleExport = async () => {
    try {
      const [sessions, goals] = await Promise.all([
        sessionRepository.getAll(),
        goalRepository.getAll(),
      ]);

      const data = JSON.stringify({ sessions, goals }, null, 2);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
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
    </View>
  );
}

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
