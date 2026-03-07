import { useCallback } from "react";
import * as Notifications from "expo-notifications";
import notifee, { AndroidImportance } from "@notifee/react-native";
import {
  TIMER_CHANNEL_ID,
  TIMER_NOTIFICATION_ID,
} from "@/services/foreground-timer";

const ALARM_NOTIFICATION_PREFIX = "meditation-alarm";

export function useTimerNotification() {
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return false;
    }
    return true;
  }, []);

  /**
   * Start the foreground service with a persistent timer notification.
   * The service self-updates every second via the registered handler.
   */
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

  /**
   * Schedule alarm notifications for each stage boundary.
   * Uses expo-notifications (OS-scheduled, works in background).
   */
  const scheduleStageAlarmNotifications = useCallback(
    async (stageDurationsMs: number[]): Promise<void> => {
      let cumulativeMs = 0;
      for (let i = 0; i < stageDurationsMs.length; i++) {
        cumulativeMs += stageDurationsMs[i];
        const seconds = Math.round(cumulativeMs / 1000);
        const isFinal = i === stageDurationsMs.length - 1;
        const stageLabel = isFinal
          ? "Meditation Complete"
          : `Stage ${i + 1} Complete`;
        const body = isFinal
          ? "Your meditation session is complete."
          : `Stage ${i + 2} of ${stageDurationsMs.length} starting.`;

        try {
          await Notifications.scheduleNotificationAsync({
            identifier: `${ALARM_NOTIFICATION_PREFIX}-${i}`,
            content: {
              title: stageLabel,
              body,
              sound: "bell.mp3",
              priority: Notifications.AndroidNotificationPriority.HIGH,
              interruptionLevel: "timeSensitive",
              data: { type: "meditation-alarm", stageIndex: i, isFinal },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds,
              repeats: false,
              channelId: "meditation-alarm",
            },
          });
        } catch {
          // Silently fail
        }
      }
    },
    []
  );

  const cancelAlarmNotifications = useCallback(async (): Promise<void> => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        if (n.identifier.startsWith(ALARM_NOTIFICATION_PREFIX)) {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  return {
    requestPermissions,
    startTimerNotification,
    dismissTimerNotification,
    scheduleStageAlarmNotifications,
    cancelAlarmNotifications,
  };
}
