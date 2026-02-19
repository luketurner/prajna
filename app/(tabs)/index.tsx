import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useKeepAwake } from "expo-keep-awake";
import { MaterialIcons } from "@expo/vector-icons";
import Storage from "expo-sqlite/kv-store";
import { TimerDisplay } from "@/components/TimerDisplay";
import { DurationInput } from "@/components/DurationInput";
import { useTimer, formatElapsedMs } from "@/hooks/useTimer";
import { useAlarm } from "@/hooks/useAlarm";
import { useTimerNotification } from "@/hooks/useTimerNotification";
import { Colors } from "@/constants/Colors";
import type { TimerMode } from "@/hooks/useTimer";

const DURATION_MINUTES_KEY = "duration_minutes";

export default function TimerScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const {
    elapsedMs,
    displayMs,
    isRunning,
    mode,
    hasRecoveryData,
    recoveredElapsedMs,
    start,
    stop,
    discard,
    reset,
    acceptRecovery,
    discardRecovery,
  } = useTimer();
  const { playAlarm, stopAlarm } = useAlarm();
  const {
    requestPermissions,
    updateTimerNotification,
    dismissTimerNotification,
    scheduleAlarmNotification,
    cancelAlarmNotification,
  } = useTimerNotification();

  const [durationMinutes, setDurationMinutes] = useState<number | null>(() => {
    try {
      const stored = Storage.getItemSync(DURATION_MINUTES_KEY);
      if (stored != null) return parseInt(stored, 10);
    } catch {}
    return null;
  });
  const prevModeRef = useRef<TimerMode | null>(null);
  const notificationPermittedRef = useRef(false);
  const navigatedToSaveRef = useRef(false);

  // Persist duration whenever it changes
  const handleDurationChange = useCallback((value: number | null) => {
    setDurationMinutes(value);
    if (value != null) {
      Storage.setItemSync(DURATION_MINUTES_KEY, value.toString());
    } else {
      Storage.removeItemSync(DURATION_MINUTES_KEY);
    }
  }, []);

  // Reset timer when returning from save-session screen
  useFocusEffect(
    useCallback(() => {
      if (navigatedToSaveRef.current) {
        navigatedToSaveRef.current = false;
        reset();
      }
    }, [reset])
  );

  // Keep screen awake while timer is running
  useKeepAwake();

  // Detect countdown → overtime transition and trigger alarm
  useEffect(() => {
    if (prevModeRef.current === "countdown" && mode === "overtime") {
      playAlarm();
    }
    prevModeRef.current = mode;
  }, [mode, playAlarm]);

  // Update notification on each display tick
  useEffect(() => {
    if (!isRunning || !notificationPermittedRef.current) return;

    const formattedTime = formatElapsedMs(displayMs);
    const subtitle =
      mode === "countdown"
        ? "Countdown"
        : mode === "overtime"
          ? "Overtime"
          : "Meditating";

    // Fire-and-forget — don't block the UI
    updateTimerNotification(formattedTime, subtitle);
  }, [displayMs, isRunning, mode, updateTimerNotification]);

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
              navigatedToSaveRef.current = true;
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

  const handleStart = async () => {
    const targetMs =
      durationMinutes != null ? durationMinutes * 60 * 1000 : null;

    // Request notification permissions (first-use prompt)
    const permitted = await requestPermissions();
    notificationPermittedRef.current = permitted;

    start(targetMs);

    // Schedule background alarm notification for countdown mode
    if (permitted && targetMs != null) {
      const seconds = Math.round(targetMs / 1000);
      scheduleAlarmNotification(seconds);
    }
  };

  const handleStop = () => {
    stopAlarm();
    dismissTimerNotification();
    cancelAlarmNotification();
    stop();
    navigatedToSaveRef.current = true;
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
          onPress: () => {
            stopAlarm();
            dismissTimerNotification();
            cancelAlarmNotification();
            discard();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isRunning && (
        <DurationInput
          value={durationMinutes}
          onChange={handleDurationChange}
          disabled={isRunning}
        />
      )}

      <View style={styles.timerContainer}>
        {mode === "overtime" && (
          <Text style={[styles.modeLabel, { color: colors.textSecondary }]}>
            Overtime
          </Text>
        )}
        <TimerDisplay elapsedMs={displayMs} />
        {mode === "countdown" && (
          <Text style={[styles.modeLabel, { color: colors.textSecondary }]}>
            Remaining
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        {!isRunning ? (
          <Pressable
            onPress={handleStart}
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
    alignItems: "center",
  },
  modeLabel: {
    fontSize: 14,
    marginBottom: 4,
    marginTop: 4,
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
