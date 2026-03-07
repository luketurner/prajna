import notifee, { EventType } from "@notifee/react-native";

/** Channel used for the foreground timer notification. */
export const TIMER_CHANNEL_ID = "meditation-timer-fg";

/** Notification ID for the foreground service notification. */
export const TIMER_NOTIFICATION_ID = "meditation-timer-fg-notification";

interface TimerData {
  startTime: number;
  stages: number[] | null;
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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

function computeDisplay(
  elapsedMs: number,
  stages: number[] | null
): { displayTime: string; subtitle: string } {
  if (!stages || stages.length === 0) {
    return { displayTime: formatMs(elapsedMs), subtitle: "Meditating" };
  }

  const thresholds = cumulativeThresholds(stages);
  const totalMs = thresholds[thresholds.length - 1];

  if (elapsedMs >= totalMs) {
    const overtime = elapsedMs - totalMs;
    return { displayTime: formatMs(overtime), subtitle: "Overtime" };
  }

  let stageIndex = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (elapsedMs < thresholds[i]) {
      stageIndex = i;
      break;
    }
  }

  const stageEnd = thresholds[stageIndex];
  const remaining = Math.max(0, stageEnd - elapsedMs);
  const subtitle =
    stages.length > 1
      ? `Stage ${stageIndex + 1} of ${stages.length}`
      : "Countdown";

  return { displayTime: formatMs(remaining), subtitle };
}

/**
 * Register the Notifee foreground service handler and background event handler.
 * Must be called at app startup, outside of any React component.
 */
export function registerForegroundService() {
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

      // Update notification every second
      setInterval(async () => {
        const elapsedMs = Date.now() - timerData.startTime;
        const { displayTime, subtitle } = computeDisplay(
          elapsedMs,
          timerData.stages
        );

        try {
          await notifee.displayNotification({
            id: TIMER_NOTIFICATION_ID,
            title: "Prajna \u2014 Meditating",
            body: displayTime,
            subtitle,
            android: {
              channelId: TIMER_CHANNEL_ID,
              asForegroundService: true,
              ongoing: true,
              autoCancel: false,

              pressAction: { id: "default" },
            },
          });
        } catch {
          // Notification update failed — service may be stopping
        }
      }, 1000);

      // The promise intentionally never resolves — the service runs until
      // stopForegroundService() is called from the app (dismissTimerNotification).
    });
  });
}
