import notifee, {
  AndroidForegroundServiceType,
  AndroidImportance,
} from "@notifee/react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

/** Channel used for the foreground timer notification. */
export const TIMER_CHANNEL_ID = "meditation-timer-fg";

/** Notification ID for the foreground service notification. */
export const TIMER_NOTIFICATION_ID = "meditation-timer-fg-notification";

interface TimerData {
  startTime: number;
  stages: number[] | null;
}

interface TimerState {
  subtitle: string;
  timestamp: number;
  chronometerDirection: "up" | "down";
  completedStageCount: number;
  totalStages: number;
  progress: { max: number; current: number } | { indeterminate: true };
}

function cumulativeThresholds(stages: number[]): number[] {
  const thresholds: number[] = [];
  let sum = 0;
  for (const s of stages) {
    sum += s;
    thresholds.push(sum);
  }
  return thresholds;
}

function computeTimerState(
  startTime: number,
  elapsedMs: number,
  stages: number[] | null,
): TimerState {
  if (!stages || stages.length === 0) {
    return {
      subtitle: "Meditating",
      timestamp: startTime,
      chronometerDirection: "up",
      completedStageCount: 0,
      totalStages: 0,
      progress: { indeterminate: true },
    };
  }

  const thresholds = cumulativeThresholds(stages);
  const totalMs = thresholds[thresholds.length - 1];

  if (elapsedMs >= totalMs) {
    return {
      subtitle: "Overtime",
      timestamp: startTime + totalMs,
      chronometerDirection: "up",
      completedStageCount: stages.length,
      totalStages: stages.length,
      progress: { max: 100, current: 100 },
    };
  }

  let stageIndex = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (elapsedMs < thresholds[i]) {
      stageIndex = i;
      break;
    }
  }

  const subtitle =
    stages.length > 1
      ? `Stage ${stageIndex + 1} of ${stages.length}`
      : "Countdown";

  const progressPercent = Math.min(
    100,
    Math.round((elapsedMs / totalMs) * 100),
  );

  return {
    subtitle,
    timestamp: startTime + thresholds[stageIndex],
    chronometerDirection: "down",
    completedStageCount: stageIndex,
    totalStages: stages.length,
    progress: { max: 100, current: progressPercent },
  };
}

const ALARM_AUTO_STOP_MS = 10000;
const BELL_GAP_MS = 500;
const bellSource = require("@/assets/audio/bell.mp3");

type AudioPlayer = ReturnType<typeof createAudioPlayer>;

const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
const activePlayers = new Set<AudioPlayer>();

/**
 * Play the bell sound `times` times, with a gap between consecutive plays.
 * Uses the imperative expo-audio API so it works outside React components.
 */
function playBell(times: number) {
  setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: "mixWithOthers",
  });

  let remaining = times;

  function playOnce() {
    if (remaining <= 0) return;
    remaining--;
    const player = createAudioPlayer(bellSource);
    activePlayers.add(player);
    player.play();

    const timeout = setTimeout(() => {
      activeTimeouts.delete(timeout);
      player.pause();
      player.remove();
      activePlayers.delete(player);
      if (remaining > 0) {
        const gapTimeout = setTimeout(() => {
          activeTimeouts.delete(gapTimeout);
          playOnce();
        }, BELL_GAP_MS);
        activeTimeouts.add(gapTimeout);
      }
    }, ALARM_AUTO_STOP_MS);
    activeTimeouts.add(timeout);
  }

  playOnce();
}

/** Stop all currently playing bells and cancel pending bell timeouts. */
export function stopBell() {
  for (const t of activeTimeouts) {
    clearTimeout(t);
  }
  activeTimeouts.clear();

  for (const p of activePlayers) {
    p.pause();
    p.remove();
  }
  activePlayers.clear();
}

/**
 * Register the Notifee foreground service handler and background event handler.
 * Must be called at app startup, outside of any React component.
 */
export async function registerForegroundService() {
  // Required by Notifee — must be registered even if we don't use background events
  notifee.onBackgroundEvent(async () => {
    // No-op: foreground service lifecycle is managed by stopForegroundService()
  });

  notifee.registerForegroundService((notification) => {
    return new Promise<void>(() => {
      const data = notification.data as
        | Record<string, string | undefined>
        | undefined;
      const timerData: TimerData = {
        startTime: Number(data?.startTime ?? Date.now()),
        stages: data?.stages ? JSON.parse(data.stages) : null,
      };

      let prevCompletedCount = 0;

      async function updateNotification() {
        const elapsedMs = Date.now() - timerData.startTime;
        const state = computeTimerState(
          timerData.startTime,
          elapsedMs,
          timerData.stages,
        );

        // Detect stage completions and play bell
        if (
          state.completedStageCount > prevCompletedCount &&
          state.totalStages > 0
        ) {
          for (let i = prevCompletedCount; i < state.completedStageCount; i++) {
            const isFinal = i === state.totalStages - 1;
            const delay = (i - prevCompletedCount) * BELL_GAP_MS;
            setTimeout(() => playBell(isFinal ? 2 : 1), delay);
          }
          prevCompletedCount = state.completedStageCount;
        }

        try {
          await foregroundServiceNotification({
            subtitle: state.subtitle,
            timestamp: state.timestamp,
            chronometerDirection: state.chronometerDirection,
            progress: state.progress,
          });
        } catch {
          // Notification update failed — service may be stopping
        }
      }

      // Update every second for progress bar
      setInterval(updateNotification, 1000);

      // Fire immediately so the notification shows right away
      updateNotification();

      // The promise intentionally never resolves — the service runs until
      // stopForegroundService() is called from the app (dismissTimerNotification).
    });
  });

  await notifee.createChannel({
    id: TIMER_CHANNEL_ID,
    name: "Meditation Timer",
    importance: AndroidImportance.LOW,
    sound: undefined,
  });
}

export async function foregroundServiceNotification({
  subtitle,
  timestamp,
  chronometerDirection,
  progress,
  data,
}: {
  subtitle?: string | undefined;
  timestamp?: number | undefined;
  chronometerDirection?: "up" | "down" | undefined;
  progress?:
    | { max: number; current: number }
    | { indeterminate: true }
    | undefined;
  data?:
    | {
        [key: string]: string | number | object;
      }
    | undefined;
}) {
  return notifee.displayNotification({
    id: TIMER_NOTIFICATION_ID,
    subtitle,
    data,
    android: {
      channelId: TIMER_CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      showChronometer: true,
      chronometerDirection: chronometerDirection ?? "up",
      timestamp: timestamp ?? Date.now(),
      progress,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
      ],
      pressAction: { id: "default" },
    },
  });
}
