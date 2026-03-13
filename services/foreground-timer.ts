import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";

/** Channel used for the foreground timer notification (with bell sound). */
export const TIMER_CHANNEL_ID = "meditation-timer";

/** Notification ID for the foreground service notification. */
export const TIMER_NOTIFICATION_ID = "meditation-timer-fg-notification";

/** Prefix for scheduled bell notification IDs. */
const BELL_NOTIFICATION_PREFIX = "meditation-bell-";

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
        type: AlarmType.SET_AND_ALLOW_WHILE_IDLE,
      },
    };

    await notifee.createTriggerNotification(
      {
        id,
        title: "Meditation",
        subtitle: stages.length > 1 ? `Stage ${i + 1} complete` : "Complete",
        android: {
          channelId: TIMER_CHANNEL_ID,
          autoCancel: true,
          timeoutAfter: 3000,
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
  // Required by Notifee — must be registered even if we don't use background events
  notifee.onBackgroundEvent(async () => {
    // No-op: foreground service lifecycle is managed by stopForegroundService()
  });

  notifee.registerForegroundService(() => {
    // The promise intentionally never resolves — the service runs until
    // stopForegroundService() is called from the app (dismissTimerNotification).
    return new Promise<void>(() => {});
  });

  // Delete legacy channels for upgrading users
  await notifee.deleteChannel("meditation-timer-fg");
  await notifee.deleteChannel("meditation-chime");

  // Single channel with bell sound — onlyAlertOnce controls when it plays
  await notifee.createChannel({
    id: TIMER_CHANNEL_ID,
    name: "Meditation Timer",
    importance: AndroidImportance.DEFAULT,
    sound: "bell",
    visibility: AndroidVisibility.PUBLIC,
    vibration: false,
  });
}

export async function foregroundServiceNotification({
  subtitle,
  timestamp,
  chronometerDirection,
  data,
}: {
  subtitle?: string | undefined;
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
    subtitle,
    data,
    android: {
      channelId: TIMER_CHANNEL_ID,
      asForegroundService: true,
      visibility: AndroidVisibility.PUBLIC,
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      showChronometer: true,
      chronometerDirection: chronometerDirection ?? "up",
      timestamp: timestamp ?? Date.now(),
      pressAction: { id: "default" },
    },
  });
}
