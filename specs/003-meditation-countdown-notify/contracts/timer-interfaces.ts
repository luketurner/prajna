/**
 * Timer Interfaces for Meditation Countdown Timer with Notifications
 *
 * Feature Branch: 003-meditation-countdown-notify
 * These interfaces define the contracts for the extended timer functionality.
 */

// ─── Timer Mode ──────────────────────────────────────────────────────────────

/** The operational mode of the timer */
export type TimerMode = "open-ended" | "countdown" | "overtime";

// ─── Persisted State ─────────────────────────────────────────────────────────

/** Timer state persisted to KV-store for crash recovery */
export interface PersistedTimerState {
  /** Timestamp (Date.now()) when the current session started */
  startTime: number;
  /** Accumulated milliseconds from prior start/stop cycles */
  accumulatedMs: number;
  /** Whether the timer was running when state was persisted */
  isRunning: boolean;
  /** Target duration in milliseconds (null = open-ended mode) */
  durationMs: number | null;
  /** Timer mode at the time of persistence */
  mode: TimerMode;
}

// ─── useTimer Hook ───────────────────────────────────────────────────────────

/** Return type of the useTimer hook */
export interface UseTimerResult {
  /** Current elapsed time in milliseconds (total time since start) */
  elapsedMs: number;
  /** Value to display on timer — countdown remaining, overtime, or elapsed */
  displayMs: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Current operational mode of the timer */
  mode: TimerMode | null;
  /** Target duration in milliseconds (null if open-ended) */
  durationMs: number | null;
  /** Whether crash recovery data is available */
  hasRecoveryData: boolean;
  /** Recovered session duration in milliseconds */
  recoveredElapsedMs: number;
  /** Start a new session. If durationMs is provided, starts in countdown mode. */
  start: (durationMs?: number | null) => void;
  /** Stop the timer and finalize the session */
  stop: () => void;
  /** Discard the current session */
  discard: () => void;
  /** Accept the recovered session data */
  acceptRecovery: () => void;
  /** Discard the recovered session data */
  discardRecovery: () => void;
}

// ─── Notification Service ────────────────────────────────────────────────────

/** Notification service interface for timer notifications */
export interface TimerNotificationService {
  /** Request notification permissions. Returns true if granted. */
  requestPermissions: () => Promise<boolean>;
  /** Show or update the persistent timer notification */
  updateTimerNotification: (
    displayTime: string,
    subtitle: string
  ) => Promise<void>;
  /** Dismiss the persistent timer notification */
  dismissTimerNotification: () => Promise<void>;
  /** Schedule an alarm notification for countdown completion */
  scheduleAlarmNotification: (seconds: number) => Promise<void>;
  /** Cancel a previously scheduled alarm notification */
  cancelAlarmNotification: () => Promise<void>;
}

// ─── Alarm Service ───────────────────────────────────────────────────────────

/** Alarm service interface for audio playback */
export interface AlarmService {
  /** Play the alarm sound. Auto-stops after the configured duration. */
  playAlarm: () => void;
  /** Manually stop the alarm sound */
  stopAlarm: () => void;
  /** Whether the alarm is currently playing */
  isPlaying: boolean;
}

// ─── Duration Input ──────────────────────────────────────────────────────────

/** Props for the duration input component */
export interface DurationInputProps {
  /** Current duration value in minutes (null = open-ended) */
  value: number | null;
  /** Callback when duration changes */
  onChange: (minutes: number | null) => void;
  /** Whether the input is disabled (e.g., while timer is running) */
  disabled?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Timer constants */
export const TIMER_CONSTANTS = {
  /** Minimum duration in minutes */
  MIN_DURATION_MINUTES: 1,
  /** Maximum duration in minutes (24 hours) */
  MAX_DURATION_MINUTES: 1440,
  /** Alarm auto-stop duration in milliseconds */
  ALARM_AUTO_STOP_MS: 4000,
  /** Display update interval in milliseconds */
  DISPLAY_UPDATE_INTERVAL_MS: 1000,
  /** Maximum reasonable elapsed time for crash recovery (24 hours in ms) */
  MAX_REASONABLE_MS: 24 * 60 * 60 * 1000,
} as const;

/** Notification identifiers */
export const NOTIFICATION_IDS = {
  /** Persistent timer notification */
  TIMER: "meditation-timer-notification",
  /** Scheduled alarm notification */
  ALARM: "meditation-alarm",
} as const;

/** Android notification channel configuration */
export const NOTIFICATION_CHANNEL = {
  ID: "meditation-timer",
  NAME: "Meditation Timer",
} as const;
