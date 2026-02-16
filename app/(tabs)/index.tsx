import { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { MaterialIcons } from "@expo/vector-icons";
import { TimerDisplay } from "@/components/TimerDisplay";
import { useTimer, formatElapsedMs } from "@/hooks/useTimer";
import { Colors } from "@/constants/Colors";

export default function TimerScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const {
    elapsedMs,
    isRunning,
    hasRecoveryData,
    recoveredElapsedMs,
    start,
    stop,
    discard,
    acceptRecovery,
    discardRecovery,
  } = useTimer();

  // Keep screen awake while timer is running
  useKeepAwake();

  // Show recovery dialog when app detects a crashed session
  useEffect(() => {
    if (hasRecoveryData) {
      const formattedTime = formatElapsedMs(recoveredElapsedMs);
      Alert.alert(
        "Session Recovered",
        `Found an in-progress session (${formattedTime}). Would you like to save it?`,
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: discardRecovery,
          },
          {
            text: "Save",
            onPress: () => {
              acceptRecovery();
              router.push({
                pathname: "/save-session" as never,
                params: { durationMs: recoveredElapsedMs.toString() },
              });
            },
          },
        ]
      );
    }
  }, [hasRecoveryData, recoveredElapsedMs, acceptRecovery, discardRecovery, router]);

  const handleStop = () => {
    stop();
    router.push({
      pathname: "/save-session" as never,
      params: { durationMs: elapsedMs.toString() },
    });
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Session?",
      "Are you sure you want to discard this session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: discard,
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.timerContainer}>
        <TimerDisplay elapsedMs={elapsedMs} />
      </View>

      <View style={styles.controls}>
        {!isRunning ? (
          <Pressable
            onPress={start}
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            accessibilityLabel="Start meditation timer"
            accessibilityRole="button"
          >
            <MaterialIcons name="play-arrow" size={48} color={colors.background} />
          </Pressable>
        ) : (
          <View style={styles.runningControls}>
            <Pressable
              onPress={handleDiscard}
              style={[styles.secondaryButton, { borderColor: colors.error }]}
              accessibilityLabel="Discard session"
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={32} color={colors.error} />
            </Pressable>

            <Pressable
              onPress={handleStop}
              style={[styles.primaryButton, { backgroundColor: colors.success }]}
              accessibilityLabel="Stop and save session"
              accessibilityRole="button"
            >
              <MaterialIcons name="stop" size={48} color={colors.background} />
            </Pressable>
          </View>
        )}
      </View>

      {isRunning && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Tap stop when you finish meditating
        </Text>
      )}

      {!isRunning && elapsedMs === 0 && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Tap play to start your meditation
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  timerContainer: {
    marginBottom: 48,
  },
  controls: {
    alignItems: "center",
  },
  primaryButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  secondaryButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  runningControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  hint: {
    marginTop: 32,
    fontSize: 16,
    textAlign: "center",
  },
});
