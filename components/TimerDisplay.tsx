import { Text, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";

interface TimerDisplayProps {
  elapsedMs: number;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function TimerDisplay({ elapsedMs }: TimerDisplayProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <Text
      style={[styles.timer, { color: colors.text }]}
      accessibilityLabel={`Elapsed time: ${formatTime(elapsedMs)}`}
      accessibilityRole="timer"
    >
      {formatTime(elapsedMs)}
    </Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 72,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
  },
});
