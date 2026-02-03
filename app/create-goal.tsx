import { View, StyleSheet, useColorScheme, Alert } from "react-native";
import { useRouter } from "expo-router";
import { GoalForm } from "@/components/GoalForm";
import { useCreateGoal } from "@/hooks/useGoals";
import { Colors } from "@/constants/Colors";

export default function CreateGoalScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  const createGoal = useCreateGoal();

  const handleSubmit = async (data: {
    targetHours: number;
    periodType: "year" | "month" | "custom";
    startDate: string;
    endDate: string;
  }) => {
    try {
      await createGoal.mutateAsync(data);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to create goal. Please try again.");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GoalForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create Goal"
        isSubmitting={createGoal.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
