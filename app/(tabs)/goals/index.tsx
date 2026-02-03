import { FlatList, StyleSheet, useColorScheme, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useGoals } from "@/hooks/useGoals";
import { GoalCard } from "@/components/GoalCard";
import { EmptyState } from "@/components/EmptyState";
import { Colors } from "@/constants/Colors";

export default function GoalsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  const { data: goals = [], isLoading } = useGoals();

  const handleGoalPress = (goalId: number) => {
    router.push(`/goals/${goalId}` as never);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (goals.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="flag"
          title="No Goals Yet"
          message="Set a meditation goal to track your progress. Tap the + button to create your first goal."
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <GoalCard goal={item} onPress={() => handleGoalPress(item.id)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  listContent: {
    paddingVertical: 12,
  },
});
