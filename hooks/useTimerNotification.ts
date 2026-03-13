import {
  CHIME_CHANNEL_ID,
  clearForegroundInterval,
  foregroundServiceNotification,
  TIMER_NOTIFICATION_ID,
} from "@/services/foreground-timer";
import notifee, { TriggerType } from "@notifee/react-native";
import { useCallback } from "react";

const CHIME_ID_PREFIX = "chime-stage-";

function cumulativeThresholds(stages: number[]): number[] {
  const thresholds: number[] = [];
  let sum = 0;
  for (const s of stages) {
    sum += s;
    thresholds.push(sum);
  }
  return thresholds;
}

/** Cancel all previously scheduled chime notifications. */
export async function cancelChimeNotifications() {
  try {
    const triggers = await notifee.getTriggerNotificationIds();
    const chimeIds = triggers.filter((id) => id.startsWith(CHIME_ID_PREFIX));
    for (const id of chimeIds) {
      await notifee.cancelNotification(id);
    }
  } catch {
    // Silently fail
  }
}

export function useTimerNotification() {
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
  }, []);

  const startTimerNotification = useCallback(
    async (startTime: number, stages: number[] | null): Promise<void> => {
      try {
        // Start the foreground service notification
        await foregroundServiceNotification({
          subtitle: "Meditating",
          timestamp: startTime,
          chronometerDirection: "up",
          progress:
            stages && stages.length > 0
              ? { max: 100, current: 0 }
              : { indeterminate: true },
          data: {
            startTime: String(startTime),
            stages: stages ? JSON.stringify(stages) : "",
          },
        });

        // Schedule chime trigger notifications for each stage end
        if (stages && stages.length > 0) {
          const thresholds = cumulativeThresholds(stages);
          for (let i = 0; i < thresholds.length; i++) {
            const fireTime = startTime + thresholds[i];
            // Only schedule if in the future
            if (fireTime > Date.now()) {
              await notifee.createTriggerNotification(
                {
                  id: `${CHIME_ID_PREFIX}${i}`,
                  title: "Prajna",
                  body:
                    i === thresholds.length - 1
                      ? "Session complete"
                      : `Stage ${i + 1} complete`,
                  android: {
                    channelId: CHIME_CHANNEL_ID,
                    sound: "bell",
                    pressAction: { id: "default" },
                    autoCancel: true,
                  },
                },
                {
                  type: TriggerType.TIMESTAMP,
                  timestamp: fireTime,
                  alarmManager: {
                    allowWhileIdle: true,
                  },
                },
              );
            }
          }
        }
      } catch {
        // Foreground service failed — app will still work in foreground
      }
    },
    [],
  );

  const dismissTimerNotification = useCallback(async (): Promise<void> => {
    clearForegroundInterval();
    await cancelChimeNotifications();
    try {
      await notifee.stopForegroundService();
    } catch {
      // Service may not be running
    }
    try {
      await notifee.cancelNotification(TIMER_NOTIFICATION_ID);
    } catch {
      // Silently fail
    }
  }, []);

  return {
    requestPermissions,
    startTimerNotification,
    dismissTimerNotification,
  };
}
