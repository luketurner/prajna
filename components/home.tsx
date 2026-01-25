import { useAppState } from "@/hooks/state";
import { getDayOfYear } from "date-fns";
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
  const current = selectedGoal?.current ?? 0;
  const target = selectedGoal?.target ?? 0;

  const now = new Date();
  const dayNumber = getDayOfYear(now);
  const expectedPerDay = target / 365;
  const expectedCurrent = expectedPerDay * dayNumber;

  const realPercent = (100 * current) / target;
  const expectedPercent = (100 * expectedCurrent) / target;
  return (
    <View>
      <Text
        style={{
          marginVertical: 12,
          marginHorizontal: "auto",
        }}
      >
        status {current}/{target} ({realPercent.toFixed(2)}%) &mdash; day{" "}
        {dayNumber} &mdash; expected {expectedCurrent.toFixed(2)} (
        {expectedPercent.toFixed(2)}%)
      </Text>
      <Button title="Record" onPress={handleRecord}></Button>
    </View>
  );
}
