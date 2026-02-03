import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { format, parseISO } from "date-fns";
import { MaterialIcons } from "@expo/vector-icons";
import { useGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/useGoals";
import { GoalForm } from "@/components/GoalForm";
import { Colors } from "@/constants/Colors";

function formatHours(hours: number): string {
  if (hours >= 1) {
    return `${hours.toFixed(1)} hours`;
  }
  return `${Math.round(hours * 60)} minutes`;
}

export default function GoalDetailScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();

  const id = parseInt(goalId ?? "0", 10);
  const { data: goal, isLoading } = useGoal(id);
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGoal.mutateAsync(id);
              router.back();
            } catch {
              Alert.alert("Error", "Failed to delete goal.");
            }
          },
        },
      ]
    );
  };

  const handleUpdate = async (data: {
    targetHours: number;
    periodType: "year" | "month" | "custom";
    startDate: string;
    endDate: string;
  }) => {
    try {
      await updateGoal.mutateAsync({
        id,
        ...data,
      });
      setIsEditing(false);
    } catch {
      Alert.alert("Error", "Failed to update goal.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Goal not found</Text>
      </View>
    );
  }

  if (isEditing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GoalForm
          initialTargetHours={goal.targetHours}
          initialPeriodType={goal.periodType}
          initialStartDate={goal.startDate}
          initialEndDate={goal.endDate}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          submitLabel="Update Goal"
          isSubmitting={updateGoal.isPending}
        />
      </View>
    );
  }

  const progressHours = goal.progressSeconds / 3600;
  const progressPercent = Math.min(100, goal.progressPercent);

  // Determine status
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20", alignSelf: "flex-start" }]}>
          <MaterialIcons name={statusIcon} size={20} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>

        {/* Target */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Target
          </Text>
          <Text style={[styles.targetValue, { color: colors.text }]}>
            {goal.targetHours} hours
          </Text>
        </View>

        {/* Period */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Period
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {format(parseISO(goal.startDate), "MMM d, yyyy")} -{" "}
            {format(parseISO(goal.endDate), "MMM d, yyyy")}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Progress
          </Text>
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
          <Text style={[styles.progressText, { color: colors.text }]}>
            {formatHours(progressHours)} of {goal.targetHours} hours (
            {Math.round(progressPercent)}%)
          </Text>
        </View>

        {/* Remaining */}
        {!goal.isCompleted && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Remaining
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {formatHours(goal.remainingHours)}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => setIsEditing(true)}
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
          >
            <MaterialIcons name="edit" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={[styles.actionButton, styles.deleteButton, { borderColor: colors.error }]}
            disabled={deleteGoal.isPending}
          >
            <MaterialIcons name="delete" size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
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
    padding: 24,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  targetValue: {
    fontSize: 36,
    fontWeight: "700",
  },
  value: {
    fontSize: 18,
    fontWeight: "500",
  },
  progressBarBg: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
