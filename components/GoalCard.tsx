import { View, Text, Pressable, StyleSheet, useColorScheme } from "react-native";
import { format, parseISO } from "date-fns";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import type { GoalWithProgress } from "@/specs/001-meditation-app/contracts/repository-interfaces";

interface GoalCardProps {
  goal: GoalWithProgress;
  onPress: () => void;
}

function formatPeriod(goal: GoalWithProgress): string {
  const start = parseISO(goal.startDate);
  const end = parseISO(goal.endDate);

  if (goal.periodType === "year") {
    return format(start, "yyyy");
  }
  if (goal.periodType === "month") {
    return format(start, "MMMM yyyy");
  }
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

function formatHours(hours: number): string {
  if (hours >= 1) {
    return `${hours.toFixed(1)}h`;
  }
  return `${Math.round(hours * 60)}m`;
}

export function GoalCard({ goal, onPress }: GoalCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const progressHours = goal.progressSeconds / 3600;
  const progressPercent = Math.min(100, goal.progressPercent);

  // Determine status color
  let statusColor: string = colors.tint;
  let statusIcon: keyof typeof MaterialIcons.glyphMap = "hourglass-empty";
  let statusText = "In Progress";

  if (goal.isCompleted) {
    statusColor = colors.success;
    statusIcon = "check-circle";
    statusText = "Completed";
  } else if (goal.isExpired) {
    statusColor = colors.warning;
    statusIcon = "schedule";
    statusText = "Expired";
  }

  // Expected progress status
  const threshold = goal.targetHours * 0.05;
  let deltaColor: string = colors.tint;
  let deltaLabel = "on track";
  if (goal.deltaHours > threshold) {
    deltaColor = colors.success;
    deltaLabel = "ahead";
  } else if (goal.deltaHours < -threshold) {
    deltaColor = colors.warning;
    deltaLabel = "behind";
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`Goal: ${goal.targetHours} hours, ${Math.round(progressPercent)}% complete${!goal.isCompleted && goal.expectedPercent > 0 ? `, ${formatHours(Math.abs(goal.deltaHours))} ${deltaLabel}` : ""}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.targetText, { color: colors.text }]}>
            {goal.targetHours} hours
          </Text>
          <Text style={[styles.periodText, { color: colors.textSecondary }]}>
            {formatPeriod(goal)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <MaterialIcons name={statusIcon} size={16} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarWrapper}>
        <View style={[styles.progressBarBg, { backgroundColor: colors.progressBarBackground }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: statusColor,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
        {!goal.isCompleted && (
          <View
            style={[
              styles.expectedMarker,
              {
                left: `${Math.min(100, goal.expectedPercent)}%`,
                backgroundColor: "rgba(195,188,155,0.5)",
              },
            ]}
          />
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatHours(progressHours)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            completed
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.round(progressPercent)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            progress
          </Text>
        </View>
        {goal.isCompleted ? (
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatHours(goal.remainingHours)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              remaining
            </Text>
          </View>
        ) : goal.expectedPercent === 0 && !goal.isExpired ? (
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>
              —
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              not started
            </Text>
          </View>
        ) : (
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: deltaColor }]}>
              {goal.deltaHours >= 0 ? "+" : "−"}{formatHours(Math.abs(goal.deltaHours))}
            </Text>
            <Text style={[styles.statLabel, { color: deltaColor }]}>
              {deltaLabel}
            </Text>
          </View>
        )}
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  targetText: {
    fontSize: 24,
    fontWeight: "700",
  },
  periodText: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  expectedMarker: {
    position: "absolute",
    top: -2,
    width: 2,
    height: 12,
    borderRadius: 1,
    marginLeft: -1,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
