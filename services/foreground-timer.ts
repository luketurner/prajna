import notifee, {
  AndroidForegroundServiceType,
  AndroidImportance,
  AndroidVisibility,
} from "@notifee/react-native";

/** Channel used for the foreground timer notification (with bell sound). */
export const TIMER_CHANNEL_ID = "meditation-timer";

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
      : "Meditating";

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

let intervalId: ReturnType<typeof setInterval> | null = null;

/** Clear the foreground service update interval. */
export function clearForegroundInterval() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
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

      let previousCompletedStageCount = 0;

      async function updateNotification() {
        const elapsedMs = Date.now() - timerData.startTime;
        const state = computeTimerState(
          timerData.startTime,
          elapsedMs,
          timerData.stages,
        );

        // Detect stage transition — play bell by toggling onlyAlertOnce off
        const stageJustCompleted =
          state.completedStageCount > previousCompletedStageCount;
        previousCompletedStageCount = state.completedStageCount;

        try {
          await foregroundServiceNotification({
            subtitle: state.subtitle,
            timestamp: state.timestamp,
            chronometerDirection: state.chronometerDirection,
            progress: state.progress,
            onlyAlertOnce: !stageJustCompleted,
          });
        } catch {
          // Notification update failed — service may be stopping
        }
      }

      // Update every second for progress bar
      intervalId = setInterval(updateNotification, 1000);

      // Fire immediately so the notification shows right away
      updateNotification();

      // The promise intentionally never resolves — the service runs until
      // stopForegroundService() is called from the app (dismissTimerNotification).
    });
  });

  // Delete legacy channels for upgrading users
  await notifee.deleteChannel("meditation-timer-fg");
  await notifee.deleteChannel("meditation-chime");

  // Single channel with bell sound — onlyAlertOnce controls when it plays
  await notifee.createChannel({
    id: TIMER_CHANNEL_ID,
    name: "Meditation Timer",
    importance: AndroidImportance.DEFAULT,
    sound: "bell",
    visibility: AndroidVisibility.PUBLIC,
    vibration: false,
  });
}

export async function foregroundServiceNotification({
  subtitle,
  timestamp,
  chronometerDirection,
  progress,
  data,
  onlyAlertOnce = true,
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
  onlyAlertOnce?: boolean;
}) {
  return notifee.displayNotification({
    id: TIMER_NOTIFICATION_ID,
    subtitle,
    data,
    android: {
      channelId: TIMER_CHANNEL_ID,
      asForegroundService: true,
      visibility: AndroidVisibility.PUBLIC,
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce,
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
