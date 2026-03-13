import { StagesInput } from "@/components/StagesInput";
import { TimerDisplay } from "@/components/TimerDisplay";
import { Colors } from "@/constants/Colors";
import { formatElapsedMs, useTimer } from "@/hooks/useTimer";
import { useTimerNotification } from "@/hooks/useTimerNotification";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import Storage from "expo-sqlite/kv-store";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

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
    hasRecoveryData,
    recoveredElapsedMs,
    start,
    stop,
    discard,
    reset,
    acceptRecovery,
    discardRecovery,
  } = useTimer();
  const {
    requestPermissions,
    startTimerNotification,
    dismissTimerNotification,
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

  const navigatedToSaveRef = useRef(false);

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
    }, [reset]),
  );

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
        ],
      );
    }
  }, [
    hasRecoveryData,
    recoveredElapsedMs,
    acceptRecovery,
    discardRecovery,
    router,
  ]);

  const handleStart = async () => {
    const stagesMs = stagesMinutes.map((m) => m * 60 * 1000);

    const permitted = await requestPermissions();

    const startTime = Date.now();
    start(stagesMs);

    if (permitted) {
      startTimerNotification(startTime, stagesMs);
    }
  };

  const handleStop = () => {
    dismissTimerNotification();
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
            dismissTimerNotification();
            discard();
          },
        },
      ],
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
    >
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
            <MaterialIcons
              name="play-arrow"
              size={48}
              color={colors.background}
            />
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
              style={[
                styles.primaryButton,
                { backgroundColor: colors.success },
              ]}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
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
