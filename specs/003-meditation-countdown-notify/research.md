# Research: Meditation Countdown Timer with Notifications

**Feature Branch**: `003-meditation-countdown-notify`
**Date**: 2026-02-16

## R-001: Audio Playback for Alarm Sound

**Decision**: Use `expo-audio` (the modern Expo SDK 54 audio API) with `useAudioPlayer` hook for component-context playback.

**Rationale**: `expo-audio` is the current recommended API for Expo SDK 54, replacing the deprecated `expo-av` Audio API. It provides both a hook-based API (`useAudioPlayer`) for component contexts and an imperative API (`createAudioPlayer`) for non-component contexts. Since the alarm fires from the timer screen (a component), the hook API is the natural fit.

**Alternatives Considered**:
- `expo-av` (Audio): Deprecated in favor of `expo-audio`. Still works but not recommended for new code.
- `react-native-sound`: Third-party library, not managed by Expo. Would require ejecting or a config plugin. Unnecessary complexity.
- System notification sound only: Would not allow a custom meditation-appropriate tone or fine-grained control over duration/auto-stop.

**Key Implementation Details**:
- `playsInSilentMode: false` — respects device silent switch on iOS; Android respects system volume automatically.
- Alarm auto-stops via `setTimeout` after ~4 seconds (FR-007).
- Alarm sound bundled as local asset (e.g., `assets/audio/bell.mp3`).
- `interruptionMode: 'mixWithOthers'` — does not pause other audio (e.g., background music).
- After playback completes, player stays paused at end. Must call `seekTo(0)` before replaying.

## R-002: Persistent Timer Notification

**Decision**: Use `expo-notifications` with a sticky notification, updated every second via `scheduleNotificationAsync` with the same identifier.

**Rationale**: `expo-notifications` is the standard Expo managed workflow solution for system notifications. Using a fixed `identifier` allows replacing the notification content in-place without stacking. The `sticky: true` flag on Android prevents user dismissal.

**Alternatives Considered**:
- `@notifee/react-native`: More powerful notification API (foreground services, custom layouts), but adds third-party dependency and complexity. Not needed for this use case.
- `react-native-background-actions`: Foreground service approach for continuous background execution. Over-engineered for a meditation timer where frozen notification content while backgrounded is acceptable.

**Key Implementation Details**:
- Android notification channel: `'meditation-timer'` with `AndroidImportance.LOW` (silent updates, no heads-up alert on each tick).
- Notification foreground handler: `shouldShowAlert: false` to prevent in-app pop-ups.
- Same-identifier re-scheduling replaces notification content without stacking.
- Dismiss via `dismissNotificationAsync(identifier)` when session ends.
- Permissions requested at first timer start, not on app install (FR-016).

## R-003: Background Timer Behavior

**Decision**: Accept frozen notification content when backgrounded. Schedule a timed alarm notification at countdown start to ensure alarm delivery even when backgrounded.

**Rationale**: In Expo managed workflow, JS `setInterval` stops firing when the app is backgrounded on both iOS and Android. The existing timer architecture already handles this correctly — elapsed time is calculated from wall-clock time (`Date.now() - startTime`), not accumulated ticks. The notification will freeze at the last-shown value but update immediately when the app returns to foreground.

For the alarm, scheduling a timed notification via `scheduleNotificationAsync` with `trigger: { type: TIME_INTERVAL, seconds: countdownSeconds }` ensures the OS delivers it at the correct time regardless of app state. The in-app audio alarm plays only if the app is foregrounded; the scheduled notification serves as the background fallback.

**Alternatives Considered**:
- `expo-background-fetch` / `expo-background-task`: Designed for periodic data sync (15+ minute intervals), not per-second UI updates. Not suitable.
- Android foreground service via third-party library: Would allow continuous background execution but adds significant complexity. Not justified for a meditation app.

**Key Implementation Details**:
- On countdown start: schedule alarm notification for `countdownSeconds` in the future.
- On early stop/discard: cancel the scheduled alarm notification.
- On app return to foreground: immediately update notification with correct elapsed time (existing AppState listener handles this).
- Crash recovery: persisted timer state already includes `startTime` and `accumulatedMs`; extend with `durationMs` and `mode` for countdown recovery.

## R-004: Duration Input UX

**Decision**: Use a simple numeric text input for minutes, displayed above the timer when the timer is stopped.

**Rationale**: Most meditation durations are specified as a round number of minutes (5, 10, 15, 20, 24, 30, 45, 60, 90). A numeric input is the fastest way to enter these values. A scrolling picker would be slower for precise values. The input appears only when the timer is stopped, keeping the running timer UI clean.

**Alternatives Considered**:
- Scrolling wheel picker (like iOS date picker): Slower for precise values. Harder to enter custom durations like 24 or 37 minutes. More complex to implement cross-platform.
- Preset buttons (5, 10, 15, 20, 30 min): Quick but inflexible. Does not support custom durations. Could complement the input as a future enhancement.
- Hours + minutes dual input: Over-engineered for meditation durations. Most sessions are under 60 minutes; even long ones are easily expressed as minutes (e.g., 90).

**Key Implementation Details**:
- Input accepts whole numbers only (1-1440 range, i.e., 1 minute to 24 hours).
- Empty/cleared input = open-ended mode (no countdown).
- Input disabled while timer is running.
- Duration persisted in crash recovery state so countdown can be restored.

## R-005: Timer Mode State Machine

**Decision**: Extend `useTimer` hook with a `mode` concept: `'open-ended' | 'countdown' | 'overtime'`.

**Rationale**: The timer has three distinct behavioral modes that affect display, alarm logic, and notification content. Modeling this as an explicit state makes the logic clear and testable.

**State Transitions**:
```
[idle] --start(no duration)--> [open-ended] --stop/discard--> [idle]
[idle] --start(duration)--> [countdown] --reaches 0--> [overtime] --stop/discard--> [idle]
[idle] --start(duration)--> [countdown] --stop/discard--> [idle]  (early stop)
```

**Display Logic by Mode**:
- `open-ended`: Show elapsed time counting up (existing behavior).
- `countdown`: Show remaining time counting down (`durationMs - elapsed`).
- `overtime`: Show overtime counting up (`elapsed - durationMs`).

## R-006: Packages to Install

**Decision**: Install `expo-notifications` and `expo-audio` via `npx expo install`.

```bash
npx expo install expo-notifications expo-audio
```

**app.json Plugin Configuration**: Add both to the `plugins` array. `expo-notifications` may need an icon config for Android.

**Note**: Both packages require a development build (not Expo Go) for full functionality. The project already uses `expo-dev-client`, so this is already the case.
