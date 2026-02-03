import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSessionStats, useTagBreakdown } from "@/hooks/useSessionStats";
import { EmptyState } from "@/components/EmptyState";
import { Colors } from "@/constants/Colors";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDurationLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${hours} hr`;
  }
  return `${minutes} min`;
}

export default function StatsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const { data: tagBreakdown = [], isLoading: breakdownLoading } = useTagBreakdown();

  const isLoading = statsLoading || breakdownLoading;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="insights"
          title="No Statistics Yet"
          message="Start meditating to see your statistics here. Your progress, streaks, and insights will appear once you log sessions."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Time Totals */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Time Meditated
        </Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="all-inclusive" size={24} color={colors.tint} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatDuration(stats.totalSecondsAllTime)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              All Time
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="calendar-today" size={24} color={colors.tint} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatDuration(stats.totalSecondsThisMonth)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              This Month
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="date-range" size={24} color={colors.tint} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatDuration(stats.totalSecondsThisWeek)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              This Week
            </Text>
          </View>
        </View>
      </View>

      {/* Session Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Sessions
        </Text>
        <View style={styles.statsRow}>
          <View style={[styles.statRowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statRowContent}>
              <MaterialIcons name="event" size={28} color={colors.tint} />
              <View style={styles.statRowText}>
                <Text style={[styles.statRowValue, { color: colors.text }]}>
                  {stats.totalSessions}
                </Text>
                <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>
                  Total Sessions
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.statRowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statRowContent}>
              <MaterialIcons name="timer" size={28} color={colors.tint} />
              <View style={styles.statRowText}>
                <Text style={[styles.statRowValue, { color: colors.text }]}>
                  {formatDuration(stats.averageSessionSeconds)}
                </Text>
                <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>
                  Average Session
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Streaks */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Streaks</Text>
        <View style={styles.streakRow}>
          <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="local-fire-department" size={32} color={colors.warning} />
            <Text style={[styles.streakValue, { color: colors.text }]}>
              {stats.currentStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
              Current Streak
            </Text>
            <Text style={[styles.streakUnit, { color: colors.textSecondary }]}>
              {stats.currentStreak === 1 ? "day" : "days"}
            </Text>
          </View>
          <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="emoji-events" size={32} color={colors.success} />
            <Text style={[styles.streakValue, { color: colors.text }]}>
              {stats.longestStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
              Longest Streak
            </Text>
            <Text style={[styles.streakUnit, { color: colors.textSecondary }]}>
              {stats.longestStreak === 1 ? "day" : "days"}
            </Text>
          </View>
        </View>
      </View>

      {/* Tag Breakdown */}
      {tagBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Time by Tag
          </Text>
          <View style={[styles.tagBreakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {tagBreakdown.map((item, index) => (
              <View
                key={item.tagId}
                style={[
                  styles.tagBreakdownRow,
                  index < tagBreakdown.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.tagBreakdownName, { color: colors.text }]}>
                  {item.tagName}
                </Text>
                <Text style={[styles.tagBreakdownValue, { color: colors.tint }]}>
                  {formatDurationLong(item.totalSeconds)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    gap: 10,
  },
  statRowCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statRowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statRowText: {},
  statRowValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  statRowLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: "row",
    gap: 10,
  },
  streakCard: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: "700",
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 12,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  streakUnit: {
    fontSize: 14,
    marginTop: 2,
  },
  tagBreakdownCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  tagBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  tagBreakdownName: {
    fontSize: 15,
    fontWeight: "500",
  },
  tagBreakdownValue: {
    fontSize: 15,
    fontWeight: "600",
  },
});
