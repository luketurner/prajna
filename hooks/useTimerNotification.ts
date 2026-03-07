import { useCallback } from "react";
import notifee, { AndroidImportance } from "@notifee/react-native";
import {
  TIMER_CHANNEL_ID,
  TIMER_NOTIFICATION_ID,
} from "@/services/foreground-timer";

export function useTimerNotification() {
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
  }, []);

  const startTimerNotification = useCallback(
    async (
      startTime: number,
      stages: number[] | null,
      displayTime: string,
      subtitle: string
    ): Promise<void> => {
      try {
        await notifee.createChannel({
          id: TIMER_CHANNEL_ID,
          name: "Meditation Timer",
          importance: AndroidImportance.LOW,
          sound: undefined,
        });

        await notifee.displayNotification({
          id: TIMER_NOTIFICATION_ID,
          title: "Prajna \u2014 Meditating",
          body: displayTime,
          subtitle,
          data: {
            startTime: String(startTime),
            stages: stages ? JSON.stringify(stages) : "",
          },
          android: {
            channelId: TIMER_CHANNEL_ID,
            asForegroundService: true,
            ongoing: true,
            autoCancel: false,
            pressAction: { id: "default" },
          },
        });
      } catch {
        // Foreground service failed — app will still work in foreground
      }
    },
    []
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
