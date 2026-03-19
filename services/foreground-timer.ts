import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import Storage from "expo-sqlite/kv-store";

/** Channel used for the foreground timer notification. */
export const TIMER_CHANNEL_ID = "meditation-timer";

/** Channel used for the chime notifications after each stage/session */
export const CHIME_CHANNEL_ID = "meditation-chime";

/** Notification ID for the foreground service notification. */
export const TIMER_NOTIFICATION_ID = "meditation-timer-fg-notification";

/** Prefix for scheduled bell notification IDs. */
const BELL_NOTIFICATION_PREFIX = "meditation-chime-";

/** KV store key set when the timer is stopped from the notification action button. */
export const STOPPED_EXTERNALLY_KEY = "timer_stopped_externally";

/** IDs of currently scheduled bell trigger notifications. */
let scheduledBellIds: string[] = [];

function cumulativeThresholds(stages: number[]): number[] {
  const thresholds: number[] = [];
  let sum = 0;
  for (const s of stages) {
    sum += s;
    thresholds.push(sum);
  }
  return thresholds;
}

/**
 * Schedule bell notifications at each stage boundary.
 * Uses trigger notifications so they fire even if the app process dies.
 */
export async function scheduleBellNotifications(
  startTime: number,
  stages: number[] | null,
  alarmType: AlarmType = AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
) {
  if (!stages || stages.length === 0) return;

  const thresholds = cumulativeThresholds(stages);

  for (let i = 0; i < thresholds.length; i++) {
    const fireTime = startTime + thresholds[i];
    // Don't schedule bells in the past
    if (fireTime <= Date.now()) continue;

    const id = `${BELL_NOTIFICATION_PREFIX}${i}`;
    scheduledBellIds.push(id);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: fireTime,
      alarmManager: {
        type: alarmType,
      },
    };

    await notifee.createTriggerNotification(
      {
        id,
        title: "Meditation",
        subtitle: stages.length > 1 ? `Stage ${i + 1} complete` : "Complete",
        android: {
          channelId: CHIME_CHANNEL_ID,
          autoCancel: true,
          timeoutAfter: 10000,
          importance: AndroidImportance.DEFAULT,
          visibility: AndroidVisibility.PUBLIC,
          pressAction: { id: "default" },
        },
      },
      trigger,
    );
  }
}

/** Cancel all scheduled bell trigger notifications. */
export async function cancelScheduledBells() {
  if (scheduledBellIds.length > 0) {
    await notifee.cancelTriggerNotifications(scheduledBellIds);
    scheduledBellIds = [];
  }
}

/**
 * Register the Notifee foreground service handler and background event handler.
 * Must be called at app startup, outside of any React component.
 */
export async function registerForegroundService() {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === "stop"
    ) {
      // Write elapsed time so the app can reconcile when it returns to foreground
      const data = detail.notification?.data;
      const startTime = data?.startTime ? Number(data.startTime) : null;
      const elapsed = startTime ? (Date.now() - startTime).toString() : "0";
      Storage.setItemSync(STOPPED_EXTERNALLY_KEY, elapsed);

      await cancelScheduledBells();
      await notifee.stopForegroundService();
      await notifee.cancelNotification(TIMER_NOTIFICATION_ID);
    }
  });

  notifee.registerForegroundService(() => {
    // The promise intentionally never resolves — the service runs until
    // stopForegroundService() is called from the app (dismissTimerNotification).
    return new Promise<void>(() => {});
  });

  await notifee.createChannel({
    id: CHIME_CHANNEL_ID,
    name: "Meditation Chime",
    importance: AndroidImportance.DEFAULT,
    sound: "bell",
    visibility: AndroidVisibility.PUBLIC,
    vibration: false,
  });

  await notifee.createChannel({
    id: TIMER_CHANNEL_ID,
    name: "Meditation Timer",
    importance: AndroidImportance.DEFAULT,
    visibility: AndroidVisibility.PUBLIC,
    vibration: false,
  });
}

export async function foregroundServiceNotification({
  title,
  timestamp,
  chronometerDirection,
  data,
}: {
  title?: string | undefined;
  timestamp?: number | undefined;
  chronometerDirection?: "up" | "down" | undefined;
  data?:
    | {
        [key: string]: string | number | object;
      }
    | undefined;
}) {
  return notifee.displayNotification({
    id: TIMER_NOTIFICATION_ID,
    title,
    data,
    android: {
      channelId: TIMER_CHANNEL_ID,
      asForegroundService: true,
      visibility: AndroidVisibility.PUBLIC,
      ongoing: true,
      autoCancel: false,
      showChronometer: true,
      chronometerDirection: chronometerDirection ?? "up",
      timestamp: timestamp ?? Date.now(),
      pressAction: { id: "default" },
      actions: [{ title: "Stop", pressAction: { id: "stop" } }],
    },
  });
}
