import { View, Text, Pressable, StyleSheet, useColorScheme } from "react-native";
import { format, parseISO } from "date-fns";
import { Colors } from "@/constants/Colors";
import type { SessionWithTags } from "@/specs/001-meditation-app/contracts/repository-interfaces";

interface SessionCardProps {
  session: SessionWithTags;
  onPress: () => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function SessionCard({ session, onPress }: SessionCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const date = parseISO(session.date);
  const formattedDate = format(date, "EEE, MMM d");
  const duration = formatDuration(session.durationSeconds);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`Session on ${formattedDate}, ${duration}`}
    >
      <View style={styles.mainRow}>
        <View style={styles.leftSection}>
          <Text style={[styles.date, { color: colors.text }]}>{formattedDate}</Text>
          <Text style={[styles.duration, { color: colors.tint }]}>{duration}</Text>
        </View>
        <View style={styles.sourceIndicator}>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
            {session.source === "timer" ? "Timed" : "Manual"}
          </Text>
        </View>
      </View>

      {session.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {session.tags.map((tag) => (
            <View
              key={tag.id}
              style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}
            >
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                {tag.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
  },
  duration: {
    fontSize: 18,
    fontWeight: "700",
  },
  sourceIndicator: {},
  sourceText: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
