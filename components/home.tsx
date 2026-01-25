import { useAppState } from "@/hooks/state";
import { useCallback, useEffect } from "react";
import { Button, Text, View } from "react-native";
import { useGoals, useSelectedGoal, useUpdateGoal } from "../hooks/goals";

export default function Home() {
  const { data: goals } = useGoals();
  const updateGoal = useUpdateGoal();
  const selectedGoal = useSelectedGoal();
  const [, setAppState] = useAppState();

  useEffect(() => {
    setAppState((draft) => {
      draft.selectedGoal = goals?.[0]?.id;
      return draft;
    });
  }, [goals, setAppState]);

  const handleRecord = useCallback(async () => {
    if (selectedGoal) {
      await updateGoal(selectedGoal.id, { current: selectedGoal.current + 1 });
    }
  }, [selectedGoal, updateGoal]);
  return (
    <View>
      <Text>{selectedGoal?.current ?? 0}</Text>
      <Text>{selectedGoal?.target ?? 0}</Text>
      <Button title="Record" onPress={handleRecord}></Button>
    </View>
  );
}
