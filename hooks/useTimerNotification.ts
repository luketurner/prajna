import { useCallback } from "react";
import * as Notifications from "expo-notifications";

const TIMER_NOTIFICATION_ID = "meditation-timer-notification";
const ALARM_NOTIFICATION_ID = "meditation-alarm";

export function useTimerNotification() {
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") {
      return true;
    }
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        allowBadge: false,
      },
    });
    return status === "granted";
  }, []);

  const updateTimerNotification = useCallback(
    async (displayTime: string, subtitle: string): Promise<void> => {
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: TIMER_NOTIFICATION_ID,
          content: {
            title: "Prajna \u2014 Meditating",
            body: displayTime,
            subtitle,
            sticky: true,
            autoDismiss: false,
            priority: Notifications.AndroidNotificationPriority.LOW,
            sound: false,
            data: { type: "meditation-timer" },
          },
          trigger: { channelId: "meditation-timer" },
        });
      } catch {
        // Silently fail — notification is supplementary
      }
    },
    []
  );

  const dismissTimerNotification = useCallback(async (): Promise<void> => {
    try {
      await Notifications.dismissNotificationAsync(TIMER_NOTIFICATION_ID);
    } catch {
      // Silently fail
    }
  }, []);

  const scheduleAlarmNotification = useCallback(
    async (seconds: number): Promise<void> => {
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: ALARM_NOTIFICATION_ID,
          content: {
            title: "Meditation Complete",
            body: "Your meditation session is complete.",
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
            repeats: false,
          },
        });
      } catch {
        // Silently fail
      }
    },
    []
  );

  const cancelAlarmNotification = useCallback(async (): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        ALARM_NOTIFICATION_ID
      );
    } catch {
      // Silently fail
    }
  }, []);

  return {
    requestPermissions,
    updateTimerNotification,
    dismissTimerNotification,
    scheduleAlarmNotification,
    cancelAlarmNotification,
  };
}
