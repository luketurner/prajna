import {
  foregroundServiceNotification,
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
      try {
        await foregroundServiceNotification({
          subtitle: "Meditating",
          timestamp: startTime,
          chronometerDirection: "up",
          data: {
            startTime: String(startTime),
            stages: stages ? JSON.stringify(stages) : "",
          },
        });
      } catch {
        // Foreground service failed — app will still work in foreground
      }
    },
    [],
  );

  const dismissTimerNotification = useCallback(async (): Promise<void> => {
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
