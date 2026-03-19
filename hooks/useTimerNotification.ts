import {
  cancelScheduledBells,
  foregroundServiceNotification,
  scheduleBellNotifications,
  TIMER_NOTIFICATION_ID,
} from "@/services/foreground-timer";
import notifee from "@notifee/react-native";
import { useCallback } from "react";

export function useTimerNotification() {
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
  }, []);

  const startTimerNotification = useCallback(
    async (startTime: number, stages: number[] | null): Promise<void> => {
      const timed = stages && stages.length > 0;
      const totalMs = timed ? stages.reduce((sum, s) => sum + s, 0) : 0;

      try {
        await foregroundServiceNotification({
          title: "Meditating",
          timestamp: timed ? startTime + totalMs : startTime,
          chronometerDirection: timed ? "down" : "up",
        });
      } catch {
        // Foreground service failed — app will still work in foreground
      }

      if (timed) {
        try {
          await scheduleBellNotifications(startTime, stages);
        } catch (e) {
          console.warn("Failed to schedule bell notifications:", e);
        }
      }
    },
    [],
  );

  const dismissTimerNotification = useCallback(async (): Promise<void> => {
    await cancelScheduledBells();
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
