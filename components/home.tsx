import { useAppState } from "@/hooks/state";
import { getDayOfYear, getDaysInYear } from "date-fns";
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
  const ratio = Math.min(current / target, 1);

  const now = new Date();
  const dayNumber = getDayOfYear(now);
  const daysInYear = getDaysInYear(now);
  const expectedPerDay = target / daysInYear;
  const expectedCurrent = expectedPerDay * dayNumber;
  const expectedRatio = expectedCurrent / target;

  const realPercent = 100 * ratio;
  const expectedPercent = 100 * expectedRatio;

  const diffRatio = ratio - expectedRatio;
  const excessRatio = Math.max(0, diffRatio);
  const deficitRatio = Math.abs(Math.min(0, diffRatio));
  return (
    <View>
      <View
        style={{
          marginHorizontal: "auto",
          marginVertical: 12,
        }}
      >
        <View
          style={{
            width: 75,
            height: 500,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          {/* Missing */}
          <View
            style={{
              borderRadius: 5,
              flexGrow: 1,
            }}
          ></View>
          {excessRatio > 0 ? (
            <View
              style={{
                height: 500 * excessRatio,
                backgroundColor: "#d9f99d", // lime-200
                borderRadius: 5,
                borderColor: "#bef264", // lime-300
                borderWidth: 1,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: 80,
                  width: 200,
                }}
              >
                <Text>{(100 * excessRatio).toFixed(1)}% excess!!</Text>
              </View>
            </View>
          ) : null}
          {deficitRatio > 0 ? (
            <View
              style={{
                height: 500 * deficitRatio,
                backgroundColor: "#fde68a", // amber-200
                borderRadius: 5,
                borderColor: "#fcd34d", // amber-300
                borderWidth: 1,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: 80,
                  width: 200,
                }}
              >
                <Text>{(100 * deficitRatio).toFixed(1)}% deficit</Text>
              </View>
            </View>
          ) : null}
          {ratio - excessRatio > 0 ? (
            <View
              style={{
                height: 500 * (ratio - excessRatio),
                backgroundColor: "#a7f3d0", // emerald-200
                borderRadius: 5,
                borderColor: "#6ee7b7", // emerald-300
                borderWidth: 1,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: 80,
                  width: 200,
                }}
              >
                <Text>{(100 * (ratio - excessRatio)).toFixed(1)}% done!</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

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
