import {
  cancelScheduledBells,
  foregroundServiceNotification,
  scheduleBellNotifications,
  TIMER_NOTIFICATION_ID,
} from "@/services/foreground-timer";
import notifee, {
  AlarmType,
  AndroidNotificationSetting,
} from "@notifee/react-native";
import { useCallback } from "react";
import { Alert, AppState } from "react-native";

/** Returns a promise that resolves the next time the app comes to the foreground. */
function waitForForeground(): Promise<void> {
  return new Promise((resolve) => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        subscription.remove();
        resolve();
      }
    });
  });
}

export function useTimerNotification() {
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
  }, []);

  const ensureAlarmPermission = useCallback(async (): Promise<AlarmType> => {
    const settings = await notifee.getNotificationSettings();
    if (settings.android.alarm === AndroidNotificationSetting.ENABLED) {
      return AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE;
    }

    return new Promise<AlarmType>((resolve) => {
      Alert.alert(
        "Alarms & Reminders Permission",
        'To play chimes at the right times during your session, this app needs the "Alarms & reminders" permission. Without it, chimes may be delayed by up to several minutes.',
        [
          {
            text: "Skip",
            style: "cancel",
            onPress: () => resolve(AlarmType.SET_AND_ALLOW_WHILE_IDLE),
          },
          {
            text: "Open Settings",
            onPress: async () => {
              await notifee.openAlarmPermissionSettings();
              await waitForForeground();
              const updated = await notifee.getNotificationSettings();
              if (
                updated.android.alarm === AndroidNotificationSetting.ENABLED
              ) {
                resolve(AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE);
              } else {
                resolve(AlarmType.SET_AND_ALLOW_WHILE_IDLE);
              }
            },
          },
        ],
      );
    });
  }, []);

  const startTimerNotification = useCallback(
    async (
      startTime: number,
      stages: number[] | null,
      alarmType: AlarmType = AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
    ): Promise<void> => {
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
          await scheduleBellNotifications(startTime, stages, alarmType);
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
    ensureAlarmPermission,
    startTimerNotification,
    dismissTimerNotification,
  };
}
