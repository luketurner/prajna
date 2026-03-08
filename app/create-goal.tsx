import { GoalForm } from "@/components/GoalForm";
import { Colors } from "@/constants/Colors";
import { useCreateGoal } from "@/hooks/useGoals";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <GoalForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create Goal"
        isSubmitting={createGoal.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
