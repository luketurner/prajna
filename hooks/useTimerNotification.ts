import { useCallback } from "react";
import * as Notifications from "expo-notifications";

const TIMER_NOTIFICATION_ID = "meditation-timer-notification";
const ALARM_NOTIFICATION_PREFIX = "meditation-alarm";

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
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
            interruptionLevel: "active",
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

  /**
   * Schedule alarm notifications for each stage boundary.
   * @param stageDurationsMs - array of stage durations in milliseconds
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
      // Cancel all scheduled notifications that match our alarm prefix
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
    updateTimerNotification,
    dismissTimerNotification,
    scheduleStageAlarmNotifications,
    cancelAlarmNotifications,
  };
}
