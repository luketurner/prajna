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
import * as Notifications from "expo-notifications";
import Storage from "expo-sqlite/kv-store";
import { TimerDisplay } from "@/components/TimerDisplay";
import { StagesInput } from "@/components/StagesInput";
import { useTimer, formatElapsedMs } from "@/hooks/useTimer";
import { useAlarm } from "@/hooks/useAlarm";
import { useTimerNotification } from "@/hooks/useTimerNotification";
import { Colors } from "@/constants/Colors";

const STAGES_MINUTES_KEY = "stages_minutes";

export default function TimerScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const {
    elapsedMs,
    displayMs,
    isRunning,
    mode,
    currentStageIndex,
    totalStages,
    completedStageCount,
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
    scheduleStageAlarmNotifications,
    cancelAlarmNotifications,
  } = useTimerNotification();

  const [stagesMinutes, setStagesMinutes] = useState<number[]>(() => {
    try {
      const stored = Storage.getItemSync(STAGES_MINUTES_KEY);
      if (stored != null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [15]; // default: single 15-minute stage
  });

  const prevCompletedRef = useRef(0);
  const notificationPermittedRef = useRef(false);
  const navigatedToSaveRef = useRef(false);
  const alarmCountRef = useRef(0); // tracks how many alarms we've already fired

  // Persist stages whenever they change
  const handleStagesChange = useCallback((value: number[]) => {
    setStagesMinutes(value);
    Storage.setItemSync(STAGES_MINUTES_KEY, JSON.stringify(value));
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

  // Detect stage completions and play alarms
  useEffect(() => {
    if (completedStageCount > prevCompletedRef.current) {
      // Play alarms for each newly completed stage
      for (let i = prevCompletedRef.current; i < completedStageCount; i++) {
        const isFinal = i === totalStages - 1;
        // Slight delay for chaining if multiple stages completed at once
        const delay = (i - prevCompletedRef.current) * 500;
        setTimeout(() => {
          playAlarm(isFinal ? 2 : 1);
        }, delay);
      }
      prevCompletedRef.current = completedStageCount;
    }
  }, [completedStageCount, totalStages, playAlarm]);

  // Reset alarm tracking when timer starts
  useEffect(() => {
    if (isRunning && completedStageCount === 0) {
      prevCompletedRef.current = 0;
      alarmCountRef.current = 0;
    }
  }, [isRunning, completedStageCount]);

  // Backup: listen for OS-delivered alarm notification (fires even if the
  // interval-based transition hasn't been processed yet)
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data?.type === "meditation-alarm") {
        const stageIndex = typeof data.stageIndex === "number" ? data.stageIndex : -1;
        if (stageIndex >= 0 && stageIndex >= alarmCountRef.current) {
          const isFinal = Boolean(data.isFinal);
          alarmCountRef.current = stageIndex + 1;
          playAlarm(isFinal ? 2 : 1);
        }
      }
    });
    return () => sub.remove();
  }, [playAlarm]);

  // Update notification on each display tick
  useEffect(() => {
    if (!isRunning || !notificationPermittedRef.current) return;

    const formattedTime = formatElapsedMs(displayMs);
    let subtitle: string;
    if (mode === "overtime") {
      subtitle = "Overtime";
    } else if (mode === "countdown" && totalStages > 1) {
      subtitle = `Stage ${Math.min(currentStageIndex + 1, totalStages)} of ${totalStages}`;
    } else if (mode === "countdown") {
      subtitle = "Countdown";
    } else {
      subtitle = "Meditating";
    }

    // Fire-and-forget — don't block the UI
    updateTimerNotification(formattedTime, subtitle);
  }, [displayMs, isRunning, mode, currentStageIndex, totalStages, updateTimerNotification]);

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
    prevCompletedRef.current = 0;
    alarmCountRef.current = 0;

    const stagesMs = stagesMinutes.map((m) => m * 60 * 1000);

    // Request notification permissions (first-use prompt)
    const permitted = await requestPermissions();
    notificationPermittedRef.current = permitted;

    start(stagesMs);

    // Schedule background alarm notifications for each stage boundary
    if (permitted) {
      scheduleStageAlarmNotifications(stagesMs);
    }
  };

  const handleStop = () => {
    stopAlarm();
    dismissTimerNotification();
    cancelAlarmNotifications();
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
            cancelAlarmNotifications();
            discard();
          },
        },
      ]
    );
  };

  // Stage indicator text while running
  const stageLabel =
    mode === "overtime"
      ? "Overtime"
      : mode === "countdown" && totalStages > 1
        ? `Stage ${Math.min(currentStageIndex + 1, totalStages)} of ${totalStages}`
        : mode === "countdown"
          ? "Remaining"
          : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isRunning && (
        <StagesInput
          stages={stagesMinutes}
          onChange={handleStagesChange}
          disabled={isRunning}
        />
      )}

      <View style={styles.timerContainer}>
        {stageLabel && (
          <Text style={[styles.modeLabel, { color: colors.textSecondary }]}>
            {stageLabel}
          </Text>
        )}
        <TimerDisplay elapsedMs={displayMs} />
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
